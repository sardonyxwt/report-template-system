import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../shadcn/ui/breadcrumb';
import { SidebarTrigger } from '../shadcn/ui/sidebar';

type PageToolbarBreadcrumb = {
  label: string;
  href?: string;
};

type PageToolbarProps = {
  title: string;
  breadcrumbs?: PageToolbarBreadcrumb[];
  actions?: ReactNode;
};

export const PageToolbar = ({
  title,
  breadcrumbs,
  actions,
}: PageToolbarProps) => (
  <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
    <SidebarTrigger className="-ml-1" />
    {breadcrumbs ? (
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          {breadcrumbs.map((item, index) => (
            <Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem className="min-w-0">
                {item.href ? (
                  <BreadcrumbLink asChild className="cursor-pointer truncate">
                    <Link to={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
            </Fragment>
          ))}
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    ) : (
      <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{title}</h1>
    )}
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </header>
);
