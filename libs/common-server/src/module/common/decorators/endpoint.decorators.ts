import {
  BadRequestException,
  CanActivate,
  Delete,
  ExecutionContext,
  Get,
  Head,
  Header,
  HttpCode,
  HttpStatus,
  NestInterceptor,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  SetMetadata,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import { SSE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { z, ZodError, ZodType } from 'zod';
import { ApiEndpoint, HttpMethod } from 'platform/common-base';
import { JwtOptionalAuthGuard } from '../../auth/guard/auth-jwt-optional.guard';
import { JwtRefreshAuthGuard } from '../../auth/guard/auth-jwt-refresh.guard';
import { JwtAuthGuard } from '../../auth/guard/auth-jwt.guard';
import { ZodValidationInterceptor } from '../../auth/interceptor/zod-validation.interceptor';

type Options = {
  desc?: string;
  omit?: boolean;
};

type EndpointMetadataValue = {
  tag?: string;
  endpoint: ApiEndpoint;
  options: Options;
};

/**
 * Stores endpoint contract metadata for runtime discovery and OpenAPI output.
 */
export const SetEndpointMetadata =
  Reflector.createDecorator<EndpointMetadataValue>({
    key: 'ENDPOINT_METADATA_KEY' as const,
  });

const SetBodySchemaMetadata = Reflector.createDecorator<ZodType>({
  key: 'BODY_SCHEMA' as const,
});

const SetParamsSchemaMetadata = Reflector.createDecorator<ZodType>({
  key: 'PARAMS_SCHEMA' as const,
});

/**
 * Binds a shared endpoint contract to a Nest controller method.
 *
 * This decorator is the server-side bridge for contract-first routes: it
 * applies the HTTP method/path, status code, guards, file interceptor, request
 * schema metadata, response validation, SSE metadata, and OpenAPI metadata from
 * one `ApiEndpoint` object.
 */
export const Endpoint = (
  endpoint: ApiEndpoint,
  options: Options = {},
): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    const decorators: MethodDecorator[] = [
      SetEndpointMetadata({ endpoint, tag: target.constructor.name, options }),
    ];

    switch (endpoint.method) {
      case HttpMethod.Put:
        decorators.push(Put(endpoint.path));
        break;
      case HttpMethod.Post:
        decorators.push(Post(endpoint.path));
        break;
      case HttpMethod.Delete:
        decorators.push(Delete(endpoint.path));
        break;
      case HttpMethod.Get:
        decorators.push(Get(endpoint.path));
        break;
      case HttpMethod.Patch:
        decorators.push(Patch(endpoint.path));
        break;
      case HttpMethod.Head:
        decorators.push(Head(endpoint.path));
        break;
    }

    decorators.push(HttpCode(endpoint.status ?? HttpStatus.OK));

    for (const [name, value] of Object.entries(endpoint.headers ?? {})) {
      decorators.push(Header(name, value));
    }

    if (endpoint.body) {
      decorators.push(SetBodySchemaMetadata(endpoint.body));
    }

    if (endpoint.params) {
      decorators.push(SetParamsSchemaMetadata(endpoint.params));
    }

    if (endpoint.events) {
      decorators.push(SetMetadata(SSE_METADATA, true));
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const guards: (CanActivate | Function)[] = [];

    for (const guardName of endpoint.guards ?? []) {
      switch (guardName) {
        case 'auth':
          guards.push(JwtAuthGuard);
          break;
        case 'auth-refresh':
          guards.push(JwtRefreshAuthGuard);
          break;
        case 'auth-optional':
          guards.push(JwtOptionalAuthGuard);
          break;
        default:
          if (guardName.startsWith('oauth-')) {
            guards.push(AuthGuard(guardName));
          }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const interceptors: (NestInterceptor | Function)[] = [];

    if (endpoint.response && endpoint.response instanceof z.ZodType) {
      interceptors.push(new ZodValidationInterceptor(endpoint.response));
    }

    if (guards.length > 0) {
      decorators.push(UseGuards(...guards));
    }

    if (interceptors.length > 0) {
      decorators.push(UseInterceptors(...interceptors));
    }

    applyDecorators(...decorators)(target, propertyKey, descriptor);
  };
};

/**
 * Reads and validates the request body with the Zod schema declared on the
 * endpoint contract.
 */
export const EndpointBody = createParamDecorator<unknown>((options, ctx) => {
  const schema: ZodType = Reflect.getMetadata(
    SetBodySchemaMetadata.KEY,
    ctx.getHandler(),
  );

  const req = ctx.switchToHttp().getRequest<Request>();

  try {
    return schema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException(error.issues);
    }

    throw error;
  }
});

/**
 * Reads and validates route params with the Zod schema declared on the endpoint
 * contract.
 */
export const EndpointParams = createParamDecorator<unknown>((options, ctx) => {
  const schema: ZodType = Reflect.getMetadata(
    SetParamsSchemaMetadata.KEY,
    ctx.getHandler(),
  );

  try {
    return schema.parse(ctx.switchToHttp().getRequest<Request>().params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException(error.issues);
    }

    throw error;
  }
});

/**
 * Reads signed and unsigned cookies through one parameter decorator.
 */
export const Cookies = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const allCookies = {
      ...(request.cookies ?? {}),
      ...(request.signedCookies ?? {}),
    };
    return key ? allCookies[key] : allCookies;
  },
);
