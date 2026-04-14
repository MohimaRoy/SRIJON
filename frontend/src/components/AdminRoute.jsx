// AdminRoute is now a thin wrapper around ProtectedRoute
import ProtectedRoute from './ProtectedRoute';

const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

export default AdminRoute;
