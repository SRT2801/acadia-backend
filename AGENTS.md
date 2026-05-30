# AGENTS.md

## Stack

- **NestJS 11** + **TypeScript 5.7** (`nodenext` modules, `ES2023`)
- **PostgreSQL** via **TypeORM 0.3** (no Prisma)
- **JWT auth** with httpOnly cookies (not `Authorization` header)
- **npm** as package manager

## Commands

```bash
npm run start:dev        # dev server with watch mode
npm run build            # nest build
npm run lint             # ESLint with type-checked rules + prettier
npm run format           # prettier --write src/**/*.ts test/**/*.ts
npm run test             # unit tests (*.spec.ts in src/)
npm run test:e2e         # e2e tests (*.e2e-spec.ts in test/)
npm run test:cov         # coverage
```

### Database

```bash
# Start PostgreSQL
docker compose up -d

# Generate migration from entity changes
npm run migration:generate

# Run pending migrations
npm run migration:run

# Full reset: drops schema → runs migrations → seeds RBAC
npm run db:reset

# Seed RBAC only (roles, permissions, universities, admin user)
npm run seed:rbac
```

Migrations use `ts-node` with `tsconfig-paths/register` and the TypeORM CLI pointed at `src/core/database/data-source.ts`.

## Architecture

```
src/
  main.ts                   # bootstrap: CORS, cookie-parser, ValidationPipe, global filters
  app.module.ts             # root module: ConfigModule, ThrottlerModule, feature modules
  core/
    config/                 # TypeORM options builder (also used by NestJS ConfigService)
    database/
      data-source.ts        # CLI DataSource (reads process.env directly)
      database.module.ts    # @Global() TypeOrmModule.forRootAsync (reads ConfigService)
      migrations/
      seeds/
    filters/                # AllExceptionsFilter (catches all, logs 5xx)
  modules/
    auth/                   # register, login, refresh, logout, verify-email, password-reset
    users/
    roles/                  # RBAC: Role, Permission, RolePermission entities + enum files
    universities/
    mail/                   # Nodemailer with SMTP, console fallback if unconfigured
```

### Module conventions

- Each module under `src/modules/<name>/` follows NestJS patterns: `*.module.ts`, `*.controller.ts`, `*.service.ts`
- Entities live in `entities/` subdirectory, auto-discovered via glob `modules/**/entities/*{.ts,.js}`
- DTOs in `dto/`, guards in `guards/`, decorators in `decorators/`, enums in `enums/`
- Testing: unit specs co-located as `*.spec.ts` inside the module, e2e specs in `test/`

### Auth flow

- JWT access tokens extracted from `request.cookies.accessToken` (not headers)
- Refresh tokens are SHA-256 hashed before storage; only raw tokens are returned to client
- Password reset & email verification tokens are also SHA-256 hashed
- Passwords hashed with bcryptjs (10 rounds)
- `JwtStrategy.validate()` attaches `roleName` and `permissions` arrays to `req.user`
- RBAC: `@Roles(RolesEnum.ADMIN)` and `@Permissions(PermissionsEnum.CREATE_TASK)` decorators + `RolesGuard`

### Global pipes & guards

- `ValidationPipe`: `whitelist: true, transform: true, forbidNonWhitelisted: true`
- `ClassSerializerInterceptor` — use `@Exclude()` on sensitive entity fields (e.g. `password`)
- `ThrottlerGuard` (APP_GUARD): 60 req/min default
- CORS: origin from `FRONTEND_URL` env var, credentials enabled

## Testing

- **Unit**: `jest` with `rootDir: src`, matches `*.spec.ts`, transform via `ts-jest`
- **E2E**: `jest --config ./test/jest-e2e.json`, matches `*.e2e-spec.ts`, `rootDir: test`
- Unit tests use NestJS `Test.createTestingModule()` — mock external services, use real TypeORM repositories via `getRepositoryToken()`

## Environment

Copy `.env.example` to `.env`. Required vars:

| Variable | Purpose |
|----------|---------|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL connection |
| `DB_SYNCHRONIZE` | Set to `"true"` (string) for auto-sync (dev only) |
| `JWT_SECRET` | JWT signing secret |
| `FRONTEND_URL` | CORS origin |
| `SMTP_*` | Email (Gmail SMTP); if unset, emails log to console |

## Style

- Prettier: `singleQuote: true, trailingComma: "all"`
- ESLint flat config with `typescript-eslint` recommended type-checked rules + prettier plugin
- `@typescript-eslint/no-explicit-any` is **off**, `no-floating-promises` and `no-unsafe-argument` are **warn**
- Imports use `node:` prefix for built-ins (`node:crypto`, not `crypto`)
- Entity fields use definite assignment (`!`) or optional (`?`) — TypeORM decorators satisfy initialization

## Gotchas

- **No CI/CD** configured — no GitHub Actions workflows exist
- **No pre-commit hooks** — lint/format are manual
- `docker-compose.yml` is gitignored — copy/link from another source if needed
- Migration generation requires a running database and `tsconfig-paths` — ensure `ts-node` is configured
- TypeORM `synchronize` reads the env var as a **string** (`"true"`), not boolean
- The `buildTypeOrmOptions` function is shared between NestJS (via `ConfigService`) and the CLI data source (via `process.env`) — the CLI path reads env directly, not through `ConfigService`
- Refresh tokens use optimistic concurrency: a second concurrent refresh will get "already revoked" and must retry
- **Migration timestamps determine execution order** — TypeORM sorts by the timestamp in the filename, not creation date. A new migration MUST have a higher timestamp than all existing migrations, otherwise it will execute before them and fail on missing tables
