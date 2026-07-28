import { HttpStatus } from '@nestjs/common';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';

const { context } = withAppContext();

describe('api.docs', () => {
  it('openapi-json', async () => {
    const res = await context.apiCall(endpoints.docs.json);

    expect(res.status).toBe(HttpStatus.OK);
  });
});
