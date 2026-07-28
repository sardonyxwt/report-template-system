import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './auth-jwt.guard';

/**
 * Attempts to access authentication but allows anonymous requests through.
 */
@Injectable()
export class JwtOptionalAuthGuard extends JwtAuthGuard {
  /**
   * Returns the resolved user when available and suppresses auth errors.
   */
  override handleRequest(_err: never, user: never) {
    return user;
  }
}
