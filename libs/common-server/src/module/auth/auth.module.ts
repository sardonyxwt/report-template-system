import {
  DynamicModule,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import cookieParser from 'cookie-parser';
import {
  AUTH_MODULE_OPTIONS,
  AuthModuleAsyncOptions,
  AuthModuleOptions,
} from './auth.options';
import { SessionMiddleware } from './middleware/session.middleware';
import { CookieService } from './service/cookie.service';
import { SessionService } from './service/session.service';
import { TokensService } from './service/tokens.service';
import { JwtAuthStrategy } from './strategy/jwt-auth.strategy';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';

/**
 * Global authentication infrastructure module.
 *
 * It registers Passport/JWT strategies, signed cookie parsing, request-local
 * session context, token helpers, and cookie helpers used by feature modules.
 */
@Module({})
export class AuthModule implements NestModule {
  constructor(
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly options: AuthModuleOptions,
  ) {}

  private static readonly IMPORTS = [
    JwtModule.register({}),
    PassportModule.register({}),
  ] satisfies ModuleMetadata['imports'];

  private static readonly PROVIDERS = [
    JwtAuthStrategy,
    JwtRefreshStrategy,
    CookieService,
    TokensService,
    SessionService,
  ] satisfies ModuleMetadata['providers'];

  private static readonly EXPORTS = [
    CookieService,
    SessionService,
    TokensService,
  ] satisfies ModuleMetadata['exports'];

  /**
   * Registers auth infrastructure with already resolved options.
   */
  static register(options: AuthModuleOptions): DynamicModule {
    return this.registerAsync({ useFactory: () => options });
  }

  /**
   * Registers auth infrastructure from async module options.
   */
  static registerAsync(options: AuthModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: AuthModule,
      imports: AuthModule.IMPORTS,
      providers: [
        {
          provide: AUTH_MODULE_OPTIONS,
          inject: options.inject,
          useFactory: options.useFactory,
        },
        ...AuthModule.PROVIDERS,
      ],
      exports: AuthModule.EXPORTS,
    };
  }

  /**
   * Installs signed cookie parsing and request-local session context globally.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(cookieParser(this.options.cookieSecret), SessionMiddleware)
      .forRoutes('*');
  }
}

export * from './auth.decorators';
export * from './auth.options';
export * from './guard/auth-jwt-optional.guard';
export * from './guard/auth-jwt-refresh.guard';
export * from './guard/auth-jwt.guard';
export * from './interceptor/zod-validation.interceptor';
export * from './middleware/session.middleware';
export * from './service/cookie.service';
export * from './service/session.service';
export * from './service/tokens.service';
export * from './strategy/jwt-auth.strategy';
export * from './strategy/jwt-refresh.strategy';
export * from './strategy/jwt.strategy';
