---
id: FEAT-013
title: Empezar algo que ya empezó — decir a qué hora arrancó lo que sigue en marcha
status: building
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
| 1 | **«Empezar algo» pregunta a qué hora empezó.** Un campo más en la hoja que ya existe (modo `start`), con «ahora» por defecto, y `start()` aceptando esa hora. Criterios 330–341 (incluido el **331b**). **Es lo más corto que resuelve el problema de hoy del usuario**, y es una sola acción: lo que lleva desde las 8:07 queda **en marcha** y contando desde las 8:07. | aceptada |
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

## 3. Construction — feature-builder

### Tajada 1 — «Empezar algo» pregunta a qué hora empezaste

**Summary for the reviewer:**
1. «Empezar algo» ahora pregunta **«¿A qué hora empezaste?»** con el reloj ya
   puesto, y `start()` admite esa hora: decir 8:07 deja **una sola sesión
   abierta** contando desde las 8:07 con **una sola llamada** a
   `activityFollowUpStart` (`activityFollowUpAdd`, cero).
2. Todo cuelga de lo que ya había: el campo de hora de la hoja, `startSessionInput`
   con un tercer parámetro opcional, y las frases de `validateLogPast`
   compartidas con un `validateStartTime` que no habla de duración.
3. **Lo que más probablemente rompí:** el camino de «empezar con otra cosa en
   marcha» (criterio 15 de FEAT-004). Antes lo anterior se cerraba **a este
   momento** y ahora se cierra **a la hora de inicio de lo nuevo** (D1): cuando
   no se toca la hora las dos cosas coinciden y el test de siempre sigue en
   verde, pero es aritmética que cambió de fuente. Segundo sospechoso: el campo
   de hora en modo `start` **sigue al reloj mientras no se toca**, así que una
   hoja abierta un rato repinta cada minuto; si algún test futuro deja la hoja
   abierta con temporizadores falsos, verá el valor moverse.

**What was built:**

- `src/features/vida/utils/vida-session.utils.ts`
  - `startSessionInput(activityId, now, startTime?)` — tercer parámetro
    **opcional**. Sin él, el cuerpo es **idéntico** al de siempre (criterio 332,
    con test `toEqual`). La `date` sale **siempre del reloj**, así que desde
    aquí no se puede crear una sesión abierta de otro día (criterio 335). Una
    hora que no se entiende cae al reloj en vez de viajar rota al API.
  - `validateStartTime({date, startTime, now})` — **nuevo, y sin una sola frase
    nueva**: las tres cadenas (`Dinos a qué hora empezó…`, `Esa hora todavía no
    ha llegado.`, `Ese día todavía no ha llegado.`) pasaron a constantes que
    **usan las dos funciones**, y hay un test que compara mensaje a mensaje que
    `validateStartTime` y `validateLogPast` dicen lo mismo (criterio 333).
    Las dos ramas de duración no aparecen: una sesión abierta no la tiene.
  - `readHhMm()` — el parseo del campo (regex + `normalizeTimeForDisplay` +
    `isValidHhMm`) extraído de dentro de `validateLogPast`, que ahora lo llama.
    Mismo comportamiento, un solo sitio.
- `src/features/vida/hooks/useVidaSessionActions.ts`
  - `start(activityId, startTime?)`. Se construye el `input` **una vez** y de él
    sale `startedAt` (`sessionStartInstant(input.date, input.startTime)`), que es
    el instante que manda en todo lo demás.
  - **D1 (criterio 339):** con algo en marcha, lo anterior se cierra **a
    `startedAt`**, no a `now` —`closeSessionInput(session, startedAt)`—, así que
    las dos no se pisan; y si `startedAt <= ` el inicio de lo que ya corre, **no
    se empieza nada**, no se toca la primera y se explica sin reproche.
  - El toast añade `· contamos desde las 8:07` solo cuando la hora elegida no es
    la del reloj. Descripción, no aviso (criterio 359).
- `src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx`
  - La sección «A qué hora empezó» sale del `mode !== 'start'` y se pinta
    **siempre**; el rótulo es «¿A qué hora empezaste?» en `start` (criterio 330)
    y el de siempre en `log`/`edit`. **La duración sigue siendo solo de
    `log`/`edit`** (criterio 30 intacto).
  - `startTimeTouched`: mientras nadie toque la hora, el campo **muestra
    `defaultStartTime`** —que la página recalcula cada minuto— y `onStart` va
    **sin hora**. Es lo que hace cierto el criterio 332 sin trampa: lo que se ve
    es lo que se guarda, y quien no mira el campo hace el gesto de siempre.
  - Validación con `validateStartTime` **solo si se tocó** la hora.
  - Un pie bajo el campo (`.hint`) dice qué va a pasar: «Ahora mismo. Cámbialo si
    llevas un rato con ello.» → «Empieza contando desde esa hora y sigue en
    marcha.»
- `src/features/vida/pages/VidaHoyPage.tsx`
  - `defaultStartNowTime()` para el modo `start` (el reloj) frente al
    `defaultLogStartTime()` de siempre (media hora atrás) para `log`.
  - `onStart={(activityId, startTime) => sessionActions.start(activityId, startTime)}`.
    **El ▶ del bloque no cambia**: sigue llamando `start(activityId)` a secas.
- Tests: `vida-session.utils.test.ts` (+9), `useVidaSessionActions.test.tsx`
  (+4), `VidaLogSessionSheet.test.tsx` (+6), `VidaHoyPage.test.tsx` (+1, y uno
  reescrito). **Ni un documento GraphQL nuevo**: `contracts.test.ts` no se tocó.

**Why this way:**

- **Un parámetro opcional, no un cuarto modo de la hoja.** La sección 1 pedía
  avisar si hacía falta un `VidaLogSessionMode` nuevo: no hace falta. `start`
  sigue siendo «qué» + ahora «desde cuándo»; la hoja no se parte.
- **`startTimeTouched` en vez de mandar siempre la hora del campo.** Mandarla
  siempre habría sido más simple, pero rompe el criterio 332 de una forma
  invisible: la hoja abierta a las 9:00 y pulsada a las 9:10 habría guardado
  9:00 sin que nadie lo pidiera. Con el «tocado», quien no mira el campo guarda
  el reloj **del momento de pulsar**, exactamente como hoy.
- **Cerrar lo anterior a la hora de lo nuevo (D1/a) y no a `now` (D1/b).** Es lo
  que dice el criterio 339 y lo que evita contar dos veces el mismo rato.
- **Descartado:** cualquier camino que registrara el trozo pasado y arrancara
  otra sesión. No existe en el código: el test del criterio 331b lo fija con un
  espía sobre `activityFollowUpAdd`/`createActivityFollowUp`.

**Verification:**

Línea base entera (`docs/features/ENVIRONMENT.md`), corrida al terminar:

```
pnpm typecheck  → limpio (sin salida)
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)   [igual que la línea base]
pnpm test       → Test Files 1 failed | 109 passed (110)
                  Tests 2 failed | 1640 passed (1642)      [los 2 de SearchSelect, preexistentes]
pnpm build      → dist/assets/index-DpgZM3Bq.js  1,098.22 kB │ gzip: 329.77 kB
```

El paquete inicial pasa de **1.097,09 kB** a **1.098,22 kB**: **+1,13 kB**, que
es el código nuevo (ni un import nuevo de barril, ni un icono suelto). Los tests
suben de 1622 a 1642 por los 20 nuevos; los 2 fallos son los mismos de siempre.

Tests nuevos que sujetan los criterios:

```
✓ startSessionInput — criterio 332: sin hora, el cuerpo es **idéntico** (toEqual)
✓ startSessionInput — criterio 331: con hora, `{date: hoy, startTime: '08:07'}`
✓ startSessionInput — criterio 335: la fecha sigue siendo la del reloj
✓ validateStartTime — criterios 333 y 334 (las frases, comparadas con validateLogPast)
✓ useVidaSessionActions — criterios 331/331b: **1** startActivityFollowUp, **0** createActivityFollowUp
✓ useVidaSessionActions — criterio 339 (D1): cierra la anterior a las 10:00 → 30 min
✓ useVidaSessionActions — criterio 339: hora anterior a lo que corre → no empieza, no toca la primera
✓ useVidaSessionActions — criterio 340: dos toques con hora → una sesión
✓ VidaLogSessionSheet — criterios 330, 332, 331b, 333, 334 (×2), 338
✓ VidaHoyPage — criterios 330 y 331b de punta a punta en la página
```

**En el navegador** (arnés temporal `arnes-013.html` + `src/arnes-013.tsx`, con
`MemoryRouter` y datos sintéticos; **borrados antes de escribir esto**, `git
status` solo lista archivos de `src/features/vida` y este dossier). Se usó el
dev server del usuario en el 5173, no se arrancó ninguno:

- **375 px** — medido en el DOM, que es lo que vale: `documentElement.scrollWidth
  375 === clientWidth 375` (**sin scroll horizontal**), la hoja ocupa los 375 y
  el campo de hora 309 px; «Volver» y «Empezar» visibles en el pie (criterio 355).
- **Tema oscuro** — el campo se lee (es el mismo `Input type="time"` del modo
  `log`, ni un estilo nuevo) y el pie de ayuda sale en `rgb(168,179,199)` sobre
  el fondo oscuro del modal (criterio 357).
- **Recorrido real en la hoja:** elegir «Poner lavadora», escribir **23:50** con
  el reloj a las 9:47 y pulsar «Empezar» → `role="alert"` con **«Esa hora todavía
  no ha llegado.»**, la hoja abierta, la actividad y la hora escritas intactas
  (criterios 334 y 338 vistos, no deducidos).
- **Texto largo:** el título de 47 caracteres «Trabajar en el proyecto de la
  plataforma interna» trunca en la píldora y no estira la hoja (criterio 356).

**Criteria it closes:**

| # | Estado | Evidencia |
|---|---|---|
| 330 | ✅ | Rótulo «¿A qué hora empezaste?» + valor del reloj (`toHaveValue('09:24')` en la página, `'08:54'` en la hoja) y visto en el navegador. |
| 331 | ✅ parcial | El input que viaja es `{activityId, date: hoy, startTime: '08:07'}` (test puro y test del hook). **Que el cronómetro lea 1 h 3 min a las 9:10 no se volvió a probar aquí**: sale de `followUpStartInstant`/`useVidaElapsed`, que cuentan desde `startTime` desde FEAT-004 y tienen sus tests. Se cierra del todo con el criterio 361. |
| 331b | ✅ | Dos espías, en dos niveles: en el hook, `createActivityFollowUp` **0** llamadas y `startActivityFollowUp` **1**; en la página, `createFollowUpMutation.mutate` **0** y `start` **1** con `('a-s1', '08:07')`. |
| 332 | ✅ | `toEqual` entre `startSessionInput(id, reloj)` y con `undefined`/`null`; y en la hoja, sin tocar el campo `onStart` recibe `undefined`. |
| 333 | ✅ | Las cadenas son constantes compartidas; test que compara los tres mensajes de `validateStartTime` con los de `validateLogPast`. Ninguna frase nueva de validación. |
| 334 | ✅ | 16:00 con el reloj a las 15:30 → «Esa hora todavía no ha llegado.»; 15:30 exacto → válido. Visto además en el navegador. |
| 335 | ✅ | La `date` sale siempre de `formatDateToYmd(now)`: a las 00:20 con `'23:40'` sigue siendo hoy. El modo `start` sigue sin existir en días pasados (nada de eso se tocó). |
| 336 | ⚠️ **parcial, para el revisor** | La sesión **no puede quedar invisible**: `VidaSessionBar` se monta en `VidaModuleLayout.tsx:99` con `hasBar && session`, **sin mirar las horas del día**, así que una sesión empezada a las 5:40 con el día empezando a las 6:30 se ve y cuenta en la barra. **Lo que no comprobé** es si además aparece en la agenda de Hoy o si hace falta una línea que lo diga: no monté ese caso. Es lo primero que miraría el revisor. |
| 337 | ✅ por construcción | No se añadió ni una constante ni un estado de bloque: el cruce lo sigue haciendo `matchSessionsToBlocks` con los umbrales de FEAT-004, que no se tocaron. Sin test nuevo: no hay código nuevo que probar. |
| 338 | ✅ | Test: con `onStart` devolviendo `{ok:false}`, la hoja no se cierra, conserva `08:07` y la actividad marcada, y sin escritura optimista no hay sesión fantasma. Visto también en el navegador. |
| 339 | ✅ **con un matiz** | Se cierra lo anterior a la hora de lo nuevo (30 min de 9:30 a 10:00) y se dice; con una hora anterior o igual, no se empieza nada y no se toca la primera. **El matiz:** el mensaje **explica** («"Organizar la casa" está en marcha desde las 9:30. Para empezar algo a las 8:07, antes hay que cambiar la hora de "Organizar la casa".») pero **no ofrece un botón** para corregirla, porque ese control es la tajada 2 y todavía no existe. Ofrecer un camino que no lleva a ningún sitio habría sido peor. |
| 340 | ✅ | Dos `start` en paralelo con hora → **una** llamada: el cerrojo de `useVidaSessionActions` no se tocó. |
| 341 | ✅ | La hora pasa por `normalizeTimeForApi`, el mismo de siempre. Cero formateadores nuevos. |
| 355 | ✅ | Medido en el DOM a 375 px: sin scroll horizontal, pie alcanzable. |
| 356 | ✅ | Título de 47 caracteres: trunca, no estira. |
| 357 | ✅ | Oscuro mirado en el navegador; el control es el que ya existía. |
| 358 | ✅ heredado | La hoja no afirma nada hasta que el `onStart` resuelve `ok` (mismo camino del 338); no hay escritura optimista y se puede reintentar. |
| 359 | ✅ | Los tres textos nuevos son descripciones: «Si ya llevas un rato, dinos desde qué hora», «Ahora mismo. Cámbialo si llevas un rato con ello.», «contamos desde las 8:07». Ni «se te olvidó», ni «tarde», ni «deberías». |
| 360 | ✅ | Tabla de arriba. Con la salvedad del paquete: **+1,13 kB**. |
| 361 | ⏳ **solo el usuario** | Detrás del login. Pasos: abrir **Vida · Hoy** en medio de algo que llevas rato haciendo → «Empezar algo» → elegir la actividad → cambiar la hora a la de verdad (p. ej. 8:07) → «Empezar». Comprobar que el toast dice «contamos desde las 8:07», que **la barra de sesión cuenta el tiempo real** (no 0), que **solo hay una sesión** en el día, recargar y ver que sigue contando bien, y al final «Terminar» y comprobar que los minutos guardados son los que llevabas. |

**Risks:**

- **El cierre de lo anterior cambió de hora de referencia** (D1). Sin tocar el
  campo no cambia nada —`startedAt === now`— y el test del criterio 15 sigue en
  verde con sus 38 minutos, pero quien revise debería probar a mano «empezar algo
  con otra cosa en marcha» por el ▶ del bloque.
- **El campo sigue al reloj mientras no se toca.** Eso hace repintar la hoja cada
  minuto (ya pasaba: la página entera repinta con `nowMinutes`). Si alguien abre
  la hoja y espera, el valor sube solo; es lo correcto, pero es movimiento en
  pantalla que antes no había en ese modo.
- **La hoja en modo `start` es ahora más alta.** A 375 px sigue entrando y el pie
  se alcanza, pero FEAT-010 y FEAT-011 van a meter mano en esta misma zona: el
  campo es de esta feature y no deberían reescribirlo.
- **El mensaje de D1 nombra dos veces la actividad en marcha.** Con un título de
  60 caracteres es un mensaje largo en el toast. No rompe nada (el toast ajusta),
  pero es el texto más largo que se escribió aquí.
- **`VidaLogSessionSheet.test.tsx` y `VidaHoyPage.test.tsx` traían tests que
  afirmaban que en `start` **no** había campo de hora.** Los actualicé: la parte
  de «no pide duración» (criterio 30 de FEAT-004) se conserva intacta; lo que se
  cambió es solo la afirmación que esta feature invalida a propósito.

**Tree state:** sin commitear. Diez archivos tocados, nueve de `src/features/vida`
y este dossier. El arnés del navegador está borrado.

## 4. Revisión — feature-reviewer

### Tajada 1 — «Empezar algo» pregunta a qué hora empezó

**Veredicto: `accepted`** — y con prisa, porque lo que desbloquea es lo que el
usuario lleva sin poder hacer desde las 8:07. Los criterios 330–335 y 337–341 se
cumplen; el **336 queda a medias y no de forma peligrosa**: lo monté yo y la
sesión **no se pierde de vista**, aunque la agenda de Hoy no la enseñe. Lo
esencial —**una intención, una acción, una sola sesión**— lo he espiado yo mismo
y es cierto.

**Lo primero: ¿es de verdad UNA acción y UNA sesión?** (criterios 331 y 331b)

Sí, y no lo leo del texto: escribí mis propios espías sobre la API (test
temporal, borrado) y comprobé los cinco casos que importan:

| Lo que hago | Lo que sale |
|---|---|
| `start('a-leer', '08:07')` sin nada en marcha | **1** `startActivityFollowUp` con `{ activityId, date: '2026-09-18', startTime: '08:07' }` · **0** `createActivityFollowUp` (el «add») · **0** `updateActivityFollowUp` |
| `start('a-leer')` sin tocar la hora | **1** llamada con `startTime: '09:10'`, la del reloj: el gesto de siempre (criterio 332) |
| Con «Organizar la casa» en marcha desde las **8:00**, empezar a las **8:07** | **1** cierre `{ id: 'f1', durationMinutes: 7 }` —a las 8:07 exactas, no a las 9:10— y **1** `start`; **0** «add». Nunca dos abiertas, nunca una duración negativa |
| Con eso mismo en marcha, empezar a las **7:30** | **0** llamadas de cualquier tipo; devuelve `ok: false` y un mensaje que nombra lo que está en marcha |
| Empezar a la **misma** hora (8:00) | **0** llamadas: «igual» también se rechaza, como pide D1 |

Y el mensaje del rechazo no reprocha: *«Organizar la casa» está en marcha desde
las 8:00. Para empezar algo a las 7:30, antes hay que cambiar la hora de
«Organizar la casa».* Comprobé que no contiene «fallaste», «error», «inválido»,
«no puedes» ni `\bmal\b`.

**El criterio 336, montado por mí: la sesión no queda invisible, pero la agenda
se calla**

Monté el caso que faltaba —una sesión abierta a las **5:40** con el día
empezando a las **6:30**— renderizando `VidaHoyPage` con mis propios datos.
Resultado, literal:

- **En la página de Hoy no aparece por ninguna parte**: ni en la agenda, ni como
  bloque, ni con una línea. El nombre de la actividad sale **cero** veces en
  todo el `textContent`, y no hay ninguna frase del tipo «queda fuera de tu
  día».
- **Pero las cifras de la cabecera sí la cuentan**: se lee «**en marcha 2h 54**»
  mientras ningún bloque la enseña. El día suma un rato que la lista no
  contiene.
- **Y se ve fuera de la página**: `VidaSessionBar` la pinta, y lo verifiqué en
  el código, no de oídas — vive en `VidaModuleLayout` y su condición es
  `hasBar = !isDisabled && session !== null && !isFromAnotherDay`: **no mira las
  horas del día**. Una sesión de hoy a las 5:40 la pinta con su cronómetro en
  todas las pantallas de Vida, incluida Hoy.

**Por eso no la devuelvo.** Lo que el criterio prohíbe con todas las letras —«que
la sesión exista, ocupe la única ranura abierta y **no se vea en ninguna
parte**»— **no pasa**: hay una barra persistente con su nombre y su tiempo
corriendo. Lo que no se cumple son las dos salidas que el criterio nombra: ni se
ve en la agenda, ni hay línea. Va como hallazgo 1, con el añadido de la
incoherencia de las cifras, que es lo que de verdad puede desconcertar: **el
número cuenta lo que la lista no enseña**.

**D1 sin el botón de la tajada 2: ¿se explica o se queda cojo?** (criterio 339)

Se explica **a medias, y lo digo sin adornos**: el mensaje dice qué pasa y qué
haría falta —cambiar la hora de lo que está en marcha—, pero **ese control no
existe todavía** (es el criterio 342, tajada 2), así que la frase pide algo que
hoy no se puede hacer desde ningún sitio. No deja al usuario **sin salida** —
puede terminar lo que corre y volver a empezar—, pero esa salida **no está
escrita en el mensaje**. Es el único punto donde esta tajada roza la premisa
nueva: una frase que señala una puerta cerrada cuesta un paso más. **Lo que
recomiendo, y es una línea:** añadir al mensaje la salida que sí existe hoy
(«…o termínala y empieza de nuevo»), hasta que la tajada 2 traiga el botón.
Como el caso llega solo cuando se pide una hora **anterior** a algo ya en
marcha, no bloquea el uso normal y por eso no devuelve la tajada.

**Criterios, uno por uno** (contra la sección 1)

| # | Estado | Evidencia que he comprobado yo |
|---|---|---|
| 330 | **cumplido** | Visto en el navegador: la hoja de «Empezar algo» trae «**¿A qué hora empezaste?**» con **08:54** puesto —el reloj— y el pie «Ahora mismo. Cámbialo si llevas un rato con ello.». Y **no hay píldoras de duración**: `[aria-label="Cuánto dura"]` no existe en esa hoja. |
| 331 | **cumplido** | Mi espía: `startTime: '08:07'` y `date` local de hoy. El cronómetro cuenta desde ahí porque nace de `startTime` (FEAT-004, sin cambios). |
| 331b | **cumplido, y es el corazón** | Tabla de arriba: **una** mutación, **una** sesión, **cero** «add». |
| 332 | **cumplido** | Sin tocar el campo no viaja `startTime` (`onStart(id, undefined)`) y el input queda igual al de hoy. Además el campo **sigue al reloj** mientras nadie lo toque (`displayedStartTime` con `defaultStartTime`), así que abrir a las 9:00 y pulsar a las 9:10 guarda **9:10**. |
| 333 | **cumplido** | Las frases son **constantes compartidas** (`START_TIME_MISSING`, `START_TIME_FUTURE`, `START_DAY_FUTURE`) que usan `validateStartTime` **y** `validateLogPast`: leí las dos funciones, y no hay ni una cadena nueva. |
| 334 | **cumplido** | `isFutureDateTime` para el futuro, y la hora **igual** a este minuto pasa. Las ramas de duración no se evalúan en este modo. |
| 335 | **cumplido** | `date` sale siempre de `formatDateToYmd(now)` en `startSessionInput`: desde aquí no se puede crear una sesión abierta de ayer. |
| 336 | **parcial, no peligroso** | Ver arriba: montado por mí. |
| 337 | **cumplido** | No hay constante ni estado nuevo del bloque en el diff: el cruce sigue siendo `matchSessionsToBlocks`. |
| 338 | **cumplido** | En el fallo del `start` la hoja no se cierra —`if (!result.ok)` lo sujeta— y con el cierre de la anterior fallando **no se empieza la nueva** (rama ya existente, intacta). |
| 339 | **cumplido con un matiz de redacción** | Las dos ramas espiadas por mí (tabla de arriba). El matiz, arriba. |
| 340 | **cumplido** | El cerrojo `lock()` de `useVidaSessionActions` no se ha tocado. |
| 341 | **cumplido** | `normalizeTimeForApi` es la única puerta; `readHhMm` solo **lee** lo tecleado y no formatea nada nuevo. |
| 361 (línea base) | **cumplido, corrida entera por mí** | Ver abajo. |

**Los dos descubrimientos que hizo: verificados, y valen lo que dice**

1. **`defaultStartTime` era media hora atrás para los tres modos.** Confirmado en
   el diff: ahora `start` parte de `defaultStartNowTime` (el reloj) y `log` sigue
   con `defaultLogStartTime` (30 min atrás). Sin eso, el criterio 330 habría
   puesto «hace 30 min» donde pide «ahora» — y el usuario habría registrado media
   hora que no era.
2. **Prefijar el campo con la hora de apertura rompía el 332 en silencio.**
   También confirmado: el campo pintado es `defaultStartTime` **mientras no se
   toca**, y lo que se manda sin tocarlo es el reloj **del momento de pulsar**
   (mi segundo espía: 09:10, no la hora de apertura). Las dos cosas las resuelve
   el mismo `startTimeTouched`.

**Lo que no se ha tocado, comprobado**

`VidaAgendaBlock` y `VidaSessionBar` **no aparecen en el diff**: el ▶ del bloque
sigue igual y las puertas de las tajadas 2 y 3 (corregir lo que corre, «desde la
hora planeada») no se han abierto por adelantado.

**Los tres tests reescritos: no relajan nada**

Los tres afirmaban que el modo `start` **no tenía campo de hora** —que es justo
lo que esta feature invierte—. Lo que conservan es lo que sigue siendo cierto:
**no pide duración** (`Cuánto duró` ausente) y arranca ahora mismo cuando no se
toca la hora; las llamadas pasan de `('a-s1')` a `('a-s1', undefined)`, que es la
misma afirmación con la firma nueva. Ninguna aserción de FEAT-004 se ha borrado:
`--numstat` da 106/5, 24/2 y 75/0, y las líneas que se van son las de la
afirmación invertida.

**En el navegador, por mí**

El 5173 estaba vivo y lo usé —**no arranqué ni paré nada**—; arnés propio con la
hoja real, borrado después. **Aviso honesto sobre lo que se ve**: la imagen que
devuelve el panel para este arnés sale **dibujada a media escala** (el contenido
se pinta en los ~184 px de la izquierda) aunque el DOM mida 375 — lo comprobé:
`innerWidth`, `clientWidth` y el propio diálogo miden **375**, `devicePixelRatio`
es 2 y `visualViewport.scale` es 1. Es un artefacto del panel con este arnés, no
de la hoja; **por eso las medidas de abajo salen del DOM y lo dejo dicho igual
que él**. Lo leído en la imagen (título, «Qué», los tres atajos, el buscador, la
pregunta con su hora y el pie, «Volver»/«Empezar») es correcto y legible.

- **375 px:** `scrollWidth === clientWidth === 375`, **0 nodos desbordados**.
- **El campo de hora:** **45,6 px** de alto —por encima de los 44 que este
  repositorio ya usa— y 324 de ancho, `type="time"`, con nombre accesible propio
  («Hora a la que empezaste») distinto del rótulo de la sección.
- **Oscuro:** pregunta **7,88:1**, pie **7,88:1**, texto del campo **14,89:1**,
  todos muy por encima de 4,5:1, y sin scroll horizontal.
- **No hay píldoras de duración** en este modo, que es el criterio 30 de
  FEAT-004 intacto.

**Línea base, corrida entera por mí**

| Qué | `ENVIRONMENT.md` | Constructor | **Medido ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos |
| `pnpm test` | 2 de 1622 | 2 de 1642 | **2 fallidos de 1642**, 109 archivos de 110 en verde |
| `pnpm build` | 1.097,09 kB | 1.098,22 kB | **exit 0**, `index` **1.098,22 kB** (+1,13), `app-icons` **620,20 kB sin tocar** |

**Hallazgos — se anotan, no devuelven la tajada**

1. **La sesión que empieza antes del día no sale en la agenda de Hoy y la
   pantalla no lo dice** (criterio 336): se ve **solo** en la barra de sesión del
   módulo. Y, peor que la ausencia, **las cifras del día sí la cuentan** («en
   marcha 2h 54») mientras la lista no la enseña. El arreglo barato es la
   segunda salida que el propio criterio ofrece: **una línea** bajo la agenda
   —«Tienes algo en marcha desde las 5:40, antes de que empiece tu día»—, del
   estilo de las de FEAT-009. FEAT-012 va a mover estos bordes, pero hasta
   entonces esto queda así.
2. **El mensaje de D1 nombra un control que todavía no existe** (tajada 2) y no
   nombra la salida que sí existe hoy. Una línea.
3. **La hora en el campo se pinta con el formato del navegador** (`08:54 AM` en
   un navegador en inglés). Es propio de `type="time"` y del idioma del sistema,
   no de este código —al API viaja `HH:mm`, verificado—, pero conviene saberlo
   antes de que parezca un fallo.
4. **`ENVIRONMENT.md` vuelve a quedarse corto** (hoy **1642** tests y
   **1.098,22 kB**). **No lo he tocado** — es la regla.

**Lo que no he podido revisar:** el recorrido con sesión —lo que el usuario cierra
a mano—: elegir «Empezar algo», escribir **8:07** y ver el cronómetro contando
desde ahí, y que al terminar se guarden los minutos correctos. Es el límite de
siempre, y esta vez es justo lo que él estaba esperando poder hacer.
