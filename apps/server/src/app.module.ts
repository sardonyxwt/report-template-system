import {
  Inject,
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { urlencoded } from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { AppLoggerLevel } from 'platform/common-base';
import {
  AuthModule,
  AuthModuleOptions,
  CommonModule,
  CommonModuleOptions,
  OpenAiModule,
  OpenAiModuleOptions,
  PrismaModule,
  PrismaModuleOptions,
  ReportRenderingModule,
} from 'platform/common-server';
import { validateConfiguration, Configuration } from './configuration';
import { AuthFutureModule } from './future/auth/auth.module';
import { ClinicFutureModule } from './future/clinic/clinic.module';
import { ClinicReportFutureModule } from './future/clinic-report/clinic-report.module';
import { DocsFutureModule } from './future/docs/docs.module';
import { ManagerFutureModule } from './future/manager/manager.module';
import { PatientFutureModule } from './future/patient/patient.module';
import { PatientReportFutureModule } from './future/patient-report/patient-report.module';
import { StatusFutureModule } from './future/status/status.module';
import { TemplateFutureModule } from './future/template/template.module';
import { UserFutureModule } from './future/user/user.module';
import { LoggerAuthMetaProvider } from './logger/logger-auth-meta.provider';
import { LoggerRequestMetaProvider } from './logger/logger-request-meta.provider';

/**
 * Global validated configuration module for the server process.
 */
export const AppConfigModule = ConfigModule.forRoot({
  ignoreEnvFile: true,
  isGlobal: true,
  validate: validateConfiguration,
});

/**
 * Root Nest module that wires shared infrastructure and domain feature modules.
 *
 * It translates validated environment values into module options, installs
 * global HTTP middleware, and runs bootstrap maintenance commands after the
 * dependency graph is ready.
 */
@Module({
  imports: [
    // common modules
    AppConfigModule,
    CommonModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<Configuration>,
      ): CommonModuleOptions => ({
        logger: {
          level: config.getOrThrow('LOGGER_LEVEL') as AppLoggerLevel,
        },
      }),
    }),
    PrismaModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<Configuration>,
      ): PrismaModuleOptions => ({
        databaseUrl: config.getOrThrow('DATABASE_URL'),
      }),
    }),
    OpenAiModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<Configuration>,
      ): OpenAiModuleOptions => ({
        apiKey: config.getOrThrow('OPENAI_API_KEY'),
        model: config.getOrThrow('OPENAI_MODEL'),
        timeoutMs: config.getOrThrow('OPENAI_TIMEOUT_MS'),
      }),
    }),
    ReportRenderingModule.forRoot(),
    AuthModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<Configuration>,
      ): AuthModuleOptions => ({
        cookieSecret: config.getOrThrow('COOKIE_SECRET'),
        cookieSecure: config.getOrThrow('COOKIE_SECURE'),
        cookieDomain: config.getOrThrow('COOKIE_DOMAIN'),
        jwtSecret: config.getOrThrow('JWT_SECRET'),
        jwtRefreshSecret: config.getOrThrow('JWT_REFRESH_SECRET'),
        jwtSecretExpires: config.getOrThrow('JWT_SECRET_EXPIRES'),
        jwtRefreshSecretExpires: config.getOrThrow(
          'JWT_REFRESH_SECRET_EXPIRES',
        ),
      }),
    }),
    // future modules
    AuthFutureModule,
    UserFutureModule,
    ManagerFutureModule,
    ClinicFutureModule,
    PatientFutureModule,
    TemplateFutureModule,
    ClinicReportFutureModule,
    PatientReportFutureModule,
    DocsFutureModule,
    StatusFutureModule,
  ],
  providers: [LoggerRequestMetaProvider, LoggerAuthMetaProvider],
})
export class AppModule implements NestModule, OnApplicationBootstrap {
  constructor(
    @Inject(Logger)
    protected readonly logger: Logger,
    @Inject(ConfigService)
    protected readonly config: ConfigService,
  ) {}

  /**
   * Logs resolved server addresses and runs startup maintenance tasks.
   */
  onApplicationBootstrap() {
    const host = this.config.getOrThrow('HOST');
    const port = this.config.getOrThrow('PORT');
    const corsOrigin = this.config.getOrThrow('CORS_ORIGIN');

    this.logger.log(
      `Application module initialized. Server starts at http://${host}:${port}`,
      AppModule.name,
      {
        host,
        port,
        corsOrigin,
      },
    );
  }

  /**
   * Applies cross-cutting Express middleware for every route.
   */
  configure(consumer: MiddlewareConsumer) {
    const origin = this.config.getOrThrow('CORS_ORIGIN');

    consumer
      .apply(
        urlencoded({ extended: true }),
        compression(),
        cors({
          origin,
          credentials: true,
        }),
        helmet({
          crossOriginResourcePolicy: false,
        }),
      )
      .forRoutes('*');
  }
}
