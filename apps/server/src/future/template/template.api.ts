import { Controller, Inject } from '@nestjs/common';
import { from, type Observable } from 'rxjs';
import {
  ActionNumberIdParams,
  TemplateAggregateRequest,
  TemplateAiEditEvent,
  TemplateAiEditRequest,
  TemplateCreateRequest,
  TemplatePreviewRequest,
  TemplateUpdateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody, EndpointParams } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { TemplateService } from './template.service';

/**
 * Contract-backed HTTP controller for report template administration.
 */
@Controller()
export class TemplateApi {
  constructor(
    @Inject(TemplateService)
    private readonly templateService: TemplateService,
  ) {}

  /**
   * Creates a report template.
   */
  @Endpoint(endpoints.template.create, { desc: 'Create a template.' })
  create(
    @EndpointBody()
    data: TemplateCreateRequest,
  ) {
    return this.templateService.create(data);
  }

  /**
   * Updates template metadata and block markup.
   */
  @Endpoint(endpoints.template.update, { desc: 'Update a template.' })
  update(
    @EndpointBody()
    data: TemplateUpdateRequest,
  ) {
    return this.templateService.update(data);
  }

  /**
   * Renders unsaved template data with the synthetic preview report.
   */
  @Endpoint(endpoints.template.preview, {
    desc: 'Render an unsaved template with preview report data.',
  })
  preview(
    @EndpointBody()
    data: TemplatePreviewRequest,
  ) {
    return this.templateService.preview(data);
  }

  /**
   * Streams meaningful AI workflow stages and the final template as SSE.
   */
  @Endpoint(endpoints.template.aiEditStream, {
    desc: 'Stream progress while editing an unsaved template with AI.',
  })
  aiEditStream(
    @EndpointBody()
    data: TemplateAiEditRequest,
  ): Observable<TemplateAiEditEvent> {
    return from(this.templateService.aiEditEvents(data));
  }

  /**
   * Deletes a template by numeric route id.
   */
  @Endpoint(endpoints.template.delete, { desc: 'Delete a template by ID.' })
  delete(
    @EndpointParams()
    params: ActionNumberIdParams,
  ) {
    return this.templateService.delete(params.id);
  }

  /**
   * Returns a filtered template page with total count metadata.
   */
  @Endpoint(endpoints.template.findMany, { desc: 'Find templates.' })
  findMany(
    @EndpointBody()
    data: TemplateAggregateRequest,
  ) {
    return this.templateService.findMany(data);
  }
}
