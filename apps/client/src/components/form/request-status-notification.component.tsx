import {
  CheckCircle2Icon,
  CircleAlertIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { type RequestStatus } from '../../hooks/request.hook';
import { cn } from '../shadcn/lib/utils';

const SUCCESS_VISIBILITY_MS = 4_000;

export const RequestStatusNotification = ({
  status,
  loadingMessage,
  successMessage,
  errorMessage,
  className,
}: {
  status: RequestStatus;
  loadingMessage: string;
  successMessage: string;
  errorMessage?: string;
  className?: string;
}) => {
  const [visible, setVisible] = useState(status !== 'initial');

  useEffect(() => {
    if (status === 'initial') {
      setVisible(false);
      return;
    }

    setVisible(true);

    if (status === 'success') {
      const timeout = window.setTimeout(
        () => setVisible(false),
        SUCCESS_VISIBILITY_MS,
      );

      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [status]);

  const message =
    status === 'loading'
      ? loadingMessage
      : status === 'success'
        ? successMessage
        : status === 'error'
          ? errorMessage
          : undefined;
  const Icon =
    status === 'loading'
      ? LoaderCircleIcon
      : status === 'success'
        ? CheckCircle2Icon
        : CircleAlertIcon;

  return (
    <div
      role={status === 'error' ? 'alert' : 'status'}
      aria-live={status === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(
        'grid min-w-0 transition-[grid-template-rows,opacity] duration-300',
        visible && message
          ? 'grid-rows-[1fr] opacity-100'
          : 'grid-rows-[0fr] opacity-0',
        className,
      )}
    >
      <div className="h-full min-h-0 overflow-hidden">
        <div
          className={cn(
            'flex h-full items-center gap-2 rounded-md border px-2 py-1 text-sm',
            status === 'loading' && 'text-muted-foreground',
            status === 'success' &&
              'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400',
            status === 'error' &&
              'border-destructive/30 bg-destructive/5 text-destructive',
          )}
        >
          <Icon
            className={cn(
              'mt-0.5 size-4 shrink-0',
              status === 'loading' && 'animate-spin',
            )}
          />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};
