import { Navigate, type Location } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
  returnTo?: Location;
}

/**
 * ProtectedRoute - Higher-Order Component for Role-Based Access Control
 * 
 * Usage:
 * <ProtectedRoute allowedRoles={['admin', 'manager']}>
 *   <AnalyticsDashboard />
 * </ProtectedRoute>
 * 
 * Or in route definition:
 * <Route path="/analytics" element={
 *   <ProtectedRoute allowedRoles={['admin', 'manager']}>
 *     <AnalyticsDashboard />
 *   </ProtectedRoute>
 * } />
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackPath = '/dashboard',
}: ProtectedRouteProps) {
  const { user, isLoading, isConfigured } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <AccessDenied 
        currentRole={user.role}
        requiredRoles={allowedRoles}
        fallbackPath={fallbackPath}
      />
    );
  }

  return <>{children}</>;
}

/**
 * AccessDenied - Access Denied UI Component
 * Shows when user doesn't have required role
 */
function AccessDenied({
  currentRole,
  requiredRoles,
  fallbackPath,
}: {
  currentRole: UserRole;
  requiredRoles: UserRole[];
  fallbackPath: string;
}) {
  const rolesLabels: Record<UserRole, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    engineer: 'Ingeniero',
    accounting: 'Contabilidad',
    user: 'Usuario',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Acceso Denegado
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No tienes el rol requerido para acceder a esta sección.
        </p>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Tu rol actual:</span>{' '}
            <span className="text-primary font-semibold">
              {rolesLabels[currentRole]}
            </span>
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            <span className="font-medium">Roles permitidos:</span>{' '}
            {requiredRoles.map((r) => rolesLabels[r]).join(', ')}
          </p>
        </div>
        <a
          href={fallbackPath}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Volver al Dashboard
        </a>
      </div>
    </div>
  );
}

export default ProtectedRoute;