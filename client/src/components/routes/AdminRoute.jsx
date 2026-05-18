import RoleProtectedRoute from './RoleProtectedRoute';

export default function AdminRoute({ children }) {
  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      {children}
    </RoleProtectedRoute>
  );
}