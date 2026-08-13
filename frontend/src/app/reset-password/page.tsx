'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../context/AuthContext';
import { KeyRound, Mail, Lock, CheckCircle2, ArrowLeft, RefreshCw, Check, X } from 'lucide-react';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // CAPTCHA State
  const [captchaChallenge, setCaptchaChallenge] = useState<{ question: string; token: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

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
    if (step === 'confirm') {
      fetchCaptcha();
    }
  }, [step]);

  // Password Policy validation
  const passwordCriteria = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[@$!%*?&()._#^+-]/.test(newPassword)
  };

  const isPasswordSecure = Object.values(passwordCriteria).every(Boolean);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.data?.resetToken) {
        setToken(res.data.data.resetToken);
        setMessage(`Password reset token generated: ${res.data.data.resetToken}`);
        setStep('confirm');
      } else {
        setMessage('If an account exists with that email, reset instructions have been sent.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isPasswordSecure) {
      setError('Please ensure your password meets all complexity requirements.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
        captchaToken: captchaChallenge?.token,
        captchaAnswer
      });
      setMessage('Password reset successful! All active sessions have been revoked. You may now log in.');
      setNewPassword('');
      setToken('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset failed');
      fetchCaptcha(); // Refresh CAPTCHA challenge on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-amber-500/20">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Account Recovery</h1>
          <p className="text-slate-400 text-xs mt-1">Reset password & enforce session revocation (FR1.6)</p>
        </div>

        {message && (
          <div className="mb-6 p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="owner@businessmind.ai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending Request...' : 'Generate Reset Token'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste token here"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Password complexity checklist */}
              {newPassword.length > 0 && (
                <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5 text-[11px] text-slate-400 animate-fade-in">
                  <div className="font-semibold text-slate-300 mb-1">New Password Requirements:</div>
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

            {/* CAPTCHA validation step */}
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
                    className="w-24 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-100 placeholder-slate-700 text-center focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isPasswordSecure}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:from-amber-800/20 disabled:to-rose-800/20 disabled:text-slate-600 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
            >
              {loading ? 'Updating Password...' : 'Reset Password & Revoke Sessions'}
            </button>

            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full text-center text-xs text-slate-400 hover:text-white transition mt-2 font-medium"
            >
              Back to request token
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/login" className="text-slate-400 hover:text-white inline-flex items-center gap-1.5 font-medium">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
