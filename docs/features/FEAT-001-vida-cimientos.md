---
id: FEAT-001
title: Cimientos del módulo Vida — la barra cambia de módulo y Vida existe como cascarón
status: specified
architect: yes    # introduce un módulo nuevo entero: navegación con cambio de módulo (no existe hoy), rutas nuevas, y capas de datos nuevas que no hablan hoy entre sí. Ver razón completa en la sección 1.
area: layouts, app/router, features/vida
requested: 2026-09-19
updated: 2026-09-19
---

# FEAT-001 — Cimientos del módulo Vida

## 1. The request — feature-analyst

**Summary for whoever's next:** F0 del plan `docs/vida/PLAN.md`: la barra única
aprende a tener dos módulos (Hábitos · Vida), `/app/vida` existe con cuatro
secciones vacías (Hoy como índice, Plantilla, Revisión, Actividades), y quedan
escritas — con tests, sin pantalla real todavía — las capas de datos que las
fases siguientes van a consumir. El primer slice es que la píldora de módulo
cambie de Hábitos a Vida y aterrice en el cascarón con sus cuatro secciones.

**What problem it solves:** Hoy la app solo puede vivir un módulo (Hábitos).
El usuario quiere una segunda plantilla — la de su día a día — y antes de que
exista una sola pantalla de Vida hace falta que la app sepa que hay más de un
módulo, y que la nueva parte del código tenga un sitio y un contrato de datos
antes de que alguien construya sobre ella a ciegas.

**Who it's for:** El propio usuario (`alejandro.devop@gmail.com`), único
usuario de la app hoy. Esta fase no la usa nadie todavía como funcionalidad —
la usan las fases F1–F6, que se construyen sobre lo que aquí queda sentado.

**User's words:** «Como siempre me soñé el módulo de actividades y
follow-ups: es más como una plantilla de mi vida, donde planeo día a día lo
que voy a hacer y puedo seguir la plantilla o registrar lo que se sale, y al
final del día evaluar cómo me va. Con el tiempo el sistema entiende y me
ayuda mejor a planear.» (petición original de Vida, en `docs/vida/PLAN.md`;
F0 es su primera fase, ya cortada en el plan — no hay una frase nueva del
usuario específica de F0, y no hace falta pedirla: el plan ya la tiene
descrita literal en su sección «F0 — Cimientos».)

**Out of scope:** (todo lo que alguien podría asumir incluido y NO lo está en F0)
- Cualquier pantalla real de Vida con contenido: planear el día, vivirlo,
  revisarlo, aprender, gestionar la plantilla o el catálogo de actividades.
  Son F1–F6. F0 entrega **títulos sin datos**.
- Ajustes de Vida (hora de inicio/fin del día, categorías con icono real,
  etc.) — no hay pantalla de ajustes de Vida en F0.
- Cualquier llamada real a la API desde las pantallas de Vida: las capas de
  datos existen y tienen tests contra el esquema, pero ninguna pantalla las
  invoca todavía (eso es F1 en adelante).
- Enlazar entrenamiento, tareas o standup — descartado explícitamente en el
  plan, no entra en ninguna fase por ahora.
- `dnd-kit`, tiptap, o cualquier editor enriquecido — el plan los excluye
  para todo Vida, no solo para F0.
- Tocar el backend (`xavi-platform-node`) — solo lectura de su esquema.
- Cambiar el comportamiento de Hábitos, la ficha de usuario, el tema o los
  destinos de hábitos en `⌘K` — F0 solo **añade** módulo y destinos, no
  modifica los existentes.
- Migrar o reutilizar datos del viejo módulo de actividades (`79bece0`) más
  allá de rescatar su código como referencia de contratos y utilidades.

**Acceptance criteria:**
Todo lo que vive detrás de `/app/*` está tras login y ningún agente entra con
credenciales — por eso cada criterio dice si se comprueba con test/arnés o si
queda para el recorrido real del usuario.

- [ ] La píldora de módulo en `AppLayout` muestra «Hábitos · Vida» en
  escritorio y en móvil, con el aspecto de `docs/vida/assets/03-vida-agenda.html`
  y `04-vida-planeado-ejecutado.html`. — *comprobable con test de componente /
  arnés; el aspecto final en pantalla real lo confirma el usuario.*
- [ ] Al elegir «Vida» en la píldora, la navegación cambia a las secciones de
  Vida sin recargar la página; al elegir «Hábitos» vuelve a las suyas. —
  *test de router/harness.*
- [ ] Existen las rutas `/app/vida` (índice = Hoy), `/app/vida/hoy`,
  `/app/vida/plantilla`, `/app/vida/revision`, `/app/vida/actividades`
  (nombres de segmento exactos: decisión del arquitecto, ver hipótesis
  abajo), cada una renderizando **solo un título**, sin llamada a datos. —
  *test de routing.*
- [ ] La ficha de usuario, `⌘K` con los destinos de hábitos existentes, y el
  tema no cambian de comportamiento al cambiar de módulo. — *comparación
  antes/después con test; el uso real lo confirma el usuario.*
- [ ] `⌘K` incluye una acción por cada sección de Vida (Hoy, Plantilla,
  Revisión, Actividades) que navega a su ruta. — *test sobre
  `createCommandActions`.*
- [ ] Las capas de datos rescatadas de `79bece0` (GraphQL, api, hooks, tipos,
  query keys de **actividades, categorías y follow-ups**) existen bajo
  `src/features/vida/` adaptadas al proyecto actual (sin tiptap), y sus
  hooks tienen tests que verifican que las operaciones respetan el esquema
  real (`activity.schema.ts`, y el de categorías/follow-ups en
  `xavi-platform-node`). — *test unitario/contrato, sin sesión.*
- [ ] Las capas de datos **nuevas** de plan del día (`activityDayPlan*`,
  contra `activity-day-plan.schema.ts`) y de Vida (`vidaItems`,
  `vidaSuggestionsForDate`, `vidaTakenToday`, `vidaItem*`,
  `vidaMarkTakenToday`, contra `vida.schema.ts`) existen con tipos, hooks y
  query keys, con tests contra esos esquemas. — *test unitario/contrato, sin
  sesión.*
- [ ] Cada conjunto de query keys expone sus funciones de invalidación
  (p. ej. invalidar `vidaItems` al mutar con `vidaMarkTakenToday`) y existen
  **antes** de que exista ninguna pantalla que las consuma — verificable
  porque los archivos de keys/hooks y sus tests existen y pasan
  independientemente de cualquier página. — *test unitario.*
- [ ] `pnpm typecheck` sigue limpio, `pnpm lint` no añade errores a los 14
  preexistentes, `pnpm test` no añade fallos a los 2 preexistentes
  (`SearchSelect`), y `pnpm build` no rompe. — *comando, línea base en
  `ENVIRONMENT.md`.*
- [ ] Recorrido real (usuario, no automatizable): con sesión iniciada, cambiar
  de Hábitos a Vida desde la píldora, llegar a `/app/vida`, ver las cuatro
  secciones como títulos vacíos, volver a Hábitos y comprobar que sigue
  funcionando igual que antes.

**Slices:**
| # | What it does | State |
|---|---|---|
| 1 | La píldora de módulo gana «Vida»; `/app/vida` y sus 4 rutas existen y renderizan cascarones con título; `⌘K` conoce los destinos de Vida | pending |
| 2 | Capas de datos rescatadas de `79bece0` (actividades, categorías, follow-ups): GraphQL, api, hooks, tipos, query keys — con tests contra el esquema | pending |
| 3 | Capas de datos nuevas (plan del día `activityDayPlan*` y Vida `vidaItems`/`vidaSuggestionsForDate`/`vidaTakenToday`/`vidaItem*`/`vidaMarkTakenToday`): GraphQL, api, hooks, tipos, query keys e invalidaciones — con tests contra el esquema | pending |

El slice 1 es el único con superficie visible; los slices 2 y 3 son
infraestructura de datos, pero cada uno es comprobable de forma independiente
(sus propios tests de contrato) y es exactamente lo que el criterio de cierre
de la fase pide por separado («se navega» vs. «los hooks tienen tests»). No
se cortan más finos porque cada uno ya es la unidad mínima que el plan nombra
como entregable de F0.

**Architect? yes** porque F0 introduce un concepto que no existe hoy en
`AppLayout` (cambio de módulo en la barra única — hoy solo conoce Hábitos),
un árbol de rutas nuevo (`/app/vida/*`) y una capa de datos completa que no
tiene hoy ningún punto de contacto con el resto del código
(`src/features/vida/` no existe). Es exactamente el caso "introduce", no
"cuelga de".

**Decisions that aren't mine:** ninguna pendiente de resolver — el plan
(`docs/vida/PLAN.md`, sección «Decisiones ya tomadas») ya resolvió las que
tocan a esta fase (nombre del módulo, nombre de «Hoy», backend intocable, sin
dnd-kit/tiptap, render antes de construir). No encontré ninguna bifurcación
de producto sin decidir dentro del alcance de F0.

**Hipótesis marcada para el arquitecto** (no es mía, la dejo señalada para
que la resuelva con su path): los segmentos de URL bajo `/app/vida/` — el
patrón vivo de Hábitos usa slugs en inglés con etiqueta en español
(`/app/habits/my-day` → «Mi día»). Sugiero seguir la misma convención
(`/app/vida/today`, `/template`, `/review`, `/activities`) en vez de slugs en
español, por consistencia con `src/features/habits/routes/habits-paths.ts`,
pero la decisión final de nomenclatura de archivos y rutas es del arquitecto.

## 2. The plan — feature-architect

## 3. Construction — feature-builder

## 4. Review — feature-reviewer
