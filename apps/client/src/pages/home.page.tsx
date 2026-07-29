import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ShieldCheckIcon,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { endpoints } from '../api/client.api';
import { Button } from '../components/shadcn/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/shadcn/ui/card';
import { useAccessControl } from '../providers/access-control.provider';
import { useAuth } from '../providers/auth.provider';
import { getDefaultAppRoute } from '../routes/config';

export const HomePage = () => {
  const { isAuthenticated, isAuthPending, user } = useAuth();
  const access = useAccessControl();

  if (isAuthPending) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultAppRoute(access, user)} replace />;
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.88_0.08_235/.7),transparent_42%),radial-gradient(circle_at_bottom_right,oklch(0.9_0.07_270/.65),transparent_38%)]" />
      <div className="absolute left-10 top-10 size-48 rounded-full border border-primary/10 bg-primary/5 blur-2xl" />
      <Card className="relative w-full max-w-lg border-white/60 bg-card/92 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <CardHeader className="space-y-5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ActivityIcon className="size-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl tracking-tight">
              Reports that stay connected to care
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              A secure workspace for clinics, managers, and patients to create,
              organize, and review clinical reports.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="size-4 text-primary" />
            Role-aware workspace
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-primary" />
            Secure cookie session
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3">
          <Button size="lg" asChild className="w-full">
            <a href={endpoints.auth.oauthGoogle.path}>
              Continue with Google
              <ArrowRightIcon />
            </a>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Sign in with your organization-approved Google account.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
