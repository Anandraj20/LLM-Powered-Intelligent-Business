'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, UserRole, Organization, AuthTokens } from '../types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  organization: Organization | null;
  loading: boolean;
  activeRole: UserRole | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
  loginWithGoogleMock: (email?: string, name?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchRoleForDemo: (role: UserRole) => void;
  refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  // Set auth header on axios instance
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
      });
      if (res.data.success) {
        const newTokens: AuthTokens = res.data.data.tokens;
        setTokens(newTokens);
        setAuthHeader(newTokens.accessToken);
        localStorage.setItem('bm_access_token', newTokens.accessToken);
        localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        return newTokens;
      }
    } catch (err) {
      // Clear session on refresh failure
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
      // Org fetch optional
    }
  }, []);

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initAuth = async () => {
      const storedAccessToken = localStorage.getItem('bm_access_token');
      const storedRefreshToken = localStorage.getItem('bm_refresh_token');

      if (storedAccessToken) {
        setAuthHeader(storedAccessToken);
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            const currentUser: User = res.data.data.user;
            setUser(currentUser);
            setActiveRole(currentUser.role);
            setTokens({
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken || '',
              expiresIn: 900
            });
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
      }
      setLoading(false);
    };

    initAuth();
  }, [silentRefreshToken, fetchOrganization]);

  // FR1.3: Set up automatic silent renewal timer before token expiration
  useEffect(() => {
    if (!tokens?.refreshToken) return;

    // Refresh every 12 minutes (720 seconds) before 15m expiry
    const interval = setInterval(() => {
      silentRefreshToken(tokens.refreshToken);
    }, 12 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tokens, silentRefreshToken]);

  // Axios response interceptor for automatic 401 silent retry
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry &&
          tokens?.refreshToken
        ) {
          originalRequest._retry = true;
          const refreshed = await silentRefreshToken(tokens.refreshToken);
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
  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { user: authedUser, tokens: newTokens } = res.data.data;
        setUser(authedUser);
        setActiveRole(authedUser.role);
        setTokens(newTokens);
        setAuthHeader(newTokens.accessToken);
        localStorage.setItem('bm_access_token', newTokens.accessToken);
        localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        await fetchOrganization();
      }
    } finally {
      setLoading(false);
    }
  };

  // FR1.1: Register Action
  const register = async (email: string, password: string, name: string, role?: UserRole) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password, name, role });
      if (res.data.success) {
        const { user: authedUser, tokens: newTokens } = res.data.data;
        setUser(authedUser);
        setActiveRole(authedUser.role);
        setTokens(newTokens);
        setAuthHeader(newTokens.accessToken);
        localStorage.setItem('bm_access_token', newTokens.accessToken);
        localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
      }
    } finally {
      setLoading(false);
    }
  };

  // FR1.1: Google OAuth login simulation endpoint
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
        setTokens(newTokens);
        setAuthHeader(newTokens.accessToken);
        localStorage.setItem('bm_access_token', newTokens.accessToken);
        localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        await fetchOrganization();
      }
    } finally {
      setLoading(false);
    }
  };

  // FR1.6: Single session logout
  const logout = async () => {
    try {
      if (tokens?.refreshToken) {
        await api.post('/auth/logout', { refreshToken: tokens.refreshToken });
      }
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
    }
  };

  // FR1.6: Logout from all devices (revoke all active sessions)
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
    }
  };

  // Dynamic role switcher for testing permission-scoped UI views (FR1.4)
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
        register,
        loginWithGoogleMock,
        logout,
        logoutAll,
        switchRoleForDemo,
        refreshOrganization: fetchOrganization
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
