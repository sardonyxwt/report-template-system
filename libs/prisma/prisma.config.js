const { config } = require('dotenv');
const { defineConfig, env } = require('prisma/config');

const rootDir = `${__dirname}/../..`;

['.env', '.env.local'].forEach((env) =>
  config({ path: `${rootDir}/${env}`, override: false }),
);

export default defineConfig({
  schema: 'src/schema.prisma',
  migrations: {
    path: 'migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
