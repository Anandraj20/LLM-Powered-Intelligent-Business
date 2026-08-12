'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ALL_ROLES, ROLE_BADGE_COLORS } from '../../config/permissions';
import { UserRole } from '../../types/auth';
import {
  User as UserIcon,
  LogOut,
  Shield,
  Building,
  ChevronDown,
  Globe,
  Radio
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, activeRole, organization, logout, logoutAll, switchRoleForDemo } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentRole: UserRole | 'Guest' = activeRole || user?.role || 'Guest';
  const roleBadgeStyle = ROLE_BADGE_COLORS[currentRole] || ROLE_BADGE_COLORS['Guest'];

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Organization context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
          <Building size={14} className="text-indigo-400" />
          <span>{organization ? organization.name : 'No Organization Set'}</span>
          {organization && (
            <span className="text-[10px] bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700">
              {organization.industryType} • {organization.businessSize}
            </span>
          )}
        </div>
      </div>

      {/* Right: Role Switcher & User Actions */}
      <div className="flex items-center gap-4">
        {/* Interactive Role Switcher Dropdown (FR1.4 Demo Tool) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${roleBadgeStyle.bg} ${roleBadgeStyle.text} ${roleBadgeStyle.border}`}
          >
            <Shield size={14} />
            <span>Active Role: {currentRole}</span>
            <ChevronDown size={14} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                <span>Switch Role (RBAC Matrix Demo)</span>
                <Radio size={12} className="text-emerald-400 animate-pulse" />
              </div>
              {ALL_ROLES.map((role: UserRole) => (
                <button
                  key={role}
                  onClick={() => {
                    switchRoleForDemo(role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                    currentRole === role
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{role}</span>
                  {currentRole === role && <span className="text-[10px] text-indigo-400 font-bold">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-white leading-tight">{user?.name || 'Guest User'}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{user?.email || 'not signed in'}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-xs">
              <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 mb-2">
                <p className="font-semibold text-white">{user?.name}</p>
                <p className="text-slate-400">{user?.email}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <Globe size={12} />
                  <span>Session Active (JWT Silent Renewal On)</span>
                </div>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-left transition"
                >
                  <LogOut size={14} className="text-amber-400" />
                  <span>Logout Current Session</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logoutAll();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-950/40 text-left transition"
                >
                  <LogOut size={14} className="text-rose-400" />
                  <span>Logout From All Devices (FR1.6)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
