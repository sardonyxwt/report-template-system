import { Controller, Inject } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { Endpoint } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { StatusService } from './status.service';

/**
 * Liveness/readiness HTTP controller.
 *
 * The status endpoint is intentionally small and delegates actual indicator
 * execution to `StatusService`, which keeps Nest Terminus wiring out of the
 * controller.
 */
@Controller()
export class StatusApi {
  constructor(
    @Inject(StatusService)
    private readonly statusService: StatusService,
  ) {}

  /**
   * Runs configured health checks and returns the Terminus response shape.
   */
  @Endpoint(endpoints.status.check, {
    desc: 'Run health checks for the database.',
  })
  @HealthCheck()
  check() {
    return this.statusService.check();
  }
}
