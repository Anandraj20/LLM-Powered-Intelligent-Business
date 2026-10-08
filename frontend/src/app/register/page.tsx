'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, api } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import {
  UserPlus, Mail, Lock, User as UserIcon, Shield, ArrowRight,
  RefreshCw, Check, X, AtSign, Eye, EyeOff, Loader2
} from 'lucide-react';

// Google SVG icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const ROLE_INFO: Record<UserRole, { desc: string; color: string }> = {
  Owner:       { desc: 'Full system access, org creation, executive analytics', color: 'text-purple-400' },
  Admin:       { desc: 'User management, security settings, audit logs', color: 'text-rose-400' },
  Manager:     { desc: 'Sales pipeline, team oversight, operational reports', color: 'text-blue-400' },
  'Sales Person': { desc: 'Lead tracking, deal velocity, pipeline forecasting', color: 'text-amber-400' },
  Accountant:  { desc: 'Ledger verification, tax exports, margin analysis', color: 'text-emerald-400' },
  Employee:    { desc: 'Standard workspace, personal tasks, basic reports', color: 'text-slate-400' },
};

export default function RegisterPage() {
  const { register, loginWithGoogleMock, loading, checkUsernameAvailability } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('Owner');
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  // CAPTCHA
  const [captchaChallenge, setCaptchaChallenge] = useState<{ question: string; token: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const fetchCaptcha = async () => {
    try {
      const res = await api.get('/auth/captcha');
      if (res.data.success) {
        setCaptchaChallenge(res.data.data);
        setCaptchaAnswer('');
      }
    } catch { /* Ignore */ }
  };

  useEffect(() => { fetchCaptcha(); }, []);

  // Auto-generate username from name
  useEffect(() => {
    if (name && !username) {
      const parts = name.trim().toLowerCase().split(/\s+/);
      const gen = parts.length >= 2
        ? `${parts[0]}_${parts[1].charAt(0)}`
        : parts[0];
      setUsername(gen.replace(/[^a-z0-9_]/g, '').slice(0, 20));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // Debounced username check
  const checkUsername = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (val: string) => {
        clearTimeout(timer);
        if (!val || val.length < 3) { setUsernameStatus('idle'); return; }
        if (!/^[a-z0-9_]{3,30}$/.test(val)) { setUsernameStatus('invalid'); return; }
        setUsernameStatus('checking');
        timer = setTimeout(async () => {
          const available = await checkUsernameAvailability(val);
          setUsernameStatus(available ? 'available' : 'taken');
        }, 600);
      };
    })(),
    [checkUsernameAvailability]
  );

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
    setUsername(clean);
    checkUsername(clean);
  };

  // Password criteria
  const passwordCriteria = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /\d/.test(password),
    special:   /[@$!%*?&()._#^+\-]/.test(password),
  };
  const isPasswordSecure = Object.values(passwordCriteria).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isPasswordSecure) { setError('Please ensure your password meets all complexity requirements.'); return; }
    if (usernameStatus === 'taken') { setError('That username is already taken. Please choose another.'); return; }
    if (usernameStatus === 'invalid') { setError('Username must be 3-30 characters: lowercase letters, numbers, underscores only.'); return; }

    try {
      await register(email, password, name, username || undefined, role, captchaChallenge?.token, captchaAnswer);
      if (typeof window !== 'undefined') window.location.href = '/organization';
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
      fetchCaptcha();
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (GOOGLE_CLIENT_ID) {
        const width = 500, height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/google/callback')}&response_type=token&scope=email%20profile`,
          'google-oauth',
          `width=${width},height=${height},top=${top},left=${left}`
        );
      } else {
        await loginWithGoogleMock('google.signup@businessmind.ai', 'New Google User', 'Owner');
        if (typeof window !== 'undefined') window.location.href = '/organization';
      }
    } catch {
      setError('Google Sign-Up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const usernameIndicator = () => {
    if (usernameStatus === 'idle' || !username) return null;
    if (usernameStatus === 'checking') return <Loader2 size={14} className="animate-spin text-slate-400" />;
    if (usernameStatus === 'available') return <Check size={14} className="text-emerald-400" />;
    if (usernameStatus === 'taken') return <X size={14} className="text-rose-400" />;
    if (usernameStatus === 'invalid') return <X size={14} className="text-amber-400" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl z-10">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <UserPlus size={26} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-slate-400 text-xs mt-1">Join the BusinessMind AI Platform</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign Up */}
        <button
          onClick={handleGoogleSignup}
          disabled={googleLoading || loading}
          type="button"
          className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm flex items-center justify-center gap-3 transition shadow-md mb-5 disabled:opacity-60"
        >
          {googleLoading
            ? <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            : <><GoogleIcon /><span>Sign up with Google</span></>
          }
        </button>

        {/* Divider */}
        <div className="relative mb-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase">Or register with email</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text" required value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username <span className="text-slate-500 font-normal">(auto-generated, editable)</span>
            </label>
            <div className="relative">
              <AtSign size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text" value={username}
                onChange={e => handleUsernameChange(e.target.value)}
                placeholder="jane_d"
                className={`w-full bg-slate-950 border rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition ${
                  usernameStatus === 'available' ? 'border-emerald-600 focus:border-emerald-500' :
                  usernameStatus === 'taken' ? 'border-rose-600 focus:border-rose-500' :
                  usernameStatus === 'invalid' ? 'border-amber-600 focus:border-amber-500' :
                  'border-slate-800 focus:border-indigo-500'
                }`}
              />
              <div className="absolute right-3.5 top-3.5">
                {usernameIndicator()}
              </div>
            </div>
            {usernameStatus === 'available' && <p className="text-[11px] text-emerald-400 mt-1 pl-1">✓ Username is available</p>}
            {usernameStatus === 'taken' && <p className="text-[11px] text-rose-400 mt-1 pl-1">✗ Username is already taken</p>}
            {usernameStatus === 'invalid' && <p className="text-[11px] text-amber-400 mt-1 pl-1">Use 3-30 chars: letters, numbers, underscores</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-11 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-300 mb-1">Password Requirements:</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {([
                    [passwordCriteria.length,    'Min 8 characters'],
                    [passwordCriteria.uppercase, 'Uppercase letter'],
                    [passwordCriteria.lowercase, 'Lowercase letter'],
                    [passwordCriteria.number,    'Numerical digit'],
                    [passwordCriteria.special,   'Special character'],
                  ] as [boolean, string][]).map(([ok, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      {ok ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-slate-600" />}
                      <span className={ok ? 'text-emerald-400/80' : ''}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Role</label>
            <div className="relative">
              <Shield size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition appearance-none"
              >
                {(Object.keys(ROLE_INFO) as UserRole[]).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {role && (
              <p className={`text-[11px] mt-1.5 pl-1 ${ROLE_INFO[role].color}`}>
                {ROLE_INFO[role].desc}
              </p>
            )}
          </div>

          {/* CAPTCHA */}
          {captchaChallenge && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Security Verification</span>
                <button type="button" onClick={fetchCaptcha} className="p-1 hover:text-white text-slate-500 rounded transition flex items-center gap-1">
                  <RefreshCw size={11} />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg text-sm font-bold text-indigo-300 font-mono select-none tracking-wide flex-grow text-center">
                  {captchaChallenge.question}
                </div>
                <input
                  type="text" required value={captchaAnswer}
                  onChange={e => setCaptchaAnswer(e.target.value)}
                  placeholder="Answer"
                  className="w-24 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-100 placeholder-slate-700 text-center focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isPasswordSecure || usernameStatus === 'taken' || usernameStatus === 'invalid'}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2"
          >
            {loading
              ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <>Create Account <ArrowRight size={16} /></>
            }
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
