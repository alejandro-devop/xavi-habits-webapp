# Guía del Design System para agentes (Cursor / IA)

Documento de referencia para **construir interfaces** en `xavi-habits-web`. Objetivo: reutilizar componentes existentes y solo proponer componentes nuevos cuando no haya alternativa razonable.

**Catálogo visual en vivo:** `/app/testinghall` (requiere sesión + email verificado).  
**Documentación técnica:** `docs/design-system.md`.

---

## Flujo de trabajo del agente

```
Petición de UI
    │
    ▼
¿Existe componente en shared/ui o shared/layout?
    │
    ├─ SÍ → Importar desde barrel, componer, usar tokens CSS
    │
    └─ NO → ¿Se puede componer con 2–3 componentes existentes?
              │
              ├─ SÍ → Componer (ej. Card + Stack + Button)
              │
              └─ NO → Proponer nuevo componente en shared/ui/
                      + SCSS module + export + demo Testing Hall + test mínimo
```

**Nunca** (salvo petición explícita del usuario):

- Añadir Tailwind, shadcn/ui, MUI, Chakra, styled-components
- Duplicar estilos de botones/inputs con HTML nativo estilizado a mano
- Ignorar tema light/dark (`var(--*)`)

---

## Inventario de componentes

### `@/shared/ui` — import único

```tsx
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  DataCard,
  Divider,
  EmptyState,
  FormField,
  GlassPanel,
  Input,
  Modal,
  PageHeader,
  Section,
  Select,
  Skeleton,
  SkeletonText,
  Spinner,
  StatCard,
  Switch,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  Textarea,
  ThemeToggle,
  AppIcon,
  SearchSelect,
  IconPicker,
  useToast,
  useConfirmDialog,
  Drawer,
  Popover,
  Tooltip,
  Sidebar,
  Topbar,
  Breadcrumbs,
  AppNavLink,
  CommandPaletteProvider,
  useCommandPalette,
} from '@/shared/ui'
```

### Iconos

```tsx
import { appIcons, normalizeIconName, type AppIconName } from '@/shared/icons'
import { AppIcon } from '@/shared/ui'
```

### `@/shared/layout`

```tsx
import { Container, Grid, GridItem, Stack, Inline } from '@/shared/layout'
```

### Motion

```tsx
import { fadeUp, staggerContainer, useReducedMotionPreference } from '@/shared/motion'
```

### Tema

```tsx
import { useTheme, ThemeProvider } from '@/features/theme'
```

---

## Matriz de decisión: necesidad → componente

### Acciones y navegación

| Necesidad del diseño | Componente | Notas |
|---------------------|------------|-------|
| Acción principal | `Button variant="primary"` | `isLoading`, `fullWidth`, iconos |
| Acción secundaria | `Button variant="secondary"` | |
| Acción discreta / toolbar | `Button variant="ghost"` | |
| Destructiva (eliminar) | `Button variant="danger"` | |
| Enlace que parece botón | `Button to="/ruta"` | React Router |
| Enlace en texto | `<Link>` + estilos globales | No reinventar botón |
| Cambiar tema | `ThemeToggle` | |

### Formularios

| Necesidad | Componente | No usar |
|-----------|------------|---------|
| Label + input texto | `FormField` | `<label>` + `<input>` sueltos |
| Input con icono/error | `Input` dentro de `FormField` o `children` | |
| Párrafo largo | `Textarea` (`showCount`, `maxLength`) | |
| Lista desplegable corta | `Select` (nativo estilizado) | |
| Lista larga / búsqueda | `SearchSelect` | `Select` con 50+ opciones |
| Elegir icono en formulario | `IconPicker` | texto libre / emojis |
| Mostrar icono por nombre guardado | `AppIcon` | FontAwesome directo en features |
| Aceptar términos / booleano | `Checkbox` | |
| Activar/desactivar setting | `Switch` | `Checkbox` para settings tipo iOS |
| Solo mensaje de error global | `Alert variant="danger"` | |

### Feedback y estados

| Necesidad | Componente |
|-----------|------------|
| Info / éxito / aviso / error inline | `Alert` (`info`, `success`, `warning`, `danger`) |
| Notificación temporal global | `useToast()` → `toast.success()` etc. | `Alert` fijo en layout |
| Confirmar acción destructiva | `useConfirmDialog().confirm()` | `window.confirm` |
| Carga en botón | `Button isLoading` |
| Carga inline | `Spinner` |
| Carga de página/sección | `Skeleton`, `SkeletonText` |
| Lista o tabla vacía | `EmptyState` (+ `action` con `Button`) |
| Estado en fila/celda | `Badge` |

### Superficies y contenido

| Necesidad | Componente | Alternativa incorrecta |
|-----------|------------|------------------------|
| Tarjeta genérica | `Card` | `div` con border custom |
| Panel auth / glass | `GlassPanel` | `Card` con blur manual |
| Métrica con tendencia + icono | `DataCard` | `Card` + texto suelto |
| Número simple + delta | `StatCard` | `DataCard` sobrecargado |
| Separador de sección | `Divider` (`label` opcional) | `<hr>` sin estilo |
| Título de página + acciones | `PageHeader` | `<h1>` suelto |
| Bloque en docs / Testing Hall | `Section` | |

### Datos tabulares

| Necesidad | Componente |
|-----------|------------|
| Tabla de datos | `Table` + `TableHeader` + `TableBody` + `TableRow` + `TableHead` + `TableCell` |
| Columna de acciones | `TableCell align="end"` + `Button size="sm"` |
| Tabla cargando | `Table isLoading` |
| Tabla sin filas | `Table empty={<EmptyState ... />}` |
| Ordenación (futuro) | `TableHead sortable` (API preparada, sin lógica aún) |

### Overlays y navegación por pestañas

| Necesidad | Componente |
|-----------|------------|
| Diálogo confirmación / formulario modal | `Modal` |
| Panel lateral / sheet móvil | `Drawer` (`left` / `right` / `bottom`) |
| Menú contextual anclado | `Popover` |
| Ayuda breve en icono | `Tooltip` |
| Varias vistas mismo contexto | `Tabs` + `Tabs.List` + `Tabs.Tab` + `Tabs.Panel` |
| Nav lateral app | `Sidebar` + `AppNavLink` |
| Barra superior app | `Topbar` + `Breadcrumbs` |
| Atajos / ir a… | `CommandPalette` (`⌘K` / `Ctrl+K`) |

### Layout de página

| Necesidad | Componente |
|-----------|------------|
| Limitar ancho contenido | `Container size="lg"` |
| Dashboard / cards en rejilla | `Grid columns={12}` + `GridItem span md lg` |
| Formulario vertical | `Stack gap="md"` |
| Toolbar horizontal | `Inline gap="sm" wrap` |
| Una columna en móvil, varias en desktop | `GridItem span={12} md={6} lg={4}` |

---

## Cuándo componer vs crear componente nuevo

### Componer (preferido)

Ejemplos válidos sin nuevo componente:

- **Card de hábito:** `Card` + `Stack` + `Badge` + `Button`
- **Formulario de settings:** `Stack` + varios `Switch` / `FormField`
- **Dashboard:** `Grid` + múltiples `DataCard` / `StatCard`
- **Confirmación destructiva:** `Modal` + texto + `Button danger` + `Button ghost`

### Proponer componente nuevo

Solo si se cumple **al menos uno**:

1. El patrón se repetirá en **≥2 features** sin lógica de dominio mezclada.
2. No se puede lograr con composición sin duplicar **>30 líneas** de markup/estilos.
3. Requiere accesibilidad o comportamiento no cubierto (ej. `DatePicker`, `Tooltip`, `Dropdown` custom).

**Plantilla de propuesta al usuario:**

> No existe `[Nombre]` en el Design System.  
> **Opciones:**  
> A) Componer con `[Card + Stack + …]` (rápido, sin ampliar DS)  
> B) Crear `shared/ui/[Nombre]/` (reutilizable, + demo en Testing Hall)  
> Recomiendo [A/B] porque …

### Ubicación según tipo

| Tipo | Carpeta |
|------|---------|
| UI genérica reutilizable | `src/shared/ui/<Name>/` |
| Layout / estructura | `src/shared/layout/<Name>/` |
| Lógica de dominio (hábito, curso) | `src/features/<feature>/components/` — puede **usar** DS, no vivir en `shared/ui` |

---

## Patrones de implementación

### Página típica

```tsx
import { Container } from '@/shared/layout'
import { PageHeader, Stack, Card, Button } from '@/shared/ui'

export function ExamplePage() {
  return (
    <Container size="lg" padding="lg">
      <PageHeader title="Título" subtitle="Descripción" actions={<Button>Acción</Button>} />
      <Stack gap="lg">
        <Card padding="md">{/* contenido */}</Card>
      </Stack>
    </Container>
  )
}
```

### Formulario

```tsx
import { Stack, FormField, Button, Alert } from '@/shared/ui'

<Stack gap="md" as="form" onSubmit={handleSubmit}>
  <FormField id="email" label="Email" type="email" error={errors.email} />
  <Button type="submit" fullWidth isLoading={pending}>Guardar</Button>
</Stack>
```

### Animaciones

- Usar variantes de `@/shared/motion`.
- Siempre `useReducedMotionPreference()` o `whileInView` en listas (no solo `animate` al montar página larga).
- Microinteracciones: `Button` ya integra motion; no añadir framer a todo.

```tsx
const reduce = useReducedMotionPreference()

<motion.div
  variants={reduce ? undefined : fadeUp}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.3 }}
/>
```

### Estilos en páginas/features

- **Preferir** componentes DS sin clases custom.
- Si hace falta SCSS local: solo layout posicional; colores vía `var(--color-text)`, etc.
- Breakpoints: `@use '@/app/styles/mixins/breakpoints' as *;` + `@include md { }`

---

## Checklist antes de entregar UI

- [ ] ¿Importé desde `@/shared/ui` / `@/shared/layout`?
- [ ] ¿Evité `<button>` / `<input>` nativos para lo ya cubierto?
- [ ] ¿Colores y radios usan variables CSS (tema dark OK)?
- [ ] ¿Form controls tienen `id`, `label`, `error` accesibles?
- [ ] ¿Loading/disabled/empty states contemplados?
- [ ] ¿Animaciones respetan reduced motion?
- [ ] Si añadí patrón nuevo reusable → ¿lo documenté y lo mostré en Testing Hall?

---

## Referencia rápida de APIs

### Button

`variant`: `primary` | `secondary` | `ghost` | `danger`  
`size`: `sm` | `md` | `lg`  
`isLoading`, `fullWidth`, `leftIcon`, `rightIcon`, `to?`

### Switch / Checkbox

- **Switch:** settings on/off (iOS pill).
- **Checkbox:** consentimiento, multi-select booleano en forms.

### Card vs GlassPanel vs DataCard vs StatCard

| | Card | GlassPanel | DataCard | StatCard |
|---|------|------------|----------|----------|
| Uso | Contenido general | Auth, overlays sutiles | KPI con trend | Métrica simple |
| Variants | padding | padding | default/glass/success/warning/danger | skeleton/loading |

### Grid responsive

```tsx
<Grid columns={12} gap="md">
  <GridItem span={12} md={6} lg={4}>...</GridItem>
</Grid>
```

---

## Archivos clave del sistema

| Recurso | Ruta |
|---------|------|
| Componentes UI | `src/shared/ui/` |
| Layout | `src/shared/layout/` |
| Tokens Sass | `src/app/styles/tokens/` |
| Variables tema CSS | `src/app/styles/_theme-variables.scss` |
| Motion | `src/shared/motion/` |
| Tema app | `src/features/theme/` |
| Laboratorio visual | `src/pages/app/TestingHallPage/` |
| Convenciones proyecto | `docs/project-conventions.md` |

---

## Actualizar esta guía

Al añadir un componente al Design System:

1. Export en `src/shared/ui/index.ts` (o `shared/layout/index.ts`).
2. Sección en `docs/design-system.md`.
3. Entrada en la **matriz de decisión** de este archivo.
4. Demo en `TestingHallPage/sections/`.
5. Línea en `.cursor/rules/design-system.mdc` (tabla mapa rápido) si es muy usado.
