# Platform Test

Platform is an Nx monorepo with a NestJS backend API, React client, shared API contracts, Prisma database schema, and server-side utilities. The backend is organized around reusable endpoint definitions and Zod schemas so the same contracts can drive request validation, response validation, typed client helpers, and OpenAPI documentation.

## Technology Stack

- Runtime: Node.js with TypeScript.
- Workspace: Nx.
- Client: React 19, Vite, React Router, Tailwind CSS, and ShadCN.
- Backend framework: NestJS 11 on Express.
- Database: PostgreSQL, managed through Prisma 7.
- Validation and contracts: Zod 4, custom aliases in `platform/zod`, and generated Prisma Zod schemas.
- API documentation: OpenAPI 3.1 generated from endpoint metadata and Zod schemas.
- Authentication: JWT, refresh JWT, signed cookies, Passport strategies, and Google OAuth.
- Testing: Jest 30, ts-jest, Supertest, serial test runner.
- Code quality: ESLint flat config, Prettier, import ordering, unused import checks.
- Observability: Nest logger integration with structured application logging.

## Repository Layout

```text
apps/
  client/                 React single-page application
    src/
      api/                Contract-driven browser API transport
      components/         ShadCN UI, forms, tables, and shared views
      providers/          Authentication and centralized access control
      routes/             Route paths and React Router configuration
  server/                 NestJS application
    src/
      future/             Domain-facing API modules
      app.module.ts       Application composition
      config.ts           Nest bootstrap helpers
      configuration.ts    Runtime environment schema
      endpoints.ts        Server endpoint map from shared contracts
    test/                 E2E tests, fixtures, and test bootstrap

libs/
  common-base/            Shared API contracts, endpoint maps, DTO schemas, utilities, abilities
  common-server/          Server-only modules, decorators, guards, interceptors, services
  prisma/                 Prisma schema, generated client, include helpers, migrations
  zod/                    Shared Zod aliases, helpers, and error utilities

assets/                   Static and template assets served by the backend
compose.dev.yml           Development PostgreSQL service
nx.json                   Nx workspace configuration
tsconfig.base.json        TypeScript path aliases
```

The most important path aliases are:

- `platform/common-base` for shared schemas, endpoint definitions, response/request types, and client helpers.
- `platform/prisma` for Prisma exports, generated schemas, includes, and database types.
- `platform/prisma/client` and `platform/prisma/types` for generated Prisma client/browser type entrypoints.
- `platform/common-server` for backend-only shared helpers.
- `platform/zod` for shared Zod aliases and helpers.

## Environment

Runtime configuration is validated in `apps/server/src/configuration.ts`, with shared defaults in `libs/common-base/src/env.ts`. The local Prisma config loads `.env` and `.env.local` from the repository root.

Create a root `.env` file with the values used by your local team environment. Do not commit secrets. The server configuration requires these variables:

```text
COOKIE_DOMAIN
COOKIE_SECRET
COOKIE_SECURE
CORS_ORIGIN
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URL
HOST
PORT
JWT_REFRESH_SECRET
JWT_SECRET
```

Optional server values supported by the schema include:

```text
LOGGER_LEVEL
JWT_SECRET_EXPIRES
JWT_REFRESH_SECRET_EXPIRES
```

Local tooling is also commonly used:

```text
DATABASE_PORT
POSTGRES_PASSWORD
POSTGRES_USER
```

`DATABASE_URL` must point to the PostgreSQL database started by `compose.dev.yml`. `DATABASE_PORT`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` are used by that compose file.

The browser client reads the root `.env` file and validates:

```text
VITE_API_URL
```

Optional client ports default to `4201` for the development server and `4301`
for Vite preview:

```text
VITE_CLIENT_PORT
VITE_CLIENT_PREVIEW_PORT
```

For local OAuth, the server and client origins must match the browser URLs:

```text
CORS_ORIGIN=http://localhost:4201
GOOGLE_REDIRECT_URL=http://localhost:4201/oauth/google
VITE_API_URL=http://localhost:60000
```

The same callback URL must be registered in the Google OAuth client.

### Test Environment

Before running the server tests, create `.env.test` in the workspace root:

```dotenv
HOST=localhost
PORT=60001
DATABASE_URL=postgresql://<user>:<password>@localhost:<port>/<test-database>
```

The test configuration is loaded after `.env` and `.env.local`, so these values
override the corresponding local-development settings. `DATABASE_URL` must point
to a dedicated disposable test database: `npm run server:test` resets that
database before running the test suite. Never use a development, shared, or
production database here.

`.env.test` is ignored by Git and must be created locally for each development
environment.

## First Run

1. Install dependencies:

```bash
npm install
```

2. Create or update the root `.env` file with local development values.

3. Start PostgreSQL:

```bash
docker compose -f compose.dev.yml up -d
```

4. Generate Prisma client and Zod schemas:

```bash
npm run prisma:generate
```

5. Apply local database migrations:

```bash
npm run prisma:migrate
```

6. Start the backend:

```bash
npm run server:serve
```

7. In another terminal, start the React client:

```bash
npm run client:serve
```

The server binds to `HOST` and `PORT` from `.env`. Useful development endpoints:

- `GET /status` checks server status.
- `GET /docs/openapi.json` returns the generated OpenAPI document.

## Common Commands

```bash
# Start the server in development mode
npm run server:serve

# Start the React SPA in development mode
npm run client:serve

# Type-check and build the React SPA
npm run client:typecheck
npm run client:build

# Build the server
npm run server:build

# Lint all configured projects
npm run lint

# Run server tests
npm run server:test

# Generate Prisma client and Zod schemas
npm run prisma:generate

# Create the first development migration
npm run prisma:init

# Create/apply a development migration
npm run prisma:migrate

# Apply migrations in deploy mode
npx nx run platform/prisma:deploy

# Reset the local database
npx nx run platform/prisma:reset

# Open Prisma Studio
npm run prisma:studio
```

Note: `platform/server:test` depends on `platform/prisma:reset`, so it resets the configured test database before running.

## Documentation

The server exposes contract-driven OpenAPI JSON at runtime:

```bash
npm run server:serve
```

Then open:

```text
http://$HOST:$PORT/docs/openapi.json
```

## Architecture

The backend is split into two layers:

- `libs/common-server/src/module/*` contains infrastructure modules: authentication, Prisma access, common services, guards, interceptors, and middleware.
- `apps/server/src/future/*` contains domain-facing API modules such as `auth`, `user`, `manager`, `docs`, and `status`.

The API contract source of truth lives mostly in `libs/common-base`:

- `endpoints/*.endpoints.ts` describes HTTP method, path, request schema, response schema, guards, tags, and helper URL builders.
- `data/*/*.data.ts` defines Zod schemas for requests and responses.
- `data/*/*.types.ts` exports TypeScript types inferred from those schemas.
- `api/*.api.ts` exposes typed client helpers built from the endpoint definitions.
- `abilities.ts` defines authorization rules used by server services.

`libs/common-server/src/decorators.ts` connects these contracts to NestJS:

- `@Endpoint(...)` maps a shared endpoint definition to a Nest route.
- `@EndpointBody()` parses and validates the request body with the endpoint Zod schema.
- `@EndpointParams()` parses and validates route params.
- Zod response schemas are used by the validation interceptor.
- Endpoint metadata is collected by `DocsService` to build `/docs/openapi.json`.

Prisma owns the persistent model in `libs/prisma/src/schema.prisma`. Generated Prisma and Zod artifacts are intentionally ignored by lint rules and should be regenerated instead of edited by hand.

## Entity Example: User

The `user` entity shows the expected shape for a domain module.

Database model:

- `libs/prisma/src/schema.prisma` defines `User`, `Manager`, `AuthProvider`, and related enums.
- `libs/prisma/src/include/user.include.ts` exposes the public user include map, backed by variants in `libs/prisma/src/include/user/`.

Shared contracts:

- `libs/common-base/src/data/user/user-simple.data.ts` defines a safe user shape without access and refresh tokens.
- `libs/common-base/src/data/user/user.data.ts` defines create, update, aggregate, and response schemas.
- `libs/common-base/src/data/user/user.types.ts` exports inferred request and response types.
- `libs/common-base/src/endpoints/user.endpoints.ts` defines routes such as:
  - `POST /user`
  - `PUT /user`
  - `DELETE /user/model/:id`
  - `POST /user/select`

Server module:

- `apps/server/src/future/user/user.module.ts` registers the controller and service and applies JSON body parsing.
- `apps/server/src/future/user/user.api.ts` maps endpoint definitions to controller methods.
- `apps/server/src/future/user/user.service.ts` contains business logic, Prisma calls, and authorization checks.

Authorization:

- `libs/common-base/src/abilities.ts` defines `users.read`, `users.create`, `users.update`, and `users.delete`.
- `UserService` calls `session.abilityGuard(...)` before protected operations.

When adding a similar entity, follow this sequence:

1. Add or update the Prisma model and relations in `libs/prisma/src/schema.prisma`.
2. Add Prisma include variants under `libs/prisma/src/include/<entity>/` and expose a public include map from `libs/prisma/src/include/<entity>.include.ts` when services need reusable includes.
3. Run `npm run prisma:generate` after schema changes.
4. Add Zod request/response schemas and inferred types in `libs/common-base/src/data/<entity>/`.
5. Add endpoint definitions in `libs/common-base/src/endpoints/<entity>.endpoints.ts`.
6. Add typed API client helpers in `libs/common-base/src/api/<entity>.api.ts` if consumers need them.
7. Export public data, endpoints, and API builders from `libs/common-base/src/index.ts`, including `createEndpoints()` and `createApi()` entries for routed entities.
8. Add authorization rules to `libs/common-base/src/abilities.ts` when the entity is protected.
9. Add a Nest module, controller API class, and service under `apps/server/src/future/<entity>/`.
10. Register the module in `apps/server/src/app.module.ts`.
11. Add e2e tests under `apps/server/test/suites/api/`.
12. Run the smallest useful checks: Prisma generation for schema changes, then lint, tests, and build as needed.

## Development Notes

- Prefer contract-first changes: update `libs/common-base` endpoint and schema definitions before wiring server handlers.
- Do not expose sensitive fields in response schemas. The user schemas intentionally omit auth tokens.
- Keep Prisma-generated code and generated Zod schemas out of manual edits.
- Use `PrismaService.run(...)` or `runAll(...)` for transactional service work when the existing service style does so.
