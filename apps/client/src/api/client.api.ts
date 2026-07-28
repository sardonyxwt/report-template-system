import { createApi, createEndpoints } from 'platform/common-base';
import { clientEnvironment } from '../env/client.env';
import { request } from '../utils/request.utils';

export const endpoints = createEndpoints(clientEnvironment.apiUrl);
export const api = createApi(request, endpoints);
