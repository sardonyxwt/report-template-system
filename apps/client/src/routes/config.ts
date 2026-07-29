import {
  Building2Icon,
  ClipboardPlusIcon,
  FileChartColumnIcon,
  LayoutTemplateIcon,
  StethoscopeIcon,
  UserCogIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import { type ProfileResponse } from 'platform/common-base';
import { type AccessControl } from '../providers/access-control.provider';

export const routes = {
  home: '/',
  oauthGoogle: '/oauth/google',
  app: {
    root: '/app',
    users: '/app/users',
    managers: '/app/managers',
    clinics: '/app/clinics',
    patients: '/app/patients',
    templates: '/app/templates',
    clinicReports: '/app/clinic-reports',
    clinicReport: (reportId: number | string) =>
      `/app/clinic-reports/${reportId}`,
    patientReports: '/app/patient-reports',
  },
} as const;

type AppSectionDefinitionShape = {
  section: string;
  path: string;
  label: string;
  icon: LucideIcon;
  canAccess: (access: AccessControl, user: ProfileResponse) => boolean;
};

export const appSections = [
  {
    section: 'users',
    path: routes.app.users,
    label: 'Users',
    icon: UsersIcon,
    canAccess: (access) => access.users.read({}),
  },
  {
    section: 'managers',
    path: routes.app.managers,
    label: 'Managers',
    icon: UserCogIcon,
    canAccess: (access) => access.managers.create() || access.managers.delete(),
  },
  {
    section: 'patients',
    path: routes.app.patients,
    label: 'Patients',
    icon: StethoscopeIcon,
    canAccess: (access, user) => access.patients.read({ managerId: user.id }),
  },
  {
    section: 'clinics',
    path: routes.app.clinics,
    label: 'Clinics',
    icon: Building2Icon,
    canAccess: (access, user) => access.clinics.read({ managerId: user.id }),
  },
  {
    section: 'templates',
    path: routes.app.templates,
    label: 'Templates',
    icon: LayoutTemplateIcon,
    canAccess: (access, user) => access.templates.read({ managerId: user.id }),
  },
  {
    section: 'clinicReports',
    path: routes.app.clinicReports,
    label: 'Clinic reports',
    icon: ClipboardPlusIcon,
    canAccess: (access, user) =>
      access.clinicReports.read({ managerId: user.id }),
  },
  {
    section: 'patientReports',
    path: routes.app.patientReports,
    label: 'Patient reports',
    icon: FileChartColumnIcon,
    canAccess: (access, user) =>
      access.patientReports.read({
        managerId: user.id,
        patientId: user.id,
      }),
  },
] satisfies AppSectionDefinitionShape[];

export type AppSection = (typeof appSections)[number]['section'];

export const canAccessAppSection = (
  section: AppSection,
  access: AccessControl,
  user?: ProfileResponse,
) =>
  !!user &&
  !!appSections
    .find((definition) => definition.section === section)
    ?.canAccess(access, user);

export const getDefaultAppRoute = (
  access: AccessControl,
  user?: ProfileResponse,
) =>
  (user
    ? appSections.find((definition) => definition.canAccess(access, user))?.path
    : undefined) ?? routes.home;
