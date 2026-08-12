'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { IndustryType, BusinessSize } from '../../types/auth';
import { Building2, CheckCircle, Save, Sparkles, AlertCircle } from 'lucide-react';

export default function OrganizationPage() {
  const { organization, refreshOrganization } = useAuth();
  const [name, setName] = useState('');
  const [industryType, setIndustryType] = useState<IndustryType>('retail');
  const [businessSize, setBusinessSize] = useState<BusinessSize>('51-200');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setIndustryType(organization.industryType);
      setBusinessSize(organization.businessSize);
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      if (organization) {
        // Update existing org
        const res = await api.put(`/organization/${organization.id}`, {
          name,
          industryType,
          businessSize
        });
        if (res.data.success) {
          setMessage('Organization profile updated successfully!');
          await refreshOrganization();
        }
      } else {
        // Create new org (FR2.1)
        const res = await api.post('/organization', {
          name,
          industryType,
          businessSize
        });
        if (res.data.success) {
          setMessage('Organization profile created successfully!');
          await refreshOrganization();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save organization profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="org:manage">
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
            {/* Header banner */}
            <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-6 border border-slate-800 rounded-3xl shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                  <Sparkles size={14} />
                  <span>FR2.1 Onboarding Requirement</span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Organization Profile Setup</h1>
                <p className="text-slate-400 text-xs mt-1">
                  Configure your company profile, industry classification, and operational business scale.
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Building2 size={26} />
              </div>
            </div>

            {message && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl text-emerald-300 text-sm flex items-center gap-3">
                <CheckCircle size={18} />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-950/60 border border-rose-800/60 rounded-2xl text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Apex Global Enterprises"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Industry Type Selector (FR2.1) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Industry Type (FR2.1)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'retail', label: 'Retail & Commerce', emoji: '🛍️' },
                    { id: 'education', label: 'Education & Academics', emoji: '🎓' },
                    { id: 'healthcare', label: 'Healthcare & Pharma', emoji: '🏥' },
                    { id: 'agriculture', label: 'Agriculture & AgriTech', emoji: '🌾' },
                    { id: 'technology', label: 'Technology & SaaS', emoji: '💻' },
                    { id: 'manufacturing', label: 'Manufacturing & Goods', emoji: '🏭' },
                    { id: 'finance', label: 'Finance & Banking', emoji: '🏦' },
                    { id: 'other', label: 'Other Enterprise', emoji: '🏢' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIndustryType(item.id as IndustryType)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition ${
                        industryType === item.id
                          ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl mb-1">{item.emoji}</span>
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Size Selector (FR2.1) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Business Scale / Employee Count (FR2.1)
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {['1-10', '11-50', '51-200', '201-500', '500+'].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setBusinessSize(size as BusinessSize)}
                      className={`py-3 px-2 rounded-xl border text-center text-xs font-semibold transition ${
                        businessSize === size
                          ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-lg shadow-purple-600/20'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {size} employees
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {saving ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Save size={16} /> Save Organization Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
