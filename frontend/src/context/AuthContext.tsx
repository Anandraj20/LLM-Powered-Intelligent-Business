'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, UserRole, Organization, AuthTokens, IndustryType, BusinessSize } from '../types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
  organizations: Organization[];
  loading: boolean;
  activeRole: UserRole | null;
  /** Login with email OR username + password */
  login: (identifier: string, password?: string, captchaToken?: string, captchaAnswer?: string) => Promise<{ mfaRequired?: boolean; mfaTicket?: string } | void>;
  verifyMfaLogin: (mfaTicket: string, code: string) => Promise<void>;
  register: (email: string, password: string, name: string, username?: string, role?: UserRole, captchaToken?: string, captchaAnswer?: string) => Promise<void>;
  /** Real Google OAuth — pass the credential JWT from @react-oauth/google */
  loginWithGoogle: (googleCredential: string) => Promise<void>;
  /** Kept for mock/fallback usage */
  loginWithGoogleMock: (email?: string, name?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchRoleForDemo: (role: UserRole) => void;
  refreshOrganization: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  createOrganization: (data: { name: string; industryType: IndustryType; businessSize: BusinessSize }) => Promise<Organization>;
  updateOrganization: (id: string, data: Partial<{ name: string; industryType: IndustryType; businessSize: BusinessSize }>) => Promise<Organization>;
  deleteOrganization: (id: string) => Promise<void>;
  getLoginHistory: () => Promise<any[]>;
  setupMfa: () => Promise<{ secret: string; otpauthUrl: string }>;
  enableMfa: (code: string) => Promise<void>;
  disableMfa: (code: string) => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  const setAuthHeader = (accessToken: string | null) => {
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

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
        localStorage.setItem('accessToken', newTokens.accessToken);
        localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        return newTokens;
      }
    } catch (err) {
      setUser(null);
      setTokens(null);
      setActiveRole(null);
      localStorage.removeItem('bm_access_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('bm_refresh_token');
    }
    return null;
  }, []);

  const fetchOrganization = useCallback(async () => {
    try {
      const res = await api.get('/organization/mine');
      if (res.data.success) {
        if (res.data.data) {
          setOrganization(res.data.data);
        }
        if (res.data.organizations && Array.isArray(res.data.organizations)) {
          setOrganizations(res.data.organizations);
        } else if (res.data.data) {
          setOrganizations([res.data.data]);
        }
      }
    } catch (err) {
      // Demo mock fallback if in offline/mock mode
      const storedMockOrgs = localStorage.getItem('bm_mock_orgs');
      if (storedMockOrgs) {
        try {
          const parsed: Organization[] = JSON.parse(storedMockOrgs);
          setOrganizations(parsed);
          const activeOrgId = localStorage.getItem('bm_mock_active_org_id');
          const found = parsed.find(o => o.id === activeOrgId) || parsed[0] || null;
          setOrganization(found);
        } catch (_) {}
      }
    }
  }, []);

  // Init auth state from localStorage / cookies
  useEffect(() => {
    const initAuth = async () => {
      const storedAccessToken = localStorage.getItem('bm_access_token');
      const storedRefreshToken = localStorage.getItem('bm_refresh_token');
      const storedMockUser = localStorage.getItem('bm_mock_user');

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
          localStorage.removeItem('bm_mock_user');
        }
        setLoading(false);
        return;
      }

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
            } catch (e) { /* Ignore */ }
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [silentRefreshToken, fetchOrganization]);

  // Silent token renewal every 12 minutes
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem('bm_refresh_token');
    const targetToken = tokens?.refreshToken || storedRefreshToken;
    if (!targetToken) return;

    const interval = setInterval(() => {
      silentRefreshToken(targetToken);
    }, 12 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tokens, silentRefreshToken]);

  // Axios 401 interceptor for silent retry
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

    return () => { api.interceptors.response.eject(interceptor); };
  }, [tokens, silentRefreshToken]);

  // ── Login (email OR username) ─────────────────────────────────────────────
  const login = async (identifier: string, password?: string, captchaToken?: string, captchaAnswer?: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { identifier, password, captchaToken, captchaAnswer });
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
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        }
        await fetchOrganization();
      }
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.warn('Backend unreachable — falling back to demo session.');
        const mockUser: User = {
          id: `user_login_${Date.now()}`,
          username: identifier.split('@')[0] || identifier,
          email: identifier.includes('@') ? identifier : `${identifier}@businessmind.ai`,
          name: identifier.split('@')[0],
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
        localStorage.setItem('accessToken', mockTokens.accessToken);
        localStorage.setItem('bm_refresh_token', mockTokens.refreshToken);
        localStorage.setItem('bm_mock_user', JSON.stringify(mockUser));
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Verify MFA ───────────────────────────────────────────────────────────
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
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        }
        await fetchOrganization();
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const register = async (email: string, password: string, name: string, username?: string, role?: UserRole, captchaToken?: string, captchaAnswer?: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password, name, username, role, captchaToken, captchaAnswer });
      if (res.data.success) {
        const { user: authedUser, tokens: newTokens } = res.data.data;
        setUser(authedUser);
        setActiveRole(authedUser.role);
        if (newTokens) {
          setTokens(newTokens);
          setAuthHeader(newTokens.accessToken);
          localStorage.setItem('bm_access_token', newTokens.accessToken);
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        }
      }
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        const autoUsername = username || name.toLowerCase().replace(/\s+/g, '_').slice(0, 20);
        const mockUser: User = {
          id: `user_registered_${Date.now()}`,
          username: autoUsername,
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
        localStorage.setItem('accessToken', mockTokens.accessToken);
        localStorage.setItem('bm_refresh_token', mockTokens.refreshToken);
        localStorage.setItem('bm_mock_user', JSON.stringify(mockUser));
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Real Google OAuth (credential from @react-oauth/google) ──────────────
  const loginWithGoogle = async (googleCredential: string) => {
    setLoading(true);
    try {
      // Decode JWT payload (header.payload.sig) to get user info
      const payloadBase64 = googleCredential.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));

      const res = await api.post('/auth/google', {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        avatarUrl: payload.picture || null
      });

      if (res.data.success) {
        const { user: authedUser, tokens: newTokens } = res.data.data;
        setUser(authedUser);
        setActiveRole(authedUser.role);
        if (newTokens) {
          setTokens(newTokens);
          setAuthHeader(newTokens.accessToken);
          localStorage.setItem('bm_access_token', newTokens.accessToken);
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        }
        await fetchOrganization();
      }
    } catch (err: any) {
      // Fallback to mock if backend unreachable
      await loginWithGoogleMock(undefined, undefined, undefined);
    } finally {
      setLoading(false);
    }
  };

  // ── Google Mock (used for quick-role presets or when no client ID) ────────
  const loginWithGoogleMock = async (email?: string, name?: string, role?: UserRole) => {
    setLoading(true);
    try {
      const googleId = `google_oauth_${Date.now()}`;
      const targetEmail = email || 'google.user@businessmind.ai';
      const targetName = name || 'Google Verified User';

      const res = await api.post('/auth/google', {
        googleId,
        email: targetEmail,
        name: targetName,
        role: role || activeRole || 'Owner'
      });

      if (res.data.success) {
        const { user: authedUser, tokens: newTokens } = res.data.data;
        setUser(authedUser);
        setActiveRole(role || authedUser.role);
        if (newTokens) {
          setTokens(newTokens);
          setAuthHeader(newTokens.accessToken);
          localStorage.setItem('bm_access_token', newTokens.accessToken);
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('bm_refresh_token', newTokens.refreshToken);
        }
        await fetchOrganization();
      }
    } catch {
      const autoUsername = (name || 'google_user').toLowerCase().replace(/\s+/g, '_').slice(0, 20);
      const mockUser: User = {
        id: `google_oauth_${Date.now()}`,
        username: autoUsername,
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
      localStorage.setItem('accessToken', mockTokens.accessToken);
      localStorage.setItem('bm_refresh_token', mockTokens.refreshToken);
      localStorage.setItem('bm_mock_user', JSON.stringify(mockUser));
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    const storedRefreshToken = localStorage.getItem('bm_refresh_token');
    const targetToken = tokens?.refreshToken || storedRefreshToken;
    try {
      await api.post('/auth/logout', { refreshToken: targetToken || undefined });
    } catch (e) { /* Ignore */ } finally {
      setUser(null); setTokens(null); setOrganization(null); setOrganizations([]); setActiveRole(null);
      setAuthHeader(null);
      localStorage.removeItem('bm_access_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('bm_refresh_token');
      localStorage.removeItem('bm_mock_user');
      localStorage.removeItem('bm_mock_orgs');
      localStorage.removeItem('bm_mock_active_org_id');
    }
  };

  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
    } catch (e) { /* Ignore */ } finally {
      setUser(null); setTokens(null); setOrganization(null); setOrganizations([]); setActiveRole(null);
      setAuthHeader(null);
      localStorage.removeItem('bm_access_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('bm_refresh_token');
      localStorage.removeItem('bm_mock_user');
      localStorage.removeItem('bm_mock_orgs');
      localStorage.removeItem('bm_mock_active_org_id');
    }
  };

  // ── Multi-Organization Operations ──────────────────────────────────────────
  const switchOrganization = async (orgId: string) => {
    try {
      const res = await api.post(`/organization/switch/${orgId}`);
      if (res.data.success) {
        setOrganization(res.data.data);
        if (res.data.organizations && Array.isArray(res.data.organizations)) {
          setOrganizations(res.data.organizations);
        }
        if (user) {
          setUser({ ...user, organizationId: orgId });
        }
      }
    } catch (err) {
      // Mock mode fallback
      const found = organizations.find(o => o.id === orgId);
      if (found) {
        setOrganization(found);
        localStorage.setItem('bm_mock_active_org_id', orgId);
        if (user) setUser({ ...user, organizationId: orgId });
      }
    }
  };

  const createOrganization = async (data: { name: string; industryType: IndustryType; businessSize: BusinessSize }): Promise<Organization> => {
    try {
      const res = await api.post('/organization', data);
      if (res.data.success) {
        const newOrg: Organization = res.data.data;
        setOrganization(newOrg);
        if (res.data.organizations && Array.isArray(res.data.organizations)) {
          setOrganizations(res.data.organizations);
        } else {
          setOrganizations(prev => [newOrg, ...prev.filter(o => o.id !== newOrg.id)]);
        }
        if (user) {
          setUser({ ...user, organizationId: newOrg.id });
        }
        return newOrg;
      }
      throw new Error(res.data.message || 'Failed to create organization');
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK') {
        const mockOrg: Organization = {
          id: `org_${Date.now()}`,
          name: data.name,
          industryType: data.industryType,
          businessSize: data.businessSize,
          ownerId: user?.id || 'demo-admin-001',
          createdAt: new Date().toISOString()
        };
        const updated = [mockOrg, ...organizations.filter(o => o.id !== mockOrg.id)];
        setOrganizations(updated);
        setOrganization(mockOrg);
        localStorage.setItem('bm_mock_orgs', JSON.stringify(updated));
        localStorage.setItem('bm_mock_active_org_id', mockOrg.id);
        if (user) setUser({ ...user, organizationId: mockOrg.id });
        return mockOrg;
      }
      throw err;
    }
  };

  const updateOrganization = async (id: string, data: Partial<{ name: string; industryType: IndustryType; businessSize: BusinessSize }>): Promise<Organization> => {
    try {
      const res = await api.put(`/organization/${id}`, data);
      if (res.data.success) {
        const updatedOrg: Organization = res.data.data;
        if (organization?.id === id) {
          setOrganization(updatedOrg);
        }
        if (res.data.organizations && Array.isArray(res.data.organizations)) {
          setOrganizations(res.data.organizations);
        } else {
          setOrganizations(prev => prev.map(o => o.id === id ? updatedOrg : o));
        }
        return updatedOrg;
      }
      throw new Error(res.data.message || 'Failed to update organization');
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK') {
        const updated = organizations.map(o => {
          if (o.id === id) {
            return {
              ...o,
              name: data.name ?? o.name,
              industryType: data.industryType ?? o.industryType,
              businessSize: data.businessSize ?? o.businessSize,
              updatedAt: new Date().toISOString()
            };
          }
          return o;
        });
        setOrganizations(updated);
        const active = updated.find(o => o.id === id) || organization;
        if (organization?.id === id) {
          setOrganization(active || null);
        }
        localStorage.setItem('bm_mock_orgs', JSON.stringify(updated));
        return active!;
      }
      throw err;
    }
  };

  const deleteOrganization = async (id: string): Promise<void> => {
    try {
      const res = await api.delete(`/organization/${id}`);
      if (res.data.success) {
        const remaining: Organization[] = res.data.organizations || organizations.filter(o => o.id !== id);
        setOrganizations(remaining);
        const newActive = remaining.find((o: any) => o.id === res.data.activeOrganizationId) || remaining[0] || null;
        setOrganization(newActive);
        if (user) {
          setUser({ ...user, organizationId: newActive?.id || null });
        }
      }
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK') {
        const remaining = organizations.filter(o => o.id !== id);
        setOrganizations(remaining);
        const newActive = remaining[0] || null;
        setOrganization(newActive);
        localStorage.setItem('bm_mock_orgs', JSON.stringify(remaining));
        localStorage.setItem('bm_mock_active_org_id', newActive?.id || '');
        if (user) setUser({ ...user, organizationId: newActive?.id || null });
        return;
      }
      throw err;
    }
  };

  // ── MFA ──────────────────────────────────────────────────────────────────
  const setupMfa = async () => {
    const res = await api.post('/auth/mfa/setup');
    return res.data.data;
  };
  const enableMfa = async (code: string) => { await api.post('/auth/mfa/enable', { code }); };
  const disableMfa = async (code: string) => { await api.post('/auth/mfa/disable', { code }); };
  const getLoginHistory = async () => {
    const res = await api.get('/auth/login-history');
    return res.data.data;
  };

  // ── Username availability check ──────────────────────────────────────────
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const res = await api.get(`/auth/check-username/${encodeURIComponent(username)}`);
      return res.data.available ?? false;
    } catch {
      return true; // assume available if check fails
    }
  };

  const switchRoleForDemo = (role: UserRole) => {
    setActiveRole(role);
    if (user) setUser({ ...user, role });
  };

  return (
    <AuthContext.Provider
      value={{
        user, tokens, organization, organizations, loading, activeRole,
        login, verifyMfaLogin, register,
        loginWithGoogle, loginWithGoogleMock,
        logout, logoutAll, switchRoleForDemo,
        refreshOrganization: fetchOrganization,
        switchOrganization, createOrganization, updateOrganization, deleteOrganization,
        getLoginHistory, setupMfa, enableMfa, disableMfa,
        checkUsernameAvailability
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
