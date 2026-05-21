# Dominio Actividades — Xavi Habits Web

Primer slice del módulo de negocio **Actividades** (Fase 6.1): shell del dominio + CRUD de categorías.

## Principio: un solo acceso global

En el menú lateral y command palette solo existe **Actividades** → `/app/activities`.

No hay entradas globales para:

- Categorías
- Follow-ups / time tracking
- Reportes

Todo eso vive **dentro** del módulo, con navegación interna.

## Estructura

```txt
src/features/activities/
  api/              # fetchers GraphQL
  components/       # UI del dominio
  graphql/          # document strings
  hooks/            # React Query
  pages/            # vistas del módulo
  routes/           # paths + RouteObject
  types/
  utils/
```

## Rutas

| Ruta | Vista | Menú global |
|------|-------|-------------|
| `/app/activities` | Overview (placeholder) | Sí (Actividades) |
| `/app/activities/categories` | Panel CRUD categorías | No (solo subnav interna) |

`ActivitiesModuleLayout` envuelve ambas rutas con `PageHeader`, `ActivitiesModuleNav` y `<Outlet />`.

## GraphQL — categorías

| Operación | Tipo |
|-----------|------|
| `activityCategories` | Query listado |
| `activityCategory(id)` | Query detalle |
| `activityCategoryAdd(input)` | Mutation crear |
| `activityCategoryEdit(input)` | Mutation editar (`id` dentro del input) |
| `activityCategoryRemove(id)` | Mutation eliminar → `Boolean` |

**Regla de negocio:** no se puede eliminar una categoría si hay actividades con `categoryId` asignado. El backend responde con un mensaje que el frontend traduce a español.

## Query keys

En `shared/api/query-keys.ts`:

```ts
activityKeys.categories.list()
activityKeys.categories.detail(id)
```

Tras create/update/delete se invalida `list()`; tras update también `detail(id)`.

## Iconos

Los iconos de categoría se guardan como nombre limpio (`bell`, `calendar`), nunca `fa-bell` ni `faBell`. El formulario usa `IconPicker` + `normalizeIconName` antes de enviar al API.

## Fases siguientes (no implementadas en 6.1)

- CRUD de `Activity` (`activities`, `activityAdd`, …)
- `ActivityFollowUp` y time tracking
- Reportes y vistas de día (`activityDayFollowUps`, …)
- Integración opcional con hábitos vía `activityId`

## Referencias

- Schema backend: `xavi-platform-node/src/graphql/modules/activity/activity.schema.ts`
- Spec frontend: `FRONTEND_SPEC_HABITS_ACTIVITIES_COURSES.md` (sección Actividades)
- Cliente GraphQL: `docs/api-core.md`
