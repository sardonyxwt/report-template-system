import { Module } from '@nestjs/common';
import { PatientReportApi } from './patient-report.api';
import { PatientReportService } from './patient-report.service';

@Module({
  controllers: [PatientReportApi],
  providers: [PatientReportService],
})
export class PatientReportFutureModule {}
