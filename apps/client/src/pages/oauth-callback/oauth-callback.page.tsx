import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FullPageLoader } from '../../components/full-page-loader.component';
import { useRequest } from '../../hooks/request.hook';
import { useAccessControl } from '../../providers/access-control.provider';
import { useAuth } from '../../providers/auth.provider';
import { getDefaultAppRoute } from '../../routes';
import { getErrorMessage } from '../../utils/request.utils';
import { OauthCallbackError } from './oauth-callback-error.component';

export const OauthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startedRef = useRef(false);
  const { completeGoogleOauth, isAuthenticated, user } = useAuth();
  const access = useAccessControl();
  const oauthRequest = useRequest(completeGoogleOauth, {
    onSuccess: () => toast.success('You are signed in.'),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  useEffect(() => {
    if (startedRef.current || isAuthenticated) {
      return;
    }
    startedRef.current = true;
    void oauthRequest.fetch(searchParams.toString()).catch(() => undefined);
  }, [isAuthenticated, oauthRequest, searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultAppRoute(access, user), { replace: true });
    }
  }, [access, isAuthenticated, navigate, user]);

  if (oauthRequest.isError) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <OauthCallbackError
          message={getErrorMessage(oauthRequest.error)}
          onRetry={() => {
            startedRef.current = false;
            void oauthRequest
              .fetch(searchParams.toString())
              .catch(() => undefined);
          }}
        />
      </div>
    );
  }

  return <FullPageLoader message="Completing secure Google sign-in…" />;
};
