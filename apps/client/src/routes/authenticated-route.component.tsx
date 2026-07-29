import { Navigate, Outlet } from 'react-router-dom';
import { FullPageLoader } from '../components/full-page-loader.component';
import { useAuth } from '../providers/auth.provider';
import { routes } from './config';

export const AuthenticatedRoute = () => {
  const { status, isAuthenticated } = useAuth();

  if (status === 'checking') {
    return <FullPageLoader />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={routes.home} replace />;
};
