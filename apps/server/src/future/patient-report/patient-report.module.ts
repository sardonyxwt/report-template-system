import { Module } from '@nestjs/common';
import { PatientReportApi } from './patient-report.api';
import { PatientReportService } from './patient-report.service';

/**
 * Nest feature module for patient report persistence and PDF delivery.
 */
@Module({
  controllers: [PatientReportApi],
  providers: [PatientReportService],
})
export class PatientReportFutureModule {}
