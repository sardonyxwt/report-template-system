import { Controller, Inject } from '@nestjs/common';
import {
  ActionNumberIdParams,
  ClinicAggregateRequest,
  ClinicCreateRequest,
  ClinicUpdateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody, EndpointParams } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { ClinicService } from './clinic.service';

/**
 * Contract-backed HTTP controller for clinic administration.
 *
 * Request parsing stays in the shared endpoint contracts while authorization
 * and persistence are delegated to `ClinicService`.
 */
@Controller()
export class ClinicApi {
  constructor(
    @Inject(ClinicService)
    private readonly clinicService: ClinicService,
  ) {}

  /**
   * Creates a clinic owned by the requested manager.
   */
  @Endpoint(endpoints.clinic.create, { desc: 'Create a clinic.' })
  create(
    @EndpointBody()
    data: ClinicCreateRequest,
  ) {
    return this.clinicService.create(data);
  }

  /**
   * Updates editable clinic fields.
   */
  @Endpoint(endpoints.clinic.update, { desc: 'Update a clinic.' })
  update(
    @EndpointBody()
    data: ClinicUpdateRequest,
  ) {
    return this.clinicService.update(data);
  }

  /**
   * Deletes a clinic by numeric route id.
   */
  @Endpoint(endpoints.clinic.delete, { desc: 'Delete a clinic by ID.' })
  delete(
    @EndpointParams()
    params: ActionNumberIdParams,
  ) {
    return this.clinicService.delete(params.id);
  }

  /**
   * Returns a filtered clinic page with total count metadata.
   */
  @Endpoint(endpoints.clinic.findMany, { desc: 'Find clinics.' })
  findMany(
    @EndpointBody()
    data: ClinicAggregateRequest,
  ) {
    return this.clinicService.findMany(data);
  }
}
