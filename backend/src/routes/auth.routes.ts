import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.middleware';
import { ROLE_PERMISSIONS } from '../config/permissions';
import { userStore } from '../models/user.model';
import { generateCaptcha, verifyCaptcha } from '../utils/captcha';

const router = Router();

// Helper to set HttpOnly, Secure authentication cookies
const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  const csrfToken = crypto.randomBytes(24).toString('hex');
  res.cookie('csrfToken', csrfToken, {
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return csrfToken;
};

// Helper to clear cookies on logout
const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.clearCookie('csrfToken', { path: '/' });
};

// Input validation formatter middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }
  next();
};

const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

// Helper to bypass CAPTCHA for seeded demo accounts to ensure quick login preset testing remains operational
const isDemoAccount = (email?: string): boolean => {
  if (!email) return false;
  const demoEmails = [
    'owner@businessmind.ai',
    'admin@businessmind.ai',
    'manager@businessmind.ai',
    'sales@businessmind.ai',
    'accountant@businessmind.ai',
    'employee@businessmind.ai'
  ];
  return demoEmails.includes(email.toLowerCase().trim());
};

// CAPTCHA verification middleware
const requireCaptcha = (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  if (isDemoAccount(email)) {
    return next();
  }

  const { captchaToken, captchaAnswer } = req.body;

  if (!captchaToken || !captchaAnswer) {
    return res.status(400).json({
      success: false,
      message: 'CAPTCHA verification is required'
    });
  }

  const isValid = verifyCaptcha(captchaToken, captchaAnswer);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Incorrect CAPTCHA answer. Please try again.'
    });
  }

  next();
};

// Expose mathematical CAPTCHA challenge
router.get('/captcha', (req: Request, res: Response) => {
  const challenge = generateCaptcha();
  return res.status(200).json({
    success: true,
    data: challenge
  });
});

// FR1.1: Register with email/password
router.post('/register', registerValidation, requireCaptcha, async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, organizationId } = req.body;

    const result = await authService.register({
      email,
      password,
      name,
      role,
      organizationId
    });

    const csrfToken = setAuthCookies(res, result.tokens);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        tokens: result.tokens,
        csrfToken
      }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// FR1.1: Login with email/password
router.post('/login', loginValidation, requireCaptcha, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await authService.login(email, password, ip, userAgent);

    if (result.mfaRequired) {
      return res.status(200).json({
        success: true,
        message: 'MFA validation required',
        data: {
          mfaRequired: true,
          mfaTicket: result.mfaTicket
        }
      });
    }

    if (!result.tokens) {
      return res.status(500).json({ success: false, message: 'Authentication failure' });
    }

    const csrfToken = setAuthCookies(res, result.tokens);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: result.tokens,
        csrfToken
      }
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// Verification of MFA OTP during login challenge
router.post('/login/mfa', async (req: Request, res: Response) => {
  try {
    const { mfaTicket, code } = req.body;
    if (!mfaTicket || !code) {
      return res.status(400).json({ success: false, message: 'MFA ticket and OTP code are required' });
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await authService.verifyMfaLogin(mfaTicket, code, ip, userAgent);

    const csrfToken = setAuthCookies(res, result.tokens);

    return res.status(200).json({
      success: true,
      message: 'MFA login verified',
      data: {
        user: result.user,
        tokens: result.tokens,
        csrfToken
      }
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'MFA verification failed'
    });
  }
});

// Setup Multi-Factor Authentication
router.post('/mfa/setup', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userStore.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { generateBase32Secret, getOTPAuthURI } = require('../utils/totp');
    const secret = generateBase32Secret();
    const otpauthUrl = getOTPAuthURI(user.email, secret);

    user.mfaSecret = secret;
    await userStore.save(user);

    return res.status(200).json({
      success: true,
      data: {
        secret,
        otpauthUrl
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'MFA Setup failed' });
  }
});

// Enable Multi-Factor Authentication
router.post('/mfa/enable', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification OTP code is required' });
    }

    const user = await userStore.findById(req.user!.id);
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ success: false, message: 'Please setup MFA before enabling' });
    }

    const { verifyTOTP } = require('../utils/totp');
    const isValid = verifyTOTP(code, user.mfaSecret);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Setup failed.' });
    }

    user.mfaEnabled = true;
    await userStore.save(user);

    return res.status(200).json({
      success: true,
      message: 'MFA enabled successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Enabling MFA failed' });
  }
});

// Disable Multi-Factor Authentication
router.post('/mfa/disable', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification OTP code is required' });
    }

    const user = await userStore.findById(req.user!.id);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({ success: false, message: 'MFA is not currently enabled' });
    }

    const { verifyTOTP } = require('../utils/totp');
    const isValid = verifyTOTP(code, user.mfaSecret);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Disable request rejected.' });
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    await userStore.save(user);

    return res.status(200).json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Disabling MFA failed' });
  }
});

// FR1.1: Google OAuth 2.0 Auth route
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { googleId, email, name, avatarUrl } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ success: false, message: 'Google ID and Email are required' });
    }

    const result = await authService.googleAuth({
      googleId,
      email,
      name: name || email.split('@')[0],
      avatarUrl
    });

    const csrfToken = setAuthCookies(res, result.tokens);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: result.user,
        tokens: result.tokens,
        csrfToken
      }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Google authentication failed'
    });
  }
});

// FR1.3: Silent Refresh Token Renewal
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const tokens = await authService.refreshToken(refreshToken);
    const csrfToken = setAuthCookies(res, tokens);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens, csrfToken }
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

// FR1.6: Logout single device session
router.post('/logout', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    await authService.logout(req.user!.id, refreshToken);
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
});

// FR1.6: Revoke all sessions (logout from all devices)
router.post('/logout-all', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await authService.logoutAll(req.user!.id);
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Logout all failed'
    });
  }
});

// FR1.6: Password Reset Request
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const resetToken = await authService.requestPasswordReset(email);

    return res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been issued.',
      data: resetToken ? { resetToken } : null
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Password reset request failed'
    });
  }
});

// FR1.6: Password Reset Confirmation
router.post('/reset-password', requireCaptcha, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    await authService.resetPassword(token, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Password reset failed'
    });
  }
});

// FR1.6: Email Verification
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    await authService.verifyEmail(token);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Email verification failed'
    });
  }
});

// GET /api/v1/auth/me Profile and RBAC permissions lookup
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
      permissions: ROLE_PERMISSIONS[req.user!.role] || []
    }
  });
});

// GET /api/v1/auth/login-history Logged in user activity history
router.get('/login-history', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userStore.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      data: user.loginHistory || []
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch login history'
    });
  }
});

export default router;
