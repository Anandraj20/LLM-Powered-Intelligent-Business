'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Radio,
  Plus,
  Check,
  Building2,
  ExternalLink
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, activeRole, organization, organizations, switchOrganization, logout, logoutAll, switchRoleForDemo } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);

  const currentRole: UserRole | 'Guest' = activeRole || user?.role || 'Guest';
  const roleBadgeStyle = ROLE_BADGE_COLORS[currentRole] || ROLE_BADGE_COLORS['Guest'];

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Interactive Multi-Organization Switcher */}
      <div className="relative">
        <button
          onClick={() => {
            setShowOrgMenu(!showOrgMenu);
            setShowRoleMenu(false);
            setShowUserMenu(false);
          }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 text-xs font-medium text-slate-200 transition shadow-sm group"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <Building size={13} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white max-w-[150px] truncate">
                {organization ? organization.name : 'Select Organization'}
              </span>
              {organization && (
                <span className="text-[10px] bg-indigo-950/80 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-800/60 uppercase font-mono">
                  {organization.industryType}
                </span>
              )}
            </div>
          </div>
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${showOrgMenu ? 'rotate-180 text-indigo-400' : ''}`} />
        </button>

        {/* Multi-Organization Popover Menu */}
        {showOrgMenu && (
          <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between mb-1.5">
              <span>Managed Organizations</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-400 font-mono">
                {organizations.length} {organizations.length === 1 ? 'Org' : 'Orgs'}
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 my-1">
              {organizations.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">
                  <Building2 size={24} className="mx-auto mb-1.5 text-slate-600" />
                  <p>No organizations found.</p>
                  <p className="text-[10px] text-slate-500">Create one below to start.</p>
                </div>
              ) : (
                organizations.map(org => {
                  const isActive = org.id === organization?.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => {
                        switchOrganization(org.id);
                        setShowOrgMenu(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between ${
                        isActive
                          ? 'bg-indigo-600/20 border border-indigo-500/50 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold truncate">{org.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">
                            {org.industryType} • {org.businessSize} staff
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1 text-indigo-400 shrink-0">
                          <Check size={14} className="stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1">
              <Link
                href="/organization"
                onClick={() => setShowOrgMenu(false)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20"
              >
                <Plus size={14} />
                <span>Add / Manage Organizations</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right: Role Switcher & User Actions */}
      <div className="flex items-center gap-4">
        {/* Interactive Role Switcher Dropdown (FR1.4 Demo Tool) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowOrgMenu(false);
              setShowUserMenu(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${roleBadgeStyle.bg} ${roleBadgeStyle.text} ${roleBadgeStyle.border}`}
          >
            <Shield size={14} />
            <span>Active Role: {currentRole}</span>
            <ChevronDown size={14} className={`transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
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
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowOrgMenu(false);
              setShowRoleMenu(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-white leading-tight">{user?.name || 'Guest User'}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{user?.email || 'not signed in'}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
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
