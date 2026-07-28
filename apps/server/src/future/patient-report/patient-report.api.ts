import { Controller, Inject } from '@nestjs/common';
import {
  PatientReportAggregateRequest,
  PatientReportCreateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { PatientReportService } from './patient-report.service';

@Controller()
export class PatientReportApi {
  constructor(
    @Inject(PatientReportService)
    private readonly patientReportService: PatientReportService,
  ) {}

  @Endpoint(endpoints.patientReport.create, {
    desc: 'Create a patient report.',
  })
  create(
    @EndpointBody()
    data: PatientReportCreateRequest,
  ) {
    return this.patientReportService.create(data);
  }

  @Endpoint(endpoints.patientReport.findMany, {
    desc: 'Find patient reports.',
  })
  findMany(
    @EndpointBody()
    data: PatientReportAggregateRequest,
  ) {
    return this.patientReportService.findMany(data);
  }
}
