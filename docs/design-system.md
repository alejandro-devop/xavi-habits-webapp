# Design System — Xavi Habits Web

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
| `Select` | `<select>` nativo estilizado |
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
| `Divider` | Separador horizontal/vertical con label opcional |

### Layout de página

| Componente | Uso |
|------------|-----|
| `PageHeader` | Título de página + acciones |
| `Section` | Bloques documentados (Testing Hall) |
| `ThemeToggle` | Tema light / dark / system |

```tsx
import { Button, DataCard, Modal, Tabs } from '@/shared/ui'
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
4. Feedback — Alert, Spinner, Skeleton, EmptyState  
5. Surfaces — Card, GlassPanel, DataCard, StatCard  
6. Data display — Table, Badge  
7. Overlay — Modal  
8. Navigation — Tabs  
9. Layout — Container, Grid, Stack, Inline, Divider  
10. Motion  

Nav sticky con anclas `#foundations`, `#buttons`, etc.

## Reglas para nuevos componentes

1. Carpeta en `shared/ui/<Name>/` o `shared/layout/<Name>/`
2. Solo variables CSS `var(--*)` en modules
3. Export en barrel `index.ts`
4. Ejemplo en Testing Hall
5. Test mínimo si hay interacción o a11y crítica

## Accesibilidad

- Form controls: `aria-invalid`, `aria-describedby`, errores con `role="alert"`
- `Switch`: `role="switch"`, `aria-checked`
- `Modal`: `role="dialog"`, `aria-modal`, ESC, focus trap
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
