import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { StatusApi } from './status.api';
import { StatusService } from './status.service';

/**
 * Feature module for health/readiness checks.
 */
@Module({
  imports: [TerminusModule],
  providers: [StatusService],
  controllers: [StatusApi],
})
export class StatusFutureModule {}
