import { Controller, Inject } from '@nestjs/common';
import {
  ActionNumberIdParams,
  ClinicReportAggregateRequest,
  ClinicReportCreateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody, EndpointParams } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { ClinicReportService } from './clinic-report.service';

/**
 * Contract-backed HTTP controller for clinic report operations.
 */
@Controller()
export class ClinicReportApi {
  constructor(
    @Inject(ClinicReportService)
    private readonly clinicReportService: ClinicReportService,
  ) {}

  /**
   * Creates a clinic report initialized with the server's default report data.
   */
  @Endpoint(endpoints.clinicReport.create, {
    desc: 'Create a clinic report with test data.',
  })
  create(
    @EndpointBody()
    data: ClinicReportCreateRequest,
  ) {
    return this.clinicReportService.create(data);
  }

  /**
   * Deletes a clinic report by numeric route id.
   */
  @Endpoint(endpoints.clinicReport.delete, {
    desc: 'Delete a clinic report by ID.',
  })
  delete(
    @EndpointParams()
    params: ActionNumberIdParams,
  ) {
    return this.clinicReportService.delete(params.id);
  }

  /**
   * Returns a filtered clinic report page with total count metadata.
   */
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
