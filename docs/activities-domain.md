# Dominio Actividades — Xavi Habits Web

Módulo de negocio **Actividades**: shell, categorías (6.1), CRUD de actividades (6.2) y time tracking (6.3).

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
  store/
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
| `/app/activities/tracking` | Time tracking diario | No (subnav) |

`ActivitiesModuleLayout` envuelve todas las rutas con `PageHeader`, `ActivitiesModuleNav` y `<Outlet />`.

Subnav interna:

- **Actividades** → listado (`/app/activities`)
- **Categorías** → panel categorías
- **Seguimiento** → timeline diaria (`/app/activities/tracking`)

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

## GraphQL — follow-ups (time tracking)

| Operación | Uso |
|-----------|-----|
| `activityDayFollowUps(date)` | Timeline del día seleccionado |
| `activityFollowUpsInDates(from, to)` | Rango semana visible (prefetch) |
| `activityFollowUpAdd(input)` | Guardar al finalizar sesión |
| `activityFollowUpEdit(input)` | Editar desde modal |
| `activityFollowUpRemove(id)` | Eliminar con confirmación |

Input de add/edit: `activityId`, `date` (YYYY-MM-DD), `startTime` (HH:mm), `durationMinutes`, `notes`.

## Query keys

```ts
activityKeys.list(serializedFilters)
activityKeys.detail(id)
activityKeys.categories.list()
activityKeys.categories.detail(id)
activityKeys.followUps.day(date)
activityKeys.followUps.range(from, to)
```

### Invalidaciones

| Mutación | Invalidar |
|----------|-----------|
| actividad CRUD / complete | `activityKeys.all` |
| categorías CRUD | `activityKeys.categories.*` |
| follow-up create / update / delete | `followUps.day`, `followUps.range`, `activityKeys.detail(activityId)`, `activityKeys.all` |

## Time tracking — arquitectura

### Sesión local en progreso

- Store: `src/features/activities/store/activity-tracking.store.ts` (Zustand persist, key `xavi-activity-tracking-session`).
- Solo **una** actividad en curso.
- **Iniciar** no llama al backend; guarda `RunningActivitySession` con `startedAt` ISO.
- **Cancelar** limpia el store (ConfirmDialog); no crea follow-up.
- **Finalizar** abre modal de revisión → `activityFollowUpAdd` → limpia store solo en éxito.

### Timer preciso

```ts
elapsedMs = Date.now() - new Date(startedAt).getTime()
```

Hook `useElapsedTimer`: `setInterval(1s)` solo para re-render; el cálculo siempre usa `Date.now()`. Persiste tras recarga.

### Semana visible

- Muestra **lunes → domingo** de la semana calendario actual (la de hoy).
- Día por defecto: **hoy**.
- Días **posteriores a hoy** en esa semana: deshabilitados.
- Solo se pueden seleccionar hoy y días anteriores de la misma semana (sin navegación a semanas pasadas en 6.3).

Helpers: `src/features/activities/utils/activity-time.utils.ts` (sin librerías de fechas externas).

### Timeline diaria (lista cronológica)

- Registros en **orden ascendente** por hora de inicio (más temprano arriba).
- Rail izquierdo: bullet + línea conectora + hora inicio / hora fin.
- Card a la derecha con título, categoría, notas y duración.
- En el día **hoy**, se inserta un marcador **Ahora** en la posición cronológica correcta.
- Click en card → `EditFollowUpModal` (editar / eliminar).

### Flujo UX

1. **Iniciar nueva actividad** → modal (actividad + notas) → sesión local + timer.
2. **Finalizar** → modal (rectificar fecha, inicio, duración, notas; hora fin calculada) → guardar.
3. **Editar registro** en timeline → modal → update o delete.

## Filtros del listado

| Filtro | Origen |
|--------|--------|
| status, priority, categoryId, page, limit | GraphQL → React Query key |
| search (título/descripción) | **Solo cliente** sobre resultados cargados |

## UI mobile / desktop

| Viewport | Componente |
|----------|------------|
| ≥ 48rem | `ActivityTable` |
| < 48rem | `ActivityCard` + FAB crear |

Tracking: timeline responsive; semana en grid 7 columnas.

## Formulario de actividad

- `ActivityForm` compartido en create/edit.
- Categorías vía `SearchSelect` con icono y color.
- Fecha: `input[type=datetime-local]` (no hay DatePicker en DS aún).

## Referencias

- Schema: `xavi-platform-node/src/graphql/modules/activity/activity.schema.ts`
- Spec: `FRONTEND_SPEC_HABITS_ACTIVITIES_COURSES.md`
- Cliente: `docs/api-core.md`
