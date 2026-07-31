import { createApi, createEndpoints } from 'platform/common-base';
import { env } from '../env/client.env';
import { request } from '../utils/request.utils';

export const endpoints = createEndpoints(env.apiUrl);
export const api = createApi(request, endpoints);
