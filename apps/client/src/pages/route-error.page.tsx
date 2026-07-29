import { HouseIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react';
import { Button } from '../components/shadcn/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/shadcn/ui/card';
import { routes } from '../routes/config';

export const RouteErrorPage = () => (
  <main className="relative flex min-h-svh items-center justify-center overflow-hidden p-6">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.9_0.06_35/.7),transparent_42%),radial-gradient(circle_at_bottom_right,oklch(0.88_0.07_270/.65),transparent_38%)]" />
    <div className="absolute right-12 top-12 size-52 rounded-full border border-destructive/10 bg-destructive/5 blur-2xl" />
    <Card className="relative w-full max-w-lg border-white/60 bg-card/92 shadow-2xl shadow-destructive/10 backdrop-blur-xl">
      <CardHeader className="space-y-5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive text-white shadow-lg shadow-destructive/20">
          <TriangleAlertIcon className="size-6" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl tracking-tight">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            We couldn&apos;t load this page. The issue may be temporary, so you
            can try again or return to the home page.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground">
          Your data is safe. If the problem keeps happening, please contact
          support.
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          <RefreshCwIcon />
          Try again
        </Button>
        <Button asChild className="w-full">
          <a href={routes.home}>
            <HouseIcon />
            Return home
          </a>
        </Button>
      </CardFooter>
    </Card>
  </main>
);
