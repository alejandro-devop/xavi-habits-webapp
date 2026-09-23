# Environment — lo que un agente no puede deducir del código

Este archivo es de **este** proyecto (`xavi-habits-webapp`). Los agentes lo
leen antes de tocar el navegador. Cuando algo deje de ser cierto, se corrige:
un mapa viejo hace más daño que ninguno.

No hay cadena de bugs en este repositorio (`docs/bugs/` no existe): este es el
único mapa.

## Dónde corre

| Servicio | Dirección | Quién lo levanta |
|---|---|---|
| La web (Vite dev) | `http://localhost:5173` | **el usuario** — suele estar arriba todo el día |
| La API (GraphQL + auth REST) | `https://xavi-api-9om1.onrender.com` | nadie: es `xavi-platform-node` desplegado en Render (free: se duerme tras 15 min sin tráfico y tarda ~1 min en despertar). Cloud Run (`xavi-api-wqpmywszuq-uc.a.run.app`) sigue vivo como respaldo, misma base de Neon |

La API vive en otro repositorio (`~/Developer/xavi-platform-node`, el esquema
en `src/graphql/modules/`). **Casi no se toca** desde aquí: la única excepción hasta hoy es FEAT-003 (hora y duración en la plantilla). Un push a `main` de ese repo despliega a la vez a Cloud Run (con job de migraciones contra Neon) y a Render (auto-deploy, sin migraciones al arrancar): como comparten base, el job de Cloud Run migra para los dos.

**Los agentes no levantan ni paran nada.** Si el 5173 no responde, va en el
reporte y se sigue con lo que no dependa de él. Para mirar una pantalla se
abre una pestaña con `preview_start {url: "http://localhost:5173"}` — es una
pestaña, no arranca ningún servidor. Si de verdad no hay nada arriba,
`preview_start {name: "xavi-habits-web"}` arranca uno desde
`.claude/launch.json`; **como `autoPort` está activo, puede acabar en el 5174**
y el probe lo dice.

## Lo que NO se ejecuta

- `pnpm dev` a mano desde Bash: se queda en primer plano y pisa el 5173 del usuario. Solo `preview_start`.
- **`pkill`, `killall` o cualquier matanza amplia de procesos.** Ya pasó: un agente mató el servidor del usuario «limpiando el suyo». Si arrancaste algo, páralo por su `serverId` con `preview_stop`.
- `pnpm format` (reescribe el repositorio entero). `pnpm format:check` ya falla en HEAD en los archivos del catálogo de iconos; no es tuyo.
- `git stash`, `git checkout --`, `git reset`: nada que revierta el árbol.
- `pnpm build` **sí** se puede correr: escribe en `dist/`, que el dev server no sirve. Úsalo para medir el paquete.

## Cómo conseguir datos reales

**Todo lo que importa está detrás del login, y los agentes no entran con
credenciales, nunca.** Es el límite estructural de este proyecto: lo que
está en `/app/*` se verifica con tests y arneses aislados, y el recorrido real
lo hace el usuario al cerrar cada tajada. Escríbelo así en el reporte; no lo
disimules.

Lo que sí se ve sin sesión: `/` (portada), `/auth/login`, `/auth/register`,
la página de «no encontrado» en cualquier ruta retirada, y **cualquier HTML de
`docs/`** servido por Vite (`http://localhost:5173/docs/vida/assets/03-vida-agenda.html`
abre un render). Para ver un componente con datos, la vía que funciona es un
**arnés temporal** (un `.html` + un `.tsx` de entrada bajo `src/`) que renderiza
el componente con datos sintéticos y `MemoryRouter`; se borra antes de
reportar. Ya se ha hecho tres veces en este repo con buen resultado.

Los identificadores de la API (`habit.id`, `activity.id`) son UUID del
backend: no se adivinan.

## Rutas o pantallas

```
/                          portada pública (redirige a /app si hay sesión)
/auth/login  /auth/register  /auth/verify-email  /auth/forgot-password  /auth/reset-password
/app                       → redirige a /app/habits/my-day
/app/habits/my-day         Mi día
/app/habits/list           Mis hábitos
/app/habits/archived       Archivados
/app/habits/categories     Categorías      (píldora «Ajustes» del módulo)
/app/habits/measures       Medidas         (píldora «Ajustes» del módulo)
/app/habits/persona        Mi Persona      (píldora «Ajustes» del módulo)
/app/habits/:id            Detalle: Panel · Esta semana · Historial
/app/habits/:id/edit  /app/habits/:id/week  /app/habits/:id/calendar
/app/settings              Ajustes de cuenta (menú de la ficha de usuario)
/app/vida                  → redirige a /app/vida/hoy
/app/vida/hoy              Vida · Hoy          (planear y vivir el día; ?d=YYYY-MM-DD)
/app/vida/plantilla        Vida · Plantilla    (la semana tipo: por día, hoja del ítem, añadir, semana entera y copiar)
/app/vida/revision         Vida · Revisión     (el día contado y la semana: historia, cifra «N de M», plan frente a real, puente a la plantilla; ?d=YYYY-MM-DD)
/app/vida/actividades      Vida · Actividades  (cascarón hasta F1)
```

La fuente de verdad es `src/app/router/routes.tsx`,
`src/features/habits/routes/habits-paths.ts` y `src/features/vida/routes/vida-paths.ts`.
Los módulos y sus secciones (píldoras y `⌘K`) salen de `appModules` en
`src/layouts/AppLayout/app-nav.config.ts`: **una sola fuente**; no añadas destinos a mano.

## Áreas

Valores válidos del campo `area:` de un dossier:

- `features/habits`
- `features/vida` — el módulo Vida (rutas, páginas y capa de datos)
- `features/auth`
- `features/settings`
- `features/theme`
- `shared/ui`
- `shared/icons`
- `shared/api`
- `layouts` — `AppLayout` es la barra única de la app
- `app/router`

## Comprobaciones que existen

| Qué | Comando | Línea base hoy (2026-09-22) |
|---|---|---|
| Tipos | `pnpm typecheck` | limpio |
| Linter | `pnpm lint` | **14 errores / 0 warnings**, preexistentes |
| Tests | `pnpm test` | **2 fallos de 1839** (`SearchSelect` ×2, preexistentes). A veces salen **3**: `IconPicker.test.tsx > normalizes selection to stored name bell` es **flaky en la corrida completa** —el esqueleto de carga sigue en el DOM, el archivo tarda ~10 s— y **pasa 6/6 corriéndolo solo**. Visto en FEAT-014 tajada 2. Si aparece, córrelo aislado antes de culpar a tu cambio. |
| Paquete | `pnpm build` | chunk inicial **1.124,93 kB** (pasó del megabyte tras FEAT-005; el troceado es deuda propia) + `app-icons` 620 kB perezoso + `IconPicker` 4,6 kB |

Cerrar cada tajada con `pnpm build`, no solo con `pnpm typecheck`: son el mismo `tsc -b`, pero el estado incremental de `typecheck` dejó pasar una vez un `TS2783` que el build sí cazó (FEAT-003, tajada 3).

**La regla es «no peor que la línea base».** Los tres primeros se corren
enteros antes de empezar y al terminar; el build al terminar. Un test que se
va con su módulo baja el total y es correcto; un fallo nuevo o un error de
lint nuevo no se acepta.

Después de cambiar código: `graphify update .` (regla de `CLAUDE.md`).

**Trampa recurrente: los mocks de módulo de `useActivityCategories`.** Cada vez
que una mutación de categorías cambia de forma —añadir una, o pasar de `mutate`
a `mutateAsync`—, aparecen suites que **siguen en verde por casualidad**: su
`buildMutation()` no tiene el método nuevo, o el `vi.mock` del módulo no lista
el hook nuevo, y pasan solo porque esa suite no recorre el camino que lo usa.
Visto en FEAT-016 tajada 1 con `VidaActividadesPage.test.tsx` y
`VidaPlantillaPage.test.tsx`. Al tocar ese módulo, **búscalos y complétalos
aunque estén verdes**: son trampas puestas para quien venga detrás.

### El otro repositorio: `xavi-platform-node`

La tabla de arriba es **solo de este repositorio**. Cuando una tajada toca el
API (FEAT-003, FEAT-012 y FEAT-016 lo hacen), su línea base es **otra y mucho
peor**, medida el 2026-09-22 en `/home/jako/Developer/xavi-platform-node`:

| Qué | Comando | Línea base hoy (2026-09-22) |
|---|---|---|
| Tipos | `npx tsc --noEmit` | limpio, exit 0 |
| Tests | `npm test` (jest) | **3 fallos de 560**, y **6 suites de 51 en rojo** — las dos cifras no cuadran porque cuatro suites ni llegan a correr: revientan al compilar el test (`ts-jest`). Los 3 fallos reales: `syncHabitStreakFromLogs > updates streak, max_streak and days from accomplished logs`, `HabitService > addHabitLog > creates log when date is available` y `Expense Resolvers > walletExpenseUpdate > should update an expense`. Las suites que no compilan: `habit-streak`, `sleep-follow-up-sync.service`, `standup.service` (y `habit-streak` arrastra a las de hábitos) — `HabitStreakFields` ganó `habit_type`, `period_days` y `restart_count` y los tests no se actualizaron. |
| Linter | `npm run lint` | **895 problemas (583 errores / 312 warnings)**, casi todos `prettier/prettier`. **No es una puerta utilizable**: aquí la regla no puede ser «14/0» sino **no empeorar los archivos que tocas**, comparando antes y después solo en esos ficheros. Y **nunca correr `lint:fix` a lo ancho**: reformatearía medio repositorio en un commit que despliega. |

Dos cosas más de ese repositorio que ahorran turnos y no se deducen mirando por
encima: **los tests de resolvers solo existen para `expense` y `wallet`**
(`tests/unit/graphql/resolvers/`), así que un resolver nuevo no tiene vecino que
imitar salvo esos dos; y **la forma de probar una transacción** allí es el mock
de `connect()` de `tests/unit/services/activity-day-plan.service.test.ts:34-45`.

**Todo eso es preexistente y de hábitos, gastos, sueño y standup** — ninguna de
las suites rotas toca `activity_categories` ni `user_settings`, que es donde
cae el trabajo de Vida. Aun así se mide antes y después: la regla sigue siendo
«no peor que la línea base», solo que la línea base aquí ya viene rota.

**Y lo más importante de este repositorio: un push a `main` despliega Y migra.**
Verificado el 2026-09-22 leyendo `.github/workflows/deploy.yml` y el historial
de ejecuciones, porque **este párrafo dijo lo contrario durante un rato y era
falso**:

- El workflow salta con cada push a `main`, construye la imagen y **ejecuta las
  migraciones pendientes como un job de Cloud Run** (`gcloud run jobs execute
  xavi-migrate --wait`, `npm run migrate`, `--max-retries=0`) contra el
  `DATABASE_URL` del secreto `database-url`. Como **espera** y no reintenta, una
  migración que falle tumba el despliegue: no hay despliegue a medias en
  silencio.
- Solo **después** despliega Cloud Run; Render auto-despliega por su cuenta.
- `RUN_MIGRATIONS: 'false'` en `render.yaml` **no** significa «nadie migra»:
  significa que **el contenedor de Render no migra al arrancar** (no tiene
  pre-deploy en el plan free y se reinicia en cada spin-down). Migra el job de
  Cloud Run, y como **las dos instancias comparten la misma base de Neon**, migra
  para las dos.

Corolario que se dio por pendiente sin comprobarlo: **la migración 068 de
FEAT-012 ya corrió**. Viajó en `73e3c44` y su ejecución del workflow terminó en
verde (2026-09-22, 9m15s). No hay ninguna migración pendiente de correr a mano.

Lo que sigue siendo del usuario es **el push**, no la migración: despliega a dos
sitios y toca datos de producción.

**Contratos GraphQL de Vida.** `src/features/vida/graphql/contracts.test.ts`
valida cada documento del módulo con `graphql` (devDependency; **no se importa
fuera de tests**) contra el SDL vendorizado en `graphql/schema/*.schema.graphql`,
copia literal del repo hermano con fecha y origen en la cabecera. Si añades un
documento, entra en la lista del test; si el backend cambia, el SDL se recopia a
mano — nada lo compara solo, y ese es el riesgo conocido.

## Patrones vivos

Para el `feature-architect`. El módulo de hábitos es la referencia de todo:

- **Listado con filtros y tarjetas:** `src/features/habits/pages/HabitsListPage.tsx` + `components/HabitListCard/`.
- **Formulario en pasos (wizard):** `src/features/habits/components/HabitFormModal/HabitCreateWizard.tsx` y sus `HabitWizardStep1..3`. Plantillas de arranque en `data/habit-templates.ts`.
- **Detalle con métricas derivadas en cliente:** `src/features/habits/pages/HabitDetailPage.tsx` + `components/HabitPanel/` (aritmética pura en `utils/habit-panel.utils.ts`, gráficos SVG a mano, tabla oculta obligatoria en `ChartPanel`).
- **Capa de datos:** `src/features/habits/api/habits.api.ts`, `graphql/*.graphql.ts`, `hooks/useHabits.ts` con `habitKeys`. GraphQL con `graphqlRequest` (`src/shared/api/`); REST solo para auth.
- **Selectores reutilizables:** `IconPickerLazy` — importa **de `@/shared/ui/IconPicker`** (el barril exporta el diferido); importar de `@/shared/ui/IconPicker/IconPicker` se salta el lazy y mete 620 kB en el arranque. `HabitColorPicker` (`src/features/habits/components/HabitColorPicker/`, paleta en `data/habit-colors.ts` — dos niveles, núcleo y extendidos); FEAT-002 lo mueve a `src/shared/ui/ColorPicker/`.
- **Pestañas con teclado:** `src/shared/ui/Tabs/Tabs.tsx` ya existe (flechas, `role="tablist"`); no se reescriben pestañas a mano. FEAT-005 las usa para los días de la plantilla.
- **La barra de la app y las píldoras de módulo:** `src/layouts/AppLayout/AppLayout.tsx` + `app-nav.config.ts` (`createCommandActions` para `⌘K`).
- **El módulo de actividades que existió** (12.800 líneas, borrado en la fase 11) sigue en git en `79bece0`: `git show 79bece0:src/features/activities/<ruta>`. De ahí se rescatan contratos GraphQL, hooks, `activity-time.utils.ts`, métricas del día y los modales de sesión. **No se restaura entero.**
- **Lenguaje visual:** Aura — vidrio, mint `#10B981` + violeta `#7C3AED`, píldoras, ámbito `[data-ds='aura']`. Guías en `docs/design-system.md` y `docs/design-system-agent-guide.md`. Renders aprobados del módulo Vida en `docs/vida/assets/`.

## Grafo del proyecto

- Grafo: **sí** — `graphify-out/graph.json` (~1,6 MB). `graphify query/path/explain` antes de buscar a mano.
- Hook post-commit: **no**. El grafo refleja el último `graphify update .`, no el working tree ni necesariamente HEAD. Lo que no se ha commiteado no aparece.

## Trampas de este repositorio

- **La API solo admite el origen `http://localhost:5173`** (CORS). Un servidor en el 5174 abre la app pero cualquier llamada a la API falla con CORS: no es un bug tuyo.
- **`.env` no está versionado**; `.env.example` tiene la URL real de la API. Lee siempre `env.apiUrl` desde `src/app/config/env.ts`; nunca `import.meta.env` en una feature.
- **Vite en dev acumula errores de HMR si se borran muchos archivos** bajo un servidor arrancado antes. Si ves 504 «Outdated Optimize Dep» o «Failed to reload», es el servidor viejo: repórtalo; el usuario lo reinicia.
- **El barril de Font Awesome es un único módulo**: cualquier archivo que importe de `@fortawesome/free-solid-svg-icons` a pelo se lleva todos los iconos al chunk inicial. Los iconos del cromo se importan de uno en uno; el catálogo entra por `icon-registry.ts` en diferido. No rompas eso.
- **Dos constructores a la vez se contaminan la línea base** de lint y tests. Una tajada a la vez.
- **`Button variant="danger"` no se lee en tema oscuro** (blanco sobre `rgb(255,180,171)`, 1,7:1 medido en FEAT-005). Vive en `shared/ui/Button` y lo usa hábitos: deuda del sistema de diseño, no de una feature. Mientras tanto, las confirmaciones nuevas de Vida usan `secondary`.
- **`Mi día` ya es de hábitos.** El día del módulo Vida se llama **«Hoy»**. No reutilices el nombre.
- La regla de producto que manda en Vida y en hábitos: **nada de culpa.** Ni «desperdicio», ni «fallaste», ni recordar el propósito al fallar. Ver `docs/vida/PLAN.md` y `docs/remodel/06-mi-persona.spec.md`.

## Sonda

```
bash docs/features/probe.sh
```

Distingue apagado (curl rc 7) de ocupado (rc 28), comprueba la web en 5173 y
5174, la API (que no tiene `/health`: un 401 en `/api/auth/profile` y un 400 en
`/graphql` sin sesión significan que responde), el estado del repo y si hay
grafo. No arranca nada.
