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

@Controller()
export class ClinicApi {
  constructor(
    @Inject(ClinicService)
    private readonly clinicService: ClinicService,
  ) {}

  @Endpoint(endpoints.clinic.create, { desc: 'Create a clinic.' })
  create(
    @EndpointBody()
    data: ClinicCreateRequest,
  ) {
    return this.clinicService.create(data);
  }

  @Endpoint(endpoints.clinic.update, { desc: 'Update a clinic.' })
  update(
    @EndpointBody()
    data: ClinicUpdateRequest,
  ) {
    return this.clinicService.update(data);
  }

  @Endpoint(endpoints.clinic.delete, { desc: 'Delete a clinic by ID.' })
  delete(
    @EndpointParams()
    params: ActionNumberIdParams,
  ) {
    return this.clinicService.delete(params.id);
  }

  @Endpoint(endpoints.clinic.findMany, { desc: 'Find clinics.' })
  findMany(
    @EndpointBody()
    data: ClinicAggregateRequest,
  ) {
    return this.clinicService.findMany(data);
  }
}
