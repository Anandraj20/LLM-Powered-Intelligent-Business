'use client';

import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Database, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="z-10 max-w-4xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-indigo-400 shadow-xl">
          <Sparkles size={14} />
          <span>FR1 Authentication & FR2 Data Onboarding Live</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          BusinessMind <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">AI Platform</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Intelligent Enterprise Business Intelligence with Role-Based Access Control (RBAC), JWT session management, multi-format business data onboarding, and automated validation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl text-sm transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            Access Platform / Login Presets <ArrowRight size={16} />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold rounded-2xl text-sm transition flex items-center justify-center gap-2"
          >
            <LayoutDashboard size={16} /> Open Dashboard
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-white text-base">FR1 RBAC & Session Auth</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              6 predefined roles (Owner, Manager, Sales, Employee, Accountant, Admin) with JWT silent renewal and all-device logout.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <Database size={20} />
            </div>
            <h3 className="font-bold text-white text-base">FR2 Dual Onboarding</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Upload CSV/Excel spreadsheets or connect ERP/POS APIs with schema validation and row-level actionable error logs.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Sparkles size={20} />
            </div>
            <h3 className="font-bold text-white text-base">Permission Views</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Dashboard dynamically filters modules and actions according to the permissions matrix for each active user role.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
