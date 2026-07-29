import { Controller, Inject } from '@nestjs/common';
import {
  ActionNumberIdParams,
  PatientReportAggregateRequest,
  PatientReportCreateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody, EndpointParams } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { PatientReportService } from './patient-report.service';

/**
 * Contract-backed HTTP controller for generated patient reports.
 */
@Controller()
export class PatientReportApi {
  constructor(
    @Inject(PatientReportService)
    private readonly patientReportService: PatientReportService,
  ) {}

  /**
   * Links a clinic report to the template used for patient delivery.
   */
  @Endpoint(endpoints.patientReport.create, {
    desc: 'Create a patient report.',
  })
  create(
    @EndpointBody()
    data: PatientReportCreateRequest,
  ) {
    return this.patientReportService.create(data);
  }

  /**
   * Deletes a patient report by its clinic report id.
   */
  @Endpoint(endpoints.patientReport.delete, {
    desc: 'Delete a patient report by report ID.',
  })
  delete(
    @EndpointParams()
    params: ActionNumberIdParams,
  ) {
    return this.patientReportService.delete(params.id);
  }

  /**
   * Returns a filtered patient report page with total count metadata.
   */
  @Endpoint(endpoints.patientReport.findMany, {
    desc: 'Find patient reports.',
  })
  findMany(
    @EndpointBody()
    data: PatientReportAggregateRequest,
  ) {
    return this.patientReportService.findMany(data);
  }

  /**
   * Renders an authorized patient report and streams it as a PDF download.
   */
  @Endpoint(endpoints.patientReport.downloadPdf, {
    desc: 'Generate and download a patient report PDF.',
  })
  downloadPdf(
    @EndpointParams()
    params: ActionNumberIdParams,
  ) {
    return this.patientReportService.downloadPdf(params.id);
  }
}
