import { type PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuth } from '../providers/auth.provider';
import {
  type AppSection,
  canAccessAppSection,
  getDefaultAppRoute,
} from './config';

type SectionRouteProps = PropsWithChildren<{
  section: AppSection;
}>;

export const SectionRoute = ({ section, children }: SectionRouteProps) => {
  const access = useAccessControl();
  const { user } = useAuth();

  return canAccessAppSection(section, access, user) ? (
    children
  ) : (
    <Navigate to={getDefaultAppRoute(access, user)} replace />
  );
};
