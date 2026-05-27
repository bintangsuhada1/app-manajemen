export type Role =
  | 'SUPER_ADMIN'
  | 'DIREKTUR'
  | 'PROJECT_MANAGER'
  | 'ADMIN'
  | 'KEUANGAN'
  | 'TEKNISI'
  | 'MARKETING';

export type ModuleKey =
  | 'dashboard'
  | 'analytics'
  | 'projects'
  | 'customers'
  | 'quotes'
  | 'invoices'
  | 'finance'
  | 'reports'
  | 'materials'
  | 'documents'
  | 'backups'
  | 'users'
  | 'settings';

const permissions: Record<Role, ModuleKey[]> = {
  SUPER_ADMIN: ['dashboard', 'analytics', 'projects', 'customers', 'quotes', 'invoices', 'finance', 'reports', 'materials', 'documents', 'backups', 'users', 'settings'],
  DIREKTUR: ['dashboard', 'analytics', 'projects', 'customers', 'quotes', 'invoices', 'finance', 'reports', 'materials', 'documents', 'settings'],
  PROJECT_MANAGER: ['dashboard', 'projects', 'reports', 'materials', 'settings'],
  ADMIN: ['dashboard', 'customers', 'quotes', 'documents', 'settings'],
  KEUANGAN: ['dashboard', 'invoices', 'finance', 'settings'],
  TEKNISI: ['dashboard', 'reports', 'settings'],
  MARKETING: ['dashboard', 'customers', 'quotes', 'settings']
};

export const hashModuleMap: Record<string, ModuleKey> = {
  '#analitik': 'analytics',
  '#proyek': 'projects',
  '#crm': 'customers',
  '#penawaran': 'quotes',
  '#invoice': 'invoices',
  '#keuangan': 'finance',
  '#laporan': 'reports',
  '#material': 'materials',
  '#dokumen': 'documents',
  '#users': 'users'
};

export function canAccess(role: string | undefined, module: ModuleKey) {
  return Boolean(role && role in permissions && permissions[role as Role].includes(module));
}

export function isReadOnlyRole(role: string | undefined) {
  return role === 'DIREKTUR';
}
