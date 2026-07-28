import { getDMMF } from '@prisma/internals';
import { readFileSync } from 'node:fs';
import { AppTestModule } from '../app.module';

export const createPrismaHelper = (appModule: AppTestModule) => {
  const cleanup = async () => {
    const rootDir = `${__dirname}/../../../../..`;

    const schema = readFileSync(
      `${rootDir}/libs/prisma/src/schema.prisma`,
      'utf-8',
    );
    const dmmf = await getDMMF({ datamodel: schema });

    const tables = dmmf.datamodel.models
      .map((model) => model.dbName)
      .filter((table) => table);

    await appModule.prisma.$transaction([
      ...tables.map((table) =>
        appModule.prisma.$executeRawUnsafe(
          `TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`,
        ),
      ),
    ]);
  };

  return { cleanup };
};

export type PrismaHelper = ReturnType<typeof createPrismaHelper>;
