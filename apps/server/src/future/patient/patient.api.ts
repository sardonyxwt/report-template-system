import { Controller, Inject } from '@nestjs/common';
import {
  PatientAggregateRequest,
  PatientCreateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { PatientService } from './patient.service';

@Controller()
export class PatientApi {
  constructor(
    @Inject(PatientService)
    private readonly patientService: PatientService,
  ) {}

  @Endpoint(endpoints.patient.create, { desc: 'Create a patient by email.' })
  create(
    @EndpointBody()
    data: PatientCreateRequest,
  ) {
    return this.patientService.create(data);
  }

  @Endpoint(endpoints.patient.findMany, { desc: 'Find patients.' })
  findMany(
    @EndpointBody()
    data: PatientAggregateRequest,
  ) {
    return this.patientService.findMany(data);
  }
}
