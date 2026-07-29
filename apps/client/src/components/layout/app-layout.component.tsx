import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '../shadcn/ui/sidebar';
import { AppSidebar } from './app-sidebar.component';

export function AppLayout() {
  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
