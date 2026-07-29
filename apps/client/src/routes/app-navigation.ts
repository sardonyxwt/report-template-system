import {
  Building2Icon,
  ClipboardPlusIcon,
  FileChartColumnIcon,
  FileTextIcon,
  LayoutTemplateIcon,
  StethoscopeIcon,
  UserCogIcon,
  UsersIcon,
} from 'lucide-react';
import { type AppSection, appSections, routes } from '../routes';

export type NavigationItem = {
  section: AppSection;
  label: string;
  description: string;
  path: string;
  icon: typeof Building2Icon;
};

const navigationMetadata: Record<
  AppSection,
  Omit<NavigationItem, 'section' | 'path'>
> = {
  clinics: {
    label: 'Clinics',
    description: 'Manage clinics and ownership',
    icon: Building2Icon,
  },
  managers: {
    label: 'Managers',
    description: 'Promote and manage managers',
    icon: UserCogIcon,
  },
  users: {
    label: 'Users',
    description: 'Manage platform accounts',
    icon: UsersIcon,
  },
  patients: {
    label: 'Patients',
    description: 'Assign patients to clinics',
    icon: StethoscopeIcon,
  },
  templates: {
    label: 'Templates',
    description: 'Build reusable report layouts',
    icon: LayoutTemplateIcon,
  },
  clinicReports: {
    label: 'Clinic reports',
    description: 'Review source clinic reports',
    icon: ClipboardPlusIcon,
  },
  patientReports: {
    label: 'Patient reports',
    description: 'Open patient-ready reports',
    icon: FileChartColumnIcon,
  },
};

export const appNavigation: NavigationItem[] = appSections.map(
  ({ section, path }) => ({
    section,
    path,
    ...navigationMetadata[section],
  }),
);

export const fallbackNavigationItem: NavigationItem = {
  section: 'patientReports',
  label: 'Proactive Care',
  description: 'Secure clinical reporting',
  path: routes.app.root(),
  icon: FileTextIcon,
};
