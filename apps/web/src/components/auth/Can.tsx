import { type ReactNode } from 'react';
import { useRole, type Permission } from '../../hooks/useRole';

interface CanProps {
  do: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render based on permissions.
 *
 * Usage:
 *   <Can do="manage_users">
 *     <button>Invite User</button>
 *   </Can>
 *
 *   <Can do="approve_invoices" fallback={<span>No tienes permiso</span>}>
 *     <ApproveButton />
 *   </Can>
 */
export function Can({ do: permission, children, fallback = null }: CanProps) {
  const { can } = useRole();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only for admin role.
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = useRole();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}

interface RoleBadgeProps {
  role: string;
  className?: string;
}

const ROLE_STYLES: Record<string, { label: string; classes: string }> = {
  admin:           { label: 'Administrador',     classes: 'bg-purple-100 text-purple-800 border-purple-200' },
  engineer:        { label: 'Ingeniero',          classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  architect:       { label: 'Arquitecto',         classes: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  site_supervisor: { label: 'Supervisor de Obra', classes: 'bg-orange-100 text-orange-800 border-orange-200' },
  foreman:         { label: 'Capataz',            classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  accounting:      { label: 'Contabilidad',       classes: 'bg-green-100 text-green-800 border-green-200' },
  viewer:          { label: 'Solo Lectura',        classes: 'bg-slate-100 text-slate-700 border-slate-200' },
};

/**
 * Badge displaying a user's role with appropriate color coding.
 */
export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES['viewer'];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.classes} ${className}`}
    >
      {style.label}
    </span>
  );
}
