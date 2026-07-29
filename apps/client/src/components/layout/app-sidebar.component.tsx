import { ActivityIcon, LogOutIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useRequest } from '../../hooks/request.hook';
import { useAccessControl } from '../../providers/access-control.provider';
import { useAuth } from '../../providers/auth.provider';
import { canAccessAppSection, getDefaultAppRoute } from '../../routes';
import { appNavigation } from '../../routes/app-navigation';
import { getInitials } from '../../utils/formatting.utils';
import { getErrorMessage } from '../../utils/request.utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../shadcn/ui/alert-dialog';
import { Avatar, AvatarFallback } from '../shadcn/ui/avatar';
import { Badge } from '../shadcn/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '../shadcn/ui/sidebar';

export const AppSidebar = () => {
  const location = useLocation();
  const access = useAccessControl();
  const { isMobile, setOpenMobile } = useSidebar();
  const { user, logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const logoutRequest = useRequest(logout, {
    onSuccess: () => setLogoutDialogOpen(false),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const navigation = appNavigation.filter((item) =>
    canAccessAppSection(item.section, access, user),
  );
  const defaultRoute = getDefaultAppRoute(access, user);
  const initials = getInitials(user?.fullName || user?.email || 'User');
  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={defaultRoute} onClick={closeMobileSidebar}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ActivityIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Proactive Care</span>
                  <span className="truncate text-xs">
                    Early insight, better care
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="border-b border-sidebar-border">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="h-auto py-2">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.fullName || 'Workspace user'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {user?.role.toLowerCase()}
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const active =
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);
                return (
                  <SidebarMenuItem key={item.section}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Link to={item.path} onClick={closeMobileSidebar}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <AlertDialog
              open={logoutDialogOpen}
              onOpenChange={(open) => {
                if (!logoutRequest.isLoading) {
                  setLogoutDialogOpen(open);
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <SidebarMenuButton
                  tooltip="Sign out"
                  disabled={logoutRequest.isLoading}
                >
                  <LogOutIcon />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to sign in again to access your workspace and
                    reports.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={logoutRequest.isLoading}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={logoutRequest.isLoading}
                    onClick={(event) => {
                      event.preventDefault();
                      void logoutRequest.fetch().catch(() => undefined);
                    }}
                  >
                    <LogOutIcon />
                    {logoutRequest.isLoading ? 'Signing out…' : 'Sign out'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
