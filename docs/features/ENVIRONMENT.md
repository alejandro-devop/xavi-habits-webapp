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
/app/vida/hoy              Vida · Hoy          (cascarón hasta F2/F3)
/app/vida/plantilla        Vida · Plantilla    (cascarón hasta F4)
/app/vida/revision         Vida · Revisión     (cascarón hasta F5)
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

| Qué | Comando | Línea base hoy (2026-09-19) |
|---|---|---|
| Tipos | `pnpm typecheck` | limpio |
| Linter | `pnpm lint` | **14 errores / 0 warnings**, preexistentes |
| Tests | `pnpm test` | **2 fallos de 1056** (`SearchSelect` ×2, preexistentes) |
| Paquete | `pnpm build` | chunk inicial **945,6 kB** + `app-icons` 620 kB perezoso + `IconPicker` 4,6 kB |

Cerrar cada tajada con `pnpm build`, no solo con `pnpm typecheck`: son el mismo `tsc -b`, pero el estado incremental de `typecheck` dejó pasar una vez un `TS2783` que el build sí cazó (FEAT-003, tajada 3).

**La regla es «no peor que la línea base».** Los tres primeros se corren
enteros antes de empezar y al terminar; el build al terminar. Un test que se
va con su módulo baja el total y es correcto; un fallo nuevo o un error de
lint nuevo no se acepta.

Después de cambiar código: `graphify update .` (regla de `CLAUDE.md`).

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
