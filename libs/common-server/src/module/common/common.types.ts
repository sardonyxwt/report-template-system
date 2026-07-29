/**
 * Discriminated result of a scheduled operation.
 */
export type CronResult<T = void, E = unknown> =
  | {
      result: T;
      error?: never;
    }
  | {
      result?: never;
      error: E;
    };

/**
 * Contract implemented by services that expose a scheduled runner.
 */
export interface CronRunner<T = void, E = unknown> {
  runner(): Promise<CronResult<T, E>>;
}
