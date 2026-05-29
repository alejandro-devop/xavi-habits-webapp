# AGENTS.md — Xavi Habits Web

Instrucciones para agentes de código (Cursor, etc.) que trabajan en este repositorio.

Cliente web de productividad (hábitos, actividades, cursos, **todos**, etc.) sobre **xavi-api**.

## Backend (xavi-platform-node)

Este frontend **no incluye** el servidor. Toda la API vive en el repo hermano **`xavi-platform-node`** (`xavi-api`):

| Aspecto | Detalle |
|---------|---------|
| Repo | `xavi-platform-node` (p. ej. `~/Developer/xavi-platform/xavi-platform-node`) |
| URL local | `VITE_API_URL` → `env.apiUrl`, GraphQL en `env.graphqlUrl` (`/graphql`) |
| Auth | REST `/api/auth/*` — ver `docs/auth-flow.md`, `docs/api-core.md` |
| Dominios de negocio | **GraphQL** en `src/graphql/modules/<dominio>/` |
| Esquema DB / migraciones | `src/shared/database/schema.ts`, `migrations/` |

**Regla:** no añadir llamadas REST legacy (`/api/habit`, `/api/todo`, …) en código nuevo; usar las operaciones GraphQL del backend.

### Dominios GraphQL relevantes para habits-web

| Dominio | Módulo backend | Doc en este repo |
|---------|----------------|------------------|
| Hábitos | `habit/` | feature `src/features/habits/` |
| Actividades | `activity/` | `docs/activities-domain.md` |
| Cursos | `course/` | feature `src/features/courses/` |
| **Todos** | `todo/` | `docs/todos-domain.md`, `docs/todos-module-features.md` |

Referencia operaciones Todos: `xavi-platform-node/docs/graphql/todo-bruno.md`. Regla Cursor: `.cursor/rules/backend-context.mdc`.

## Construir interfaces (UI)

**Obligatorio** al implementar o modificar pantallas, layouts o componentes visuales:

1. Leer **`docs/design-system-agent-guide.md`** — matriz necesidad → componente, flujo de decisión, cuándo proponer componentes nuevos.
2. Consultar ejemplos en **`/app/testinghall`** (ruta protegida) o `src/pages/app/TestingHallPage/`.
3. Aplicar la regla de Cursor **`.cursor/rules/design-system.mdc`**.

### Imports estándar

```tsx
import { Button, Card, FormField, … } from '@/shared/ui'
import { Container, Grid, GridItem, Stack } from '@/shared/layout'
```

### Si falta un componente

No improvisar con HTML/CSS sueltos. Indicar al usuario que no existe en el DS y ofrecer:

- **Composición** con componentes actuales, o
- **Propuesta** de nuevo componente en `src/shared/ui/` (con Testing Hall + test).

Detalle técnico: `docs/design-system.md`.

## Arquitectura

- Feature-first: `src/features/<dominio>/`
- Páginas finas: `src/pages/`
- UI reutilizable: `src/shared/ui/`, layout: `src/shared/layout/`
- Convenciones: `docs/project-conventions.md`
- API cliente: `docs/api-core.md`
- Auth/rutas: `docs/auth-flow.md`
- Todos (plan): `docs/todos-domain.md`

## Calidad

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
