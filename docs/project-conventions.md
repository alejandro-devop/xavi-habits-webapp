# Convenciones del proyecto — Xavi Habits Web

## Design System (UI)

Al construir interfaces, **no inventar componentes** si ya existen en el DS:

- Guía para agentes: `docs/design-system-agent-guide.md`
- Referencia técnica: `docs/design-system.md`
- Laboratorio: `/app/testinghall`
- Regla Cursor: `.cursor/rules/design-system.mdc`

```tsx
import { Button, Card } from '@/shared/ui'
import { Stack, Grid } from '@/shared/layout'
```

## Filosofía

- **Feature-first:** la lógica de dominio vive en `features/`.
- **Páginas finas:** `pages/` compone features y layouts; sin lógica de negocio pesada.
- **Shared mínimo:** solo código reutilizable entre varias features.

## Estructura de carpetas

```txt
src/
  app/          # Bootstrap: config, providers, router, estilos globales
  features/     # Módulos de dominio (hábitos, auth futura, etc.)
  layouts/      # Shells de routing (header, Outlet, nav futura)
  pages/        # Vistas enlazadas a rutas
  shared/       # UI genérica, hooks, lib, types, utils
  test/         # Setup global de tests
```

| Carpeta            | Responsabilidad                                   |
| ------------------ | ------------------------------------------------- |
| `app/`             | Configuración transversal, no features de negocio |
| `features/<name>/` | Todo lo específico de un dominio                  |
| `layouts/`         | Estructura visual compartida por rutas            |
| `pages/`           | Entry points de rutas (thin)                      |
| `shared/`          | Código cross-feature sin lógica de dominio        |

## Crear una feature

Ejemplo: `features/habits/`

```txt
features/habits/
  api/              # queries, mutations, fetchers
  components/       # UI del dominio
  hooks/            # hooks que combinan store + query
  store/            # Zustand (si aplica)
  types/            # tipos del dominio
```

Checklist:

1. Crear carpeta bajo `features/<nombre>/`.
2. Añadir rutas en `app/router/routes.tsx` (o lazy + Suspense).
3. Crear página en `pages/` que importe desde la feature.
4. Tests colocados junto al código (`*.test.tsx`).

## Zustand

- **Ubicación:** `features/<name>/store/<name>.store.ts`
- **Persistencia:** middleware `persist` de `zustand/middleware`
- **Partialize:** persistir solo el estado necesario
- **Global cross-feature:** evitar; si es inevitable, documentar en la feature dueña

## React Query

- **Queries/mutations:** `features/<name>/api/` o `features/<name>/hooks/`
- **Query keys:** factory global en `shared/api/query-keys.ts` (auth, habits, activities, courses); keys específicas de feature pueden añadirse en `features/<name>/api/` cuando haga falta
- **No** llamar `useQuery` directamente en `pages/` si la lógica es de dominio — encapsular en hook

## Componentes

| Tipo                                   | Ubicación                     |
| -------------------------------------- | ----------------------------- |
| Botón, Input, Card, Table, Modal, etc. | `shared/ui/`                  |
| Container, Grid, Stack, Inline          | `shared/layout/`              |
| Loader, error boundary, Suspense        | `shared/components/feedback/` |
| Lista de hábitos, formulario de hábito | `features/habits/components/` |

## Hooks

- Reutilizable sin dominio → `shared/hooks/`
- Específico de feature → `features/<name>/hooks/`

## Variables de entorno

- Solo prefijo `VITE_` (públicas en cliente)
- Leer siempre desde `app/config/env.ts` — no `import.meta.env` disperso
- Copiar `.env.example` → `.env` en local
- Nunca commitear secretos en `.env`

## Naming

| Artefacto   | Convención        | Ejemplo                 |
| ----------- | ----------------- | ----------------------- |
| Componentes | PascalCase        | `HabitCard.tsx`         |
| Hooks       | camelCase + `use` | `useHabitsQuery.ts`     |
| Stores      | `*.store.ts`      | `habits.store.ts`       |
| Estilos     | `*.module.scss`   | `HabitCard.module.scss` |
| Tests       | `*.test.tsx`      | `HabitCard.test.tsx`    |

## Imports

- Usar alias `@/` → `src/`
- Preferir `import type` para tipos (`consistent-type-imports` en ESLint)

```ts
import { env } from '@/app/config/env'
import { PageLoader } from '@/shared/components/feedback'
```

## `shared` vs `features`

**Usar `shared` cuando:**

- El código no conoce el dominio (loaders, boundaries, `storage.ts`)
- Al menos dos features lo necesitan sin acoplamiento de negocio

**Usar `features` cuando:**

- Existe vocabulario de dominio (hábito, streak, categoría)
- El cambio de negocio afecta solo a esa feature

## Routing y lazy loading

- Rutas en `app/router/routes.tsx`
- Layout raíz: `layouts/RootLayout` con `<Outlet />`
- 404: ruta `*` → `NotFoundPage`
- Auth: rutas bajo `/auth/*` (guest) y `/app/*` (protegidas); ver `docs/auth-flow.md`
- Lazy (futuro):

```tsx
const HomePage = lazy(() => import('@/pages/HomePage/HomePage'))
// Envolver con <Suspense fallback={<SuspenseFallback />}>
```

## Testing

- **RTL** orientado al usuario (`getByRole`, `getByText`)
- Tests junto al archivo fuente
- Providers: envolver con `QueryClientProvider` / `MemoryRouter` según necesidad
- No testear detalles de implementación interna

## Scripts de calidad

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm audit
```
