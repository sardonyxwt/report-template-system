import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

/**
 * Returns the user object attached to the request by Passport strategies.
 */
export const EndpointUser = createParamDecorator(
  (options: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest<Request>().user;
  },
);
