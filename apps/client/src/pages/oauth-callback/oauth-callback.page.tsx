import { TriangleAlertIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FullPageLoader } from '../../components/full-page-loader.component';
import { Button } from '../../components/shadcn/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../components/shadcn/ui/empty';
import { useRequest } from '../../hooks/request.hook';
import { useAccessControl } from '../../providers/access-control.provider';
import { useAuth } from '../../providers/auth.provider';
import { getDefaultAppRoute, routes } from '../../routes/config';
import { getErrorMessage } from '../../utils/request.utils';

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
      <main className="flex min-h-svh items-center justify-center p-6">
        <Empty className="max-w-md border bg-card shadow-lg">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Sign-in could not be completed</EmptyTitle>
            <EmptyDescription>
              {getErrorMessage(oauthRequest.error)}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button
              onClick={() => {
                startedRef.current = false;
                void oauthRequest
                  .fetch(searchParams.toString())
                  .catch(() => undefined);
              }}
            >
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link to={routes.home}>Back home</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  return <FullPageLoader message="Completing secure Google sign-in…" />;
};
