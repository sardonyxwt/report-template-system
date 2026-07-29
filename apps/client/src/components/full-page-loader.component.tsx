import { ActivityIcon } from 'lucide-react';
import { cn } from './shadcn/lib/utils';

type FullPageLoaderProps = {
  visible: boolean;
  message: string;
};

export const FullPageLoader = ({ visible, message }: FullPageLoaderProps) => (
  <div
    role="status"
    aria-live="polite"
    aria-label={message}
    aria-hidden={!visible}
    className={cn(
      'fixed inset-0 z-50 flex min-h-svh items-center justify-center overflow-hidden bg-background/96 p-6 backdrop-blur-xl transition-opacity duration-300 ease-out motion-reduce:transition-none',
      visible
        ? 'pointer-events-auto opacity-100'
        : 'pointer-events-none opacity-0',
    )}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,oklch(0.88_0.09_245/.28),transparent_30%),radial-gradient(circle_at_42%_54%,oklch(0.9_0.08_285/.2),transparent_28%)]" />
    <div className="relative flex flex-col items-center gap-5 text-center">
      <div className="relative flex size-20 items-center justify-center">
        <div className="absolute inset-0 animate-[spin_1.8s_linear_infinite] rounded-[1.75rem] bg-[conic-gradient(from_0deg,transparent_0deg,#64d2ff_105deg,#5e5ce6_185deg,#bf5af2_245deg,transparent_330deg)] p-px shadow-[0_0_30px_oklch(0.65_0.16_265/.2)] motion-reduce:animate-none">
          <div className="size-full rounded-[calc(1.75rem-1px)] bg-background/96" />
        </div>
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
          <ActivityIcon className="size-7" />
        </div>
      </div>
      <p className="text-sm font-medium tracking-tight text-muted-foreground">
        {message}
      </p>
    </div>
  </div>
);
