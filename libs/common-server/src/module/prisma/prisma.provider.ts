import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { createHash } from 'crypto';
import { Prisma, PrismaClient } from 'platform/prisma/client';
import { PrismaLogger } from './prisma.logger';
import { PRISMA_MODULE_OPTIONS, PrismaModuleOptions } from './prisma.options';

export { Prisma, PrismaClient };

/**
 * Receives Prisma events from the shared client factory.
 */
export interface PrismaClientLogger {
  /**
   * Handles low-level Prisma query events.
   */
  logQuery(event: Prisma.QueryEvent): void;

  /**
   * Handles Prisma informational, warning, and error events.
   */
  log(level: 'info' | 'warn' | 'error', event: Prisma.LogEvent): void;
}

type SecureFieldOperationArgs = {
  data?: unknown;
  create?: unknown;
  update?: unknown;
  where?: unknown;
};

export type ExtendedPrismaClient = ReturnType<
  (typeof PrismaProvider)['prototype']['createPrismaClient']
>;

/**
 * Nest-managed owner of the Prisma client lifecycle.
 */
@Injectable()
export class PrismaProvider implements OnModuleInit, OnModuleDestroy {
  readonly client: ExtendedPrismaClient;

  constructor(
    @Inject(PrismaLogger)
    logger: PrismaLogger,
    @Inject(PRISMA_MODULE_OPTIONS)
    options: PrismaModuleOptions,
  ) {
    this.client = this.createPrismaClient(options.databaseUrl, logger);
  }

  /**
   * Opens the Prisma connection during module initialization.
   */
  onModuleInit() {
    return this.client.$connect();
  }

  /**
   * Closes the Prisma connection during application shutdown.
   */
  onModuleDestroy() {
    return this.client.$disconnect();
  }

  /**
   * Creates a Prisma client with platform-specific extensions.
   *
   * The client is wired to the configured PostgreSQL adapter and hashes sensitive
   * user credential fields in supported query operations before they reach the
   * database.
   */
  private createPrismaClient(
    datasourceUrl?: string,
    logger?: PrismaClientLogger,
  ) {
    const adapter = new PrismaPg({
      connectionString: datasourceUrl ?? process.env['DATABASE_URL'],
    });

    const client = new PrismaClient({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    if (logger) {
      client.$on('query', logger.logQuery);
      client.$on('info', (e) => logger.log('info', e));
      client.$on('warn', (e) => logger.log('warn', e));
      client.$on('error', (e) => logger.log('error', e));
    }

    return client.$extends({
      query: {
        user: {
          $allOperations({ args, query, operation }) {
            PrismaProvider.bindUserSecureFieldHashing(operation, args);

            return query(args);
          },
        },
      },
    });
  }

  private static get bindUserSecureFieldHashing() {
    const userSecureFields = ['accessToken', 'refreshToken'] as const;

    const hashValue = (value: string) =>
      createHash('md5').update(value).digest('hex');

    const hashUserSecureFields = (
      item: Prisma.UserCreateInput | Prisma.UserUpdateInput,
    ) => {
      for (const field of userSecureFields) {
        const inputValue = item[field];
        const value =
          typeof inputValue === 'object' ? inputValue?.set : inputValue;
        if (typeof value === 'string') {
          item[field] = hashValue(value);
        }
      }
    };

    const hashUserWhereSecureFields = (where: Prisma.UserWhereInput) => {
      for (const field of userSecureFields) {
        const value = where[field];
        if (value && typeof value === 'string') {
          where[field] = hashValue(value);
        }
      }
      if (where.AND) {
        if (Array.isArray(where.AND)) {
          where.AND.forEach(hashUserWhereSecureFields);
        } else {
          hashUserWhereSecureFields(where.AND);
        }
      }
      if (where.OR) {
        where.OR.forEach(hashUserWhereSecureFields);
      }
    };

    return PrismaProvider.bindToOperations(
      hashUserSecureFields,
      hashUserWhereSecureFields,
    );
  }

  private static bindToOperations<UpsertType, WhereType>(
    upsertDataExt: (data: UpsertType) => void,
    searchDataExt: (where: WhereType) => void,
  ) {
    return (operation: string, args: SecureFieldOperationArgs) => {
      switch (operation) {
        case 'create':
        case 'update':
        case 'createMany':
        case 'createManyAndReturn':
        case 'updateMany': {
          const data = Array.isArray(args.data) ? args.data : [args.data];
          for (const item of data) {
            if (item) {
              upsertDataExt(item as UpsertType);
            }
          }
          break;
        }
        case 'upsert': {
          if (args.create) {
            upsertDataExt(args.create as UpsertType);
          }
          if (args.update) {
            upsertDataExt(args.update as UpsertType);
          }
          break;
        }
        default: {
          if (!args.where) {
            break;
          }

          searchDataExt(args.where as WhereType);
        }
      }
    };
  }
}
