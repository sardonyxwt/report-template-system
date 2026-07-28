import { Module } from '@nestjs/common';
import { ClinicReportApi } from './clinic-report.api';
import { ClinicReportService } from './clinic-report.service';

@Module({
  controllers: [ClinicReportApi],
  providers: [ClinicReportService],
})
export class ClinicReportFutureModule {}
