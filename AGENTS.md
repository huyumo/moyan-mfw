# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

Moyan MFW (墨焱管理框架) is a full-stack admin management framework with a Monorepo architecture. It provides core backend capabilities (NestJS + TypeORM + MySQL + Redis + JWT) and frontend infrastructure (Vue 3 + Element Plus + Vite).

## Environment Requirements

- Node.js >= 20.0.0
- pnpm >= 8.0.0 (locked to pnpm@10.14.0)
- Project type: ES Module (`"type": "module"`)

## Key Commands

### Build & Development
```bash
pnpm build                  # Build all workspace packages
pnpm dev:frontend           # Start frontend dev server (Vite on port 5173)
pnpm dev:examples           # Start examples service
```

### Type Checking & Linting
```bash
pnpm typecheck              # Full typecheck (Vue + E2E + Backend)
pnpm typecheck:vue          # Vue frontend only
pnpm typecheck:e2e          # E2E tests only
pnpm typecheck:base-backend # Base backend only
pnpm format                 # Format with Prettier
pnpm format:check           # Check formatting
```

### Testing
```bash
pnpm test:e2e               # Playwright E2E tests
pnpm test:e2e:ui            # E2E tests with UI
pnpm test:e2e:headed        # E2E tests in headed mode
pnpm test                   # Jest tests (in packages/base)
```

### Code Generation (Plop)
```bash
pnpm gen:module             # Generate backend NestJS module
pnpm gen:page               # Generate frontend page
pnpm gen:component          # Generate frontend component
pnpm gen                    # Interactive plop menu
```

## Architecture

### Package Structure (pnpm workspace)

```
packages/
├── base/                   # Core infrastructure (moyan-mfw-base)
│   ├── src/backend/        # Backend base (@internal/base-backend)
│   ├── src/frontend/       # Frontend base (@internal/base-frontend)
│   └── src/shared/         # Shared types (@internal/base-shared)
└── extensions/
    └── extension-ad/       # Example extension module
        ├── src/backend/    # Extension backend
        ├── src/frontend/   # Extension frontend
        └── src/shared/     # Extension shared
        └── extension.json  # Extension manifest (permissions, routes, entities)
```

### Multi-entry Package Exports

`moyan-mfw-base` exports three entry points:
- `moyan-mfw-base/backend` - NestJS factories, decorators, guards, services
- `moyan-mfw-base/frontend` - Vue components, layouts, composables, stores
- `moyan-mfw-base/shared` - Shared types and utilities

Import pattern:
```typescript
import { createBaseBackendApp } from 'moyan-mfw-base/backend';
import { createBaseAdminApp } from 'moyan-mfw-base/frontend';
```

### Backend Request Pipeline

```
HTTP Request → CORS → AuthGuard (JWT) → PermissionGuard (bitwise) → ValidationPipe
  → LoggingInterceptor → Controller → AuditInterceptor → TransformInterceptor
  → AllExceptionsFilter → HTTP Response
```

### Permission System (RBAC + Bitwise)

- Permissions use BigInt bitwise operations for fine-grained control
- `@RequirePermission()` decorator on controllers
- `v-permission` directive on frontend buttons
- Developers (`isDeveloper: true`) bypass all permission checks

### Multi-tenant Design

- `AppType` defines application categories and permission pools
- `App` is a concrete instance of an AppType
- Roles can bind to AppType or App instances
- Permission pools limit available permissions per AppType

## Extension Development

Create extensions in `packages/extensions/<name>/` with this structure:

```
extension-xxx/
├── extension.json          # Manifest: name, permissions, routes, entities
├── src/backend/            # NestJS module(s)
├── src/frontend/           # Vue pages/components
├── src/shared/             # Shared permission values
├── migrations/             # Database migrations
```

The `extension.json` manifest defines:
- `permCodeNodes`: Permission codes with names and groups
- `routePrefix`: URL prefix for all extension routes
- `provides`: Services, dicts, routes, entities exposed

## Frontend Routing

Routes use **auto-scanning** via `import.meta.glob`:
- Pages placed in `views/<page-name>/` directories
- Each page exports `page`, `path`, `name` from `index.ts`
- Use `definePageConfig()` with `permissions` for permission-guarded pages
- `type: 'module'` creates route groups (menu sections)

## Dependency Management

Use `catalog:` for shared dependency versions (defined in `pnpm-workspace.yaml`):
```json
{
  "dependencies": {
    "@nestjs/common": "catalog:",
    "vue": "catalog:"
  }
}
```

Use `workspace:*` for internal packages:
```json
{
  "dependencies": {
    "moyan-mfw-base": "workspace:*"
  }
}
```

## ESLint Custom Rules

The project uses a custom `moyan/comment-compliance` rule requiring proper file documentation. Key restrictions:
- Controllers must import Swagger decorators from `moyan-mfw-core`
- Controllers cannot use `@Req/@Res/@Request/@Response` decorators
- TSX components in `components/` must use `Mfw` prefix

## File Limits

- TypeScript files: max 1000 lines
- Type definition files: max 200 lines

## Database

- TypeORM with MySQL
- All entities extend `Base` class (soft delete with `deleteAt`)
- Migrations in `database/migrations/`
- Seeds in `database/seeds/`

Backend migration commands (run in `backend/`):
```bash
pnpm migration:generate <name>   # Generate migration
pnpm migration:run               # Run migrations
pnpm migration:revert            # Revert last migration
pnpm seed:run                    # Run seed data
pnpm db:clear                    # Clear database
```