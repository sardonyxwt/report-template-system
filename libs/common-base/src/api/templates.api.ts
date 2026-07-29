import {
  TemplateAggregateRequest,
  TemplateAiEditEvent,
  TemplateAiEditRequest,
  TemplateCreateRequest,
  TemplatePreviewRequest,
  TemplatePreviewResponse,
  TemplateResponse,
  TemplatesResponse,
  TemplateUpdateRequest,
} from '../data/template/template.types';
import { TemplateEndpoints } from '../endpoints/template.endpoints';
import { ApiRequest } from '../types';
import { readEventStream } from '../utils/events.utils';

export const createTemplatesApi = (
  request: ApiRequest,
  endpoints: TemplateEndpoints,
) => {
  const api = {
    findMany: (body: TemplateAggregateRequest): Promise<TemplatesResponse> => {
      const { path, method } = endpoints.findMany;
      return request({ path, method, body });
    },
    findOne: async (id: number): Promise<TemplateResponse | null> => {
      const { items, total } = await api.findMany({ where: { id } });
      if (!total) {
        return null;
      }
      const [element] = items;
      return element;
    },
    create: (body: TemplateCreateRequest): Promise<TemplateResponse> => {
      const { path, method } = endpoints.create;
      return request({ path, method, body });
    },
    update: (body: TemplateUpdateRequest): Promise<TemplateResponse> => {
      const { path, method } = endpoints.update;
      return request({ path, method, body });
    },
    preview: (
      body: TemplatePreviewRequest,
    ): Promise<TemplatePreviewResponse> => {
      const { path, method } = endpoints.preview;
      return request({
        path,
        method,
        body,
        resTransformer: async (res) => await res.text(),
      });
    },
    editWithAi: async function* (
      body: TemplateAiEditRequest,
    ): AsyncGenerator<TemplateAiEditEvent> {
      const { path, method } = endpoints.aiEditStream;
      const events = await request<
        TemplateAiEditRequest,
        AsyncGenerator<TemplateAiEditEvent>
      >({
        path,
        method,
        body,
        resTransformer: (response) =>
          readEventStream<TemplateAiEditEvent>(response),
      });

      yield* events;
    },
    del: (id: number): Promise<TemplateResponse> => {
      const { method, build } = endpoints.delete;
      return request({ path: build(id), method });
    },
  };

  return api;
};
