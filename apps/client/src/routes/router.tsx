import { type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/app-layout.component';
import { ClinicReportDetailPage } from '../pages/clinic-report-detail/clinic-report-detail.page';
import { ClinicReportsPage } from '../pages/clinic-reports.page';
import { ClinicsPage } from '../pages/clinics.page';
import { HomePage } from '../pages/home.page';
import { ManagersPage } from '../pages/managers.page';
import { OauthCallbackPage } from '../pages/oauth-callback/oauth-callback.page';
import { PatientReportsPage } from '../pages/patient-reports.page';
import { PatientsPage } from '../pages/patients.page';
import { RouteErrorPage } from '../pages/route-error.page';
import { TemplatesPage } from '../pages/templates.page';
import { UsersPage } from '../pages/users.page';
import { type AppSection, appSections, routePaths, routes } from '../routes';
import { AppIndexRoute } from './app-index-route.component';
import { AuthenticatedRoute } from './authenticated-route.component';
import { SectionRoute } from './section-route.component';

const appSectionElements: Record<AppSection, ReactNode> = {
  users: <UsersPage />,
  managers: <ManagersPage />,
  clinics: <ClinicsPage />,
  patients: <PatientsPage />,
  templates: <TemplatesPage />,
  clinicReports: <ClinicReportsPage />,
  patientReports: <PatientReportsPage />,
};

export const router = createBrowserRouter([
  {
    path: routePaths.home,
    element: <HomePage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: routePaths.oauthGoogle,
    element: <OauthCallbackPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    element: <AuthenticatedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: routePaths.app,
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <AppIndexRoute />,
          },
          ...appSections.map(({ section, path }) => ({
            path,
            element: (
              <SectionRoute section={section}>
                {appSectionElements[section]}
              </SectionRoute>
            ),
          })),
          {
            path: routePaths.clinicReport,
            element: (
              <SectionRoute section="clinicReports">
                <ClinicReportDetailPage />
              </SectionRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={routes.home()} replace />,
    errorElement: <RouteErrorPage />,
  },
]);
