export type CronResult<T = void, E = unknown> =
  | {
      result: T;
      error?: never;
    }
  | {
      result?: never;
      error: E;
    };

export interface CronRunner<T = void, E = unknown> {
  runner(): Promise<CronResult<T, E>>;
}
