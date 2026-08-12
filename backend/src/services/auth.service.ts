import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { userStore, User } from '../models/user.model';
import { UserRole } from '../config/permissions';

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
    role?: UserRole;
    organizationId?: string;
    authProvider?: 'local' | 'google';
    googleId?: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const existing = await userStore.findByEmail(data.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    let passwordHash: string | undefined = undefined;
    if (data.authProvider !== 'google') {
      if (!data.password || data.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      // FR1.5: Salted password hashing with bcrypt
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(data.password, salt);
    }

    const newUser: User = {
      id: uuidv4(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      name: data.name,
      role: data.role || 'Owner',
      organizationId: data.organizationId || null,
      emailVerified: data.authProvider === 'google',
      authProvider: data.authProvider || 'local',
      googleId: data.googleId || null,
      emailVerificationToken: data.authProvider === 'google' ? null : uuidv4(),
      refreshTokens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tokens = this.generateTokens(newUser);
    newUser.refreshTokens.push(tokens.refreshToken);

    await userStore.save(newUser);

    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser, tokens };
  }

  async login(email: string, password?: string): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const user = await userStore.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.authProvider === 'google' && !user.passwordHash) {
      throw new Error('Account created with Google OAuth. Please sign in with Google.');
    }

    if (!user.passwordHash || !password) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const tokens = this.generateTokens(user);
    
    // Manage active refresh sessions (keep latest 5 sessions)
    const updatedRefreshTokens = [...(user.refreshTokens || []).slice(-4), tokens.refreshToken];
    user.refreshTokens = updatedRefreshTokens;
    await userStore.save(user);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
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
        // Link existing email user with googleId
        user.googleId = data.googleId;
        user.avatarUrl = data.avatarUrl || user.avatarUrl;
        user.emailVerified = true;
      } else {
        // Register new Google OAuth user
        const newRecord = await this.register({
          email: data.email,
          name: data.name,
          authProvider: 'google',
          googleId: data.googleId,
          role: 'Owner'
        });
        return newRecord;
      }
    }

    const tokens = this.generateTokens(user);
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), tokens.refreshToken];
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

      const newTokens = this.generateTokens(user);
      
      // Rotate refresh token
      user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
      user.refreshTokens.push(newTokens.refreshToken);
      await userStore.save(user);

      return newTokens;
    } catch (error) {
      throw new Error('Refresh token expired or invalid');
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
    if (!user) return null; // Silent return for security

    const resetToken = uuidv4();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userStore.save(user);
    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const user = await userStore.findByResetToken(token);
    if (!user) {
      throw new Error('Password reset token is invalid or has expired');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshTokens = []; // Revoke all sessions on password change

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
