# Todos Module — Mejoras de layout

> **Modelo recomendado para Cursor:** `claude-opus-4`  
> Este módulo tiene un sistema visual paper muy específico (mixins, variables CSS custom, `font-handwritten`, lógica de margen). Se necesita máxima precisión para no romper la identidad visual.

---

## Principio rector

**El estilo paper NO se toca.** Las rayas, el margen rojo, la fuente Caveat, las pestañas tipo cuaderno, el checkbox en el margen — todo permanece exactamente igual. Las mejoras son únicamente de uso de espacio y organización de UI, nunca de estética.

---

## Contexto del proyecto

- **Framework:** React 19 + TypeScript + Vite
- **Estilos:** SCSS Modules + mixins paper (`src/app/styles/mixins/_paper.scss`)
- **Variables paper:** `--paper-bg`, `--paper-line`, `--paper-margin`, `--paper-margin-width: 44px`, `--paper-row-height: 40px`
- **Font handwritten:** `'Caveat', cursive` vía `var(--font-handwritten)`
- **Framer Motion:** usado en `NotebookItem` para animaciones de entrada
- **Estado del drawer:** `openTodoId: string | null` en `NotebookList`

---

## Arquitectura actual del módulo

```
NotebookList (componente raíz — sin página wrapper propia)
└── PaperSurface
    ├── [tabs prop] → tabsBar (encima del papel)
    │   ├── NotebookFilters   ← filtros de fecha + toggle "completadas"
    │   └── NotebookTabs      ← pestañas carpetas: Hoy | Mi Rutina | Suggested | [carpetas] | +
    ├── NotebookInput         ← fila de nueva tarea (dentro del papel)
    ├── EmptyState | Spinner | DailyPoolView | ul.list
    │   └── NotebookItem × N  ← cada fila del cuaderno
    └── TodoDrawer            ← drawer modal deslizante desde la derecha
```

**Archivos clave:**

| Archivo | Responsabilidad |
|---|---|
| `src/features/todos/components/NotebookList/NotebookList.tsx` | Componente raíz, orquesta todo |
| `src/features/todos/components/NotebookList/NotebookList.module.scss` | Estilos del wrapper |
| `src/shared/ui/PaperSurface/PaperSurface.tsx` | Superficie paper reutilizable |
| `src/shared/ui/PaperSurface/PaperSurface.module.scss` | Estilos del papel |
| `src/features/todos/components/NotebookTabs/NotebookTabs.tsx` | Pestañas carpetas |
| `src/features/todos/components/NotebookTabs/NotebookTabs.module.scss` | Estilos pestañas |
| `src/features/todos/components/NotebookFilters/NotebookFilters.tsx` | Filtros fecha + completadas |
| `src/features/todos/components/NotebookFilters/NotebookFilters.module.scss` | Estilos filtros |
| `src/features/todos/components/NotebookInput/NotebookInput.tsx` | Input nueva tarea |
| `src/features/todos/components/NotebookInput/NotebookInput.module.scss` | Estilos input |
| `src/features/todos/components/TodoDrawer/TodoDrawer.tsx` | Panel de detalle de tarea |
| `src/features/todos/components/TodoDrawer/TodoDrawer.module.scss` | Estilos del drawer |

---

## Problemas identificados

| ID | Problema |
|----|---------|
| P1 | Con el nuevo layout global (sin `max-width` en `.main`), el cuaderno se estira a pantalla completa — las líneas de texto se vuelven muy largas e incómodas de leer. El papel necesita su propio `max-width`. |
| P2 | `TodoDrawer` abre como modal overlay que cubre todo el cuaderno. El usuario pierde el contexto de la lista mientras edita una tarea. |
| P3 | `NotebookFilters` está en la `tabsBar` encima del papel, creando dos filas de controles apiladas (filtros + pestañas) que compiten visualmente. |
| P4 | En mobile, las carpetas de usuario con nombres largos desbordan la barra de pestañas y el botón "+" queda fuera de pantalla. |

---

## MEJORA 1 — `NotebookList`: max-width propio del cuaderno

El cuaderno es un objeto (como un papel físico), no un layout de dashboard. No debe estirarse a pantalla completa. Añadir un wrapper centrado con `max-width`.

### 1.1 — `NotebookList.tsx`

Envolver `PaperSurface` en un `<div className={styles.paperWrapper}>`:

```tsx
// ANTES — return completo
return (
  <PaperSurface
    tabs={
      <>
        <NotebookFilters ... />
        <NotebookTabs ... />
      </>
    }
  >
    {/* ... contenido ... */}
    <TodoDrawer todoId={openTodoId} onClose={() => setOpenTodoId(null)} />
  </PaperSurface>
)

// DESPUÉS — añadir div wrapper
return (
  <div className={styles.root}>
    <div className={styles.paperWrapper}>
      <PaperSurface
        tabs={
          <>
            <NotebookFilters ... />
            <NotebookTabs ... />
          </>
        }
      >
        {/* ... contenido igual ... */}
        <TodoDrawer todoId={openTodoId} onClose={() => setOpenTodoId(null)} />
      </PaperSurface>
    </div>
  </div>
)
```

### 1.2 — `NotebookList.module.scss`

```scss
// AÑADIR al módulo (mantener .loading y .list existentes)
.root {
  width: 100%;
}

.paperWrapper {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}
```

**Resultado:** El cuaderno siempre tiene un ancho máximo de 640px, centrado en el espacio disponible. En pantallas de 1440px con sidebar colapsada, el papel queda centrado con espacio limpio a los lados — exactamente como un cuaderno físico sobre un escritorio.

---

## MEJORA 2 — `TodoDrawer`: panel lateral en desktop, drawer en mobile

En desktop (≥768px), cuando el usuario hace clic en una tarea, en lugar de abrir un drawer que cubre el cuaderno, se abre un panel lateral a la derecha del papel. El cuaderno permanece visible y navegable.

En mobile (<768px), el comportamiento actual (drawer deslizante desde abajo/derecha) se mantiene sin cambios.

### 2.1 — `NotebookList.tsx`: detectar viewport + layout con panel

**Añadir al inicio del componente** (detección de desktop):

```tsx
// Añadir import al inicio
import { useEffect, useState } from 'react'  // ya existe, solo verificar

// Añadir dentro de NotebookList, junto a los otros estados
const [isDesktop, setIsDesktop] = useState(false)

useEffect(() => {
  const mq = window.matchMedia('(min-width: 768px)')
  setIsDesktop(mq.matches)
  const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}, [])

const showPanel = Boolean(openTodoId) && isDesktop
```

**Cambiar el return** para usar layout 2 columnas cuando hay panel abierto:

```tsx
// ANTES
return (
  <div className={styles.root}>
    <div className={styles.paperWrapper}>
      <PaperSurface tabs={...}>
        {/* contenido */}
        <TodoDrawer todoId={openTodoId} onClose={() => setOpenTodoId(null)} />
      </PaperSurface>
    </div>
  </div>
)

// DESPUÉS
return (
  <div className={[styles.root, showPanel ? styles.withPanel : ''].filter(Boolean).join(' ')}>
    <div className={styles.paperWrapper}>
      <PaperSurface tabs={...}>
        {/* contenido sin cambios */}

        {/* Drawer mobile: solo cuando NO hay panel desktop */}
        {!showPanel ? (
          <TodoDrawer todoId={openTodoId} onClose={() => setOpenTodoId(null)} />
        ) : null}
      </PaperSurface>
    </div>

    {/* Panel desktop: fuera del PaperSurface, como columna sibling */}
    {showPanel ? (
      <TodoDrawer
        todoId={openTodoId}
        onClose={() => setOpenTodoId(null)}
        asPanel
      />
    ) : null}
  </div>
)
```

### 2.2 — `NotebookList.module.scss`: layout 2 columnas

```scss
// AÑADIR a las clases existentes

.root {
  width: 100%;
  display: flex;            // flex por defecto para poder añadir panel
  flex-direction: column;   // columna cuando no hay panel
}

.withPanel {
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
    gap: 0;
  }
}

.paperWrapper {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  flex: 1 1 auto;           // ocupa el espacio disponible

  .withPanel & {
    max-width: none;        // cuando hay panel, el paper no centra — ocupa la columna izquierda
    margin: 0;
  }
}
```

### 2.3 — `TodoDrawer.tsx`: añadir prop `asPanel` + modo panel

**Tipo actualizado:**

```tsx
// ANTES
type Props = {
  todoId: string | null
  onClose: () => void
}

// DESPUÉS
type Props = {
  todoId: string | null
  onClose: () => void
  asPanel?: boolean
}

export function TodoDrawer({ todoId, onClose, asPanel = false }: Props) {
```

**Return actualizado** (solo cambia el wrapper externo, el contenido interno es idéntico):

```tsx
// ANTES — siempre usa <Drawer>
return (
  <Drawer open={Boolean(todoId)} onClose={onClose} side="right" variant="notebook" title="Detalle de tarea">
    {isLoading || !todo ? (
      <div className={styles.loading}><Spinner /></div>
    ) : (
      <div className={styles.body}>
        {/* ... todo el contenido ... */}
      </div>
    )}
  </Drawer>
)

// DESPUÉS — panel en desktop, drawer en mobile
if (!todoId) return null

const inner = isLoading || !todo ? (
  <div className={styles.loading}><Spinner /></div>
) : (
  <div className={styles.body}>
    {/* ... todo el contenido sin cambios ... */}
  </div>
)

if (asPanel) {
  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Detalle</span>
        <button
          type="button"
          className={styles.panelClose}
          onClick={onClose}
          aria-label="Cerrar panel"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className={styles.panelContent}>
        {inner}
      </div>
    </aside>
  )
}

return (
  <Drawer open={Boolean(todoId)} onClose={onClose} side="right" variant="notebook" title="Detalle de tarea">
    {inner}
  </Drawer>
)
```

### 2.4 — `TodoDrawer.module.scss`: estilos del panel lateral

**Añadir** al final del archivo existente (sin tocar los estilos existentes):

```scss
// ── Panel lateral desktop ──────────────────────────────────────────────────────

.panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--paper-bg);
  border-left: 1px solid var(--paper-line);
  display: flex;
  flex-direction: column;
  min-height: 400px;
  // La altura se ajusta al PaperSurface hermano via align-items: flex-start en el padre
  align-self: stretch;
}

.panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--paper-line);
  background: var(--paper-bg);
  flex-shrink: 0;
}

.panelTitle {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.panelClose {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color 0.12s;

  &:hover {
    color: var(--color-text);
    background: rgba(0, 0, 0, 0.05);
  }

  :global([data-theme='dark']) &:hover {
    background: rgba(255, 255, 255, 0.07);
  }
}

.panelContent {
  flex: 1;
  overflow-y: auto;
  // El .body existente ya tiene su padding — se reutiliza dentro de .panelContent
}
```

**Nota:** El `.body` existente del drawer (con sus secciones, campos, etc.) se reutiliza tal cual dentro de `.panelContent`. No hay que duplicar esos estilos.

---

## MEJORA 3 — `NotebookFilters`: mover dentro del papel, en la fila del input

Los filtros salen de `tabsBar` (encima del papel) y pasan a una fila compacta dentro del papel, justo debajo del `NotebookInput`. De esta forma las pestañas de carpetas quedan solas y limpias arriba, y los filtros están contextualizados dentro del cuaderno.

Los filtros solo se muestran cuando la vista actual los usa (no en Hoy, no en Suggested, no en Daily Pool).

### 3.1 — `NotebookList.tsx`: sacar `NotebookFilters` del `tabs` prop

```tsx
// ANTES
<PaperSurface
  tabs={
    <>
      <NotebookFilters
        dateRange={dateRange}
        showCompleted={showCompleted}
        onDateRangeChange={setDateRange}
        onShowCompletedChange={setShowCompleted}
      />
      <NotebookTabs
        selectedFolderId={selectedFolderId}
        onSelect={(id) => {
          setSelectedFolderId(id)
          setFocusedIndex(-1)
        }}
      />
    </>
  }
>

// DESPUÉS — tabs prop solo con NotebookTabs
<PaperSurface
  tabs={
    <NotebookTabs
      selectedFolderId={selectedFolderId}
      onSelect={(id) => {
        setSelectedFolderId(id)
        setFocusedIndex(-1)
      }}
    />
  }
>
  {/* Input de nueva tarea — solo en vistas que lo admiten */}
  {!isSuggested && !isDailyPool && (
    <NotebookInput
      ref={newInputRef}
      value={draft.value}
      onChange={draft.set}
      onAdd={handleAdd}
      onClear={draft.clear}
    />
  )}

  {/* Filtros inline — solo en vistas de carpeta regular (no Hoy, no Suggested, no Daily Pool) */}
  {!isToday && !isSuggested && !isDailyPool && (
    <NotebookFilters
      dateRange={dateRange}
      showCompleted={showCompleted}
      onDateRangeChange={setDateRange}
      onShowCompletedChange={setShowCompleted}
      inline
    />
  )}

  {/* ... resto del contenido sin cambios ... */}
```

### 3.2 — `NotebookFilters.tsx`: añadir prop `inline` para modo compacto

```tsx
// ANTES
type Props = {
  dateRange: DateRange | null
  showCompleted: boolean
  onDateRangeChange: (range: DateRange | null) => void
  onShowCompletedChange: (show: boolean) => void
}

// DESPUÉS
type Props = {
  dateRange: DateRange | null
  showCompleted: boolean
  onDateRangeChange: (range: DateRange | null) => void
  onShowCompletedChange: (show: boolean) => void
  inline?: boolean  // modo compacto dentro del papel
}

export function NotebookFilters({
  dateRange,
  showCompleted,
  onDateRangeChange,
  onShowCompletedChange,
  inline = false,
}: Props) {
  // Etiquetas cortas para el modo inline
  const DATE_OPTIONS_INLINE: { value: DateRange; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
  ]

  const options = inline ? DATE_OPTIONS_INLINE : DATE_OPTIONS

  return (
    <div className={[styles.bar, inline ? styles.barInline : ''].filter(Boolean).join(' ')}>
      <div className={styles.chips}>
        {!inline && (  // "Todas" solo en modo no-inline (en inline, no filtrar = sin chip activo)
          <button
            type="button"
            className={[styles.chip, dateRange === null ? styles.chipActive : ''].join(' ')}
            onClick={() => onDateRangeChange(null)}
          >
            Todas
          </button>
        )}
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={[styles.chip, dateRange === opt.value ? styles.chipActive : ''].join(' ')}
            onClick={() => onDateRangeChange(dateRange === opt.value ? null : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className={styles.toggle}>
        {!inline && <span className={styles.toggleLabel}>Completadas</span>}
        <button
          type="button"
          role="switch"
          aria-checked={showCompleted}
          aria-label="Mostrar completadas"
          className={[styles.switch, showCompleted ? styles.switchOn : ''].join(' ')}
          onClick={() => onShowCompletedChange(!showCompleted)}
        >
          <span className={styles.thumb} />
        </button>
      </label>
    </div>
  )
}
```

### 3.3 — `NotebookFilters.module.scss`: añadir estilos inline

**Añadir** al final del archivo existente:

```scss
// ── Modo inline (dentro del papel) ────────────────────────────────────────────

.barInline {
  // Sobreescribe .bar para verse como una fila del papel
  padding: 0 var(--spacing-md) 0 calc(var(--paper-margin-width) + var(--spacing-md));
  height: calc(var(--paper-row-height) * 0.85);  // un poco más compacta que una fila normal
  border-bottom: 1px solid var(--paper-line);
  background: transparent;
  display: flex;
  align-items: center;
  gap: 0.35rem;

  .chips {
    gap: 0.25rem;
  }

  .chip {
    height: 20px;
    padding: 0 0.4rem;
    font-size: 0.7rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.03);
    color: var(--color-text-muted);

    :global([data-theme='dark']) & {
      border-color: rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.04);
    }
  }

  .chipActive {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.25);
    color: #4338CA;

    :global([data-theme='dark']) & {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.35);
      color: #A5B4FC;
    }
  }

  .toggle {
    margin-left: auto;
    gap: 0.25rem;
  }

  .switch {
    width: 24px;
    height: 14px;
    border-radius: 7px;

    .thumb {
      width: 10px;
      height: 10px;
      top: 2px;
      left: 2px;
    }
  }

  .switchOn .thumb {
    left: calc(100% - 12px);
  }
}
```

**Nota sobre `.bar`:** verificar los estilos actuales de `.bar`, `.chips`, `.chip`, `.chipActive`, `.toggle`, `.switch`, `.thumb`, `.switchOn` en el archivo existente para asegurarse de que `.barInline` los sobreescribe correctamente. Los estilos base de los elementos hijos se heredan del `.bar` original; `.barInline` solo sobreescribe lo necesario.

---

## MEJORA 4 — `NotebookTabs`: pestañas compactas en mobile

En mobile (<768px), las carpetas de usuario muestran solo el dot de color (sin texto). Las pestañas del sistema (Hoy, Mi Rutina, Suggested) mantienen etiquetas cortas. El botón "+" siempre visible.

### 4.1 — `NotebookTabs.tsx`: añadir span `.folderName` en carpetas de usuario

```tsx
// ANTES — en el map de folders
{folders.map((folder) => (
  <button
    key={folder.id}
    type="button"
    className={[styles.tab, selectedFolderId === folder.id ? styles.active : ''].join(' ')}
    onClick={() => onSelect(folder.id)}
  >
    <span className={styles.dot} style={{ background: folder.color }} />
    {folder.name}
    {/* count badge */}
  </button>
))}

// DESPUÉS — envolver el nombre en un span ocultable
{folders.map((folder) => (
  <button
    key={folder.id}
    type="button"
    className={[styles.tab, selectedFolderId === folder.id ? styles.active : ''].join(' ')}
    onClick={() => onSelect(folder.id)}
    title={folder.name}  // ← tooltip nativo con el nombre completo
    aria-label={folder.name}
  >
    <span className={styles.dot} style={{ background: folder.color }} />
    <span className={styles.folderName}>{folder.name}</span>
    {pendingCounts[folder.id] !== undefined ? (
      pendingCounts[folder.id] > 0 ? (
        <span className={styles.count}>{pendingCounts[folder.id]}</span>
      ) : null
    ) : folder.todoCount > 0 ? (
      <span className={styles.count}>{folder.todoCount}</span>
    ) : null}
  </button>
))}
```

También añadir `.suggestedLabel` en la pestaña Suggested para poder ocultarla en mobile:

```tsx
// ANTES — pestaña Suggested
<button ...>
  <svg .../>
  Suggested
  {/* count */}
</button>

// DESPUÉS
<button ...>
  <svg .../>
  <span className={styles.suggestedLabel}>Suggested</span>
  {/* count */}
</button>
```

### 4.2 — `NotebookTabs.module.scss`: ocultar nombres en mobile

**Añadir** al final del archivo:

```scss
// ── Responsive: mobile compacto ───────────────────────────────────────────────

.folderName {
  // En desktop: visible
  display: inline;
}

.suggestedLabel {
  display: inline;
}

@media (max-width: #{$breakpoint-md - 1}) {
  // Carpetas de usuario: solo el dot (sin nombre ni count)
  .folderName {
    display: none;
  }

  // "Suggested" se reduce a solo el icono
  .suggestedLabel {
    display: none;
  }

  // Los counts de carpetas también se ocultan en mobile (el dot de color es suficiente)
  // Solo mantener el count en las pestañas del sistema (Hoy, Suggested)
  .tab:not(.todayTab):not(.suggestedTab):not(.dailyPoolTab) .count {
    display: none;
  }
}
```

**Nota:** verificar el valor de `$breakpoint-md` en `src/app/styles/tokens/_breakpoints.scss`. Probablemente sea `768px`.

---

## Orden de implementación recomendado

1. **Mejora 1** — `NotebookList` max-width. Cambio de CSS puro, sin riesgo. Verificar que el cuaderno quede centrado en diferentes anchos de pantalla.

2. **Mejora 4** — `NotebookTabs` mobile compacto. Aislado en un componente, sin lógica compleja.

3. **Mejora 3** — `NotebookFilters` inline. Afecta `NotebookList.tsx`, `NotebookFilters.tsx`, `NotebookFilters.module.scss`. Verificar que los filtros funcionen igual que antes y que las vistas Hoy/Suggested/DailyPool no los muestren.

4. **Mejora 2** — Panel lateral desktop. La más compleja. Afecta `NotebookList.tsx`, `NotebookList.module.scss`, `TodoDrawer.tsx`, `TodoDrawer.module.scss`. Probar especialmente: navegación con teclado (↑↓ funciona mientras el panel está abierto), Escape cierra el panel, clic en otra tarea cambia el panel sin cerrarlo.

---

## Variables paper relevantes (solo lectura, no modificar)

```scss
// src/app/styles/_theme-variables.scss
--paper-bg             // color de fondo del papel (light: amarillo muy suave, dark: tono cálido oscuro)
--paper-line           // color de las rayas
--paper-margin         // color de la línea roja del margen
--paper-margin-width   // 44px — ancho del margen izquierdo
--paper-row-height     // 40px — altura de cada fila/raya
--paper-shadow         // sombra del bloque papel
--paper-texture-opacity

// src/app/styles/_theme-variables.scss
--font-handwritten     // 'Caveat', cursive
```

---

## Criterios de aceptación

### Mejora 1
- [ ] El cuaderno tiene `max-width: 640px` centrado en el área de contenido
- [ ] En pantallas <640px el cuaderno ocupa el 100% del ancho (responsive natural)
- [ ] El papel no se estira más allá de 640px en ningún viewport
- [ ] El espacio a los lados del cuaderno en pantallas anchas queda vacío (limpio)

### Mejora 2
- [ ] En desktop (≥768px), hacer clic en una tarea abre un panel lateral a la derecha del cuaderno
- [ ] El panel tiene fondo `--paper-bg` y borde izquierdo `--paper-line` — armoniza con el cuaderno
- [ ] El cuaderno sigue visible y navegable con ↑↓ mientras el panel está abierto
- [ ] Presionar Escape cierra el panel y devuelve el foco a la lista
- [ ] Hacer clic en otra tarea cambia el contenido del panel sin animación de cierre/apertura
- [ ] El botón ✕ del panel cierra el panel correctamente
- [ ] En mobile (<768px), el comportamiento es idéntico al actual (drawer)
- [ ] El panel NO aparece en Suggested ni en Daily Pool (esas vistas no tienen `openTodoId`)

### Mejora 3
- [ ] `NotebookFilters` ya NO aparece encima de las pestañas
- [ ] Las pestañas (`NotebookTabs`) quedan solas y limpias en `tabsBar`
- [ ] Los filtros aparecen como una fila compacta dentro del papel, debajo del input
- [ ] Los filtros solo aparecen cuando `!isToday && !isSuggested && !isDailyPool`
- [ ] El filtro activo se destaca visualmente con color índigo suave
- [ ] El toggle "Completadas" funciona igual que antes
- [ ] La altura de la fila de filtros respeta el ritmo de `--paper-row-height`

### Mejora 4
- [ ] En mobile (<768px): las carpetas de usuario muestran solo el dot de color, sin nombre
- [ ] El atributo `title` de cada pestaña tiene el nombre completo (tooltip nativo)
- [ ] "Suggested" se reduce a su icono en mobile
- [ ] El botón "+" siempre es visible (no queda fuera de la pantalla)
- [ ] Las pestañas del sistema (Hoy, Mi Rutina) mantienen su texto corto en mobile
- [ ] En desktop (≥768px): todo igual que antes — carpetas con nombre completo

### General
- [ ] Las rayas de papel, el margen rojo, la font Caveat y el shadow del cuaderno están intactos
- [ ] No hay regresiones en: navegación por teclado (↑↓, N, E, D, Enter, Escape)
- [ ] Tema claro y oscuro funcionan correctamente
- [ ] No hay errores de TypeScript ni de consola
- [ ] `DailyPoolView` y la vista Suggested no se ven afectadas por las mejoras 3 y 4
