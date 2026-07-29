import {
  ClinicReportAggregateRequest,
  ClinicReportCreateRequest,
  ClinicReportResponse,
  ClinicReportsResponse,
} from '../data/clinic-report/clinic-report.types';
import { ClinicReportEndpoints } from '../endpoints/clinic-report.endpoints';
import { ApiRequest } from '../types';

export const createClinicReportsApi = (
  request: ApiRequest,
  endpoints: ClinicReportEndpoints,
) => {
  const api = {
    create: (
      body: ClinicReportCreateRequest,
    ): Promise<ClinicReportResponse> => {
      const { path, method } = endpoints.create;
      return request({ path, method, body });
    },
    del: (id: number): Promise<ClinicReportResponse> => {
      const { method, build } = endpoints.delete;
      return request({ path: build(id), method });
    },
    findMany: (
      body: ClinicReportAggregateRequest,
    ): Promise<ClinicReportsResponse> => {
      const { path, method } = endpoints.findMany;
      return request({ path, method, body });
    },
    findOne: async (id: number): Promise<ClinicReportResponse | null> => {
      const { items, total } = await api.findMany({ where: { id } });
      if (!total) {
        return null;
      }
      const [element] = items;
      return element;
    },
  };

  return api;
};
