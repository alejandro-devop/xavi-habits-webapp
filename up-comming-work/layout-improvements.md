# Layout Improvements — xavi-habits-web

> **Modelo recomendado para Cursor:** `claude-sonnet-4-5`
> Es el modelo con mejor balance entre calidad de razonamiento y velocidad para tareas de implementación que involucran múltiples archivos SCSS + TSX con patrones existentes específicos. Si quieres máxima precisión en cada paso, usa `claude-opus-4`.

---

## Contexto del proyecto

- **Framework:** React 19 + TypeScript + Vite
- **Estilos:** SCSS Modules (sin Tailwind). Variables en `src/app/styles/_variables.scss` y `src/app/styles/tokens/`.
- **Iconos:** `AppIcon` component con prop `name: AppIconName` (FontAwesome-style slugs: `'home'`, `'fire'`, etc.)
- **Router:** React Router v7 con `<Outlet />`
- **Estado global:** Zustand
- **Tooltips:** Verificar si existe componente `Tooltip` en `src/shared/ui/` antes de crear uno nuevo.

---

## Arquitectura del layout actual

```
AppLayout (src/layouts/AppLayout/AppLayout.tsx)
├── CommandPaletteProvider
└── div.root  [display: flex]
    ├── Sidebar  ← 15rem fija en desktop, oculta en mobile
    │   ├── brand "Xavi"
    │   ├── nav  (9 AppNavLink items)
    │   └── collapseBtn «/»
    ├── div.mainColumn  [flex: 1, flex-direction: column]
    │   ├── Topbar  ← sticky, padding 1rem 2rem
    │   │   ├── leading: Button(☰) + title "Xavi"
    │   │   ├── actions: ThemeToggle
    │   │   └── userArea: email + LogoutButton
    │   └── main.main  ← max-width: 1400px, margin: 0 auto, padding: 2rem
    │       └── <Outlet />
    ├── RunningActivityWidget  (floating)
    └── Drawer  (mobile nav)
```

### Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `src/layouts/AppLayout/AppLayout.tsx` | Shell principal, ensambla todo |
| `src/layouts/AppLayout/AppLayout.module.scss` | Estilos del shell |
| `src/layouts/AppLayout/app-nav.config.ts` | Items de navegación + command actions |
| `src/shared/ui/Sidebar/Sidebar.tsx` | Componente sidebar |
| `src/shared/ui/Sidebar/Sidebar.module.scss` | Estilos sidebar |
| `src/shared/ui/Topbar/Topbar.tsx` | Componente topbar |
| `src/shared/ui/Topbar/Topbar.module.scss` | Estilos topbar |
| `src/shared/ui/NavLink/AppNavLink.tsx` | Links de navegación |
| `src/shared/ui/NavLink/AppNavLink.module.scss` | Estilos de los links |
| `src/app/styles/_variables.scss` | Variables Sass globales (`$layout-max-width: 1400px`) |

---

## Problemas identificados

### P1 — Sidebar demasiado ancha (240px fija)
La sidebar tiene `width: 15rem` (240px) incluso en estado expandido. Con solo 9 ítems de texto corto + icono, ese ancho es excesivo. En una pantalla de 1440px, la sidebar consume el 16% del viewport de forma permanente.

### P2 — `max-width: 1400px` con `margin: 0 auto` en `.main`
El contenido tiene un techo de 1400px centrado horizontalmente. En monitores de 1440–1920px, esto genera márgenes en blanco automáticos a los lados. El espacio útil real es solo ~70% del área disponible después del sidebar.

### P3 — Topbar ocupa demasiada altura vertical
La Topbar tiene `padding: var(--spacing-md) var(--spacing-lg)` = `1rem 2rem` arriba y abajo, resultando en ~64px de altura. En desktop, la Topbar contiene: hamburger (oculto en desktop), breadcrumbs/título, ThemeToggle, email del usuario y LogoutButton. El email y el LogoutButton no aportan valor en el header — ya existe un `collapseBtn` en el sidebar y podrían moverse al footer del sidebar.

### P4 — Doble sistema de navegación redundante en desktop
En pantallas ≥1024px, tanto el Sidebar como la Topbar están visibles. El Sidebar tiene la navegación completa. La Topbar ocupa espacio permanente para mostrar información que puede reubicarse (usuario) o eliminarse.

### P5 — Padding acumulado entre `.main` y páginas internas
`.main` tiene `padding: $spacing-lg` (2rem = 32px) en desktop. Las páginas internas suelen agregar sus propios padding/margin internos. El resultado es un doble margen que comprime el contenido innecesariamente.

---

## Mejoras propuestas

---

### MEJORA 1 — Sidebar → Icon Rail (colapsada por defecto)

**Objetivo:** Reducir la sidebar de 240px a ~44px en su estado por defecto (icon rail), mostrando solo iconos centrados. Al hacer hover sobre un item, aparece un tooltip con el label. El usuario puede expandirla con un toggle y la preferencia se persiste en `localStorage`.

**Impacto:** +~200px de espacio horizontal en todas las páginas de la app.

**Referentes de diseño:** Linear, VS Code, Notion (barra lateral izquierda en modo compacto).

#### 1.1 — Cambiar estado inicial en `AppLayout.tsx`

**Archivo:** `src/layouts/AppLayout/AppLayout.tsx`

Cambiar la línea:
```tsx
// ANTES
const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

// DESPUÉS — leer preferencia del localStorage
const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
  const stored = localStorage.getItem('sidebar-collapsed')
  return stored !== null ? stored === 'true' : true  // true = colapsada por defecto
})

// Y en el toggle, persistir la preferencia:
onToggleCollapse={() => {
  setSidebarCollapsed((v) => {
    const next = !v
    localStorage.setItem('sidebar-collapsed', String(next))
    return next
  })
}}
```

#### 1.2 — Ajustar ancho del sidebar colapsado

**Archivo:** `src/shared/ui/Sidebar/Sidebar.module.scss`

```scss
// ANTES
.sidebar {
  display: none;
  flex-direction: column;
  width: 15rem;           /* ← 240px */
  padding: var(--spacing-md);
  /* ... resto igual */
}

.collapsed {
  width: 4.25rem;         /* ← 68px */
}

// DESPUÉS
.sidebar {
  display: none;
  flex-direction: column;
  width: 14rem;           /* reducido de 15rem → 14rem cuando expandida */
  padding: var(--spacing-md);
  /* ... resto igual */
}

.collapsed {
  width: 2.75rem;         /* 44px — icon rail ajustado */
  padding: var(--spacing-sm) 0.35rem;  /* menos padding horizontal */
  align-items: center;
}
```

#### 1.3 — Agregar tooltips a los NavLinks cuando está colapsado

**Archivo:** `src/shared/ui/NavLink/AppNavLink.tsx`

Primero, verificar si existe `src/shared/ui/Tooltip/` en el proyecto. Si existe, importarlo. Si no existe, crear un tooltip CSS puro con `title` attribute o implementar un tooltip simple.

**Opción A — Con tooltip nativo (mínimo esfuerzo):**
```tsx
// En AppNavLink.tsx, cuando collapsed=true, agregar title al RouterNavLink
<RouterNavLink
  {...props}
  title={collapsed ? String(children) : undefined}   // ← tooltip nativo del browser
  className={...}
>
```

**Opción B — Tooltip CSS personalizado (recomendado):**
```tsx
// ANTES
export function AppNavLink({ icon, collapsed = false, children, className, ...props }: AppNavLinkProps) {
  return (
    <RouterNavLink ...>
      {icon ? <AppIcon name={icon} size="sm" className={styles.icon} /> : null}
      <span className={styles.label}>{children}</span>
    </RouterNavLink>
  )
}

// DESPUÉS
export function AppNavLink({ icon, collapsed = false, children, className, ...props }: AppNavLinkProps) {
  return (
    <div className={collapsed ? styles.tooltipWrapper : undefined}>
      <RouterNavLink
        {...props}
        className={({ isActive }) =>
          [
            styles.link,
            isActive ? styles.active : '',
            collapsed ? styles.collapsed : '',
            typeof className === 'function'
              ? className({ isActive, isPending: false, isTransitioning: false })
              : className,
          ]
            .filter(Boolean)
            .join(' ')
        }
      >
        {icon ? <AppIcon name={icon} size="sm" className={styles.icon} /> : null}
        <span className={styles.label}>{children}</span>
      </RouterNavLink>
      {collapsed ? <span className={styles.tooltip}>{children}</span> : null}
    </div>
  )
}
```

**Archivo:** `src/shared/ui/NavLink/AppNavLink.module.scss`

Agregar al final:
```scss
.tooltipWrapper {
  position: relative;
  display: flex;

  &:hover .tooltip {
    opacity: 1;
    transform: translateX(0);
    pointer-events: none;
  }
}

.tooltip {
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%) translateX(-4px);
  background: var(--color-surface-raised, var(--color-surface));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 300;
  box-shadow: var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.12));
}
```

#### 1.4 — Ajustar el botón de colapso en sidebar colapsada

**Archivo:** `src/shared/ui/Sidebar/Sidebar.module.scss`

```scss
// ANTES
.collapseBtn {
  margin-top: var(--spacing-sm);
  align-self: flex-end;
  /* ... */
}

// DESPUÉS
.collapseBtn {
  margin-top: var(--spacing-sm);
  align-self: center;          /* centrado en estado colapsado */
  /* resto igual */
}
```

**Archivo:** `src/shared/ui/Sidebar/Sidebar.tsx`

El botón ya muestra `«` y `»`. En estado colapsado cambiar el contenido a un icono más pequeño:
```tsx
// ANTES
{collapsed ? '»' : '«'}

// DESPUÉS — usar iconos de AppIcon si están disponibles, o caracteres Unicode:
{collapsed ? '›' : '‹'}
// O mejor, con AppIcon:
{collapsed
  ? <AppIcon name="chevron-right" size="xs" />
  : <AppIcon name="chevron-left" size="xs" />
}
```

---

### MEJORA 2 — Eliminar `max-width` global del `.main`

**Objetivo:** Quitar el techo de 1400px y el centrado automático del área principal. Cada página define su propio `max-width` si lo necesita (formularios, páginas de detalle, etc.). Las páginas de lista/dashboard usan el 100% del espacio disponible.

**Impacto:** Las páginas densas (hábitos, actividades, tareas) ganan todo el ancho disponible.

#### 2.1 — Modificar `.main` en AppLayout

**Archivo:** `src/layouts/AppLayout/AppLayout.module.scss`

```scss
// ANTES
.main {
  flex: 1;
  max-width: $layout-max-width;   /* ← QUITAR */
  margin: 0 auto;                 /* ← QUITAR */
  padding: $spacing-lg;
  padding-bottom: calc($spacing-lg + 5rem);
  width: 100%;

  @media (max-width: #{$breakpoint-lg - 1}) {
    padding: $spacing-sm;
    padding-bottom: calc($spacing-sm + 5rem);
  }

  &:has(.fullWidthPage) {
    max-width: none;
    padding: 0;
    margin: 0;
    overflow: hidden;
  }
}

// DESPUÉS
.main {
  flex: 1;
  padding: $spacing-md;                             /* 1rem en lugar de 2rem */
  padding-bottom: calc($spacing-md + 5rem);
  width: 100%;
  min-width: 0;

  @media (max-width: #{$breakpoint-lg - 1}) {
    padding: $spacing-sm;
    padding-bottom: calc($spacing-sm + 5rem);
  }

  &:has(.fullWidthPage) {
    padding: 0;
    overflow: hidden;
  }
}
```

**Nota importante:** Si existe alguna página que confíe en el centrado global (por ejemplo, una página de configuración o formulario que se ve bien centrada), esa página debe agregar su propio contenedor:
```scss
/* En el módulo SCSS de esa página específica */
.pageContainer {
  max-width: 680px;
  margin: 0 auto;
}
```

---

### MEJORA 3 — Slim Topbar: reducir altura y mover user area al sidebar

**Objetivo:** Reducir la topbar a un subheader de ~40px que solo muestre breadcrumbs/título de la página y las acciones contextuales de esa página. El email del usuario y el LogoutButton se mueven al footer del sidebar (visible como avatar + tooltip con opciones en el estado colapsado).

**Impacto:** ~24px extra de espacio vertical en toda la app. La topbar deja de ser un elemento de identidad y pasa a ser solo navegación contextual.

#### 3.1 — Reducir padding de la Topbar

**Archivo:** `src/shared/ui/Topbar/Topbar.module.scss`

```scss
// ANTES
.topbar {
  display: flex;
  flex-shrink: 0;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);   /* 1rem 2rem = 64px total altura */
  border-bottom: 1px solid var(--color-border);
  /* ... */
}

// DESPUÉS
.topbar {
  display: flex;
  flex-shrink: 0;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.4rem var(--spacing-md);              /* reducido — ~40px total altura */
  border-bottom: 1px solid var(--color-border);
  /* ... */
}
```

#### 3.2 — Mover user area al footer del Sidebar

**Archivo:** `src/layouts/AppLayout/AppLayout.tsx`

```tsx
// ANTES — user area en Topbar
<Topbar
  leading={<Button ...>☰</Button>}
  title="Xavi"
  titleClassName={styles.topbarBrand}
  actions={<ThemeToggle />}
  userArea={
    <>
      {user ? <span className={styles.userEmail}>{user.email}</span> : null}
      <LogoutButton />
    </>
  }
/>

// DESPUÉS — user area movida al sidebar como footer prop
<Sidebar
  brand="Xavi"
  items={appSidebarItems}
  collapsed={sidebarCollapsed}
  onToggleCollapse={() => {
    setSidebarCollapsed((v) => {
      const next = !v
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }}
  footer={
    <div className={styles.sidebarUserArea}>
      {!sidebarCollapsed && user
        ? <span className={styles.userEmail}>{user.email}</span>
        : null}
      <LogoutButton iconOnly={sidebarCollapsed} />
    </div>
  }
/>

<Topbar
  leading={<Button ...>☰</Button>}
  title="Xavi"
  titleClassName={styles.topbarBrand}
  actions={<ThemeToggle />}
  // ← userArea eliminado del topbar
/>
```

**Nota:** `LogoutButton` probablemente no tenga prop `iconOnly`. Revisar `src/features/auth/components/LogoutButton/`. Si no existe esa prop, se puede envolver condicionalmente:
```tsx
footer={
  <div className={styles.sidebarUserArea}>
    {!sidebarCollapsed && user
      ? <span className={styles.userEmail}>{user.email}</span>
      : null}
    <LogoutButton />
  </div>
}
```

#### 3.3 — Estilos del user area en el sidebar footer

**Archivo:** `src/layouts/AppLayout/AppLayout.module.scss`

Agregar:
```scss
.sidebarUserArea {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
  align-items: flex-start;
  width: 100%;

  // En estado colapsado (cuando el sidebar tiene 44px), centrar
  :global(.collapsed) & {
    align-items: center;
  }
}
```

**Archivo:** `src/shared/ui/Sidebar/Sidebar.module.scss`

El footer ya existe y tiene:
```scss
.footer {
  margin-top: auto;
  padding-top: var(--spacing-md);
}
```
No requiere cambios.

---

### MEJORA 4 — Reducir padding global del `.main` de 2rem a 1rem

Esta mejora ya está incorporada en la Mejora 2 (cambio de `$spacing-lg` → `$spacing-md`). Se documenta por separado para claridad.

**Archivo:** `src/layouts/AppLayout/AppLayout.module.scss`

```scss
// ANTES
.main {
  padding: $spacing-lg;                         /* 2rem = 32px */
  padding-bottom: calc($spacing-lg + 5rem);
}

// DESPUÉS
.main {
  padding: $spacing-md;                         /* 1rem = 16px */
  padding-bottom: calc($spacing-md + 5rem);
}
```

**Impacto:** Cada lado gana 16px. En páginas con contenido denso (listas, calendarios) se recuperan 32px de ancho y 16px de alto.

---

### MEJORA 5 — Sidebar expandida on hover (flyout opcional)

**Objetivo:** Cuando la sidebar está en estado icon-rail (colapsada), al hacer hover sobre ella se expande temporalmente mostrando los labels. Al salir del hover, vuelve a colapsar. El toggle manual sigue existiendo para fijar el estado expandido.

**Nota:** Esta mejora es opcional y depende de si la Mejora 1 se implementa primero. Solo implementar si el usuario prefiere ver labels en hover en lugar de tooltips.

**Archivo:** `src/shared/ui/Sidebar/Sidebar.tsx`

```tsx
// Agregar estado de hover
const [hovered, setHovered] = useState(false)
const isExpanded = !collapsed || hovered

return (
  <aside
    className={[
      styles.sidebar,
      collapsed && !hovered ? styles.collapsed : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    onMouseEnter={() => collapsed && setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    aria-label="Navegación principal"
  >
    {brand ? <div className={styles.brand}>{isExpanded ? brand : null}</div> : null}
    <nav className={styles.nav}>
      {items.map((item) => (
        <AppNavLink
          key={item.to}
          to={item.to}
          end={item.end}
          icon={item.icon}
          collapsed={collapsed && !hovered}   // ← mostrar labels en hover
        >
          {item.label}
        </AppNavLink>
      ))}
    </nav>
    {footer ? <div className={styles.footer}>{footer}</div> : null}
    {onToggleCollapse ? (
      <button ... onClick={onToggleCollapse}>
        {collapsed ? '›' : '‹'}
      </button>
    ) : null}
  </aside>
)
```

**Archivo:** `src/shared/ui/Sidebar/Sidebar.module.scss`

Para que el hover no cause layout shift (reflow del mainColumn), la sidebar expandida en hover debe ser `position: absolute` o usar `position: fixed` con z-index. La opción más limpia es `position: fixed` o que el sidebar use `position: absolute` dentro del flex y el mainColumn tenga `margin-left` fijo:

```scss
// Opción: overlay flyout (no empuja el contenido)
.sidebar {
  /* ... estilos base ... */
  transition: width 0.2s ease;
  overflow: hidden;
}

// Cuando hovered en estado colapsado, expandir con overlay
// Requiere que el sidebar tenga position: fixed o absolute y z-index alto
// Evaluar según el diseño final.
```

**Advertencia:** Si se implementa el flyout como overlay (no empuja contenido), asegurarse de que el z-index del sidebar (sugerido: `250`) sea mayor que el del topbar (`z-index: 200`) para que el flyout quede encima.

---

## Orden de implementación recomendado

Implementar en este orden para minimizar regresiones:

1. **Mejora 2** primero — quitar `max-width` y reducir padding del `.main`. Es un cambio puro de CSS, sin lógica, y desbloquea espacio en todas las páginas inmediatamente. Verificar visualmente cada ruta principal.

2. **Mejora 1** — convertir sidebar a icon rail colapsada por defecto. Afecta `AppLayout.tsx`, `Sidebar.tsx`, `Sidebar.module.scss`, `AppNavLink.tsx`, `AppNavLink.module.scss`.

3. **Mejora 3** — slim topbar + mover user area al sidebar footer. Depende de que la Mejora 1 ya esté lista (el footer del sidebar debe existir).

4. **Mejora 4** — ya incluida en Mejora 2, no requiere paso adicional.

5. **Mejora 5** — flyout on hover, implementar al final una vez que el icon rail esté estable.

---

## Criterios de aceptación

### Mejora 1
- [ ] La sidebar inicia colapsada (44px) al cargar la app por primera vez
- [ ] Al hacer hover sobre un item colapsado, aparece un tooltip con el label a la derecha del icono
- [ ] El toggle «/» expande la sidebar a 14rem y persiste la preferencia en `localStorage`
- [ ] Al recargar la página, se respeta la preferencia guardada
- [ ] En mobile (< 1024px), el comportamiento es idéntico al actual (Drawer)
- [ ] Los items activos mantienen su estilo visual (color primario + background tenue)

### Mejora 2
- [ ] El contenido de todas las rutas ocupa el 100% del ancho disponible tras la sidebar
- [ ] No hay márgenes automáticos a los lados del contenido
- [ ] Las páginas que necesitan ancho máximo (ej: formularios) implementan su propio `max-width` local
- [ ] La clase `.fullWidthPage` sigue funcionando (padding 0, overflow hidden)

### Mejora 3
- [ ] La topbar tiene altura reducida (~40px en desktop)
- [ ] El email del usuario aparece en el footer del sidebar (visible cuando expandido)
- [ ] El botón de logout está en el footer del sidebar
- [ ] En mobile, el comportamiento del Drawer no cambia
- [ ] La Topbar en desktop solo muestra breadcrumbs/título + acciones contextuales + ThemeToggle

### General
- [ ] No hay regresiones visuales en ninguna de las rutas: `/app/today`, `/app/activities`, `/app/todos`, `/app/habits/my-day`, `/app/weekly-routine`, `/app/quarters`
- [ ] El tema claro y oscuro funcionan correctamente en todos los componentes modificados
- [ ] No hay errores de TypeScript ni de consola

---

## Variables CSS relevantes

```scss
// src/app/styles/tokens/_spacing.scss
$spacing-sm:  0.5rem;   // 8px
$spacing-md:  1rem;     // 16px
$spacing-lg:  2rem;     // 32px
$spacing-xl:  2.5rem;   // 40px

// src/app/styles/tokens/_breakpoints.scss
$breakpoint-lg: 1024px   // punto donde sidebar aparece

// src/app/styles/_variables.scss
$layout-max-width: 1400px   // esta variable queda en desuso tras Mejora 2

// CSS custom properties relevantes (definidas en _theme-variables.scss)
--color-border
--color-surface
--color-primary
--color-text
--color-text-secondary
--color-text-muted
--radius-md
--spacing-sm
--spacing-md
--spacing-lg
--blur-md
--shadow-sm
```
