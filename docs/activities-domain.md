# Dominio Actividades — Xavi Habits Web

Módulo de negocio **Actividades**: shell, categorías (6.1) y CRUD de actividades (6.2).

## Principio: un solo acceso global

En el menú lateral y command palette solo existe **Actividades** → `/app/activities`.

No hay entradas globales para categorías, follow-ups, tracking ni reportes. Todo vive dentro del módulo con subnavegación interna.

## Estructura

```txt
src/features/activities/
  api/
  components/
  graphql/
  hooks/
  pages/
  routes/
  types/
  utils/
```

## Rutas

| Ruta | Vista | Menú global |
|------|-------|-------------|
| `/app/activities` | Listado de actividades | Sí |
| `/app/activities/new` | Crear actividad | No |
| `/app/activities/:id` | Detalle | No |
| `/app/activities/:id/edit` | Editar | No |
| `/app/activities/categories` | CRUD categorías | No (subnav) |

`ActivitiesModuleLayout` envuelve todas las rutas con `PageHeader`, `ActivitiesModuleNav` y `<Outlet />`.

Subnav interna:

- **Actividades** → listado (`/app/activities`)
- **Categorías** → panel categorías
- **Time Tracking** → deshabilitado (Fase 6.3)

## GraphQL — actividades

| Operación | Uso |
|-----------|-----|
| `activities(status, priority, categoryId, startDate, endDate, page, limit)` | Listado paginado |
| `activity(id)` | Detalle |
| `activityAdd(input)` | Crear |
| `activityEdit(input)` | Editar (`id` + al menos un campo) |
| `activityRemove(id)` | Eliminar |
| `activityComplete(id)` | Marcar completada |

Campos relevantes: `title`, `description`, `status`, `priority`, `categoryId`, `scheduledDate`, `completedAt`, `spentTimeMinutes`, `category { id name icon color }`.

## GraphQL — categorías

Ver Fase 6.1: `activityCategories`, `activityCategoryAdd/Edit/Remove`. No eliminar categoría con actividades asignadas.

## Query keys

```ts
activityKeys.list(serializedFilters)  // sin search (solo cliente)
activityKeys.detail(id)
activityKeys.categories.list()
activityKeys.categories.detail(id)
```

### Invalidaciones

| Mutación | Invalidar |
|----------|-----------|
| create / update / delete / complete (actividad) | `activityKeys.all` (lista + detalle afectado) |
| categorías CRUD | `activityKeys.categories.*` |

`complete` usa invalidación (sin optimistic update en 6.2) por estabilidad.

## Filtros del listado

| Filtro | Origen |
|--------|--------|
| status, priority, categoryId, page, limit | GraphQL → React Query key |
| search (título/descripción) | **Solo cliente** sobre resultados cargados |

Botón «Limpiar filtros» restaura defaults (`limit: 50`, página 1).

## UI mobile / desktop

| Viewport | Componente |
|----------|------------|
| ≥ 48rem | `ActivityTable` |
| < 48rem | `ActivityCard` + FAB crear |

Estados: skeleton, `ActivityEmptyState`, `Alert` en error.

## Formulario de actividad

- `ActivityForm` compartido en create/edit.
- Categorías vía `SearchSelect` con icono y color.
- Fecha: `input[type=datetime-local]` (no hay DatePicker en DS aún).
- Iconos de categoría: nombre limpio (`bell`), nunca `fa-bell`.

## Time tracking (placeholder)

- `spentTimeMinutes` se muestra en listado, detalle y placeholder.
- Follow-ups (`activityFollowUp*`, `activityDayFollowUps`) → **Fase 6.3**.
- `ActivityTimeTrackingPlaceholder` en detalle.

## Referencias

- Schema: `xavi-platform-node/src/graphql/modules/activity/activity.schema.ts`
- Spec: `FRONTEND_SPEC_HABITS_ACTIVITIES_COURSES.md`
- Cliente: `docs/api-core.md`
