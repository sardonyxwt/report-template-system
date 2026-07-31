import {
  Inject,
  Injectable,
  LoggerService as DefaultLoggerService,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { colorize } from 'json-colorizer';
import {
  createLogger,
  format,
  transports,
  type Logger as WinstonLogger,
  type transport as WinstonTransport,
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

  private static readonly ANSI = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    white: '\x1b[37m',
  };
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

  /**
   * Creates the Winston bridge and redirects console methods into it.
   */
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

  /**
   * Releases Winston transports during Nest shutdown.
   */
  onModuleDestroy() {
    this.winston.destroy();
  }

  /**
   * Reloads metadata providers after all modules are bootstrapped.
   */
  onApplicationBootstrap() {
    this.loadProviders();
  }

  /**
   * Writes a debug-level structured log entry.
   */
  debug = (message: unknown, target?: string, ...context: unknown[]): void => {
    this.logger.debug(message, target, ...this.resolveContext(context));
  };

  /**
   * Writes an info-level structured log entry.
   */
  log = (message: unknown, target?: string, ...context: unknown[]): void => {
    this.logger.info(message, target, ...this.resolveContext(context));
  };

  /**
   * Writes a verbose-level structured log entry.
   */
  verbose = (
    message: unknown,
    target?: string,
    ...context: unknown[]
  ): void => {
    this.logger.log(message, target, ...this.resolveContext(context));
  };

  /**
   * Writes a warning-level structured log entry.
   */
  warn = (message: unknown, target?: string, ...context: unknown[]): void => {
    this.logger.warn(message, target, ...this.resolveContext(context));
  };

  /**
   * Writes an error-level structured log entry.
   */
  error = (message: unknown, target?: string, ...context: unknown[]): void => {
    this.logger.error(message, target, ...this.resolveContext(context));
  };

  /**
   * Writes a fatal condition using the logger's error transport.
   */
  fatal = (message: unknown, target?: string, ...context: unknown[]): void => {
    this.logger.error(message, target, ...this.resolveContext(context));
  };

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

  private createWinstonLogger(extraTransports: WinstonTransport[] = []) {
    return createLogger({
      level: 'debug',
      transports: [this.createConsoleTransport(), ...extraTransports],
    });
  }

  /**
   * Builds the Console transport used by the Nest server logger.
   */
  private createConsoleTransport() {
    return new transports.Console({
      format: format.combine(
        format.colorize({
          level: true,
        }),
        format.timestamp({
          format: 'YY-MM-DD HH:mm:ss',
        }),
        format.printf((info) => {
          const target = (info['target'] as string | undefined) ?? 'default';
          const header = `${LoggerService.ANSI.dim}${info['timestamp']}${LoggerService.ANSI.reset} ${info.level}: ${LoggerService.ANSI.white}[${target}]${LoggerService.ANSI.reset} ${info.message}`;

          if (!info['context']) {
            return `${header}\n`;
          }

          return `${header}\n${this.formatContext(info['context'])}\n`;
        }),
      ),
    });
  }

  /**
   * Formats structured context as an indented, highlighted JSON block.
   */
  private formatContext(context: unknown): string {
    if (context === undefined) {
      return '';
    }

    return colorize(context as object, { indent: 2 })
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
  }
}
