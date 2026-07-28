import { exec } from 'child_process';
import { config } from 'dotenv';
import { promisify } from 'util';

module.exports = async () => {
  const rootDir = `${__dirname}/../../../..`;

  const envs = ['.env', '.env.local', '.env.test'];

  envs.forEach((env) => config({ path: `${rootDir}/${env}`, override: true }));

  await promisify(exec)(`npx nx run platform/prisma:reset`, {
    env: process.env,
    cwd: process.cwd(),
  });
};
