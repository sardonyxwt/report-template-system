import {
  ManagerCreateRequest,
  ManagerResponse,
} from '../data/manager/manager.types';
import { ManagerEndpoints } from '../endpoints/manager.endpoints';
import { ApiRequest } from '../types';

/**
 * Builds typed manager administration client helpers.
 *
 * Manager routes mutate both manager data and the related user's role, so the
 * helpers preserve endpoint revalidation metadata for user and manager caches.
 */
export const createManagersApi = (
  request: ApiRequest,
  endpoints: ManagerEndpoints,
) => ({
  /**
   * Promotes a user to manager and creates manager metadata.
   */
  create: (body: ManagerCreateRequest): Promise<ManagerResponse> => {
    const { path, method, revalidate } = endpoints.create;
    return request({ path, method, body, revalidate });
  },
  /**
   * Deletes manager metadata and demotes the user.
   */
  del: (id: number): Promise<ManagerResponse> => {
    const { method, build, revalidate } = endpoints.delete;
    return request({ path: build(id), method, revalidate });
  },
});
