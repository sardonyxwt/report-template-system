import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import isNil from 'lodash/isNil';
import omitBy from 'lodash/omitBy';
import { OpenAPIObject } from 'openapi3-ts/oas31';
import { z, ZodType } from 'zod';
import {
  ZodOpenApiComponentsObject,
  ZodOpenApiOperationObject,
  ZodOpenApiPathItemObject,
  ZodOpenApiPathsObject,
  ZodOpenApiResponseObject,
  createDocument,
} from 'zod-openapi';
import {
  ApiEndpointGuard,
  AUTH_COOKIE_KEY,
  AUTH_REFRESH_COOKIE_KEY,
  JsonSchema,
} from 'platform/common-base';
import { SetEndpointMetadata } from '../decorators/endpoint.decorators';
import { WalkerService } from './walker.service';

/**
 * Builds the runtime OpenAPI document from `@Endpoint` metadata.
 *
 * The generator walks registered Nest controllers, reads shared endpoint
 * contracts, converts Nest-style `/:id` paths to OpenAPI `/{id}` paths, and
 * maps endpoint guards to documented security schemes.
 */
@Injectable()
export class OpenapiService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(WalkerService)
    private readonly walkerService: WalkerService,
  ) {}

  private static readonly SECURITY_SCHEMES = {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: AUTH_COOKIE_KEY,
    },
    cookieRefreshAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: AUTH_REFRESH_COOKIE_KEY,
    },
  } satisfies ZodOpenApiComponentsObject['securitySchemes'];

  /**
   * Generates a fresh OpenAPI 3.1 document for the current application graph.
   */
  async json({
    info,
    servers,
  }: Pick<OpenAPIObject, 'servers' | 'info'>): Promise<OpenAPIObject> {
    this.logger.log('OpenAPI document generation started', OpenapiService.name);

    const endpoints = this.walkerService.findMethodsBy({
      scope: 'controllers',
      methodDecorator: SetEndpointMetadata,
      methodDecoratorPredicate: (metadata) => !metadata.options.omit,
    });

    const endpointMetadata = this.walkerService.findMetadataOf(
      endpoints,
      SetEndpointMetadata,
    );

    this.logger.log('OpenAPI endpoint metadata resolved', OpenapiService.name, {
      endpointsCount: endpoints.length,
      metadataCount: endpointMetadata.length,
    });

    const schemas: ZodType[] = [JsonSchema];
    const paths: ZodOpenApiPathsObject = {};

    let operationsCount = 0;

    for (const { tag, endpoint, options } of endpointMetadata) {
      if (options.omit) {
        continue;
      }

      const formatedPath = this.resolvePath(endpoint.path);

      if (!(formatedPath in paths)) {
        paths[formatedPath] = {};
      }

      const status = (endpoint.status ?? HttpStatus.OK) as 200;

      const path = paths[formatedPath];

      let requestBody: ZodOpenApiOperationObject['requestBody'] | undefined;
      let requestParams: ZodOpenApiOperationObject['requestParams'] | undefined;
      let responses: ZodOpenApiOperationObject['responses'];

      if (endpoint.body) {
        schemas.push(endpoint.body);
        requestBody = {
          content: {
            'application/json': {
              schema: endpoint.body,
            },
          },
        };
      }

      if (
        endpoint.response &&
        endpoint.response instanceof z.ZodType &&
        !(endpoint.response instanceof z.ZodVoid)
      ) {
        schemas.push(endpoint.response);
        responses = {
          [status]: {
            description: 'Success response',
            content: {
              [endpoint.events ? 'text/event-stream' : 'application/json']: {
                schema: endpoint.response,
                example: [endpoint.response.meta()?.example],
              },
            },
          } as ZodOpenApiResponseObject,
        };
      } else if (
        endpoint.response &&
        'type' in endpoint.response &&
        endpoint.response.type === 'file'
      ) {
        responses = {
          [status]: {
            description: 'Success response',
            content: Object.fromEntries(
              endpoint.response.mimetype.map((mimetype) => [
                mimetype,
                {
                  schema: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              ]),
            ),
          } as ZodOpenApiResponseObject,
        };
      } else {
        responses = {
          [200]: {
            description: 'Success response',
          },
        };
      }

      if (endpoint.params) {
        schemas.push(endpoint.params);
        requestParams = {
          path: endpoint.params as z.ZodType<unknown, Record<string, unknown>>,
        };
      }

      path[endpoint.method.toLowerCase() as keyof ZodOpenApiPathItemObject] =
        omitBy(
          {
            description: options.desc,
            security: this.resolveSecurity(endpoint.guards),
            tags: [tag],
            requestParams,
            requestBody,
            responses,
          } as ZodOpenApiOperationObject,
          isNil,
        );

      operationsCount++;
    }

    const schemasRefs = schemas.reduce((map, schema) => {
      const meta = schema.meta();

      return meta?.name ? { ...map, [meta.name]: schema } : map;
    }, {});

    const document = createDocument({
      openapi: '3.1.0',
      servers,
      info,
      paths,
      components: {
        securitySchemes: OpenapiService.SECURITY_SCHEMES,
        schemas: schemasRefs,
      },
    });

    this.logger.log('OpenAPI document generated', OpenapiService.name, {
      pathsCount: Object.keys(paths).length,
      operationsCount,
      schemasCount: Object.keys(schemasRefs).length,
    });

    return document;
  }

  private resolvePath(path: string) {
    let formatedPath = path;

    const pathParamsRegexp = new RegExp(
      '(?<param>\\/:(?<name>[a-zA-Z]+))',
      'g',
    );

    Array.from(formatedPath.matchAll(pathParamsRegexp)).forEach(
      ({ groups }) => {
        formatedPath = formatedPath.replace(
          groups!['param'],
          `/{${groups!['name']}}`,
        );
      },
    );

    return formatedPath;
  }

  private resolveSecurity(guards?: ApiEndpointGuard[]) {
    type AuthType = keyof typeof OpenapiService.SECURITY_SCHEMES;

    if (!guards || guards.length === 0) {
      return;
    }

    const result: AuthType[] = [];

    for (const guard of guards ?? []) {
      switch (guard) {
        case 'auth':
          result.push('bearerAuth', 'cookieAuth');
          break;
        case 'auth-refresh':
          result.push('bearerAuth', 'cookieRefreshAuth');
          break;
      }
    }

    if (result.length === 0) {
      return;
    }

    return result.map((it) => ({ [it]: [] }));
  }
}
