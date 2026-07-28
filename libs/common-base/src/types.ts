import { ZodType } from 'zod';
import { EndpointsTags, HttpMethod } from './enums';

export type ApiRequestProps<Body, Res> = {
  path: string;
  method: HttpMethod;
  headers?: Headers;
  body?: Body;
  tags?: EndpointsTags[];
  revalidate?: EndpointsTags[];
  resTransformer?: (res: Response) => Promise<Res> | Res;
};

/**
 * Transport adapter consumed by generated API helpers.
 *
 * Web, server-side rendering, test, or native clients can implement this at once
 * and reuse the shared endpoint contracts without duplicating paths and methods.
 */
export type ApiRequest = <Body, Res = unknown>(
  props: ApiRequestProps<Body, Res>,
) => Promise<Res>;

type ApiEndpointOauthGuard = `oauth-${string}`;

export type ApiEndpointGuard =
  | ApiEndpointOauthGuard
  | 'auth'
  | 'auth-refresh'
  | 'auth-optional';

export type ApiEndpointAttachment = {
  /** Multipart form field that contains the uploaded file. */
  property: string;
  /** Accepted mimetypes for documentation and server-side validation policy. */
  mimetype: string[];
};

export type ApiEndpointAttachmentResponse = {
  /** Marks the endpoint response as binary rather than JSON/Zod. */
  type: 'file';
  /** Mimetypes the endpoint can stream back to the client. */
  mimetype: string[];
};

/**
 * Shared endpoint contract used by server controllers, OpenAPI generation, and
 * typed API clients.
 *
 * Keep all route shape changes here first: controllers should bind these
 * objects through `@Endpoint`, while client helpers read the same method/path
 * values through `createApi`.
 */
export type ApiEndpoint = {
  method: HttpMethod;
  path: string;
  // eslint-disable-next-line
  build?: (...args: any) => string;
  status?: number;
  params?: ZodType;
  body?: ZodType;
  tags?: EndpointsTags[];
  revalidate?: EndpointsTags[];
  response: ZodType | ApiEndpointAttachmentResponse;
  guards?: ApiEndpointGuard[];
};

export type ApiEndpoints = Record<string, ApiEndpoint>;
