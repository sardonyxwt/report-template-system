import { Inject, Injectable } from '@nestjs/common';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaClient } from 'platform/common-server';

/**
 * Provides health checks used by the public status endpoint.
 *
 * At the moment the service verifies Prisma database connectivity through
 * Nest Terminus. Add future indicators here so the controller remains a stable
 * transport adapter.
 */
@Injectable()
export class StatusService {
  constructor(
    @Inject(HealthCheckService)
    private readonly health: HealthCheckService,
    @Inject(PrismaHealthIndicator)
    private readonly prismaIndicator: PrismaHealthIndicator,
    @Inject(PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Executes all configured readiness checks.
   */
  check() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('database', this.prisma),
    ]);
  }
}
