import { useMemo } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';

export function useHasRole(allowedRoles: UserRole[]): boolean {
  const { user } = useAuth();

  const hasRole = useMemo(() => {
    const userRole = user?.role;
    if (!userRole) {
      return false;
    }
    return allowedRoles.includes(userRole);
  }, [user, allowedRoles]);

  return hasRole;
}

export function useHasAnyRole(allowedRoles: UserRole[]): boolean {
  return useHasRole(allowedRoles);
}

export function useHasAllRoles(requiredRoles: UserRole[]): boolean {
  const { user } = useAuth();

  const hasAllRoles = useMemo(() => {
    const userRole = user?.role;
    if (!userRole) {
      return false;
    }
    return requiredRoles.every((role) => userRole === role);
  }, [user, requiredRoles]);

  return hasAllRoles;
}

export function useCurrentRole(): UserRole | null {
  const { user } = useAuth();
  return user?.role ?? null;
}