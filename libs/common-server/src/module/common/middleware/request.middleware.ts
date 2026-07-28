import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { REQUEST_ID_HEADER } from 'platform/common-base';
import { RequestService } from '../service/request.service';

/**
 * Ensures every request has a stable request id.
 *
 * Incoming ids are preserved from the configured header; otherwise a new UUID
 * is generated, returned on the response, and stored in `RequestService`.
 */
@Injectable()
export class RequestMiddleware implements NestMiddleware {
  constructor(
    @Inject(RequestService)
    private readonly requestService: RequestService,
  ) {}

  /**
   * Initializes request-scoped metadata before downstream handlers run.
   */
  async use(request: Request, response: Response, next: NextFunction) {
    const requestId = request.get(REQUEST_ID_HEADER) || randomUUID();

    response.setHeader(REQUEST_ID_HEADER, requestId);

    await this.requestService.init({ requestId }, next);
  }
}
