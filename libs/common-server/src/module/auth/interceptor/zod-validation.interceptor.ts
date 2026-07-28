import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';
import { ZodType } from 'zod';

/**
 * Validates controller return values against a Zod response schema.
 *
 * The schema can be static or selected dynamically from the returned data. This
 * keeps runtime responses aligned with the shared API contracts.
 */
export class ZodValidationInterceptor<T = unknown> implements NestInterceptor {
  constructor(private readonly schema: ZodType | ((data: T) => ZodType)) {}

  /**
   * Parses the emitted response before Nest serializes it.
   */
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next
      .handle()
      .pipe(
        map((data) =>
          ('parse' in this.schema ? this.schema : this.schema(data)).parse(
            data,
          ),
        ),
      );
  }
}
