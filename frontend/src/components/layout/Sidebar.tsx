'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../config/permissions';
import { Permission } from '../../types/auth';
import {
  LayoutDashboard,
  UploadCloud,
  Building2,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  requiredPermission?: Permission;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { activeRole, user } = useAuth();
  const role = activeRole || user?.role;

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      requiredPermission: 'dashboard:view'
    },
    {
      label: 'Data Onboarding',
      href: '/onboarding',
      icon: UploadCloud,
      requiredPermission: 'onboarding:upload',
      badge: 'FR2'
    },
    {
      label: 'Organization Profile',
      href: '/organization',
      icon: Building2,
      requiredPermission: 'org:manage',
      badge: 'FR2.1'
    },
    {
      label: 'Sales Module',
      href: '/dashboard#sales',
      icon: TrendingUp,
      requiredPermission: 'sales:view'
    },
    {
      label: 'Finance & Accounting',
      href: '/dashboard#finance',
      icon: DollarSign,
      requiredPermission: 'finance:view'
    },
    {
      label: 'Inventory Control',
      href: '/dashboard#inventory',
      icon: Package,
      requiredPermission: 'inventory:view'
    },
    {
      label: 'User Management',
      href: '/dashboard#users',
      icon: Users,
      requiredPermission: 'users:manage'
    }
  ];

  // FR1.4: Dynamically filter allowed modules for current user role
  const visibleNavItems = navItems.filter(item => {
    if (!item.requiredPermission) return true;
    return hasPermission(role, item.requiredPermission);
  });

  return (
    <aside className="w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 text-slate-200 flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Zap size={22} className="fill-white" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-lg leading-none">BusinessMind</h1>
          <span className="text-[11px] text-indigo-400 font-semibold tracking-wider uppercase">AI Platform</span>
        </div>
      </div>

      {/* Dynamic Navigation */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Permission-Scoped Views
        </div>

        {visibleNavItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Role Summary Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>RBAC Matrix Active</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Rendering {visibleNavItems.length} permitted modules for role <strong className="text-slate-300">{role || 'Guest'}</strong>.
        </p>
      </div>
    </aside>
  );
};
