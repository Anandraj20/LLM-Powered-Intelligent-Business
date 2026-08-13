'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, api } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { UserPlus, Mail, Lock, User as UserIcon, Shield, ArrowRight, RefreshCw, Check, X } from 'lucide-react';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Owner');
  const [error, setError] = useState<string | null>(null);

  // CAPTCHA State
  const [captchaChallenge, setCaptchaChallenge] = useState<{ question: string; token: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Fetch CAPTCHA on mount
  const fetchCaptcha = async () => {
    try {
      const res = await api.get('/auth/captcha');
      if (res.data.success) {
        setCaptchaChallenge(res.data.data);
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Failed to load CAPTCHA');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Password Policy requirements validation
  const passwordCriteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&()._#^+-]/.test(password)
  };

  const isPasswordSecure = Object.values(passwordCriteria).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordSecure) {
      setError('Please ensure your password meets all complexity requirements.');
      return;
    }

    try {
      await register(email, password, name, role, captchaChallenge?.token, captchaAnswer);
      if (typeof window !== 'undefined') {
        window.location.href = '/organization';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
      fetchCaptcha(); // Refresh CAPTCHA challenge on failure
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <UserPlus size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-slate-400 text-xs mt-1">Get started with BusinessMind AI Platform</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
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

            {/* Password Complexity Policy Checklist Visualizer */}
            {password.length > 0 && (
              <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-300 mb-1">Password Requirements:</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    {passwordCriteria.length ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-slate-600" />}
                    <span className={passwordCriteria.length ? 'text-emerald-400/80' : ''}>Min 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordCriteria.uppercase ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-slate-600" />}
                    <span className={passwordCriteria.uppercase ? 'text-emerald-400/80' : ''}>Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordCriteria.lowercase ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-slate-600" />}
                    <span className={passwordCriteria.lowercase ? 'text-emerald-400/80' : ''}>Lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordCriteria.number ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-slate-600" />}
                    <span className={passwordCriteria.number ? 'text-emerald-400/80' : ''}>Numerical digit</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    {passwordCriteria.special ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-slate-600" />}
                    <span className={passwordCriteria.special ? 'text-emerald-400/80' : ''}>Special character (@$!%*?&.-)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Initial Account Role</label>
            <div className="relative">
              <Shield size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Owner">Owner (Full Admin Access & Org Creation)</option>
                <option value="Admin">Admin (System Administrator)</option>
                <option value="Manager">Manager (Operations & Sales)</option>
                <option value="Sales Person">Sales Person (Deals & Inventory)</option>
                <option value="Accountant">Accountant (Financial Management)</option>
                <option value="Employee">Employee (Basic Access)</option>
              </select>
            </div>
          </div>

          {/* CAPTCHA challenge */}
          {captchaChallenge && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Security Verification</span>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="p-1 hover:text-white text-slate-500 rounded transition flex items-center gap-1"
                >
                  <RefreshCw size={11} />
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
                  placeholder="Answer"
                  className="w-24 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-100 placeholder-slate-700 text-center focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isPasswordSecure}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-800/20 disabled:to-purple-800/20 disabled:text-slate-600 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Create Account <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
