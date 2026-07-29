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
    create: (
      body: PatientReportCreateRequest,
    ): Promise<PatientReportResponse> => {
      const { path, method } = endpoints.create;
      return request({ path, method, body });
    },
    downloadPdf: (reportId: number): Promise<Blob> => {
      const { method, build } = endpoints.downloadPdf;
      return request({
        path: build(reportId),
        method,
        resTransformer: (res) => res.blob(),
      });
    },
    del: (reportId: number): Promise<PatientReportResponse> => {
      const { method, build } = endpoints.delete;
      return request({ path: build(reportId), method });
    },
  };

  return api;
};
