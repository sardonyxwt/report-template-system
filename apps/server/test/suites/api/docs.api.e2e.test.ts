import { HttpStatus } from '@nestjs/common';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';

const { context } = withAppContext();

describe('api.docs', () => {
  it('openapi-json', async () => {
    const res = await context.apiCall(endpoints.docs.json);
    const document = res.body as {
      paths?: Record<
        string,
        {
          post?: {
            responses?: Record<string, { content?: Record<string, unknown> }>;
          };
        }
      >;
    };
    const aiEditStream =
      document.paths?.[endpoints.template.aiEditStream.path]?.post;

    expect(res.status).toBe(HttpStatus.OK);
    expect(
      aiEditStream?.responses?.['200']?.content?.['text/event-stream'],
    ).toBeDefined();
  });
});
