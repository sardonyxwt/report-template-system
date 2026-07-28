import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenapiService } from 'platform/common-server';
import { Configuration } from '../../configuration';

/**
 * Application service for generated API documentation artifacts.
 */
@Injectable()
export class DocsService {
  constructor(
    @Inject(OpenapiService)
    private readonly openapiService: OpenapiService,
    @Inject(ConfigService)
    private readonly config: ConfigService<Configuration>,
  ) {}

  /**
   * Generates and returns the current OpenAPI document from endpoint metadata.
   */
  json() {
    const host = this.config.getOrThrow('HOST');
    const port = this.config.getOrThrow('PORT');

    return this.openapiService.json({
      info: {
        title: 'platform/server',
        version: '1.0.0',
      },
      servers: [
        {
          description: 'Local Server',
          url: `http://${host}:${port}`,
        },
      ],
    });
  }
}
