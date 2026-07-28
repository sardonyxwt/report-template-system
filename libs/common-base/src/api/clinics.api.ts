import {
  ClinicAggregateRequest,
  ClinicCreateRequest,
  ClinicResponse,
  ClinicsResponse,
  ClinicUpdateRequest,
} from '../data/clinic/clinic.types';
import { ClinicEndpoints } from '../endpoints/clinic.endpoints';
import { ApiRequest } from '../types';

export const createClinicsApi = (
  request: ApiRequest,
  endpoints: ClinicEndpoints,
) => {
  const api = {
    findMany: (body: ClinicAggregateRequest): Promise<ClinicsResponse> => {
      const { path, method } = endpoints.findMany;
      return request({ path, method, body });
    },
    findOne: async (id: number): Promise<ClinicResponse | null> => {
      const { items, total } = await api.findMany({ where: { id } });
      if (!total) {
        return null;
      }
      const [element] = items;
      return element;
    },
    create: (body: ClinicCreateRequest): Promise<ClinicResponse> => {
      const { path, method } = endpoints.create;
      return request({ path, method, body });
    },
    update: (body: ClinicUpdateRequest): Promise<ClinicResponse> => {
      const { path, method } = endpoints.update;
      return request({ path, method, body });
    },
    del: (id: number): Promise<ClinicResponse> => {
      const { method, build } = endpoints.delete;
      return request({ path: build(id), method });
    },
  };

  return api;
};
