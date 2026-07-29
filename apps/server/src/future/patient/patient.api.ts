import { Controller, Inject } from '@nestjs/common';
import {
  ActionNumberIdParams,
  PatientAggregateRequest,
  PatientCreateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody, EndpointParams } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { PatientService } from './patient.service';

/**
 * Contract-backed HTTP controller for clinic patient administration.
 */
@Controller()
export class PatientApi {
  constructor(
    @Inject(PatientService)
    private readonly patientService: PatientService,
  ) {}

  /**
   * Assigns an existing user to a clinic as a patient.
   */
  @Endpoint(endpoints.patient.create, { desc: 'Create a patient by email.' })
  create(
    @EndpointBody()
    data: PatientCreateRequest,
  ) {
    return this.patientService.create(data);
  }

  /**
   * Deletes a patient assignment by user id.
   */
  @Endpoint(endpoints.patient.delete, { desc: 'Delete a patient by user ID.' })
  delete(
    @EndpointParams()
    params: ActionNumberIdParams,
  ) {
    return this.patientService.delete(params.id);
  }

  /**
   * Returns a filtered patient page with total count metadata.
   */
  @Endpoint(endpoints.patient.findMany, { desc: 'Find patients.' })
  findMany(
    @EndpointBody()
    data: PatientAggregateRequest,
  ) {
    return this.patientService.findMany(data);
  }
}
