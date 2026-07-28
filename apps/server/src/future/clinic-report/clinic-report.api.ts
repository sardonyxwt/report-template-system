import { Controller, Inject } from '@nestjs/common';
import { ClinicReportAggregateRequest } from 'platform/common-base';
import { Endpoint, EndpointBody } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { ClinicReportService } from './clinic-report.service';

@Controller()
export class ClinicReportApi {
  constructor(
    @Inject(ClinicReportService)
    private readonly clinicReportService: ClinicReportService,
  ) {}

  @Endpoint(endpoints.clinicReport.findMany, {
    desc: 'Find clinic reports.',
  })
  findMany(
    @EndpointBody()
    data: ClinicReportAggregateRequest,
  ) {
    return this.clinicReportService.findMany(data);
  }
}
