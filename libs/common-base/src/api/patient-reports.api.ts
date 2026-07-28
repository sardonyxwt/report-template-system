import {
  PatientReportAggregateRequest,
  PatientReportCreateRequest,
  PatientReportResponse,
  PatientReportsResponse,
} from '../data/patient-report/patient-report.types';
import { PatientReportEndpoints } from '../endpoints/patient-report.endpoints';
import { ApiRequest } from '../types';

export const createPatientReportsApi = (
  request: ApiRequest,
  endpoints: PatientReportEndpoints,
) => {
  const api = {
    findMany: (
      body: PatientReportAggregateRequest,
    ): Promise<PatientReportsResponse> => {
      const { path, method } = endpoints.findMany;
      return request({ path, method, body });
    },
    findOne: async (
      reportId: number,
    ): Promise<PatientReportResponse | null> => {
      const { items, total } = await api.findMany({ where: { reportId } });
      if (!total) {
        return null;
      }
      const [element] = items;
      return element;
    },
    create: (
      body: PatientReportCreateRequest,
    ): Promise<PatientReportResponse> => {
      const { path, method } = endpoints.create;
      return request({ path, method, body });
    },
  };

  return api;
};
