import { Controller, Inject } from '@nestjs/common';
import {
  ClinicReportAggregateRequest,
  ClinicReportCreateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { ClinicReportService } from './clinic-report.service';

@Controller()
export class ClinicReportApi {
  constructor(
    @Inject(ClinicReportService)
    private readonly clinicReportService: ClinicReportService,
  ) {}

  @Endpoint(endpoints.clinicReport.create, {
    desc: 'Create a clinic report with test data.',
  })
  create(
    @EndpointBody()
    data: ClinicReportCreateRequest,
  ) {
    return this.clinicReportService.create(data);
  }

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
