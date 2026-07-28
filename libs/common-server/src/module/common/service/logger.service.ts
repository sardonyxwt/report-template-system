import winstonDevConsole from '@epegzz/winston-dev-console';
import {
  Inject,
  Injectable,
  LoggerService as DefaultLoggerService,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  transport as WinstonTransport,
  Logger as WinstonLogger,
  createLogger,
} from 'winston';
import {
  AppLogger,
  AppLoggerLevel,
  AUTH_COOKIE_KEY,
  AUTH_REFRESH_COOKIE_KEY,
  createAppLogger,
} from 'platform/common-base';
import { COMMON_MODULE_OPTIONS, CommonModuleOptions } from '../common.options';
import {
  LoggerMetaProvider,
  SetLoggerMetaProviderMetadata,
} from '../decorators/logger.decorators';
import { WalkerService } from './walker.service';

/**
 * Application logger adapter for Nest and shared platform logging.
 *
 * The service builds one sanitized logger instance, enriches log context from
 * registered metadata providers, and redirects the global console methods so
 * framework and third-party logs use the same output policy.
 */
@Injectable()
export class LoggerService
  implements
    DefaultLoggerService,
    OnModuleInit,
    OnModuleDestroy,
    OnApplicationBootstrap
{
  private logger!: AppLogger;
  private winston!: WinstonLogger;
  private loggerMetaProviders!: LoggerMetaProvider[];

  private static readonly SKIP_FIELDS = [
    'email',
    'phone',
    'surname',
    'middleName',
    'secret',
    'cardNumber',
    'accessCode',
    'richText',
    'accessToken',
    'refreshToken',
    'code',
    'phoneCode',
    'emailCode',
    'captchaCode',
    'password',
    'externalData',
    'cookie',
    'authorization',
    AUTH_COOKIE_KEY,
    AUTH_REFRESH_COOKIE_KEY,
  ];
  private static readonly CONSOLE_TO_WINSTON_LEVELS: Record<
    keyof Pick<
      typeof console,
      'trace' | 'debug' | 'info' | 'log' | 'warn' | 'error'
    >,
    keyof Pick<WinstonLogger, 'error' | 'warn' | 'verbose' | 'info' | 'debug'>
  > = {
    trace: 'debug',
    debug: 'debug',
    info: 'info',
    log: 'verbose',
    warn: 'warn',
    error: 'error',
  };

  constructor(
    @Inject(WalkerService)
    private readonly walker: WalkerService,
    @Inject(COMMON_MODULE_OPTIONS)
    private readonly options: CommonModuleOptions,
  ) {}

  onModuleInit() {
    this.winston = this.createWinstonLogger(this.options.logger.transports);

    this.logger = createAppLogger({
      handler: ({ level, ...log }) => {
        this.winston[LoggerService.CONSOLE_TO_WINSTON_LEVELS[level]]('', log);
      },
      level: this.options.logger.level as AppLoggerLevel,
      skipFields: LoggerService.SKIP_FIELDS,
    });

    console.trace = (message, ...context) =>
      this.verbose(message, LoggerService.name, ...context);
    console.debug = (message, ...context) =>
      this.debug(message, LoggerService.name, ...context);
    console.info = (message, ...context) =>
      this.log(message, LoggerService.name, ...context);
    console.log = (message, ...context) =>
      this.log(message, LoggerService.name, ...context);
    console.warn = (message, ...context) =>
      this.warn(message, LoggerService.name, ...context);
    console.error = (message, ...context) =>
      this.error(message, LoggerService.name, ...context);
  }

  onModuleDestroy() {
    this.winston.destroy();
  }

  /**
   * Reloads metadata providers after all modules are bootstrapped.
   */
  onApplicationBootstrap() {
    this.loadProviders();
  }

  debug = (message: unknown, target?: string, ...context: unknown[]): void => {
    this.logger.debug(
      message,
      this.resolveTarget(target, this.debug),
      ...this.resolveContext(context),
    );
  };

  log = (message: unknown, target?: string, ...context: unknown[]): void => {
    this.logger.info(
      message,
      this.resolveTarget(target, this.log),
      ...this.resolveContext(context),
    );
  };

  verbose = (
    message: unknown,
    target?: string,
    ...context: unknown[]
  ): void => {
    this.logger.log(
      message,
      this.resolveTarget(target, this.verbose),
      ...this.resolveContext(context),
    );
  };

  warn = (message: unknown, target?: string, ...context: unknown[]): void => {
    this.logger.warn(
      message,
      this.resolveTarget(target, this.warn),
      ...this.resolveContext(context),
    );
  };

  error = (message: unknown, target?: string, ...context: unknown[]): void => {
    this.logger.error(
      message,
      this.resolveTarget(target, this.error),
      ...this.resolveContext(context),
    );
  };

  fatal = (message: unknown, target?: string, ...context: unknown[]): void => {
    this.logger.error(
      message,
      this.resolveTarget(target, this.fatal),
      ...this.resolveContext(context),
    );
  };

  private resolveTarget(
    target: string | undefined,
    caller: (...args: never[]) => unknown,
  ) {
    const targetParts = target ? [target] : [];

    const callPlace = this.resolveCallPlace(caller);

    if (callPlace) {
      targetParts.push(callPlace);
    }

    return targetParts.join(' @ ');
  }

  /**
   * Resolves the first application stack frame after the provided logger method.
   *
   * Passing the logger method to `Error.captureStackTrace` lets V8 trim logger
   * wrapper frames without hardcoded file-path filters.
   */
  private resolveCallPlace(caller: (...args: never[]) => unknown) {
    const error = new Error();
    Error.captureStackTrace(error, caller);

    const stackLine = error.stack?.split('\n')[1];

    if (!stackLine) {
      return undefined;
    }

    const lineMatch = stackLine.match(
      /at (?:(.*?) \()?((?<absoluteFilePath>.+):(?<lineNumber>\d+):(?<columnNumber>\d+))\)?$/,
    );

    if (!lineMatch) {
      return undefined;
    }

    const { absoluteFilePath, lineNumber, columnNumber } =
      lineMatch.groups ?? {};

    if (!absoluteFilePath || !lineNumber || !columnNumber) {
      return undefined;
    }

    const filePath = absoluteFilePath.replace(`${process.cwd()}/`, '');

    return `${filePath}:${lineNumber}:${columnNumber}`;
  }

  private resolveContext(context: unknown[]): unknown[] {
    const meta = Object.assign(
      {},
      ...this.loggerMetaProviders.map((provider) => provider.getLoggerMeta()),
    );

    if (Object.keys(meta).length > 0) {
      context.unshift(meta);
    }

    return context.filter((it) => it !== undefined && it !== null);
  }

  private loadProviders() {
    this.loggerMetaProviders = this.walker.findClassesBy({
      scope: 'providers',
      decorator: SetLoggerMetaProviderMetadata,
    }) as LoggerMetaProvider[];
  }

  private createWinstonLogger(transports: WinstonTransport[] = []) {
    return createLogger({
      level: 'debug',
      transports: [
        winstonDevConsole.transport({
          showTimestamps: true,
          addLineSeparation: true,
          basePath: process.cwd(),
          inspectOptions: {
            colors: true,
            depth: Infinity,
          },
        }),
        ...transports,
      ],
    });
  }
}
