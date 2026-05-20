# Xavi Habits Web

SPA con React, TypeScript, Vite, React Router, Zustand, TanStack Query y Sass Modules.

## Requisitos

- Node.js 20+
- pnpm 10+

## Setup

```bash
cp .env.example .env
# opcional: cp .env.local.example .env
pnpm install
```

Variables requeridas: `VITE_APP_NAME`, `VITE_APP_VERSION`, `VITE_API_URL` (ver `.env.example`).

## Scripts

| Script              | Descripción               |
| ------------------- | ------------------------- |
| `pnpm dev`          | Servidor de desarrollo    |
| `pnpm build`        | Build de producción       |
| `pnpm preview`      | Preview del build         |
| `pnpm test`         | Tests (CI)                |
| `pnpm test:watch`   | Tests en watch            |
| `pnpm typecheck`    | Verificación TypeScript   |
| `pnpm lint`         | ESLint                    |
| `pnpm lint:fix`     | ESLint con autofix        |
| `pnpm format`       | Prettier write            |
| `pnpm format:check` | Prettier check            |
| `pnpm audit`        | Auditoría de dependencias |

## Convenciones

Ver [docs/project-conventions.md](./docs/project-conventions.md).

## API Core (Fase 3)

Ver [docs/api-core.md](./docs/api-core.md) — clientes REST/GraphQL, refresh token, errores y query keys.

## Autenticación (Fase 4)

Ver [docs/auth-flow.md](./docs/auth-flow.md) — rutas, guards, formularios y flujo de sesión.
