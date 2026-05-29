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
| `activityOpenFollowUp` | Follow-up abierto (sesión en curso), sincronizado entre dispositivos |
| `activityFollowUpStart(input)` | Iniciar sesión (follow-up sin duración) |
| `activityFollowUpAdd(input)` | Registrar tiempo pasado (siempre con duración) |
| `activityFollowUpEdit(input)` | Finalizar sesión abierta o editar registro cerrado |
| `activityFollowUpRemove(id)` | Cancelar sesión abierta o eliminar registro |

Input de add/edit: `activityId`, `date` (YYYY-MM-DD), `startTime` (HH:mm:ss en API), `durationMinutes`, `notes`.

## Query keys

```ts
activityKeys.list(serializedFilters)
activityKeys.detail(id)
activityKeys.categories.list()
activityKeys.categories.detail(id)
activityKeys.followUps.open()
activityKeys.followUps.day(date)
activityKeys.followUps.range(from, to)
```

### Invalidaciones

| Mutación | Invalidar |
|----------|-----------|
| actividad CRUD / complete | `activityKeys.all` |
| categorías CRUD | `activityKeys.categories.*` |
| follow-up start / create / update / delete | `followUps.open`, `followUps.day`, `followUps.range`, `activityKeys.detail(activityId)`, `activityKeys.all` |

## Time tracking — arquitectura

### Sesión en curso (follow-up abierto)

- Query: `activityOpenFollowUp` (`activityKeys.followUps.open()`), con `refetchOnWindowFocus` para sincronizar entre dispositivos.
- Solo **una** sesión abierta por usuario (índice único en backend).
- **Iniciar** → `activityFollowUpStart` (crea follow-up con `durationMinutes: null`, `date`, `startTime`, `linkedTodoId` opcional).
- **Cancelar** → `activityFollowUpRemove` (ConfirmDialog).
- **Finalizar** → modal de revisión → `activityFollowUpEdit` con `durationMinutes` (cierra el mismo registro).
- Los follow-ups abiertos **no** aparecen en `activityDayFollowUps` ni en métricas del día hasta cerrarse.
- UI: `RunningActivitySession` se deriva del follow-up abierto para el timer (`openFollowUpToRunningSession`).

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

- Registros y **espacios libres** en **orden descendente** por hora (más reciente arriba).
- Rail izquierdo: bullet + línea conectora + hora inicio / hora fin.
- Card a la derecha con título, categoría, notas y duración; altura proporcional a `durationMinutes`.
- En el día **hoy**, se inserta un marcador **Ahora** en la posición cronológica correcta.
- Click en card → `EditFollowUpModal` (editar / eliminar).
- Click en **Espacio libre** → `CreateFollowUpFromFreeSlotModal` (crear follow-up acotado al hueco).

### Free slots (Fase 6.4)

Los espacios libres **no existen en backend**. Se derivan en frontend a partir de `activityDayFollowUps(date)`:

1. Ordenar follow-ups del día por `startTime` ascendente (cálculo interno).
2. Detectar gaps entre el `end` de un registro y el `start` del siguiente.
3. Solo gaps **≥ 5 minutos** (`MIN_FREE_SLOT_MINUTES`).
4. Requieren **≥ 2** follow-ups en el día (no se muestran huecos antes del primero ni después del último).
5. Si hay **solapamiento**, se acumula el fin máximo y no se generan gaps negativos (`console.warn` en dev).

Tipo `TimelineFreeSlot`: `id`, `date`, `startTime`, `endTime` (HH:mm:ss), `durationMinutes`.

Helpers en `activity-time.utils.ts`: `getFreeSlotsBetweenFollowUps`, `validateFollowUpInsideSlot`, `getMaxDurationForStartTime`, `getTimelineItemHeight`.

**Creación desde slot:** `startTime` y `durationMinutes` deben quedar dentro del intervalo `[slot.start, slot.end)`. Mutaciones envían `startTime` como `HH:mm:ss` (`normalizeTimeToSeconds`).

**Caso borde — medianoche:** si `endDate !== date` del día seleccionado, el intervalo se capa al fin del día (24:00) para visualización y gaps; no se modelan slots inter-día en 6.4.

### Widgets de tiempo del día (Fase 6.5)

En **Seguimiento** (`ActivityTrackingPage`), pestaña **Resumen** (los widgets no comparten vista con la timeline):

| Widget | Fuente de datos | Comportamiento |
|--------|-----------------|----------------|
| **DayRemainingWidget** | Hora local (`Date.now()`), sin GraphQL | Cuenta regresiva `HH:mm:ss` hasta fin de día. Día actual independiente del selector de semana. |
| **DayUsageWidget** | `followUps` + `freeSlots` del día seleccionado | Muestra tiempo aprovechado vs libre detectado entre actividades. |
| **CategoryTimeWidget** | `followUps` del día seleccionado | Agrupa `durationMinutes` por categoría de la actividad; muestra total y desglose en horas (`formatHoursFromMinutes`). |

**Fin de día (hardcoded):** `DAY_END_TIME = '23:00:00'` en `activity-day-metrics.utils.ts`. El contador restante usa `getRemainingDayMs(now, today, endTime)`; tras las 23:00 muestra `00:00:00`. Barra de progreso: % transcurrido de la ventana **00:00 → 23:00** del día actual.

**Futuro:** mover `DAY_END_TIME` (y posible hora de inicio del día) a configuración de usuario; los widgets ya aceptan `endTime?` opcional.

**Tiempo aprovechado:** suma de `durationMinutes` de todos los `activityFollowUps` del día seleccionado. No incluye la sesión en curso hasta guardarla con `activityFollowUpAdd`.

**Tiempo libre (widget):** suma de `durationMinutes` de los free slots derivados (`getFreeSlotsBetweenFollowUps`). Es **libre detectado entre actividades**, no el tiempo libre total del día hasta las 23:00.

**Desperdicio del día:** tiempo transcurrido en la ventana del día que no está aprovechado ni marcado como libre detectado. Ventana: desde las **23:00 del día anterior** (`getDayWindowStartDateTime`) hasta las **23:00 del día seleccionado** (o `now` si es hoy y aún no son las 23:00). Fórmula: `desperdicio = ventanaTranscurrida − aprovechado − libreDetectado` (mínimo 0). Incluye huecos antes del primer registro, después del último, y cualquier tramo no cubierto por free slots.

Los porcentajes del widget se calculan sobre `totalWindowMinutes`, no solo sobre aprovechado + libre.

Helpers: `src/features/activities/utils/activity-day-metrics.utils.ts`, `activity-category-metrics.utils.ts`. Hook realtime: `useRemainingDayTimer` (intervalo 1s, cálculo siempre con `Date.now()`).

### Flujo UX

1. **Iniciar nueva actividad** → modal (actividad + notas) → sesión local + timer.
2. **Finalizar** → modal (rectificar fecha, inicio, duración, notas; hora fin calculada) → guardar.
3. **Editar registro** en timeline → modal → update o delete.
4. **Espacio libre** en timeline → modal restringido → `activityFollowUpAdd`.
5. En la actividad **más reciente** del día (arriba en la lista), acciones rápidas con hora de inicio = fin de ese registro (`getFollowUpEndTimeForNextEntry`):
   - **Play** → *Iniciar nueva actividad* (cronómetro en curso).
   - **+** → *Registrar tiempo pasado*.

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
- Categorías vía `CategoryPickerField` (creación rápida inline).
- Tracking: `ActivityPickerField` en modales de follow-up.
- Fecha: `input[type=datetime-local]` (no hay DatePicker en DS aún).

## Referencias

- Schema: `xavi-platform-node/src/graphql/modules/activity/activity.schema.ts`
- Spec: `FRONTEND_SPEC_HABITS_ACTIVITIES_COURSES.md`
- Cliente: `docs/api-core.md`
