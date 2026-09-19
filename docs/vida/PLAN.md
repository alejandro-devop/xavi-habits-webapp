# Vida — el plan

> **Estado:** plan escrito, pendiente de arrancar la ejecución.
> **Pedido por el usuario el 2026-09-18:** «Como siempre me soñé el módulo de actividades y follow-ups: es más como una plantilla de mi vida, donde planeo día a día lo que voy a hacer y puedo seguir la plantilla o registrar lo que se sale, y al final del día evaluar cómo me va. Con el tiempo el sistema entiende y me ayuda mejor a planear.»
> **Regla de ejecución:** nada de esto se construye en la conversación donde se planeó. Se construye con los agentes (`forja` para las features, renders aprobados antes de cada pantalla, `xavi-builder` solo para rediseño puro).

## La idea en una frase

No es un *time tracker*. Es un **bucle de cuatro pasos que se repite cada día**:

```
PLANEAR  →  VIVIR  →  REVISAR  →  APRENDER
 el día      seguir el      cómo fue      el sistema
 desde la    plan o         el día        planea mejor
 plantilla   registrar lo   frente al     la próxima vez
             que se sale    plan
```

El *time tracker* que existía era solo el paso 2. Los otros tres son lo que lo convierte en «la plantilla de mi vida».

## Lo que el API ya tiene — y es casi todo

Esto es lo que cambia el tamaño del trabajo: **el backend ya modela los cuatro pasos**. No hay que tocarlo para la primera versión completa.

| Paso | Módulo del API | Qué da |
|---|---|---|
| **Plantilla de mi vida** | `vida` | `VidaItem` = una actividad × los días de la semana en que toca. `vidaSuggestionsForDate(date)` dice qué toca hoy y qué ya se tomó. |
| **Planear el día** | `activity-day-plan` | `ActivityDayPlanItem` = bloque planificado con hora de inicio y fin, orden y `completedAt`. `activityDayPlanSet` reemplaza el día entero; `ItemAdd` es «tomar desde Vida». |
| **Vivir el día** | `activity` (follow-ups) | Sesión abierta única, cronómetro, registrar tiempo pasado, editar, **subtareas por sesión** (progreso dentro de una ejecución), `linkedTodoId`. |
| **Revisar el día** | `activity` (follow-ups) + derivaciones | `activityDayFollowUps`, `activityFollowUpsInDates`. Métricas del día se derivan en cliente, como ya hacía la web. |
| **Aprender** | — | **Nada en backend.** `vidaSuggestionsForDate` es por día de la semana, no por historia. Lo que «entiende» hay que derivarlo en cliente de plan + real de las últimas semanas. |
| Catálogo | `activity`, `activityCategories` | Actividades con estado, prioridad, categoría, fecha, **subtareas**. |

Fuera del bucle pero en el mismo módulo del API, y **hay que decidir qué hacer con ellos** (ver abajo): `standup` (kanban de equipo), `todoFolders`/`linkedTodo` (el módulo de tareas que borramos), `isWorkout`/`workoutExerciseIds` (entrenamiento — hoy tiene su propia app, `xavi-active-api`).

## Lo que la web ya tuvo — y se puede rescatar de git

El módulo borrado en la fase 11 sigue en `79bece0`. **No todo se resucita, pero mucho sí**:

| Se rescata (adaptándolo a Aura) | Líneas | Por qué |
|---|---|---|
| `graphql/`, `api/`, `hooks/` de actividades, categorías y follow-ups | ~1.200 | Contratos correctos y con tests. |
| `activity-time.utils.ts` | 494 | Huecos libres, alturas de timeline, validaciones de tramo. Puro, testado. |
| `activity-day-metrics.utils.ts`, `activity-category-metrics.utils.ts` | 288 | Aprovechado / libre / por categoría. Puro. |
| `useElapsedTimer`, `useRemainingDayTimer`, `useCurrentTimeMarker` | pequeños | El cronómetro correcto (`Date.now()`, no acumulado). |
| Los modales de sesión: iniciar, finalizar, registrar pasado, editar, desde hueco | ~800 | Flujo UX ya pensado y probado a mano. |

| No se rescata | Por qué |
|---|---|
| `StandupPage`, `StandupWeekPage`, kanban (~1.100) | Es otro producto (equipo). Decisión del usuario, ver abajo. |
| `ActivityBitacoraModal` | Dependía de `MarkdownEditor`/tiptap, que se fue. Las notas son texto plano en el API. |
| `DayUsageWidget` tal cual | Su métrica central se llamaba **«desperdicio del día»**. Ver «La regla que se hereda de hábitos». |
| Todo lo que toca `todos` | El módulo de tareas no existe en la web. |

No había nada de **plan del día** ni de **Vida** en la web: eso es nuevo de verdad.

## La regla que se hereda de hábitos

En hábitos aprendimos que **la culpa predice el abandono** (ver `proposito-de-habito-no-funciono` y la fase 10). El viejo *tracker* medía el «desperdicio del día» y lo pintaba en rojo. Eso no vuelve.

La revisión del día compara **plan frente a real** y nombra las cosas por lo que son: *seguido*, *añadido*, *no hecho*, *sin registrar*. «Sin registrar» no es «desperdiciado»: es tiempo del que no hay dato, y el sistema no adivina. Si el usuario quiere llamarlo de otra forma, lo escribe él. Toda cifra que hable de fallo lleva al lado la que habla de vuelta.

## Decisiones ya tomadas (para no re-litigarlas)

1. **El módulo se llama «Vida».** Es como lo llama el usuario y como lo llama el API. Hábitos ya tiene «Mi día»; el día de Vida se llama **«Hoy»**.
2. **Vuelve un segundo módulo a la app**, así que la barra única de la fase 11 necesita **cambiar de módulo**: Hábitos · Vida. Es lo primero que se construye, con render.
3. **Backend intocable en la v1.** Todo lo que no dé el API se deriva en cliente; lo que no se pueda derivar se anota como hueco, no se inventa.
4. **Las notas de sesión son texto plano.** No vuelve tiptap.
5. **Sin arrastrar y soltar en la v1.** No hay `dnd-kit` y no vuelve por esto: el plan del día se ordena por hora, y la hora se edita. Si más adelante duele, se decide entonces.
6. **Renders antes de cada pantalla nueva**, aprobados por el usuario. Sin render aprobado no se abre la construcción de esa pantalla.
7. **La web es el piloto** (ver `web-como-piloto-flutter-despues`): velocidad sobre pulido, y nada que no sea portable a Flutter sin rehacer la pantalla.

## Decisiones que son del usuario

Van con recomendación. Si no dice nada, se sigue la recomendación.

| # | Pregunta | Recomendación |
|---|---|---|
| A | **Standup** (kanban de equipo, carry-over, resumen diario): ¿entra en Vida, es otro módulo, o se queda fuera? | **Fuera de este plan.** Es un producto de trabajo en equipo, no de la vida propia. Si vuelve, es su propio plan. |
| B | **Tareas** (`linkedTodo`, `todoFolders`): el API las enlaza a sesiones y actividades, pero la web ya no tiene tareas. | **Se ignoran en la v1.** Las sesiones no enlazan tareas. Traer tareas de vuelta es otro módulo. |
| C | **Entrenamiento** (`isWorkout`, sesiones con series): ¿lo pinta Vida? | **No.** Tiene su propia app y su propio API. Vida solo muestra que la actividad es de entrenamiento; la sesión con series vive allí. |
| D | **Reflexión escrita al cerrar el día.** El API no tiene una nota a nivel de día, solo por sesión. | **v1 sin reflexión libre.** La revisión es calculada. Si se quiere una nota del día, es **el único cambio de backend** que este plan pediría, y se decide después de vivir la v1 unas semanas. |

## Las fases

Cada fase es una *feature* del protocolo `forja` (un dossier `FEAT-NNN`), con sus tajadas. Se construyen **en orden y de una en una**. El estado real vive en `docs/features/BOARD.md` cuando se arranque.

### F0 — Cimientos: dos módulos en la barra, y el esqueleto de Vida

*Render: sí (la barra con cambio de módulo).*

- La barra única aprende a cambiar de módulo: **Hábitos · Vida**, cada uno con sus secciones. La ficha de usuario, `⌘K` y el tema no cambian.
- `src/features/vida/` con la estructura *feature-first* del proyecto, rutas bajo `/app/vida`, y las capas de datos rescatadas de `79bece0`: GraphQL, api, hooks y tipos de **actividades, categorías y follow-ups**, más las **nuevas** de **plan del día** y **Vida**.
- Query keys e invalidaciones escritas antes de la primera pantalla.
- `⌘K` gana los destinos de Vida.
- **Criterio que cierra la fase:** se navega entre módulos, `/app/vida` existe y renderiza un cascarón vacío, y los hooks tienen tests contra el esquema.

### F1 — El catálogo: actividades y categorías

*Render: sí, ligero (lista y ficha en Aura; el formulario reutiliza el lenguaje del wizard de hábitos).*

- Lista con filtros (estado, prioridad, categoría), crear, editar, completar, borrar.
- **Subtareas de la actividad** (nuevo en la web; el API las tiene).
- Categorías con icono y color — reutilizando `IconPickerLazy` y `HabitColorPicker` (hay que sacarlo de `features/habits` a un sitio compartido, o duplicar la paleta: decisión del arquitecto, con preferencia por compartir).
- **Criterio:** se puede crear una actividad con categoría y tres subtareas sin salir del módulo.

### F2 — Hoy: planear el día

*Render: sí, y es el render importante del módulo — comparte pantalla con F3.*

- Un día = una línea de tiempo vertical, de la mañana a la noche, con los **bloques planificados** del `activityDayPlan`.
- Añadir bloque: elegir actividad, hora de inicio, duración. Editar y quitar. Marcar hecho.
- **«Tomar desde Vida»**: las sugerencias de `vidaSuggestionsForDate` para ese día, con un toque entran al plan.
- Navegación por días (ayer, hoy, mañana); planear mañana desde hoy es el caso de uso principal.
- **Criterio:** se arma el plan de mañana en menos de un minuto partiendo de la plantilla.

### F3 — Hoy: vivir el día

*Render: el mismo de F2, con el estado «en marcha».*

- Sobre la misma línea de tiempo, **lo real al lado de lo planeado**: cada bloque planificado muestra si se está haciendo, se hizo, o quedó atrás.
- **Empezar** un bloque planificado → sesión abierta con cronómetro (y sus subtareas seleccionadas). **Terminar** → modal de cierre rescatado.
- **Registrar lo que se sale:** empezar algo no planificado, o registrar tiempo pasado. Huecos libres detectados entre registros (utilidad rescatada).
- Marcador **«Ahora»**. Sesión abierta visible desde cualquier pantalla del módulo.
- **Criterio:** un día vivido a medias entre plan y improvisación queda registrado sin que el usuario tenga que «encajar» nada.

### F4 — La plantilla Vida

*Render: sí.*

- Gestionar `VidaItem`: actividad × días de la semana × notas, activar y desactivar, ordenar.
- Vista de **semana tipo**: siete columnas con lo que toca cada día.
- Desde una actividad del catálogo, «añadir a mi Vida».
- **Criterio:** la plantilla de una semana se arma sin salir de la pantalla, y F2 la ve al instante.

### F5 — Revisar el día

*Render: sí. Aquí manda la regla heredada de hábitos.*

- Al final del día (o de cualquier día pasado): **plan frente a real**. Bloques seguidos, añadidos, no hechos. Minutos planeados frente a registrados. Por categoría.
- La **historia del día** en prosa corta compuesta con reglas (como la lectura del panel de hábitos): «Seguiste 4 de 6 bloques; lo que se salió fue X; la tarde se te fue en Y».
- Tiempo **sin registrar**, nombrado así. Sin «desperdicio».
- **Criterio:** la revisión de un día se lee en diez segundos y no contiene ninguna palabra de reproche.

### F6 — El sistema entiende

*Render: sí. Es la fase que justifica todo lo anterior y la última porque necesita datos.*

Todo derivado en cliente de plan + real de las últimas semanas; **nada de backend**:

- **Adherencia** semana a semana (plan seguido / plan total), con su tendencia.
- **Patrones por día de la semana**: a qué hora sueles empezar de verdad cada actividad frente a la hora planeada; qué actividades se te **desbordan** siempre y cuánto.
- **Al planear** (en F2): avisos con esos datos — «esto te suele llevar 40 min más», «los martes nunca empiezas antes de las 9:30». Sugerencias, no correcciones.
- **Criterio:** al planear un día, al menos un aviso útil sale de datos propios, y ninguno suena a bronca.

Lo que «aprender» **no** puede hacer sin backend, y se anota como frontera: recordar preferencias entre dispositivos, sugerencias que necesiten más historia de la que cabe traer al cliente, y cualquier modelo que no sea una regla.

## Cómo se ejecuta

1. **Arranque:** `/forja-init` en este repositorio — crea `docs/features/` con protocolo, tablero y `ENVIRONMENT.md` (puertos, qué no arrancar, comprobaciones). Hoy no existe aquí; existe en `xavi-active-api`.
2. **Por fase:** render → el usuario dice qué falla → aprobación → `feature-analyst` escribe el dossier → `feature-architect` deja rutas y referencias (aquí las referencias son **el módulo de hábitos** y **`79bece0`**) → `feature-builder` por tajadas → `feature-reviewer` acepta o devuelve → commit y publicación.
3. **Una fase a la vez.** Dos constructores a la vez se contaminan la línea base de lint y tests: ya lo comprobamos.
4. **Línea base actual:** typecheck limpio · lint 14 errores / 0 warnings · tests 2 fallando de 409 (`SearchSelect`, preexistentes) · paquete inicial 816 kB. Nadie la empeora.
5. **Verificación con sesión:** los agentes **no entran con credenciales**, nunca. Todo lo que esté detrás del login lo verifican con tests y arneses, y **el usuario hace el recorrido real** al cerrar cada fase. Es el límite estructural de todo lo que hemos hecho y no cambia aquí.

## Tamaño, en honesto

El módulo borrado tenía 12.800 líneas y 24 tests. De eso se rescata quizá la mitad. Lo nuevo de verdad son F2, F4, F5 y F6, y el cambio de barra. Es más trabajo que cualquier fase del rediseño de hábitos, y menos de lo que fue el rediseño entero.
