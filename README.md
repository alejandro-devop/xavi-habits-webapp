# Xavi Habits Web

SPA con React, TypeScript, Vite, React Router, Zustand, TanStack Query y Sass Modules.

## Requisitos

- Node.js 20+
- pnpm 10+

## Setup

```bash
cp .env.example .env
pnpm install
```

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
