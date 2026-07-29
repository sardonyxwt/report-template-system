import { createAuthApi } from './api/auth.api';
import { createClinicReportsApi } from './api/clinic-reports.api';
import { createClinicsApi } from './api/clinics.api';
import { createDocsApi } from './api/docs.api';
import { createManagersApi } from './api/managers.api';
import { createPatientReportsApi } from './api/patient-reports.api';
import { createPatientsApi } from './api/patients.api';
import { createTemplatesApi } from './api/templates.api';
import { createUsersApi } from './api/users.api';
import { createAuthEndpoints } from './endpoints/auth.endpoints';
import { createClinicReportEndpoints } from './endpoints/clinic-report.endpoints';
import { createClinicEndpoints } from './endpoints/clinic.endpoints';
import { createDocsEndpoints } from './endpoints/docs.endpoints';
import { createManagerEndpoints } from './endpoints/manager.endpoints';
import { createPatientReportEndpoints } from './endpoints/patient-report.endpoints';
import { createPatientEndpoints } from './endpoints/patient.endpoints';
import { createStatusEndpoints } from './endpoints/status.endpoints';
import { createTemplateEndpoints } from './endpoints/template.endpoints';
import { createUserEndpoints } from './endpoints/user.endpoints';
import { ApiRequest } from './types';

export * from './data/auth/auth.types';
export * from './data/clinic-report/clinic-report.types';
export * from './data/clinic/clinic.types';
export * from './data/common/common.types';
export * from './data/docs/docs.types';
export * from './data/manager/manager.types';
export * from './data/patient-report/patient-report.types';
export * from './data/patient/patient.types';
export * from './data/status/status.types';
export * from './data/template/template.types';
export * from './data/user/user.types';
export * from './data/manager/manager.data';
export * from './data/clinic-report/clinic-report-simple.data';
export * from './data/clinic-report/clinic-report.data';
export * from './data/clinic/clinic-simple.data';
export * from './data/clinic/clinic.data';
export * from './data/patient-report/patient-report-simple.data';
export * from './data/patient-report/patient-report.data';
export * from './data/patient/patient-simple.data';
export * from './data/patient/patient.data';
export * from './data/template/template-simple.data';
export * from './data/template/template.data';
export * from './data/manager/manager-simple.data';
export * from './data/user/user-simple.data';
export * from './data/user/user.data';
export * from './data/common/common.data';
export * from './data/docs/docs.data';
export * from './data/auth/auth.data';
export * from './data/status/status.data';

export * from './fixture/report.fixture';

export * from './utils/abilities.utils';
export * from './utils/global.utils';
export * from './utils/auth.utils';
export * from './utils/data.utils';
export * from './utils/events.utils';

export * from './abilities';
export * from './constants';
export * from './logger';
export * from './env';

export * from './enums';
export * from './types';

/**
 * Creates the full endpoint map, optionally prefixed with a base URL/path.
 *
 * Server code calls this without a prefix. Client code can pass an API base
 * path when it needs absolute or deployment-specific URLs while keeping the
 * same route contracts.
 */
export const createEndpoints = (url?: string) => ({
  docs: createDocsEndpoints(url),
  status: createStatusEndpoints(url),
  auth: createAuthEndpoints(url),
  user: createUserEndpoints(url),
  manager: createManagerEndpoints(url),
  clinic: createClinicEndpoints(url),
  patient: createPatientEndpoints(url),
  template: createTemplateEndpoints(url),
  clinicReport: createClinicReportEndpoints(url),
  patientReport: createPatientReportEndpoints(url),
});

export type ApiEndpoints = ReturnType<typeof createEndpoints>;

/**
 * Creates typed client helpers over the shared endpoint map.
 *
 * The supplied `ApiRequest` owns transport details such as `fetch`, cookies,
 * headers, cache handling, and response transformation. This factory owns only
 * contract-aware method names and request/response types.
 */
export const createApi = (req: ApiRequest, endpoints: ApiEndpoints) => ({
  docs: createDocsApi(req, endpoints.docs),
  auth: createAuthApi(req, endpoints.auth),
  user: createUsersApi(req, endpoints.user),
  manager: createManagersApi(req, endpoints.manager),
  clinic: createClinicsApi(req, endpoints.clinic),
  patient: createPatientsApi(req, endpoints.patient),
  template: createTemplatesApi(req, endpoints.template),
  clinicReport: createClinicReportsApi(req, endpoints.clinicReport),
  patientReport: createPatientReportsApi(req, endpoints.patientReport),
});

export type Api = ReturnType<typeof createApi>;
