import { Controller, Inject } from '@nestjs/common';
import { Endpoint } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { DocsService } from './docs.service';

/**
 * Serves generated API documentation artifacts.
 *
 * The OpenAPI endpoint is omitted from the generated OpenAPI document itself
 * to avoid documenting the documentation transport as part of the product API.
 */
@Controller()
export class DocsApi {
  constructor(
    @Inject(DocsService)
    private readonly docsService: DocsService,
  ) {}

  /**
   * Generates and returns the current OpenAPI document from endpoint metadata.
   */
  @Endpoint(endpoints.docs.json, {
    desc: 'Return the OpenAPI JSON document.',
    omit: true,
  })
  json() {
    return this.docsService.json();
  }
}
