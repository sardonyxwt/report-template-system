import { Navigate } from 'react-router-dom';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuth } from '../providers/auth.provider';
import { getDefaultAppRoute } from './config';

export const AppIndexRoute = () => {
  const access = useAccessControl();
  const { user } = useAuth();

  return <Navigate to={getDefaultAppRoute(access, user)} replace />;
};
