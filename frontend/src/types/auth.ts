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

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  emailVerified: boolean;
  authProvider?: 'local' | 'google';
  avatarUrl?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type IndustryType =
  | 'retail'
  | 'education'
  | 'healthcare'
  | 'agriculture'
  | 'technology'
  | 'manufacturing'
  | 'finance'
  | 'other';

export type BusinessSize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';

export interface Organization {
  id: string;
  name: string;
  industryType: IndustryType;
  businessSize: BusinessSize;
  ownerId: string;
  createdAt: string;
}

export type DatasetType = 'sales' | 'inventory' | 'customers' | 'finance';

export interface ValidationErrorDetail {
  row: number;
  column: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface OnboardingBatch {
  id: string;
  organizationId: string;
  uploadedBy: string;
  sourceType: 'file_upload' | 'erp_api';
  fileName: string;
  datasetType: DatasetType;
  status: 'pending_preview' | 'imported' | 'failed' | 'rejected';
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: ValidationErrorDetail[];
  previewData: Record<string, any>[];
  createdAt: string;
  importedAt?: string;
}
