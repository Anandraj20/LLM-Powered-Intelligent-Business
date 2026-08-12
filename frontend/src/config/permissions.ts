import { UserRole, Permission } from '../types/auth';

export const ALL_ROLES: UserRole[] = [
  'Owner',
  'Manager',
  'Sales Person',
  'Employee',
  'Accountant',
  'Admin'
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Owner: [
    'dashboard:view',
    'users:manage',
    'org:manage',
    'finance:view',
    'finance:manage',
    'sales:view',
    'sales:manage',
    'inventory:view',
    'inventory:manage',
    'onboarding:upload',
    'onboarding:import',
    'onboarding:erp_sync',
    'reports:export',
    'system:admin'
  ],
  Admin: [
    'dashboard:view',
    'users:manage',
    'org:manage',
    'finance:view',
    'sales:view',
    'sales:manage',
    'inventory:view',
    'inventory:manage',
    'onboarding:upload',
    'onboarding:import',
    'onboarding:erp_sync',
    'reports:export',
    'system:admin'
  ],
  Manager: [
    'dashboard:view',
    'org:manage',
    'finance:view',
    'sales:view',
    'sales:manage',
    'inventory:view',
    'inventory:manage',
    'onboarding:upload',
    'onboarding:import',
    'onboarding:erp_sync',
    'reports:export'
  ],
  'Sales Person': [
    'dashboard:view',
    'sales:view',
    'sales:manage',
    'inventory:view',
    'reports:export'
  ],
  Accountant: [
    'dashboard:view',
    'finance:view',
    'finance:manage',
    'sales:view',
    'reports:export',
    'onboarding:upload',
    'onboarding:import'
  ],
  Employee: [
    'dashboard:view',
    'sales:view',
    'inventory:view'
  ]
};

export const ROLE_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Owner: { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-500/40' },
  Admin: { bg: 'bg-rose-900/40', text: 'text-rose-300', border: 'border-rose-500/40' },
  Manager: { bg: 'bg-blue-900/40', text: 'text-blue-300', border: 'border-blue-500/40' },
  'Sales Person': { bg: 'bg-amber-900/40', text: 'text-amber-300', border: 'border-amber-500/40' },
  Accountant: { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  Employee: { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-600/40' },
  Guest: { bg: 'bg-slate-800/80', text: 'text-slate-400', border: 'border-slate-700' }
};

export function hasPermission(role: UserRole | string | undefined, permission: Permission): boolean {
  if (!role || role === 'Guest') return false;
  const permissions = ROLE_PERMISSIONS[role as UserRole] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole | string | undefined, permissions: Permission[]): boolean {
  if (!role || role === 'Guest') return false;
  return permissions.some(p => hasPermission(role, p));
}
