---
id: FEAT-013
title: Empezar algo que ya empezó — decir a qué hora arrancó lo que sigue en marcha
status: specified
architect: no    # un campo más en una hoja que ya existe y una condición que se levanta; el API ya lo admite tal cual (ver sección 1)
area: features/vida
requested: 2026-09-22
updated: 2026-09-22
---

# FEAT-013 — Empezar algo que ya empezó

## 1. The request — feature-analyst

**Summary for whoever's next:** hoy se puede registrar un rato **terminado** y se
puede arrancar un cronómetro **ahora**, pero no se puede tener una **sesión viva
cuyo inicio esté en el pasado**. **La tajada 1 es la feature**: la hoja «Empezar
algo» pregunta **«¿a qué hora empezaste?»** con «ahora» por defecto, y con **una
sola acción** la sesión queda **en marcha** contando desde las 8:07. Las tajadas
2 y 3 son secundarias (corregir el inicio de una sesión que ya corre, y empezar
desde la hora planeada en un toque). **El API no se toca: ya admite las dos
cosas** — comprobado en el SDL y en el servicio del backend, tabla abajo.

**What problem it solves:** el usuario empieza a hacer algo y **se acuerda de la
app después** — media hora, hora y media después—. Eso no es un descuido que
haya que corregir: es como funciona empezar a trabajar. El problema es que la
herramienta **solo sabe contar desde el instante en que se pulsa el botón**, así
que quien llega tarde al botón tiene tres salidas y las tres son malas: mentir
(empezar ahora y perder la hora larga que ya lleva), esperar a terminar para
registrarlo como pasado (y quedarse sin cronómetro ni sesión viva mientras
tanto), o no registrar nada. **La consecuencia real es que el día queda peor
contado justo en los ratos más largos**, que son los que más pesan en todo lo que
vino después (F5 y F6 leen estas sesiones).

**Who it's for:** el usuario del módulo Vida, **en medio de algo que ya está
haciendo**: abre Hoy para registrar lo que lleva en marcha y quiere decir desde
cuándo. También para quien **sí pulsó Empezar** pero lo pulsó tarde y se da
cuenta al rato: hoy esa sesión no se puede corregir mientras corre.

**User's words:** (verbatim, 2026-09-22)

> «resulta que estuve trabajando desde las 8:07 am y apenas voy a registrar… no
> tengo cómo cambiar la hora de inicio al iniciar una actividad, iniciar solo
> inicia desde que presioné el botón iniciar»

Y, al proponerle «Registrar tiempo pasado» como apaño, **corrigió** (mismo día):

> «no no, no me entendiste… resulta que **sigo trabajando**, entonces quiero
> registrar que **lo estoy haciendo** pero que **empecé a otra hora**; no quiero
> registrar que lo estoy haciendo y luego registrar que lo hice (**dos
> acciones**)»

**Esa segunda frase estrecha la feature y hay que leerla literal:** lo que pide
es **una sola acción** cuyo resultado es **una sesión viva —corriendo ahora
mismo— cuyo inicio está en el pasado**. No es «dos registros que suman lo
mismo»: es *una cosa que sigue ocurriendo*, y tiene que quedar en el sistema como
una.

**Descartado, con su razón** (para que nadie lo vuelva a proponer): registrar el
trozo ya pasado (8:07 → ahora) con `log` **y además** arrancar una sesión nueva
para seguir. Son **dos acciones**, parten en dos algo que no está partido, y le
dejan el día con **dos sesiones donde hubo una** —que luego el cruce de FEAT-004
(criterio 19: cada bloque, como mucho una sesión) tendría que repartir entre un
bloque y «fuera del plan»—. **No se ofrece como salida en ninguna pantalla.**

**Lo que hay hoy, verificado en el código** (para que nadie lo vuelva a mirar):

- `components/VidaLogSessionSheet/VidaLogSessionSheet.tsx:34` — tres modos.
  **`start`** («Empezar algo») pregunta **solo qué**; **`log`** («Registrar
  tiempo pasado») pregunta **qué · a qué hora empezó · cuánto duró**; **`edit`**
  corrige una sesión que ya existe. El campo de hora se pinta con
  `mode !== 'start'` (`:254`): **`start` es el único que no lo tiene.**
- `hooks/useVidaSessionActions.ts:106-154` — `start(activityId)` construye el
  input con `startSessionInput(activityId, now)` y `now = new Date()`
  (`:119`, `:140`). La hora **no es un parámetro**: se toma del reloj.
  `utils/vida-session.utils.ts:143-149` lo dice con todas las letras.
- `components/VidaAgendaBlock/VidaAgendaBlock.tsx:203-204` —
  `blockSession = execution && !execution.isRunning ? … : null` y
  `canManageSession = Boolean(blockSession && onEditSession)`: **corregir una
  sesión solo se ofrece cuando NO está corriendo.** Confirmado.
- Las dos puertas de `start` que existen hoy: el **▶ Empezar** de un bloque
  (`pages/VidaHoyPage.tsx:678`) y la **hoja** (`:943`). FEAT-010 añadirá una
  tercera (el play de la tarjeta de arriba).

**Conclusión, escrita para que no se repita la investigación:** *lo que hoy es
imposible es exactamente «empecé a las 8:07 y sigo»*. Un rato terminado se
registra (`log`), un cronómetro se arranca ahora (`start`), pero **no existe la
sesión viva con inicio en el pasado**, ni la corrección del inicio de una sesión
en marcha.

**Qué deja hacer el API — la pregunta que era el corazón de esto. Respuesta: las
dos cosas, ya, sin tocar el backend.**

| Lo que hace falta | ¿Lo admite? | Dónde se comprueba |
|---|---|---|
| Crear una sesión **abierta** con `startTime` en el pasado | **Sí** | `graphql/schema/activity.schema.graphql:276-286`: `ActivityFollowUpStartInput` lleva `date: String!` y `startTime: String!` **obligatorios y libres**. El servidor los inserta **tal cual**, sin compararlos con el reloj: `xavi-platform-node/src/services/activity-follow-up.service.ts:308-315` (`VALUES ($1,$2,$3::date,$4::time, NULL, …)`). Lo único que valida antes es que no haya otra sesión abierta (`assertNoOpenFollowUp`, `:296`) y el `linkedTodoId`. |
| **Cambiar** el `startTime` de una sesión que sigue abierta | **Sí** | `activity.schema.graphql:288-294`: en `ActivityFollowUpEditInput` **todos los campos salvo `id` son opcionales**. `activity-follow-up.service.ts:359-377` construye el `UPDATE` campo a campo: mandar **solo** `startTime` actualiza `start_time` y **no toca `duration_minutes`**, así que la sesión **sigue abierta** (`isOpen = duration_minutes === null`, `:61`). No hay ninguna guarda que exija que el follow-up esté cerrado para editarlo. |
| Que la pantalla se entere sin recargar | **Sí, ya** | `useUpdateActivityFollowUpMutation` (`hooks/useActivityFollowUps.ts:91-104`) llama a `invalidateFollowUpQueries`, que **caduca `vidaKeys.followUps.open()`** (`utils/invalidate-vida-queries.ts:32`). Con `isOpen: true` **no** borra la sesión abierta de la caché (`:97-99`), que es justo lo que hace falta. |
| Los documentos GraphQL | **Ya piden lo necesario** | `graphql/activity-followups.graphql.ts:7-8` — el fragmento trae `isOpen` y `endTime`. **No nace ni un documento nuevo**, así que `contracts.test.ts` no crece por esto. |

**Es decir: esta feature es de cliente y es barata.** No hay nada que pedirle al
backend; lo de FEAT-012 sigue siendo lo único pendiente de despliegue.

**Out of scope:** (lo que alguien puede dar por incluido y NO lo está)

- **«Empecé ayer y sigo».** Una sesión abierta con `date` de otro día es
  exactamente lo que FEAT-004 (D3, criterios 16 y 54) trata como *sesión que
  quedó abierta de otro día*: nada más crearla, la app preguntaría «¿hasta qué
  hora la hiciste?». Crear a mano lo que el sistema está diseñado para rescatar
  sería construir dos cosas que se pelean. **Solo hoy.**
- **Corregir la hora de una sesión ya cerrada.** Eso ya existe: «Corregir» del
  «···» (`VidaAgendaBlock.tsx:240-249`) con el modo `edit` de la hoja
  (FEAT-004, criterio 35). Aquí no se vuelve a escribir.
- **Cambiar de actividad una sesión.** El API no lo admite y la hoja ya lo dice
  (`VidaLogSessionSheet.tsx:70-73`). Sigue igual.
- **Poner una hora de inicio en el futuro** («empiezo a las 18:00»). Ni agendar
  ni programar: para eso está el plan.
- **Pausar y reanudar.** Sigue fuera desde FEAT-004: el API no lo modela.
- **Dos sesiones vivas a la vez.** El API lo impide (`assertNoOpenFollowUp`) y
  esta feature no lo cambia.
- **Decir también cuánto va a durar** al empezar. Una sesión abierta no tiene
  duración; se sigue sin preguntar (FEAT-004, criterio 30).
- **Tocar el plan.** Ni mover el bloque a las 8:07, ni marcarlo, ni nada: lo real
  se pinta encima y el plan se queda quieto (FEAT-004, criterios 18 y 37).
- **Un concepto nuevo de «desfase».** Empezar a las 8:07 un bloque de las 8:00 ya
  tiene nombre y aritmética desde FEAT-004: el cruce de D1 y los umbrales del
  criterio 20 (`VIDA_ON_PLAN_TOLERANCE_MINUTES`, `VIDA_MOVED_THRESHOLD_MINUTES`).
  **No se estrena nada.**
- **Cambios en el API.** Ninguno, y está comprobado arriba.
- **Pantallas nuevas.** Todo cae en la hoja que existe, en el «···» del bloque y
  en la barra de sesión.
- **Partir el rato en dos.** Ni «registramos lo que llevas y te arrancamos otra»,
  ni un cierre automático a medias: el usuario lo descartó con esas palabras y
  está escrito arriba. **Una acción, una sesión.**
- **Que desaparezca «Registrar tiempo pasado».** Ver la respuesta más abajo: se
  queda, para lo que sí es suyo.

**«Registrar tiempo pasado» NO resuelve este caso, y no puede ofrecerse como
salida.** `log` sirve para un rato **terminado**: pide cuánto duró y cierra la
sesión. **Lo del usuario no está terminado** —sigue trabajando—, así que usarlo
obliga a las dos acciones que él descartó y deja el día con dos sesiones donde
hubo una. Escrito aquí porque es el apaño que cualquiera propondría.

**¿Entonces sobra «Registrar tiempo pasado»? No, y no se toca.** Hace algo que
esta feature no hace y seguirá haciendo falta: registrar un rato **ya cerrado**,
con duración, **en cualquier día de la tira, incluidos los pasados** (FEAT-004,
D10) y **sin ocupar la única sesión abierta**. `start` con hora deja el rato
**vivo**, contando, en el día de hoy. Se quedan las dos, cada una con su caso, y
la hoja sigue siendo **una** con sus modos.

**Acceptance criteria:**

*A qué hora empezó, al empezar (tajada 1)*

- [ ] 330. En la hoja de **«Empezar algo»** (modo `start`) aparece la pregunta
  **«¿A qué hora empezaste?»** con **«ahora» ya puesto**. Quien no la toca hace
  exactamente el gesto de hoy: elegir qué y pulsar «Empezar».
- [ ] 331. Con la hora puesta en **8:07**, la sesión se crea con
  `activityFollowUpStart` y `startTime: "08:07"` (y `date` = la fecha **local**
  de hoy), y **el cronómetro nace contando desde las 8:07**: a las 9:10 lee
  **1 h 3 min**, no 0. Recargar no lo reinicia (FEAT-004, criterio 3, que ya se
  apoya en `startTime`).
- [ ] 331b. **Una sola acción y una sola sesión**, que es lo que el usuario pidió
  con esas palabras: el gesto entero es **elegir qué · decir desde cuándo ·
  Empezar**, manda **una única mutación** (`activityFollowUpStart`) y deja en el
  día **una sola sesión, abierta**. Comprobable con espías: `activityFollowUpAdd`
  **cero llamadas**, `activityFollowUpStart` **una**. Si algún día aparece un
  camino que registre el trozo pasado y arranque otra sesión, este criterio no se
  cumple aunque los minutos cuadren.
- [ ] 332. **Sin tocar el campo, el cuerpo que se manda es idéntico al de hoy**
  —la hora del reloj—, comprobado con un test que compara el input con y sin
  campo tocado (`toEqual`). Los criterios 2 y 17 de FEAT-004 siguen ciertos.
- [ ] 333. **La validación reutiliza las frases que ya existen** en
  `validateLogPast` (`utils/vida-session.utils.ts:280`) — *«Dinos a qué hora
  empezó, con horas y minutos.»* y *«Esa hora todavía no ha llegado.»*—. **No se
  escribe ni una frase nueva** para esto. Las dos ramas de duración (*«Elige
  cuánto duró»*, *«Ese rato no ha pasado entero todavía»*) **no aplican**: una
  sesión abierta no tiene duración y no se pregunta.
- [ ] 334. **Nada del futuro:** una hora posterior a este minuto no se puede
  empezar y se dice con la frase de arriba. La hora **igual a este minuto** sí
  vale (es «ahora»).
- [ ] 335. **Solo el día de hoy.** El modo `start` solo existe en hoy (FEAT-004,
  criterio 32) y eso no cambia: no hay forma de crear desde aquí una sesión
  abierta con fecha de ayer.
- [ ] 336. **Una hora anterior al comienzo del día** (`useVidaDayHours`,
  p. ej. empezar a las 5:40 con el día empezando a las 6:30) **se admite** —hay
  gente que empieza antes— y **la pantalla no se queda callada**: o la sesión se
  ve en la agenda de Hoy, o una línea dice que ese rato queda fuera de las horas
  de tu día. Lo que **no** puede pasar es que la sesión exista, ocupe la única
  ranura abierta y **no se vea en ninguna parte**. (FEAT-012 va a mover esos
  bordes; esta feature no los define.)
- [ ] 337. **Lo real encima de lo planeado, con lo que ya hay:** una sesión
  empezada a las 8:07 sobre un bloque planeado a las 8:00 la cruza el **mismo**
  `matchSessionsToBlocks` de FEAT-004 (criterios 19 y 20) y se lee con sus
  palabras (*calcado* dentro de ±5 min, *«empezó +7»* fuera). **Ni una constante
  nueva, ni un estado nuevo del bloque.**
- [ ] 338. Si la mutación **falla**, la hoja **no se cierra y no pierde ni la
  actividad elegida ni la hora escrita**, y en la agenda **no queda una sesión
  fantasma** (FEAT-004, criterios 12 y 36).
- [ ] 339. **Con otra cosa en marcha** (FEAT-004, D4 y criterio 15), la anterior
  se cierra **a la hora de inicio de la nueva** cuando esa hora es posterior a su
  propio inicio, y se dice («Terminamos "Organizar la casa" a las 8:07»); si la
  hora elegida es **anterior o igual** al inicio de lo que está en marcha, **la
  nueva no se empieza** y se explica sin reproche, ofreciendo corregir la que
  está en marcha (tajada 2). **Nunca quedan dos sesiones abiertas, nunca se
  guarda una duración negativa y nunca se pierde la primera.** (Ver D1.)
- [ ] 340. Dos toques seguidos en «Empezar» **no crean dos sesiones** (FEAT-004,
  criterio 13: el cerrojo de `useVidaSessionActions` sigue haciendo su trabajo).
- [ ] 341. La hora viaja al API como **`HH:mm` de 24 h** por el camino que ya
  existe (`normalizeTimeForApi`), y **no se crea un segundo formateador de
  horas**.

*Corregir la hora de lo que ya está corriendo (tajada 2)*

- [ ] 342. Una sesión **en marcha** ofrece **«Empecé antes»** (o el rótulo que se
  elija, sin culpa) desde **el «···» del bloque en marcha** y desde **la barra de
  sesión**. Hoy no se ofrece en ningún sitio: `VidaAgendaBlock.tsx:203-204` lo
  apaga mientras `isRunning`.
- [ ] 343. Guardar manda `activityFollowUpEdit` con **solo `{ id, startTime }`**
  —**sin `durationMinutes`**—, así que **la sesión sigue abierta**. Comprobado
  con un espía sobre el input: si aparece `durationMinutes`, el criterio no se
  cumple.
- [ ] 344. Tras corregir, **el cronómetro del bloque y el de la barra recuentan
  desde la hora nueva sin recargar** (la invalidación de `followUps.open()` ya
  existe, `invalidate-vida-queries.ts:32`), y la sesión **no desaparece de la
  barra**.
- [ ] 345. **«Terminar» después de corregir guarda los minutos correctos**:
  empezada por error a las 9:00, corregida a 8:07 y terminada a las 9:00 → se
  guardan **53 min**. Sale solo de `closeSessionInput`, que ya cuenta desde
  `session.startTime`: **no hay aritmética nueva**.
- [ ] 346. **Los mismos límites y las mismas frases** que el criterio 333: hora
  válida, nada del futuro, y del día de la sesión. Corregir **no cambia la
  fecha** de la sesión.
- [ ] 347. Lo que se lee al guardar **dice lo que pasó** («Contamos desde las
  8:07») y no usa «cancelar» ni «eliminar» (FEAT-004, criterio 59). El toast
  genérico de hoy para una sesión abierta es *«Registro actualizado»*
  (`useActivityFollowUps.ts:101`): si se usa ese camino, el mensaje se resume
  desde quien conoce la sesión, como ya hace `useVidaSessionActions`.
- [ ] 348. Si falla, **la sesión sigue en marcha con su hora de antes**, la hoja
  no se cierra y **la pantalla no pinta la hora nueva como si se hubiera
  guardado**.
- [ ] 349. Lo que ya hacía ese menú **sigue en su sitio**: «Terminar y añadir una
  nota» (FEAT-004, criterios 5 y 6) no se mueve ni cambia, y en una sesión ya
  **cerrada** el menú es el de siempre («Corregir», «Quitar del registro»).

*Empezar desde la hora planeada, en un toque (tajada 3)*

- [ ] 350. Cuando se empieza un bloque **cuya hora planeada ya pasó**, se ofrece
  en **un solo toque** empezar **desde esa hora** («empecé a las 8:00, lo que
  tenías planeado»), además de «ahora».
- [ ] 351. **El play no se encarece:** quien empieza ahora sigue haciendo **un
  toque** y sigue guardando **la hora del reloj**; el atajo es una salida al
  lado, nunca un paso intermedio obligatorio (FEAT-010, criterio 196).
- [ ] 352. El atajo usa **la misma función** de la tajada 1 — una sola ruta al
  API, ni una segunda escritura ni una copia de la aritmética.
- [ ] 353. **No se propone una hora que no ha llegado**: sin hora planeada, o con
  la hora planeada todavía por venir, el atajo **no aparece**.
- [ ] 354. **La ventana en la que se ofrece** sale de una constante que ya
  existe, no de una segunda: mientras el inicio planeado esté dentro de
  `VIDA_MOVED_THRESHOLD_MINUTES` (60 min, FEAT-004 criterio 20) o, si FEAT-010 ya
  está construida, dentro de **su** ventana del criterio 194. Un bloque planeado
  hace cuatro horas no ofrece registrar cuatro horas de trabajo en un toque.

*Estados — los que no se piden y siempre hacen falta*

- [ ] 355. **A 375 px:** la pregunta de la hora y su «ahora» caben **sin scroll
  horizontal**, y el pie de la hoja («Volver» / «Empezar») sigue alcanzable sin
  que lo tape la barra de sesión (FEAT-004, criterio 60).
- [ ] 356. **Texto largo:** un nombre de actividad de ~60 caracteres no rompe la
  hoja, ni la línea de confirmación, ni la entrada nueva del «···».
- [ ] 357. **Tema oscuro:** el campo de hora se lee. No es un control nuevo —es
  el mismo `Input type="time"` que el modo `log` ya usa
  (`VidaLogSessionSheet.tsx:260-275`)—, así que **no se inventa un estilo**.
- [ ] 358. **Sin conexión con el API / con la consulta caída:** ni la hoja ni el
  «···» afirman que se guardó nada; se puede reintentar.
- [ ] 359. **Lenguaje, y esto es del usuario antes que de nadie:** llegar tarde a
  pulsar un botón **no es un fallo**. En ninguna pantalla se lee «se te olvidó»,
  «llegas tarde», «deberías haber», ni nada que suene a reproche. «Empezaste
  antes» y «Contamos desde las 8:07» son descripciones.
- [ ] 360. **Línea base no empeorada** (`docs/features/ENVIRONMENT.md`):
  `pnpm typecheck` limpio, `pnpm lint` no peor que 14/0, `pnpm test` sin fallos
  nuevos sobre los 2 preexistentes, y se cierra con **`pnpm build`**. **No hay
  documento GraphQL nuevo**, así que `contracts.test.ts` no debería crecer: si
  alguien lo toca, es señal de que se está creando algo que ya existía.
- [ ] 361. **Solo el usuario puede cerrarlo, con la API despierta:** abrir Hoy en
  medio de algo que lleva rato haciendo, decir desde qué hora, ver el cronómetro
  con el tiempo de verdad, terminar y comprobar que **los minutos guardados son
  los que llevaba**.

**Slices:** (vertical, cada una usable sola)

| # | What it does | State |
|---|---|---|
| 1 | **«Empezar algo» pregunta a qué hora empezó.** Un campo más en la hoja que ya existe (modo `start`), con «ahora» por defecto, y `start()` aceptando esa hora. Criterios 330–341 (incluido el **331b**). **Es lo más corto que resuelve el problema de hoy del usuario**, y es una sola acción: lo que lleva desde las 8:07 queda **en marcha** y contando desde las 8:07. | pending |
| 2 | **Corregir la hora de una sesión en marcha.** *Secundaria: el pedido no la necesita.* Se levanta la condición de `VidaAgendaBlock.tsx:203`, y desde el «···» del bloque en marcha y la barra de sesión se manda `activityFollowUpEdit` con solo `startTime`. Cubre a **quien pulsó Empezar tarde y se da cuenta después**, que es otro caso. Criterios 342–349. | pending |
| 3 | **Empezar desde la hora planeada, en un toque.** El atajo «empecé a las 8:00, lo que tenías planeado» junto al play, sin encarecer el gesto de empezar ahora. Criterios 350–354. | pending |

**Por qué este orden:** la 1 es **literalmente el pedido, y el pedido entero**
—el usuario lo estrechó él mismo: una acción, una sesión viva, inicio en el
pasado— y **no depende de nada**
—el API ya lo admite y la hoja ya tiene el campo escrito para los otros dos
modos—; la 2 es la misma idea por la otra puerta y toca una condición y un menú
que ya existen; la 3 es comodidad sobre lo que las dos primeras ya permiten, y
es la que más se roza con FEAT-010, así que va la última y, si hay que parar, es
la que menos duele dejar.

**Architect? no.** Esto **no introduce ningún concepto**: la sesión viva, el
cronómetro, el cruce real↔planeado, la hoja y su validación son todos de
FEAT-004 y están construidos. Lo que se hace es **un campo más en una hoja que
existe, un parámetro más en una función que existe y una condición que se
levanta**. De dónde cuelga, con su ruta:

- **El campo:** `src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx`
  — el bloque «A qué hora empezó» ya está escrito (`:254-276`); lo que cambia es
  **cuándo** se pinta y qué se hace con él en el modo `start`.
- **La hora al API:** `src/features/vida/utils/vida-session.utils.ts:143`
  (`startSessionInput(activityId, now)`) y
  `src/features/vida/hooks/useVidaSessionActions.ts:106` (`start(activityId)`):
  **una** hora explícita opcional, con el reloj como valor por defecto, para que
  las dos llamadas de hoy (`VidaHoyPage.tsx:678` y `:943`) no cambien de
  comportamiento.
- **La validación:** `src/features/vida/utils/vida-session.utils.ts:280`
  (`validateLogPast`) — **sus frases, no otras**. Si hace falta una variante sin
  duración, comparte las cadenas; no las duplica.
- **La corrección en marcha:**
  `src/features/vida/components/VidaAgendaBlock/VidaAgendaBlock.tsx:203-204` y la
  barra de sesión, con `useUpdateActivityFollowUpMutation`
  (`hooks/useActivityFollowUps.ts:91`), que ya sabe tratar una respuesta con
  `isOpen: true`.

**Si el constructor se encuentra con que la hoja necesita un modo nuevo (un
cuarto `VidaLogSessionMode`) en vez de una pregunta más en `start`, que lo diga
antes de escribirlo**: eso sí sería un concepto, y entonces entra el arquitecto.

**¿Hace falta render? No, y esta es la razón.** Lo que se enseña es **un campo
que ya está dibujado en esa misma hoja** (el «A qué hora empezó» del modo `log`)
y **una entrada más en un menú que ya existe**: no hay nada que mirar que el
usuario no haya visto ya aprobado en FEAT-004. La regla de «nunca saltarse el
render» nació para el **rediseño Aura por fases**, donde lo que estaba en juego
era el aspecto de pantallas enteras; aquí el aspecto no se decide, se hereda. Y
el usuario tiene el problema **hoy**. **Con una condición:** el atajo de la
**tajada 3** (un segundo control al lado del play) es lo único con forma propia;
si al construirlo deja de ser «una salida más en la hoja» y se convierte en un
control nuevo en la agenda, **eso sí se enseña antes de darlo por bueno**, y
además se cruza con FEAT-010, que está dibujando justo esa zona.

**Choques con lo que hay en vuelo, y el orden:**

| Feature | Dónde se rozan | La frontera |
|---|---|---|
| **FEAT-010** (qué toca ahora: el play y la cara del cronómetro) | Su criterio **196** dice que el play de la cara 2 guarda **la hora del reloj**; su tajada 3 pinta el cronómetro arriba | **FEAT-013 es dueña de la hora de inicio; FEAT-010 es dueña de la tarjeta.** Si las dos llaman a `useVidaSessionActions.start`, el criterio 196 se sigue cumpliendo (el play sin tocar nada sigue guardando el reloj) y el atajo de la tajada 3 de aquí **es el mismo** que su cara 2 podría ofrecer, no otro. **Orden sugerido: FEAT-013 tajadas 1 y 2 antes que FEAT-010 tajada 2**, para que su cara 2 pueda apoyarse en esto en vez de inventarlo. Si FEAT-010 va primero, no se rompe nada: FEAT-013 tajada 3 se aplica después en el mismo sitio. |
| **FEAT-011** (registrar en el hueco) | Ancla la hoja en modo **`log`** a un hueco, con duración validada contra los bordes | **No se tocan**: FEAT-011 vive en `log` (rato terminado, con duración) y FEAT-013 en `start` (rato vivo, sin duración). El único punto común es la hoja: quien construya el segundo **no debe reescribir el campo de hora**. Pueden ir en paralelo. |
| **FEAT-012** (la noche) | Mueve los bordes del día, que es lo que mira el criterio 336 | FEAT-013 **no define** los bordes: los lee de `useVidaDayHours`. Cuando FEAT-012 los cambie, el criterio 336 sigue diciendo lo mismo. **Sin dependencia de orden.** |
| **FEAT-008** (horas y minutos) | Está tocando duraciones, no horas de inicio | Sin cruce. |

**Qué criterios de FEAT-004 toca esta feature, y cómo no se rompen:**

- **Criterio 2 y 17** («la hora que se guarda al empezar es la del reloj»): siguen
  siendo el **comportamiento por defecto** y están sujetos por el criterio 332.
  Lo que cambia es que ahora **se puede decir otra**, a petición explícita del
  usuario.
- **Criterio 3 y 4** (el cronómetro cuenta desde `startTime`, no desde el
  montaje): **es lo que hace que esto funcione sin tocar nada más**. Si el
  cronómetro contara desde el montaje, esta feature sería imposible en cliente.
- **Criterio 5** («Terminar» es un toque, con los minutos del cronómetro): sigue,
  y ahora da el número correcto (criterio 345).
- **Criterio 15 / D4** (empezar con otra cosa en marcha): se **precisa**, no se
  cambia, en el criterio 339.
- **Criterio 16 / D3** (la sesión abierta de otro día): intacto, y por eso «ayer»
  queda fuera de alcance.
- **Criterios 19, 20, 22, 23** (el cruce, los umbrales, el movido): **no se
  tocan**. Una sesión que empieza a las 8:07 sobre un bloque de las 8:00 ya
  tiene nombre en ese sistema (criterio 337).
- **Criterio 30** («Empezar algo» no pide duración): sigue. Se pregunta la hora,
  **no** la duración.
- **Criterio 59** (lenguaje sin reproche): se amplía al caso nuevo (criterio 359).

**Decisions that aren't mine:**

- **D1 — Con algo en marcha, ¿a qué hora se cierra lo anterior cuando lo nuevo
  empieza en el pasado?** Hoy la anterior se cierra **a este momento** (FEAT-004,
  criterio 15). Si digo «empecé lo nuevo a las 8:07» y lo anterior empezó a las
  7:30, hay dos lecturas:
  **(a) *recomendada, y es lo que dice el criterio 339*:** lo anterior se cierra
  **a las 8:07** (37 min) y lo nuevo cuenta desde ahí. **Consecuencia:** las dos
  sesiones no se pisan y el día cuadra, pero si de verdad estuviste con lo
  anterior hasta las 9:00, ese rato se pierde y hay que corregirlo a mano.
  **(b)** lo anterior se cierra **ahora** y las dos se solapan. **Consecuencia:**
  el presupuesto contaría el mismo rato dos veces, que es justo lo que FEAT-004
  evitó en su criterio 26.
  **(c)** no dejar empezar en el pasado mientras haya algo en marcha, y pedir que
  primero se termine. **Consecuencia:** más honesto y más incómodo; deja al
  usuario con el problema que vino a resolver.
  **Voy con (a) y no bloqueo la construcción**; si el usuario prefiere otra, se
  cambia el criterio 339 y nada más. El caso de «lo nuevo empieza **antes** que
  lo que está en marcha» sí queda impedido en las tres lecturas: ahí no hay
  ninguna verdad que guardar.
- **D2 — ¿El atajo «desde la hora planeada» (tajada 3) vive aquí o en la tarjeta
  de FEAT-010?** Por defecto **aquí**, y FEAT-010 lo reutiliza; si el usuario
  prefiere verlo solo en la tarjeta de arriba, la tajada 3 se retira y sus
  criterios se anotan en FEAT-010. **No bloquea las tajadas 1 y 2.**

**Lo que no se preguntó:** el usuario dio el problema y la solución en la misma
frase, y las dos coinciden. No hay problema escondido detrás que valga la pena
perseguir.
