---
id: FEAT-001
title: Cimientos del módulo Vida — la barra cambia de módulo y Vida existe como cascarón
status: planned
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

**Summary for the builder:** La referencia es el módulo de hábitos tal cual
está hoy — `src/features/habits/routes/*` para rutas, `src/features/habits/hooks/useHabits.ts`
+ `src/shared/api/query-keys.ts` para la capa de datos — y el código viejo de
`79bece0` solo como **fuente de contratos** que se copia y se poda, nunca se
restaura. El código nuevo va en `src/features/vida/` (feature-first) y el cambio
de módulo en `src/layouts/AppLayout/`. **No crees** otro cliente GraphQL, otro
guard de sesión, otra fábrica de keys ni una barra de módulo paralela: todo eso
existe.

**What already exists:**
- **La barra y `⌘K`** — `src/layouts/AppLayout/AppLayout.tsx:139-163` pinta las
  píldoras de hábitos a mano; `app-nav.config.ts:10-80` repite los mismos seis
  destinos para `⌘K`. Son dos listas de lo mismo: F0 las funde en una.
- **Rutas por feature** — `src/app/router/routes.tsx:76-81` registra `habitsRoutes`
  y `settingsRoutes` dentro de `VerifyAccountGuard`; `src/features/habits/routes/habits.routes.tsx`
  y `habits-paths.ts` son el molde exacto. `src/features/habits/index.ts` es el
  barril que el router importa.
- **Fábrica de query keys** — `src/shared/api/query-keys.ts`. Ahí sigue un
  **`activityKeys` huérfano (L32-50)**, sin un solo importador en `src/`
  (verificado con grep): es el resto del módulo borrado. Se **reemplaza** por
  `vidaKeys`, no se deja al lado (si no, habría dos fábricas para la misma
  entidad). Las demás keys muertas (`courseKeys`, `todoKeys`, `standupKeys`,
  `noteKeys`…) también están huérfanas, pero limpiarlas no es de este dossier.
- **Cliente GraphQL y errores** — `src/shared/api/graphql-client.ts:20`
  (`graphqlRequest`), `api-error.ts`. Se usa tal cual.
- **Guard de sesión para queries** — `useHabits.ts:14-18` (`useHabitQueryGuard`):
  `useAuthBootstrap().status === 'ready' && isAuthenticated`. Los hooks viejos lo
  hacían inline; en Vida va en un solo archivo.
- **Patrón de tests** — hooks: el propio `79bece0:src/features/activities/hooks/useActivities.test.tsx`
  (mockea el módulo `api`, el bootstrap de auth, el store y el toast; `renderHook`
  con `QueryClientProvider`). Páginas/layout: `src/test/render.tsx`
  (`renderWithProviders` con `MemoryRouter` y `routerProps.initialEntries`),
  ejemplo en `src/features/habits/pages/HabitsListPage.test.tsx`.
- **Cascarón de página** — `src/shared/ui/PageHeader/PageHeader.tsx` (`title`,
  `subtitle?`, `actions?`). Con eso basta para «solo un título».
- **El aspecto del selector de módulo** — `docs/vida/assets/03-vida-agenda.html:38-40`
  (`.mods`, `.mod`, `.mod.on`) y su colocación en `:168` (junto al lockup, en la
  fila de arriba; las píldoras de sección debajo en móvil, `:267-268`).
- **El código viejo de `79bece0`** — contratos GraphQL correctos pero con
  **tres desfases respecto al esquema real** (`~/Developer/xavi-platform-node/src/graphql/modules/activity/activity.schema.ts`):
  1. Selecciona `todoFolders` / `linkedTodo` / `activityPendingTodos` e importa
     tipos de `@/features/todos` que ya no existen → **fuera**.
  2. No conoce `subtasks`/`subtasksCount` en `Activity` (L99-100) ni
     `sessionSubtasks`/`sessionSubtasksCount` en `ActivityFollowUp` (L58-60) →
     los tipos y las selecciones los incorporan.
  3. No conoce `clientId` en `ActivityFollowUpAddInput`/`StartInput`
     (L232, L242) ni `subtaskIds` en `StartInput` (L244) → los tipos de input los
     llevan como opcionales.
- **Invalidación escrita dos veces en el código viejo** (bug latente):
  `79bece0:src/features/activities/utils/invalidate-follow-up-queries.ts` y una
  copia privada distinta en `hooks/useActivityFollowUps.ts:22-47` (la privada
  invalidaba además `all` y `open`). En Vida queda **una** y es la completa.
- **No existe nada** de plan del día ni de `VidaItem` en la web, ni en HEAD ni en
  `79bece0`: el slice 3 es nuevo de verdad.
- **Doc rancio:** `docs/activities-domain.md` describe el módulo borrado (rutas
  `/app/activities`, keys `activityKeys`). No lo toques; lo anoto para el usuario.

**Reference implementation:**
- Slice 1: `src/features/habits/routes/habits.routes.tsx` + `habits-paths.ts` +
  `src/features/habits/index.ts` (para rutas y barril) y
  `src/layouts/AppLayout/app-nav.config.ts` (para derivar `⌘K` de una descripción).
  Es lo más cercano en forma: un `RouteObject` con `path` relativo bajo `/app`,
  paths absolutos en un objeto `as const`, barril que exporta ambos.
- Slices 2 y 3: `src/features/habits/hooks/useHabits.ts` + `api/habits.api.ts` +
  `graphql/habits.graphql.ts` + `types/habit.types.ts` (forma de hoy: `graphqlRequest<TData>`
  con tipos `XxxData` por operación, hooks con guard, `staleTime: 30 s`,
  mutaciones que invalidan por key y sin `onError` en el hook) y los archivos de
  `79bece0` como texto de partida para los contratos.

**Where the new code goes:**

*Slice 1*
| Archivo | Acción |
|---|---|
| `src/features/vida/routes/vida-paths.ts` | crear: `{ root:'/app/vida', hoy:'/app/vida/hoy', plantilla:'/app/vida/plantilla', revision:'/app/vida/revision', actividades:'/app/vida/actividades' } as const` (copia de `habits-paths.ts`). |
| `src/features/vida/routes/vida.routes.tsx` | crear, copia de `habits.routes.tsx`: `path:'vida'`, índice `<Navigate to="hoy" replace />` (así la píldora «Hoy» queda activa en `/app/vida`; hábitos renderiza la página en el índice y por eso «Mi día» no se enciende en `/app/habits` — no lo imites), y `hoy`, `plantilla`, `revision`, `actividades`. |
| `src/features/vida/pages/VidaHoyPage.tsx`, `VidaPlantillaPage.tsx`, `VidaRevisionPage.tsx`, `VidaActividadesPage.tsx` | crear: `<PageHeader title="Hoy" />` etc. Sin hooks, sin datos, sin `.module.scss` propio. Títulos: «Hoy», «Plantilla», «Revisión», «Actividades». |
| `src/features/vida/index.ts` | crear, copia de `habits/index.ts`: exporta `vidaPaths`, `vidaRoutes`. |
| `src/app/router/routes.tsx` | modificar `:10-11` (import `vidaRoutes` de `@/features/vida`) y `:79-81` (añadir `vidaRoutes` tras `habitsRoutes`). El redirect de `/app` (`:74`) **no cambia**: sigue a `habitsPaths.myDay`. |
| `src/layouts/AppLayout/app-nav.config.ts` | modificar: pasa a ser **la única descripción de módulos**. Exporta `appModules: readonly AppModule[]` con `{ id:'habits'|'vida', label:'Hábitos'|'Vida', root, home, sections:[{ id, to, label, icon, keywords }], settings?:[{ to, label }] }`. Hábitos: sections `my-day`/`list`/`archived` (+ `settings` con categorías/medidas/persona, que hoy viven en `AppLayout.tsx:34-38` y se mudan aquí); Vida: `hoy`/`plantilla`/`revision`/`actividades`. `createCommandActions` deja de tener los seis destinos a mano y los deriva: id `go-${module.id}-${section.id}` (con esos `section.id` los ids existentes `go-habits-my-day`… quedan **idénticos**, byte a byte — es lo que protege el criterio 4), label `Ir a ${label}`, y detrás los tres transversales (`toggle-theme`, `go-settings`, `logout`) sin tocar. Iconos que existen en el catálogo para Vida: `sun` (Hoy), `calendar-days` (Plantilla), `clipboard-check` (Revisión), `list-ul` (Actividades). Keywords Vida: `['vida','hoy','día','agenda']`, `['vida','plantilla','semana']`, `['vida','revisión','revisar']`, `['vida','actividades','catálogo']`. |
| `src/layouts/AppLayout/AppLayout.tsx` | modificar: (a) borrar `SETTINGS_LINKS` `:34-38` — sale de `appModules`; (b) `activeModule = appModules.find(m => pathname.startsWith(m.root)) ?? appModules[0]`; (c) entre el lockup (`:134-137`) y `nav.pills` un `<nav aria-label="Módulos" className={styles.mods}>` con un `AppNavLink` por módulo (`to={module.home}`, clase `styles.mod`/`styles.modActive` con la misma técnica de `pillClassName`); (d) las píldoras de sección `:143-151` salen de `activeModule.sections.map(...)`, y el `Popover` de Ajustes `:153-162` se renderiza solo si `activeModule.settings` existe; (e) el lockup `:134` apunta a `activeModule.home`. La ficha de usuario, `ThemeToggle`, `ConnectionIndicator`, `CommandPaletteTrigger` y `contentDs` (`:90`) **no se tocan**. |
| `src/layouts/AppLayout/AppLayout.module.scss` | modificar: añadir `.mods` (`order: 1` pegado al lockup, `display:flex; gap:2px; padding:3px; border-radius: var(--radius-full); background: color-mix(in srgb, var(--color-text) 5%, transparent)`), `.mod.mod` (doble clase como `.pill.pill` en `:103`; `padding: .25rem .625rem; font: 600 .6875rem var(--font-label); color: var(--color-text-secondary)`), `.modActive.modActive` (`background: var(--color-glass); color: var(--color-text); box-shadow` como `:124`). Traducción a tokens del CSS del render `03-vida-agenda.html:38-40`. En móvil la fila de píldoras sigue en `order: 4` a lo ancho; `.mods` se queda arriba junto a la marca, como en el render `:168`. |
| `src/layouts/AppLayout/app-nav.config.test.ts` | crear: `createCommandActions` con handlers `vi.fn()` → contiene los 6 ids de hábitos con sus labels de antes y los 4 `go-vida-*`; `onSelect` de cada `go-vida-*` llama `navigate` con el path de `vidaPaths`; `toggle-theme`/`go-settings`/`logout` siguen. Cierra criterios 4 y 5. |
| `src/layouts/AppLayout/AppLayout.test.tsx` | crear con `renderWithProviders(<Routes>…<Route element={<AppLayout/>}>{habitsRoutes}{vidaRoutes}</Route></Routes>, { routerProps: { initialEntries: ['/app/habits/my-day'] } })` (mockear `useAuthStore`, `useLogoutMutation`, `useAuthBootstrap`, `loadIconCatalog`, `SessionExpiredModal`, `ConnectionIndicator` como hace `useActivities.test.tsx` con auth). Asserts: `getByRole('navigation',{name:'Módulos'})` tiene «Hábitos» y «Vida»; tras `click('Vida')` la nav «Secciones» muestra Hoy/Plantilla/Revisión/Actividades y aparece el `h1` «Hoy»; tras `click('Hábitos')` vuelven Mi día/Mis hábitos/Archivados/Ajustes. Cierra criterios 1 y 2 (en la parte automatizable). |
| `src/features/vida/routes/vida.routes.test.tsx` | crear: `createMemoryRouter([{ path:'/app', children:[vidaRoutes] }], { initialEntries:[ruta] })` + `RouterProvider` para las 5 rutas; cada una muestra su `h1` y `/app/vida` acaba en `/app/vida/hoy`. Cierra criterio 3. |

*Slice 2* (rescate; todos los `import '@/features/activities/…'` pasan a `@/features/vida/…`)
| Archivo | Acción |
|---|---|
| `src/shared/api/query-keys.ts` | modificar `:32-50`: **sustituir** `activityKeys` por `vidaKeys = { all:['vida'], activities:{ all(), list(filters), detail(id) }, categories:{ all(), list(), detail(id) }, followUps:{ all(), open(), day(date), range(from,to) } }` (misma forma anidada que `habitKeys.categories` `:16-20`). El slice 3 añade `dayPlan` e `items`. |
| `src/features/vida/types/activity.types.ts` | crear desde `79bece0:…/types/activity.types.ts`: quitar `ActivityTodoFolderRef`, `todoFolders`, `todoFolderIds`, `ActivityFormValues` (formulario = F1); añadir `ActivitySubtask`, `ActivitySubtasksCount`, `subtasks?`, `subtasksCount?` según `activity.schema.ts:68-81, 99-100`. **No** añadir `isWorkout`/`workoutExerciseIds` (entrenamiento fuera del alcance). |
| `src/features/vida/types/activity-category.types.ts` | crear desde el viejo; coincide con el esquema `:18-28, 208-223`. Quitar `ActivityCategoryFormValues` (F1). |
| `src/features/vida/types/activity-followup.types.ts` | crear desde el viejo: quitar `linkedTodo*`, `RunningActivitySession*`, `*FormValues`, `WeekDay` (UI de F3); añadir `ActivityFollowUpSubtask`, `sessionSubtasks?`, `sessionSubtasksCount?` (`:30-39, 58-60`), `clientId?` en Add/Start input y `subtaskIds?` en Start (`:225-245`). |
| `src/features/vida/graphql/activities.graphql.ts` | crear desde el viejo: fuera `ACTIVITY_PENDING_TODOS_QUERY` y toda selección `todoFolders`; añadir `subtasksCount { total completed }` en las selecciones de `Activity` (no `subtasks` completas: se piden cuando haga falta). |
| `src/features/vida/graphql/activity-categories.graphql.ts` | crear desde el viejo, tal cual. |
| `src/features/vida/graphql/activity-followups.graphql.ts` | crear desde el viejo: fuera `linkedTodoId` y `FOLLOW_UP_LINKED_TODO_FIELDS`; añadir `sessionSubtasksCount { total completed }` a `FOLLOW_UP_FIELDS`. Las mutaciones de subtareas (`activityFollowUpSubtaskAdd/Edit`, `activitySubtask*`) **no** entran en F0: las trae F3 con su pantalla. |
| `src/features/vida/api/activities.api.ts`, `activity-categories.api.ts`, `activity-followups.api.ts` | crear desde los viejos: sin `getActivityPendingTodos` ni imports de `todos`; `graphqlRequest` de `@/shared/api/graphql-client`. |
| `src/features/vida/utils/activity-filters.ts` | crear desde `79bece0:…/utils/activity-filters.ts` (45 líneas, puro; lo necesita `activities.api.ts` para `toGraphQLActivityVariables`). |
| `src/features/vida/utils/vida-date.utils.ts` (+ `.test.ts`) | crear: `getCurrentLocalDate`, `formatDateToYmd`, `getMondayOfWeek`, `getCurrentWeekRange`, `isFutureDate`, `isToday` extraídas de `79bece0:…/utils/activity-time.utils.ts:20-46, 119-131`. **No** traer `activity-time.utils.ts` entero (494 líneas, importa `@/features/weekly-routine` que no existe): es de F2/F3, y cuando llegue re-exporta desde aquí. Hay solape con `habits/utils/habit-type.utils.ts` (`getTodayString`): asumido, feature-first; unificarlo en `shared/` es otro dossier. |
| `src/features/vida/utils/invalidate-vida-queries.ts` | crear desde `79bece0:…/utils/invalidate-follow-up-queries.ts` con la versión **completa** (la privada del hook viejo `:22-47`: `day(date)`, `range(week)`, `activities.detail(activityId)` si viene, `activities.all()`, `followUps.open()`), sobre `vidaKeys`. Exporta `invalidateFollowUpQueries(qc, { date, activityId?, weekRange? })` y `invalidateActivityQueries(qc, { id? })`. Es **el único** sitio con invalidaciones de Vida. |
| `src/features/vida/hooks/useVidaQueryGuard.ts` | crear: copia de `useHabits.ts:14-18`, exportada. |
| `src/features/vida/hooks/useActivities.ts`, `useActivityCategories.ts`, `useActivityFollowUps.ts` | crear desde los viejos: `vidaKeys`, `useVidaQueryGuard`, invalidaciones vía `invalidate-vida-queries.ts` (borrar la privada `:22-47`), **sin `onError` ni `*.errors.ts`** (patrón vivo: `useHabits.ts:99-150` no los tiene; no hay `MutationCache.onError` global en `src/app/providers/query-client.ts`; el error lo enseña la pantalla en F1+). Los `toast.success` se mantienen. |
| `src/features/vida/hooks/useActivities.test.tsx`, `useActivityCategories.test.tsx`, `useActivityFollowUps.test.tsx` | crear desde los viejos con imports nuevos; quitar aserciones sobre toasts de error. |
| `src/features/vida/graphql/schema/activity.schema.graphql` | crear: **copia literal** del SDL de `activity.schema.ts` (solo el string) con cabecera `# copiado de xavi-platform-node/src/graphql/modules/activity/activity.schema.ts @ <fecha>`. Es el «esquema real» contra el que corre el test de contrato, sin depender de un repo hermano. |
| `src/features/vida/graphql/contracts.test.ts` | crear: para cada documento exportado de `graphql/*.graphql.ts`, (1) el nombre de operación raíz y su firma de argumentos existen en el SDL (`activities(status: ActivityStatus, …)`, `activityDayFollowUps(date: String!)`…), y (2) cada campo hoja seleccionado bajo un tipo existe en ese tipo del SDL. Extracción con regex sobre el SDL vendorizado (tipos `type X { … }` → set de campos). Ver «lo que no encontré»: no hay paquete `graphql` en el repo; **no** lo añadas sin que lo decida el usuario. |

*Slice 3* (nuevo; mismo molde que el slice 2)
| Archivo | Acción |
|---|---|
| `src/shared/api/query-keys.ts` | modificar `vidaKeys`: añadir `dayPlan:{ all(), byDate(date) }` e `items:{ all(), list(includeInactive=false), suggestions(date), takenToday(date) }`. `suggestions` y `takenToday` cuelgan de `items.all()` a propósito: invalidar `items.all()` es «invalidar `vidaItems`» del criterio 7. |
| `src/features/vida/types/activity-day-plan.types.ts` | crear desde `activity-day-plan.schema.ts` (79 líneas): `ActivityDayPlanItem { id, userId, activityId, date, startTime, endTime, orderIndex, completedAt, createdAt, updatedAt, activity: Activity }`, inputs `Set`, `SetItem`, `ItemAdd`, `ItemEdit { itemId, startTime?, endTime?, orderIndex?, isCompleted? }`, `ItemRemove { itemId }`; `clientId?` en `SetItem` e `ItemAdd`. |
| `src/features/vida/types/vida-item.types.ts` | crear desde `vida.schema.ts` (96 líneas): `VidaDayOfWeek`, `VidaItem`, `VidaTakenToday`, `VidaSuggestion { item, takenToday }`, inputs `Create`, `Update`, `Delete`, `MarkTakenToday`, `UnmarkTakenToday`. |
| `src/features/vida/graphql/activity-day-plan.graphql.ts` | crear: `ACTIVITY_DAY_PLAN_QUERY(date)`, `ACTIVITY_DAY_PLAN_SET_MUTATION`, `_ITEM_ADD_`, `_ITEM_EDIT_`, `_ITEM_REMOVE_`. Selección de `activity` como `FOLLOW_UP_ACTIVITY_FIELDS` del viejo (`id title description category { id name color icon }`). |
| `src/features/vida/graphql/vida-items.graphql.ts` | crear: `VIDA_ITEMS_QUERY(includeInactive)`, `VIDA_SUGGESTIONS_FOR_DATE_QUERY(date)`, `VIDA_TAKEN_TODAY_QUERY(date)`, `VIDA_ITEM_CREATE/UPDATE/DELETE_MUTATION`, `VIDA_MARK_TAKEN_TODAY_MUTATION`, `VIDA_UNMARK_TAKEN_TODAY_MUTATION`. |
| `src/features/vida/api/activity-day-plan.api.ts`, `vida-items.api.ts` | crear con el molde de `activity-followups.api.ts` (un `XxxData` por operación). |
| `src/features/vida/utils/invalidate-vida-queries.ts` | modificar: añadir `invalidateDayPlanQueries(qc, { date })` → `dayPlan.byDate(date)` + `dayPlan.all()`; `invalidateVidaItemQueries(qc)` → `items.all()`. `vidaMarkTakenToday`/`Unmark` y `vidaItem*` usan la segunda; `activityDayPlan*` la primera. |
| `src/features/vida/hooks/useActivityDayPlan.ts` (+ `.test.tsx`) | crear: `useActivityDayPlanQuery(date)`, `useSetActivityDayPlanMutation`, `useAddDayPlanItemMutation`, `useEditDayPlanItemMutation`, `useRemoveDayPlanItemMutation`. |
| `src/features/vida/hooks/useVidaItems.ts` (+ `.test.tsx`) | crear: `useVidaItemsQuery(includeInactive?)`, `useVidaSuggestionsForDateQuery(date)`, `useVidaTakenTodayQuery(date)`, `useCreate/Update/DeleteVidaItemMutation`, `useMarkTakenTodayMutation`, `useUnmarkTakenTodayMutation`. El test de `useMarkTakenTodayMutation` comprueba que se invalida `vidaKeys.items.all()` (espiando `queryClient.invalidateQueries`). |
| `src/features/vida/graphql/schema/activity-day-plan.schema.graphql`, `vida.schema.graphql` | crear: copias literales del SDL, como en el slice 2. |
| `src/features/vida/graphql/contracts.test.ts` | modificar: los nuevos documentos entran en la misma tabla. |

**What NOT to create:**
- Otro cliente GraphQL, otro manejo de token o de errores: `src/shared/api/`.
- Otro guard `isReady && isAuthenticated`: uno en `useVidaQueryGuard.ts`, ninguno inline.
- Una segunda lista de destinos para `⌘K` o para la barra: sale toda de `appModules`.
- `activityKeys` al lado de `vidaKeys`: se sustituye.
- `activity-time.utils.ts`, `activity-day-metrics.utils.ts`, los timers (`useElapsedTimer`…), los modales de sesión, `*.errors.ts`, `*-form.ts`, `activity-select-options.tsx`, `activity-enums.ts`, `activity-date.ts`: son F1–F3, no F0.
- Páginas con `.module.scss`, `EmptyState`, `Spinner` o datos: F0 es un título por ruta.
- Una carpeta `src/pages/app/Vida*`: hábitos tiene sus páginas dentro de la feature (`src/features/habits/pages/`), Vida igual. (`settings` las tiene en `src/pages/app/`; es el patrón viejo.)

**Where it does NOT go:**
- La descripción de módulos **no** va en `src/app/router/`: el router solo conoce `RouteObject`s; quién tiene qué píldora es asunto del layout, y `app-nav.config.ts` ya importa ambos `*Paths`. Tampoco en cada feature (`habits/index.ts` exportando sus secciones): metería iconos/keywords de `⌘K` en la feature y el layout tendría que agregar de N sitios.
- Las keys **no** van en `src/features/vida/api/vida-keys.ts`: la convención (`docs/project-conventions.md`, «React Query») y `habitKeys` las tienen en `src/shared/api/query-keys.ts`, y las invalidaciones cruzadas (plan + follow-ups + items) se leen mejor en un sitio.
- Los slugs **no** van en inglés (`/app/vida/today`): la base ya es `/app/vida` en español y manda la coherencia dentro del módulo. Decidido por el usuario; ver hipótesis de la sección 1, resuelta así.
- El SDL de referencia **no** se lee del repo hermano en tiempo de test (`~/Developer/xavi-platform-node`): el test debe correr en cualquier máquina; se vendoriza con fecha y origen.
- No se añade `graphql` (ni `graphql-tag`) como dependencia desde este dossier: es una decisión del usuario (ver abajo).
- Index de `/app/vida` **no** renderiza `VidaHoyPage` directamente (como hace hábitos): redirige a `/app/vida/hoy` para que la píldora activa sea coherente con la URL.

**Verification, por slice (línea base en `ENVIRONMENT.md`: typecheck limpio · lint 14 · tests 2/409 · build 816 kB):**
- Slice 1 — con test: `app-nav.config.test.ts`, `AppLayout.test.tsx`, `vida.routes.test.tsx`. Sin sesión solo se ve hasta `/auth/login`; la píldora real, el aspecto Aura y el comportamiento de ficha/tema los confirma **el usuario** en el recorrido del criterio 10. Si el constructor quiere ver la barra, arnés temporal bajo `src/` con `MemoryRouter` y `AppLayout` con auth mockeada, borrado antes de reportar (`ENVIRONMENT.md`, «Cómo conseguir datos reales»). `pnpm build` al cerrar: el chunk inicial no debe crecer de forma apreciable (cuatro páginas de un título).
- Slices 2 y 3 — solo test (`pnpm test`), más `typecheck` y `lint`. Ninguna pantalla los invoca; no hay recorrido de usuario.

**Slices, with paths:**
| # | What it does | Files | Criteria it closes | State |
|---|---|---|---|---|
| 1 | Píldora de módulo Hábitos · Vida; `/app/vida` + 4 rutas con título; `⌘K` con destinos de Vida; una sola descripción de módulos | crear `src/features/vida/{index.ts, routes/vida-paths.ts, routes/vida.routes.tsx, routes/vida.routes.test.tsx, pages/VidaHoyPage.tsx, pages/VidaPlantillaPage.tsx, pages/VidaRevisionPage.tsx, pages/VidaActividadesPage.tsx}`, `src/layouts/AppLayout/{app-nav.config.test.ts, AppLayout.test.tsx}`; modificar `src/app/router/routes.tsx:10-11,79-81`, `src/layouts/AppLayout/app-nav.config.ts`, `AppLayout.tsx:34-38,89,134-163`, `AppLayout.module.scss` | 1, 2, 3, 4, 5 (automatizables), 9, y deja listo el 10 (usuario) | pending |
| 2 | Capa de datos rescatada: actividades, categorías, follow-ups — tipos al esquema real, `vidaKeys`, una sola invalidación, tests de hooks y de contrato | modificar `src/shared/api/query-keys.ts:32-50`; crear `src/features/vida/{types/activity.types.ts, types/activity-category.types.ts, types/activity-followup.types.ts, graphql/activities.graphql.ts, graphql/activity-categories.graphql.ts, graphql/activity-followups.graphql.ts, graphql/schema/activity.schema.graphql, graphql/contracts.test.ts, api/activities.api.ts, api/activity-categories.api.ts, api/activity-followups.api.ts, utils/activity-filters.ts, utils/vida-date.utils.ts, utils/vida-date.utils.test.ts, utils/invalidate-vida-queries.ts, hooks/useVidaQueryGuard.ts, hooks/useActivities.ts, hooks/useActivities.test.tsx, hooks/useActivityCategories.ts, hooks/useActivityCategories.test.tsx, hooks/useActivityFollowUps.ts, hooks/useActivityFollowUps.test.tsx}` | 6, 8 (parte de actividades/categorías/follow-ups), 9 | pending |
| 3 | Capa de datos nueva: plan del día y plantilla Vida — tipos, GraphQL, api, hooks, keys, invalidaciones, tests de hooks y de contrato | modificar `src/shared/api/query-keys.ts` (`vidaKeys.dayPlan`, `vidaKeys.items`), `src/features/vida/utils/invalidate-vida-queries.ts`, `src/features/vida/graphql/contracts.test.ts`; crear `src/features/vida/{types/activity-day-plan.types.ts, types/vida-item.types.ts, graphql/activity-day-plan.graphql.ts, graphql/vida-items.graphql.ts, graphql/schema/activity-day-plan.schema.graphql, graphql/schema/vida.schema.graphql, api/activity-day-plan.api.ts, api/vida-items.api.ts, hooks/useActivityDayPlan.ts, hooks/useActivityDayPlan.test.tsx, hooks/useVidaItems.ts, hooks/useVidaItems.test.tsx}` | 7, 8 (resto), 9 | pending |

Los tres slices de la sección 1 se mantienen. Orden **obligatorio** 1 → 2 → 3: el
3 necesita `vidaKeys`, `useVidaQueryGuard` y el tipo `Activity` del 2
(`ActivityDayPlanItem.activity` y `VidaItem.activity` son `Activity`). El 1 no
depende de nadie.

**Lo que no encontré / queda para el usuario:**
- **No hay paquete `graphql` en el repo** (`package.json` no lo lista). El test de
  contrato «contra el esquema real» que piden los criterios 6–8 se puede hacer
  con regex sobre el SDL vendorizado (es lo planeado arriba), pero una validación
  de verdad (`buildSchema` + `validate`) necesita añadir `graphql` como
  `devDependency`. Es una decisión de dependencias del usuario; el plan no la toma.
- El esquema vendorizado se copia a mano y caduca en silencio: no encontré nada
  que lo compare con el repo hermano. La cabecera con fecha y ruta es lo mínimo;
  un script de comprobación sería otro dossier.
- `docs/activities-domain.md` está rancio (describe `/app/activities` y
  `activityKeys`). No lo toco; conviene retirarlo o reescribirlo al cerrar F0.

## 3. Construction — feature-builder

## 4. Review — feature-reviewer
