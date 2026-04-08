/**
 * Role types matching the backend UserRole enum
 */
export const UserRole = {
  ADMIN: 'admin',
  ENGINEER: 'engineer',
  ARCHITECT: 'architect',
  SITE_SUPERVISOR: 'site_supervisor',
  FOREMAN: 'foreman',
  ACCOUNTING: 'accounting',
  VIEWER: 'viewer',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.ENGINEER]: 'Ingeniero',
  [UserRole.ARCHITECT]: 'Arquitecto',
  [UserRole.SITE_SUPERVISOR]: 'Supervisor de Obra',
  [UserRole.FOREMAN]: 'Capataz',
  [UserRole.ACCOUNTING]: 'Contabilidad',
  [UserRole.VIEWER]: 'Solo Lectura',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800',
  [UserRole.ENGINEER]: 'bg-blue-100 text-blue-800',
  [UserRole.ARCHITECT]: 'bg-indigo-100 text-indigo-800',
  [UserRole.SITE_SUPERVISOR]: 'bg-orange-100 text-orange-800',
  [UserRole.FOREMAN]: 'bg-yellow-100 text-yellow-800',
  [UserRole.ACCOUNTING]: 'bg-green-100 text-green-800',
  [UserRole.VIEWER]: 'bg-slate-100 text-slate-800',
};
