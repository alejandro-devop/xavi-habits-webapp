# Design System — Xavi Habits Web

> **Para agentes / Cursor:** usa primero `docs/design-system-agent-guide.md` y la regla `.cursor/rules/design-system.mdc`.  
> Catálogo visual: `/app/testinghall`.

## Principios visuales

- **Minimalista y limpio**, inspirado en la estética Apple: mucho espacio en blanco, tipografía clara, jerarquía sutil.
- **Glassmorphism controlado**: transparencia y blur solo donde aportan (paneles auth, `GlassPanel`), sin abusar.
- **Animaciones sutiles**: microinteracciones con Framer Motion; siempre respetar `prefers-reduced-motion`.
- **Accesible por defecto**: foco visible, labels, errores con texto e iconos, contraste razonable.

## Tokens

Los tokens Sass viven en `src/app/styles/tokens/`:

| Archivo | Contenido |
|---------|-----------|
| `_colors.scss` | Paleta primitiva y semántica |
| `_spacing.scss` | Escala de espaciado (incl. `xs`, `xl`) |
| `_radius.scss` | Border radius |
| `_shadows.scss` | Sombras |
| `_blur.scss` | Blur para glass |
| `_typography.scss` | Fuentes, tamaños, pesos |
| `_motion.scss` | Duraciones y easing |
| `_z-index.scss` | Capas |
| `_breakpoints.scss` | `480 / 768 / 1024 / 1280` px |

Mixins responsive: `src/app/styles/mixins/` (`sm`, `md`, `lg`, `xl`).

Las **variables CSS** se definen en `src/app/styles/_theme-variables.scss` y cambian con `[data-theme='dark']`.

## Tema (light / dark / system)

- Feature: `src/features/theme/`
- Hook: `useTheme()` → `{ preference, resolvedTheme, setPreference, cyclePreference }`
- UI: `<ThemeToggle />`

## Componentes UI (`src/shared/ui/`)

### Acciones y feedback

| Componente | Uso |
|------------|-----|
| `Button` | Acciones; variantes `primary`, `secondary`, `ghost`, `danger`; `to` para Router |
| `Alert` | Mensajes `info`, `success`, `warning`, `danger` |
| `Badge` | Etiquetas de estado |
| `Spinner` | Loading inline |
| `Skeleton` / `SkeletonText` | Placeholders |
| `EmptyState` | Listas/tablas sin datos |

### Formularios

| Componente | Uso |
|------------|-----|
| `Input` | Campo base |
| `FormField` | Label + Input + helper/error |
| `Textarea` | Área de texto + contador opcional |
| `Select` | `<select>` nativo estilizado (listas cortas) |
| `SearchSelect` | Combobox con búsqueda local (listas largas) |
| `IconPicker` | Selector de icono vía modal |
| `Checkbox` | Casillas de verificación |
| `Switch` | Toggle on/off (`role="switch"`) |

### Superficies

| Componente | Cuándo usarlo |
|------------|----------------|
| `Card` | Contenido general, formularios, bloques opacos |
| `GlassPanel` | Paneles flotantes, auth shell, énfasis glass |
| `DataCard` | Dashboards con valor, trend e icono |
| `StatCard` | Métrica simple (label + value + delta) |

### Datos y navegación

| Componente | Uso |
|------------|-----|
| `Table` + subcomponentes | Tablas semánticas, scroll horizontal, empty/loading |
| `Tabs` | Pestañas controladas + teclado ← → |
| `Modal` | Diálogos (portal, ESC, focus trap básico) |
| `Drawer` | Panel lateral/inferior (sheet) |
| `Popover` | Contenido anclado a un trigger |
| `Tooltip` | Ayuda contextual hover/focus |
| `Toast` + `useToast` | Notificaciones globales (requiere `ToastProvider`) |
| `ConfirmDialog` + `useConfirmDialog` | Confirmación destructiva (Promise) |
| `Divider` | Separador horizontal/vertical con label opcional |

### Iconos (`src/shared/icons/`)

| Pieza | Uso |
|-------|-----|
| `app-icons.ts` | Catálogo cerrado de iconos permitidos |
| `icon-utils.ts` | `normalizeIconName`, `getIconByName`, `toStoredIconName` |
| `AppIcon` | Render por nombre almacenado |

**Regla de persistencia:** guardar solo el nombre limpio (`bell`, `home`, `calendar`). Nunca `fa-bell` ni `faBell`.

### Shell de aplicación

| Componente | Uso |
|------------|-----|
| `Sidebar` | Navegación lateral (colapsable en desktop) |
| `Topbar` | Barra superior con breadcrumbs/acciones |
| `Breadcrumbs` | Migas de pan |
| `AppNavLink` | Enlace de nav con icono y estado activo |
| `CommandPalette` | Paleta Spotlight (`⌘K` / `Ctrl+K`) |

### Layout de página

| Componente | Uso |
|------------|-----|
| `PageHeader` | Título de página + acciones |
| `Section` | Bloques documentados (Testing Hall) |
| `ThemeToggle` | Tema light / dark / system |

```tsx
import { AppIcon, Button, DataCard, Modal, SearchSelect, useToast } from '@/shared/ui'
```

## Layout system (`src/shared/layout/`)

| Componente | Cuándo usarlo |
|------------|----------------|
| `Container` | Ancho máximo de página (`sm`–`xl`) |
| `Grid` + `GridItem` | Layout 12 columnas responsive (`span`, `sm`, `md`, `lg`, `xl`) |
| `Stack` | Apilar elementos en vertical |
| `Inline` | Fila horizontal con wrap opcional |

```tsx
import { Container, Grid, GridItem, Stack, Inline } from '@/shared/layout'

<Grid columns={12} gap="md">
  <GridItem span={12} md={6} lg={4}>
    <DataCard title="Hábitos" value="12" />
  </GridItem>
</Grid>
```

### Grid API

**Grid:** `columns`, `gap`, `align`, `justify`  
**GridItem:** `span`, `sm`, `md`, `lg`, `xl` (column spans por breakpoint)

## Motion (`src/shared/motion/`)

Variantes: `fadeIn`, `fadeUp`, `scaleIn`, `pageTransition`, `staggerContainer`, `staggerItem`.

## Testing Hall

Ruta: **`/app/testinghall`** (protegida, cuenta verificada).

Secciones:

1. Foundations — colores, tipografía, spacing, radius, shadows, blur  
2. Buttons  
3. Forms — Input, Textarea, Select, Checkbox, Switch, FormField  
4. Advanced Forms — SearchSelect, IconPicker, AppIcon  
5. Icons — catálogo y normalización `faBell → bell`  
6. Feedback — Alert, Toast, ConfirmDialog, Spinner, Skeleton, EmptyState  
7. Surfaces — Card, GlassPanel, DataCard, StatCard  
8. Data display — Table, Badge  
9. Overlay — Modal, Drawer, Popover, Tooltip  
10. Navigation — Sidebar, Topbar, Breadcrumbs, AppNavLink, Tabs  
11. Layout — Container, Grid, Stack, Inline, Divider  
12. Motion  
13. Productivity — CommandPalette (`⌘K` / `Ctrl+K`)  

Nav sticky con anclas `#foundations`, `#buttons`, etc.

## Reglas para nuevos componentes

1. Carpeta en `shared/ui/<Name>/` o `shared/layout/<Name>/`
2. Solo variables CSS `var(--*)` en modules
3. Export en barrel `index.ts`
4. Ejemplo en Testing Hall
5. Test mínimo si hay interacción o a11y crítica

## Font Awesome (solo free solid)

Dependencias: `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`.

- Importar iconos **solo** en `src/shared/icons/app-icons.ts` (uno a uno).
- En UI usar `<AppIcon name="bell" />`, no `<FontAwesomeIcon>` directo en features.
- Añadir icono nuevo: entrada en `appIcons` + keywords + demo en Testing Hall `#icons`.

## Providers globales

En `AppProviders`: `ToastProvider`, `ConfirmDialogProvider`.

En `AppLayout`: `CommandPaletteProvider` con acciones de `app-nav.config.ts`.

```tsx
const toast = useToast()
toast.success('Guardado')

const { confirm } = useConfirmDialog()
const ok = await confirm({ title: '¿Eliminar?', variant: 'danger', onConfirm: async () => { ... } })
```

## Accesibilidad

- Form controls: `aria-invalid`, `aria-describedby`, errores con `role="alert"`
- `Switch`: `role="switch"`, `aria-checked`
- `SearchSelect`: `combobox` + `listbox` + teclado ↑↓ Enter Esc
- `Modal` / `Drawer`: `role="dialog"`, `aria-modal`, ESC, focus trap
- `Toast`: `role="status"` o `role="alert"` según variante
- `Tabs`: `role="tablist/tab/tabpanel"`, teclado flechas
- `Table`: HTML semántico `<table>`, caption opcional
- `prefers-reduced-motion` global + hook

## Scripts

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
