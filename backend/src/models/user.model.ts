import { dbConfig } from '../config/database';
import { UserRole } from '../config/permissions';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  emailVerified: boolean;
  authProvider: 'local' | 'google';
  googleId?: string | null;
  avatarUrl?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  emailVerificationToken?: string | null;
  refreshTokens: string[];
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  loginHistory: Array<{
    timestamp: Date;
    ip: string;
    userAgent: string;
    status: 'success' | 'failed' | 'locked';
    details?: string;
  }>;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToUser(row: any): User {
  return {
    id: row.id,
    username: row.username || '',
    email: row.email,
    passwordHash: row.password_hash || undefined,
    name: row.name,
    role: row.role as UserRole,
    organizationId: row.organization_id || null,
    emailVerified: Boolean(row.email_verified),
    authProvider: (row.auth_provider as 'local' | 'google') || 'local',
    googleId: row.google_id || null,
    avatarUrl: row.avatar_url || null,
    passwordResetToken: row.password_reset_token || null,
    passwordResetExpires: row.password_reset_expires ? new Date(row.password_reset_expires) : null,
    emailVerificationToken: row.email_verification_token || null,
    refreshTokens: (() => {
      if (Array.isArray(row.refresh_tokens)) return row.refresh_tokens;
      try { return JSON.parse(row.refresh_tokens || '[]'); } catch { return []; }
    })(),
    failedLoginAttempts: Number(row.failed_login_attempts) || 0,
    lockoutUntil: row.lockout_until ? new Date(row.lockout_until) : null,
    mfaEnabled: Boolean(row.mfa_enabled),
    mfaSecret: row.mfa_secret || null,
    loginHistory: (() => {
      if (Array.isArray(row.login_history)) return row.login_history;
      try { return JSON.parse(row.login_history || '[]'); } catch { return []; }
    })(),
    lastActiveAt: row.last_active_at ? new Date(row.last_active_at) : new Date(),
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
}

// ─── MySQL-backed User Repository ────────────────────────────────────────────

class MySQLUserRepository {
  // fallback in-memory map when DB is unavailable
  private memoryStore: Map<string, User> = new Map();
  private useMemory = false;

  private async canUseDB(): Promise<boolean> {
    if (!dbConfig.isConnected) {
      await dbConfig.testConnection();
    }
    return dbConfig.isConnected;
  }

  // ── Finders ──────────────────────────────────────────────────────────────

  async findById(id: string): Promise<User | null> {
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        return arr.length ? rowToUser(arr[0]) : null;
      } catch (e: any) {
        console.error('[UserRepo findById]', e.message);
      }
    }
    return this.memoryStore.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase().trim();
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [normalized]);
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        return arr.length ? rowToUser(arr[0]) : null;
      } catch (e: any) {
        console.error('[UserRepo findByEmail]', e.message);
      }
    }
    for (const u of this.memoryStore.values()) {
      if (u.email.toLowerCase() === normalized) return { ...u };
    }
    return null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const normalized = username.toLowerCase().trim();
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query('SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1', [normalized]);
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        return arr.length ? rowToUser(arr[0]) : null;
      } catch (e: any) {
        console.error('[UserRepo findByUsername]', e.message);
      }
    }
    for (const u of this.memoryStore.values()) {
      if (u.username.toLowerCase() === normalized) return { ...u };
    }
    return null;
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const byEmail = await this.findByEmail(identifier);
    if (byEmail) return byEmail;
    return this.findByUsername(identifier);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query('SELECT * FROM users WHERE google_id = ? LIMIT 1', [googleId]);
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        return arr.length ? rowToUser(arr[0]) : null;
      } catch (e: any) {
        console.error('[UserRepo findByGoogleId]', e.message);
      }
    }
    for (const u of this.memoryStore.values()) {
      if (u.googleId === googleId) return { ...u };
    }
    return null;
  }

  async findByResetToken(token: string): Promise<User | null> {
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query(
          'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW() LIMIT 1',
          [token]
        );
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        return arr.length ? rowToUser(arr[0]) : null;
      } catch (e: any) {
        console.error('[UserRepo findByResetToken]', e.message);
      }
    }
    for (const u of this.memoryStore.values()) {
      if (u.passwordResetToken === token && u.passwordResetExpires && u.passwordResetExpires > new Date()) {
        return { ...u };
      }
    }
    return null;
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query(
          'SELECT * FROM users WHERE email_verification_token = ? LIMIT 1',
          [token]
        );
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        return arr.length ? rowToUser(arr[0]) : null;
      } catch (e: any) {
        console.error('[UserRepo findByVerificationToken]', e.message);
      }
    }
    for (const u of this.memoryStore.values()) {
      if (u.emailVerificationToken === token) return { ...u };
    }
    return null;
  }

  async isUsernameTaken(username: string, excludeId?: string): Promise<boolean> {
    const normalized = username.toLowerCase().trim();
    if (await this.canUseDB()) {
      try {
        const sql = excludeId
          ? 'SELECT id FROM users WHERE LOWER(username) = ? AND id != ? LIMIT 1'
          : 'SELECT id FROM users WHERE LOWER(username) = ? LIMIT 1';
        const params = excludeId ? [normalized, excludeId] : [normalized];
        const rows: any = await dbConfig.query(sql, params);
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        return arr.length > 0;
      } catch {
        // fall through
      }
    }
    for (const u of this.memoryStore.values()) {
      if (u.username.toLowerCase() === normalized && u.id !== excludeId) return true;
    }
    return false;
  }

  // ── Save (INSERT or UPDATE) ──────────────────────────────────────────────

  async save(user: User): Promise<User> {
    user.updatedAt = new Date();

    if (await this.canUseDB()) {
      try {
        await dbConfig.query(
          `INSERT INTO users (
            id, username, name, email, password_hash, role, organization_id,
            auth_provider, google_id, avatar_url, email_verified,
            email_verification_token, password_reset_token, password_reset_expires,
            refresh_tokens, failed_login_attempts, lockout_until,
            mfa_enabled, mfa_secret, login_history, last_active_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            name = VALUES(name),
            email = VALUES(email),
            password_hash = VALUES(password_hash),
            role = VALUES(role),
            organization_id = VALUES(organization_id),
            auth_provider = VALUES(auth_provider),
            google_id = VALUES(google_id),
            avatar_url = VALUES(avatar_url),
            email_verified = VALUES(email_verified),
            email_verification_token = VALUES(email_verification_token),
            password_reset_token = VALUES(password_reset_token),
            password_reset_expires = VALUES(password_reset_expires),
            refresh_tokens = VALUES(refresh_tokens),
            failed_login_attempts = VALUES(failed_login_attempts),
            lockout_until = VALUES(lockout_until),
            mfa_enabled = VALUES(mfa_enabled),
            mfa_secret = VALUES(mfa_secret),
            login_history = VALUES(login_history),
            last_active_at = VALUES(last_active_at)`,
          [
            user.id,
            user.username,
            user.name,
            user.email,
            user.passwordHash || null,
            user.role,
            user.organizationId || null,
            user.authProvider,
            user.googleId || null,
            user.avatarUrl || null,
            user.emailVerified ? 1 : 0,
            user.emailVerificationToken || null,
            user.passwordResetToken || null,
            user.passwordResetExpires || null,
            JSON.stringify(user.refreshTokens || []),
            user.failedLoginAttempts || 0,
            user.lockoutUntil || null,
            user.mfaEnabled ? 1 : 0,
            user.mfaSecret || null,
            JSON.stringify(user.loginHistory || []),
            user.lastActiveAt,
          ]
        );
        // Also update memory store
        this.memoryStore.set(user.id, { ...user });
        return { ...user };
      } catch (e: any) {
        console.error('[UserRepo save MySQL error]', e.message);
        // fall through to memory store
      }
    }

    // memory fallback
    this.memoryStore.set(user.id, { ...user });
    return { ...user };
  }

  async delete(id: string): Promise<boolean> {
    if (await this.canUseDB()) {
      try {
        await dbConfig.query('DELETE FROM users WHERE id = ?', [id]);
      } catch (e: any) {
        console.error('[UserRepo delete]', e.message);
      }
    }
    return this.memoryStore.delete(id);
  }

  async listAll(): Promise<User[]> {
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query('SELECT * FROM users ORDER BY created_at DESC');
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        return arr.map(rowToUser);
      } catch (e: any) {
        console.error('[UserRepo listAll]', e.message);
      }
    }
    return Array.from(this.memoryStore.values()).map(u => ({ ...u }));
  }
}

export const userStore = new MySQLUserRepository();
