import { DocsEndpoints } from '../endpoints/docs.endpoints';
import { ApiRequest } from '../types';

/**
 * Builds documentation client helpers.
 */
export const createDocsApi = (
  request: ApiRequest,
  endpoints: DocsEndpoints,
) => ({
  /**
   * Returns the generated OpenAPI document as raw text.
   */
  json: (): Promise<string> => {
    const { path, method } = endpoints.json;
    return request({
      path,
      method,
      resTransformer: async (res) => await res.text(),
    });
  },
});
