import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * ProtectedRoute — universal role-based route guard.
 *
 * Props:
 *   allowedRoles?: string[]   e.g. ['admin'] | ['seller'] | ['admin','seller']
 *   redirectTo?:  string      override redirect destination (default: /login or /)
 *
 * Behaviour:
 *   • Loading       → spinner
 *   • Not logged in → /login  (preserves intended destination in state)
 *   • Wrong role    → role-aware redirect (admin→/manager/analytics, else /)
 *   • All good      → render children ✅
 */
const ProtectedRoute = ({ children, allowedRoles, redirectTo }) => {
  const { user, isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Safe fallback for React Fast-Refresh (HMR) transient states
  const safeHasRole = hasRole || ((...roles) => {
    if (!user) return false;
    return roles.some(r => r === user.role || (user.roles || []).includes(r));
  });

  if (allowedRoles && allowedRoles.length > 0 && !safeHasRole(...allowedRoles)) {
    // Smart redirect based on their actual role
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    if (user.role === 'admin') return <Navigate to="/manager/analytics" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
