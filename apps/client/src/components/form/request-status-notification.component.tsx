import {
  CheckCircle2Icon,
  CircleAlertIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { REQUEST_SUCCESS_VISIBILITY_MS } from '../../constants';
import { type RequestStatus } from '../../hooks/request.hook';
import { cn } from '../shadcn/lib/utils';

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
  const hideSuccess = useDebouncedCallback(
    () => setVisible(false),
    REQUEST_SUCCESS_VISIBILITY_MS,
  );

  useEffect(() => {
    hideSuccess.cancel();

    if (status === 'initial') {
      setVisible(false);
      return;
    }

    setVisible(true);

    if (status === 'success') {
      hideSuccess();
    }

    return hideSuccess.cancel;
  }, [hideSuccess, status]);

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
        'min-w-0 transition-opacity duration-500 ease-out',
        visible && message ? 'opacity-100' : 'pointer-events-none opacity-0',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-full items-center gap-2 rounded-md border px-2 py-1 text-sm',
          status === 'loading' && 'ai-gradient-border text-muted-foreground',
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
  );
};
