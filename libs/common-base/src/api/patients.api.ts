import {
  PatientAggregateRequest,
  PatientCreateRequest,
  PatientResponse,
  PatientsResponse,
} from '../data/patient/patient.types';
import { PatientEndpoints } from '../endpoints/patient.endpoints';
import { ApiRequest } from '../types';

export const createPatientsApi = (
  request: ApiRequest,
  endpoints: PatientEndpoints,
) => {
  const api = {
    findMany: (body: PatientAggregateRequest): Promise<PatientsResponse> => {
      const { path, method } = endpoints.findMany;
      return request({ path, method, body });
    },
    findOne: async (userId: number): Promise<PatientResponse | null> => {
      const { items, total } = await api.findMany({ where: { userId } });
      if (!total) {
        return null;
      }
      const [element] = items;
      return element;
    },
    create: (body: PatientCreateRequest): Promise<PatientResponse> => {
      const { path, method } = endpoints.create;
      return request({ path, method, body });
    },
  };

  return api;
};
