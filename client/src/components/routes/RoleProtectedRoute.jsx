import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" />;
  }

  const decoded = jwtDecode(token);

  if (!allowedRoles.includes(decoded.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}