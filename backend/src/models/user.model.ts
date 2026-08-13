import { UserRole } from '../config/permissions';

export interface User {
  id: string;
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

// In-Memory User Repository store for ultra-fast, zero-dependency execution and testing
class UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalizedEmail) {
        return { ...user };
      }
    }
    return null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.googleId === googleId) {
        return { ...user };
      }
    }
    return null;
  }

  async findByResetToken(token: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (
        user.passwordResetToken === token &&
        user.passwordResetExpires &&
        user.passwordResetExpires > new Date()
      ) {
        return { ...user };
      }
    }
    return null;
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.emailVerificationToken === token) {
        return { ...user };
      }
    }
    return null;
  }

  async save(user: User): Promise<User> {
    user.updatedAt = new Date();
    this.users.set(user.id, { ...user });
    return { ...user };
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async listAll(): Promise<User[]> {
    return Array.from(this.users.values()).map(u => ({ ...u }));
  }
}

export const userStore = new UserRepository();
