'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, UserRole, Organization, AuthTokens } from '../types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Crucial to send HttpOnly cookies to backend
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper to extract cookie values in the browser client
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Automatic Double-Submit Cookie CSRF Injection Interceptor
api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrfToken');
  if (csrfToken && config.headers) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  organization: Organization | null;
  loading: boolean;
  activeRole: UserRole | null;
  login: (email: string, password?: string, captchaToken?: string, captchaAnswer?: string) => Promise<{ mfaRequired?: boolean; mfaTicket?: string } | void>;
  verifyMfaLogin: (mfaTicket: string, code: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: UserRole, captchaToken?: string, captchaAnswer?: string) => Promise<void>;
  loginWithGoogleMock: (email?: string, name?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchRoleForDemo: (role: UserRole) => void;
  refreshOrganization: () => Promise<void>;
  getLoginHistory: () => Promise<any[]>;
  setupMfa: () => Promise<{ secret: string; otpauthUrl: string }>;
  enableMfa: (code: string) => Promise<void>;
  disableMfa: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  // Set authorization header (for legacy/fallback mechanisms)
  const setAuthHeader = (accessToken: string | null) => {
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // FR1.3: Silent Refresh Token Function
  const silentRefreshToken = useCallback(async (currentRefreshToken: string): Promise<AuthTokens | null> => {
    try {
      const res = await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken: currentRefreshToken
      }, { withCredentials: true });

      if (res.data.success) {
        const newTokens: AuthTokens = res.data.data.tokens;
        setTokens(newTokens);
        setAuthHeader(newTokens.accessToken);
        localStorage.setItem('bm_access_token', newTokens.accessToken);
        localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        return newTokens;
      }
    } catch (err) {
      // Clear local states on refresh failure
      setUser(null);
      setTokens(null);
      setActiveRole(null);
      localStorage.removeItem('bm_access_token');
      localStorage.removeItem('bm_refresh_token');
    }
    return null;
  }, []);

  const fetchOrganization = useCallback(async () => {
    try {
      const res = await api.get('/organization/mine');
      if (res.data.success && res.data.data) {
        setOrganization(res.data.data);
      }
    } catch (err) {
      // Fetch optional
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedAccessToken = localStorage.getItem('bm_access_token');
      const storedRefreshToken = localStorage.getItem('bm_refresh_token');
      const storedMockUser = localStorage.getItem('bm_mock_user');

      // Restore mock session immediately (offline/demo mode) without hitting the backend
      if (storedAccessToken?.startsWith('mock_') && storedMockUser) {
        try {
          const mockUser: User = JSON.parse(storedMockUser);
          setUser(mockUser);
          setActiveRole(mockUser.role);
          setTokens({
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken || '',
            expiresIn: 3600
          });
        } catch (_) {
          // Malformed mock user — clear and fall through
          localStorage.removeItem('bm_mock_user');
        }
        setLoading(false);
        return;
      }

      // Attempt profile fetch using cookies first, then fallback to local token headers
      if (storedAccessToken) {
        setAuthHeader(storedAccessToken);
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          const currentUser: User = res.data.data.user;
          setUser(currentUser);
          setActiveRole(currentUser.role);
          if (storedAccessToken) {
            setTokens({
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken || '',
              expiresIn: 900
            });
          }
          await fetchOrganization();
        }
      } catch (err: any) {
        // Token expired, attempt silent renewal (FR1.3)
        if (storedRefreshToken) {
          const refreshed = await silentRefreshToken(storedRefreshToken);
          if (refreshed) {
            try {
              const res = await api.get('/auth/me');
              if (res.data.success) {
                const currentUser: User = res.data.data.user;
                setUser(currentUser);
                setActiveRole(currentUser.role);
                await fetchOrganization();
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [silentRefreshToken, fetchOrganization]);

  // FR1.3: Set up automatic silent renewal timer before token expiration
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem('bm_refresh_token');
    const targetToken = tokens?.refreshToken || storedRefreshToken;
    if (!targetToken) return;

    // Refresh every 12 minutes (720 seconds) before 15m expiry
    const interval = setInterval(() => {
      silentRefreshToken(targetToken);
    }, 12 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tokens, silentRefreshToken]);

  // Axios response interceptor for automatic 401 silent retry
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem('bm_refresh_token');
    const targetToken = tokens?.refreshToken || storedRefreshToken;

    const interceptor = api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry &&
          targetToken
        ) {
          originalRequest._retry = true;
          const refreshed = await silentRefreshToken(targetToken);
          if (refreshed) {
            originalRequest.headers['Authorization'] = `Bearer ${refreshed.accessToken}`;
            return api(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [tokens, silentRefreshToken]);

  // FR1.1: Login Action
  const login = async (email: string, password?: string, captchaToken?: string, captchaAnswer?: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, captchaToken, captchaAnswer });
      if (res.data.success) {
        if (res.data.data?.mfaRequired) {
          return { mfaRequired: true, mfaTicket: res.data.data.mfaTicket };
        }

        const { user: authedUser, tokens: newTokens } = res.data.data;
        setUser(authedUser);
        setActiveRole(authedUser.role);
        
        if (newTokens) {
          setTokens(newTokens);
          setAuthHeader(newTokens.accessToken);
          localStorage.setItem('bm_access_token', newTokens.accessToken);
          localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        }
        await fetchOrganization();
      }
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.warn('Backend REST API unreachable. Falling back to local demo login session.');
        const mockUser: User = {
          id: `user_login_${Date.now()}`,
          email,
          name: email.split('@')[0],
          role: 'Owner',
          organizationId: null,
          emailVerified: true,
          authProvider: 'local'
        };
        const mockTokens: AuthTokens = {
          accessToken: `mock_access_token_${Date.now()}`,
          refreshToken: `mock_refresh_token_${Date.now()}`,
          expiresIn: 3600
        };
        setUser(mockUser);
        setActiveRole(mockUser.role);
        setTokens(mockTokens);
        localStorage.setItem('bm_access_token', mockTokens.accessToken);
        localStorage.setItem('bm_refresh_token', mockTokens.refreshToken);
        localStorage.setItem('bm_mock_user', JSON.stringify(mockUser));
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify MFA token code on login
  const verifyMfaLogin = async (mfaTicket: string, code: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login/mfa', { mfaTicket, code });
      if (res.data.success) {
        const { user: authedUser, tokens: newTokens } = res.data.data;
        setUser(authedUser);
        setActiveRole(authedUser.role);

        if (newTokens) {
          setTokens(newTokens);
          setAuthHeader(newTokens.accessToken);
          localStorage.setItem('bm_access_token', newTokens.accessToken);
          localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        }
        await fetchOrganization();
      }
    } finally {
      setLoading(false);
    }
  };

  // FR1.1: Register Action
  const register = async (email: string, password: string, name: string, role?: UserRole, captchaToken?: string, captchaAnswer?: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password, name, role, captchaToken, captchaAnswer });
      if (res.data.success) {
        const { user: authedUser, tokens: newTokens } = res.data.data;
        setUser(authedUser);
        setActiveRole(authedUser.role);
        
        if (newTokens) {
          setTokens(newTokens);
          setAuthHeader(newTokens.accessToken);
          localStorage.setItem('bm_access_token', newTokens.accessToken);
          localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        }
      }
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.warn('Backend REST API unreachable. Falling back to local demo registration session.');
        const mockUser: User = {
          id: `user_registered_${Date.now()}`,
          email,
          name,
          role: role || 'Owner',
          organizationId: null,
          emailVerified: true,
          authProvider: 'local'
        };
        const mockTokens: AuthTokens = {
          accessToken: `mock_access_token_${Date.now()}`,
          refreshToken: `mock_refresh_token_${Date.now()}`,
          expiresIn: 3600
        };
        setUser(mockUser);
        setActiveRole(mockUser.role);
        setTokens(mockTokens);
        localStorage.setItem('bm_access_token', mockTokens.accessToken);
        localStorage.setItem('bm_refresh_token', mockTokens.refreshToken);
        localStorage.setItem('bm_mock_user', JSON.stringify(mockUser));
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // FR1.1: Google OAuth login simulation
  const loginWithGoogleMock = async (email?: string, name?: string, role?: UserRole) => {
    setLoading(true);
    try {
      const googleId = `google_oauth_${Date.now()}`;
      const targetEmail = email || 'google.user@businessmind.ai';
      const targetName = name || 'Google Verified User';

      const res = await api.post('/auth/google', {
        googleId,
        email: targetEmail,
        name: targetName
      });

      if (res.data.success) {
        const { user: authedUser, tokens: newTokens } = res.data.data;
        setUser(authedUser);
        setActiveRole(role || authedUser.role);
        
        if (newTokens) {
          setTokens(newTokens);
          setAuthHeader(newTokens.accessToken);
          localStorage.setItem('bm_access_token', newTokens.accessToken);
          localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        }
        await fetchOrganization();
      }
    } catch {
      // Backend unreachable — create a mock Google user
      const mockUser: User = {
        id: `google_oauth_${Date.now()}`,
        email: email || 'google.user@businessmind.ai',
        name: name || 'Google Verified User',
        role: role || 'Owner',
        organizationId: null,
        emailVerified: true,
        authProvider: 'google'
      };
      const mockTokens: AuthTokens = {
        accessToken: `mock_access_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
        expiresIn: 3600
      };
      setUser(mockUser);
      setActiveRole(mockUser.role);
      setTokens(mockTokens);
      localStorage.setItem('bm_access_token', mockTokens.accessToken);
      localStorage.setItem('bm_refresh_token', mockTokens.refreshToken);
      localStorage.setItem('bm_mock_user', JSON.stringify(mockUser));
    } finally {
      setLoading(false);
    }
  };

  // FR1.6: Single session logout
  const logout = async () => {
    const storedRefreshToken = localStorage.getItem('bm_refresh_token');
    const targetToken = tokens?.refreshToken || storedRefreshToken;

    try {
      await api.post('/auth/logout', { refreshToken: targetToken || undefined });
    } catch (e) {
      // Ignore
    } finally {
      setUser(null);
      setTokens(null);
      setOrganization(null);
      setActiveRole(null);
      setAuthHeader(null);
      localStorage.removeItem('bm_access_token');
      localStorage.removeItem('bm_refresh_token');
      localStorage.removeItem('bm_mock_user');
    }
  };

  // FR1.6: Logout from all devices
  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
    } catch (e) {
      // Ignore
    } finally {
      setUser(null);
      setTokens(null);
      setOrganization(null);
      setActiveRole(null);
      setAuthHeader(null);
      localStorage.removeItem('bm_access_token');
      localStorage.removeItem('bm_refresh_token');
      localStorage.removeItem('bm_mock_user');
    }
  };

  // MFA settings management
  const setupMfa = async () => {
    const res = await api.post('/auth/mfa/setup');
    return res.data.data;
  };

  const enableMfa = async (code: string) => {
    await api.post('/auth/mfa/enable', { code });
  };

  const disableMfa = async (code: string) => {
    await api.post('/auth/mfa/disable', { code });
  };

  // Login Activity History monitoring
  const getLoginHistory = async () => {
    const res = await api.get('/auth/login-history');
    return res.data.data;
  };

  // Dynamic role switcher for testing UI layouts (FR1.4)
  const switchRoleForDemo = (role: UserRole) => {
    setActiveRole(role);
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        organization,
        loading,
        activeRole,
        login,
        verifyMfaLogin,
        register,
        loginWithGoogleMock,
        logout,
        logoutAll,
        switchRoleForDemo,
        refreshOrganization: fetchOrganization,
        getLoginHistory,
        setupMfa,
        enableMfa,
        disableMfa
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
