import { createAuthApi } from './api/auth.api';
import { createDocsApi } from './api/docs.api';
import { createManagersApi } from './api/managers.api';
import { createUsersApi } from './api/users.api';
import { createAuthEndpoints } from './endpoints/auth.endpoints';
import { createDocsEndpoints } from './endpoints/docs.endpoints';
import { createManagerEndpoints } from './endpoints/manager.endpoints';
import { createStatusEndpoints } from './endpoints/status.endpoints';
import { createUserEndpoints } from './endpoints/user.endpoints';
import { ApiRequest } from './types';

export * from './data/auth/auth.types';
export * from './data/common/common.types';
export * from './data/docs/docs.types';
export * from './data/manager/manager.types';
export * from './data/status/status.types';
export * from './data/user/user.types';
export * from './data/manager/manager.data';
export * from './data/manager/manager-simple.data';
export * from './data/user/user-simple.data';
export * from './data/user/user.data';
export * from './data/common/common.data';
export * from './data/docs/docs.data';
export * from './data/auth/auth.data';
export * from './data/status/status.data';

export * from './utils/abilities.utils';
export * from './utils/global.utils';
export * from './utils/auth.utils';
export * from './utils/data.utils';

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
});

export type Api = ReturnType<typeof createApi>;
