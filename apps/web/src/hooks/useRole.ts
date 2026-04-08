import { useAuth } from '../context/AuthContext';

/**
 * Hook for role-based access control in the frontend.
 *
 * Usage:
 *   const { can, isAdmin, role } = useRole();
 *   if (can('manage_users')) { ... }
 *   if (isAdmin) { ... }
 */

// Role hierarchy: admin > engineer > architect > site_supervisor > accounting > foreman > viewer
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  engineer: 80,
  architect: 80,
  accounting: 60,
  site_supervisor: 50,
  foreman: 30,
  viewer: 10,
};

// Permission matrix — what each role can do
const PERMISSIONS: Record<string, string[]> = {
  admin: [
    'manage_users',
    'manage_company',
    'delete_projects',
    'manage_budgets',
    'approve_invoices',
    'view_financials',
    'manage_workers',
    'manage_documents',
    'manage_rfis',
    'manage_submittals',
    'manage_punch_list',
    'view_reports',
    'export_data',
    'manage_bim',
    'manage_apu',
    'manage_resources',
    'set_markup',
  ],
  engineer: [
    'manage_budgets',
    'manage_documents',
    'manage_rfis',
    'manage_submittals',
    'manage_punch_list',
    'view_financials',
    'view_reports',
    'export_data',
    'manage_bim',
    'manage_apu',
    'manage_resources',
    'set_markup',
  ],
  architect: [
    'manage_budgets',
    'manage_documents',
    'manage_rfis',
    'manage_bim',
    'manage_apu',
    'view_financials',
    'view_reports',
    'export_data',
  ],
  accounting: [
    'approve_invoices',
    'view_financials',
    'view_reports',
    'export_data',
    'manage_workers',
  ],
  site_supervisor: [
    'manage_punch_list',
    'manage_rfis',
    'view_reports',
    'manage_workers',
  ],
  foreman: [
    'manage_punch_list',
    'view_reports',
  ],
  viewer: [
    'view_reports',
  ],
};

export type Permission = string;

export function useRole() {
  const { user } = useAuth();
  const role = (user?.role || 'viewer') as string;
  const myLevel = ROLE_HIERARCHY[role] ?? 0;
  const myPermissions = PERMISSIONS[role] ?? PERMISSIONS['viewer'];

  /**
   * Check if the current user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    return myPermissions.includes(permission);
  };

  /**
   * Check if the current user's role is at least as high as the required role
   */
  const hasMinRole = (minRole: string): boolean => {
    const minLevel = ROLE_HIERARCHY[minRole] ?? 0;
    return myLevel >= minLevel;
  };

  return {
    role,
    can,
    hasMinRole,
    isAdmin: role === 'admin',
    isEngineer: role === 'engineer' || role === 'architect',
    isFieldUser: role === 'site_supervisor' || role === 'foreman',
    isAccounting: role === 'accounting',
    isViewer: role === 'viewer',
    permissions: myPermissions,
  };
}
