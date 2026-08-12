'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { hasPermission, ROLE_BADGE_COLORS } from '../../config/permissions';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  UploadCloud,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const { user, activeRole, organization } = useAuth();
  const currentRole = activeRole || user?.role || 'Guest';

  const canViewSales = hasPermission(currentRole, 'sales:view');
  const canManageSales = hasPermission(currentRole, 'sales:manage');
  const canViewFinance = hasPermission(currentRole, 'finance:view');
  const canManageFinance = hasPermission(currentRole, 'finance:manage');
  const canViewInventory = hasPermission(currentRole, 'inventory:view');
  const canManageInventory = hasPermission(currentRole, 'inventory:manage');
  const canUploadData = hasPermission(currentRole, 'onboarding:upload');
  const canManageUsers = hasPermission(currentRole, 'users:manage');
  const canAdminSystem = hasPermission(currentRole, 'system:admin');

  const roleStyle = ROLE_BADGE_COLORS[currentRole] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700'
  };

  return (
    <ProtectedRoute requiredPermission="dashboard:view">
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />

          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 z-10">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <Sparkles size={14} />
                  <span>BusinessMind AI Enterprise Dashboard</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Welcome back, {user?.name || 'User'}!
                </h1>
                <p className="text-slate-400 text-sm max-w-xl">
                  Logged in with <span className={`px-2 py-0.5 rounded text-xs font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>{currentRole}</span> role. The interface below dynamically renders only permitted modules and actions (FR1.4).
                </p>
              </div>

              <div className="flex items-center gap-3 z-10">
                {canUploadData && (
                  <Link
                    href="/onboarding"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <UploadCloud size={16} /> Onboard Data (FR2)
                  </Link>
                )}
              </div>
            </div>

            {/* Permission-Scoped Module Cards Grid (FR1.4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* 1. Sales Module (FR1.4: Permitted for Owner, Admin, Manager, Sales Person, Accountant) */}
              {canViewSales ? (
                <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <TrendingUp size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        Sales Module
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Sales & Revenue</h3>
                    <p className="text-slate-400 text-xs">Track active deals, conversion metrics, and pipeline transactions.</p>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Total Q3 Revenue:</span>
                        <span className="font-bold text-emerald-400">$142,850.00</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Active Deals:</span>
                        <span className="font-bold text-slate-200">28 Deals</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {canManageSales ? 'Full Edit Access' : 'Read-Only Access'}
                    </span>
                    {canManageSales && (
                      <button className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                        <Plus size={14} /> Add Deal
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 text-slate-600 flex flex-col justify-center items-center text-center opacity-60">
                  <TrendingUp size={24} className="mb-2" />
                  <p className="text-xs font-semibold">Sales Module Restricted</p>
                  <p className="text-[10px] text-slate-600 mt-1">Role '{currentRole}' lacks sales:view permission</p>
                </div>
              )}

              {/* 2. Finance & Accounting Module (FR1.4: Permitted for Owner, Admin, Manager, Accountant) */}
              {canViewFinance ? (
                <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <DollarSign size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Finance Module
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Financial Ledger</h3>
                    <p className="text-slate-400 text-xs">Manage profit & loss ledgers, expenses, and accounting records.</p>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Net Profit Margin:</span>
                        <span className="font-bold text-emerald-400">+24.5%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Operating Expenses:</span>
                        <span className="font-bold text-slate-200">$38,200.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {canManageFinance ? 'Full Financial Control' : 'Read-Only Ledger'}
                    </span>
                    {canManageFinance && (
                      <button className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                        <Plus size={14} /> Record Entry
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 text-slate-600 flex flex-col justify-center items-center text-center opacity-60">
                  <DollarSign size={24} className="mb-2" />
                  <p className="text-xs font-semibold">Finance Module Restricted</p>
                  <p className="text-[10px] text-slate-600 mt-1">Role '{currentRole}' lacks finance:view permission</p>
                </div>
              )}

              {/* 3. Inventory Control Module (FR1.4: Permitted for Owner, Admin, Manager, Sales Person, Employee) */}
              {canViewInventory ? (
                <div className="bg-slate-900/90 backdrop-blur-md border border-blue-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Package size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        Inventory Module
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Inventory & Stock</h3>
                    <p className="text-slate-400 text-xs">Monitor warehouse stock levels, SKUs, and reorder alerts.</p>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Total In-Stock Items:</span>
                        <span className="font-bold text-white">1,420 Units</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Low Stock Warnings:</span>
                        <span className="font-bold text-amber-400">3 SKUs</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {canManageInventory ? 'Stock Update Access' : 'Stock Viewer'}
                    </span>
                    {canManageInventory && (
                      <button className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                        <Plus size={14} /> Update Stock
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 text-slate-600 flex flex-col justify-center items-center text-center opacity-60">
                  <Package size={24} className="mb-2" />
                  <p className="text-xs font-semibold">Inventory Module Restricted</p>
                  <p className="text-[10px] text-slate-600 mt-1">Role '{currentRole}' lacks inventory:view permission</p>
                </div>
              )}

              {/* 4. Data Onboarding Module (FR2: Upload & ERP API Connections) */}
              {canUploadData ? (
                <div className="bg-slate-900/90 backdrop-blur-md border border-indigo-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <UploadCloud size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        Data Onboarding FR2
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Business Data Pipeline</h3>
                    <p className="text-slate-400 text-xs">Upload CSV/Excel or trigger ERP/POS API sync with live validation.</p>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Ingestion Pathways:</span>
                        <span className="font-bold text-indigo-300">CSV, Excel & ERP API</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Pipeline Status:</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Validation & Preview</span>
                    <Link
                      href="/onboarding"
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      Open Pipeline <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ) : null}

              {/* 5. User Management Module (FR1.2 RBAC Admin) */}
              {canManageUsers ? (
                <div className="bg-slate-900/90 backdrop-blur-md border border-purple-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <Users size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        User Admin
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Team & Role Access</h3>
                    <p className="text-slate-400 text-xs">Manage team members across the 6 predefined RBAC roles.</p>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Active Roles Configured:</span>
                        <span className="font-bold text-purple-300">6 Predefined Roles</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Matrix Enforcement:</span>
                        <span className="font-bold text-emerald-400">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">RBAC Administrator</span>
                    <button className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                      Manage Roles
                    </button>
                  </div>
                </div>
              ) : null}

              {/* 6. System Admin Settings (Owner & Admin Only) */}
              {canAdminSystem ? (
                <div className="bg-slate-900/90 backdrop-blur-md border border-rose-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <ShieldCheck size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        System Admin
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Security & Session Audit</h3>
                    <p className="text-slate-400 text-xs">Manage active sessions, JWT secret rotation, and audit logs.</p>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Session Revocation:</span>
                        <span className="font-bold text-rose-300">FR1.6 Enabled</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Password Encryption:</span>
                        <span className="font-bold text-emerald-400">bcrypt Salted</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">System Governance</span>
                    <button className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                      Audit Logs
                    </button>
                  </div>
                </div>
              ) : null}

            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
