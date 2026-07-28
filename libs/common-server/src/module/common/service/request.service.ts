import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

type AsyncStoreRequest = {
  requestId: string;
};

/**
 * Stores request-scoped metadata in AsyncLocalStorage.
 *
 * `RequestMiddleware` initializes the scope for each HTTP request so loggers
 * and downstream services can read the request id without passing it through
 * every call.
 */
@Injectable()
export class RequestService {
  private storage = new AsyncLocalStorage<AsyncStoreRequest>();

  /**
   * Runs a callback with the provided request metadata bound to async context.
   */
  init<T>(store: AsyncStoreRequest, cb: () => T | Promise<T>): Promise<T> {
    return this.storage.run(store, async () => cb());
  }

  /**
   * Returns the current request id if code is running inside a request scope.
   */
  get requestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }
}
