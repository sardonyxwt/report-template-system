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
import { Separator } from '../shadcn/ui/separator';
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4!" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
