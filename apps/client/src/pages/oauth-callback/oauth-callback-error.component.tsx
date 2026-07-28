import { Button } from '../../components/shadcn/ui/button';
import { routes } from '../../routes';

type OauthCallbackErrorProps = {
  message: string;
  onRetry: () => void;
};

export const OauthCallbackError = ({
  message,
  onRetry,
}: OauthCallbackErrorProps) => (
  <div className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-lg">
    <h1 className="text-xl font-semibold">Sign-in could not be completed</h1>
    <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    <div className="mt-5 flex justify-center gap-3">
      <Button onClick={onRetry}>Try again</Button>
      <Button
        variant="outline"
        onClick={() => window.location.assign(routes.home())}
      >
        Back home
      </Button>
    </div>
  </div>
);
