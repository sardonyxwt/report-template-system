# Report Template System

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
- AI integration: OpenAI Responses API with structured outputs, tool calling, and image inputs.
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
  common-server/          Server-only infrastructure
    src/module/
      auth/               JWT, OAuth session, cookie, guard, and interceptor support
      common/             Logging, request context, decorators, and OpenAPI discovery
      open-ai/            Configured OpenAI SDK client
      prisma/             Prisma lifecycle, transactions, logging, and error mapping
      report-rendering/   Handlebars HTML plus Puppeteer image/PDF rendering
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
OPENAI_API_KEY
OPENAI_MODEL_ALLOWLIST
```

Optional server values supported by the schema include:

```text
LOGGER_LEVEL
JWT_SECRET_EXPIRES
JWT_REFRESH_SECRET_EXPIRES
OPENAI_TIMEOUT_MS
```

Local tooling is also commonly used:

```text
DATABASE_PORT
POSTGRES_PASSWORD
POSTGRES_USER
PUPPETEER_EXECUTABLE_PATH
```

`DATABASE_URL` must point to the PostgreSQL database started by `compose.dev.yml`. `DATABASE_PORT`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` are used by that compose file.

### OpenAI Configuration

The template editor uses the OpenAI API to update one report block at a time.
Create an API key in the
[OpenAI dashboard](https://platform.openai.com/api-keys), then add it only to
the server-side root `.env` file:

```dotenv
OPENAI_API_KEY=<your-project-api-key>
OPENAI_MODEL_ALLOWLIST=gpt-5.6-sol,gpt-5.6-terra,gpt-5.6-luna,gpt-5.4-mini
VITE_OPENAI_MODEL_ALLOWLIST=gpt-5.6-sol,gpt-5.6-terra,gpt-5.6-luna,gpt-5.4-mini
OPENAI_TIMEOUT_MS=120000
```

`OPENAI_API_KEY` and `OPENAI_MODEL_ALLOWLIST` are required for the server to
start. `OPENAI_MODEL_ALLOWLIST` is an ordered, comma-separated list of OpenAI
model IDs and must not contain duplicates. The server uses it to reject model
IDs that are not explicitly allowed.
`OPENAI_TIMEOUT_MS` defaults to `120000`. The official
[OpenAI quickstart](https://developers.openai.com/api/docs/quickstart#create-and-export-an-api-key)
also documents creating and exporting API keys.

Never commit the key, expose it through a `VITE_*` variable, or send it to the
browser. The React client calls the authenticated server endpoint, and only the
server communicates with OpenAI. The key must belong to an OpenAI API project
that can use the selected model; it is separate from browser or ChatGPT
authentication.

The browser builds the model selector directly from
`VITE_OPENAI_MODEL_ALLOWLIST`. It displays and submits each entry as an OpenAI
model ID and selects the first entry by default. This client variable is public
and must contain model IDs only, never credentials.

The client and server variables are intentionally independent. Keep their
values aligned so every model shown by the client is also accepted by the
server. Their order may differ, but the order of `VITE_OPENAI_MODEL_ALLOWLIST`
controls the selector and its default. Restart the server after changing
`OPENAI_MODEL_ALLOWLIST`; restart or rebuild the client after changing
`VITE_OPENAI_MODEL_ALLOWLIST`.

#### Required OpenAI API key permissions

Create the key in the same OpenAI API project that will be billed for template
editing. When creating a restricted project API key, grant these permissions:

| Permission           | Required API operation                                                                                 | Used for                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Responses: Write** | [`POST /v1/responses`](https://developers.openai.com/api/reference/resources/responses/methods/create) | Running AI template edits, structured output, reasoning, and image-based visual validation |

No other OpenAI API permissions are required by the current template editor.
The key must also have access to the models that users are expected to select,
and the OpenAI API project must have billing and usage limits configured.

Use this setup checklist when creating or rotating the key:

1. Create a **project API key**, not a browser or ChatGPT credential.
2. Select **Restricted** permissions.
3. Enable **Write** for Responses.
4. Store the key as `OPENAI_API_KEY` in the server-side root `.env`.
5. Set `OPENAI_MODEL_ALLOWLIST` to the model IDs the server may execute.
6. Set `VITE_OPENAI_MODEL_ALLOWLIST` to the ordered model IDs shown in the
   client.
7. Restart the server and client after replacing the key or either allowlist.
8. Open the template editor and confirm that the expected default is selected.

The current implementation does not call the Models API, so the key does not
need **Models: Read** (`api.model.read`). The Responses API remains
authoritative for whether a selected model supports the structured output,
reasoning, tools, and image inputs used by template editing.

The editor's Speed toggle sends AI requests with the Responses API
`service_tier=priority`; with Speed disabled it explicitly uses the standard
`default` tier. Priority processing has lower latency and premium API pricing.

AI-assisted editing sends the current template HTML, the selected block type,
the user's editing prompt, and synthetic `reportFixture.default` fixture data to
OpenAI. It does not send a persisted patient report. The feature chains
Responses API calls while the template modal remains open; closing the modal
clears that context from client state. Do not place patient-identifying or other
sensitive data directly in a template or AI editing prompt.

The server currently uses stored Responses and `previous_response_id` to
continue the modal-scoped conversation. Closing the modal does not delete those
responses from OpenAI; the provider's
[Responses retention policy](https://developers.openai.com/api/docs/guides/conversation-state#passing-context-from-the-previous-response)
still applies. One edit can make multiple model and image-input calls while the
AI validates the block, so usage is charged to the API project according to
[OpenAI API pricing](https://developers.openai.com/api/docs/pricing).

The visual inspection tool renders a block through Puppeteer. On macOS the
server automatically checks the standard Google Chrome installation path. In
other environments, set `PUPPETEER_EXECUTABLE_PATH` when Puppeteer cannot
resolve a browser executable.

The browser client reads the root `.env` file and validates:

```text
VITE_API_URL
VITE_OPENAI_MODEL_ALLOWLIST
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
VITE_OPENAI_MODEL_ALLOWLIST=gpt-5.6-sol,gpt-5.6-terra,gpt-5.6-luna,gpt-5.4-mini
```

The same callback URL must be registered in the Google OAuth client.

### Test Environment

Before running the server tests, create `.env.test` in the workspace root:

```dotenv
HOST=localhost
PORT=60001
DATABASE_URL=postgresql://<user>:<password>@localhost:<port>/<test-database>
OPENAI_API_KEY=test-placeholder
OPENAI_MODEL_ALLOWLIST=test-model-standard,test-model-fast
```

The test configuration is loaded after `.env` and `.env.local`, so these values
override the corresponding local-development settings. `DATABASE_URL` must point
to a dedicated disposable test database: `npm run server:test` resets that
database before running the test suite. Never use a development, shared, or
production database here.

`.env.test` is ignored by Git and must be created locally for each development
environment.

The placeholder key is sufficient for test suites that do not make live OpenAI
requests. AI integrations should be mocked in automated tests; do not use a
production OpenAI key in `.env.test`.

## First Run

1. Install dependencies:

```bash
npm install
```

2. Create or update the root `.env` file with local development values,
   including `OPENAI_API_KEY`, `OPENAI_MODEL_ALLOWLIST`, and
   `VITE_OPENAI_MODEL_ALLOWLIST`.

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
- `POST /template/preview` renders unsaved template data with synthetic report
  data.
- `POST /template/ai-edit` uses OpenAI to update one unsaved template block for
  authenticated administrators and managers.
- `GET /patient-report/:id/pdf` generates an authorized patient report PDF.

## Common Commands

```bash
# Start the server in development mode
npm run server:serve

# Start the React SPA in development mode
npm run client:serve

# Build the React SPA
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

Note: the server test global setup runs `platform/prisma:reset`, so
`npm run server:test` resets the configured test database before running.

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

- `libs/common-server/src/module/*` contains reusable infrastructure for
  authentication, request/logging context, OpenAPI discovery, OpenAI access,
  Prisma, and report rendering.
- `apps/server/src/future/*` contains the domain-facing `auth`, `clinic`,
  `clinic-report`, `docs`, `manager`, `patient`, `patient-report`, `status`,
  `template`, and `user` modules.

The API contract source of truth lives mostly in `libs/common-base`:

- `endpoints/*.endpoints.ts` describes HTTP method, path, request schema, response schema, guards, tags, and helper URL builders.
- `data/*/*.data.ts` defines Zod schemas for requests and responses.
- `data/*/*.types.ts` exports TypeScript types inferred from those schemas.
- `api/*.api.ts` exposes typed client helpers built from the endpoint definitions.
- `abilities.ts` defines authorization rules used by server services.

`libs/common-server/src/module/common/decorators/endpoint.decorators.ts`
connects these contracts to NestJS and is re-exported through
`platform/common-server`:

- `@Endpoint(...)` maps a shared endpoint definition to a Nest route.
- `@EndpointBody()` parses and validates the request body with the endpoint Zod schema.
- `@EndpointParams()` parses and validates route params.
- Zod response schemas are used by the validation interceptor.
- Endpoint metadata is collected by `DocsService` to build `/docs/openapi.json`.

### Template Rendering And AI Editing

Report output follows one shared rendering path:

1. `ReportHtmlService` matches enabled template blocks to report data by block
   type, compiles their Handlebars markup, and wraps the result in a
   self-contained printable document.
2. Template preview uses `reportFixture.default`, so it can validate unsaved
   markup without reading a persisted patient report.
3. `TemplateAiEditorService` sends only the active block, the surrounding
   template, the user prompt, and synthetic example data through
   `OpenAiService`. Its server-side tools can render HTML or capture a PNG, and
   the final markup is validated by rendering it again.
4. Patient report download combines the stored report and template through
   `ReportHtmlService`, then `ReportPdfService` converts that HTML to an A4 PDF.

Puppeteer-based image and PDF rendering disables browser JavaScript and aborts
outbound page requests. The shared services live in
`libs/common-server/src/module/report-rendering/`.

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

- `apps/server/src/future/user/user.module.ts` registers the controller and
  service.
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
- Keep exported server declarations and public class methods documented with
  concise JSDoc that explains behavior, authorization boundaries, or important
  failure modes.
- Do not expose sensitive fields in response schemas. The user schemas intentionally omit auth tokens.
- Keep Prisma-generated code and generated Zod schemas out of manual edits.
- Use `PrismaService.run(...)` or `runAll(...)` for transactional service work when the existing service style does so.
