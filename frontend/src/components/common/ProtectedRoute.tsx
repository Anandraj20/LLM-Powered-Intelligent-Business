'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Permission, UserRole } from '../../types/auth';
import { hasPermission } from '../../config/permissions';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  allowedRoles
}) => {
  const { user, activeRole, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Verifying access credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  const effectiveRole = activeRole || user.role;

  // Check role permission
  if (requiredPermission && !hasPermission(effectiveRole, requiredPermission)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900/80 backdrop-blur-md border border-rose-500/30 rounded-2xl shadow-2xl text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-400">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-slate-300 text-sm mb-6">
          Your active role <span className="px-2 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-800/40 rounded font-semibold">{effectiveRole}</span> lacks the required permission: <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded">{requiredPermission}</code>.
        </p>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-left text-xs text-slate-400 mb-6 space-y-1">
          <p className="font-semibold text-slate-300 mb-1">Role Permission Details:</p>
          <p>• Predefined RBAC Matrix dynamically restricts module actions.</p>
          <p>• Use the Role Switcher in the top bar to switch to Owner/Admin for full access demo.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30"
        >
          Return to Dashboard <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900/80 backdrop-blur-md border border-amber-500/30 rounded-2xl shadow-2xl text-center">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Role Restrict Mode</h2>
        <p className="text-slate-300 text-sm mb-6">
          This feature requires one of the following roles: <span className="text-amber-300 font-medium">{allowedRoles.join(', ')}</span>.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30"
        >
          Return to Dashboard <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
