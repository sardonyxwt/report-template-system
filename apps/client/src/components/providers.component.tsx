import { ThemeProvider } from 'next-themes';
import { type PropsWithChildren } from 'react';
import { AccessControlProvider } from '../providers/access-control.provider';
import { AuthProvider } from '../providers/auth.provider';
import { Toaster } from './shadcn/ui/sonner';
import { TooltipProvider } from './shadcn/ui/tooltip';

export const Providers = ({ children }: PropsWithChildren) => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <TooltipProvider>
      <AuthProvider>
        <AccessControlProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AccessControlProvider>
      </AuthProvider>
    </TooltipProvider>
  </ThemeProvider>
);
