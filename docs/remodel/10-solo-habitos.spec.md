# Spec — Fase 11: Una app de hábitos, y nada más

> **Estado:** lista para construir
> **Depende de:** `04-chasis-app.spec.md`, que construyó el lateral y la barra superior que esta spec retira.
> **Render aprobado:** `docs/remodel/assets/10-solo-habitos.html`
> **Pedida por el usuario el 2026-09-18:** «como parte del rediseño quiero dejar esta app solo con lo que le compete, hoy en día hace de todo».

## Objetivo

La app deja de hacer de todo. Se queda con **hábitos**, entrar y salir, los ajustes
de la cuenta y el tema. Desaparecen el lateral y la barra superior, y la barra que
ya tiene el módulo de hábitos pasa a ser **la única barra de la aplicación**.

## Lo que hay hoy y por qué estorba

El lateral guarda las secciones de Hábitos para alimentar la miga de pan
(`app-nav.config.ts`, campo `sections`), y `HabitsModuleLayout` pinta **esas mismas
secciones** como píldoras justo debajo, con la marca «Xavi» repetida. Es la misma
lista dibujada dos veces. Con un solo módulo dentro, el lateral no navega a
ninguna parte: ocupa 186 px y promete once pantallas que van a dejar de existir.

## Las tres decisiones que faltaban, cerradas

1. **`⌘K` se queda, recortado a hábitos.** Está construido y es un acelerador real.
   Lo que cambia es su lista de destinos.
2. **Testing Hall se va**, y el motivo es técnico, no de gusto: sus secciones usan
   `Sidebar`, `Topbar`, `Breadcrumbs`, `MarkdownEditor` y `PaperSurface` — justo lo
   que esta fase borra. Conservarlo obligaría a conservarlo todo.
3. **La portada pública (`/`) no se toca.** Sigue vendiendo una app que hace de
   todo, y eso es cierto y es otra fase.

## Fuera de alcance

- **La portada pública y las pantallas de autenticación.**
- **El aspecto de los ajustes de cuenta.** `features/settings` sobrevive con la
  pinta que tiene; migrarlo a Aura es otra fase.
- **El backend.** Las consultas de los módulos que se van simplemente dejan de
  hacerse. No se toca el esquema.
- **Rediseñar nada de hábitos.** Esta fase quita, no añade.

## Pantallas y rutas

| Ruta | Archivo | Qué cambia |
|------|---------|------------|
| `/app/*` | `src/layouts/AppLayout/AppLayout.tsx` | Se reescribe: absorbe la barra del módulo. Fuera lateral, barra superior y miga de pan. |
| `/app` | `src/app/router/routes.tsx` | Entra a `habitsPaths.myDay`, ya no a `/app/today` |
| `/app/<módulo>` | — | Dejan de existir: caen en `NotFoundPage`, que ya existe |

**El aterrizaje después de entrar cambia en cinco sitios**, no en uno. Todos los
usos de `authPaths.today` pasan a `habitsPaths.myDay`:
`routes.tsx`, `PublicHomeRoute.tsx`, `GuestRoute.tsx`, `useLoginMutation.ts` y
`useVerifyEmailMutation.ts`. Después, `today` y `testingHall` salen de
`auth-paths.ts`. Los tests de `guards.test.tsx` usan `/app/today` como ruta de
ejemplo: actualízalos, no los borres — lo que prueban sigue siendo válido.

## Diseño

### La barra única

`AppLayout` se queda con una sola barra, que es la que hoy pinta
`HabitsModuleLayout`: **marca a la izquierda, píldoras de sección, píldora
«Ajustes» con su menú**, y a la derecha lo poco que vale la pena rescatar de la
barra superior:

- el disparador de `⌘K` como píldora con la tecla dibujada,
- el conmutador de tema,
- **la ficha de usuario como menú**: nombre, «Ajustes de cuenta» (la ruta de
  `features/settings`) y «Cerrar sesión».

**`HabitsModuleLayout` desaparece.** Hábitos ya no es un módulo dentro de una app:
es la app. Su barra y sus estilos se mudan a `AppLayout`. En móvil la barra se
parte en dos alturas —marca y ficha arriba, píldoras debajo con desplazamiento
lateral—, que es lo que ya hace hoy.

**Cuidado con el nombre repetido:** la píldora «Ajustes» son los ajustes *del
módulo* (Categorías, Medidas, Mi Persona). Los de la cuenta se llaman **«Ajustes
de cuenta»** y viven en el menú de la ficha de usuario. No pueden llamarse igual.

**La miga de pan se retira.** Decía en qué módulo estabas cuando había trece. Con
uno, la píldora encendida ya lo dice.

**`AuroraCanvas` se queda** montado una sola vez en `AppLayout`, como ahora.

### `⌘K`, recortado

`createCommandActions` se queda solo con: los seis destinos de hábitos (Mi día,
Mis hábitos, Archivados, Categorías, Medidas, Mi Persona), cambiar tema, ajustes
de cuenta y cerrar sesión. Fuera los nueve destinos de módulos que ya no existen.

### Lo que se borra

**Once módulos.** `features/`: `activities`, `todos`, `weekly-routine`, `notes`,
`learning`, `app-ideas`, `quarters`, `sleep`, `home`. `pages/app/`: `TodayPage`,
`TestingHallPage`. Y con ellos sus rutas, sus barriles y sus tests, incluido
`src/app/router/routes.testinghall.test.tsx`.

**Lo que queda huérfano en `shared/ui`** — comprobado, no supuesto: `Sidebar`,
`Topbar`, `Breadcrumbs`, `MarkdownEditor`, `MarkdownContent`, `PaperSurface`,
`PaperRow`. Todos tienen como únicos consumidores los módulos que se van o el
Testing Hall. Se borran con sus estilos, sus tests y su línea del barril
`shared/ui/index.ts`.

**`HabitPurposeCard` y `HabitPurposeForm`**, huérfanos desde la fase 7. Salen aquí
porque `HabitPurposeCard` es el último consumidor de `@dnd-kit` fuera de
Actividades, y sin él la dependencia se puede quitar.

**Nueve dependencias del `package.json`**, que es donde de verdad baja el bundle:

| Dependencia | Último consumidor |
|---|---|
| `@tiptap/*` (6 paquetes) | `shared/ui/MarkdownEditor` |
| `react-markdown` | `shared/ui/MarkdownContent` |
| `@dnd-kit/core`, `@dnd-kit/utilities` | `activities` y `HabitPurposeCard` |

`framer-motion` y `zustand` **se quedan**: los usa media `shared/ui` y el estado de
hábitos, auth y tema.

## Orden de trabajo — tres tramos que se pueden parar

Esta es la fase más destructiva del rediseño. Va en tres tramos, y **al final de
cada uno el repositorio tiene que estar verde**: typecheck, lint y tests en la
línea base. Si un tramo se tuerce, los anteriores ya valen.

1. **El chasis.** Barra única en `AppLayout`, `HabitsModuleLayout` fuera,
   aterrizaje a Mi día, `⌘K` recortado. Los once módulos **siguen en el
   repositorio**, solo dejan de tener entrada en el menú.
2. **Los módulos.** Fuera sus rutas y sus carpetas. Aquí caen la mayoría de los
   tests que haya que retirar.
3. **La poda.** Lo huérfano de `shared/ui`, los dos componentes de propósito y las
   nueve dependencias. Al acabar, `pnpm build` y **anota el tamaño del bundle
   antes y después** — es el número que justifica el tramo.

## Criterios de aceptación

- [ ] La app tiene **una sola barra**: no hay lateral, ni barra superior, ni miga de pan
- [ ] La barra lleva marca, píldoras de sección, «Ajustes» del módulo, `⌘K`, tema y ficha de usuario
- [ ] La ficha de usuario abre un menú con «Ajustes de cuenta» y «Cerrar sesión»
- [ ] Entrar con usuario y contraseña aterriza en **Mi día**
- [ ] Verificar la cuenta por correo aterriza en **Mi día**
- [ ] Entrar ya estando autenticado (`/`, `/auth/login`) lleva a **Mi día**
- [ ] `/app/today`, `/app/todos`, `/app/notes` y las demás rutas retiradas muestran la página de «no encontrado», no una pantalla en blanco ni un error de consola
- [ ] `⌘K` solo ofrece destinos que existen
- [ ] No queda ningún `import` a los once módulos retirados en todo `src/`
- [ ] `Sidebar`, `Topbar`, `Breadcrumbs`, `MarkdownEditor`, `MarkdownContent`, `PaperSurface` y `PaperRow` ya no existen, ni en el barril
- [ ] `@tiptap/*`, `react-markdown` y `@dnd-kit/*` ya no están en `package.json`
- [ ] `pnpm build` pasa, y el reporte dice el tamaño del bundle antes y después
- [ ] Funciona en tema claro y oscuro
- [ ] Funciona a ~375px: la barra se parte en dos alturas y las píldoras se desplazan
- [ ] typecheck limpio; lint y tests **no peores** que la línea base

## Notas para el constructor

- **Borra de verdad, no comentes ni dejes carpetas vacías.** Git conserva todo:
  si algo hace falta, se recupera de la historia.
- **Los tests que prueben módulos retirados se borran con ellos.** Los que usan
  `/app/today` solo como ruta de ejemplo (`guards.test.tsx`) se **actualizan**.
  Ojo con la diferencia: borrar un test que todavía prueba algo vivo es una
  regresión disfrazada de limpieza.
- `Sidebar.test.tsx` se va con `Sidebar`.
- Después de quitar dependencias, **`pnpm install` para que el lockfile quede al
  día**, y comprueba que el build no las echa de menos por una importación
  perdida en algún sitio.
- La barra del módulo ya resuelve el caso difícil: el menú de «Ajustes» no puede
  vivir dentro del contenedor con `overflow` de las píldoras o queda recortado.
  Está comentado en `HabitsModuleLayout.tsx`; **consérvalo al mudarlo**.
- `features/settings` se queda con su aspecto actual. No lo migres; no es de esta
  fase.
- No añadas dependencias.
- Al terminar, `graphify update .`
