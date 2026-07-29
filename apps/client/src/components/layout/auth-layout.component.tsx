import { Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/auth.provider';
import { FullPageLoader } from '../full-page-loader.component';

export const AuthLayout = () => {
  const { status, isAuthPending } = useAuth();

  return (
    <>
      <Outlet />
      <FullPageLoader
        visible={isAuthPending}
        message={
          status === 'authenticating'
            ? 'Signing you in'
            : 'Checking your session'
        }
      />
    </>
  );
};
