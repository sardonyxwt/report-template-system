import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/auth.provider';
import { routes } from './config';

export const AuthenticatedRoute = () => {
  const { isAuthenticated, isAuthPending } = useAuth();

  if (isAuthPending) {
    return null;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={routes.home} replace />;
};
