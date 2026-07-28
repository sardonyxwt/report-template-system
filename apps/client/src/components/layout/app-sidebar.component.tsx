import { ActivityIcon, LogOutIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useRequest } from '../../hooks/request.hook';
import { useAccessControl } from '../../providers/access-control.provider';
import { useAuth } from '../../providers/auth.provider';
import { canAccessAppSection, getDefaultAppRoute } from '../../routes';
import { appNavigation } from '../../routes/app-navigation';
import { getInitials } from '../../utils/formatting.utils';
import { getErrorMessage } from '../../utils/request.utils';
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
} from '../shadcn/ui/sidebar';

export const AppSidebar = () => {
  const location = useLocation();
  const access = useAccessControl();
  const { user, logout } = useAuth();
  const logoutRequest = useRequest(logout, {
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const navigation = appNavigation.filter((item) =>
    canAccessAppSection(item.section, access, user),
  );
  const defaultRoute = getDefaultAppRoute(access, user);
  const initials = getInitials(user?.fullName || user?.email || 'User');

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={defaultRoute}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ActivityIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Report Workspace
                  </span>
                  <span className="truncate text-xs">Clinical operations</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
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
                      <Link to={item.path}>
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
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              disabled={logoutRequest.isLoading}
              onClick={() => void logoutRequest.fetch()}
            >
              <LogOutIcon />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
