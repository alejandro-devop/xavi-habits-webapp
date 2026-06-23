# Activities Module — Mejoras de layout

> **Modelo recomendado para Cursor:** `claude-sonnet-4-5`  
> Si quieres máxima precisión en pasos con múltiples archivos SCSS + TSX, usa `claude-opus-4`.

---

## Contexto del proyecto

- **Framework:** React 19 + TypeScript + Vite
- **Estilos:** SCSS Modules. Mixins en `src/app/styles/mixins/breakpoints.scss` (`@include md` = ≥768px, `@include sm` = ≥640px).
- **Variables CSS:** `var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)` definidas en `src/app/styles/tokens/`.
- **Iconos:** `<AppIcon name="..." size="xs|sm|md|lg" />` de `@/shared/ui/AppIcon`.
- **Nuevo layout global:** la sidebar tiene 44px colapsada, sin `max-width` en `.main`, padding del shell reducido a 1rem. Las páginas usan el 100% del ancho disponible.
- **Todo texto en español (es-ES).**

---

## Arquitectura actual del módulo

```
ActivitiesModuleLayout
├── PageHeader (title="Actividades", subtitle="...")   ← ELIMINAR
├── ActivitiesModuleNav (3 AppNavLink con icono)       ← CONVERTIR A TABS
└── div.content → <Outlet />
    ├── ActivitiesListPage      /activities
    ├── ActivityCategoriesPage  /activities/categories
    ├── ActivityTrackingPage    /activities/tracking
    ├── ActivityDetailPage      /activities/:id
    ├── ActivityCreatePage      /activities/new
    └── ActivityEditPage        /activities/:id/edit
```

**Archivos clave:**

| Archivo | Responsabilidad |
|---|---|
| `src/features/activities/components/ActivitiesModuleLayout/ActivitiesModuleLayout.tsx` | Shell del módulo |
| `src/features/activities/components/ActivitiesModuleLayout/ActivitiesModuleLayout.module.scss` | Estilos del shell |
| `src/features/activities/components/ActivitiesModuleNav/ActivitiesModuleNav.tsx` | Nav de 3 secciones |
| `src/features/activities/components/ActivitiesModuleNav/ActivitiesModuleNav.module.scss` | Estilos de la nav |
| `src/features/activities/pages/ActivitiesListPage.tsx` | Lista paginada |
| `src/features/activities/pages/ActivitiesListPage.module.scss` | Estilos lista |
| `src/features/activities/pages/ActivityTrackingPage.tsx` | Seguimiento diario |
| `src/features/activities/pages/ActivityTrackingPage.module.scss` | Estilos seguimiento |
| `src/features/activities/pages/ActivityDetailPage.tsx` | Detalle de actividad |
| `src/features/activities/pages/ActivityDetailPage.module.scss` | Estilos detalle |
| `src/features/activities/components/ActivityCategoriesPanel/ActivityCategoriesPanel.tsx` | Grid de categorías |
| `src/features/activities/components/ActivityCategoriesPanel/ActivityCategoriesPanel.module.scss` | Estilos panel |

---

## Problemas identificados

| ID | Archivo | Problema |
|----|---------|----------|
| P1 | `ActivitiesModuleLayout` | `max-width: 72rem` contradice el nuevo layout global sin max-width |
| P2 | `ActivitiesModuleLayout` | `PageHeader` con title + subtitle duplica información; el tab activo ya da el contexto |
| P3 | `ActivitiesModuleNav` | Usa `AppNavLink` (estilo sidebar) en lugar de tabs visuales |
| P4 | `ActivityTrackingPage` | Todo en 1 columna; widgets de resumen ocultos tras tab "Resumen" en desktop |
| P5 | `ActivityTrackingPage` | `<h2>Seguimiento de tiempo</h2>` redundante con el tab activo |
| P6 | `ActivityTrackingPage` | Botones "Iniciar" y "Registrar" bajo el selector de días, no junto a él |
| P7 | `ActivityTrackingPage` | Mobile no tiene sticky bar para acciones principales |
| P8 | `ActivityCategoriesPanel` | Grid de 1 columna desaprovecha el ancho disponible |
| P9 | `ActivityDetailPage` | Acciones (Completar, Eliminar) en toolbar superior separado del contenido |
| P10 | `ActivityDetailPage` | 1 columna en desktop; metadata enterrada al fondo |

---

## MEJORA 1 — `ActivitiesModuleLayout`: eliminar PageHeader + quitar max-width

### 1.1 — `ActivitiesModuleLayout.tsx`

**Archivo:** `src/features/activities/components/ActivitiesModuleLayout/ActivitiesModuleLayout.tsx`

```tsx
// ANTES
import { Outlet } from 'react-router'
import { ActivitiesModuleNav } from '@/features/activities/components/ActivitiesModuleNav'
import { PageHeader } from '@/shared/ui/PageHeader'
import styles from './ActivitiesModuleLayout.module.scss'

export function ActivitiesModuleLayout() {
  return (
    <div className={styles.root}>
      <PageHeader
        title="Actividades"
        subtitle="Gestiona tareas, categorías y seguimiento de tiempo en un solo módulo."
      />
      <ActivitiesModuleNav />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}

// DESPUÉS
import { Outlet } from 'react-router'
import { ActivitiesModuleNav } from '@/features/activities/components/ActivitiesModuleNav'
import styles from './ActivitiesModuleLayout.module.scss'

export function ActivitiesModuleLayout() {
  return (
    <div className={styles.root}>
      <ActivitiesModuleNav />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
```

**Cambios:** eliminar import de `PageHeader`, eliminar el componente del JSX.

### 1.2 — `ActivitiesModuleLayout.module.scss`

**Archivo:** `src/features/activities/components/ActivitiesModuleLayout/ActivitiesModuleLayout.module.scss`

```scss
// ANTES
.root {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
}

.content {
  min-width: 0;
}

// DESPUÉS
.root {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.content {
  min-width: 0;
}
```

**Cambios:** eliminar `max-width` y `margin: 0 auto`. Reducir `gap` de 1.25rem a 1rem.

---

## MEJORA 2 — `ActivitiesModuleNav`: convertir a tabs pill

### 2.1 — `ActivitiesModuleNav.tsx`

**Archivo:** `src/features/activities/components/ActivitiesModuleNav/ActivitiesModuleNav.tsx`

La nav actual usa `AppNavLink` con iconos (estilo sidebar). Reemplazar por links nativos con `NavLink` de React Router y estilos tab.

```tsx
// ANTES
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { AppNavLink } from '@/shared/ui/NavLink'
import styles from './ActivitiesModuleNav.module.scss'

export function ActivitiesModuleNav() {
  return (
    <nav className={styles.nav} aria-label="Secciones de actividades">
      <AppNavLink to={activitiesPaths.root} end icon="list-check">
        Actividades
      </AppNavLink>
      <AppNavLink to={activitiesPaths.categories} icon="gear">
        Categorías
      </AppNavLink>
      <AppNavLink to={activitiesPaths.tracking} icon="clock">
        Seguimiento
      </AppNavLink>
    </nav>
  )
}

// DESPUÉS
import { NavLink } from 'react-router'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import styles from './ActivitiesModuleNav.module.scss'

export function ActivitiesModuleNav() {
  return (
    <nav className={styles.nav} aria-label="Secciones de actividades">
      <NavLink
        to={activitiesPaths.root}
        end
        className={({ isActive }) =>
          [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')
        }
      >
        Actividades
      </NavLink>
      <NavLink
        to={activitiesPaths.categories}
        className={({ isActive }) =>
          [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')
        }
      >
        Categorías
      </NavLink>
      <NavLink
        to={activitiesPaths.tracking}
        className={({ isActive }) =>
          [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')
        }
      >
        Seguimiento
      </NavLink>
    </nav>
  )
}
```

### 2.2 — `ActivitiesModuleNav.module.scss`

**Archivo:** `src/features/activities/components/ActivitiesModuleNav/ActivitiesModuleNav.module.scss`

```scss
// REEMPLAZAR COMPLETAMENTE
@use '@/app/styles/mixins/breakpoints' as *;

.nav {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-md);
  background: var(--color-surface-raised, var(--color-surface));
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  width: fit-content;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.85rem;
  border-radius: calc(var(--radius-md) - 2px);
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-secondary);
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.12s ease, color 0.12s ease;

  &:hover:not(.tabActive) {
    background: var(--color-surface-hover, rgba(0, 0, 0, 0.04));
    color: var(--color-text);
  }
}

.tabActive {
  background: var(--color-surface, #ffffff);
  color: var(--color-text);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
```

**Nota:** verificar que `var(--color-surface-raised)` esté definido en `src/app/styles/tokens/_theme-variables.scss`. Si no existe, usar `var(--color-surface)` directamente con un `background` ligeramente diferente al del tab activo.

---

## MEJORA 3 — `ActivityTrackingPage`: layout 2 columnas desktop + sticky bar mobile

Esta es la mejora más compleja. Afecta tanto al TSX como al módulo SCSS.

### 3.1 — Eliminar header redundante + reorganizar JSX

**Archivo:** `src/features/activities/pages/ActivityTrackingPage.tsx`

**Cambio 3.1.a — Eliminar el `<header>` con título y subtitle:**

```tsx
// ANTES — dentro del return, líneas ~273-279
return (
  <div className={styles.page}>
    <header className={styles.header}>
      <div>
        <h2 className={styles.title}>Seguimiento de tiempo</h2>
        <p className={styles.subtitle}>Semana actual · más reciente arriba</p>
      </div>
    </header>

    <ActivityWeekSelector days={weekDays} onSelect={handleSelectDay} />
    ...

// DESPUÉS — eliminar el <header> completo; el selector de semana queda primero
return (
  <div className={styles.page}>
    <div className={styles.topRow}>
      <ActivityWeekSelector days={weekDays} onSelect={handleSelectDay} />
      <div className={styles.topActions}>
        <Button
          variant="primary"
          onClick={handleOpenStart}
          disabled={Boolean(session)}
          aria-label="Iniciar nueva actividad"
        >
          <AppIcon name="plus" size="sm" decorative />
          Iniciar
        </Button>
        <Button
          variant="secondary"
          onClick={handleOpenLogPast}
          disabled={Boolean(session)}
          aria-label="Registrar tiempo pasado"
        >
          <AppIcon name="clock" size="sm" decorative />
          Registrar
        </Button>
      </div>
    </div>
    ...
```

**Cambio 3.1.b — Reemplazar el bloque de Tabs por layout 2 columnas en desktop:**

```tsx
// ANTES — bloque Tabs completo (~líneas 283-393)
<Tabs
  value={activeView}
  onChange={(value) => setActiveView(value as TrackingView)}
  className={styles.views}
>
  <Tabs.List>
    <Tabs.Tab value={TRACKING_VIEW.timeline}>Registro</Tabs.Tab>
    <Tabs.Tab value={TRACKING_VIEW.summary}>Resumen</Tabs.Tab>
  </Tabs.List>

  <Tabs.Panel value={TRACKING_VIEW.timeline}>
    <div className={styles.timelinePanel}>
      <DayRemainingWidget className={styles.timelineClock} />
      <div className={styles.toolbar}>
        <Button ...>Iniciar nueva actividad</Button>
        <Button ...>Registrar tiempo pasado</Button>
      </div>
      {/* ... error, skeleton, hint, timeline ... */}
    </div>
  </Tabs.Panel>

  <Tabs.Panel value={TRACKING_VIEW.summary}>
    <div className={styles.summaryPanel}>
      {/* ... widgets ... */}
    </div>
  </Tabs.Panel>
</Tabs>

// DESPUÉS — layout 2 columnas en desktop, tabs solo en mobile
{/* Columna izquierda: timeline (desktop y mobile) */}
{/* Columna derecha: resumen (desktop permanente, mobile tras tab) */}

<div className={styles.layout}>
  {/* Columna izquierda — SIEMPRE visible */}
  <div className={styles.timelineCol}>
    {isError ? (
      <Alert variant="danger" title="No se pudo cargar la timeline">
        {error instanceof Error ? error.message : 'Error desconocido'}
        <Button variant="ghost" onClick={() => refetch()}>
          Reintentar
        </Button>
      </Alert>
    ) : null}

    {isLoading ? (
      <div className={styles.skeleton}>
        <Skeleton height="3rem" />
        <Skeleton height="12rem" />
        <Skeleton height="12rem" />
      </div>
    ) : null}

    {showDayHint ? (
      <p className={styles.dayHint}>
        No hay registros este día. Usa los botones de arriba para empezar.
      </p>
    ) : null}

    {!isLoading && !isError ? (
      <ActivityDayTimeline
        date={selectedDate}
        followUps={followUps}
        freeSlots={freeSlots}
        showCurrentTimeMarker={isToday(selectedDate)}
        quickActionsDisabled={Boolean(session)}
        runningSession={isToday(selectedDate) ? session : null}
        sessionLoading={startMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
        routineSuggestion={isToday(selectedDate) ? routineSuggestion : null}
        routineUpcoming={isToday(selectedDate) ? routineUpcoming : null}
        onFollowUpClick={setEditFollowUp}
        onFreeSlotClick={setFreeSlotModal}
        onContinueAfterFollowUp={handleContinueAfterFollowUp}
        onStartFromFollowUp={handleStartFromFollowUp}
        onStartSuggestion={handleStartSuggestion}
        onFinishSession={handleOpenFinish}
        onCancelSession={handleCancelSession}
      />
    ) : null}
  </div>

  {/* Columna derecha — resumen (siempre en desktop, oculto en mobile) */}
  <aside className={styles.summaryCol}>
    <DayRemainingWidget />
    <DayUsageWidget
      date={selectedDate}
      followUps={followUps}
      freeSlots={freeSlots}
      isLoading={isLoading}
    />
    <CategoryTimeWidget
      date={selectedDate}
      followUps={followUps}
      isLoading={isLoading}
    />
    <DayStoryWidget
      date={selectedDate}
      followUps={followUps}
      isLoading={isLoading}
    />
  </aside>
</div>

{/* Mobile: resumen compacto arriba del timeline — solo en mobile */}
<div className={styles.mobileMetrics}>
  <DayRemainingWidget compact />
  <DayUsageWidget
    date={selectedDate}
    followUps={followUps}
    freeSlots={freeSlots}
    isLoading={isLoading}
    compact
  />
</div>

{/* Mobile: sticky action bar */}
<div className={styles.mobileActions}>
  <Button
    variant="primary"
    onClick={handleOpenStart}
    disabled={Boolean(session)}
    className={styles.mobileActionBtn}
  >
    <AppIcon name="plus" size="sm" decorative />
    Iniciar
  </Button>
  <Button
    variant="secondary"
    onClick={handleOpenLogPast}
    disabled={Boolean(session)}
    className={styles.mobileActionBtn}
  >
    <AppIcon name="clock" size="sm" decorative />
    Registrar
  </Button>
</div>
```

**Nota sobre `compact` prop:** `DayRemainingWidget` y `DayUsageWidget` probablemente no tengan prop `compact`. Hay dos opciones:
- **Opción A (recomendada):** No usar `compact` y simplemente ocultar `mobileMetrics` con CSS mostrando solo `DayRemainingWidget` en mobile (sin prop adicional). Los widgets se renderizan a su tamaño normal pero dentro de un contenedor limitado.
- **Opción B:** Añadir prop `compact?: boolean` a cada widget si se necesita reducir la información mostrada.

Usar la opción A si los widgets se ven aceptables en mobile a su tamaño normal. Los widgets en `summaryCol` ya tienen `className` ignorado si no existe — quitar el prop `className` de los widgets en la columna derecha si no lo necesitan.

**Cambio 3.1.c — Eliminar imports no usados:**

```tsx
// ELIMINAR estos imports si ya no se usan:
// import { Tabs } from '@/shared/ui/Tabs'
// Y el tipo TrackingView y constante TRACKING_VIEW si el estado activeView se elimina

// ELIMINAR este estado:
// const [activeView, setActiveView] = useState<TrackingView>(TRACKING_VIEW.timeline)
```

### 3.2 — `ActivityTrackingPage.module.scss`

**Archivo:** `src/features/activities/pages/ActivityTrackingPage.module.scss`

```scss
// REEMPLAZAR COMPLETAMENTE
@use '@/app/styles/mixins/breakpoints' as *;

.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  // En mobile: espacio para la sticky bar al fondo
  padding-bottom: 5rem;

  @include md {
    padding-bottom: 0;
  }
}

// Fila superior: selector de semana + botones (desktop)
.topRow {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

// Botones junto al selector — visibles solo en desktop
.topActions {
  display: none;
  gap: 0.5rem;

  @include md {
    display: flex;
  }
}

// Layout 2 columnas (solo desktop)
.layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @include md {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 1.25rem;
    align-items: start;
  }
}

.timelineCol {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

// Columna de resumen — oculta en mobile, visible en desktop
.summaryCol {
  display: none;
  flex-direction: column;
  gap: 0.75rem;

  @include md {
    display: flex;
  }
}

// Métricas compactas en mobile (encima del timeline)
.mobileMetrics {
  display: flex;
  gap: 0.5rem;

  @include md {
    display: none;
  }
}

// Sticky bar de acciones — solo mobile
.mobileActions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0px));
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  z-index: 50;

  @include md {
    display: none;
  }
}

.mobileActionBtn {
  flex: 1;
}

.dayHint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

**Cambios respecto al módulo anterior:**
- Eliminar: `.header`, `.title`, `.subtitle`, `.views`, `.timelinePanel`, `.summaryPanel`, `.summaryHint`, `.widgetsRow`, `.timelineClock`, `.widgetUsage`, `.widgetCategory`, `.widgetStory`, `.toolbar`
- Añadir: `.topRow`, `.topActions`, `.layout`, `.timelineCol`, `.summaryCol`, `.mobileMetrics`, `.mobileActions`, `.mobileActionBtn`

---

## MEJORA 4 — `ActivityCategoriesPanel`: grid responsive + tarjeta "+"

### 4.1 — `ActivityCategoriesPanel.module.scss`

**Archivo:** `src/features/activities/components/ActivityCategoriesPanel/ActivityCategoriesPanel.module.scss`

Leer el archivo actual antes de modificar. El cambio principal es en la clase `.grid`:

```scss
// ANTES (probable)
.grid {
  display: grid;
  grid-template-columns: 1fr;   // ← o quizá sin grid definido
  gap: 1rem;
}

// DESPUÉS
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
  align-items: start;
}
```

### 4.2 — Tarjeta "+" integrada en el grid

**Archivo:** `src/features/activities/components/ActivityCategoriesPanel/ActivityCategoriesPanel.tsx`

Añadir una tarjeta de creación al final del grid. Solo en desktop (≥768px) donde el grid tiene múltiples columnas.

```tsx
// ANTES — dentro del bloque de categorías existentes
{!isLoading && !isError && sortedCategories.length > 0 ? (
  <div className={styles.grid}>
    {sortedCategories.map((category) => (
      <ActivityCategoryCard
        key={category.id}
        category={category}
        onEdit={openEdit}
        onDelete={handleDelete}
        deleting={deleteMutation.isPending && deleteMutation.variables === category.id}
      />
    ))}
  </div>
) : null}

// DESPUÉS — añadir tarjeta "+" al final del grid
{!isLoading && !isError && sortedCategories.length > 0 ? (
  <div className={styles.grid}>
    {sortedCategories.map((category) => (
      <ActivityCategoryCard
        key={category.id}
        category={category}
        onEdit={openEdit}
        onDelete={handleDelete}
        deleting={deleteMutation.isPending && deleteMutation.variables === category.id}
      />
    ))}
    <button
      type="button"
      className={styles.addCard}
      onClick={openCreate}
      aria-label="Nueva categoría"
    >
      <AppIcon name="plus" size="sm" decorative />
      Nueva categoría
    </button>
  </div>
) : null}
```

Añadir al SCSS:

```scss
.addCard {
  display: none; // oculta en mobile — el botón del toolbar es suficiente

  @include md {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
    padding: 1rem;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    cursor: pointer;
    min-height: 72px; // altura mínima para alinearse con las tarjetas
    transition: border-color 0.15s ease, color 0.15s ease;

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
}
```

**Nota:** verificar en `ActivityCategoryCard` cuál es la altura mínima de las tarjetas para ajustar `min-height` de `.addCard` si es necesario.

---

## MEJORA 5 — `ActivityDetailPage`: layout 2 columnas desktop + sticky bar mobile

### 5.1 — `ActivityDetailPage.tsx`

**Archivo:** `src/features/activities/pages/ActivityDetailPage.tsx`

```tsx
// ANTES — estructura del return (líneas ~71 en adelante)
return (
  <div className={styles.page}>
    <div className={styles.toolbar}>
      <Button variant="ghost" size="sm" to={activitiesPaths.root}>
        ← Volver
      </Button>
      <div className={styles.toolbarActions}>
        <Button variant="ghost" size="sm" to={activitiesPaths.edit(activity.id)}>
          Editar
        </Button>
        {!isCompleted ? (
          <Button size="sm" onClick={handleComplete} isLoading={completeMutation.isPending}>
            Completar
          </Button>
        ) : null}
        <Button variant="danger" size="sm" onClick={() => void handleDelete()} isLoading={deleteMutation.isPending}>
          Eliminar
        </Button>
      </div>
    </div>

    <Card className={styles.mainCard}>
      {/* ... header, description, badges, metaGrid ... */}
    </Card>

    <ActivityTimeTrackingPlaceholder spentTimeMinutes={activity.spentTimeMinutes} />
  </div>
)

// DESPUÉS
return (
  <div className={styles.page}>
    {/* Breadcrumb + editar — siempre en la parte superior */}
    <div className={styles.toolbar}>
      <Button variant="ghost" size="sm" to={activitiesPaths.root}>
        ← Actividades
      </Button>
      <Button variant="ghost" size="sm" to={activitiesPaths.edit(activity.id)}>
        Editar
      </Button>
    </div>

    {/* Layout 2 columnas en desktop */}
    <div className={styles.layout}>
      {/* Columna izquierda: contenido principal */}
      <div className={styles.mainCol}>
        <Card className={styles.mainCard}>
          <div className={styles.header}>
            <span
              className={styles.iconWrap}
              style={{ backgroundColor: `${accent}22`, color: accent, borderColor: accent }}
              aria-hidden
            >
              <AppIcon name={activity.category?.icon ?? 'list-check'} size="lg" decorative />
            </span>
            <div>
              <h1 className={styles.title}>{activity.title}</h1>
              {activity.category ? (
                <Link to={activitiesPaths.categories} className={styles.categoryLink}>
                  {activity.category.name}
                </Link>
              ) : (
                <span className={styles.categoryMuted}>Sin categoría</span>
              )}
            </div>
          </div>

          {activity.description ? (
            <p className={styles.description}>{activity.description}</p>
          ) : (
            <p className={styles.descriptionMuted}>Sin descripción</p>
          )}

          <div className={styles.badges}>
            <ActivityPriorityBadge priority={activity.priority} />
            <ActivityStatusBadge status={activity.status} />
          </div>
        </Card>

        <ActivityTimeTrackingPlaceholder spentTimeMinutes={activity.spentTimeMinutes} />
      </div>

      {/* Columna derecha: metadata + acciones (desktop) */}
      <aside className={styles.sideCol}>
        <Card className={styles.sideCard}>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Programada</dt>
              <dd>{formatActivityDate(activity.scheduledDate)}</dd>
            </div>
            <div>
              <dt>Completada</dt>
              <dd>{formatActivityDate(activity.completedAt)}</dd>
            </div>
            <div>
              <dt>Creada</dt>
              <dd>{formatActivityDate(activity.createdAt)}</dd>
            </div>
            <div>
              <dt>Actualizada</dt>
              <dd>{formatActivityDate(activity.updatedAt)}</dd>
            </div>
          </dl>

          {/* Acciones — visibles en desktop dentro del sidebar */}
          <div className={styles.sideActions}>
            {!isCompleted ? (
              <Button
                onClick={handleComplete}
                isLoading={completeMutation.isPending}
                className={styles.sideActionBtn}
              >
                Completar actividad
              </Button>
            ) : null}
            <Button
              variant="danger"
              onClick={() => void handleDelete()}
              isLoading={deleteMutation.isPending}
              className={styles.sideActionBtn}
            >
              Eliminar
            </Button>
          </div>
        </Card>
      </aside>
    </div>

    {/* Acciones mobile — sticky bar al fondo */}
    <div className={styles.mobileActions}>
      {!isCompleted ? (
        <Button
          variant="primary"
          onClick={handleComplete}
          isLoading={completeMutation.isPending}
          className={styles.mobileActionBtn}
        >
          Completar
        </Button>
      ) : null}
      <Button
        variant="danger"
        onClick={() => void handleDelete()}
        isLoading={deleteMutation.isPending}
        className={styles.mobileActionBtn}
      >
        Eliminar
      </Button>
    </div>
  </div>
)
```

### 5.2 — `ActivityDetailPage.module.scss`

**Archivo:** `src/features/activities/pages/ActivityDetailPage.module.scss`

```scss
// REEMPLAZAR COMPLETAMENTE
@use '@/app/styles/mixins/breakpoints' as *;

.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  // Espacio para sticky bar en mobile
  padding-bottom: 5rem;

  @include md {
    padding-bottom: 0;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  // El botón "Editar" empuja al borde derecho
  & > *:last-child {
    margin-left: auto;
  }
}

// Layout 2 columnas en desktop
.layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @include md {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 1.25rem;
    align-items: start;
  }
}

.mainCol {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

// Sidebar derecho — oculto en mobile
.sideCol {
  display: none;

  @include md {
    display: block;
  }
}

.mainCard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sideCard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.iconWrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-lg);
  border: 1px solid;
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.25;
}

.categoryLink {
  font-size: 0.875rem;
  color: var(--color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.categoryMuted {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.description {
  margin: 0;
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.descriptionMuted {
  margin: 0;
  color: var(--color-text-muted);
  font-style: italic;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.metaGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin: 0;
  font-size: 0.875rem;

  dt {
    margin: 0;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  dd {
    margin: 0.15rem 0 0;
    color: var(--color-text);
  }
}

// Acciones en la columna derecha (desktop)
.sideActions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.sideActionBtn {
  width: 100%;
  justify-content: center;
}

// Sticky bar mobile
.mobileActions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0px));
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  z-index: 50;

  @include md {
    display: none;
  }
}

.mobileActionBtn {
  flex: 1;
  justify-content: center;
}
```

---

## Orden de implementación recomendado

Implementar en este orden para minimizar regresiones:

1. **Mejora 1** — `ActivitiesModuleLayout`: quitar `PageHeader` y `max-width`. Cambio más seguro, solo CSS + eliminar un componente. Verificar visualmente las 3 sub-rutas.

2. **Mejora 2** — `ActivitiesModuleNav` tabs. Cambio visual importante pero aislado en el componente de nav.

3. **Mejora 4** — `ActivityCategoriesPanel` grid responsive. Aislado en el panel de categorías.

4. **Mejora 5** — `ActivityDetailPage` 2 columnas + sticky bar. Afecta solo la página de detalle.

5. **Mejora 3** — `ActivityTrackingPage` 2 columnas. La más compleja; hacerla al final.

---

## Breakpoints utilizados

```scss
// src/app/styles/mixins/breakpoints.scss
// @include md  →  @media (min-width: 768px)
// @include sm  →  @media (min-width: 640px)
```

La Mejora 3 y la Mejora 5 usan `@include md` (768px) como punto de quiebre desktop/mobile.

---

## Criterios de aceptación

### Mejora 1 + 2
- [ ] El módulo ya no muestra el `PageHeader` con "Actividades" y su subtítulo
- [ ] El contenido ocupa el 100% del ancho disponible (sin `max-width: 72rem`)
- [ ] La nav muestra 3 tabs pill sin iconos: "Actividades", "Categorías", "Seguimiento"
- [ ] El tab activo tiene fondo blanco / surface y peso 500
- [ ] En mobile (< 768px), los tabs tienen scroll horizontal sin barra visible

### Mejora 3
- [ ] En desktop (≥ 768px): selector de semana + botones "Iniciar" / "Registrar" en la misma fila
- [ ] En desktop: 2 columnas — timeline a la izquierda, resumen siempre visible a la derecha
- [ ] En desktop: no hay tab "Resumen" — los widgets están siempre visibles
- [ ] En mobile (< 768px): métricas compactas visibles sobre el timeline
- [ ] En mobile: sticky bar con "Iniciar" y "Registrar" fija al fondo de la pantalla
- [ ] En mobile: sticky bar respeta `safe-area-inset-bottom` (notch de iPhone)
- [ ] El `<h2>Seguimiento de tiempo</h2>` eliminado

### Mejora 4
- [ ] Las tarjetas de categoría se muestran en grid de 2 columnas en desktop
- [ ] En mobile: 1 columna (el `minmax` colapsa automáticamente)
- [ ] En desktop: tarjeta "+" dashed visible al final del grid
- [ ] En mobile: tarjeta "+" oculta (el botón del toolbar es suficiente)
- [ ] La tarjeta "+" hace hover con color primario

### Mejora 5
- [ ] En desktop (≥ 768px): layout 2 columnas — contenido principal izquierda, metadata + acciones derecha
- [ ] En desktop: botones "Completar" y "Eliminar" visibles en la columna derecha sin scroll
- [ ] El toolbar superior solo muestra "← Actividades" + "Editar"
- [ ] En mobile: contenido en 1 columna, metadata resumida
- [ ] En mobile: sticky bar con "Completar" y "Eliminar" fija al fondo
- [ ] Actividad ya completada: no muestra botón "Completar" en ningún viewport

### General
- [ ] No hay regresiones en: `/app/activities`, `/app/activities/categories`, `/app/activities/tracking`, `/app/activities/:id`
- [ ] Tema claro y oscuro funcionan en todos los componentes modificados
- [ ] No hay errores de TypeScript ni de consola
- [ ] Scroll horizontal en tabs de nav no muestra scrollbar en ningún navegador
