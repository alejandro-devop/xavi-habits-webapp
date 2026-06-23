# Habits Module Improvements — xavi-habits-web

> **Modelo recomendado para Cursor:** `claude-sonnet-4-5`
> Para máxima precisión en rediseños de componentes con múltiples archivos interdependientes: `claude-opus-4`.

---

## Contexto del módulo

El módulo de hábitos vive en `src/features/habits/` y tiene la siguiente jerarquía de rutas:

```
/app/habits                          → HabitsModuleLayout (layout compartido)
  /app/habits/my-day                 → HabitMyDayPage       (vista diaria)
  /app/habits/list                   → HabitsListPage        (lista de todos)
  /app/habits/persona                → HabitPersonaPage      (propósitos / yo ideal)
  /app/habits/:id                    → HabitDetailPage       (detalle + semana + historial)
  /app/habits/:id/edit               → HabitFormPage         (formulario edición)
  /app/habits/:id/week               → HabitWeekViewPage     (vista semanal standalone)
  /app/habits/:id/calendar           → HabitCalendarPage     (contribution grid)
  /app/habits/categories             → HabitCategoriesPage   (gestión de categorías)
```

Stack relevante:
- React 19 + TypeScript
- SCSS Modules (sin Tailwind)
- React Router v7
- TanStack Query (React Query) para datos
- `@dnd-kit/core` para drag-and-drop en HabitPersonaPage
- Variables CSS en `src/app/styles/tokens/` + `src/app/styles/_variables.scss`
- Iconos: `<AppIcon name="..." size="sm|md|lg" />` con slugs FontAwesome

---

## Estructura actual de archivos clave

| Archivo | Descripción |
|---|---|
| `src/features/habits/components/HabitsModuleLayout/HabitsModuleLayout.tsx` | Layout padre del módulo |
| `src/features/habits/components/HabitsModuleLayout/HabitsModuleLayout.module.scss` | Estilos del layout padre |
| `src/features/habits/pages/HabitMyDayPage.tsx` | Vista diaria |
| `src/features/habits/pages/HabitMyDayPage.module.scss` | Estilos vista diaria |
| `src/features/habits/pages/HabitsListPage.tsx` | Lista de hábitos activos |
| `src/features/habits/pages/HabitsListPage.module.scss` | Estilos lista |
| `src/features/habits/pages/HabitDetailPage.tsx` | Detalle de un hábito |
| `src/features/habits/pages/HabitDetailPage.module.scss` | Estilos detalle |
| `src/features/habits/pages/HabitPersonaPage.tsx` | Página de propósitos |
| `src/features/habits/pages/HabitPersonaPage.module.scss` | Estilos propósitos |
| `src/features/habits/components/HabitDayCard/HabitDayCard.tsx` | Card de hábito en Mi Día |
| `src/features/habits/components/HabitDayCard/HabitDayCard.module.scss` | Estilos card diaria |
| `src/features/habits/components/HabitCard/HabitCard.module.scss` | Estilos card lista |

---

## Problemas identificados

### P1 — Triple max-width acumulado: contenido efectivo ≤ 72rem siempre

Hay tres capas de restricción de ancho que se acumulan:

```
AppLayout.main          → max-width: 1400px + margin: 0 auto
└── HabitsModuleLayout  → max-width: 72rem (1152px) + margin: 0 auto  ← REDUNDANTE
    └── páginas internas
```

En la práctica, el contenido nunca supera los 1152px aunque la pantalla tenga más espacio. El `HabitsModuleLayout` no debería imponer su propio `max-width` — ya hay uno global en `AppLayout`.

**Archivo:** `src/features/habits/components/HabitsModuleLayout/HabitsModuleLayout.module.scss`

```scss
// ESTADO ACTUAL
.root {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  max-width: 72rem;   /* ← problema: restringe innecesariamente */
  margin: 0 auto;     /* ← problema: centra cuando no debería */
}
```

---

### P2 — PageHeader duplicado: dos títulos visibles al mismo tiempo

`HabitsModuleLayout` renderiza un `<PageHeader title="Hábitos" subtitle="Registra y sigue tus hábitos diarios." />` que aparece en **todas** las sub-páginas. Pero cada sub-página también tiene su propio heading:

- `HabitsListPage`: `<h1>Hábitos activos</h1>`
- `HabitPersonaPage`: `<h2>Mi Persona Ideal</h2>`
- `HabitMyDayPage`: solo muestra una fecha en `<p class="date">`

El resultado visual es una jerarquía de headings confusa: el usuario ve "Hábitos / Registra y sigue tus hábitos diarios." encima de "Hábitos activos", que es redundante y ocupa espacio sin aportar contexto diferencial.

---

### P3 — Sub-nav del módulo: tabs poco definidos visualmente

La navegación interna del módulo (Mi Día / Mis Hábitos / Mi Persona) usa `AppNavLink` dentro de un `<nav>`, lo que los hace visualmente iguales a los links del sidebar global. No hay distinción visual clara de que son tabs de una sub-sección vs. navegación principal.

```tsx
// HabitsModuleLayout.tsx — actual
<nav className={styles.nav} aria-label="Secciones de hábitos">
  <AppNavLink to={habitsPaths.myDay} icon="sun">Mi Día</AppNavLink>
  <AppNavLink to={habitsPaths.list} icon="list">Mis Hábitos</AppNavLink>
  <AppNavLink to={habitsPaths.persona} icon="user">Mi Persona</AppNavLink>
</nav>
```

El `border-bottom` del `.nav` sí da una separación, pero los items tienen el mismo estilo pill/ghost que el sidebar.

---

### P4 — HabitMyDayPage: fecha pequeña, sin jerarquía visual clara

La página empieza con `<p class="date">` (font-size: 0.85rem, color secundario) — un elemento de texto de apoyo ocupa la posición de hero de la pantalla. La fecha del día es la información más importante de esta página y está tratada como metadato.

```scss
/* HabitMyDayPage.module.scss — actual */
.date {
  font-size: 0.85rem;               /* ← demasiado pequeño para el contexto */
  color: var(--color-text-secondary);
  text-transform: capitalize;
}
```

El grid de cards es `1fr 1fr` en desktop con `gap: 0.75rem` — funciona pero podría escalar a 3 columnas en pantallas anchas (≥1280px).

---

### P5 — HabitDayCard: HabitPurposeBanner en cada card es muy ruidoso

Cada `HabitDayCard` renderiza un `<HabitPurposeBanner>` al principio. Este componente muestra:
- Si el hábito tiene propósito: "Para ser: X" o "Para dejar de ser: X"
- Si **no** tiene propósito: un banner CTA "¿Por qué haces este hábito?" con link a Persona

Con 8 hábitos en Mi Día, hay hasta 8 banners CTA idénticos repitiendo el mismo mensaje. Esto genera ruido visual masivo y empuja el contenido real hacia abajo.

```tsx
// HabitDayCard.tsx — línea 63
<HabitPurposeBanner purpose={entry.habit.purpose} habitId={entry.habit.id} />
```

---

### P6 — HabitDayCard: progress bar con label ilegible

```scss
/* HabitDayCard.module.scss */
.progressBar {
  height: 1.1rem;          /* barra de 17.6px */
}

.progressLabel {
  font-size: 0.65rem;      /* ← texto de 10.4px sobre una barra de 17.6px: barely legible */
  color: var(--color-text-tertiary);
  padding-right: 0.25rem;
}
```

El label "X/Y días" flota sobre la barra con un contraste pobre. En hábitos con barras llenas el texto blanco/claro desaparece.

---

### P7 — HabitDayCard: doble padding en `.content`

```scss
.card {
  gap: 0.75rem;            /* gap entre children */
  padding: 1rem 1.25rem;
}

.content {
  gap: 0.75rem;
  padding-top: 0.75rem;    /* ← padding-top extra sobre el gap del card */
}
```

El `HabitPurposeBanner` más el `padding-top: 0.75rem` del `.content` crean una separación visual excesiva en la parte superior de cada card.

---

### P8 — HabitsListPage: lista de hábitos en columna única por grupo

```scss
/* HabitsListPage.module.scss */
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;  /* ← columna única siempre */
  gap: 0.5rem;
}
```

Las `HabitCard` son compactas (tienen height ~70-80px). En desktop una lista de 10+ hábitos en columna única es muy larga y difícil de escanear. Un grid 2 columnas aprovecharía mejor el espacio.

---

### P9 — HabitDetailPage: header sobrecargado y botón volver frágil

```tsx
// HabitDetailPage.tsx — header actual
<header className={styles.header}>
  <div className={styles.headerLeft}>
    <Button variant="ghost" size="sm" onClick={() => navigate(habitsPaths.list)}>
      ← Volver        {/* ← navegación hardcodeada, no respeta el history */}
    </Button>
    <div className={styles.titleRow}>
      <AppIcon name={habit.icon} size="md" />
      <h1>{habit.name}</h1>
      <HabitStatusBadge status={habit.status} />    {/* 3 elementos en fila */}
      <HabitTypeBadge habitType={habit.habitType} />
    </div>
    {habit.description && <p className={styles.description}>{habit.description}</p>}
  </div>
  <Button size="sm" onClick={() => setEditOpen(true)}>Editar</Button>
</header>
```

Problemas:
- `← Volver` con `navigate(habitsPaths.list)` ignora el historial del browser. Si el usuario llegó desde Buscar o desde Mi Día, volver lo lleva a la lista en lugar de al lugar de origen.
- `titleRow` tiene 4 elementos en flex: icon + h1 + StatusBadge + TypeBadge. En nombres largos el h1 comprime los badges y hace el layout roto.
- Los badges de estado/tipo están en el header al mismo nivel que el título — demasiada información en una línea.

---

### P10 — HabitPersonaPage: layout 1+2 rompe la metáfora del DnD

El layout actual es:

```
┌─────────────────────────────┐
│  Sin asignar (pool) — 100%  │  ← ancho completo
└─────────────────────────────┘
┌──────────────┬──────────────┐
│ Lo que quiero│Lo que no qu. │  ← 2 columnas
└──────────────┴──────────────┘
```

Para drag-and-drop entre zonas, el usuario debe arrastrar un item desde arriba hacia abajo. La metáfora más natural sería 3 columnas side by side donde el arrastre es horizontal:

```
┌────────────┬──────────────┬──────────────┐
│Sin asignar │Lo que quiero │Lo que no qu. │
└────────────┴──────────────┴──────────────┘
```

---

## Mejoras propuestas

---

### MEJORA 1 — HabitsModuleLayout: quitar max-width y rediseñar header

**Impacto:** Libera espacio horizontal para todas las sub-páginas del módulo. Elimina el heading redundante "Hábitos".

#### 1.1 — Quitar max-width del módulo

**Archivo:** `src/features/habits/components/HabitsModuleLayout/HabitsModuleLayout.module.scss`

```scss
/* ANTES */
.root {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  max-width: 72rem;   /* ← ELIMINAR */
  margin: 0 auto;     /* ← ELIMINAR */
}

/* DESPUÉS */
.root {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}
```

#### 1.2 — Quitar el PageHeader del módulo layout

**Archivo:** `src/features/habits/components/HabitsModuleLayout/HabitsModuleLayout.tsx`

```tsx
/* ANTES */
import { PageHeader } from '@/shared/ui/PageHeader'

export function HabitsModuleLayout() {
  return (
    <div className={styles.root}>
      <PageHeader
        title="Hábitos"
        subtitle="Registra y sigue tus hábitos diarios."
      />
      <nav className={styles.nav} aria-label="Secciones de hábitos">
        ...
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}

/* DESPUÉS */
export function HabitsModuleLayout() {
  return (
    <div className={styles.root}>
      <nav className={styles.nav} aria-label="Secciones de hábitos">
        <AppNavLink to={habitsPaths.myDay} icon="sun">Mi Día</AppNavLink>
        <AppNavLink to={habitsPaths.list} icon="list">Mis Hábitos</AppNavLink>
        <AppNavLink to={habitsPaths.persona} icon="user">Mi Persona</AppNavLink>
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
```

Eliminar el import de `PageHeader` si no se usa en ningún otro lugar del archivo.

#### 1.3 — Mejorar estilo visual del sub-nav

**Archivo:** `src/features/habits/components/HabitsModuleLayout/HabitsModuleLayout.module.scss`

```scss
/* ANTES */
.nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

/* DESPUÉS — tab-bar más definido */
.nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding-bottom: 0;
  border-bottom: 2px solid var(--color-border);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  /* Los AppNavLink dentro del nav deben tener un estilo "tab" */
  /* Ver sección 1.4 para el override */
}

.content {
  min-width: 0;
}
```

#### 1.4 — Estilo tab para los AppNavLink dentro del sub-nav

Los `AppNavLink` dentro del `.nav` del módulo deben verse como tabs (con indicador en bottom border) en lugar de pills. Para lograr esto sin modificar el componente global, usar un selector de contexto en el módulo SCSS:

**Archivo:** `src/features/habits/components/HabitsModuleLayout/HabitsModuleLayout.module.scss`

```scss
/* Agregar al final del archivo */
/* Override de AppNavLink cuando está dentro del sub-nav del módulo */
.nav :global(.link) {
  border-radius: 0;
  padding: 0.5rem 0.75rem;
  background: transparent !important;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;    /* overlap con el border-bottom del nav */
  font-size: 0.875rem;
}

.nav :global(.link):hover {
  background: color-mix(in srgb, var(--color-text) 5%, transparent) !important;
  border-bottom-color: var(--color-border);
}

.nav :global(.active) {
  color: var(--color-primary);
  background: transparent !important;
  border-bottom: 2px solid var(--color-primary);
}
```

**Nota:** Si el proyecto usa un enfoque diferente para overrides globales (ej: pasar `className` al componente), ajustar según el patrón existente.

---

### MEJORA 2 — HabitMyDayPage: fecha prominente como hero + grid adaptativo

**Impacto:** La fecha pasa de ser un metadato a ser el título de la página. Mejor uso del espacio horizontal en monitores anchos.

#### 2.1 — Fecha como hero heading

**Archivo:** `src/features/habits/pages/HabitMyDayPage.tsx`

```tsx
/* ANTES */
<div className={styles.root}>
  <p className={styles.date}>{formatDate(today)}</p>
  <div className={styles.summaryBar}>...

/* DESPUÉS */
<div className={styles.root}>
  <header className={styles.pageHeader}>
    <h1 className={styles.date}>{formatDate(today)}</h1>
    <div className={styles.summaryBar}>
      ...
    </div>
  </header>
  <ul className={styles.list}>...
```

**Archivo:** `src/features/habits/pages/HabitMyDayPage.module.scss`

```scss
/* ANTES */
.date {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  text-transform: capitalize;
  margin: 0;
}

/* DESPUÉS */
.pageHeader {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.date {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  text-transform: capitalize;
  margin: 0;
  line-height: 1.2;
}
```

#### 2.2 — Grid adaptativo a 3 columnas en pantallas anchas

**Archivo:** `src/features/habits/pages/HabitMyDayPage.module.scss`

```scss
/* ANTES */
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

/* DESPUÉS */
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));  /* auto-fill adaptativo */
  gap: 0.75rem;
}
```

`auto-fill` con `minmax(20rem, 1fr)` significa:
- En mobile (< 640px): 1 columna
- En tablet (~768px): 2 columnas
- En desktop amplio (≥1280px con sidebar colapsado): hasta 3 columnas

---

### MEJORA 3 — HabitDayCard: limpiar el ruido visual

**Impacto:** Cada card se ve más limpia. El PropósitoBanner deja de aparecer como CTA repetido.

#### 3.1 — Suprimir HabitPurposeBanner cuando no hay propósito

La idea: mostrar el banner de propósito **solo** si el hábito tiene un propósito asignado. El CTA "¿Por qué haces este hábito?" no debe aparecer en la vista diaria — ya que distrae de la tarea principal (registrar el hábito).

**Archivo:** `src/features/habits/components/HabitDayCard/HabitDayCard.tsx`

```tsx
/* ANTES — línea 63 */
<HabitPurposeBanner purpose={entry.habit.purpose} habitId={entry.habit.id} />

/* DESPUÉS — solo mostrar si hay propósito asignado */
{entry.habit.purpose
  ? <HabitPurposeBanner purpose={entry.habit.purpose} habitId={entry.habit.id} />
  : null
}
```

Esto requiere verificar cómo `entry.habit.purpose` puede ser `null | undefined` vs. el objeto `HabitPurpose`. Si `purpose` es `null` cuando no está asignado, la condición `entry.habit.purpose` ya es suficiente.

#### 3.2 — Separar el label de progreso de la barra

**Archivo:** `src/features/habits/components/HabitDayCard/HabitDayCard.tsx`

```tsx
/* ANTES */
{progress !== null && (
  <div className={styles.progressBar} aria-label={`${habit.streak}/${habit.periodDays} días`}>
    <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
    <span className={styles.progressLabel}>{habit.streak}/{habit.periodDays} días</span>
  </div>
)}

/* DESPUÉS — label fuera de la barra, encima a la derecha */
{progress !== null && (
  <div className={styles.progressGroup}>
    <span className={styles.progressLabel}>{habit.streak}/{habit.periodDays} días</span>
    <div className={styles.progressBar} aria-label={`${habit.streak}/${habit.periodDays} días`}>
      <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
    </div>
  </div>
)}
```

**Archivo:** `src/features/habits/components/HabitDayCard/HabitDayCard.module.scss`

```scss
/* ELIMINAR o reemplazar .progressLabel y .progressBar actuales */

/* ANTES */
.progressBar {
  position: relative;
  height: 1.1rem;
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}

.progressFill {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width 0.3s;
}

.progressLabel {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  padding-right: 0.25rem;
}

/* DESPUÉS */
.progressGroup {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.progressLabel {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  align-self: flex-end;
  line-height: 1;
}

.progressBar {
  height: 0.375rem;            /* barra delgada — la info está en el label externo */
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width 0.3s ease;
}
```

#### 3.3 — Quitar el padding-top redundante en .content

**Archivo:** `src/features/habits/components/HabitDayCard/HabitDayCard.module.scss`

```scss
/* ANTES */
.content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;    /* ← ELIMINAR — el gap del card ya separa */
}

/* DESPUÉS */
.content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

#### 3.4 — Aumentar tamaño de los weekDots

**Archivo:** `src/features/habits/components/HabitDayCard/HabitDayCard.module.scss`

```scss
/* ANTES */
.weekDot::before {
  content: '';
  display: block;
  width: 1.5rem;   /* 24px */
  height: 1.5rem;
  border-radius: 50%;
  background: var(--color-border);
  border: 2px solid transparent;
}

.dotLabel {
  font-size: 0.62rem;
}

/* DESPUÉS */
.weekDot::before {
  content: '';
  display: block;
  width: 1.75rem;  /* 28px — más fácil de leer */
  height: 1.75rem;
  border-radius: 50%;
  background: var(--color-border);
  border: 2px solid transparent;
}

.dotLabel {
  font-size: 0.68rem;  /* ligeramente más grande */
}
```

---

### MEJORA 4 — HabitsListPage: grid 2 columnas para las cards

**Impacto:** Con múltiples hábitos, el usuario puede ver más información de un vistazo sin scroll.

**Archivo:** `src/features/habits/pages/HabitsListPage.module.scss`

```scss
/* ANTES */
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;   /* ← columna única */
  gap: 0.5rem;
}

/* DESPUÉS */
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.5rem;
}
```

`minmax(18rem, 1fr)` con `auto-fill` produce:
- Mobile (< 640px): 1 columna
- Desktop estándar: 2 columnas
- Desktop ancho: 3 columnas

**Nota:** Verificar que `HabitCard` no asuma un ancho específico en su CSS. Si el card tiene un `min-width` hardcodeado, ajustarlo o eliminarlo.

---

### MEJORA 5 — HabitDetailPage: header limpio + navegación con browser history

**Impacto:** Header más legible. El botón volver respeta el historial de navegación del usuario.

#### 5.1 — Usar `navigate(-1)` para el botón volver

**Archivo:** `src/features/habits/pages/HabitDetailPage.tsx`

```tsx
/* ANTES */
<Button
  variant="ghost"
  size="sm"
  onClick={() => navigate(habitsPaths.list)}
>
  ← Volver
</Button>

/* DESPUÉS */
<Button
  variant="ghost"
  size="sm"
  onClick={() => navigate(-1)}   /* respeta el historial del browser */
>
  ← Volver
</Button>
```

**Nota:** Si hay casos donde el usuario puede llegar a esta página sin historial previo (deep link directo), agregar un fallback:
```tsx
onClick={() => {
  if (window.history.length > 1) {
    navigate(-1)
  } else {
    navigate(habitsPaths.list)
  }
}}
```

#### 5.2 — Reorganizar el header: separar título de badges

**Archivo:** `src/features/habits/pages/HabitDetailPage.module.scss`

```scss
/* ANTES */
.titleRow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

/* DESPUÉS */
.titleRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;        /* título en una línea */
  min-width: 0;
}

.title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;                  /* crece pero no empuja los badges fuera */
}

/* NUEVO — fila de badges separada del título */
.badgesRow {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}
```

**Archivo:** `src/features/habits/pages/HabitDetailPage.tsx`

```tsx
/* ANTES */
<div className={styles.titleRow}>
  {habit.icon && <AppIcon name={habit.icon} size="md" className={styles.icon} />}
  <h1 className={styles.title}>{habit.name}</h1>
  <HabitStatusBadge status={habit.status} />
  <HabitTypeBadge habitType={habit.habitType} />
</div>

/* DESPUÉS */
<div className={styles.headerLeft}>
  <Button variant="ghost" size="sm" onClick={...}>← Volver</Button>
  <div className={styles.titleRow}>
    {habit.icon && <AppIcon name={habit.icon} size="md" className={styles.icon} />}
    <h1 className={styles.title}>{habit.name}</h1>
  </div>
  <div className={styles.badgesRow}>
    <HabitStatusBadge status={habit.status} />
    <HabitTypeBadge habitType={habit.habitType} />
  </div>
  {habit.description && (
    <p className={styles.description}>{habit.description}</p>
  )}
</div>
```

---

### MEJORA 6 — HabitPersonaPage: 3 columnas horizontales para DnD natural

**Impacto:** El drag-and-drop entre zonas se vuelve horizontal (más natural). El pool "Sin asignar" es igual de accesible que las otras zonas.

**Archivo:** `src/features/habits/pages/HabitPersonaPage.module.scss`

```scss
/* ANTES */
.pool {
  width: 100%;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

/* DESPUÉS */
/* pool ya no existe como clase separada */

.threeColumns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;    /* 3 columnas iguales */
  gap: 1rem;
  align-items: flex-start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;      /* pool arriba en tablet */
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;          /* una columna en mobile */
  }
}
```

**Archivo:** `src/features/habits/pages/HabitPersonaPage.tsx`

```tsx
/* ANTES */
<DndContext ...>
  <div className={styles.pool}>
    <PersonaColumn title="Sin asignar" placement="pool" ... />
  </div>

  <div className={styles.columns}>
    <PersonaColumn title="Lo que quiero" placement="want" ... />
    <PersonaColumn title="Lo que no quiero" placement="avoid" ... />
  </div>
</DndContext>

/* DESPUÉS */
<DndContext ...>
  <div className={styles.threeColumns}>
    <PersonaColumn title="Sin asignar" placement="pool" ... />
    <PersonaColumn title="Lo que quiero" placement="want" ... />
    <PersonaColumn title="Lo que no quiero" placement="avoid" ... />
  </div>
</DndContext>
```

Eliminar las clases `.pool` y `.columns` del SCSS y del JSX. Agregar `.threeColumns`.

---

## Orden de implementación recomendado

1. **Mejora 1** (HabitsModuleLayout) — primero porque afecta todas las sub-páginas. Quitar max-width y PageHeader libera espacio inmediatamente. Riesgo bajo.

2. **Mejora 3.1** (suprimir HabitPurposeBanner cuando no hay propósito) — cambio de una línea, impacto visual inmediato en Mi Día.

3. **Mejora 3.2-3.4** (HabitDayCard: progress bar + padding + weekDots) — mejoras cosméticas en el componente más visto.

4. **Mejora 2** (HabitMyDayPage: fecha hero + grid adaptativo) — necesita que el espacio del módulo ya esté liberado (Mejora 1).

5. **Mejora 4** (HabitsListPage: grid 2 columnas) — cambio de SCSS puro, verificar que HabitCard funciona bien en ancho reducido.

6. **Mejora 5** (HabitDetailPage: header + volver) — cambios de TSX + SCSS, verificar en mobile.

7. **Mejora 6** (HabitPersonaPage: 3 columnas) — verificar comportamiento DnD en las 3 zonas después del cambio de layout.

---

## Criterios de aceptación

### Módulo layout (Mejora 1)
- [ ] No aparece ningún heading "Hábitos" ni subtítulo encima de la sub-nav
- [ ] La sub-nav tiene estilo visual de tabs (indicador en bottom), no pills
- [ ] El contenido de cada sub-página usa el 100% del ancho disponible tras el sidebar
- [ ] La sub-nav es scrollable horizontalmente en mobile sin mostrar scrollbar

### Mi Día (Mejora 2 + 3)
- [ ] La fecha aparece como heading prominente (≥1.4rem, font-weight 700, color principal)
- [ ] En pantallas ≥1280px con sidebar colapsado aparecen 3 columnas de cards
- [ ] En mobile (< 640px) las cards son de 1 columna
- [ ] Los hábitos sin propósito asignado NO muestran el banner CTA "¿Por qué haces este hábito?"
- [ ] El label "X/Y días" aparece encima/a la derecha de la barra de progreso (no superpuesto)
- [ ] Los weekDots tienen al menos 1.75rem de diámetro
- [ ] No hay doble espacio entre el banner de propósito y el header del card

### Lista de hábitos (Mejora 4)
- [ ] Los hábitos aparecen en grid de 2 columnas en desktop (≥768px)
- [ ] Las cards no se rompen visualmente en ancho reducido (~18rem mínimo)
- [ ] Los grupos por categoría siguen siendo visibles con su groupTitle

### Detalle de hábito (Mejora 5)
- [ ] El botón "← Volver" usa `navigate(-1)` con fallback a la lista
- [ ] El título del hábito aparece en su propia fila (sin badges en la misma línea)
- [ ] Los badges de estado y tipo aparecen en una fila separada bajo el título
- [ ] En nombres largos el título se trunca con ellipsis sin romper el layout

### Persona (Mejora 6)
- [ ] Las 3 columnas (Sin asignar, Lo que quiero, Lo que no quiero) aparecen en horizontal en desktop
- [ ] El drag-and-drop entre las 3 columnas funciona correctamente
- [ ] En tablet (≤900px) el layout cambia a 2+1 o columna única
- [ ] El DragOverlay sigue funcionando igual

### General
- [ ] No hay errores de TypeScript ni de consola en ninguna de las rutas del módulo
- [ ] El tema claro y oscuro funcionan correctamente en todos los componentes modificados
- [ ] Las rutas de detalle, semana y calendario no se ven afectadas por los cambios del módulo layout

---

## Variables CSS relevantes en el módulo

```scss
// Colores semánticos usados en el módulo
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-text-muted
--color-primary
--color-border
--color-surface
--color-surface-raised
--color-surface-hover
--color-success-text       // #16a34a (verde para logrado)
--color-success-subtle     // #dcfce7
--color-danger-text        // #991b1b (rojo para fallido)
--color-danger-subtle      // #fee2e2

// Spacing tokens (SCSS variables)
$spacing-sm: 0.5rem   // 8px
$spacing-md: 1rem     // 16px
$spacing-lg: 2rem     // 32px

// Breakpoints
$breakpoint-lg: 1024px  // sidebar visible
```
