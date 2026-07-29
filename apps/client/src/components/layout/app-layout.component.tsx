import { Outlet, useLocation } from 'react-router-dom';
import {
  appNavigation,
  fallbackNavigationItem,
} from '../../routes/app-navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '../shadcn/ui/breadcrumb';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '../shadcn/ui/sidebar';
import { AppSidebar } from './app-sidebar.component';

export function AppLayout() {
  const location = useLocation();
  const item =
    appNavigation.find(
      (navigationItem) =>
        location.pathname === navigationItem.path ||
        location.pathname.startsWith(`${navigationItem.path}/`),
    ) ?? fallbackNavigationItem;

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        <header className="z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex min-h-full flex-col p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
