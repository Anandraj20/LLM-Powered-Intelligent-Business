'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { IndustryType, BusinessSize, Organization } from '../../types/auth';
import {
  Building2,
  CheckCircle,
  Save,
  Sparkles,
  AlertCircle,
  Plus,
  Check,
  Edit3,
  Trash2,
  X,
  ExternalLink,
  ShieldCheck,
  Layers,
  Users,
  Briefcase
} from 'lucide-react';

const INDUSTRY_OPTIONS: { id: IndustryType; label: string; emoji: string }[] = [
  { id: 'retail', label: 'Retail & Commerce', emoji: '🛍️' },
  { id: 'education', label: 'Education & Academics', emoji: '🎓' },
  { id: 'healthcare', label: 'Healthcare & Pharma', emoji: '🏥' },
  { id: 'agriculture', label: 'Agriculture & AgriTech', emoji: '🌾' },
  { id: 'technology', label: 'Technology & SaaS', emoji: '💻' },
  { id: 'manufacturing', label: 'Manufacturing & Goods', emoji: '🏭' },
  { id: 'finance', label: 'Finance & Banking', emoji: '🏦' },
  { id: 'other', label: 'Other Enterprise', emoji: '🏢' }
];

const SIZE_OPTIONS: BusinessSize[] = ['1-10', '11-50', '51-200', '201-500', '500+'];

export default function OrganizationPage() {
  const {
    organization,
    organizations,
    switchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization
  } = useAuth();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);

  // Form states for Create
  const [createName, setCreateName] = useState('');
  const [createIndustry, setCreateIndustry] = useState<IndustryType>('technology');
  const [createSize, setCreateSize] = useState<BusinessSize>('11-50');

  // Form states for Edit
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState<IndustryType>('technology');
  const [editSize, setEditSize] = useState<BusinessSize>('11-50');

  // Loading & Alert state
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Open Edit Modal
  const handleOpenEdit = (org: Organization) => {
    setEditingOrg(org);
    setEditName(org.name);
    setEditIndustry(org.industryType);
    setEditSize(org.businessSize);
    setError(null);
    setMessage(null);
  };

  // Submit Create New Organization
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setError('Organization name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const newOrg = await createOrganization({
        name: createName.trim(),
        industryType: createIndustry,
        businessSize: createSize
      });
      setMessage(`Organization "${newOrg.name}" created successfully and set as active workspace!`);
      setShowCreateModal(false);
      setCreateName('');
      setCreateIndustry('technology');
      setCreateSize('11-50');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create organization.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Organization
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    if (!editName.trim()) {
      setError('Organization name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await updateOrganization(editingOrg.id, {
        name: editName.trim(),
        industryType: editIndustry,
        businessSize: editSize
      });
      setMessage(`Organization "${editName}" updated successfully!`);
      setEditingOrg(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update organization.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Organization
  const handleConfirmDelete = async () => {
    if (!orgToDelete) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await deleteOrganization(orgToDelete.id);
      setMessage(`Organization "${orgToDelete.name}" deleted.`);
      setOrgToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete organization.');
    } finally {
      setSubmitting(false);
    }
  };

  // Active switch handler
  const handleSwitch = async (orgId: string, orgName: string) => {
    try {
      await switchOrganization(orgId);
      setMessage(`Switched active workspace to "${orgName}".`);
    } catch (err: any) {
      setError('Failed to switch active organization.');
    }
  };

  return (
    <ProtectedRoute requiredPermission="org:manage">
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />

          <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
            {/* Header banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/80 backdrop-blur-md p-6 sm:p-8 border border-slate-800 rounded-3xl shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                  <Sparkles size={14} />
                  <span>Multi-Tenant Architecture</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Multi-Organization Management
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                  Configure, scale, and seamlessly switch between multiple business organizations from a single administrator session.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setError(null);
                    setMessage(null);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/25 flex items-center gap-2"
                >
                  <Plus size={16} /> Create Organization
                </button>
              </div>
            </div>

            {/* Notification messages */}
            {message && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                  <span>{message}</span>
                </div>
                <button onClick={() => setMessage(null)} className="text-emerald-400 hover:text-emerald-200">
                  <X size={16} />
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-950/60 border border-rose-800/60 rounded-2xl text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={18} className="text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Metric Overview Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">Total Organizations</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <Building2 size={16} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{organizations.length}</p>
                <p className="text-[11px] text-slate-500 mt-1">Managed under this admin</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">Active Workspace</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                    <Check size={16} />
                  </div>
                </div>
                <p className="text-lg font-bold text-white truncate">
                  {organization?.name || 'None Active'}
                </p>
                <p className="text-[11px] text-emerald-400 mt-1 capitalize">
                  {organization ? `${organization.industryType} Industry` : 'Select an organization'}
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">Active Scale</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">
                  {organization?.businessSize || 'N/A'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Staff count bracket</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">Data Scoping</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <p className="text-base font-bold text-white">Multi-Tenant</p>
                <p className="text-[11px] text-blue-400 mt-1">Full context isolation</p>
              </div>
            </div>

            {/* Organizations Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-indigo-400" />
                  <span>Managed Organizations ({organizations.length})</span>
                </h2>
                <span className="text-xs text-slate-400">
                  Switching active workspace scopes live BI metrics, datasets, and chat history.
                </span>
              </div>

              {organizations.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
                  <Building2 size={40} className="mx-auto text-slate-600 mb-3" />
                  <h3 className="text-base font-bold text-white">No Organizations Created Yet</h3>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                    Get started by creating your first business organization profile to enable analytics and data onboarding.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition"
                  >
                    Create First Organization
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {organizations.map(org => {
                    const isActive = org.id === organization?.id;
                    const industryInfo = INDUSTRY_OPTIONS.find(i => i.id === org.industryType) || {
                      label: org.industryType,
                      emoji: '🏢'
                    };

                    return (
                      <div
                        key={org.id}
                        className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 ${
                          isActive
                            ? 'bg-slate-900/95 border-indigo-500 shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-500/40'
                            : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          {/* Card Header with Status */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{industryInfo.emoji}</span>
                            {isActive ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Active Workspace
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-medium">
                                Inactive
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-white leading-snug truncate" title={org.name}>
                            {org.name}
                          </h3>

                          {/* Industry & Size tags */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-xs font-semibold">
                              {industryInfo.label}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold">
                              {org.businessSize} staff
                            </span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between">
                            <span>ID: {org.id.slice(0, 8)}...</span>
                            <span>
                              Created {new Date(org.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/60">
                          {isActive ? (
                            <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                              <Check size={14} className="stroke-[3]" /> Currently Selected
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSwitch(org.id, org.name)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 rounded-lg text-xs font-medium transition"
                            >
                              Set as Active
                            </button>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(org)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                              title="Edit Profile"
                            >
                              <Edit3 size={15} />
                            </button>
                            {organizations.length > 1 && (
                              <button
                                onClick={() => setOrgToDelete(org)}
                                className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition"
                                title="Delete Organization"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CREATE ORGANIZATION MODAL */}
            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Create New Organization</h3>
                        <p className="text-slate-400 text-xs">Add a new business workspace to your admin account</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Organization / Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={createName}
                        onChange={e => setCreateName(e.target.value)}
                        placeholder="e.g. Apex Global Logistics"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Industry Domain
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {INDUSTRY_OPTIONS.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCreateIndustry(item.id)}
                            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                              createIndustry === item.id
                                ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-lg mb-1">{item.emoji}</span>
                            <span className="text-[11px] font-semibold">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Business Scale / Employee Headcount
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {SIZE_OPTIONS.map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setCreateSize(size)}
                            className={`py-2 px-1 rounded-xl border text-center text-xs font-semibold transition ${
                              createSize === size
                                ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-md shadow-purple-600/20'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                      >
                        {submitting ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <Plus size={15} /> Create Organization
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* EDIT ORGANIZATION MODAL */}
            {editingOrg && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                        <Edit3 size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Edit Organization Profile</h3>
                        <p className="text-slate-400 text-xs">Update metadata for {editingOrg.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingOrg(null)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleEditSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Industry Domain
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {INDUSTRY_OPTIONS.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setEditIndustry(item.id)}
                            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                              editIndustry === item.id
                                ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-lg mb-1">{item.emoji}</span>
                            <span className="text-[11px] font-semibold">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Business Scale / Employee Headcount
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {SIZE_OPTIONS.map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setEditSize(size)}
                            className={`py-2 px-1 rounded-xl border text-center text-xs font-semibold transition ${
                              editSize === size
                                ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-md shadow-purple-600/20'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingOrg(null)}
                        className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                      >
                        {submitting ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <Save size={15} /> Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {orgToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Delete Organization?</h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Are you sure you want to delete <strong className="text-white">"{orgToDelete.name}"</strong>? This will remove its profile and associated settings.
                    </p>
                  </div>
                  <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setOrgToDelete(null)}
                      className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleConfirmDelete}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      {submitting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
