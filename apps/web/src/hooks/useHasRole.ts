import { useMemo } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';

/**
 * useHasRole - Hook para verificar permisos del usuario actual
 * 
 * Usage:
 * const canExport = useHasRole(['admin']);
 * const isManager = useHasRole(['manager']);
 * const isAdminOrManager = useHasRole(['admin', 'manager']);
 * 
 * @param allowedRoles - Array de roles permitidos
 * @returns true si el usuario tiene alguno de los roles permitidos
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const { user } = useAuth();

  const hasRole = useMemo(() => {
    if (!user || !user.role) {
      return false;
    }
    return allowedRoles.includes(user.role);
  }, [user?.role, allowedRoles]);

  return hasRole;
}

/**
 * useHasAnyRole - Hook para verificar si el usuario tiene alguno de los roles dados
 * (Alias para useHasRole para mejor claridad)
 */
export function useHasAnyRole(allowedRoles: UserRole[]): boolean {
  return useHasRole(allowedRoles);
}

/**
 * useHasAllRoles - Hook para verificar si el usuario tiene TODOS los roles dados
 * Útil para casos donde se requieren múltiples permisos
 */
export function useHasAllRoles(requiredRoles: UserRole[]): boolean {
  const { user } = useAuth();

  const hasAllRoles = useMemo(() => {
    if (!user || !user.role) {
      return false;
    }
    return requiredRoles.every((role) => user.role === role);
  }, [user?.role, requiredRoles]);

  return hasAllRoles;
}

/**
 * useCurrentRole - Hook para obtener el rol actual del usuario
 */
export function useCurrentRole(): UserRole | null {
  const { user } = useAuth();
  return user?.role ?? null;
}

/**
 * useIsRole - Hook para verificar si el usuario tiene un rol específico
 */
export function useIsRole(role: UserRole): boolean {
  const { user } = useAuth();
  return user?.role === role;
}