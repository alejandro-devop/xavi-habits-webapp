# Spec — Fase 0+1: Cimientos Aura y pantalla de login

> **Estado:** lista para construir
> **Depende de:** nada

## Objetivo

La pantalla de login deja de ser una tarjeta de 400px centrada sobre un degradado azul y pasa a ser un umbral en dos partes —atmósfera y marca a la izquierda, formulario a la derecha— construido con el lenguaje visual "Aura" (glassmorphism orgánico, mint + violeta, píldoras). De paso queda instalada la infraestructura de tokens que usarán todos los módulos siguientes, sin alterar el aspecto del resto de la app.

**Referencia visual aprobada por el usuario:** `docs/remodel/assets/01-login-aura.html` — ábrela en el navegador antes de escribir una línea. Es la fuente de verdad del layout, los estados y las medidas.

## Fuera de alcance

- **El resto de la app.** Ni hábitos, ni todos, ni notas, ni el `AppLayout`. Su aspecto no cambia en absoluto con esta spec.
- **Las otras 4 pantallas de auth** (registro, recuperar/restablecer contraseña, verificar email). Heredan el chasis nuevo de `AuthLayout` + `AuthForm` porque lo comparten, y eso está bien: deben quedar coherentes y sin romperse. Pero no hay ajuste fino de su contenido en esta fase.
- **Lógica, validación y API.** `useLoginMutation`, `validateEmail`, `getAuthErrorMessage`, el mensaje heredado de `location.state`, los guards de ruta: intocables. Esto es re-skin.
- **Sustituir los tokens globales.** `--color-primary` a nivel `:root` sigue siendo azul Apple. Ver "Tokens".

## Pantallas y rutas

| Ruta | Página | Qué cambia |
|------|--------|------------|
| `/auth/login` | `src/pages/auth/LoginPage/LoginPage.tsx` | Nada en el archivo (sigue siendo una línea). El rediseño ocurre en `AuthLayout`, `AuthForm` y `LoginForm` |
| `/auth/*` (resto) | — | Heredan chasis y tokens; no se rediseñan |
| `/app/testing-hall` | `src/pages/app/TestingHallPage` | Se añade la demo del componente nuevo `AuroraCanvas` |

## Diseño

### Layout

**Escritorio (≥900px).** Lienzo aurora a pantalla completa. Encima, una sola tarjeta de vidrio de máx. 880px partida en dos columnas `0.85fr 1fr`:

- **Izquierda (`brandside`):** lockup del anillo Aura + "Xavi", claim en dos líneas ("Vuelve a tu ritmo, **sin ruido**" — la segunda línea en `--color-primary`), subtítulo, y al fondo tres píldoras de vidrio con emoji (🌿 rachas que no castigan un mal día · 🫧 sesiones de foco y respiración · ✨ un resumen diario, no un tablero). Separada de la derecha por un borde especular de 1px.
- **Derecha (`formside`):** título, subtítulo, alertas, los dos campos, enlace de recuperación alineado a la derecha, CTA píldora a todo el ancho, y pie con el enlace a registro.

**Móvil (<900px).** Una sola columna: lockup + claim compactos arriba (las tres píldoras se ocultan, `display:none`), formulario debajo. La cabecera `<header>` actual de `AuthLayout` con el "Xavi" suelto desaparece: la marca ahora vive dentro de la tarjeta.

### Lienzo aurora

Tres orbes circulares difuminados, `position:fixed`, `inset:0`, `pointer-events:none`, detrás del contenido:

| Orbe | Tamaño | Posición | Claro | Oscuro |
|---|---|---|---|---|
| 1 | 55vw | `top:-18% left:-10%` | `rgba(78,222,163,.42)` | `rgba(16,185,129,.24)` |
| 2 | 50vw | `top:10% right:-14%` | `rgba(210,187,255,.45)` | `rgba(124,58,237,.30)` |
| 3 | 60vw | `bottom:-26% left:18%` | `rgba(224,242,254,.85)` | `rgba(30,58,95,.75)` |

`filter: blur(110px)` (orbe 2 y 3 admiten hasta 140px). Son decorativos: `aria-hidden="true"`.

### Tokens — el mecanismo central de esta fase

**No sobrescribas los tokens de `:root`.** El resto de la app sigue en azul Apple hasta que su módulo se migre. En su lugar, introduce un **ámbito de design system** en `src/app/styles/_theme-variables.scss`:

```scss
[data-ds='aura'] { /* re-mapea los tokens semánticos existentes a valores Aura */ }
[data-theme='dark'] [data-ds='aura'] { /* la variante oscura del mismo ámbito */ }
```

`AuthLayout` pone `data-ds="aura"` en su nodo raíz y, a partir de ahí, **los componentes de `shared/ui` que ya consumen `var(--*)` (Button, Input, FormField, Alert) se renderizan en Aura sin tocar su código**. Ese es el objetivo: cero duplicación, cero impacto fuera del subárbol, y en la fase final el atributo sube a `<html>` y se borra el ámbito.

Valores del ámbito claro (los oscuros salen de la maqueta, sección 2 derecha):

| Token | Valor Aura claro |
|---|---|
| `--color-primary` | `#006c49` (texto y enlaces; **no** `#10b981`, que no pasa AA sobre vidrio claro) |
| `--color-primary-hover` | `#00553a` |
| `--color-bg` | `#fafcfb` |
| `--color-text` / `--color-text-secondary` | `#0f172a` / `#475569` |
| `--color-glass` | `rgba(255,255,255,.78)` |
| `--color-glass-border` | `rgba(255,255,255,.72)` |
| `--color-border` | `rgba(255,255,255,.7)` |
| `--shadow-glass` | `0 16px 48px -8px rgba(100,116,139,.14), inset 0 1px 1px rgba(255,255,255,.9)` |
| `--blur-md` | `32px` |
| `--radius-md` / `--radius-xl` | `16px` / `32px` |
| `--color-focus-ring` | `rgba(124,58,237,.45)` |
| `--font-family` | `'Plus Jakarta Sans', system-ui, sans-serif` |

Tokens nuevos (no existen hoy), definidos en el mismo ámbito:

- `--aura-cta-bg: linear-gradient(135deg, #10b981, #059669)`
- `--aura-cta-glow: 0 8px 24px -4px rgba(16,185,129,.42)`
- `--aura-well-bg: rgba(255,255,255,.45)`
- `--aura-well-inset: inset 0 2px 4px rgba(15,23,42,.03)`
- `--aura-glass-1: rgba(255,255,255,.55)` (vidrio nivel 1, para las píldoras del panel)
- `--font-label: 'Inter', system-ui, sans-serif` (etiquetas, enlaces y CTA; con `font-feature-settings: 'tnum'`)

**Botón con degradado sin variante nueva.** En `src/shared/ui/Button/Button.module.scss`, cambia el fondo de `.primary` a `background: var(--button-primary-bg, var(--color-primary))` y define `--button-primary-bg: var(--aura-cta-bg)` dentro del ámbito Aura. Fuera del ámbito el fallback deja el botón exactamente como está hoy. Mismo patrón para la sombra si hace falta. **No crees `variant="aura"` ni un botón nativo estilizado a mano.**

### Componentes

- **Reutilizar:** `Button` (`fullWidth`, `isLoading`), `FormField`, `Input`, `Alert`, y `Stack`/`Inline` de `@/shared/layout` donde encajen.
- **Nuevo en `src/shared/ui/AuroraCanvas/`:** `AuroraCanvas.tsx` + `.module.scss` + export en el barrel + demo en la sección Foundations del Testing Hall + test mínimo (que renderiza y es `aria-hidden`). Lo reutilizarán todos los módulos siguientes.
- **Nuevo, local a auth:** el lockup del anillo (SVG en `src/layouts/AuthLayout/`, degradado mint→violeta, `aria-hidden`, con el texto "Xavi" al lado).

### Iconos de campo

Los dos campos llevan icono a la izquierda, **SVG en línea, no emoji**: sobre trazo 1.5px para el correo, candado trazo 1.5px para la contraseña, ambos `currentColor` al 50% de opacidad, 17px, `aria-hidden`. Los emojis **sí** se mantienen en las tres píldoras del panel izquierdo y en las alertas. Si `FormField`/`Input` no admiten hoy un adorno a la izquierda, añádeselo como prop opcional (`leftIcon`, igual que ya hace `Button`) en vez de envolverlo por fuera.

### Movimiento

Entrada de la tarjeta: fundido + subida de 8px, con `framer-motion` (ya es dependencia). Hover del CTA: elevación de 2px y resplandor mint más intenso. Todo pasa por `useReducedMotionPreference` (`src/shared/motion/`), que ya existe: con movimiento reducido, sin desplazamiento ni animación de entrada.

### Fuentes

Añade a `index.html`, con el mismo patrón que ya usa Caveat:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

## Datos

Ninguno nuevo. El login sigue en REST vía `useLoginMutation` → `auth.api.ts` (`/api/auth/*`). Sin queries GraphQL, sin query keys nuevas, sin cambios en `auth.store.ts`.

## Criterios de aceptación

- [ ] `/auth/login` muestra el lienzo aurora y la tarjeta partida en dos, fiel a `docs/remodel/assets/01-login-aura.html`
- [ ] A ~375px la tarjeta colapsa a una columna, las tres píldoras del panel se ocultan y nada desborda horizontalmente
- [ ] Ningún token de `:root` cambia de valor: `/app/today`, `/app/habits` y `/app/todos` se ven exactamente igual que antes del cambio
- [ ] `Button`, `Input`, `FormField` y `Alert` se renderizan en Aura dentro de `/auth/*` y sin cambios fuera, sin haber duplicado sus estilos
- [ ] El CTA "Entrar" es una píldora con degradado mint y muestra el spinner de `isLoading` mientras `loginMutation.isPending`
- [ ] Error de credenciales (Alert), error de campo y mensaje de éxito de `location.state` se ven como en la maqueta
- [ ] El foco de teclado es visible sobre vidrio en los dos campos, el CTA y los tres enlaces; el recorrido con Tab es correcto
- [ ] Los iconos de correo y contraseña son SVG, `aria-hidden`, y no se anuncian con lector de pantalla
- [ ] `AuroraCanvas` existe en `shared/ui`, está exportado en el barrel y tiene demo en el Testing Hall
- [ ] Registro, recuperar contraseña, restablecer y verificar email siguen funcionando y se ven coherentes con el chasis nuevo
- [ ] Funciona en tema claro y oscuro
- [ ] Con `prefers-reduced-motion`, no hay animación de entrada ni desplazamiento
- [ ] `LoginForm.test.tsx` sigue pasando

## Notas para el constructor

- **Empieza abriendo la maqueta**, no el código: `docs/remodel/assets/01-login-aura.html`. Las medidas, colores y estados salen de ahí.
- `src/features/auth/styles/_auth-form.scss` usa variables Sass de compilación (`$color-primary`, `$color-border`, `$radius-md`). **Migra esos usos a `var(--*)`** o el ámbito `[data-ds='aura']` no tendrá ningún efecto sobre ellos. Es la trampa principal de esta spec.
- El `.card` de `AuthLayout.module.scss` usa el mixin `glass-panel`, que ya lee `var(--color-glass)`, `var(--blur-md)` y `var(--radius-xl)`: encaja con el ámbito sin tocarlo. Mantén su fallback `@supports not (backdrop-filter)`.
- `$auth-form-max-width: 400px` deja de aplicar a la tarjeta partida (880px). No borres la variable, que la usan otras pantallas de auth; deja de usarla solo donde toca.
- El `<header>` con el enlace "Xavi" desaparece de `AuthLayout`. Comprueba que ninguna otra pantalla de auth dependía de él para volver al inicio; si lo necesita, el lockup dentro de la tarjeta puede seguir siendo un `Link` a `authPaths.home`.
- Tres orbes con `blur(110px)` a pantalla completa cuestan pintado. Ponlos en su propia capa (`will-change: transform` o un `transform: translateZ(0)`) y confirma que el scroll de las pantallas de auth largas (registro) no va a tirones.
- Recuerda: el ámbito oscuro es `[data-theme='dark'] [data-ds='aura']`, en ese orden — el tema vive en `<html>` y el ámbito en el subárbol de auth.
- Al terminar, `graphify update .`
