import { type ProfileResponse } from 'platform/common-base';
import { type AccessControl } from './providers/access-control.provider';

export const routePaths = {
  home: '/',
  oauthGoogle: '/oauth/google',
  app: '/app',
  users: '/app/users',
  managers: '/app/managers',
  clinics: '/app/clinics',
  patients: '/app/patients',
  templates: '/app/templates',
  clinicReports: '/app/clinic-reports',
  clinicReport: '/app/clinic-reports/:reportId',
  patientReports: '/app/patient-reports',
} as const;

export const routes = {
  home: () => routePaths.home,
  oauth: {
    google: () => routePaths.oauthGoogle,
  },
  app: {
    root: () => routePaths.app,
    users: () => routePaths.users,
    managers: () => routePaths.managers,
    clinics: () => routePaths.clinics,
    patients: () => routePaths.patients,
    templates: () => routePaths.templates,
    clinicReports: () => routePaths.clinicReports,
    clinicReport: (reportId: number) =>
      `${routePaths.clinicReports}/${reportId}`,
    patientReports: () => routePaths.patientReports,
  },
} as const;

export type AppSection =
  | 'users'
  | 'managers'
  | 'clinics'
  | 'patients'
  | 'templates'
  | 'clinicReports'
  | 'patientReports';

type AppSectionDefinition = {
  section: AppSection;
  path: string;
  canAccess: (access: AccessControl, user: ProfileResponse) => boolean;
};

export const appSections: AppSectionDefinition[] = [
  {
    section: 'users',
    path: routes.app.users(),
    canAccess: (access) => access.users.read({}),
  },
  {
    section: 'managers',
    path: routes.app.managers(),
    canAccess: (access) => access.managers.create() || access.managers.delete(),
  },
  {
    section: 'patients',
    path: routes.app.patients(),
    canAccess: (access, user) => access.patients.read({ managerId: user.id }),
  },
  {
    section: 'clinics',
    path: routes.app.clinics(),
    canAccess: (access, user) => access.clinics.read({ managerId: user.id }),
  },
  {
    section: 'templates',
    path: routes.app.templates(),
    canAccess: (access, user) => access.templates.read({ managerId: user.id }),
  },
  {
    section: 'clinicReports',
    path: routes.app.clinicReports(),
    canAccess: (access, user) =>
      access.clinicReports.read({ managerId: user.id }),
  },
  {
    section: 'patientReports',
    path: routes.app.patientReports(),
    canAccess: (access, user) =>
      access.patientReports.read({
        managerId: user.id,
        patientId: user.id,
      }),
  },
];

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
    : undefined) ?? routes.home();
