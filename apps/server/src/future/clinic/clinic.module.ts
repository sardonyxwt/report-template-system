import { Module } from '@nestjs/common';
import { ClinicApi } from './clinic.api';
import { ClinicService } from './clinic.service';

/**
 * Nest feature module for clinic administration endpoints.
 */
@Module({
  controllers: [ClinicApi],
  providers: [ClinicService],
})
export class ClinicFutureModule {}
