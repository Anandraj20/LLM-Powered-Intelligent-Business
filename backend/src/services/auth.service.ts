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
      if (!data.password) {
        throw new Error('Password is required');
      }
      const validation = validatePasswordStrength(data.password);
      if (!validation.isValid) {
        throw new Error(validation.message);
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

  async login(
    email: string,
    password?: string,
    clientIp = 'unknown',
    userAgent = 'unknown'
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens?: AuthTokens; mfaRequired?: boolean; mfaTicket?: string }> {
    const user = await userStore.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check lockout status
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      
      // Log failed attempt due to lockout
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
      throw new Error('Account created with Google OAuth. Please sign in with Google.');
    }

    if (!user.passwordHash || !password) {
      await this.handleFailedLoginAttempt(user, clientIp, userAgent, 'Missing password or hash');
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await this.handleFailedLoginAttempt(user, clientIp, userAgent, 'Incorrect password');
      throw new Error('Invalid email or password');
    }

    // Reset failed login attempts on successful credentials match
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.lastActiveAt = new Date();

    // Log successful credentials verification
    user.loginHistory = user.loginHistory || [];
    
    // If MFA is enabled, we don't issue full tokens yet
    if (user.mfaEnabled) {
      user.loginHistory.push({
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
        status: 'success',
        details: 'Credentials correct, MFA challenge required'
      });
      await userStore.save(user);

      // Issue temporary mfaTicket
      const mfaTicket = jwt.sign(
        { userId: user.id, tokenType: 'mfa_ticket' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      const { passwordHash: _, ...safeUser } = user;
      return { user: safeUser, mfaRequired: true, mfaTicket };
    }

    // No MFA, proceed to generate regular tokens
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
      user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      status = 'locked';
      details = `Account locked for 15 minutes due to 5 consecutive failures. Last reason: ${reason}`;
    }

    user.loginHistory.push({
      timestamp: new Date(),
      ip,
      userAgent,
      status,
      details
    });

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
      if (!user) {
        throw new Error('User associated with ticket no longer exists');
      }

      if (!user.mfaEnabled || !user.mfaSecret) {
        throw new Error('MFA is not enabled for this user');
      }

      const isValid = verifyTOTP(code, user.mfaSecret);
      if (!isValid) {
        // Increment failed attempts under MFA verify
        await this.handleFailedLoginAttempt(user, clientIp, userAgent, 'Failed MFA OTP check');
        throw new Error('Invalid verification code');
      }

      // Successful MFA confirmation
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

      // Check session inactivity timeout (30 minutes)
      const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
      if (user.lastActiveAt && (Date.now() - new Date(user.lastActiveAt).getTime() > INACTIVITY_LIMIT_MS)) {
        // Expired due to inactivity, clear sessions
        user.refreshTokens = [];
        await userStore.save(user);
        throw new Error('Session expired due to inactivity');
      }

      const newTokens = this.generateTokens(user);
      
      // Rotate refresh token
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
    if (!user) return null; // Silent return for security

    const resetToken = uuidv4();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // Reduced to 15 minutes for security

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
    user.refreshTokens = []; // Revoke all sessions on password change
    user.failedLoginAttempts = 0; // Reset failed login count
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
