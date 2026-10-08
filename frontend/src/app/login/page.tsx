'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import {
  ShieldCheck, Mail, Lock, LogIn, Sparkles, ArrowRight,
  KeyRound, Crown, Shield, BarChart3, Briefcase, Calculator,
  UserCircle2, User as UserIcon, Eye, EyeOff, CheckCircle2,
  ExternalLink, X, AlertCircle, RefreshCw
} from 'lucide-react';

// Google SVG icon
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

interface RoleConfig {
  role: UserRole;
  label: string;
  username: string;
  email: string;
  defaultPass: string;
  desc: string;
  icon: React.ReactNode;
  activeBorder: string;
  activeBg: string;
  activeText: string;
  badge: string;
}

const ROLES: RoleConfig[] = [
  {
    role: 'Owner',
    label: 'Owner',
    username: 'elena_r',
    email: 'owner@businessmind.ai',
    defaultPass: 'Password123!',
    desc: 'Full executive control, organization settings, AI scenario models',
    icon: <Crown size={15} />,
    activeBorder: 'border-purple-500 shadow-purple-500/30',
    activeBg: 'bg-purple-950/50',
    activeText: 'text-purple-300',
    badge: 'Executive Tier'
  },
  {
    role: 'Admin',
    label: 'Admin',
    username: 'marcus_v',
    email: 'admin@businessmind.ai',
    defaultPass: 'Password123!',
    desc: 'User provisioning, RBAC security, MFA enforcement, audit logs',
    icon: <Shield size={15} />,
    activeBorder: 'border-rose-500 shadow-rose-500/30',
    activeBg: 'bg-rose-950/50',
    activeText: 'text-rose-300',
    badge: 'System Tier'
  },
  {
    role: 'Manager',
    label: 'Manager',
    username: 'sarah_j',
    email: 'manager@businessmind.ai',
    defaultPass: 'Password123!',
    desc: 'Pipeline velocity, team quotas, performance metrics, approvals',
    icon: <BarChart3 size={15} />,
    activeBorder: 'border-blue-500 shadow-blue-500/30',
    activeBg: 'bg-blue-950/50',
    activeText: 'text-blue-300',
    badge: 'Operations'
  },
  {
    role: 'Sales Person',
    label: 'Sales',
    username: 'david_m',
    email: 'sales@businessmind.ai',
    defaultPass: 'Password123!',
    desc: 'Lead management, CRM conversions, deals and customer touchpoints',
    icon: <Briefcase size={15} />,
    activeBorder: 'border-amber-500 shadow-amber-500/30',
    activeBg: 'bg-amber-950/50',
    activeText: 'text-amber-300',
    badge: 'Revenue'
  },
  {
    role: 'Accountant',
    label: 'Accountant',
    username: 'priya_s',
    email: 'accountant@businessmind.ai',
    defaultPass: 'Password123!',
    desc: 'General ledger, transaction margins, fiscal reports, tax exports',
    icon: <Calculator size={15} />,
    activeBorder: 'border-emerald-500 shadow-emerald-500/30',
    activeBg: 'bg-emerald-950/50',
    activeText: 'text-emerald-300',
    badge: 'Fiscal'
  },
  {
    role: 'Employee',
    label: 'Employee',
    username: 'alex_r',
    email: 'employee@businessmind.ai',
    defaultPass: 'Password123!',
    desc: 'Operational tasks, personal activity feeds, standard workspace access',
    icon: <UserCircle2 size={15} />,
    activeBorder: 'border-cyan-500 shadow-cyan-500/30',
    activeBg: 'bg-cyan-950/50',
    activeText: 'text-cyan-300',
    badge: 'Standard'
  }
];

export default function LoginPage() {
  const { login, verifyMfaLogin, loginWithGoogleMock, loading, switchRoleForDemo } = useAuth();

  // Role Selection State (Step 1)
  const [selectedRole, setSelectedRole] = useState<UserRole>('Owner');
  const currentRoleConfig = ROLES.find(r => r.role === selectedRole) || ROLES[0];

  // Credentials State (Step 2)
  const [identifier, setIdentifier] = useState(currentRoleConfig.username);
  const [password, setPassword] = useState(currentRoleConfig.defaultPass);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth Modal & State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('anandrajking6369@gmail.com');
  const [googleName, setGoogleName] = useState('Anand Raj');
  const [googleLoading, setGoogleLoading] = useState(false);

  // MFA State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaTicket, setMfaTicket] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // When user switches role in Step 1, update fields
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const cfg = ROLES.find(r => r.role === role);
    if (cfg) {
      setIdentifier(cfg.username);
      setPassword(cfg.defaultPass);
    }
    setError(null);
  };

  // Submit login credentials
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Login via backend (identifier = username OR email)
      const result = await login(identifier, password);
      if (result && result.mfaRequired) {
        setMfaRequired(true);
        setMfaTicket(result.mfaTicket || '');
      } else {
        // Enforce the selected role preference on dashboard launch
        switchRoleForDemo(selectedRole);
        if (typeof window !== 'undefined') window.location.href = '/dashboard';
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please verify credentials.';
      setError(msg);
    }
  };

  // MFA code submit
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await verifyMfaLogin(mfaTicket, mfaCode);
      switchRoleForDemo(selectedRole);
      if (typeof window !== 'undefined') window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed.');
    }
  };

  // Direct to accounts.google.com in real window
  const handleDirectGoogleRedirect = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '596288123910-u19u4v62u942j5e9t47t3q72hsmf129v.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent(window.location.origin + '/login');
    const scope = encodeURIComponent('email profile openid');
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=select_account`;
    
    // Open Google Account chooser
    window.open(googleAuthUrl, '_blank', 'width=520,height=640');
  };

  // Authenticate Google Account via backend /auth/google
  const handleAuthenticateGoogleAccount = async (targetEmail: string, targetName: string) => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogleMock(targetEmail, targetName, selectedRole);
      switchRoleForDemo(selectedRole);
      if (typeof window !== 'undefined') window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google account authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient decorative glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-950/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6">
        {/* Platform Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">BusinessMind AI</h1>
              <p className="text-[11px] text-slate-400">Enterprise Role-Based Intelligence Portal</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MySQL Live
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-950/70 border border-rose-800/70 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* MFA Form */}
        {mfaRequired ? (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
                <KeyRound size={22} />
              </div>
              <h2 className="text-lg font-bold text-white">Two-Factor Authentication</h2>
              <p className="text-xs text-slate-400">Enter the 6-digit verification code from your authenticator app</p>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-center text-xl font-mono tracking-[0.4em] text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Verify Code & Launch <ArrowRight size={15} /></>}
            </button>

            <button
              type="button"
              onClick={() => setMfaRequired(false)}
              className="w-full text-center text-xs text-slate-400 hover:text-white transition"
            >
              ← Back to login
            </button>
          </form>
        ) : (
          <>
            {/* STEP 1: SELECT WORKSPACE ROLE (BEFORE ENTERING USERNAME & PASSWORD) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  Select Your Workspace Role to Login
                </span>
                <span className="text-[11px] text-slate-400">Step 1 of 2</span>
              </div>

              {/* Role Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ROLES.map((r) => {
                  const isSelected = selectedRole === r.role;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => handleRoleSelect(r.role)}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 relative ${
                        isSelected
                          ? `${r.activeBg} ${r.activeBorder} ${r.activeText} shadow-md`
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-400" />
                      )}
                      <span className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        {r.icon}
                      </span>
                      <span className="text-[11px] font-bold leading-tight truncate w-full">{r.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Role Context Banner */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${currentRoleConfig.activeBg} ${currentRoleConfig.activeBorder}`}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{currentRoleConfig.role} Access</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-semibold text-slate-300">
                      {currentRoleConfig.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{currentRoleConfig.desc}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {selectedRole === 'Owner' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier('anand');
                        setPassword('Anand@2005');
                      }}
                      className="px-2 py-1 bg-purple-900/60 hover:bg-purple-800 border border-purple-600/60 rounded-xl text-[10px] font-semibold text-purple-200 transition"
                    >
                      Fill Anand (@anand)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier(currentRoleConfig.username);
                      setPassword(currentRoleConfig.defaultPass);
                    }}
                    className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-[10px] font-semibold text-indigo-300 hover:text-white transition whitespace-nowrap shrink-0 flex items-center gap-1"
                    title="Auto-fill verified demo credentials for this role"
                  >
                    <RefreshCw size={11} />
                    <span>Fill Demo (@{currentRoleConfig.username})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 2: ENTER CREDENTIALS (USERNAME / EMAIL & PASSWORD) */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  Enter Username / Email & Password
                </span>
                <span className="text-[11px] text-slate-400">Step 2 of 2</span>
              </div>

              {/* Username or Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Username or Email Address
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder={`e.g. ${currentRoleConfig.username} or ${currentRoleConfig.email}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <Link href="/reset-password" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-11 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Quick Preset Credentials Bar */}
              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-500">Active Creds:</span>
                  <span className="font-mono text-slate-200 font-semibold truncate">{identifier}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-slate-500">Role:</span>
                  <span className={`font-bold ${currentRoleConfig.activeText}`}>{selectedRole}</span>
                </div>
              </div>

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Sign In as {selectedRole}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="relative text-center pt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Or Connect With Google
              </span>
            </div>

            {/* GOOGLE SIGN IN BUTTON */}
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-lg hover:shadow-xl"
            >
              <GoogleIcon />
              <span>Continue with Google Account</span>
              <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                OAuth 2.0
              </span>
            </button>

            {/* Bottom Links */}
            <div className="text-center text-xs text-slate-400 pt-2">
              Don't have an account?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 transition">
                Create Free Workspace <ArrowRight size={12} />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* GOOGLE ACCOUNT AUTHENTICATION & PROFILE ANALYSIS MODAL */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <GoogleIcon />
                <div>
                  <h3 className="text-base font-bold text-white">Google Account Authentication</h3>
                  <p className="text-[11px] text-slate-400">Choose an account to connect to BusinessMind AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-xl hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Role Association Badge */}
            <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl flex items-center justify-between">
              <span className="text-xs text-slate-300">Assign to Workspace Role:</span>
              <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                {selectedRole}
              </span>
            </div>

            {/* Detected / Quick Google Accounts */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400">Select Google Account:</div>
              
              {/* Account 1: User's Account */}
              <button
                type="button"
                onClick={() => {
                  setGoogleEmail('anandrajking6369@gmail.com');
                  setGoogleName('Anand Raj');
                }}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                  googleEmail === 'anandrajking6369@gmail.com'
                    ? 'bg-slate-800 border-indigo-500 shadow-md'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    A
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Anand Raj</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded font-normal">Primary</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">anandrajking6369@gmail.com</div>
                  </div>
                </div>
                {googleEmail === 'anandrajking6369@gmail.com' && (
                  <CheckCircle2 size={18} className="text-indigo-400" />
                )}
              </button>

              {/* Account 2: Demo Corporate Account */}
              <button
                type="button"
                onClick={() => {
                  setGoogleEmail('businessmind.ai@gmail.com');
                  setGoogleName('Enterprise Workspace');
                }}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                  googleEmail === 'businessmind.ai@gmail.com'
                    ? 'bg-slate-800 border-indigo-500 shadow-md'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    B
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Enterprise Suite User</div>
                    <div className="text-[11px] text-slate-400 font-mono">businessmind.ai@gmail.com</div>
                  </div>
                </div>
                {googleEmail === 'businessmind.ai@gmail.com' && (
                  <CheckCircle2 size={18} className="text-indigo-400" />
                )}
              </button>
            </div>

            {/* Custom Google Account Input */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-300">Or Type Any Custom Gmail Account:</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleEmail}
                  onChange={e => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <input
                  type="text"
                  value={googleName}
                  onChange={e => setGoogleName(e.target.value)}
                  placeholder="Full Name"
                  className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Google Security & Profile Analysis Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-300">Google OAuth Analysis</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck size={13} /> Ready
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>• Token: Google RS256 JWT</div>
                <div>• Scopes: email, profile, openid</div>
                <div>• Persistence: MySQL users table</div>
                <div>• Security: 256-bit SSL / TLS 1.3</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleAuthenticateGoogleAccount(googleEmail, googleName)}
                disabled={googleLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                {googleLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Authenticate Google Account & Launch</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDirectGoogleRedirect}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
              >
                <ExternalLink size={14} />
                <span>Direct to official accounts.google.com in new window</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
