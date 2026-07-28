import { Controller, Inject } from '@nestjs/common';
import {
  ActionNumberIdParams,
  TemplateAggregateRequest,
  TemplateCreateRequest,
  TemplateUpdateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody, EndpointParams } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { TemplateService } from './template.service';

@Controller()
export class TemplateApi {
  constructor(
    @Inject(TemplateService)
    private readonly templateService: TemplateService,
  ) {}

  @Endpoint(endpoints.template.create, { desc: 'Create a template.' })
  create(
    @EndpointBody()
    data: TemplateCreateRequest,
  ) {
    return this.templateService.create(data);
  }

  @Endpoint(endpoints.template.update, { desc: 'Update a template.' })
  update(
    @EndpointBody()
    data: TemplateUpdateRequest,
  ) {
    return this.templateService.update(data);
  }

  @Endpoint(endpoints.template.delete, { desc: 'Delete a template by ID.' })
  delete(
    @EndpointParams()
    params: ActionNumberIdParams,
  ) {
    return this.templateService.delete(params.id);
  }

  @Endpoint(endpoints.template.findMany, { desc: 'Find templates.' })
  findMany(
    @EndpointBody()
    data: TemplateAggregateRequest,
  ) {
    return this.templateService.findMany(data);
  }
}
