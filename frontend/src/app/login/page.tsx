'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { ShieldCheck, Mail, Lock, LogIn, Sparkles, ArrowRight, RefreshCw, KeyRound, Crown, Shield, BarChart3, Briefcase, Calculator, UserCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login, verifyMfaLogin, loginWithGoogleMock, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // CAPTCHA State — commented out
  // const [captchaChallenge, setCaptchaChallenge] = useState<{ question: string; token: string } | null>(null);
  // const [captchaAnswer, setCaptchaAnswer] = useState('');

  // MFA Challenge State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaTicket, setMfaTicket] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // Fetch CAPTCHA Challenge on Mount — commented out
  // const fetchCaptcha = async () => {
  //   try {
  //     const res = await api.get('/auth/captcha');
  //     if (res.data.success) {
  //       setCaptchaChallenge(res.data.data);
  //       setCaptchaAnswer('');
  //     }
  //   } catch (err) {
  //     console.error('Failed to load CAPTCHA');
  //   }
  // };

  // useEffect(() => {
  //   fetchCaptcha();
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await login(email, password/*, captchaChallenge?.token, captchaAnswer*/);
      if (result && result.mfaRequired) {
        setMfaRequired(true);
        setMfaTicket(result.mfaTicket || '');
      } else {
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
      // fetchCaptcha(); // Refresh CAPTCHA challenge on failure
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await verifyMfaLogin(mfaTicket, mfaCode);
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogleMock('google.user@businessmind.ai', 'Elena Rostova (Google OAuth)', 'Owner');
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError('Google OAuth login failed.');
    }
  };

  const handleQuickRoleLogin = async (roleEmail: string, roleName: string, role: UserRole) => {
    setError(null);
    try {
      // Demo accounts bypass CAPTCHA automatically, so we send empty captcha parameters
      const result = await login(roleEmail, 'Password123!');
      if (result && result.mfaRequired) {
        setMfaRequired(true);
        setMfaTicket(result.mfaTicket || '');
      } else {
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      // Fallback if backend server not running
      await loginWithGoogleMock(roleEmail, roleName, role);
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    }
  };

  // Helper to bypass CAPTCHA fields check for demo accounts in frontend UI view — commented out
  // const isDemoEmailInput = () => {
  //   const demoEmails = [
  //     'owner@businessmind.ai',
  //     'admin@businessmind.ai',
  //     'manager@businessmind.ai',
  //     'sales@businessmind.ai',
  //     'accountant@businessmind.ai',
  //     'employee@businessmind.ai'
  //   ];
  //   return demoEmails.includes(email.toLowerCase().trim());
  // };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {mfaRequired ? 'MFA Verification' : 'Welcome Back'}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {mfaRequired ? 'Please enter the 6-digit OTP from your authenticator' : 'Sign in to access your BusinessMind AI workspace'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Multi-Factor Authentication Challenge Form */}
        {mfaRequired ? (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Verification Code</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono tracking-[0.3em] text-slate-100 placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  Verify OTP & Login <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMfaRequired(false)}
              className="w-full text-center text-xs text-slate-400 hover:text-white transition mt-2 font-medium"
            >
              Cancel & Return to Login
            </button>
          </form>
        ) : (
          /* Normal Email/Password Credentials Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <Link href="/reset-password" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* CAPTCHA Validation Step — commented out */}
            {/* {captchaChallenge && !isDemoEmailInput() && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Security Verification</span>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    className="p-1 hover:text-white text-slate-500 rounded transition flex items-center gap-1"
                  >
                    <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg text-sm font-bold text-indigo-300 font-mono select-none tracking-wide flex-grow text-center">
                    {captchaChallenge.question}
                  </div>
                  <input
                    type="text"
                    required
                    value={captchaAnswer}
                    onChange={e => setCaptchaAnswer(e.target.value)}
                    placeholder="Your Answer"
                    className="w-28 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-100 placeholder-slate-700 text-center focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            )} */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn size={16} /> Sign In
                </>
              )}
            </button>
          </form>
        )}

        {!mfaRequired && (
          <>
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase">
                Or Continue With
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium rounded-xl text-xs flex items-center justify-center gap-3 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google OAuth 2.0
            </button>

            {/* Demo Quick Presets */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                <ShieldCheck size={14} className="text-indigo-400" />
                <span>Quick Login Presets (6 RBAC Roles)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleQuickRoleLogin('owner@businessmind.ai', 'Elena (Owner)', 'Owner')}
                  className="px-2.5 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 rounded-lg text-left transition font-medium flex items-center gap-1.5"
                >
                  <Crown size={13} className="shrink-0" /> Owner
                </button>
                <button
                  onClick={() => handleQuickRoleLogin('admin@businessmind.ai', 'Marcus (Admin)', 'Admin')}
                  className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-lg text-left transition font-medium flex items-center gap-1.5"
                >
                  <Shield size={13} className="shrink-0" /> Admin
                </button>
                <button
                  onClick={() => handleQuickRoleLogin('manager@businessmind.ai', 'Sarah (Manager)', 'Manager')}
                  className="px-2.5 py-1.5 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-800/40 rounded-lg text-left transition font-medium flex items-center gap-1.5"
                >
                  <BarChart3 size={13} className="shrink-0" /> Manager
                </button>
                <button
                  onClick={() => handleQuickRoleLogin('sales@businessmind.ai', 'David (Sales)', 'Sales Person')}
                  className="px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 rounded-lg text-left transition font-medium flex items-center gap-1.5"
                >
                  <Briefcase size={13} className="shrink-0" /> Sales Person
                </button>
                <button
                  onClick={() => handleQuickRoleLogin('accountant@businessmind.ai', 'Priya (Accountant)', 'Accountant')}
                  className="px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 rounded-lg text-left transition font-medium flex items-center gap-1.5"
                >
                  <Calculator size={13} className="shrink-0" /> Accountant
                </button>
                <button
                  onClick={() => handleQuickRoleLogin('employee@businessmind.ai', 'Alex (Employee)', 'Employee')}
                  className="px-2.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40 rounded-lg text-left transition font-medium flex items-center gap-1.5"
                >
                  <UserCircle2 size={13} className="shrink-0" /> Employee
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1">
                Register Account <ArrowRight size={12} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
