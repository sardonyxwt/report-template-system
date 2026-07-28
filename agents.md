# Agent Guide

This file is for AI agents and contributors working inside this repository. Keep changes aligned with the existing architecture: Nx workspace, NestJS server, Prisma schema, shared Zod contracts, and contract-driven endpoint metadata.

## Project Summary

Platform is a TypeScript/Nx backend platform. The active application is `platform/server`, a NestJS API backed by PostgreSQL through Prisma. Shared API contracts live in `platform/common-base`; server-only modules, decorators, guards, interceptors, and services live in `platform/common-server`; database schema and generated Prisma/Zod artifacts live in `platform/prisma`; reusable Zod aliases live in `platform/zod`.

The central design pattern is contract-first API development:

1. Shared Zod schemas define request and response shapes.
2. Shared endpoint objects define method, path, params, body, response, guards, and tags.
3. Nest controllers use `@Endpoint(...)`, `@EndpointBody()`, and `@EndpointParams()` to bind those contracts to runtime handlers.
4. OpenAPI is generated from endpoint metadata and Zod schemas.
5. Typed API client helpers can be built from the same endpoint definitions.

## Key Paths

```text
apps/server/src/app.module.ts              Main Nest module composition
apps/server/src/config.ts                  Nest bootstrap helpers
apps/server/src/configuration.ts           Runtime environment validation
apps/server/src/endpoints.ts               Server endpoint map from shared contracts
apps/server/src/future/<domain>/           Domain API modules
apps/server/test/suites/api/               API e2e tests

libs/common-base/src/data/<domain>/        Zod schemas and inferred DTO types
libs/common-base/src/endpoints/            Shared endpoint definitions
libs/common-base/src/api/                  Typed API helper builders
libs/common-base/src/abilities.ts          Authorization rules

libs/common-server/src/decorators.ts       Endpoint, body, params, and socket decorators
libs/common-server/src/module/<infra>/     Shared server infrastructure
libs/prisma/src/schema.prisma              Database schema
libs/prisma/src/include/<domain>/          Prisma include helper variants
libs/prisma/migrations/                    Database migrations
libs/zod/src/                              Shared Zod aliases and helpers
```

## Commands

Prefer the root npm aliases for common local tasks. Nx targets are still the source of truth when a script does not exist.

```bash
npm install
docker compose -f compose.dev.yml up -d
npm run prisma:generate
npm run prisma:migrate
npm run server:serve
npm run server:test
npm run server:build
```

Other useful scripts:

```bash
npm run lint
npm run prisma:init
npm run prisma:studio
```

Be careful with:

```bash
npx nx run platform/prisma:reset
```

It resets the configured database. The server test target depends on this reset for the configured test database.

## Environment Rules

- Read required variables from `apps/server/src/configuration.ts` and shared env defaults from `libs/common-base/src/env.ts`.
- Root `.env` and `.env.local` are loaded by Prisma config.
- Never print, copy, or commit secret values.
- `DATABASE_URL` must match the PostgreSQL service from `compose.dev.yml`.

## Working With Entities

Use the `user` entity as the main example.

### User Flow

Database:

- `libs/prisma/src/schema.prisma` defines `User`, `Manager`, `AuthProvider`, and related enums.
- `libs/prisma/src/include/user.include.ts` is the public include map, backed by variant files in `libs/prisma/src/include/user/`.

Contracts:

- `libs/common-base/src/data/user/user-simple.data.ts` removes sensitive token fields from public user responses.
- `libs/common-base/src/data/user/user.data.ts` defines create, update, aggregate, and response schemas.
- `libs/common-base/src/data/user/user.types.ts` exports inferred request and response types.
- `libs/common-base/src/endpoints/user.endpoints.ts` defines all user routes and their guards.

Server:

- `apps/server/src/future/user/user.module.ts` registers the controller and service.
- `apps/server/src/future/user/user.api.ts` is a thin controller that maps endpoints to service methods.
- `apps/server/src/future/user/user.service.ts` owns business logic, authorization, and Prisma calls.

Authorization:

- `libs/common-base/src/abilities.ts` defines user permissions.
- Server services call `session.abilityGuard(...)` before protected operations.

### Adding Or Updating An Entity

1. Update `libs/prisma/src/schema.prisma`.
2. Add include variants in `libs/prisma/src/include/<entity>/` and expose them through `libs/prisma/src/include/<entity>.include.ts` when services need reusable include trees.
3. Run `npm run prisma:generate` after schema changes.
4. Add request/response schemas in `libs/common-base/src/data/<entity>/` and inferred types in `<entity>.types.ts`.
5. Add endpoint definitions in `libs/common-base/src/endpoints/<entity>.endpoints.ts`.
6. Add typed API helpers in `libs/common-base/src/api/` when consumers need them.
7. Export public data, endpoints, and API builders from `libs/common-base/src/index.ts`, including `createEndpoints()` and `createApi()` if the entity has routes/client helpers.
8. Update `libs/common-base/src/abilities.ts` for protected operations.
9. Add `apps/server/src/future/<entity>/<entity>.module.ts`, `<entity>.api.ts`, and `<entity>.service.ts`.
10. Register the future module in `apps/server/src/app.module.ts`.
11. Add e2e coverage under `apps/server/test/suites/api/`.
12. Run the smallest useful checks.

## Implementation Guidelines

- Keep controllers thin. They should delegate to services.
- Keep request and response validation in shared Zod schemas.
- Do not hand-edit generated Prisma client files or generated Prisma Zod schema files.
- Do not return sensitive fields from response schemas.
- Reuse `@Endpoint`, `@EndpointBody`, and `@EndpointParams` instead of raw Nest route decorators for contract-backed API routes.
- Reuse existing infrastructure services such as `PrismaService` and `SessionService`.
- Follow existing import ordering and path aliases.
- Keep domain logic in `apps/server/src/future/<domain>/` and shared infrastructure in `libs/common-server/src/module/`.
- Add tests near the relevant existing suite.

## Verification Checklist

Before handing off backend changes, run the smallest useful set of checks:

```bash
npm run prisma:generate
npm run lint
npm run server:test
npm run server:build
```

For documentation-only changes, a file review is usually enough unless commands or examples changed in a way that needs execution.
