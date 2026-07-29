import { type ApiRequest, type ApiRequestProps } from 'platform/common-base';
import { DEFAULT_ERROR_MESSAGE } from '../constants';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly body: unknown,
  ) {
    super(resolveApiErrorMessage(statusText, body));
    this.name = 'ApiError';
  }
}

export const request: ApiRequest = async <Body, ResponseData>(
  props: ApiRequestProps<Body, ResponseData>,
): Promise<ResponseData> => {
  const headers = new Headers(props.headers);
  const requestInit: RequestInit = {
    method: props.method,
    credentials: 'include',
    headers,
  };

  if (props.body !== undefined) {
    headers.set('content-type', 'application/json');
    requestInit.body = JSON.stringify(props.body);
  }

  const response = await fetch(props.path, requestInit);
  ensureBrowserCookieHeaderCompatibility(response.headers);
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const responseBody =
    props.resTransformer && response.ok
      ? await props.resTransformer(response)
      : isJson
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, responseBody);
  }

  return responseBody as ResponseData;
};

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;

const resolveApiErrorMessage = (statusText: string, body: unknown) => {
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message;
  }

  return statusText || 'The request could not be completed.';
};

const ensureBrowserCookieHeaderCompatibility = (headers: Headers) => {
  if (typeof headers.getSetCookie === 'function') {
    return;
  }

  Object.defineProperty(headers, 'getSetCookie', {
    configurable: true,
    value: () => [],
  });
};
