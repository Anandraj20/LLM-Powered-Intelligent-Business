import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { userStore, User } from '../models/user.model';
import { UserRole } from '../config/permissions';
import { validatePasswordStrength } from '../utils/password-validator';
import { verifyTOTP } from '../utils/totp';

const JWT_SECRET = process.env.JWT_SECRET || 'businessmind_super_secret_jwt_key_2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'businessmind_super_secret_refresh_key_2026';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

// ── Username Generation ───────────────────────────────────────────────────────

/**
 * Generate a unique username from a display name or email.
 * Pattern: first_part + optional 3-digit suffix if taken
 */
async function generateUniqueUsername(name: string, email: string): Promise<string> {
  // Derive base from name (first word + first char of second word) or email prefix
  const nameParts = name.trim().toLowerCase().split(/\s+/);
  let base: string;
  if (nameParts.length >= 2) {
    base = `${nameParts[0]}_${nameParts[1].charAt(0)}`;
  } else {
    base = nameParts[0] || email.split('@')[0];
  }

  // Sanitise: keep only alphanumeric and underscores, max 20 chars
  base = base.replace(/[^a-z0-9_]/g, '').slice(0, 20);
  if (!base) base = 'user';

  // Check uniqueness; append suffix if taken
  let candidate = base;
  let taken = await userStore.isUsernameTaken(candidate);
  let attempts = 0;
  while (taken && attempts < 10) {
    attempts++;
    const suffix = Math.floor(100 + Math.random() * 900); // 3-digit
    candidate = `${base}_${suffix}`;
    taken = await userStore.isUsernameTaken(candidate);
  }
  return candidate;
}

export class AuthService {
  private generateTokens(user: User): AuthTokens {
    const payload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    };

    const accessToken = jwt.sign(
      { ...payload, tokenType: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { ...payload, tokenType: 'refresh' },
      REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes
    };
  }

  async register(data: {
    email: string;
    password?: string;
    name: string;
    username?: string;
    role?: UserRole;
    organizationId?: string;
    authProvider?: 'local' | 'google';
    googleId?: string;
    avatarUrl?: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const existing = await userStore.findByEmail(data.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    let passwordHash: string | undefined = undefined;
    if (data.authProvider !== 'google') {
      if (!data.password) {
        throw new Error('Password is required');
      }
      const validation = validatePasswordStrength(data.password);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(data.password, salt);
    }

    // Resolve username — use provided one or auto-generate
    let username = data.username?.toLowerCase().trim() || '';
    if (!username) {
      username = await generateUniqueUsername(data.name, data.email);
    } else {
      // Validate provided username format
      if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        throw new Error('Username must be 3-30 chars: letters, numbers, underscores only');
      }
      const taken = await userStore.isUsernameTaken(username);
      if (taken) {
        throw new Error('Username is already taken. Please choose another.');
      }
    }

    const newUser: User = {
      id: uuidv4(),
      username,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      name: data.name,
      role: data.role || 'Owner',
      organizationId: data.organizationId || null,
      emailVerified: data.authProvider === 'google',
      authProvider: data.authProvider || 'local',
      googleId: data.googleId || null,
      avatarUrl: data.avatarUrl || null,
      emailVerificationToken: data.authProvider === 'google' ? null : uuidv4(),
      refreshTokens: [],
      failedLoginAttempts: 0,
      lockoutUntil: null,
      mfaEnabled: false,
      mfaSecret: null,
      loginHistory: [],
      lastActiveAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tokens = this.generateTokens(newUser);
    newUser.refreshTokens.push(tokens.refreshToken);

    await userStore.save(newUser);

    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser, tokens };
  }

  /**
   * Login accepts email OR username as identifier
   */
  async login(
    identifier: string,
    password?: string,
    clientIp = 'unknown',
    userAgent = 'unknown'
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens?: AuthTokens; mfaRequired?: boolean; mfaTicket?: string }> {
    // Try both email and username lookup
    const user = await userStore.findByEmailOrUsername(identifier);
    if (!user) {
      throw new Error('Invalid credentials. Check your email/username and password.');
    }

    // Check lockout status
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      user.loginHistory = user.loginHistory || [];
      user.loginHistory.push({
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
        status: 'locked',
        details: 'Attempted login while account is locked'
      });
      await userStore.save(user);
      throw new Error(`Account is temporarily locked. Try again in ${remainingMinutes} minute(s).`);
    }

    if (user.authProvider === 'google' && !user.passwordHash) {
      throw new Error('This account uses Google Sign-In. Please click "Sign in with Google".');
    }

    if (!user.passwordHash || !password) {
      await this.handleFailedLoginAttempt(user, clientIp, userAgent, 'Missing password or hash');
      throw new Error('Invalid credentials. Check your email/username and password.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await this.handleFailedLoginAttempt(user, clientIp, userAgent, 'Incorrect password');
      throw new Error('Invalid credentials. Check your email/username and password.');
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.lastActiveAt = new Date();
    user.loginHistory = user.loginHistory || [];

    if (user.mfaEnabled) {
      user.loginHistory.push({
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
        status: 'success',
        details: 'Credentials correct, MFA challenge required'
      });
      await userStore.save(user);

      const mfaTicket = jwt.sign(
        { userId: user.id, tokenType: 'mfa_ticket' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      const { passwordHash: _, ...safeUser } = user;
      return { user: safeUser, mfaRequired: true, mfaTicket };
    }

    const tokens = this.generateTokens(user);
    const updatedRefreshTokens = [...(user.refreshTokens || []).slice(-4), tokens.refreshToken];
    user.refreshTokens = updatedRefreshTokens;

    user.loginHistory.push({
      timestamp: new Date(),
      ip: clientIp,
      userAgent,
      status: 'success',
      details: 'Login completed successfully'
    });

    await userStore.save(user);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  /**
   * Google OAuth sign-in and automated registration
   */
  async loginWithGoogle(
    googleId: string,
    email: string,
    name?: string,
    avatarUrl?: string,
    role?: UserRole,
    clientIp = 'unknown',
    userAgent = 'unknown'
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const normalizedEmail = email.toLowerCase().trim();
    let user = (googleId ? await userStore.findByGoogleId(googleId) : null) || (await userStore.findByEmail(normalizedEmail));

    if (!user) {
      const baseName = (name || normalizedEmail.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
      let candidateUsername = baseName;
      let suffix = 1;
      while (await userStore.findByUsername(candidateUsername)) {
        candidateUsername = `${baseName.slice(0, 16)}_${suffix}`;
        suffix++;
      }

      user = {
        id: uuidv4(),
        username: candidateUsername,
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        role: role || 'Owner',
        organizationId: null,
        emailVerified: true,
        authProvider: 'google',
        googleId: googleId || null,
        avatarUrl: avatarUrl || null,
        refreshTokens: [],
        failedLoginAttempts: 0,
        lockoutUntil: null,
        mfaEnabled: false,
        mfaSecret: null,
        loginHistory: [{
          timestamp: new Date(),
          ip: clientIp,
          userAgent,
          status: 'success',
          details: 'Google OAuth registration'
        }],
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await userStore.save(user);
    } else {
      if (googleId && !user.googleId) user.googleId = googleId;
      if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
      if (role && role !== user.role) user.role = role;
      user.lastActiveAt = new Date();
      user.loginHistory = user.loginHistory || [];
      user.loginHistory.push({
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
        status: 'success',
        details: 'Google OAuth sign-in'
      });
      await userStore.save(user);
    }

    const tokens = this.generateTokens(user);
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(tokens.refreshToken);
    await userStore.save(user);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  private async handleFailedLoginAttempt(
    user: User,
    ip: string,
    userAgent: string,
    reason: string
  ): Promise<void> {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    user.loginHistory = user.loginHistory || [];

    let status: 'failed' | 'locked' = 'failed';
    let details = `Failed login attempt: ${reason}. Attempts: ${user.failedLoginAttempts}/5`;

    if (user.failedLoginAttempts >= 5) {
      user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      status = 'locked';
      details = `Account locked for 15 minutes due to 5 consecutive failures. Last reason: ${reason}`;
    }

    user.loginHistory.push({ timestamp: new Date(), ip, userAgent, status, details });
    await userStore.save(user);
  }

  async verifyMfaLogin(
    ticket: string,
    code: string,
    clientIp = 'unknown',
    userAgent = 'unknown'
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    try {
      const decoded = jwt.verify(ticket, JWT_SECRET) as any;
      if (decoded.tokenType !== 'mfa_ticket') {
        throw new Error('Invalid MFA verification ticket');
      }

      const user = await userStore.findById(decoded.userId);
      if (!user) throw new Error('User associated with ticket no longer exists');
      if (!user.mfaEnabled || !user.mfaSecret) throw new Error('MFA is not enabled for this user');

      const isValid = verifyTOTP(code, user.mfaSecret);
      if (!isValid) {
        await this.handleFailedLoginAttempt(user, clientIp, userAgent, 'Failed MFA OTP check');
        throw new Error('Invalid verification code');
      }

      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
      user.lastActiveAt = new Date();

      const tokens = this.generateTokens(user);
      user.refreshTokens = [...(user.refreshTokens || []).slice(-4), tokens.refreshToken];

      user.loginHistory.push({
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
        status: 'success',
        details: 'MFA login challenge passed successfully'
      });

      await userStore.save(user);

      const { passwordHash: _, ...safeUser } = user;
      return { user: safeUser, tokens };
    } catch (err: any) {
      throw new Error(err.message || 'MFA validation failed');
    }
  }

  async googleAuth(data: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    let user = await userStore.findByGoogleId(data.googleId);

    if (!user) {
      user = await userStore.findByEmail(data.email);

      if (user) {
        // Link existing email account with Google
        user.googleId = data.googleId;
        user.avatarUrl = data.avatarUrl || user.avatarUrl;
        user.emailVerified = true;
        await userStore.save(user);
      } else {
        // Register new Google user
        const newRecord = await this.register({
          email: data.email,
          name: data.name,
          authProvider: 'google',
          googleId: data.googleId,
          avatarUrl: data.avatarUrl,
          role: 'Owner'
        });
        return newRecord;
      }
    }

    const tokens = this.generateTokens(user);
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), tokens.refreshToken];
    user.lastActiveAt = new Date();
    await userStore.save(user);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
      const user = await userStore.findById(decoded.id || decoded.userId);

      if (!user || !user.refreshTokens.includes(refreshToken)) {
        throw new Error('Invalid refresh token or session revoked');
      }

      const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
      if (user.lastActiveAt && (Date.now() - new Date(user.lastActiveAt).getTime() > INACTIVITY_LIMIT_MS)) {
        user.refreshTokens = [];
        await userStore.save(user);
        throw new Error('Session expired due to inactivity');
      }

      const newTokens = this.generateTokens(user);
      user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
      user.refreshTokens.push(newTokens.refreshToken);
      user.lastActiveAt = new Date();
      await userStore.save(user);

      return newTokens;
    } catch (error: any) {
      throw new Error(error.message || 'Refresh token expired or invalid');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<boolean> {
    const user = await userStore.findById(userId);
    if (!user) return false;

    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    } else {
      user.refreshTokens = [];
    }

    await userStore.save(user);
    return true;
  }

  async logoutAll(userId: string): Promise<boolean> {
    const user = await userStore.findById(userId);
    if (!user) return false;

    user.refreshTokens = [];
    await userStore.save(user);
    return true;
  }

  async requestPasswordReset(email: string): Promise<string | null> {
    const user = await userStore.findByEmail(email);
    if (!user) return null;

    const resetToken = uuidv4();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await userStore.save(user);
    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await userStore.findByResetToken(token);
    if (!user) {
      throw new Error('Password reset token is invalid or has expired');
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshTokens = [];
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;

    await userStore.save(user);
    return true;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = await userStore.findByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await userStore.save(user);
    return true;
  }
}

export const authService = new AuthService();
