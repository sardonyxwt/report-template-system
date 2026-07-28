import { toJsonValue } from './utils/data.utils';

const SUPPORTED_LOGGER_LEVELS = [
  'trace',
  'debug',
  'log',
  'info',
  'warn',
  'error',
] as const;

export type AppLoggerLevel = (typeof SUPPORTED_LOGGER_LEVELS)[number];

export type AppLog = {
  level: AppLoggerLevel;
  target?: string;
  message: unknown;
  context?: unknown[];
};

export type AppLoggerMeta = Record<string, unknown>;

export type AppLoggerMetaProvider = () => AppLoggerMeta;

export type AppLoggerMethod = (
  message: unknown,
  target?: string,
  ...context: unknown[]
) => void;

export type AppLoggerHandler = (log: AppLog) => unknown;

export type AppLoggerMethods = Record<AppLoggerLevel, AppLoggerMethod>;

export type AppLogger = Record<AppLoggerLevel, AppLoggerMethod> & {
  name: string;
  setLevel: (level?: AppLoggerLevel) => void;
  setHandler: (provider: AppLoggerHandler) => void;
  trimMessage: (message: unknown) => {
    stringMessage: string;
    jsonMessage: unknown;
    isTrimmed: boolean;
  };
  auto: AppLoggerHandler;
};

export type AppLoggerOptions = {
  name?: string;
  handler?: AppLoggerHandler;
  skipFields?: string[];
  level?: AppLoggerLevel;
  meta?: AppLoggerMetaProvider;
  defaultTarget?: string;
};

const levelsValue: Record<AppLoggerLevel, number> = {
  trace: 1,
  debug: 2,
  log: 3,
  info: 4,
  warn: 5,
  error: 6,
};

export const DEFAULT_LOGGER_LONG_MESSAGE_LENGTH = 120;
export const DEFAULT_LEVEL: AppLoggerLevel = 'info';
export const DEFAULT_NAME = 'default';
export const DEFAULT_TARGET = 'default';

/**
 * Creates a sanitized, level-aware application logger.
 *
 * Log messages are normalized into short strings, long structured messages are
 * preserved in context, and `skipFields` are replaced before transport
 * handling so secrets do not leak into logs.
 */
export const createAppLogger = ({
  handler = ({ level, ...log }) => console[level](log),
  name = DEFAULT_NAME,
  level = DEFAULT_LEVEL,
  defaultTarget = DEFAULT_TARGET,
  skipFields = [],
}: AppLoggerOptions = {}): AppLogger => {
  let currentHandler = handler;
  let currentLevel = SUPPORTED_LOGGER_LEVELS.includes(level)
    ? level
    : DEFAULT_LEVEL;

  const trimMessage = (message: unknown) => {
    const jsonMessage = toJsonValue(message, skipFields);

    let stringMessage = (
      typeof message === 'string' ? message : JSON.stringify(jsonMessage)
    )?.replace(/\s*\r?\n\s*/g, ' ');

    const isLongMessage =
      stringMessage !== undefined &&
      (stringMessage.length ?? 0) > DEFAULT_LOGGER_LONG_MESSAGE_LENGTH;

    if (isLongMessage) {
      stringMessage =
        stringMessage.slice(0, DEFAULT_LOGGER_LONG_MESSAGE_LENGTH) + '...';
    }

    return { stringMessage, jsonMessage, isTrimmed: isLongMessage };
  };

  const handle: AppLoggerHandler = (log) => {
    Promise.resolve(currentHandler(log)).catch(() =>
      console[log.level](log.message, log.context),
    );
  };

  const createLoggerMethod =
    (level: AppLoggerLevel): AppLoggerMethod =>
    (message, target = defaultTarget, ...context) => {
      if (levelsValue[level] < levelsValue[currentLevel]) {
        return;
      }

      const { stringMessage, jsonMessage, isTrimmed } = trimMessage(message);

      const contextParts = [
        ...(context.length ? context : []),
        ...(isTrimmed ? [{ message: jsonMessage }] : []),
      ];

      const jsonContext = toJsonValue(contextParts, skipFields);

      const log: AppLog = {
        level,
        message: stringMessage,
        target,
      };

      if (contextParts.length > 0) {
        log.context = Array.isArray(jsonContext) ? jsonContext : [jsonContext];
      }

      handle(log);
    };

  const logsMethods: AppLoggerMethods = {
    log: createLoggerMethod('debug'),
    debug: createLoggerMethod('debug'),
    trace: createLoggerMethod('trace'),
    info: createLoggerMethod('info'),
    warn: createLoggerMethod('warn'),
    error: createLoggerMethod('error'),
  };

  const auto = (log: AppLog) => {
    logsMethods[log.level](log.message, log.target, ...(log.context ?? []));
  };

  const setLevel = (level: AppLoggerLevel = DEFAULT_LEVEL) => {
    currentLevel = SUPPORTED_LOGGER_LEVELS.includes(level)
      ? level
      : DEFAULT_LEVEL;
  };

  const setHandler = (handler: AppLoggerHandler) => {
    currentHandler = handler;
  };

  return {
    ...logsMethods,
    name,
    auto,
    trimMessage,
    setLevel,
    setHandler,
  };
};
