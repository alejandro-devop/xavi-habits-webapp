# Vida — el plan

> **Estado:** en ejecución. F0 entregada (`docs/features/FEAT-001-vida-cimientos.md`); F1 aprobada el 2026-09-19 (render `assets/05-vida-catalogo.html`; agrupado por categoría), en ejecución. El estado vivo está en `docs/features/BOARD.md`.
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

**Y empieza por lo pequeño.** Las actividades de la primera versión son las de la vida diaria: *pasear a las mascotas, organizar la casa, lavarme los dientes, bañarme, cocinar, leer un rato*. Nada de proyectos, prioridades ni fechas de entrega. Ejercicio, tareas y lo demás **se van enlazando poco a poco, después** — cada uno cuando toque y con su propia decisión.

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

El API trae también standup, enlaces a tareas y entrenamiento. **Ninguno entra ahora.** Se enlazarán poco a poco, cuando el bucle básico lleve semanas en uso.

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
3. **Backend casi intocable en la v1.** Todo lo que no dé el API se deriva en cliente; lo que no se pueda derivar se anota como hueco, no se inventa. **Excepción decidida el 2026-09-20 (FEAT-003):** la plantilla es una agenda, así que `VidaItem` gana `startTime` y `durationMinutes`, y `UserSettings` gana `vidaDayStartTime` / `vidaDayEndTime`. Nada más se toca del API en la v1.
13. **La plantilla lleva hora y duración por ítem.** «A esta hora hago esto por tanto tiempo»: el usuario no quiere «varias cosas para la mañana» que al día siguiente se ven como una lista abrumadora sin orden. El plan del día no es regla rígida: se mueve, y luego se compara planeado frente a ejecutado para ajustar la plantilla. «Armar desde la plantilla» copia hora y duración. Lo de improviso elige duración con píldoras 15 · 30 · 45 · 1h · libre.
4. **Las notas de sesión son texto plano.** No vuelve tiptap.
5. **Sin arrastrar y soltar en la v1.** No hay `dnd-kit` y no vuelve por esto: el plan del día se ordena por hora, y la hora se edita. Si más adelante duele, se decide entonces.
6. **Renders antes de cada pantalla nueva**, aprobados por el usuario. Sin render aprobado no se abre la construcción de esa pantalla.
7. **La web es el piloto** (ver `web-como-piloto-flutter-despues`): velocidad sobre pulido, y nada que no sea portable a Flutter sin rehacer la pantalla.
8. **Hoy es una agenda con presupuesto de tiempo.** Arriba, siempre, cuánto queda del día y en qué está repartido (hecho · en marcha · planeado · libre · sin dato); la guía vive en los **huecos**, que ofrecen de la plantilla solo lo que cabe. Nada de burbujas que hablan. Render: `assets/03-vida-agenda.html`.
9. **La agenda va de la mañana a la noche y abre en «Ahora».** Lo ya hecho se pliega en una línea; lo que está en marcha queda justo encima de la marca; lo que viene, debajo. Así lo más relevante está arriba sin romper el orden del día.
10. **Se planea con antelación cualquier día futuro — y no es obligatorio.** Tira de días arriba de Hoy y una vista de semana con «Armar» por día y «Armar toda la semana desde la plantilla». Un día sin plan se vive igual, registrando. Render: `assets/04-vida-planeado-ejecutado.html`.
11. **Lo ejecutado se enseña sobre lo planeado, en la misma agenda.** Cada bloque planeado se queda en su hora y muestra lo que pasó: calcado, +N min, empezó +N, −N min, no hecho, fuera del plan, sin dato, y el movido (sombra en la hora planeada, real donde ocurrió). Sin «desperdiciado».
12. **El día termina a las 23:00** por defecto (el número del viejo widget) y empieza a las 6:30. Se cambian en ajustes; el presupuesto depende de ellos.

## Lo que se enlaza después, no ahora

Por orden de probabilidad, y cada uno con su propia conversación cuando llegue:

- **Ejercicio.** El API ya marca actividades como entrenamiento; la sesión con series vive en su propia app. Enlazar es enseñar en Vida que el bloque «entrenar» existió, no traer las series aquí.
- **Tareas.** El API enlaza sesiones a tareas. La web no tiene tareas hoy.
- **Standup, reflexión escrita del día, y cualquier cambio de backend.** Después de vivir la v1.

## Las fases

Cada fase es una *feature* del protocolo `forja` (un dossier `FEAT-NNN`), con sus tajadas. Se construyen **en orden y de una en una**. El estado real vive en `docs/features/BOARD.md` cuando se arranque.

### F0 — Cimientos: dos módulos en la barra, y el esqueleto de Vida

*Render: sí (la barra con cambio de módulo).*

- La barra única aprende a cambiar de módulo: **Hábitos · Vida**, cada uno con sus secciones. La ficha de usuario, `⌘K` y el tema no cambian.
- `src/features/vida/` con la estructura *feature-first* del proyecto, rutas bajo `/app/vida`, y las capas de datos rescatadas de `79bece0`: GraphQL, api, hooks y tipos de **actividades, categorías y follow-ups**, más las **nuevas** de **plan del día** y **Vida**.
- Query keys e invalidaciones escritas antes de la primera pantalla.
- `⌘K` gana los destinos de Vida.
- **Criterio que cierra la fase:** se navega entre módulos, `/app/vida` existe y renderiza un cascarón vacío, y los hooks tienen tests contra el esquema.

### F1 — El catálogo: las actividades de tu día a día

*Render aprobado: `assets/05-vida-catalogo.html`. Decidido: **agrupado por categoría**; «ponerla en mi plantilla» con sus días también desde la hoja de crear; la duración estimada es opcional al crear y, si no se da, sale de los registros.*

- Crear una actividad es **ponerle nombre y categoría**. Nada más obligatorio. La categoría le da el icono y el color (el API no tiene icono en la actividad, sí en la categoría).
- **Puntos de partida** como los del wizard de hábitos: *Pasear a las mascotas, Organizar la casa, Lavarme los dientes, Bañarme, Cocinar, Leer, Descansar*… con su categoría sugerida. Un toque y existe.
- Categorías con icono y color — reutilizando `IconPickerLazy` y `HabitColorPicker` (sacarlo a un sitio compartido es decisión del arquitecto, con preferencia por compartir).
- Lista sencilla, editar, archivar. **Estado, prioridad y fecha programada existen en el API y no se enseñan en la v1.** Las subtareas tampoco: cuando «organizar la casa» pida pasos, se añaden.
- **Criterio:** en el primer minuto de uso hay ocho actividades cotidianas creadas sin haber escrito casi nada.

### F2 — Hoy: planear el día

*Render aprobado en dirección: `assets/03-vida-agenda.html` y `assets/04-vida-planeado-ejecutado.html` (marcos A y C).*

- **El presupuesto del día** arriba: tiempo que queda hasta el fin del día, barra del día entero con la marca de «ahora», y una línea de guía compuesta con reglas («del plan te quedan 3 bloques; la tarde está vacía de 13:30 a 19:00»).
- **La agenda** con los bloques del `activityDayPlan`, y entre ellos los **huecos libres** con su tamaño y las sugerencias de la plantilla **que caben** (filtradas por duración). Un toque las coloca al principio del hueco.
- **Añadir a un hueco** son tres preguntas: qué (plantilla primero, luego buscar), cuánto (duraciones que no caben, apagadas), cuándo. La hoja dice cuánto queda libre después.
- **Planear con antelación:** tira de días arriba (punto rayado = tiene plan), navegación a cualquier día futuro, «copiar del <mismo día> pasado», «vaciar y rehacer». Vista de **semana** con una línea por día y «Armar» en los vacíos; «Armar toda la semana desde la plantilla».
- **Criterio:** se arma el plan de mañana en menos de un minuto partiendo de la plantilla, y se puede dejar armada la semana entera en cinco.

### F3 — Hoy: vivir el día

*Render aprobado en dirección: `assets/03-vida-agenda.html` y `assets/04-vida-planeado-ejecutado.html` (marco B).*

- Sobre la misma agenda, **lo real encima de lo planeado**: cada bloque planeado se queda en su hora y enseña lo que pasó — calcado, `+N min` con la barrita plan-frente-a-real, `empezó +N`, `−N min`, `no hecho` con «Lo hice», `fuera del plan` punteado, `sin dato` con un «¿qué pasó?» que se pregunta **una vez** y acepta «dejarlo así», y el **movido**: sombra en la hora planeada con «→ hecho a las 19:40», y el real donde ocurrió.
- **Empezar** un bloque planeado → sesión abierta con cronómetro (y sus subtareas, cuando las haya). **Terminar** → modal de cierre rescatado. Al pasarse del plan, el bloque lo dice; no interrumpe.
- **Registrar lo que se sale:** empezar algo no planificado, o registrar tiempo pasado. Sesión abierta visible desde cualquier pantalla del módulo.
- El presupuesto de arriba cambia de colores al vivir el día: seguido · de más · fuera del plan · sin dato.
- **Criterio:** un día vivido a medias entre plan e improvisación queda registrado sin que el usuario tenga que «encajar» nada, y al final se lee de un vistazo qué se siguió y qué no.

### F4 — La plantilla Vida

*Render aprobado el 2026-09-20: `assets/06-vida-plantilla.html` (marcos A móvil por día, B hoja de ítem, C escritorio en siete columnas con lateral «Añadir a mi Vida», D primer minuto). Decidido: la plantilla **es una agenda** (hora + duración por ítem, decisión 13), sin arrastrar; los sin hora van en un cajón al final; desactivar ≠ quitar; los solapes no se bloquean aquí (los resuelve «Armar» en Hoy); «copiar un día a otros» sustituye al arrastre para armar la semana.*

- Gestionar `VidaItem`: actividad × días de la semana × hora × duración × notas, activar y desactivar. El orden lo da la hora.
- Vista de **semana tipo**: siete columnas con lo que toca cada día, a su hora.
- Desde una actividad del catálogo, «añadir a mi Vida».
- **Criterio:** la plantilla de una semana se arma sin salir de la pantalla, y F2 la ve al instante.

### F5 — Revisar el día

*Render aprobado el 2026-09-20: `assets/07-vida-revision.html` (marcos A un día revisado, B por categoría, C la semana con un solo puente a la plantilla, D escritorio en dos carriles, E día sin nada apuntado). Decidido: lectura en tres pasos (historia → cifra → detalle), mismo vocabulario que Hoy, «sin registrar» como magnitud propia y nunca tiempo perdido, toda cifra de lo que no salió lleva su salida al lado, la revisión termina en un solo aviso hacia la plantilla en forma de pregunta y no edita el plan del día. Aquí manda la regla heredada de hábitos.*

- Al final del día (o de cualquier día pasado): **plan frente a real**. Bloques seguidos, añadidos, no hechos. Minutos planeados frente a registrados. Por categoría.
- La **historia del día** en prosa corta compuesta con reglas (como la lectura del panel de hábitos): «Seguiste 4 de 6 bloques; lo que se salió fue X; la tarde se te fue en Y».
- Tiempo **sin registrar**, nombrado así. Sin «desperdicio».
- **Criterio:** la revisión de un día se lee en diez segundos y no contiene ninguna palabra de reproche.

### F6 — El sistema entiende

*Render aprobado el 2026-09-21: `assets/08-vida-entiende.html` (marcos A adherencia, B patrones por actividad, C avisos al planear en Hoy, D avisos en la hoja de la plantilla, E escritorio, F sin datos suficientes). Decidido: los patrones viven **dentro de Revisión** como tercera sección («Un día» · «La semana» · «Lo que se repite»), sin pestaña nueva en la barra; hacen falta **3 semanas** para que el sistema hable y con menos lo dice en vez de fingir un número; toda cifra va en **fracción** con el porcentaje pequeño al lado, nunca solo; **ningún aviso cambia nada por su cuenta** y todos son una pregunta con dos salidas, la segunda siempre escrita; una actividad cuyo patrón está bien **no propone nada y lo dice**; en Hoy el aviso va **pegado al bloque**, en violeta punteado, dos como mucho y numerados; el dato también aparece **sin pedir nada** (duración habitual en los chips del hueco, línea de confirmación bajo «Cuánto» en la plantilla); todo se deriva **en cliente** de `activityDayPlan` y `activityFollowUpsInDates` de las **últimas 6 semanas**, con las consultas que ya existen. Frontera aceptada: la plantilla tiene **una hora por ítem**, así que cuando el patrón es de un solo día la única salida es **quitar ese día**; horas por día tocaría el API y no es esta fase. Queda una decisión por fijar en el dossier: si una sugerencia contestada con «Dejarlo» **vuelve** pasadas unas semanas o **no vuelve** hasta que el usuario entre a mirar. Es la última fase porque necesita datos.*

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

El módulo borrado tenía 12.800 líneas porque hacía de todo. Esta v1 hace **una cosa**: el bucle diario con actividades cotidianas. Se rescata lo que sirve al bucle (contratos, cronómetro, métricas, modales de sesión) y se deja fuera todo lo demás. Es más trabajo que una fase del rediseño de hábitos, y bastante menos que el módulo que había.

## Después del módulo: lo que pidió el usuario usándolo

El módulo Vida se cerró el 2026-09-22 con FEAT-007. Lo que sigue **no estaba en
este plan**: sale de usar la app de verdad, y por eso vale más que lo que
habíamos previsto. Cada una con su render aprobado antes de construirse.

- **FEAT-008 — horas y minutos, y la hora de fin.** El tiempo se escribe en dos
  campos y se ve a qué hora acabas. Render `09-vida-cuanto.html`.
- **FEAT-009 — los huecos llegan a la plantilla.** El tiempo libre entre ítems,
  y un toque lo llena. Render `10-vida-huecos-plantilla.html`, **aprobado**.
- **Qué toca ahora (Hoy).** Una tarjeta arriba que cambia de cara —toca algo, se
  pasó la hora, en marcha, no toca nada— con el play delante y «Otra cosa»
  siempre al lado. Render `11-vida-hoy-empezar.html`, **aprobado el 2026-09-22**.
  *El usuario cambió de opinión sobre un diseño que ya había aprobado, después de
  usarlo: eso manda sobre el render viejo.*
- **Registrar en el hueco (Hoy).** El hueco que ya pasó se pulsa para contar qué
  hiciste, con la duración real y validado contra el hueco y contra lo **real**
  de los vecinos. Render `12-vida-hoy-registrar-en-hueco.html`, **aprobado el
  2026-09-22**.
