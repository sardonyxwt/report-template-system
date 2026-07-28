import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { SessionService } from '../service/session.service';

/**
 * Creates an empty session async context for every HTTP request.
 *
 * Authentication strategies later populate the scoped user in `SessionService`.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(
    @Inject(SessionService)
    private readonly session: SessionService,
  ) {}

  /**
   * Starts the request-local session scope and continues the middleware chain.
   */
  async use(req: Request, res: Response, next: NextFunction) {
    await this.session.init(next);
  }
}
