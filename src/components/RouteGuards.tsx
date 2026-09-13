import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function RequireAuth() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/catalog" replace />;
  return <Outlet />;
}

// Inverse of RequireAuth — for /login and /register, which should bounce an
// already-authenticated user straight to the catalog instead of showing the
// form again.
export function RequireGuest() {
  const { user } = useAuth();
  if (user) return <Navigate to="/catalog" replace />;
  return <Outlet />;
}
