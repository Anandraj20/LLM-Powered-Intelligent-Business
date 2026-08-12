import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.middleware';
import { ROLE_PERMISSIONS } from '../config/permissions';

const router = Router();

// FR1.1: Register with email/password
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, organizationId } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Email and name are required' });
    }

    const result = await authService.register({
      email,
      password,
      name,
      role,
      organizationId
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// FR1.1: Login with email/password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await authService.login(email, password);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
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

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: result
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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const tokens = await authService.refreshToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens }
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
    const { refreshToken } = req.body;
    await authService.logout(req.user!.id, refreshToken);

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
router.post('/reset-password', async (req: Request, res: Response) => {
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

export default router;
