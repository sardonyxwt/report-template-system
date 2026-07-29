import { Module } from '@nestjs/common';
import { PatientApi } from './patient.api';
import { PatientService } from './patient.service';

/**
 * Nest feature module for clinic patient endpoints.
 */
@Module({
  controllers: [PatientApi],
  providers: [PatientService],
})
export class PatientFutureModule {}
