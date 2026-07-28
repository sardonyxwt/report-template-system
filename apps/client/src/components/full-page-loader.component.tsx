import { ActivityIcon } from 'lucide-react';
import { Spinner } from './shadcn/ui/spinner';

type FullPageLoaderProps = {
  message?: string;
};

export const FullPageLoader = ({
  message = 'Preparing your workspace…',
}: FullPageLoaderProps) => (
  <div className="flex min-h-svh items-center justify-center bg-background p-6">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <ActivityIcon className="size-6" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        <span>{message}</span>
      </div>
    </div>
  </div>
);
