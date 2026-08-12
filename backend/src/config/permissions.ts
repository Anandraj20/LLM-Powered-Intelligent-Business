export type UserRole = 'Owner' | 'Manager' | 'Sales Person' | 'Employee' | 'Accountant' | 'Admin';

export type Permission =
  | 'dashboard:view'
  | 'users:manage'
  | 'org:manage'
  | 'finance:view'
  | 'finance:manage'
  | 'sales:view'
  | 'sales:manage'
  | 'inventory:view'
  | 'inventory:manage'
  | 'onboarding:upload'
  | 'onboarding:import'
  | 'onboarding:erp_sync'
  | 'reports:export'
  | 'system:admin';

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

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}
