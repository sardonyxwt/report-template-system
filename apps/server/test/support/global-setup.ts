import { exec } from 'child_process';
import { config } from 'dotenv';
import * as portFinder from 'portfinder';
import { promisify } from 'util';

module.exports = async () => {
  const rootDir = `${__dirname}/../../../..`;

  const envs = [
    '.env',
    '.env.local',
    'apps/server/.env',
    'apps/server/.env.local',
  ];

  envs.forEach((env) => config({ path: `${rootDir}/${env}` }));

  process.env.HOST = '0.0.0.0';
  process.env.PORT = (await portFinder.getPortPromise()).toString();

  process.env.DATABASE_URL =
    'postgresql://root:secret@localhost:5432/platform?schema=test';

  await promisify(exec)(`npx nx run platform/prisma:reset`, {
    env: process.env,
    cwd: process.cwd(),
  });
};
