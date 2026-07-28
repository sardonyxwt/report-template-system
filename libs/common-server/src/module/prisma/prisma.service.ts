import { Inject, Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { PrismaClient, Prisma } from 'platform/prisma/client';

export type PrismaTransaction = Prisma.TransactionClient;

export type PrismaTransactionOptions = { maxWait?: number; timeout?: number };

/**
 * Provides Prisma access with request-local transaction reuse.
 *
 * `run` starts a transaction when none exists and reuses the active transaction
 * when nested service methods call `run` again. Use `tx` for simple reads or
 * writes that can participate in the current transaction when one is active.
 */
@Injectable()
export class PrismaService {
  private storage = new AsyncLocalStorage<PrismaTransaction>();

  constructor(
    @Inject(PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Runs a callback in a Prisma transaction, reusing an outer transaction when
   * the current async scope already has one.
   */
  run<T>(
    cb: (tx: PrismaTransaction) => Promise<T>,
    options?: PrismaTransactionOptions,
  ): Promise<T> {
    const tx = this.storage.getStore();
    if (tx) {
      return cb(tx);
    }

    return this.prisma.$transaction((tx) => {
      return this.storage.run(tx, () => cb(tx));
    }, options);
  }

  /**
   * Runs several Prisma promises in the same transaction and preserves tuple
   * result typing for callers.
   */
  runAll<T extends readonly unknown[] | []>(
    cb: (tx: PrismaTransaction) => T,
    options?: PrismaTransactionOptions,
  ): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
    return this.run((tx) => Promise.all(cb(tx)), options);
  }

  /**
   * Returns the active transaction client, falling back to the root client.
   */
  get tx() {
    return this.storage.getStore() ?? this.prisma;
  }
}
