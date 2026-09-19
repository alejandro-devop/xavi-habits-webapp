---
id: FEAT-001
title: Cimientos del módulo Vida — la barra cambia de módulo y Vida existe como cascarón
status: delivered    # las tres tajadas revisadas y aceptadas; sin commitear. Queda el criterio 10 (recorrido real del usuario), que no es de ningún agente
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
| 1 | La píldora de módulo gana «Vida»; `/app/vida` y sus 4 rutas existen y renderizan cascarones con título; `⌘K` conoce los destinos de Vida | delivered (criterio 10 pendiente del recorrido del usuario) |
| 2 | Capas de datos rescatadas de `79bece0` (actividades, categorías, follow-ups): GraphQL, api, hooks, tipos, query keys — con tests contra el esquema | delivered |
| 3 | Capas de datos nuevas (plan del día `activityDayPlan*` y Vida `vidaItems`/`vidaSuggestionsForDate`/`vidaTakenToday`/`vidaItem*`/`vidaMarkTakenToday`): GraphQL, api, hooks, tipos, query keys e invalidaciones — con tests contra el esquema | delivered |

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
| 1 | Píldora de módulo Hábitos · Vida; `/app/vida` + 4 rutas con título; `⌘K` con destinos de Vida; una sola descripción de módulos | crear `src/features/vida/{index.ts, routes/vida-paths.ts, routes/vida.routes.tsx, routes/vida.routes.test.tsx, pages/VidaHoyPage.tsx, pages/VidaPlantillaPage.tsx, pages/VidaRevisionPage.tsx, pages/VidaActividadesPage.tsx}`, `src/layouts/AppLayout/{app-nav.config.test.ts, AppLayout.test.tsx}`; modificar `src/app/router/routes.tsx:10-11,79-81`, `src/layouts/AppLayout/app-nav.config.ts`, `AppLayout.tsx:34-38,89,134-163`, `AppLayout.module.scss` | 1, 2, 3, 4, 5 (automatizables), 9, y deja listo el 10 (usuario) | delivered |
| 2 | Capa de datos rescatada: actividades, categorías, follow-ups — tipos al esquema real, `vidaKeys`, una sola invalidación, tests de hooks y de contrato | modificar `src/shared/api/query-keys.ts:32-50`; crear `src/features/vida/{types/activity.types.ts, types/activity-category.types.ts, types/activity-followup.types.ts, graphql/activities.graphql.ts, graphql/activity-categories.graphql.ts, graphql/activity-followups.graphql.ts, graphql/schema/activity.schema.graphql, graphql/contracts.test.ts, api/activities.api.ts, api/activity-categories.api.ts, api/activity-followups.api.ts, utils/activity-filters.ts, utils/vida-date.utils.ts, utils/vida-date.utils.test.ts, utils/invalidate-vida-queries.ts, hooks/useVidaQueryGuard.ts, hooks/useActivities.ts, hooks/useActivities.test.tsx, hooks/useActivityCategories.ts, hooks/useActivityCategories.test.tsx, hooks/useActivityFollowUps.ts, hooks/useActivityFollowUps.test.tsx}` | 6, 8 (parte de actividades/categorías/follow-ups), 9 | delivered |
| 3 | Capa de datos nueva: plan del día y plantilla Vida — tipos, GraphQL, api, hooks, keys, invalidaciones, tests de hooks y de contrato | modificar `src/shared/api/query-keys.ts` (`vidaKeys.dayPlan`, `vidaKeys.items`), `src/features/vida/utils/invalidate-vida-queries.ts`, `src/features/vida/graphql/contracts.test.ts`; crear `src/features/vida/{types/activity-day-plan.types.ts, types/vida-item.types.ts, graphql/activity-day-plan.graphql.ts, graphql/vida-items.graphql.ts, graphql/schema/activity-day-plan.schema.graphql, graphql/schema/vida.schema.graphql, api/activity-day-plan.api.ts, api/vida-items.api.ts, hooks/useActivityDayPlan.ts, hooks/useActivityDayPlan.test.tsx, hooks/useVidaItems.ts, hooks/useVidaItems.test.tsx}` | 7, 8 (resto), 9 | delivered |

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

*(la entrada del constructor se escribió por error bajo la sección 4; se ha
movido aquí tal cual, sin tocar una palabra. Ver «desviaciones» en la sección 4.)*

### Slice 1

**Summary for the reviewer:** La barra única aprende a tener módulos: una sola
descripción (`appModules` en `app-nav.config.ts`) alimenta la píldora «Hábitos ·
Vida», las píldoras de sección, el popover de ajustes del módulo y `⌘K`; y
`/app/vida` existe con cuatro cascarones de un título. Lo que más probablemente
rompí es **la barra de hábitos**: sus tres píldoras, el popover «Ajustes» y el
destino del lockup ya no están escritos a mano en `AppLayout.tsx`, salen de la
tabla — si algún `to`, etiqueta o `triggerLabel` cambió sin querer, se nota ahí
antes que en Vida. Segundo sospechoso: la fila superior de la barra en **móvil**,
donde el grupo de módulos come ancho al lado de la marca.

**What was built:**
- `src/features/vida/routes/vida-paths.ts` — `vidaPaths` con `root/hoy/plantilla/revision/actividades` (slugs en español, sin acentos, decisión del arquitecto).
- `src/features/vida/routes/vida.routes.tsx` — `vidaRoutes` (`path: 'vida'`), índice `<Navigate to="hoy" replace />` y las cuatro rutas.
- `src/features/vida/pages/Vida{Hoy,Plantilla,Revision,Actividades}Page.tsx` — cada una `<PageHeader title="…" />` y nada más: sin hooks, sin `.module.scss`, sin una sola llamada a datos.
- `src/features/vida/index.ts` — barril con `vidaPaths` y `vidaRoutes`, como el de hábitos.
- `src/app/router/routes.tsx` — importa `vidaRoutes` y lo registra tras `habitsRoutes` dentro de `VerifyAccountGuard`. El redirect de `/app` sigue yendo a `habitsPaths.myDay`, intacto.
- `src/layouts/AppLayout/app-nav.config.ts` — ahora es la **única** descripción de módulos: tipos `AppModule`/`AppModuleSection`/`AppModuleSettingsLink`, la constante `appModules` (Hábitos con sus 3 secciones + 3 ajustes de módulo; Vida con sus 4 secciones y sin ajustes), el helper `findActiveModule(pathname)` y un `createCommandActions` que **deriva** las acciones en vez de listarlas.
- `src/layouts/AppLayout/AppLayout.tsx` — fuera `SETTINGS_LINKS`; `activeModule = findActiveModule(pathname)`; un `<nav aria-label="Módulos">` con una píldora por módulo entre el lockup y las secciones; las píldoras de sección y el popover de ajustes salen de `activeModule`; el lockup apunta a `activeModule.home`. Ficha de usuario, `ThemeToggle`, `ConnectionIndicator`, `CommandPaletteTrigger` y `contentDs` sin tocar — las páginas de Vida heredan el ámbito Aura por el mismo `data-ds` que hábitos.
- `src/layouts/AppLayout/AppLayout.module.scss` — `.mods`, `.mod.mod`, `.modActive.modActive`, traducción a tokens de `.mods/.mod/.mod.on` del render `03-vida-agenda.html:38-40`. Comparten `order: 1` con el lockup para quedar pegadas a la marca también en móvil, con la fila de secciones (`order: 4`) debajo.
- Tests nuevos: `src/layouts/AppLayout/app-nav.config.test.ts` (9), `src/layouts/AppLayout/AppLayout.test.tsx` (4), `src/features/vida/routes/vida.routes.test.tsx` (7).

**Why this way:**
- **La píldora de módulo no se enciende con `NavLink`.** Apunta a la portada del módulo (`/app/vida/hoy`), así que por coincidencia de URL se apagaría en `/app/vida/plantilla`. Se enciende comparando `module.id` con el módulo activo (`modClassName(boolean)`), no con el `isActive` del enlace. Es la desviación real respecto al plan, que decía «la misma técnica de `pillClassName`»: se conserva la técnica de componer clases, no la fuente del booleano.
- **Los ajustes del módulo entran en `appModules` con `icon` y `keywords`**, no solo `{to,label}` como decía el plan. Sin eso, `go-habits-categories`/`measures`/`persona` habrían perdido su icono y sus palabras clave en `⌘K`, y el criterio 4 pide que nada de hábitos cambie. Los nueve ids y etiquetas de antes salen idénticos y en el mismo orden.
- **`AppLayout.test.tsx` no monta `habitsRoutes` reales**, como sugería el plan, sino cascarones para los cuatro paths de hábitos que la barra enlaza (Vida sí monta `vidaRoutes` de verdad). Las páginas de hábitos disparan queries GraphQL; lo que se prueba aquí es la barra, y arrastrar la capa de datos solo añadía mocks y ruido. El recorrido completo hábitos→Vida→hábitos se prueba igual.
- `findActiveModule` vive en `app-nav.config.ts` y no inline en el layout: la misma respuesta la van a querer los breadcrumbs o el título del documento más adelante, y así se prueba sin renderizar.

**Verification:**
- Línea base **antes** (sonda, `docs/features/probe.sh`): typecheck limpio · lint 14/0 · tests 2 fallos de 409 · build 816 kB.
- `npx vitest run` de los tres archivos nuevos → `Test Files 3 passed (3) · Tests 17 passed (17)`.
- `pnpm typecheck` → limpio (sin salida).
- `pnpm lint` → `✖ 14 problems (14 errors, 0 warnings)` — los mismos 14 preexistentes; ninguno en archivos de esta tajada.
- `pnpm test` → `Test Files 1 failed | 58 passed (59) · Tests 2 failed | 424 passed (426)`. Los 2 fallos son los de `SearchSelect` de siempre. 409 → 426 tests: +17, los nuevos.
- `pnpm build` → `dist/assets/index-*.js 817.63 kB │ gzip: 250.64 kB` (línea base 816 / gzip 250): **+1,6 kB** por cuatro páginas de un título y la tabla de módulos. `app-icons` sigue en 620,20 kB perezoso e `IconPicker` en 4,64 kB: no se coló ningún icono al chunk inicial.
- **Arnés temporal** (`harness-vida-bar.html` + `src/harness-vida-bar.tsx`, **borrados**; `git status` limpio de ellos): `AppLayout` con `MemoryRouter` en el 5173 del usuario. Visto en escritorio (800 px) con Vida activa: la píldora «Hábitos · Vida» junto a la marca, «Vida» en blanco con sombra y las cuatro secciones Hoy/Plantilla/Revisión/Actividades a su derecha, igual que el render. Visto en móvil (375 px) con Hábitos activo: fila de arriba marca + módulos + buscar/tema/ficha, fila de abajo Mi día/Mis hábitos/Archivados/Ajustes. `⌘K` abierto en móvil: Mi día, Mis hábitos, Archivados, Categorías, Medidas, Mi Persona, Hoy, Plantilla… con sus iconos.
- `graphify update .` → 2395 nodos, 2556 aristas.

**Criteria it closes:** (numerados como en la sección 1)
1. **Píldora «Hábitos · Vida» en escritorio y móvil** — *parcial, como preveía el criterio*. Automatizable cerrado: `AppLayout.test.tsx` «ofrece los dos módulos y marca el activo» y la nav `Módulos` con ambos enlaces. Aspecto: comprobado en el arnés contra `03-vida-agenda.html` en las dos anchuras. **Queda pendiente de prueba manual** el aspecto con sesión real y tema oscuro.
2. **Cambiar de módulo sin recargar** — cerrado: `AppLayout.test.tsx` «cambia a las secciones de Vida y vuelve a las de Hábitos» comprueba ida y vuelta (secciones exactas en cada sentido, `h1` de la página, y que el popover «Ajustes» desaparece en Vida y vuelve en Hábitos).
3. **Las cinco rutas, solo un título** — cerrado: `vida.routes.test.tsx`, una por ruta, `/app/vida` aterriza en `/app/vida/hoy` (comprobado sobre `router.state.location.pathname`), y «las páginas de F0 no muestran nada más que el título» (un solo `heading`, ni botones ni listas).
4. **Ficha, tema y `⌘K` de hábitos sin cambios** — cerrado en su parte automatizable: `app-nav.config.test.ts` fija los 9 ids/etiquetas de antes y su orden relativo, que `go-habits-*` y `go-settings` navegan a los mismos paths y que tema y salir no navegan; `AppLayout.test.tsx` abre la ficha, ve el correo, «Ajustes de cuenta» y que «Cerrar sesión» llama a la mutación, estando en Vida. El `triggerLabel` del popover sigue siendo literalmente `Ajustes de hábitos`.
5. **`⌘K` con los cuatro destinos de Vida** — cerrado: `app-nav.config.test.ts` comprueba ids, etiquetas y que cada `onSelect` navega a su `vidaPaths.*`.
9. **Línea base** — cerrado: medidas arriba, ninguna peor.
10. **Recorrido real** — **pendiente del usuario**, no automatizable (todo `/app/*` está tras login). Pasos: entrar con sesión → estás en Mi día → pulsar «Vida» en la píldora junto a la marca → debes aterrizar en `/app/vida/hoy` con el título «Hoy» y las píldoras Hoy/Plantilla/Revisión/Actividades (sin «Ajustes») → recorrer las cuatro y comprobar que cada URL es `/app/vida/<slug>` y muestra su título → escribir `/app/vida` a mano y comprobar que redirige a `/app/vida/hoy` → pulsar «Hábitos» → vuelves a Mi día con Mi día/Mis hábitos/Archivados/Ajustes, el popover de Ajustes abre Categorías/Medidas/Mi Persona, `⌘K` lleva a los mismos sitios de siempre y el tema se cambia igual. Mirar también en móvil que la barra sigue partida en dos alturas.
Los criterios 6, 7 y 8 son de las tajadas 2 y 3: **no se tocan aquí**.

**Risks:**
- La barra de hábitos pasó de literal a derivada: un error en `appModules` se ve en hábitos, no en Vida. Es lo primero que hay que mirar.
- En móvil el grupo de módulos comparte la fila de arriba con marca, buscar, tema y ficha. A 375 px entra holgado (comprobado); con un tercer módulo o un idioma más largo esa fila se aprieta.
- `findActiveModule` casa por prefijo: cualquier ruta futura que empiece por `/app/habits` o `/app/vida` cae en su módulo sola; una que no empiece por ninguno (hoy `/app/settings`) enciende Hábitos por defecto — es el comportamiento de antes, ahora explícito y con test.
- `.mods` usa `color-mix` sobre `--color-text` y `--color-glass`: en tema oscuro debería leerse bien, pero eso solo lo confirma un ojo humano.
- El `⌘K` creció de 9 a 13 acciones; la paleta no tiene agrupación por módulo. No es un fallo, pero se nota y en algún momento pedirá secciones.

**Lo que vi de paso y no toqué:** `docs/features/ENVIRONMENT.md` ya anota `/app/vida/*` como «NO EXISTE AÚN; lo crea la feature F0» — queda desactualizado al aceptarse esta tajada, pero ese archivo no lo modifica un constructor. El `activityKeys` huérfano de `src/shared/api/query-keys.ts` y el rancio `docs/activities-domain.md` siguen ahí: son de la tajada 2 y del usuario, respectivamente.

**Tree state:** sin commitear.

### Slice 2

**Summary for the reviewer:** La capa de datos de Vida existe bajo
`src/features/vida/` — actividades, categorías y follow-ups: tipos, documentos
GraphQL, api, hooks, una sola invalidación y `vidaKeys` — y cada documento se
valida de verdad (`buildSchema` + `parse` + `validate` de `graphql`, añadido como
**devDependency**) contra el SDL real del backend, vendorizado con fecha y
origen. Ninguna pantalla la consume todavía: es todo tests. Lo que más
probablemente rompí está **fuera** de `src/features/vida/`: en
`src/shared/api/query-keys.ts` sustituí `activityKeys` por `vidaKeys` (si algo
lo importaba, se cae ahí — busqué y no lo importaba nadie), y en
`app-nav.config.ts` quité el `| string` del tipo del icono, que es la barra de
la tajada 1. Segundo sospechoso: haber añadido un paquete al `package.json`.

**What was built:**
- `src/shared/api/query-keys.ts` — `activityKeys` (huérfano, L32-50) **sustituido** por `vidaKeys` (`all:['vida']`, `activities.{all,list,detail}`, `categories.{all,list,detail}`, `followUps.{all,open,day,range}`). No queda una segunda fábrica para la misma entidad. Se fue con él `pendingTodos`, que era de tareas.
- `src/features/vida/types/{activity,activity-category,activity-followup}.types.ts` — al esquema real: `ActivitySubtask`, `ActivitySubtasksCount`, `subtasks?`/`subtasksCount?` en `Activity`; `ActivityFollowUpSubtask`, `sessionSubtasks?`/`sessionSubtasksCount?`, `isOpen`/`endTime`/`endDate`/`endDateTime` en `ActivityFollowUp`; `clientId?` en los inputs Add/Start y `subtaskIds?` en Start. Fuera `ActivityTodoFolderRef`, `todoFolders`, `todoFolderIds`, `linkedTodo*`, `RunningActivitySession*`, todos los `*FormValues` y `WeekDay` (son de F1–F3).
- `src/features/vida/graphql/{activities,activity-categories,activity-followups}.graphql.ts` — 18 documentos. Fuera `ACTIVITY_PENDING_TODOS_QUERY`, las selecciones `todoFolders`, `FOLLOW_UP_LINKED_TODO_FIELDS` y `linkedTodoId`. Dentro `subtasksCount { total completed }` en las selecciones de `Activity` y `sessionSubtasksCount { total completed }` en las de `ActivityFollowUp`.
- `src/features/vida/graphql/schema/activity.schema.graphql` — SDL vendorizado: copia literal de `activityTypeDefs` de `xavi-platform-node/src/graphql/modules/activity/activity.schema.ts` con encabezado de fecha (2026-09-19) y origen.
- `src/features/vida/graphql/contracts.test.ts` — **39 tests**. `buildSchema` sobre el SDL y `validate(schema, parse(documento))` para los 18 documentos; más: la lista exacta de documentos exportados, que ninguno nombra tareas ni `standup`, que el SDL trae los seis campos que el código viejo no conocía, y un test de dientes (un campo inventado **debe** fallar la validación).
- `src/features/vida/api/{activities,activity-categories,activity-followups}.api.ts` — copia de los viejos con `graphqlRequest` y un tipo `XxxData` por operación; sin `getActivityPendingTodos` ni imports de `@/features/todos`.
- `src/features/vida/utils/activity-filters.ts` — copia del viejo, puro, lo usa `activities.api.ts`.
- `src/features/vida/utils/vida-date.utils.ts` (+ `.test.ts`, 7 tests) — `formatDateToYmd`, `getCurrentLocalDate`, `getMondayOfWeek`, `getCurrentWeekRange`, `isFutureDate`, `isToday`, extraídas de `activity-time.utils.ts:20-46,119-131`. El resto de aquel archivo (494 líneas, importa `@/features/weekly-routine`) **no** entra.
- `src/features/vida/utils/invalidate-vida-queries.ts` — **la única** invalidación del módulo, con la versión completa (día, semana, abierto, detalle de la actividad y lista). Añade `invalidateActivityQueries` e `invalidateActivityCategoryQueries` para que ningún hook invalide a mano.
- `src/features/vida/hooks/useVidaQueryGuard.ts` — el guard `isReady && isAuthenticated` en un solo sitio, exportado.
- `src/features/vida/hooks/{useActivities,useActivityCategories,useActivityFollowUps}.ts` (+ sus tres `.test.tsx`, 15 tests) — sobre `vidaKeys`, con el guard y las invalidaciones del archivo único; **sin `onError` ni `*.errors.ts`**, como `useHabits.ts`. Los `toast.success` se mantienen.
- `src/layouts/AppLayout/app-nav.config.ts` — el arreglo que dejó anotado el revisor de la tajada 1: `AppModuleSection.icon` y `AppModuleSettingsLink.icon` pasan de `AppIconName | string` a `AppIconName`. Ningún nombre dejó de compilar: los doce iconos de la tabla estaban bien escritos.
- `package.json` / `pnpm-lock.yaml` — `graphql ^17.0.2` como **devDependency** (decisión del usuario para esta tajada).

**Why this way:**
- **El test de contrato valida de verdad, no por regex.** El plan lo dejaba en regex porque no había paquete `graphql`; el usuario decidió añadirlo como dependencia de desarrollo. Con `validate` lo que corre es el mismo algoritmo del servidor: cubre tipos de variable, argumentos, campos hoja y selecciones sobre tipos compuestos de una vez, y no hay que mantener un extractor propio. Medido: el chunk inicial **no crece** (`index-*.js` 817,63 kB, idéntico a la línea base), porque solo lo importa un `.test.ts`.
- **El SDL vendorizado lleva cuatro líneas que no son copia literal**, y están marcadas como tales en el encabezado: `type Query`/`type Mutation` base (el módulo solo trae `extend type`), los cuatro escalares de `common/scalars.schema.ts`, y `Todo`/`TodoFolder` reducidos a `{ id: ID! }`. Sin ellos `buildSchema` no levanta el documento. El módulo de tareas no es de Vida: están ahí solo porque `Activity.todoFolders`, `ActivityFollowUp.linkedTodo` y `activityPendingTodos` los nombran en el esquema real, y ningún documento nuestro los selecciona — que es justo lo que comprueba un test.
- **El test de dientes usa un campo inventado (`spentTimeSeconds`), no `todoFolders`.** `todoFolders` **sigue existiendo** en el esquema real: que no lo pidamos es política nuestra, no un error de contrato. Confundir las dos cosas habría dado un test que parece probar y no prueba.
- **`getCurrentWeekRange` se reescribió sobre `getMondayOfWeek`** en vez de copiarse: la versión vieja pasaba por `getWeekDaysForDate`, que construye etiquetas de UI (`WeekDay`) y arrastra media línea de tiempo. Mismo resultado (lunes a domingo, fechas locales), probado con dos casos incluido el cruce de mes.
- **Las invalidaciones viven en funciones, no sueltas en cada `onSuccess`.** Es lo que permite que el test compruebe la lista **exacta** de claves invalidadas y que no vuelvan a existir dos versiones distintas como en `79bece0`.
- **No se creó `src/features/vida/index.ts` con exports de datos.** El barril de la tajada 1 exporta rutas; nada consume aún la capa de datos y añadir exports muertos invita a importarlos desde fuera de la feature.
- **`vida-date.utils.ts` se solapa con `getTodayString`** de `habits/utils/habit-type.utils.ts`. Asumido: feature-first, como dejó escrito el arquitecto. Unificarlo en `shared/` es otro dossier.

**Verification:**
- Línea base **antes** (tras la tajada 1): typecheck limpio · lint 14/0 · tests 2 fallos de 426 · build `index-*.js` 817,63 kB (gzip 250,64).
- `pnpm typecheck` → limpio, sin salida.
- `pnpm lint` → `✖ 14 problems (14 errors, 0 warnings)`. Los mismos preexistentes (`SteppedModal`, `Tabs`, `toast.context`, `test/render`); ninguno en archivos de esta tajada.
- `pnpm test` → `Test Files 1 failed | 63 passed (64) · Tests 2 failed | 485 passed (487)`. El único archivo rojo es `SearchSelect.test.tsx`, el de siempre. 426 → 487 = **+61 tests, 0 fallos nuevos** (39 de contratos, 7 de fechas, 5+4+6 de hooks).
- `pnpm build` → `dist/assets/index-B8e6cbwQ.js 817.63 kB │ gzip: 250.64 kB` — **exactamente la línea base**: `graphql` no se coló en el paquete servido. `app-icons` sigue en 620,20 kB perezoso e `IconPicker` en 4,64 kB.
- Comprobado a mano que `activityKeys` ya no aparece en `src/` y que en `src/features/vida/*.ts(x)` no queda una sola mención a tareas, `standup`, bitácora ni tiptap (las únicas coincidencias con «todo» son las aserciones del test que lo prohíbe).
- **Sin navegador**: esta tajada no tiene superficie visible (`ENVIRONMENT.md`, «Cómo conseguir datos reales»). No se sembró ningún dato ni se tocó la API.
- `graphify update .` → 2525 nodos, 2696 aristas.

**Criteria it closes:** (numerados como en la sección 1)
6. **Capas de datos rescatadas de `79bece0` bajo `src/features/vida/`, adaptadas, con tests que verifican que las operaciones respetan el esquema real** — **cerrado para actividades, categorías y follow-ups** (que es lo que esta tajada abarca). Evidencia: los 18 documentos pasan `validate` contra el SDL real en `contracts.test.ts`; los tres desfases que el arquitecto había detectado están corregidos y el test lo fija (`subtasksCount`, `sessionSubtasksCount`, `clientId`/`subtaskIds`, `isOpen`/`endTime`/`endDate`/`endDateTime`); nada de tiptap, nada de tareas. Los hooks tienen 15 tests propios.
8. **Cada conjunto de query keys expone sus funciones de invalidación y existen antes de que ninguna pantalla las consuma** — **cerrado en su parte de esta tajada**. `invalidate-vida-queries.ts` es el único sitio con invalidaciones; los tests de los tres hooks comprueban la lista **exacta** de claves invalidadas por cada mutación (p. ej. registrar un follow-up invalida día + semana + abierto + detalle + lista, en ese orden), y todos pasan sin que exista ninguna página que importe nada de esto. Las invalidaciones de `dayPlan` e `items` son de la tajada 3.
9. **Línea base** — cerrado: las cuatro medidas arriba, ninguna peor; el build ni siquiera se movió un byte.
Los criterios 1–5 y 10 son de la tajada 1; el 7 y el resto del 8 son de la tajada 3.

**Pendiente de prueba manual (usuario):** nada de esta tajada. No hay pantalla ni recorrido: si algo aquí está mal contra el backend real, se verá cuando F1 pinte la primera lista. La comprobación posible sin sesión —que los documentos son válidos contra el esquema— está hecha y automatizada.

**Risks:**
- **El SDL caduca en silencio.** Si el backend cambia `activity.schema.ts`, este test seguirá en verde contra una copia vieja. La cabecera con fecha y origen es lo mínimo; un script que compare con el repo hermano sería otro dossier. Es el riesgo número uno de esta tajada.
- **`graphql` es la primera dependencia nueva del módulo.** Está en `devDependencies` y medí que no toca el paquete servido, pero cualquier archivo de producción que lo importe sí lo metería en el chunk inicial (~40 kB min). Solo debe importarlo un test.
- **`vidaKeys` sustituyó a `activityKeys`.** Busqué importadores y no había ninguno, pero si alguna sesión paralela añadió uno, se cae al compilar.
- **Los hooks nunca se han ejecutado contra la API real**; los tests mockean el `api`. Lo que está probado es el contrato de los documentos y las claves de invalidación, no un ida y vuelta real.
- **`AppModuleSection.icon` pasó a `AppIconName`**: es un estrechamiento de tipo en la barra de la tajada 1. Compila hoy; si alguien añade una sección con un icono fuera del catálogo, ahora falla el typecheck — que es el efecto buscado.
- Los tests de follow-ups usan `vi.useFakeTimers({ shouldAdvanceTime: true })`: sin `shouldAdvanceTime`, `waitFor` se queda colgado 5 s por test. Queda anotado porque el siguiente que congele el reloj en este repo tropezará igual.

**Lo que vi de paso y no toqué:**
- `docs/activities-domain.md` sigue rancio (describe `/app/activities` y `activityKeys`, que desde hoy ya no existe ni como resto). Es del usuario.
- `src/shared/api/query-keys.ts` conserva seis fábricas más igual de huérfanas que estaba `activityKeys` (`courseKeys`, `todoKeys`, `standupKeys`, `noteKeys`, `learningKeys`, `appIdeaKeys`, `sleepKeys`, `quarterKeys`, `weeklyRoutineKeys`). Limpiarlas no es de este dossier.
- `docs/features/ENVIRONMENT.md` sigue diciendo que `/app/vida/*` no existe y su línea base de tests (409) es la de antes de la tajada 1. Un constructor no modifica ese archivo.
- `src/features/vida/utils/vida-date.utils.ts` y `src/features/habits/utils/habit-type.utils.ts` calculan el día de hoy cada uno por su lado. Anotado, no unificado.

**Tree state:** sin commitear.

### Slice 3

**Summary for the reviewer:** El plan del día (`activityDayPlan*`) y la
plantilla Vida (`vidaItems`, `vidaSuggestionsForDate`, `vidaTakenToday`,
`vidaItem*`, `vidaMarkTakenToday`/`Unmark`) existen bajo `src/features/vida/`
con tipos, documentos, api, hooks, `vidaKeys.dayPlan`/`vidaKeys.items`,
invalidaciones en el archivo único y tests: 13 documentos nuevos validados
contra un **único esquema** construido con los tres SDL vendorizados. Ninguna
pantalla lo consume; los cascarones siguen intactos. Lo que más probablemente
rompí está **fuera** de los archivos nuevos: `src/shared/api/query-keys.ts`
(añadí dos ramas a `vidaKeys`, que es compartido) y
`utils/invalidate-vida-queries.ts` y `graphql/contracts.test.ts`, que son de la
tajada 2 y ahora cargan los tres SDL en vez de uno — si el esquema combinado no
levantara, se caerían **también** los 18 documentos de la tajada anterior, no
solo los míos. Segundo sospechoso: los tipos nuevos importan
`ActivityFollowUpActivityRef` de la tajada 2, así que tocar aquel tipo ahora
rompe tres archivos en vez de uno.

**What was built:**
- `src/features/vida/graphql/schema/activity-day-plan.schema.graphql` y `vida.schema.graphql` — copia **literal** de las cadenas `gql` de `xavi-platform-node/src/graphql/modules/activity-day-plan/activity-day-plan.schema.ts` y `vida/vida.schema.ts`, con cabecera de origen y fecha (2026-09-19). **Sin añadidos**: los dos módulos hacen `extend type Query`/`Mutation` y los bloques base (Query/Mutation vacíos, escalares, tipos ajenos reducidos) ya están en `activity.schema.graphql` y no se repiten.
- `src/features/vida/types/activity-day-plan.types.ts` — `ActivityDayPlanItem` y los cuatro inputs (`Set`, `SetItem`, `ItemAdd`, `ItemEdit`, `ItemRemove`), con `clientId?` donde el esquema lo tiene.
- `src/features/vida/types/vida-item.types.ts` — `VidaDayOfWeek`, `VidaItem`, `VidaTakenToday`, `VidaSuggestion` y los cinco inputs (`Create`, `Update`, `Delete`, `MarkTakenToday`, `UnmarkTakenToday`), con `clientId?` en `Create`.
- `src/features/vida/graphql/activity-day-plan.graphql.ts` (5 documentos) y `vida-items.graphql.ts` (8 documentos) — nombres y campos exactamente los del esquema; `activity` se selecciona en la versión corta (`id title description category { id name color icon }`), la misma de los documentos de follow-ups.
- `src/features/vida/api/activity-day-plan.api.ts` y `vida-items.api.ts` — molde de `activity-followups.api.ts`: `graphqlRequest` y un tipo `XxxData` por operación.
- `src/shared/api/query-keys.ts` — `vidaKeys.dayPlan.{all,byDate}` y `vidaKeys.items.{all,list,suggestions,takenToday}`. `suggestions` y `takenToday` cuelgan de `items.all()` a propósito, con el porqué escrito en el archivo.
- `src/features/vida/utils/invalidate-vida-queries.ts` — tres funciones nuevas, **el único** sitio con invalidaciones de Vida (ninguna privada en un hook): `invalidateDayPlanQueries(qc,{date})`, `invalidateVidaItemQueries(qc)`, `invalidateVidaTakenTodayQueries(qc,{date})`. Reusan `toFollowUpDateKey` para recortar una fecha con hora.
- `src/features/vida/hooks/useActivityDayPlan.ts` (+ `.test.tsx`, 7 tests) — `useActivityDayPlanQuery`, `useSetActivityDayPlanMutation`, `useAddDayPlanItemMutation`, `useEditDayPlanItemMutation`, `useRemoveDayPlanItemMutation`, con `useVidaQueryGuard`.
- `src/features/vida/hooks/useVidaItems.ts` (+ `.test.tsx`, 7 tests) — `useVidaItemsQuery`, `useVidaSuggestionsForDateQuery`, `useVidaTakenTodayQuery`, `useCreate/Update/DeleteVidaItemMutation`, `useMark/UnmarkTakenTodayMutation`.
- `src/features/vida/graphql/contracts.test.ts` — pasa a construir **un solo** esquema con los tres SDL, suma los 13 documentos nuevos a la lista literal (31 nombres, `toEqual` exacto) y añade tres comprobaciones: que los SDL nuevos son copia literal (traen `extend type` y **no** repiten `type Query`/`type Mutation`/`scalar`), que el esquema combinado resuelve `Activity` desde los otros módulos, y un segundo test de dientes sobre `VidaItem`.

**Why this way:**
- **Un esquema, no tres.** `activity-day-plan` y `vida` no levantan por separado: referencian `Activity` y `DateTime`, que aporta el módulo de actividades. Concatenar los tres SDL es lo que hace el servidor y además prueba las referencias cruzadas gratis. Alternativa descartada: repetir los bloques base en cada archivo vendorizado — habría dejado tres copias divergentes de lo mismo y convertido «copia literal» en mentira.
- **`clientId` va en los tipos y no lo genera nadie.** Es decisión del usuario para F0: existe en los inputs del esquema (UUID v7, idempotencia offline) y la web es el piloto, sin modo offline. Lo dejé dicho **en tres sitios donde el arquitecto lo buscaría**: la cabecera de `activity-day-plan.types.ts`, la de `vida-item.types.ts` y el bloque de documentación de cada hook (que es quien lo emitiría, no el `api`).
- **Invalidar el plan del día es invalidar `dayPlan.byDate(date)` y nada más.** El plan del arquitecto decía «`byDate(date)` + `dayPlan.all()`»; la decisión del usuario dice «la de **esa** fecha». **Desviación declarada**: invalidar `dayPlan.all()` tiraría el plan de todos los días porque cambió el de hoy y forzaría refetch de fechas que nadie tocó. Si el revisor prefiere la versión del plan, es una línea.
- **Mutar un `VidaItem` invalida una sola clave, `items.all()`.** Es literalmente «invalidar `vidaItems`» y, por prefijo, arrastra `suggestions(*)` y `takenToday(*)` de cualquier fecha, que es la segunda mitad de la regla. Un test lo demuestra comparando prefijos en vez de confiar en que React Query «ya lo hará». Alternativa descartada: añadir una clave `suggestionsAll()` solo para poder enumerarla — invalidación redundante, y dos maneras de decir lo mismo.
- **Marcar/desmarcar no invalida la lista de ítems**: la plantilla no cambia al tomar algo; sí cambia el `takenToday` de las sugerencias de ese día. Las dos claves, en ese orden, las fija el test con `toEqual`.
- **El plan del día sí consulta fechas futuras**, a diferencia de `useActivityDayFollowUpsQuery`, que bloquea el futuro con `isFutureDate`. Planear mañana es el caso de uso de F2; registrar tiempo en el futuro es un error. Está probado en un test para que no parezca un olvido.
- **`ActivityDayPlanItem.activity` y `VidaItem.activity` se tipan como `ActivityFollowUpActivityRef`**, el tipo de la tajada 2, no como `Activity`. **Desviación declarada** respecto al plan (que decía `activity: Activity`): los documentos seleccionan el subconjunto corto, y tipar de más es prometer campos que no llegan. El nombre del tipo arrastra «FollowUp» y eso es feo; renombrarlo tocaría archivos ya aceptados, así que lo dejo anotado en vez de hacerlo.
- **Editar un bloque invalida la fecha de la *respuesta*; quitarlo, la que pasa quien llama.** `activityDayPlanItemEdit` solo recibe `itemId` y `activityDayPlanItemRemove` devuelve `Boolean!`: ninguno de los dos trae la fecha por el input. Está escrito en el hook y probado con una respuesta de otro día (`2026-09-21`).
- **Sin `onError`, igual que la referencia.** Ningún hook avisa cuando una mutación falla; los `toast` son solo de éxito. Es el hallazgo que dejó escrito el revisor de la tajada 2, y **no se resuelve en F0** por decisión del usuario: es lo que hace `useHabits.ts` y desviarse aquí crearía un tercer patrón sin pantalla que lo justifique. **Queda para F1**, cuando exista la primera pantalla de Vida: ahí el estado de error deja de ser opcional. Lo repito aquí para que no se pierda entre dos tajadas.

**Verification:**
- Línea base **antes** (tras la tajada 2): typecheck limpio · lint 14/0 · tests 2 fallos de 487 · build `index-*.js` 817,63 kB (gzip 250,64).
- `pnpm typecheck` → limpio, sin salida. (Falló una vez: un `as const` en el mock dejaba `days` readonly contra `VidaDayOfWeek[]`; corregido.)
- `pnpm lint` → `✖ 14 problems (14 errors, 0 warnings)`. Los mismos cuatro archivos preexistentes (`SteppedModal`, `Tabs`, `toast.context`, `test/render`); ninguno de esta tajada.
- `pnpm test` → `Test Files 1 failed | 65 passed (66)` · `Tests 2 failed | 528 passed (530)`. El único archivo rojo sigue siendo `SearchSelect.test.tsx`. 487 → 530 = **+43 tests, 0 fallos nuevos** (29 de contratos —de 39 a 68—, 7 del plan del día, 7 de la plantilla).
- `pnpm build` → `dist/assets/index-B8e6cbwQ.js 817.63 kB │ gzip: 250.64 kB`, **el mismo hash de contenido que la línea base**: ni un byte. `graphql` no se coló (`grep buildSchema` en el chunk servido → 0; el único importador en `src/` sigue siendo `contracts.test.ts`).
- **Los SDL son copia literal, comprobado a máquina**: extraje otra vez las cadenas `gql` del repo hermano y comparé con lo vendorizado quitando solo la cabecera de comentarios → `activity-day-plan IDENTICO`, `vida IDENTICO`.
- **Ninguna invalidación privada**: `invalidateQueries` aparece en `src/features/vida/` solo en `utils/invalidate-vida-queries.ts` y en los `spyOn` de los cinco tests de hooks.
- **Ninguna pantalla lo consume**: `git status` son 12 archivos nuevos y 4 modificados (3 de código + el dossier); las cuatro páginas cascarón y `index.ts` no se tocaron.
- **Sin navegador y sin datos sembrados**: esta tajada no tiene superficie visible (`ENVIRONMENT.md`, «Cómo conseguir datos reales»). No se tocó la API.
- `graphify update .` → 2601 nodos, 2777 aristas.

**Criteria it closes:** (numerados como en la sección 1)
7. **Capas de datos nuevas de plan del día y de Vida con tipos, hooks y query keys, con tests contra esos esquemas** — **cerrado**. Los 13 documentos nuevos (5 de `activityDayPlan*`, 8 de `vida*`) pasan `validate` contra el esquema construido con los SDL reales, y la lista literal del test tiene los 31 nombres exactos, así que ninguno queda fuera de la red. Están las cuatro operaciones que el criterio nombra por su nombre (`vidaItems`, `vidaSuggestionsForDate`, `vidaTakenToday`, `vidaItem*`, `vidaMarkTakenToday`) más `vidaUnmarkTakenToday`, que el criterio no nombraba y el esquema sí tiene. Tipos, api, hooks y keys, en su sitio; 14 tests de hooks propios.
8. **Cada conjunto de query keys expone sus funciones de invalidación y existen antes de que ninguna pantalla las consuma** — **cerrado del todo** (la tajada 2 cerró su parte). `vidaKeys.dayPlan` y `vidaKeys.items` viven en el mismo y único sitio; las tres funciones de invalidación, en el mismo y único archivo. Los tests fijan la lista **exacta y ordenada** con `toEqual`: plan del día → `[dayPlan.byDate(date)]`; `vidaItem*` → `[items.all()]`; marcar/desmarcar → `[items.takenToday(date), items.suggestions(date)]`. Y todo pasa sin que exista ninguna página que importe nada de esto.
9. **Línea base** — cerrado: las cuatro medidas arriba, ninguna peor; el build volvió a salir idéntico.
Los criterios 1–5 y 10 son de la tajada 1; el 6, de la 2.

**Pendiente de prueba manual (usuario):** nada de esta tajada. No hay pantalla ni recorrido. Lo único que no se puede comprobar desde aquí —que el backend desplegado responde de verdad a estas operaciones— se verá cuando F2 pinte el primer plan del día; lo comprobable sin sesión (que los documentos son válidos contra el esquema real) está hecho y automatizado.

**Risks:**
- **El SDL caduca en silencio**, ahora por triplicado. Si el backend cambia `vida.schema.ts` o `activity-day-plan.schema.ts`, el test sigue verde contra una copia vieja. Es el mismo riesgo número uno de la tajada 2, multiplicado por tres archivos.
- **`contracts.test.ts` ahora depende de los tres SDL a la vez.** Si mañana alguien rompe el vendorizado de actividades, se caen también los 13 documentos nuevos y al revés: un fallo apuntará a más sitios de los que tiene la culpa.
- **`vidaKeys` creció y es compartido** (`src/shared/api/query-keys.ts`). Solo añadí ramas —no toqué `habitKeys`, `authKeys`, `settingsKeys` ni las huérfanas—, pero es el archivo con más importadores de los que toqué.
- **Los hooks nunca se han ejecutado contra la API real**: los tests mockean el `api`. Probado está el contrato de los documentos y las claves de invalidación, no un ida y vuelta.
- **Sin `onError` (arriba, en «Why this way»)**: hoy una mutación que falle no avisa. Deliberado y aplazado a F1, no olvidado.
- **`items.all()` invalida más de lo justo**: al crear un ítem se van también `takenToday(*)` de todas las fechas, que no han cambiado. Es el precio de una sola clave; con una pantalla delante se podrá medir si molesta.
- **`toFollowUpDateKey` se llama así y ahora lo usan tres funciones que no son de follow-ups.** Renombrarlo tocaría archivos aceptados; lo dejo anotado.

**Lo que vi de paso y no toqué:**
- `ActivityFollowUpActivityRef` es hoy el tipo de la actividad corta de tres módulos (follow-ups, plan del día, plantilla). El nombre se quedó pequeño; moverlo a `activity.types.ts` como `ActivityRef` es un renombrado de tajada 2 que no me toca.
- `docs/activities-domain.md` sigue rancio (describe `/app/activities` y `activityKeys`), y `docs/features/ENVIRONMENT.md` sigue con la línea base de tests anterior y diciendo que `/app/vida/*` no existe. Un constructor no modifica `ENVIRONMENT.md`.
- `src/shared/api/query-keys.ts` conserva nueve fábricas huérfanas (`courseKeys`, `todoKeys`, `standupKeys`, `noteKeys`, `learningKeys`, `appIdeaKeys`, `sleepKeys`, `quarterKeys`, `weeklyRoutineKeys`). Sigue sin ser de este dossier.
- El esquema de Vida tiene `vidaUnmarkTakenToday`, que la sección 1 no nombra (nombra solo `vidaMarkTakenToday`). Lo construí porque sin él no se puede deshacer y el criterio dice «`vidaItem*`»; si el revisor lo considera fuera de alcance, es un archivo de tres líneas menos. No reescribo el criterio.
- Con `VidaItem.days` el backend impone `VidaDayOfWeek` (lunes…domingo) y `vida-date.utils.ts` de la tajada 2 no tiene conversión de `Date` a ese enum. La necesitará F2; no la adelanto.

**Tree state:** sin commitear.

## 4. Review — feature-reviewer

### Slice 1

**Criterios, uno a uno** (contra la sección 1, no contra el resumen del
constructor). Entorno: `docs/features/ENVIRONMENT.md` leído y no modificado;
sonda ejecutada (web del usuario arriba en 5173, API responde). No se entró
con credenciales en ningún momento.

1. **Píldora «Hábitos · Vida» en escritorio y móvil, con el aspecto del
   render** — **cumplido en su parte automatizable, aspecto verificado con
   arnés**. `AppLayout.test.tsx` comprueba la nav «Módulos» con los dos
   enlaces y el activo. Yo lo vi además con **mi propio arnés temporal**
   (`review-bar.html` + `src/review-bar.tsx`, `AppLayout` real bajo
   `AppProviders` + `MemoryRouter`, servido por el 5173 del usuario, **ya
   borrado**): a 375 px la barra se parte en dos alturas (107 px de alto),
   fila 1 = marca (x 16-83) + módulos (107-219) + acciones (247-359), fila 2 =
   secciones a lo ancho; `scrollWidth` 375 = `innerWidth` 375, **sin scroll
   horizontal**. «Vida» encendida, «Hoy» activa, sin píldora «Ajustes».
   Pendiente del usuario: el aspecto con sesión real.
2. **Cambiar de módulo sin recargar** — **cumplido**. `AppLayout.test.tsx`
   («cambia a las secciones de Vida y vuelve a las de Hábitos») hace ida y
   vuelta sobre el mismo árbol de React, sin recarga, comprobando secciones,
   `h1` y la desaparición/reaparición del popover.
3. **Las cinco rutas, cada una solo un título** — **cumplido**.
   `vida.routes.test.tsx` (7 tests) las cubre y verifica que `/app/vida`
   aterriza en `/app/vida/hoy`. Comprobado **por mí, aparte**, con
   `matchRoutes` sobre el `routes` real: `/app/vida` → ruta índice,
   `/app/vida/hoy` → `hoy`, y **`/app/vida/loquesea` → la ruta `*`**
   (`NotFoundPage`), que es lo que se quería.
4. **Ficha de usuario, `⌘K` de hábitos y tema sin cambios** — **cumplido**.
   Comparé `createCommandActions` antes/después con
   `git diff src/layouts/AppLayout/app-nav.config.ts`: los seis destinos de
   hábitos salen ahora derivados de `appModules` con **los mismos ids
   (`go-habits-my-day|list|archived|categories|measures|persona`), etiquetas,
   iconos (`fire`, `list-check`, `box-archive`, `layer-group`,
   `chart-simple`, `circle-user`), keywords y orden**, y detrás
   `toggle-theme` · `go-settings` · `logout` intactos. El `triggerLabel` del
   popover, antes literal `"Ajustes de hábitos"`, ahora es
   `` `Ajustes de ${activeModule.label.toLowerCase()}` `` → misma cadena.
   Verifiqué **renderizando** (arnés de test propio, ya borrado) que el
   popover «Ajustes» de hábitos sigue con **Categorías · Medidas · Mi
   Persona** apuntando a `/app/habits/categories|measures|persona` — eso no
   lo cubría ningún test del constructor. El tema: en el arnés del navegador
   pulsé el conmutador estando en Vida y pasó a oscuro correctamente.
5. **`⌘K` con los cuatro destinos de Vida** — **cumplido**.
   `app-nav.config.test.ts` fija `go-vida-hoy|plantilla|revision|actividades`,
   sus etiquetas y que cada `onSelect` navega a su `vidaPaths.*`.
9. **Línea base** — **cumplido, medido por mí entero**:
   `pnpm typecheck` limpio · `pnpm lint` **14 errores / 0 warnings** (los
   mismos preexistentes: `SteppedModal`, `Tabs`, `toast.context`,
   `test/render`) · `pnpm test` **2 fallos de 426** y el único archivo rojo es
   `SearchSelect.test.tsx`, el de siempre (409 → 426 = +17 tests nuevos, 0
   fallos nuevos) · `pnpm build` `index-*.js` **817,63 kB (gzip 250,64)`
   frente a 816 de base — **+1,6 kB**, con `app-icons` en 620,20 kB perezoso e
   `IconPicker` en 4,64 kB: **ningún icono se coló al chunk inicial**.
6, 7, 8. **No son de esta tajada** (capas de datos, tajadas 2 y 3).
10. **Recorrido real — sigue PENDIENTE del usuario.** Todo `/app/*` está tras
    login y ningún agente entra con credenciales. Los pasos están escritos
    abajo, «Para el usuario». No lo doy por cerrado.

**Qué rompió cerca** (cómo lo busqué, no solo el resultado):

- **Quién más usa lo tocado.** `graphify explain "createCommandActions"` y
  `graphify explain "AppLayout"` sobre el grafo — que refleja el estado
  **anterior** al cambio, que es justo lo que quiero para «¿quién dependía de
  esto?»: `createCommandActions` solo lo llama `buildActions()` dentro del
  propio `AppLayout`. Confirmado abriendo los archivos y con búsqueda literal
  de importadores: fuera de `AppLayout.tsx` solo lo importan los dos tests
  nuevos, y `AppLayout` solo lo monta `src/app/router/routes.tsx`. Superficie
  de impacto: la barra y la paleta, nada más.
- **Lo que el constructor marcó como «lo que más probablemente rompí»** (la
  barra de hábitos): ver criterio 4. Los seis destinos, los tres ajustes de
  módulo y el `triggerLabel` quedan byte a byte iguales; lo comprobé en el
  diff **y** renderizando el popover.
- **Lo que vivía al lado en la misma pantalla.** `/app/settings` es el caso
  raro: no empieza por `/app/habits` ni por `/app/vida`. Lo probé (arnés de
  test propio, borrado): la barra sigue mostrando **Mi día · Mis hábitos ·
  Archivados** + «Ajustes de hábitos» —igual que antes, por el fallback de
  `findActiveModule` al primer módulo— y el `<main>` **sigue sin `data-ds`**,
  o sea el ámbito Aura sigue desactivado en el contenido de ajustes de
  cuenta. `contentDs` no se tocó en el diff.
- **Ruta inexistente:** `/app/vida/loquesea` cae en `*` → «no encontrado».
  Vida no tiene ruta `:id` que se la trague (hábitos sí tiene `:id`, por eso
  allí el comportamiento es otro — preexistente, no cambia).
- **Móvil y tema oscuro:** medidos en el navegador con el arnés (arriba). A
  375 px no hay scroll horizontal y quedan ~28 px de holgura entre el grupo
  de módulos y las acciones. En oscuro, el grupo de módulos se lee: pista
  clara al 5 % sobre la barra oscura, píldora activa `rgba(30,37,54,.72)` con
  texto `#E7EBF8` e inactiva `#A5B0C4`. El indicador de activo es **sutil en
  oscuro** (chip más oscuro sobre pista más clara, al revés que en claro);
  legible, pero es lo primero que miraría el usuario en el recorrido real.

**Estados que nadie construye:**

- **Vacío / carga / error / permisos:** **no aplican** a esta tajada. F0
  entrega cuatro cascarones con un título y **cero llamadas a datos** (lo
  verifiqué: las páginas solo montan `PageHeader`); el acceso ya lo resuelven
  `ProtectedRoute` y `VerifyAccountGuard`, que no se tocaron.
- **Móvil (375 px):** **construido y verificado** (arriba). No es un estado
  que falte.
- **Texto largo:** las etiquetas son fijas y en español, no hay entrada de
  usuario. Pero sí queda un **hallazgo**: con ~28 px de holgura en la fila
  superior a 375 px, un **tercer módulo** o una etiqueta más larga la parte en
  otra altura. El constructor ya lo anotó como riesgo; lo confirmo con
  números y lo dejo escrito para cuando llegue el tercer módulo.
- **Tema oscuro:** verificado (arriba), con la salvedad del indicador sutil.

**¿Duplica algo que ya existía?** (contra la sección 2) **No.**
- **Una sola lista de rutas de Vida:** `vidaPaths` en
  `src/features/vida/routes/vida-paths.ts`. Busqué literales `'/app/vida…'`
  en todo `src/`: **cero** fuera de ese archivo.
- **Un solo `data-ds="aura"` nuevo:** ninguno. Los únicos `data-ds` del repo
  siguen siendo los preexistentes (`AppLayout`, `AuthLayout`, portales y
  `AuroraCanvas`); las páginas de Vida heredan el ámbito del `<main>`.
- **Una sola descripción de módulos:** se cumplió el encargo. En
  `AppLayout.tsx` **no queda un solo destino de hábitos escrito a mano**
  (`SETTINGS_LINKS` fuera, y ni `habitsPaths` ni `/app/habits` aparecen ya en
  el archivo). Píldoras, popover, lockup y `⌘K` salen todos de `appModules`.
- Nada de la lista «What NOT to create» de la sección 2 aparece: ni otro
  cliente GraphQL, ni `src/pages/app/Vida*`, ni `.module.scss` en las páginas,
  ni `EmptyState`/`Spinner`.

**Las tres desviaciones declaradas por el constructor:**
1. **Píldora de módulo encendida por módulo activo y no por `isActive` del
   `NavLink`** — **razonable y correcta**. Apunta a la portada del módulo, así
   que con `NavLink` se apagaría en `/app/vida/plantilla`. Mantiene la técnica
   de composición de clases que pedía el plan y cambia solo la fuente del
   booleano. Con test (`findActiveModule` por prefijo).
2. **`icon` y `keywords` también en los ajustes del módulo**, no solo
   `{to,label}` — **razonable y necesaria**: sin eso,
   `go-habits-categories|measures|persona` habrían perdido icono y keywords
   en `⌘K` y se habría roto el criterio 4. Es la desviación que **protege** un
   criterio, no la que lo esquiva.
3. **`AppLayout.test.tsx` con cascarones para las páginas de hábitos** —
   **aceptable**, con una anotación: lo que se prueba es la barra y montar la
   capa de datos de hábitos solo añadía mocks. Pero el cascarón dejó fuera el
   **contenido** del popover de Ajustes; lo cubrí yo a mano en esta revisión y
   pasa. Queda como sugerencia para la tajada 2 o para quien vuelva a tocar la
   barra: un test que abra el popover y fije los tres enlaces.

**Hallazgos que no devuelven la tajada** (no se toca nada, quedan escritos):
- `AppModuleSection.icon` y `AppModuleSettingsLink.icon` están tipados
  `AppIconName | string`. La unión con `string` anula la comprobación: un
  nombre de icono mal escrito compila. Si `CommandAction['icon']` lo permite,
  merece quedarse en `AppIconName` a secas.
- El constructor escribió su entrada bajo el encabezado de la **sección 4**;
  la he movido a la 3 sin cambiar una palabra. Nadie borró nada.
- `docs/features/ENVIRONMENT.md` dice todavía que `/app/vida/*` «NO EXISTE
  AÚN; lo crea la feature F0» y su tabla de rutas no lista las de Vida. Al
  aceptarse esta tajada queda desactualizado. **No lo modifico** (el protocolo
  me lo prohíbe): lo dejo señalado para el usuario.
- `⌘K` pasó de 9 a 13 acciones sin agrupar por módulo. Se nota; no es un
  fallo de esta tajada.

**Verdict:** **accepted** — los siete criterios automatizables de la tajada
(1, 2, 3, 4, 5, 9 y la parte comprobable del 10) se cumplen con evidencia
propia, la línea base no empeora en ninguno de los cuatro comandos, no
encontré ninguna regresión en hábitos, en `/app/settings` ni en la barra a 375
px, y no se duplicó nada. El criterio 10 sigue **pendiente del recorrido
manual del usuario**, como el propio criterio previó.

**Para el usuario:**

Desde ahora la barra de arriba de la app tiene, justo al lado del nombre
«Xavi», un interruptor con dos nombres: **Hábitos** y **Vida**. Es la pregunta
anterior a todas las demás —«¿en qué parte de mi vida estoy?»— y hasta hoy no
existía: la app solo sabía vivir un módulo. Al pulsar «Vida» la fila de
secciones de abajo cambia entera y aparecen las cuatro partes del nuevo
módulo: **Hoy, Plantilla, Revisión y Actividades**. Al pulsar «Hábitos» vuelve
todo exactamente como estaba, con Mi día, Mis hábitos, Archivados y el botón
«Ajustes» con Categorías, Medidas y Mi Persona. El buscador `⌘K` también
aprendió los cuatro destinos nuevos, sin perder ninguno de los de siempre.

Lo que **todavía no** vas a encontrar: las cuatro pantallas de Vida están
vacías a propósito, solo con su título. Esta fase es el terreno —que la app
sepa que hay dos módulos y que las direcciones existan—; el contenido de cada
pantalla llega en las fases siguientes. Nada de Hábitos cambia de
comportamiento.

**Para probarlo a mano** (hace falta tu sesión; los agentes no entran con
credenciales):
1. Entra en la app: aterrizas en **Mi día**, como siempre.
2. Pulsa **Vida** en el interruptor junto a «Xavi». Debes acabar en
   `/app/vida/hoy`, con el título **Hoy** y las píldoras Hoy · Plantilla ·
   Revisión · Actividades (sin «Ajustes», que Vida todavía no tiene).
3. Recorre las cuatro y comprueba que cada dirección es `/app/vida/<sección>`
   y muestra su título.
4. Escribe `/app/vida` a mano en la barra del navegador: debe llevarte a
   `/app/vida/hoy`. Prueba también `/app/vida/cualquiercosa`: debe salir «no
   encontrado».
5. Pulsa **Hábitos**: vuelves a Mi día. Abre el botón «Ajustes» (Categorías ·
   Medidas · Mi Persona), prueba `⌘K` y cambia el tema: todo igual que antes.
6. Repite el paso 2 en el móvil y en **tema oscuro**: mira que la fila de
   arriba siga cabiendo y que se vea con claridad **cuál de los dos módulos
   está encendido** — en oscuro el contraste entre encendido y apagado es más
   sutil que en claro.

### Slice 2

**Criterios, uno a uno** (contra la sección 1, no contra el resumen del
constructor). Entorno: `docs/features/ENVIRONMENT.md` leído y **no
modificado**. Esta tajada no tiene superficie visible: no abrí navegador, no
entré con credenciales y no toqué la API.

6. **Capas de datos rescatadas de `79bece0` bajo `src/features/vida/`,
   adaptadas (sin tiptap), con tests que verifican que las operaciones
   respetan el esquema real** — **cumplido para actividades, categorías y
   follow-ups**, que es el alcance de esta tajada.
   - *La validación es real, no cosmética*: `contracts.test.ts` importa
     `buildSchema, parse, validate` de `graphql`, construye el esquema desde
     `schema/activity.schema.graphql?raw` y corre `validate(schema,
     parse(documento))`.
   - *Todos los documentos pasan por ahí*: conté los exports de los tres
     `*.graphql.ts` — 7 + 6 + 5 = **18** — y la lista literal que el test fija
     con `toEqual` tiene **los mismos 18 nombres**. No hay documento fuera de
     la red.
   - *El SDL vendorizado coincide con el real*: extraje la cadena `gql` de
     `~/Developer/xavi-platform-node/src/graphql/modules/activity/activity.schema.ts`
     y la comparé con el archivo vendorizado, sin comentarios ni líneas en
     blanco. El `diff` completo son **16 líneas, todas añadidas y todas de
     los cuatro bloques declarados**: `type Query`/`type Mutation` base, los
     cuatro escalares (`DateTime`, `Date`, `JSON`, `Decimal`) y
     `Todo`/`TodoFolder` reducidos a `{ id: ID! }`. **Cero diferencias en el
     cuerpo del módulo**: ni un campo cambiado, quitado ni añadido.
   - *El test tiene dientes de verdad*: el caso del campo inventado
     (`spentTimeSeconds`) fija el mensaje literal de error del validador.
   - *Los hooks tienen 15 tests propios*; los corrí aparte y pasan.
7. **No es de esta tajada** (plan del día y `vidaItems`: tajada 3).
8. **Cada conjunto de query keys expone sus funciones de invalidación y
   existen antes de que ninguna pantalla las consuma** — **cumplido en su
   parte de esta tajada**. `activityKeys` **ya no existe** en `src/`
   (búsqueda literal: cero coincidencias, y con él se fue `pendingTodos`, que
   tampoco aparece ya). `vidaKeys` se define en **un solo sitio**
   (`src/shared/api/query-keys.ts:32`) y no hay ninguna segunda fábrica de
   claves de Vida. Todas las llamadas a `invalidateQueries` de producción del
   módulo están en `utils/invalidate-vida-queries.ts`: en los hooks no queda
   **ninguna**; las únicas coincidencias fuera de ese archivo son los `spyOn`
   de los tres tests. Los tests fijan la **lista exacta y ordenada** de claves
   por mutación (`expect(invalidated).toEqual(expectedInvalidations(...))`:
   día → semana → abierto → detalle → lista), no un subconjunto. Nada de esto
   lo importa ninguna página: `src/features/vida/index.ts` sigue exportando
   solo rutas.
9. **Línea base** — **cumplido; las cuatro medidas corridas enteras por mí**:
   - `pnpm typecheck` → limpio, sin salida.
   - `pnpm lint` → `✖ 14 problems (14 errors, 0 warnings)`, en los mismos
     cuatro archivos preexistentes (`SteppedModal`, `Tabs`, `toast.context`,
     `test/render`). Ninguno en archivos de esta tajada.
   - `pnpm test` → `Test Files 1 failed | 63 passed (64)` · `Tests 2 failed |
     485 passed (487)`. El único archivo rojo es `SearchSelect.test.tsx`, el
     de siempre. 426 → 487 = **+61 tests, 0 fallos nuevos**.
   - `pnpm build` → `dist/assets/index-B8e6cbwQ.js 817,63 kB │ gzip 250,64 kB`
     — **idéntico al byte** a la línea base tras la tajada 1, con `app-icons`
     en 620,20 kB perezoso e `IconPicker` en 4,64 kB. Comprobé además que
     `graphql` **no se coló**: está en `devDependencies`, el único archivo de
     `src/` que lo importa es `contracts.test.ts`, y `buildSchema`/
     `GraphQLSchema` no aparecen ni una vez en el chunk servido.
1–5 y 10. **No son de esta tajada** (tajada 1; el 10 sigue pendiente del
   recorrido del usuario).

**Que el código viejo no se copió a ciegas** — comprobado campo a campo:
- **Nada de tareas ni de standup** en documentos ni tipos: búsqueda literal de
  `todoFolder|linkedTodo|activityPendingTodos|standup|bitácora|tiptap` sobre
  `src/features/vida/`. Las únicas coincidencias están en el **SDL
  vendorizado** (donde *deben* estar: es el esquema real del backend) y en las
  aserciones del test que las prohíbe. Ni un documento, ni un tipo, ni un api.
- **Lo que sí entró**: `subtasks`/`subtasksCount` en `Activity` (tipos L43-44 y
  selección `subtasksCount { total completed }` en `activities.graphql.ts`);
  `sessionSubtasks`/`sessionSubtasksCount` + `isOpen`/`endTime`/`endDate`/
  `endDateTime` en `ActivityFollowUp` (tipos L32-39 y en `FOLLOW_UP_FIELDS`);
  `clientId` en los inputs Add/Start y `subtaskIds` en Start (L51, L60, L62).
- **Comparado con el punto de partida**:
  `git show 79bece0:src/features/activities/graphql/activity-followups.graphql.ts`
  → el `FOLLOW_UP_FIELDS` viejo terminaba en `linkedTodoId` y existía un
  `FOLLOW_UP_LINKED_TODO_FIELDS`; en el nuevo **ambos han desaparecido** y en
  su lugar está `sessionSubtasksCount { total completed }`. Es poda
  deliberada, no copia.

**Qué rompió cerca** (cómo lo busqué, no solo el resultado):
- **`graphify explain`** sobre las claves de consulta devolvió solo el nodo de
  documentación (`docs/activities-domain.md`), no los símbolos de código: el
  grafo no tiene nodo para `query-keys.ts` con ese vocabulario, así que **el
  grafo no sirvió aquí** y lo digo en vez de apoyarme en un «no encontrado».
  Lo resolví con búsqueda literal de importadores.
- **Quién más usa `src/shared/api/query-keys.ts`** (el sospechoso número uno
  del constructor): 15 archivos. Fuera de Vida, los ocho importadores traen
  `habitKeys` (seis hooks de hábitos), `habitKeys, settingsKeys`
  (`useUserSettings.ts`) y `authKeys` (`useProfileQuery.ts`). El
  `git diff` del archivo toca **exclusivamente** el bloque `activityKeys` →
  `vidaKeys`: `habitKeys`, `settingsKeys`, `authKeys` y las nueve fábricas
  huérfanas restantes están intactas, línea por línea. Ningún importador de
  fuera de Vida ve un solo cambio.
- **`activityKeys` no tenía importadores y sigue sin tenerlos**: cero
  coincidencias en `src/`. El riesgo que el constructor dejó anotado («si
  alguna sesión paralela añadió uno») no se materializó.
- **La barra de la tajada 1 y el estrechamiento `icon: AppIconName`**: el
  `git diff` de `app-nav.config.ts` son exactamente **dos líneas** (quitar
  `| string` en `AppModuleSection` y en `AppModuleSettingsLink`), sin tocar
  datos. Lo importan solo `AppLayout.tsx` y `app-nav.config.test.ts`. Corrí
  los tests de la tajada 1 aparte (`src/layouts/AppLayout` +
  `src/features/vida/routes`): **8 archivos, 78 tests, todos verdes**. Y el
  `typecheck` está limpio, que es donde se habría caído un nombre de icono mal
  escrito.
- **Ningún guard ni cliente duplicado**: `isAuthenticated`/`useAuthBootstrap`
  aparecen en producción de Vida **solo** en `useVidaQueryGuard.ts`. Ningún
  archivo de Vida importa `@/features/todos`, `tiptap` ni
  `@/features/weekly-routine`.
- **La trampa de los timers** que el constructor dejó escrita: corrí los ocho
  archivos de Vida + barra por separado → `Duration 7,96s`, de los cuales
  **`tests 2,06s`**. Ningún `waitFor` colgado. La suite entera tardó `54,66s`
  con 487 tests; el coste de esta tajada son los ~2 s de sus propios tests.

**Las tres desviaciones declaradas** — las tres razonables:
1. **Los cuatro bloques no literales del SDL** — correcta y, además,
   *necesaria*: el módulo solo trae `extend type`, y sin la base `buildSchema`
   no levanta. Está documentada en la cabecera del archivo con origen y fecha,
   y verifiqué que el `diff` no esconde nada más. Que `Todo`/`TodoFolder`
   entren reducidos a `{ id: ID! }` es lo mínimo imprescindible para que el
   esquema cierre, y no abre la puerta a seleccionarlos.
2. **`getCurrentWeekRange` reescrito sobre `getMondayOfWeek`** — correcta y
   **equivalente**, no solo parecida: abrí el original en `79bece0`, y
   `getWeekDaysForDate` empieza por `getMondayOfWeek(anchor)` y devuelve siete
   días consecutivos, así que `days[0]`/`days[6]` son el mismo lunes y domingo
   que calcula la versión nueva. Lo único que se deja atrás son las etiquetas
   de UI. El test cubre el cruce de mes (`2026-09-28` → `2026-10-04`).
3. **El test de dientes con `spentTimeSeconds` en vez de `todoFolders`** —
   correcta, y es el detalle que más me convenció del conjunto: `todoFolders`
   **sí** existe en el esquema real (lo vi en el SDL, L138), así que un test de
   dientes construido sobre él habría pasado en verde sin probar nada. Usar un
   campo que de verdad no existe, y fijar el mensaje literal del validador, es
   la versión que funciona.

**Estados sin construir:** esta tajada **no tiene superficie**, así que
*vacío*, *cargando*, *texto largo* y *móvil* **no aplican**: no hay nada que
pintar. De los que sí tienen análogo en capa de datos:
- **Sin permisos** — *cubierto*: `useVidaQueryGuard` (`isReady &&
  isAuthenticated`) apaga las consultas sin sesión, en un solo sitio, y los
  tests de hooks lo ejercitan.
- **Error** — **hallazgo, no motivo de devolución**: los hooks no tienen
  `onError`; una mutación que falle no avisa al usuario (los `toast` son solo
  de éxito). Es **exactamente lo que hace `useHabits.ts`**, la implementación
  de referencia que fijó el arquitecto, y el constructor lo declaró. Queda
  escrito para quien construya la primera pantalla de Vida (F1): ahí el estado
  de error deja de ser opcional.
- *Hallazgo menor*: `documentsOf()` filtra los exports por `typeof === 'string'`;
  si algún día un documento se exportara como `DocumentNode`, se saldría de la
  red en silencio. Hoy la lista literal de 18 nombres lo taparía, porque es un
  `toEqual` exacto. No hay que tocar nada; solo saberlo.

**¿Duplica algo que ya existía?** (contra la sección 2) **No.** El «What NOT
to create» del arquitecto se respetó punto por punto: no hay otro cliente
GraphQL (los tres `api` usan `graphqlRequest`), no hay otro guard (uno solo,
`useVidaQueryGuard.ts`), `activityKeys` se **sustituyó** en vez de quedarse al
lado, y no entró nada de `activity-time.utils.ts` salvo las seis funciones de
fecha que la capa de datos necesita — con el archivo diciendo de dónde salen y
pidiendo que F2/F3 re-exporten en vez de volver a copiar. La duplicación real
que queda (`vida-date.utils.ts` vs. `getTodayString` de hábitos) está declarada
por el constructor y es consecuencia de la regla *feature-first* que el propio
arquitecto escribió: no es una duplicación que nadie haya visto.

**Veredicto: accepted** — porque los tres criterios de la tajada (6 en su
parte, 8 en su parte, 9) están cumplidos con evidencia reproducible, la
validación de contratos es real y completa (18 de 18 documentos, SDL idéntico
al del backend salvo los cuatro bloques declarados), no encontré ninguna
regresión en lo que comparte con hábitos y la barra de la tajada 1 sigue
verde. La feature **sigue abierta**: queda la tajada 3.

**Para el usuario:** nada que probar a mano en esta tajada. No hay pantalla ni
recorrido nuevo: lo que existe ahora es el andamiaje de datos del módulo Vida
—actividades, categorías y registros de tiempo— escrito y verificado contra el
esquema de verdad de tu backend, para que cuando F1 pinte la primera lista no
se descubra entonces que un campo no existía. El recorrido pendiente sigue
siendo el de la tajada 1 (criterio 10), escrito más arriba.

### Slice 3

**Criterios, uno a uno** (contra la sección 1, no contra el resumen del
constructor). Entorno: `docs/features/ENVIRONMENT.md` leído y **no
modificado**. Esta tajada no tiene superficie visible: no abrí navegador, no
entré con credenciales y no toqué la API ni el repo hermano (solo lectura de
su esquema).

7. **Capas de datos nuevas de plan del día (`activityDayPlan*`) y de Vida
   (`vidaItems`, `vidaSuggestionsForDate`, `vidaTakenToday`, `vidaItem*`,
   `vidaMarkTakenToday`) con tipos, hooks y query keys, con tests contra esos
   esquemas** — **cumplido**.
   - *Un solo esquema con los tres SDL, no tres sueltos*: `contracts.test.ts:28`
     es `buildSchema([activitySdl, activityDayPlanSdl, vidaSdl].join('\n'))`.
     Si las referencias cruzadas (`Activity`, `DateTime`) no resolvieran,
     `buildSchema` reventaría antes del primer `it`.
   - *Ningún documento fuera de la red*: conté los exports de los cinco
     `*.graphql.ts` — 6 + 5 + 7 (tajada 2) + 5 + 8 (nuevos) = **31** — y la
     lista literal que el test fija con `toEqual` tiene **los mismos 31
     nombres**. 18 + 13 = 31, cuadra.
   - *Los SDL nuevos son copia literal, comprobado a máquina*: extraje las
     cadenas `gql` de
     `~/Developer/xavi-platform-node/src/graphql/modules/activity-day-plan/activity-day-plan.schema.ts`
     y `.../vida/vida.schema.ts` y las comparé con lo vendorizado quitando solo
     la cabecera de comentarios → **`IDENTICO` las dos** (75 y 92 líneas, diff
     vacío). No es «parecido»: es el mismo texto.
   - *La comprobación tiene dientes también aquí*: el caso `frecuencia` sobre
     `VidaItem` fija el mensaje literal del validador.
   - Tipos, `api`, hooks y keys en su sitio; 14 tests de hooks propios (7 + 7).
8. **Cada conjunto de query keys expone sus funciones de invalidación y existen
   antes de que ninguna pantalla las consuma** — **cumplido del todo** (la
   tajada 2 cerró su parte). Comprobé las tres reglas de la decisión 4 del
   encargo contra el código, no contra el resumen:
   - *Plan del día → solo esa fecha*: `invalidateDayPlanQueries` invalida
     `vidaKeys.dayPlan.byDate(date)` y nada más; los cuatro tests lo fijan con
     `toEqual([...])` — lista exacta y ordenada, incluido el caso de fecha con
     hora (`2026-09-19T…` → `2026-09-19`).
   - *`VidaItem` → lista y sugerencias de cualquier fecha*:
     `invalidateVidaItemQueries` invalida `vidaKeys.items.all()`, y `list`,
     `suggestions(*)` y `takenToday(*)` cuelgan de esa raíz
     (`query-keys.ts`), así que el prefijo las arrastra. El test de prefijo no
     confía en React Query: compara los primeros elementos de cinco claves
     distintas contra la raíz.
   - *Marcar/desmarcar → `takenToday(date)` y `suggestions(date)` de esa
     fecha*: `invalidateVidaTakenTodayQueries`, y los dos tests fijan la lista
     **en ese orden** con `toEqual`. Desmarcar invalida exactamente lo mismo
     que marcar.
   - *Todo en un solo archivo*: `invalidateQueries` aparece en
     `src/features/vida/` únicamente en `utils/invalidate-vida-queries.ts` y en
     los `spyOn` de los cinco tests de hooks. Ninguna copia privada dentro de
     un hook (que es el bug que traía el código de `79bece0`).
   - *Keys definidas una sola vez*: `dayPlan`/`items`/`suggestions`/
     `takenToday` solo existen en `src/shared/api/query-keys.ts`, dentro de
     `vidaKeys`.
   - *Sin pantalla que las consuma*: ningún archivo de `pages/` importa nada de
     esto; el `git status` no toca los cuatro cascarones.
9. **Línea base no peor** — **cumplido**. La corrí entera por mi cuenta, no la
   di por buena:
   - `pnpm typecheck` → limpio (`rc=0`, sin salida).
   - `pnpm lint` → `✖ 14 problems (14 errors, 0 warnings)`, los mismos cuatro
     archivos preexistentes (`SteppedModal`, `Tabs`, `toast.context`,
     `test/render`). **Ninguno de esta tajada.**
   - `pnpm test` → `Test Files 1 failed | 65 passed (66)` · `Tests 2 failed |
     528 passed (530)`. El único rojo sigue siendo `SearchSelect.test.tsx` ×2,
     preexistente. 487 → 530 = **+43 tests, 0 fallos nuevos**.
   - `pnpm build` → `dist/assets/index-B8e6cbwQ.js 817.63 kB │ gzip: 250.64 kB`:
     **el mismo hash de contenido** que dejó la tajada 2 (`index-B8e6cbwQ`,
     verificado en la revisión anterior) — el paquete servido es byte a byte el
     mismo. `grep buildSchema dist/assets/index-B8e6cbwQ.js` → **0**, y ningún
     `.js` de `dist/` contiene `GraphQLSchema`: `graphql` sigue siendo
     `devDependency` y su único importador en `src/` es `contracts.test.ts`.
   - *La trampa de los timers no se disparó*: `pnpm test` tardó **47,3 s**
     (48,2 s de reloj) frente a los ~40–45 s de base, con 43 tests más. Los dos
     tests nuevos usan `vi.useFakeTimers({ shouldAdvanceTime: true })` y
     restauran con `vi.useRealTimers()` en el `afterEach`: no hay cuelgue.
10. **No es de esta tajada** y **sigue pendiente del usuario**: es el recorrido
    real con sesión de la tajada 1. Ningún agente lo puede cerrar.
Los criterios 1–5 son de la tajada 1; el 6, de la 2.

**Sobre las dos desviaciones declaradas — las juzgo yo:**

- *No invalidar `dayPlan.all()`*: **correcta, y además comprobable en el
  esquema**. Busqué el caso que la rompería —una operación que mueva un bloque
  de un día a otro— y **no existe**: `activityDayPlanSet(input{date, items})`
  reemplaza atómicamente **una** fecha, `activityDayPlanItemAdd` recibe `date`,
  `activityDayPlanItemEdit` recibe `itemId, startTime, endTime, orderIndex,
  isCompleted` — **sin campo `date`**, así que un ítem no puede cambiar de día —
  y `activityDayPlanItemRemove` solo `itemId`. Mientras el backend no añada una
  fecha al input de edición, ninguna mutación de una fecha afecta a otra.
  Invalidar `all()` sería refetch gratis de días que nadie tocó. Se queda como
  está. *Anotado para F2*: si algún día `ActivityDayPlanItemEditInput` gana
  `date`, esta regla deja de valer y hay que invalidar las dos fechas — el hook
  ya usa la fecha de la **respuesta**, que es la nueva, no la vieja.
- *`activity` tipado como `ActivityFollowUpActivityRef` y no como `Activity`*:
  **correcta en la forma**. Comparé el tipo (`id, title, description?,
  category?{id,name,color,icon}`) con lo que seleccionan los documentos
  (`DAY_PLAN_ACTIVITY_FIELDS` y `VIDA_ITEM_ACTIVITY_FIELDS`): **coinciden campo
  a campo**. Tipar `Activity` entera prometería datos que no llegan, que es el
  error caro. El nombre arrastra «FollowUp» y ya sirve a tres módulos: hallazgo,
  no motivo de devolución.

**Qué se rompió alrededor** (cómo busqué, no solo el resultado):

- *Empecé por donde el constructor dijo que más probablemente había roto*:
  `src/shared/api/query-keys.ts`. `git diff` del archivo: **un solo hunk, 15
  líneas, todas `+`, todas dentro de `vidaKeys`**. `habitKeys`, `settingsKeys`,
  `authKeys` y las nueve fábricas huérfanas: sin tocar, ni una línea. Los
  importadores del archivo son 19 (`useHabits`, `useHabitFollowUps`,
  `useHabitCategories`, `useHabitMeasures`, `useHabitPurposes`,
  `useHabitIdentityClaim`, `useUserSettings`, `useProfileQuery` y los de Vida):
  todos sus tests están en los 65 archivos verdes.
- *El otro sospechoso declarado*: `contracts.test.ts` ahora carga los tres SDL.
  `git diff` del archivo: **68 líneas añadidas, 2 quitadas** — y las dos
  quitadas son la línea de `buildSchema(activitySdl)` y una de comentario.
  **No se relajó ninguna comprobación de la tajada 2**: los 18 documentos viejos
  siguen en la lista `toEqual` y siguen pasando por `validate` contra un esquema
  que ahora es más grande, no más permisivo.
- *`invalidate-vida-queries.ts`*: `git diff` es **36 líneas, todas `+` al final
  del archivo**. `invalidateFollowUpQueries`, `invalidateActivityQueries`,
  `invalidateActivityCategoryQueries` y `toFollowUpDateKey` quedan intactas, así
  que las tres mutaciones de follow-ups de la tajada 2 invalidan lo mismo que
  antes (sus tests lo confirman).
- *El grafo*: `graphify explain "invalidate-vida-queries"` da grado 8, todo
  `contains` de sus propias funciones y **ningún importador fuera de Vida** —
  coherente con el `grep`. Ojo con el matiz: el constructor corrió `graphify
  update .`, así que el grafo refleja el árbol **después** del cambio; para «¿de
  quién dependía esto antes?» me apoyé en `git diff` y en la sección 2, no en el
  grafo.
- *Lo que vive al lado en pantalla*: nada. Esta tajada no añade ni toca ningún
  componente, página o ruta; las cuatro páginas cascarón de la tajada 1 y
  `AppLayout` no aparecen en el `git status`. La barra de módulos y `⌘K` siguen
  verdes en la suite.
- *Fuga de dependencia*: el riesgo real de esta tajada era que `graphql` se
  colara al paquete servido. Medido arriba: mismo hash, `buildSchema` 0
  ocurrencias en `dist/`.
- **No encontré ninguna regresión.**

**Estados que nadie construye:** esta tajada **no tiene superficie**, así que
*texto largo*, *móvil (375px)* y *lista vacía* no aplican todavía — son de F1 en
adelante, cuando haya pantalla. De los que sí aplican a una capa de datos:

- *Sin permisos*: cubierto. Las cuatro consultas nuevas pasan por
  `useVidaQueryGuard` y no salen a la red sin sesión lista; hay test de que sin
  fecha tampoco consultan.
- *Cargando*: **hallazgo**, no defecto de esta tajada. Una query deshabilitada
  por el guard se queda en `isPending` para siempre con `fetchStatus: 'idle'`;
  quien pinte la primera pantalla (F1) debe mirar `fetchStatus` y no solo
  `isPending`, o enseñará un spinner eterno al no haber sesión. Es el mismo
  comportamiento que los hooks de hábitos, así que no es una desviación: es una
  trampa que conviene tener escrita antes de F1.
- *Error*: **hallazgo repetido y aceptado**. Ningún hook tiene `onError`; una
  mutación que falle no avisa. Ya lo dejó escrito el revisor de la tajada 2, el
  constructor lo repitió y es decisión del usuario aplazarlo a F1. Lo dejo
  anotado por tercera y última vez: **F1 no puede salir sin estado de error**.
- *Hallazgo menor*: `useRemoveDayPlanItemMutation` depende de que quien llama le
  pase la fecha (la mutación devuelve `Boolean!` y no la trae). Si F2 le pasa
  una fecha vacía o equivocada, no se invalida nada y el plan se queda rancio.
  Está documentado en el hook y probado; queda dicho para quien lo use.

**¿Duplica algo que ya existía?** (contra la sección 2) **No.** El «What NOT to
create» se respetó: los dos `api` nuevos usan `graphqlRequest` de
`@/shared/api/graphql-client` (no hay segundo cliente), los cinco hooks de
consulta usan `useVidaQueryGuard` (no hay guard inline), las keys nuevas entran
en `vidaKeys` dentro de `src/shared/api/query-keys.ts` (no hay
`vida-keys.ts` en la feature), las invalidaciones están en el archivo único, y
los tipos **reusan** `ActivityFollowUpActivityRef` de la tajada 2 en vez de
copiar una tercera definición de la actividad corta. No entró nada de
`activity-time.utils.ts` ni ningún timer. Comprobado contra la sección 2 y el
historial (`b8d3a8d` y anteriores), sin revertir el árbol.

**Veredicto: accepted** — los tres criterios de la tajada (7, 8 y 9) están
cumplidos con evidencia reproducible: 31 de 31 documentos validados contra un
esquema real construido con los tres SDL, los dos SDL nuevos idénticos byte a
byte a los del backend, las tres reglas de invalidación fijadas con listas
exactas y ordenadas, y una línea base que no empeora en ninguna de las cuatro
medidas — con el paquete servido idéntico al de la tajada anterior. No encontré
regresiones en `query-keys.ts` ni en los archivos de la tajada 2 que esta tocó.
Las dos desviaciones declaradas son correctas y quedan razonadas arriba;
`vidaUnmarkTakenToday` está dentro del alcance («`vidaItem*`» y el par
marcar/desmarcar) y no se devuelve por ello.

Con esto **la feature queda `delivered`**: las tres tajadas revisadas y
aceptadas. Lo único abierto es el **criterio 10**, que no es de ningún agente:
el recorrido real con sesión de la tajada 1.

**Para el usuario:**

Ya tienes el módulo **Vida** dentro de la app: en la barra de arriba aparece un
selector con «Hábitos · Vida», y al elegir Vida la app cambia de sitio sin
recargar — con sus cuatro secciones, Hoy, Plantilla, Revisión y Actividades,
todavía como títulos vacíos a la espera de sus pantallas. También puedes llegar
a cualquiera de ellas desde el buscador de comandos, igual que haces con las de
hábitos. Nada de lo que ya usabas cambió: tus hábitos, tu ficha, el tema y tus
atajos siguen exactamente donde estaban.

Por debajo, y esto es lo que hace que las fases siguientes no se atasquen, queda
escrito y comprobado todo el trato con tu servidor para lo que viene: tus
actividades y sus categorías, el registro de lo que haces y cuánto dura, el plan
de cada día y la plantilla de lo que querrías repetir cada semana, con lo que ya
«tomaste» hoy. Todo eso está verificado contra el esquema de verdad de tu API —
copiado literal de tu backend— así que cuando la primera pantalla de Vida pida
datos no vamos a descubrir entonces que un campo no existía. Por ahora ninguna
pantalla llama a nada: es andamiaje, deliberadamente.

**Para probarlo a mano** (es el criterio 10, el único que falta y que solo
puedes hacer tú, porque está detrás de tu sesión):

1. Entra en la app con tu cuenta, como siempre.
2. En la barra de arriba, junto a la marca, elige **«Vida»** en el selector de
   módulo.
3. Comprueba que llegas a **Hoy** y que ves las cuatro píldoras: Hoy,
   Plantilla, Revisión y Actividades. Entra en cada una: debe salir su título y
   nada más — eso es lo correcto en esta fase.
4. Abre el buscador de comandos (`⌘K` / `Ctrl+K`) y comprueba que están «Ir a
   Hoy», «Ir a Plantilla», «Ir a Revisión» e «Ir a Actividades», y que te
   llevan donde dicen.
5. Vuelve a **«Hábitos»** y confirma que todo sigue igual que antes: Mi día,
   Mis hábitos, Archivados, el popover de Ajustes, tu ficha de usuario y el
   tema.
6. Míralo también en el móvil (o estrechando la ventana): el selector de módulo
   se queda arriba junto a la marca y las píldoras de sección debajo, sin
   desbordar a lo ancho.

Si algo de eso no se comporta así, es de la tajada 1 y vuelve al constructor
con lo que hayas visto.
