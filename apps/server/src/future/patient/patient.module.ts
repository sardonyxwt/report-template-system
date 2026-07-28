import { Module } from '@nestjs/common';
import { PatientApi } from './patient.api';
import { PatientService } from './patient.service';

@Module({
  controllers: [PatientApi],
  providers: [PatientService],
})
export class PatientFutureModule {}
