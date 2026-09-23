---
id: FEAT-013
title: Empezar algo que ya empezó — decir a qué hora arrancó lo que sigue en marcha
status: building
architect: no    # un campo más en una hoja que ya existe y una condición que se levanta; el API ya lo admite tal cual (ver sección 1)
area: features/vida
requested: 2026-09-22
updated: 2026-09-23
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
| 2 | **Corregir la hora de una sesión en marcha.** *Secundaria: el pedido no la necesita.* Se levanta la condición de `VidaAgendaBlock.tsx:203`, y desde el «···» del bloque en marcha y la barra de sesión se manda `activityFollowUpEdit` con solo `startTime`. Cubre a **quien pulsó Empezar tarde y se da cuenta después**, que es otro caso. Criterios 342–349. | in-review (2026-09-23, retoque sobre la aceptada: la línea de la hora sube a 24,8 px —WCAG 2.2 AA— y la reserva del layout a 8rem; el revisor mira solo esto) |
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

### Tajada 2 — «Empecé antes»: corregir la hora de una sesión en marcha

**Summary for the reviewer:**
1. Lo que está **en marcha** ya se puede corregir: «Empecé antes» aparece en el
   «···» del bloque en marcha y en el de la barra de sesión, abre una hoja de
   **una sola pregunta** y manda `activityFollowUpEdit` con **`{ id, startTime }`
   y nada más**, así que la sesión sigue abierta y el cronómetro recuenta en el
   acto.
2. Cuelga de lo que ya había: hoja nueva con el molde de `VidaNoteSheet`, montada
   **una sola vez** en `VidaModuleLayout` y abierta por contexto
   (`openStartTimeSheet`), como el cierre completo y el editor de notas.
3. **Lo que más probablemente rompí:** el **«···» de la barra de sesión**, que
   deja de ser un botón de un toque al cierre completo y pasa a ser un menú con
   dos entradas —«Terminar y añadir una nota» cuesta ahora un toque más—.
   Segundo sospechoso, y más silencioso: `useUpdateActivityFollowUpMutation`
   ahora **parchea** la sesión abierta de la caché cuando la respuesta sigue
   `isOpen`; eso lo usan también el guardado de notas y todos los cierres, y es
   código que antes no existía en ese camino. Tercero: en Hoy, «Corregir» de una
   **fila suelta en marcha** ya no abre la hoja de `edit`.

**What was built:**

- `src/features/vida/utils/vida-session.utils.ts`
  - `correctStartInput({ id, startTime })` — **solo esos dos campos**, con la
    hora por `normalizeTimeForApi`. Un test comprueba las claves con `toEqual` y
    `Object.keys(...).sort()`: por aquí no se puede colar una duración.
  - `findSessionCovering(...)` y `validateCorrectedStart(...)` — la hora nueva,
    comprobada **antes** de llamar al API. Reutiliza `validateStartTime` (y por
    tanto **sus frases**, criterio 333) y añade lo único que faltaba: **no meter
    el inicio dentro de un rato ya registrado**.
- `src/features/vida/components/VidaStartTimeSheet/` — **la hoja nueva** (`.tsx`,
  `.module.scss`, `index.ts`, test). Una pregunta —«¿A qué hora empezaste?»—, el
  mismo `Input type="time"` de la hoja de siempre, un pie que dice qué va a pasar
  («Sigue en marcha y llevarías 2 h 1 min.») y «Volver» / «Guardar». **No muta
  nada**: recibe `onSave`, igual que `VidaNoteSheet`. Exporta también el rótulo
  `VIDA_START_TIME_LABEL` («Empecé antes»), que es lo que leen los dos menús: la
  palabra se escribe una sola vez.
- `src/features/vida/hooks/useVidaSessionActions.ts` — `correctStart(startTime)`:
  una mutación callada, el toast **«Contamos desde las 8:07»** (criterio 347) y
  el mismo cerrojo `lock()` que el resto de acciones. Si falla, devuelve
  `{ ok: false }` con «Sigue en marcha como estaba».
- `src/features/vida/hooks/useActivityFollowUps.ts` — con la respuesta todavía
  `isOpen`, la sesión abierta de la caché se **parchea** (no se sustituye):
  `activityFollowUpEdit` **no devuelve `activity` ni las subtareas**, así que
  sustituirla dejaría la barra sin nombre ni color. Con el parche, el cronómetro
  recuenta desde la hora nueva sin esperar a la consulta (criterio 344).
- `src/features/vida/components/VidaAgendaBlock/VidaAgendaBlock.tsx` — prop
  `onCorrectStart` y la entrada «Empecé antes» **debajo** de «Terminar y añadir
  una nota», solo con `isRunning`. Sin la prop, el «···» es exactamente el de
  antes.
- `src/features/vida/components/VidaSessionBar/VidaSessionBar.tsx` (+ `.scss`) —
  el «···» pasa a ser un `Popover` con las dos salidas, **calcado del menú del
  bloque**. Sin `onCorrectStart` sigue siendo el `IconButton` de un toque de
  antes (es lo que se prueba en el tercer test de la barra).
- `src/features/vida/routes/VidaModuleLayout.tsx` y `hooks/useVidaSessionUi.ts` —
  la hoja se monta **una sola vez** y se abre por contexto
  (`openStartTimeSheet`), como el cierre completo y la nota.
- `src/features/vida/pages/VidaHoyPage.tsx` — el bloque en marcha pasa
  `onCorrectStart`; y «Corregir» de una **fila suelta** en marcha
  (`VidaAgendaSession`) va ahora a esta hoja en vez de a la de `edit`. Ver
  «Lo que descubrí».
- Tests: `vida-session.utils.test.ts` (+9), `useVidaSessionActions.test.tsx`
  (+4), `VidaStartTimeSheet.test.tsx` (7, nuevo), `VidaSessionBar.test.tsx` (3,
  nuevo), `VidaAgendaBlock.test.tsx` (3, nuevo). **Ni un documento GraphQL
  nuevo**: `contracts.test.ts` no se tocó.

**Why this way:**

- **Una hoja propia y no un cuarto modo de `VidaLogSessionSheet`.** El modo
  `edit` pregunta hora **y duración** y manda las dos (`editSessionInput`), y una
  duración **cierra** la sesión: usarlo aquí sería incumplir el criterio 343 por
  construcción. Tampoco es «un modo más» disfrazado: es el molde de
  `VidaNoteSheet` —una pregunta, un campo, montada en el layout, dos puertas—, y
  esa hoja ya existe y ya se aceptó con esa forma. **Es la desviación de lo que
  apuntaba la sección 1** (que solo nombraba `VidaAgendaBlock` y la barra con
  `useUpdateActivityFollowUpMutation`), y queda dicha aquí.
- **El «···» de la barra pasa a menú.** El criterio 342 pide la entrada **en la
  barra**, y la barra solo tenía un botón que abría el cierre completo. Las
  alternativas eran un tercer control en una fila que a 375 px ya lleva nombre,
  cronómetro, «Terminar» y «···» (más estrecho y más ruido), o colgar la
  corrección de la línea «desde las 9:00», que vive **dentro del `Link`** a Hoy
  (un botón dentro de un enlace). El menú deja los dos «···» del módulo
  idénticos. **Su coste, dicho:** «Terminar y añadir una nota» pasa de un toque a
  dos. «Terminar» —el gesto que sí es diario— **no se toca**.
- **La comprobación del solape la hace el cliente porque el servidor no la hace.**
  `updateFollowUp` construye el `UPDATE` campo a campo y no compara con nada
  (`xavi-platform-node/src/services/activity-follow-up.service.ts:347-389`): sin
  esto, correr el inicio hasta dentro de «Desayunar» se guardaría en silencio y
  el día contaría dos veces el mismo minuto.
- **Descartado:** tocar `validateLogPast` o el modo `edit` para que supieran de
  sesiones abiertas. Eso es el camino de corregir **lo ya cerrado**, que está
  entregado y revisado; meterle una rama nueva por esto sería pagar en el sitio
  más transitado un caso que ocurre una vez.

**Las tres horas imposibles, y qué hace cada una** (el encargo lo pedía escrito):

| La hora nueva | Qué pasa | Por qué |
|---|---|---|
| **Posterior a ahora** | No se guarda. Se lee *«Esa hora todavía no ha llegado.»* | Lo fija el criterio 346, y es **la frase que ya existía** (criterio 333). Igual a este minuto **sí** vale. |
| **Anterior al comienzo de tu día** | **Se admite.** | Lo fija el criterio 336: hay gente que empieza antes. La sesión se sigue viendo en la barra (lo verificó el revisor de la tajada 1); que la agenda de Hoy no la enseñe es su **hallazgo 1**, abierto y ajeno a esta tajada. |
| **Dentro de un rato ya registrado** | No se guarda. Se lee *«Ese rato ya lo tiene «Desayunar», hasta las 8:30. Elige una hora desde esa.»* | **El dossier no lo fijaba.** Regla escrita aquí: el inicio no puede caer **dentro** de otra sesión cerrada del mismo día; **justo cuando la otra acaba sí** —son consecutivas, no solapadas—. Evita el doble conteo que ya evitó el criterio 26 de FEAT-004, y lo dice el cliente porque el servidor no lo comprueba. |

**Verification:**

Línea base entera (`docs/features/ENVIRONMENT.md`), corrida al terminar:

```
pnpm typecheck  → limpio (exit 0, sin salida)
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)   [los mismos archivos de siempre;
                  ninguno es de esta tajada]
pnpm test       → Test Files 1 failed | 120 passed (121)
                  Tests 2 failed | 1989 passed (1991)     [los 2 de SearchSelect, preexistentes]
pnpm build      → exit 0 · index 1.137,93 kB (gzip 341,60) · app-icons 620,20 kB sin tocar
                  · CSS 276,96 kB
```

El paquete sube de **1.133,58** a **1.137,93 kB** (**+4,35 kB**: la hoja nueva y
los dos menús) y el CSS de **275,91** a **276,96 kB** (**+1,05 kB**). El CSS
**sube**, que es lo que tiene que pasar al añadir reglas; aun así se compiló el
SCSS tocado y se comparó la **lista de selectores**, no el tamaño:

```
VidaSessionBar.module.scss   → .bar .capsule .identity .menu .menuItem .meta .name .root .row .text .timer
                               (los 9 de antes + .menu y .menuItem)
VidaStartTimeSheet.module.scss → .error .field .footer .form .hint
```

Ningún comentario se comió nada.

**En el navegador** (arnés temporal `arnes-013b.html` + `src/arnes-013b.tsx` +
`arnes-013b-frames.html`, con `MemoryRouter` y datos sintéticos; **borrados antes
de escribir esto** — `git status` solo lista `src/features/vida` y este dossier).
Se usó el dev server del usuario en el **5173**; no se arrancó ni se paró nada.
Medido **dentro de un `iframe` del ancho exacto** y con los `iframe` en
`position: absolute` para que ningún `flex` los encogiera:

- **375 px, con un título de 60 caracteres:** `scrollWidth === clientWidth === 375`,
  **0 nodos desbordados**. El menú de la barra se abre **hacia arriba**
  (`top: 570`, la barra en `643`), ocupa de 143 a 352 px y sus dos entradas se
  leen enteras.
- **760 px:** lo mismo, `scrollWidth === 760`, 0 desbordados, menú de 527 a 707.
- **De punta a punta:** pulsar «Empecé antes» en el menú de la barra **abre la
  hoja**, con «¿A qué hora empezaste?», el subtítulo «… · en marcha desde las
  9:00», el campo a **09:00** y el pie. El título de 60 caracteres no rompe nada.
- **La hoja a 375 px:** el diálogo ocupa los 375 y el campo de hora mide
  **309 × 46 px** (por encima de los 44 que usa este repositorio); a 760, 446 px.
- **Tema oscuro:** la pregunta **14,89:1**, el pie **7,88:1** sobre
  `rgb(22,30,47)`, y el texto del campo es el mismo `rgb(238,242,255)` del control
  que ya existía. Sin scroll horizontal.

**Criteria it closes:**

| # | Estado | Evidencia |
|---|---|---|
| 342 | ✅ | Las dos puertas, probadas y vistas: `VidaAgendaBlock.test.tsx` («Más opciones de Trabajar» → «Empecé antes» llama a `onCorrectStart`) y `VidaSessionBar.test.tsx` (lo mismo desde la barra), más el recorrido en el navegador. El rótulo es **«Empecé antes»**, sin culpa. |
| 343 | ✅ | Espía sobre el API: `updateActivityFollowUp` llamado **una vez** con `toEqual({ id: 'f1', startTime: '08:07' })`, y `Object.keys(input)` **sin** `durationMinutes` ni `notes`. `correctStartInput` lo sujeta también en puro. |
| 344 | ✅ | Con la consulta de vuelta dejada **en vuelo** a propósito, la sesión abierta de la caché queda en `startTime: '08:07'`, `durationMinutes: null` y **con su actividad**: el cronómetro (que cuenta contra `startTime`) recuenta sin recargar y la barra no se queda sin nombre. La invalidación de siempre confirma después. |
| 345 | ✅ por construcción | No se tocó `closeSessionInput` ni `finishNow`: los minutos salen de `followUpStartInstant(session)`, que lee el `startTime` ya corregido. **No hay aritmética nueva** y por eso no hay test nuevo; el de «Terminar» de FEAT-004 sigue en verde. Lo comprueba de verdad el criterio 361 (usuario). |
| 346 | ✅ | `validateCorrectedStart` delega en `validateStartTime`, y hay test que compara **mensaje a mensaje**. La fecha es siempre `session.date`: corregir no cambia de día. |
| 347 | ✅ | Toast único: **«Contamos desde las 8:07»**, lanzado por `useVidaSessionActions` con la mutación en `silent` (el genérico habría dicho «Registro actualizado»). Comprobado además que no contiene «olvid», «tarde», «deberías», «error» ni «mal». |
| 348 | ✅ | Con el API fallando: `{ ok: false }`, la hoja **no se cierra**, conserva `08:07` escrito, el `role="alert"` dice «Sigue en marcha», y la sesión de la caché conserva `09:30`. Sin escritura optimista. |
| 349 | ✅ | Test del orden del menú del bloque: «Terminar y añadir una nota» sigue primero y sigue llamando a `onOpenFinishModal`; lo nuevo va detrás. En una sesión **cerrada** el menú es el de siempre («Corregir», «Quitar del registro»): el bloque sin `isRunning` no ofrece «Empecé antes». |
| 355–357 (los del estado, en lo que toca a esta hoja) | ✅ | 375 y 760 px medidos en el DOM, título de 60 caracteres, oscuro con sus ratios. Arriba. |
| 358 | ✅ | Nada se afirma hasta que `onSave` resuelve `ok`; con la consulta del día caída se puede guardar igual y se dice («No pudimos mirar el resto del día»). |
| 359 | ✅ | Los textos nuevos son descripciones: «Empecé antes», «Sigue en marcha y llevarías 2 h 1 min.», «Contamos desde las 8:07», «Ese rato ya lo tiene «Desayunar», hasta las 8:30». Ni un «olvidaste», ni un «tarde», ni un «deberías». |
| 360 | ✅ | Tabla de arriba. Salvedad: paquete **+4,35 kB** y CSS **+1,05 kB**. |
| 361 | ⏳ **solo el usuario** | Detrás del login. Pasos: con algo **en marcha**, abrir el «···» del bloque (o el de la barra) → «Empecé antes» → poner 8:07 → «Guardar». Comprobar que el toast dice «Contamos desde las 8:07», que **la barra sigue ahí** y su cronómetro salta al tiempo real **sin recargar**, que la sesión **no se cierra**, y que al pulsar «Terminar» se guardan los minutos desde las 8:07 (criterio 345). Probar también a poner una hora del futuro y una dentro de otro rato ya registrado. |

**Lo que descubrí y no estaba en el plan:**

1. **«Corregir» de una sesión **en marcha** suelta abría la hoja de `edit`**, que
   **obliga a elegir una duración** y por tanto **habría cerrado la sesión**
   (`VidaHoyPage.tsx`, `entry.kind === 'session'`, con el comentario «también
   mientras corre» que puso FEAT-018). Es la misma puerta de esta tajada por un
   tercer sitio, así que la enruté a la hoja nueva cuando
   `durationMinutes === null`. **Si el revisor lo considera fuera de alcance, se
   revierte con tres líneas**, pero dejarla habría sido dejar una salida que
   termina lo que el usuario venía a corregir.
2. **El «···» de la barra y el del bloque no eran el mismo control**: uno era un
   menú y el otro un botón directo. Ahora los dos son menú. Es un cambio de
   interacción en una barra ya aceptada y lo señalo como lo primero que mirar.
3. **Las entradas de menú miden 28 px de alto** (`.menuItem`, padding
   `0.45rem`), por debajo de los 44 px de objetivo táctil. **No lo toqué**: es el
   estilo del menú del bloque, que lleva aceptado desde FEAT-004, y cambiarlo
   afecta a todos los «···» del módulo. Deuda del sistema de diseño, anotada.
4. **`ENVIRONMENT.md` se ha vuelto a quedar corto**: hoy son **1991 tests**,
   **1.137,93 kB** de chunk y **276,96 kB** de CSS. **No lo he tocado** — es del
   usuario.
5. **El hallazgo 2 del revisor de la tajada 1 ya se puede cerrar y no lo hice**:
   ahora que «Empecé antes» existe, el mensaje de D1 («…Termina «X» y empieza de
   nuevo…») **podría ofrecer corregir la hora de lo que corre**, que es lo que
   pide el criterio 339 con todas las letras. Es una frase y un botón de toast, y
   **es de la tajada 1**: lo dejo escrito en vez de ampliarme.

**Risks:**

- **El «···» de la barra cuesta un toque más** para «Terminar y añadir una nota».
  Es el precio de la puerta que pide el criterio 342 en ese sitio; si el usuario
  lo prefiere de otra forma, lo que cambia es la barra, no nada de lo de debajo.
- **El parche de la caché de la sesión abierta** (`useUpdateActivityFollowUpMutation`)
  corre ahora en **todos** los `activityFollowUpEdit` cuya respuesta siga abierta:
  el guardado de notas de una sesión en marcha pasa por ahí. Se preserva
  `activity` y `sessionSubtasks` explícitamente, y la invalidación de siempre
  sigue detrás; aun así es código nuevo en un camino muy transitado.
- **La hoja consulta el día de la sesión** (`useActivityDayFollowUpsQuery`) para
  saber qué ratos tienen dueño. Desde Hoy está cacheada; desde otra pantalla del
  módulo es **una consulta más al abrir la hoja** —no al entrar en la pantalla—.
- **La comprobación del solape mira solo el instante de inicio**, no el rato
  entero: como la sesión sigue abierta, no hay final que comparar. Una sesión ya
  registrada **después** de la hora nueva no lo impide, y eso es correcto (la que
  corre la terminará el usuario), pero el día puede acabar con dos cosas que se
  pisan si se termina más tarde. Eso ya pasaba antes de esta tajada.
- **Tres archivos de test nuevos** (`VidaAgendaBlock`, `VidaSessionBar`,
  `VidaStartTimeSheet`): los dos primeros **no existían** y solo cubren lo que
  estrena esta tajada. No sustituyen a `VidaHoyPage.test.tsx`.

**Tree state:** sin commitear. Trece archivos modificados y cinco nuevos (la
carpeta `VidaStartTimeSheet/` y dos tests de componente), todos bajo
`src/features/vida` salvo este dossier. El arnés del navegador está borrado.

### Tajada 2 — segunda vuelta: la hora de la barra es la puerta

**Summary for the reviewer:**
1. El «···» de la barra **vuelve a ser exactamente el de `384526a`**: un
   `IconButton` con `onClick={onOpenFinishModal}`. «Terminar y añadir una nota»
   desde la barra **vuelve a costar 1 toque**; el menú que añadí ya no existe.
2. La puerta de «Empecé antes» en la barra es ahora **la línea «desde las 9:00»**,
   tocable —**1 toque**, menos que los 2 del menú—, con el molde de
   `VidaNoteLine`: el `Link` a Hoy se queda sobre el nombre y la línea de la hora
   es un botón hermano.
3. **Lo que más probablemente rompí en esta vuelta:** la **estructura de la
   identidad de la barra**. El `Link` envolvía cápsula + nombre + hora y ahora
   envuelve **solo el nombre**: tocar la cápsula ya no navega a Hoy (el criterio
   7 habla del nombre, y el nombre sigue siendo el enlace, pero el área tocable
   del enlace se reduce). Segundo: quien tenga la costumbre de tocar «desde las
   9:00» sin querer ahora abre una hoja.

**Qué cambió respecto de la primera vuelta:**

- `components/VidaSessionBar/VidaSessionBar.tsx`
  - **Revertido** el `Popover` y sus dos entradas. El «···» es el de HEAD, con su
    `aria-label` de siempre («Terminar «X» con duración, notas y subtareas»).
  - La identidad se reparte: `<span class="identity">` con la cápsula y una
    columna donde el **nombre es el `Link`** y la **hora es un `button`** cuando
    llega `onCorrectStart`; sin esa prop, la hora es el mismo `<span>` de
    siempre y la barra se pinta **exactamente como antes de FEAT-013**.
  - El nombre accesible del botón **contiene el texto visible**
    («desde las 9:00 — corregir a qué hora empezaste «Trabajar»»), para que quien
    dicta por voz acierte el control.
  - `metaLabel` sale a una constante: el «llevas 52 min · planeado 45» del
    criterio 9 sigue siendo lo que se lee cuando te pasas del plan, y **también
    se puede tocar** (un test lo fija).
- `components/VidaSessionBar/VidaSessionBar.module.scss`
  - **Fuera `.menu` y `.menuItem`**: la duplicación que señalaste desaparece sola,
    no queda deuda escrita. La lista de selectores vuelve a ser **la de HEAD**:
    `.bar .capsule .identity .meta .name .root .row .text .timer`.
  - `.identity` deja de ser el enlace (pierde su `:focus-visible`, que se va al
    nombre); `.name` gana estilos de enlace; `button.meta` es el molde de
    `button.line` de `VidaNoteLine` —subrayado punteado, sólido al pasar por
    encima, sin disfrazarse de botón— con `align-self: flex-start` para que
    **no recoja toques en el vacío** de la derecha (a 760 px la columna mide 440
    y el texto 69).
- `components/VidaStartTimeSheet/VidaStartTimeSheet.tsx` — **el hallazgo del
  estado de carga, resuelto**: `resolveDaySessions()` **espera** a la consulta
  del día si está en vuelo (`fetchStatus !== 'idle'` → `await refetch()`) antes
  de comprobar el solape. Si está parada —sin sesión de usuario, o ya falló— no
  espera a nada y se guarda igual, que es lo que pide el criterio 358.
- Tests: `VidaSessionBar.test.tsx` **reescrito** (5 tests: el toque único en la
  hora, el «···» intacto **y** «Terminar» intacto, el enlace del nombre a Hoy, la
  barra sin la prop, y la línea de «te pasaste del plan» tocable) y
  `VidaStartTimeSheet.test.tsx` **+1** (con los ratos del día en vuelo, guardar
  **espera** y el solape se caza; sin el arreglo, ese test falla en su primera
  aserción).

**Los toques, contados otra vez sobre el árbol nuevo:**

| Gesto | HEAD (`384526a`) | Ahora | Δ |
|---|---|---|---|
| **Terminar**, desde la barra | 1 | 1 | **0** |
| **Terminar y añadir una nota**, desde la **barra** | 1 | **1** | **0** |
| **Terminar y añadir una nota**, desde el **bloque** | 2 | 2 | **0** |
| **Empezar** (el ▶ y la hoja) | 1 / el gesto de FEAT-013 t1 | igual | **0** |
| **Corregir la hora** desde la **barra** | no existía | **1** + escribir + «Guardar» | — |
| **Corregir la hora** desde el **bloque** | no existía | 2 + escribir + «Guardar» | — |

**Verification (segunda vuelta):**

```
pnpm typecheck → limpio (exit 0)
pnpm lint      → ✖ 14 problems (14 errors, 0 warnings)   [los mismos nueve archivos ajenos]
pnpm test      → Tests 2 failed | 1992 passed (1994)     [SearchSelect ×2, preexistentes]
pnpm build     → exit 0 · index 1.137,69 kB · CSS 276,97 kB · app-icons 620,20 kB sin tocar
```

Paquete **+4,11 kB** sobre la base (1.133,58) y CSS **+1,06 kB** (base 275,91).
El CSS **sube** aunque se hayan quitado `.menu`/`.menuItem`: entran la hoja nueva
y los estilos del nombre y de la línea tocable. Selectores comparados con `sass
--style=compressed`, no tamaños:

```
VidaSessionBar      → .bar .capsule .identity .meta .name .root .row .text .timer   (los nueve de HEAD, ni uno más)
VidaStartTimeSheet  → .error .field .footer .form .hint
```

**En el navegador, medido por mí en esta vuelta** (arnés temporal borrado; dev
server del usuario en el 5173, no se arrancó ni se paró nada). Dos `iframe` de
**375** y **760 px** exactos, en `position: absolute` para que ningún `flex` los
encogiera:

| Qué | 375 px (título de 60 caracteres) | 760 px |
|---|---|---|
| Documento | `scrollWidth === clientWidth === 375`, **0 nodos desbordados** | `scrollWidth === 760`, **0 desbordados** |
| La línea de la hora | botón de **69 × 18 px**, subrayado punteado, texto «desde las 9:00» | **69 × 18 px** (no se estira con la columna de 440) |
| El nombre | enlace a `/app/vida/hoy?d=2026-09-23`, recortado con puntos suspensivos (93 px) | enlace, 440 px |
| El «···» | 28 × 28 px con su `aria-label` de siempre | igual |
| Un toque en la hora | **abre la hoja**, que ocupa los 375 px | — |
| Oscuro | la hora **7,88:1**, el nombre **14,89:1** sobre `rgb(22,30,47)` | igual |

**Criterios que esto mueve:**

| # | Estado | Evidencia |
|---|---|---|
| 342 | ✅ | Las dos puertas siguen: el «···» del bloque en marcha (test de `VidaAgendaBlock`) y **la barra** —ahora por su línea de la hora, que es lo que pide el criterio: «desde la barra de sesión»—. Visto además en el navegador. |
| 349 | ✅ **ahora sí** | El «···» de la barra es literalmente el de HEAD: mismo elemento, mismo `aria-label`, mismo `onClick`, un toque. Un test lo fija y además comprueba que **no existe** ninguna entrada «Terminar y añadir una nota» en la barra. El menú del bloque tampoco se movió. |
| 7 (FEAT-004) | ✅ **con matiz** | El nombre sigue llevando a Hoy, al día de la sesión (test con el `href`). **El matiz:** la cápsula ya no es parte del enlace. |
| 358 | ✅ | Con la consulta del día **caída** se puede guardar igual y se dice; con la consulta **en vuelo** ahora se espera en vez de saltarse la comprobación. |

**Lo que dejo dicho y no toco:**

- **La línea tocable mide 18 px de alto.** Es un renglón de texto, como
  `VidaNoteLine`, no un botón: el objetivo táctil queda por debajo de 44 px.
  Subirlo con `padding` **engorda la barra**, que es cromo permanente en todas
  las pantallas del módulo. Lo dejo igual que el idioma ya aceptado y lo anoto:
  si el usuario lo encuentra difícil de acertar en el móvil, la salida barata es
  el `padding` vertical, no otro control.
- **El hallazgo 2 del revisor de la tajada 1 sigue abierto** (el mensaje de D1
  podría ofrecer ahora «Empecé antes»): es de la tajada 1 y no me amplío.
- **`ENVIRONMENT.md` sigue corto** (1994 tests, 1.137,69 kB, 276,97 kB). No lo
  toco: es del usuario.

**Tree state:** sin commitear. Catorce archivos modificados y cinco nuevos; el
arnés del navegador, borrado.

### Tajada 2 — retoque: la línea de la hora pasa de 18,4 a 24,8 px

**Summary for the reviewer:** (solo esto; nada de lo aceptado se ha tocado)
1. `button.meta` sube a `padding: 0.4rem 0`: la línea tocable mide **24,8 px**
   de alto a 375 **y** a 760 px, por encima del mínimo de 24 px de WCAG 2.2 AA.
   Sigue midiendo **69,5 px** de ancho: el `align-self: flex-start` se queda.
2. **El hueco reservado de abajo se quedaba corto y lo he subido a `8rem`**: con
   la línea tocable la barra crece **8,3 px** y su huella pasa de 116,6 a
   **124,9 px**, por encima de los **120** que reservaba `7.5rem`. Es el fallo
   que avisa el propio comentario de `VidaModuleLayout.module.scss` (criterio
   60), y lo medí porque me lo pediste.
3. **Lo que más probablemente rompí:** el `padding-bottom` del módulo. Afecta a
   **todas** las pantallas de Vida con algo en marcha —Hoy, Plantilla, Revisión,
   Actividades—: media línea más de aire bajo el contenido. Segundo sospechoso,
   menor: la barra **sin** `onCorrectStart` tenía que seguir midiendo lo de
   siempre y por eso el `padding` vive solo en `button.meta`, no en `.meta`.

**Qué cambió, archivo por archivo:**

- `components/VidaSessionBar/VidaSessionBar.module.scss` — `button.meta` gana
  `margin: 0; padding: 0.4rem 0`, y `.meta` (el `<span>` de cuando no hay
  puerta) **los pierde**: así la barra sin `onCorrectStart` mide exactamente lo
  que medía antes de FEAT-013. Lo comprobé montando las dos variantes a la vez.
  La lista de selectores sigue siendo la de HEAD: `.bar .capsule .identity .meta
  .name .root .row .text .timer`.
- `routes/VidaModuleLayout.module.scss` — la reserva pasa de
  `calc(7.5rem + env(...))` a `calc(8rem + env(...))`, con la medida escrita al
  lado para quien la lea dentro de un año. Selectores intactos: `.errorText
  .root`.
- `components/VidaSessionBar/VidaSessionBar.test.tsx` — **el docblock de
  cabecera corregido**: describía el menú de la primera vuelta, que ya no
  existe. Ahora dice lo que hay: la línea de la hora es la puerta de un toque y
  el «···» no cambió. Ni una aserción tocada.

**Las medidas, hechas por mí en `iframe` de ancho exacto** (dev server del
usuario en el 5173; arnés temporal borrado; la pestaña emula 568 px y por eso no
se mide en ella):

| Qué | 375 px | 760 px |
|---|---|---|
| La línea, **antes** del retoque | 69,5 × **18,4** px | 69,5 × 18,4 px |
| La línea, **ahora** | 69,5 × **24,8** px | 69,5 × **24,8** px |
| La barra **con** la puerta | **112,9** px de alto | 105,7 px |
| La barra **sin** la puerta (= como antes de FEAT-013) | **104,6** px | — |
| Huella hasta el borde (lo que hay que reservar) | **124,9** px con puerta · 116,6 sin ella | 117,7 px |
| Reserva | `7.5rem` = 120 px → **corta por 4,9 px** · `8rem` = **128 px** → sobran 3,1 | igual |
| Desbordes | 0 nodos, `scrollWidth === clientWidth === 375` | 0 nodos, 760 |

**Y la discrepancia, dicha en vez de tragada:** calculaste **~6 px** de
crecimiento y son **8,3**. El motivo es que el `<span>` de la hora heredaba la
`line-height` de la barra (16,5 px de caja) y el `<button>` usa `normal`
(12 px + 12,8 de `padding`): 24,8 − 16,5 = 8,3. No cambia la decisión —la línea
supera los 24 px y la barra sigue entrando de sobra a 375—, pero **sí obligaba a
mover la reserva**, que con tus 6 px habría quedado justa en 122,9 contra 120 y
habría tapado el último bloque igual.

**Verification:**

```
pnpm typecheck → limpio (exit 0)
pnpm lint      → ✖ 14 problems (14 errors, 0 warnings)   [los de siempre, ninguno de aquí]
pnpm test      → Tests 2 failed | 1992 passed (1994)     [SearchSelect ×2, preexistentes]
pnpm build     → exit 0 · index 1.137,69 kB · CSS 276,97 kB · app-icons 620,20 kB sin tocar
```

Ni el paquete ni el CSS se mueven respecto de la segunda vuelta (**1.137,69 kB**
y **276,97 kB**): lo que cambia son tres declaraciones, no reglas nuevas.
`VidaSessionBar` (15 archivos de componentes y rutas, 213 tests) en verde.

**Criterios que esto mueve:** ninguno cambia de estado. El 342 sigue cumplido y
ahora su control **se acierta con el dedo**; el 60 de FEAT-004 —«la barra no tapa
el último bloque ni los botones de una hoja»— sigue cumplido **porque se movió la
reserva**: con `7.5rem` habría dejado de estarlo, y eso no lo pedía ningún
criterio nuevo, lo pedía el que ya existía.

**Lo único que queda para prueba manual sigue siendo el 361** (detrás del login),
con un paso más que añadir a la lista del revisor: **mirar que bajo el último
bloque de la agenda sigue habiendo aire** con algo en marcha, en Hoy y en
Revisión.

**Tree state:** sin commitear.

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

### Tajada 2 — «Empecé antes»: corregir la hora de una sesión en marcha

**Veredicto: devuelta** — porque el «···» de la barra de sesión deja de ser un
botón de un toque y «Terminar y añadir una nota» pasa a costar **dos**, y eso es
el criterio 349 leído literal («no se mueve ni cambia») y es la premisa del
módulo pagada por una tajada que el propio dossier llama **secundaria**. Todo lo
demás está bien y medido: no devuelvo nada más.

**Los toques, contados sobre el código de HEAD y sobre el árbol:**

| Gesto | Antes (`384526a`) | Ahora | Δ |
|---|---|---|---|
| **Terminar**, desde la barra | 1 (`Button` «Terminar») | 1 | **0** |
| **Terminar**, desde el bloque | 1 | 1 | **0** |
| **Terminar y añadir una nota**, desde el **bloque** | 2 («···» → entrada) | 2 | **0** |
| **Terminar y añadir una nota**, desde la **barra** | **1** (`IconButton` con `onClick={onOpenFinishModal}`, `VidaSessionBar.tsx:108-114` de HEAD) | **2** («···» → entrada) | **+1** |
| **Corregir la hora** de lo que corre | no existía (ver abajo la puerta rota) | 2 + escribir + «Guardar» | — |

El único gesto que se encarece es ese, y es un gesto de todos los días: es el
camino del criterio 6 de FEAT-004 desde la barra, que es **el control que está
siempre en pantalla** en todo el módulo.

**¿Hay forma de tenerlo sin encarecer nada? Sí, y es más barata todavía.** La
línea **«desde las 9:00»** de la barra es, literalmente, el dato que se viene a
corregir; hoy no hace nada. Tocarla para corregir la hora sería **un** toque —
menos que los dos del menú— y dejaría el «···» exactamente como estaba. La
objeción del constructor es que esa línea vive dentro del `Link` a Hoy
(`VidaSessionBar.tsx:96-108`) y un botón dentro de un enlace no se hace: cierto,
pero el remedio no es renunciar, es **sacar la línea del `Link`** y dejar el
enlace sobre la cápsula y el nombre. Que eso se puede hacer en esta misma tarjeta
ya está demostrado: **`VidaNoteLine` es justo eso** —una línea tocable, hermana
del `Link`, dentro de la misma tarjeta (`VidaSessionBar.tsx:163-170`), aceptada
en FEAT-018—. El criterio 342 pide la puerta «desde la barra de sesión», **no
desde su «···»**: se cumple igual, y sin subir el precio de nada.

Si el constructor prefiere defender el menú, que lo defienda con el número: hoy
el argumento escrito es «un tercer control sería más estrecho y más ruido», y la
alternativa de la línea tocable **no añade ningún control**.

**Criterios, uno a uno** (contra la sección 1, literal):

| # | Estado | Cómo lo comprobé |
|---|---|---|
| 342 | ✅ | Las dos puertas existen en el árbol: `VidaAgendaBlock.tsx:300-308` (entrada solo con `isRunning && onCorrectStart`) y `VidaSessionBar.tsx:124-158`. `VidaHoyPage.tsx:1038-1044` y `VidaModuleLayout.tsx:182` las cablean. El rótulo, `VIDA_START_TIME_LABEL = 'Empecé antes'`, escrito una sola vez. |
| 343 | ✅ | `correctStartInput` devuelve **`{ id, startTime }`** y nada más (`vida-session.utils.ts:425-430`). Y lo confirmé **en el backend**, no de oídas: `updateFollowUp` arma el `UPDATE` columna a columna con `if (input.durationMinutes !== undefined)` (`xavi-platform-node/src/services/activity-follow-up.service.ts:347-389`), así que sin ese campo la fila conserva `duration_minutes = NULL` y la sesión sigue abierta. |
| 344 | ✅ | El parche de caché de `useUpdateActivityFollowUpMutation` deja la sesión abierta con el `startTime` nuevo **preservando `activity` y `sessionSubtasks`**, que la mutación no devuelve (`FOLLOW_UP_FIELDS` de `activity-followups.graphql.ts` no incluye `FOLLOW_UP_ACTIVITY_FIELDS`; lo verifiqué abriendo el documento). El cronómetro cuenta contra `startTime`, así que recuenta sin recargar. |
| 345 | ✅ por construcción | `closeSessionInput` y `finishNow` no aparecen en el diff. Queda sujeto de verdad por el 361. |
| 346 | ✅ | `validateCorrectedStart` delega en `validateStartTime` con `date: session.date`: mismas frases, y la fecha no se toca. Además la barra **no se pinta** para una sesión de otro día (`VidaModuleLayout.tsx:138`, `hasBar` exige `!isFromAnotherDay`), así que «ayer» sigue fuera de alcance como decía el dossier. |
| 347 | ✅ | `useVidaSessionActions.correctStart` usa la mutación en `silent` y lanza **«Contamos desde las {hora}»**. Sin «cancelar» ni «eliminar». |
| 348 | ✅ | `VidaStartTimeSheet.handleSave` solo llama a `onClose()` si `saved.ok`; si no, pinta el mensaje en un `role="alert"` y conserva lo escrito. No hay escritura optimista en ninguna parte del camino. |
| 349 | ❌ **no cumplido, y es la devolución** | En el **bloque** sí se cumple: la entrada nueva va debajo y la de siempre no se movió (`VidaAgendaBlock.tsx:297-308`), y una sesión cerrada sigue con «Corregir» / «Quitar del registro». En la **barra** no: lo que ese «···» hacía —abrir el cierre completo— **cambió**, pasó de ser la acción del botón a ser una entrada de menú, y cuesta un toque más. El propio constructor lo declara; el criterio dice «no se mueve ni cambia». |
| 361 | ⏳ **sigue pendiente del usuario** | Detrás del login. Los pasos, abajo. No lo apruebo por simpatía: sin él, el 345 solo está sujeto por lectura de código. |

**Qué rompí cerca, y cómo lo busqué** (no solo el resultado):

- **`graphify explain "useUpdateActivityFollowUpMutation"`** — el sospechoso más
  silencioso, el del parche de caché. El grafo (que refleja **antes** del cambio,
  que es lo que quiero para «quién dependía de esto») da tres llamadores:
  `VidaLogSessionSheet`, `useVidaSessionActions` y **`useVidaSessionNote`**. Abrí
  los tres. El de notas (FEAT-018) es el que me preocupaba: manda
  `{ id, notes }`, la respuesta sigue `isOpen`, así que **ahora pasa por el
  parche**. No rompe nada y de hecho mejora: no hay escritura optimista con la
  que chocar (`useVidaSessionNote.ts:31-40`), el parche solo cambia la identidad
  del objeto en caché —no desmonta la barra, y `useVidaElapsed` cuenta contra
  `Date.now()`, no contra el montaje: criterio 543 de FEAT-018 intacto— y la nota
  aparece sin esperar a la consulta. El guardia `if (open.id !== data.id) return
  current` cubre editar un rato cerrado con otra sesión viva.
- **`graphify explain "VidaSessionBar"`** — solo la monta `VidaModuleLayout`. El
  `aria-label` viejo («Terminar «X» con duración, notas y subtareas») lo busqué a
  mano en todo `src/`: solo vive en el propio componente y en el test nuevo, así
  que ninguna suite ajena lo consultaba.
- **Lo de esta semana, por intersección de ficheros** (`git show --stat` de
  `384526a`, `68dac8b`, `d892e50`, `371c190`, `17e69be`): FEAT-010 tajada 2 vive
  en `VidaUpNextCard.{tsx,module.scss}`; FEAT-020 en `AppLayout`, `RetryNotice` y
  `Toast` `.module.scss`; FEAT-019 en `vida-goals.*`, `VidaAjustesPage` y un
  trozo de `VidaHoyPage.tsx`. **Ninguno de esos ficheros está en el diff** salvo
  `VidaHoyPage.tsx`, y ahí el cambio son dos props del bloque y el `onEdit` de la
  fila suelta: no roza el arco, ni el semáforo, ni los días laborables.
- **El test intocable del arranque de un toque**: lo comprobé **en el diff**, no
  por lo que él dice. `VidaHoyPage.test.tsx` tiene exactamente **dos hunks**, los
  dos añadiendo `openStartTimeSheet: () => {}` al `VidaSessionUiContext.Provider`
  de dos helpers. `it('un solo toque arranca, y **la duración planeada no
  viaja**…', línea 2511)` y `it('criterio 5 — «Terminar» es un solo toque…',
  línea 1147)` **no aparecen en el diff**: ni una línea tocada, y los dos en
  verde.
- **La puerta rota que arregló de paso, verificada**: en `HEAD`,
  `VidaHoyPage.tsx` enrutaba el «Corregir» de una fila suelta **en marcha** a
  `openLogSheet({ mode: 'edit', session })` sin condición (`git show
  HEAD:…:970-975`). Esa hoja llama a `validateLogPast`, que con
  `durationMinutes === null` devuelve **«Elige cuánto duró.»**
  (`vida-session.utils.ts:349-351`), y en cuanto se elige una,
  `editSessionInput` manda `durationMinutes` (`VidaLogSessionSheet.tsx:297-300`),
  que en el backend escribe `duration_minutes` y **cierra la sesión**. El
  diagnóstico del constructor es **cierto**: era un callejón que terminaba lo que
  el usuario venía a corregir. **Es un defecto preexistente arreglado de paso y
  hay que contarlo como tal**, no como cambio de comportamiento sin pedir. La
  nota de esa sesión no se pierde por el desvío: tiene su propia puerta
  (`onEditNote`, FEAT-018).

**La regla que se inventó, juzgada:** el backend **no comprueba nada** —lo leí
entero: `updateFollowUp` no consulta solapes, solo `getOwnedFollowUpOrThrow` y un
`UPDATE` por columnas—, así que la comprobación en cliente es **necesaria** y
está bien puesta (mira solo el instante de inicio, admite ser consecutivas, y
excluye la propia sesión). Las palabras, *«Ese rato ya lo tiene «Desayunar»,
hasta las 8:30. Elige una hora desde esa.»*, dicen **qué pasa** y **qué hacer**,
sin reproche: correctas. Único reparo, de estilo: comillas angulares dentro de
comillas angulares.

**Que no regañe:** revisado texto a texto. «Empecé antes», «¿A qué hora
empezaste?», «Sigue en marcha y llevarías 2 h 1 min.», «Contamos desde las 8:07»,
«Sigue en marcha como estaba; inténtalo otra vez». Ni «olvidaste», ni «tarde», ni
«deberías», ni «error». Criterio 359 cumplido: corregir una hora no se presenta
como admitir un error.

**El cronómetro al guardar:** no puede parpadear ni saltar a un imposible, porque
no hay escritura optimista (nada se pinta hasta que el API responde) y el parche
escribe el `startTime` **que devolvió el servidor**. La barra no desaparece: el
parche nunca pone `null` mientras `data.isOpen`, y conserva `activity`. Queda
confirmado a ojo por el usuario en el 361.

**Línea base, medida yo** (no copiada de la sección 3):

```
pnpm lint   → ✖ 14 problems (14 errors, 0 warnings)      = base
pnpm build  → dist/assets/index-*.css  276,96 kB         (base 275,91 → +1,05)
              dist/assets/index-*.js 1.137,96 kB         (base 1.133,58 → +4,38)
pnpm test   → 1ª corrida: 4 fallos de 1991 (2 ficheros)
              2ª corrida: 2 fallos de 1991 — SearchSelect ×2, preexistentes
```

Los dos fallos extra de la primera corrida **no se reprodujeron**; es el patrón
flaky que describe `ENVIRONMENT.md`. **Reconozco el agujero**: filtré mal la
salida de la primera corrida y no capturé sus nombres, así que no puedo jurar que
fueran los de `IconPicker`. La segunda corrida, limpia, es la que cuenta.

**El CSS, comparado como manda `ENVIRONMENT.md`** —lista de selectores, no
tamaño—, compilando `HEAD` y el árbol con `sass --style=compressed`:

```
VidaSessionBar HEAD  → .bar .capsule .identity .meta .name .root .row .text .timer
VidaSessionBar árbol → los mismos nueve + .menu .menuItem
VidaStartTimeSheet   → .error .field .footer .form .hint
```

Ninguna regla comida: la subida es legítima. Y ningún otro `.scss` aparece en el
diff, así que el riesgo de comentario abierto está acotado a esos dos.

**Estados que nadie construye:**

- **Sin datos** — no aplica: la hoja siempre tiene una sesión.
- **Cargando** — **flojo, y es hallazgo**: mientras `useActivityDayFollowUpsQuery`
  está en vuelo, `daySessions` es `[]`, así que la comprobación de solape
  **no se hace** y se puede guardar una hora que pisa otro rato. Se cierra solo
  en cuanto la consulta vuelve (desde Hoy ya está cacheada), pero desde otra
  pantalla del módulo hay una ventana real. No lo pedía ningún criterio: queda
  anotado, no devuelve la tajada.
- **Error** — cubierto y bien: fallo del API (criterio 348) y consulta del día
  caída (el `Alert` que deja guardar igual, criterio 358).
- **Sin permisos** — no aplica: no hay roles en este producto.
- **Texto largo** — cubierto por el constructor a 60 caracteres; el `description`
  de la hoja no trunca, pero `SteppedModal` ya lo envuelve.
- **Móvil** — **no lo medí yo**: me quedé sin turnos para montar el arnés a 375 y
  760 px. Lo dice arriba en «lo que no revisé». Los números del constructor
  (`scrollWidth === clientWidth`, 0 desbordados, menú hacia arriba) son
  plausibles y coherentes con `.menu { min-width: 8rem; white-space: nowrap }`
  más `placement="top-end"`, pero **no son míos**.

**Los 28 px del menú, y de quién es la deuda:** `.menuItem` del árbol es **copia
literal** de `VidaAgendaBlock.module.scss:132-144` (mismo `padding: 0.45rem
0.55rem`, mismo `font-size: 0.8125rem`) — lo comparé línea a línea. Así que el
estilo **se hereda**, tiene razón en eso. Pero la respuesta honesta a la pregunta
es que **esta tajada lo extiende a un sitio nuevo**: hasta ahora los 28 px vivían
dentro de un menú que se abre desde una tarjeta de la agenda; ahora gobiernan la
única salida del control que **está siempre en pantalla**. La deuda es del
sistema de diseño y no se arregla aquí; pero si la barra acaba teniendo menú, el
menú de la barra es el primer sitio donde 28 px duelen.

**¿Duplica algo que ya existía?** No hay sección 2 (`architect: no`), así que esta
pregunta pesa más. La hoja nueva **no** duplica `VidaLogSessionSheet`: el motivo
—`edit` manda duración y la duración cierra— es correcto y lo verifiqué en el
código. Sí hay **duplicación menor y evitable**: `.menu` / `.menuItem` son ahora
el mismo bloque de SCSS copiado en dos módulos, y el `<ul><li><button>` del menú
está escrito dos veces. Un `VidaMenuList` compartido habría evitado las dos. Es
un hallazgo de estilo, no motivo de devolución.

**Lo que NO revisé** (turnos): la medición propia en el navegador a 375 y 760 px,
y el recorrido de punta a punta de la hoja. Me apoyé en el código, en los tests y
en las mediciones del constructor para esa parte, y lo digo aquí en vez de
taparlo.

**Para el usuario — lo que falta probar a mano** (detrás del login, cuando la
tajada vuelva arreglada):

1. Con algo **en marcha**, abre el «···» del bloque en la agenda de Hoy →
   «Empecé antes».
2. Pon **8:07** y «Guardar». Debe leerse «Contamos desde las 8:07».
3. Comprueba que **la barra de abajo sigue ahí**, que su cronómetro salta al
   tiempo real **sin recargar** y que la sesión **no se ha cerrado**.
4. Pulsa «Terminar» y mira que los minutos guardados son los de **desde las
   8:07**.
5. Prueba una hora **del futuro** (debe decir que todavía no ha llegado) y una
   **dentro de otro rato ya registrado** (debe nombrarlo).
6. Y lo que motiva la devolución: mira cuántos toques te cuesta ahora «Terminar
   y añadir una nota» **desde la barra**, y di si lo aceptas.

### Tajada 2 — segunda vuelta

**Veredicto: aceptada** — la fila que devolvió la tajada vuelve a **1 toque**,
medido por mí sobre el árbol y sobre `384526a`, y no ha vuelto nada de lo que ya
estaba bien. Quedan **tres hallazgos escritos** —la superficie del enlace, los
18 px de la línea nueva y el borde de «sin red»— y ninguno es motivo de
devolución: ningún criterio los pide y son la clase de cosa que se anota, no la
que se rechaza. El criterio **361 sigue siendo del usuario**.

**1 · Los toques, medidos otra vez** (código de `HEAD` contra el árbol):

| Gesto | HEAD (`384526a`) | 1ª vuelta | Ahora | Δ sobre HEAD |
|---|---|---|---|---|
| **Terminar**, barra | 1 | 1 | 1 | **0** |
| **Terminar y añadir una nota**, **barra** | 1 | 2 ❌ | **1** | **0** ✅ |
| **Terminar y añadir una nota**, **bloque** | 2 | 2 | 2 | **0** |
| **Corregir la hora**, barra | no existía | 2 | **1** + escribir + «Guardar» | — |
| **Corregir la hora**, bloque | no existía | 2 | 2 + escribir + «Guardar» | — |

El `IconButton` del «···» es el de `HEAD` **sin una línea de diferencia**: el
diff de `VidaSessionBar.tsx` solo le añade comentario encima; mismo
`aria-label`, mismo `onClick={onOpenFinishModal}`. Y el test lo sujeta por los
dos lados: pulsa el «···» y además comprueba que **no existe** ninguna entrada
«Terminar y añadir una nota» en la barra.

**2 · La superficie del enlace a Hoy, medida antes y después.** Arnés temporal
propio (iframes de 375 y 760 px en `position: absolute`, sobre el 5173 del
usuario; borrado antes de escribir esto — `git status` no lo lista):

| Ancho | Enlace **antes** (`Link` = `.identity`: cápsula + nombre + hora) | Enlace **ahora** (`Link` = `.name`) | Pérdida |
|---|---|---|---|
| 375 px | 133,8 × 39,4 px = **5.269 px²** | 93 × 21 px = **1.954 px²** | **−63 %** |
| 760 px | 480,7 × 39,4 px = 18.928 px² | 439,9 × 21 px = 9.238 px² | −51 % |

(El «antes» es la caja de `.identity`, que no ha cambiado de tamaño: solo dejó de
ser el enlace. La cápsula, 32 × 32 = 1.024 px², es la parte que se pierde entera.)

**Mi juicio: es una pérdida real, pero no rompe el criterio 7 ni devuelve la
tajada.** El criterio dice, literal, «un toque **en el nombre** lleva a Hoy»
(FEAT-004:150-154): la cápsula nunca estuvo prometida, y el nombre sigue siendo
el enlace y sigue apuntando a `/app/vida/hoy?d=<fecha de la sesión>` (medido en el
DOM y fijado por un test). Además volver a Hoy tiene otro camino: la píldora del
módulo. **Lo que sí anoto** es que el enlace se queda en **21 px de alto**, que
para un dedo es poco: si alguna vez se toca esto, el arreglo barato es
`padding` vertical en `.name`, no rehacer la estructura. Y que la estructura
nueva es **necesaria**: un `<button>` no cabe dentro de un `<a>`, así que sacar
la hora del enlace no era opcional una vez elegida la línea como puerta.

**3 · Los 18 px, medidos — y el molde que se invoca no es el que se usó.**
El botón de la hora mide **69,5 × 18,4 px** (padding `3,2 px 0`, fuente 11 px),
a 375 y a 760 igual: confirma su cifra. Pero medí también los vecinos, y ahí la
justificación se cae:

| Control de la barra | Tamaño medido |
|---|---|
| **`VidaNoteLine`** —el molde que él invoca— | **330,6 × 32,3 px** |
| «Terminar» | 88 × 32 px |
| El «···» | 28 × 28 px |
| **La hora, nueva** | **69,5 × 18,4 px** |

`VidaNoteLine` es un renglón tocable, sí, pero ocupa **el ancho entero y 32 px de
alto**: 10.678 px² contra los 1.279 px² de la hora, **ocho veces más**. El molde
se heredó en lo visual (texto subrayado punteado, hermano del enlace) y **no** en
lo que aquí importa, que es el objetivo táctil. Con lo medido, la línea de la hora
es **el control más pequeño de toda la barra** y el único por debajo de los 24 px
que pide WCAG 2.2 AA como mínimo — los 28 px del menú que anoté en la primera
vuelta sí lo pasaban.

**Aun así no devuelvo, y digo por qué:** ningún criterio de esta feature fija un
tamaño de objetivo táctil (355 pide «sin scroll horizontal», 357 el contraste), y
en la primera vuelta traté los 28 px como hallazgo, no como devolución: cambiar de
vara ahora sería arbitrario. Que sea una acción de reparación y no diaria **baja
la frecuencia del error, no su tamaño**: quien falla el toque en un teléfono
falla igual. Y el remedio que él mismo nombra cuesta una línea: subir el padding
de `0.2rem` a `0.4rem` deja la línea en ~25 px. Conviene saber que **la barra ya
ha engordado**: `.identity` pasa de 33 px (nombre 21 + hora 12 sin padding) a
**39,4 px** medidos, o sea +6,4 px de cromo permanente que ya se gastaron sin
decirlo. Gastar seis más y quedar por encima del mínimo parece mejor trato que
quedarse a mitad de camino. **Decisión del usuario, no mía**; queda escrito.

**4 · El estado de carga, verificado en el código.** `handleSave` hace
`setIsSaving(true)` **antes** del `await`, así que mientras se espera el botón
dice «Guardando…» y está inhabilitado: no queda mudo ni parece que no pasa nada.
`refetch()` resuelve también cuando la consulta falla (devuelve el resultado con
su error), así que la hoja no se cuelga. Y el caso «falló la consulta» **no acaba
en solape silencioso**: tras el fallo `fetchStatus` vuelve a `idle`, se devuelve
`[]` y se guarda igual —criterio 358—, pero la hoja está enseñando el `Alert`
«No pudimos mirar el resto del día. Puedes guardar igual: solo cambia desde
cuándo contamos esto.» Se dice. ✅

**Hallazgo del borde:** hay un tercer `fetchStatus`, **`paused`**, que es el del
dispositivo sin red. Ahí `await refetch()` no resuelve hasta que vuelva la
conexión y el botón se queda en «Guardando…». **No lo cuento como regresión**
porque sin red la mutación de guardar también queda en pausa —el usuario no iba a
guardar de todos modos—, pero si alguna vez se toca, tratar `paused` como `idle`
es la misma línea.

**5 · Nada de lo ya aceptado ha vuelto atrás.** Comprobado fichero a fichero en
el diff, no por lo que dice el resumen:

- **El arreglo del `edit` que cerraba la sesión**: `VidaHoyPage.tsx:980` sigue con
  `session.durationMinutes === null ? openStartTimeSheet(session) : openLogSheet(...)`.
- **El parche de caché**: las mismas 16 líneas en `useActivityFollowUps.ts:100-115`,
  con `activity` y `sessionSubtasks` preservados. (El segundo `setQueryData` sobre
  `followUps.open()` que aparece en el fichero, línea 129, es el de
  `useDeleteActivityFollowUpMutation` y es **preexistente**: lo abrí para
  descartarlo.)
- **La regla del solape y sus palabras**: una sola aparición de «Ese rato ya lo
  tiene», sin tocar.
- **El test intocable del arranque**: `VidaHoyPage.test.tsx` sigue teniendo
  **exactamente dos hunks** (`git diff -U0` → `@@ -2541` y `@@ -3869`), los dos
  añadiendo `openStartTimeSheet: () => {}` a un `Provider`. `it('un solo toque
  arranca…')` (2511) y `it('criterio 5 — «Terminar» es un solo toque…')` (1147)
  no aparecen en el diff.
- **Criterio 9**: la línea sigue diciendo «llevas 52 min · planeado N» cuando te
  pasas del plan, y ahora además se toca. Hay test.

**6 · La lista de selectores, compilada por mí** (`sass --style=compressed` sobre
`HEAD` y sobre el árbol):

```
VidaSessionBar HEAD  → .bar .capsule .identity .meta .name .root .row .text .timer
VidaSessionBar árbol → .bar .capsule .identity .meta .name .root .row .text .timer
```

**Idénticas, los nueve**: `.menu` y `.menuItem` se han ido de verdad y no se ha
comido nada ningún comentario. La duplicación de SCSS que señalé en la primera
vuelta desaparece con ellos.

**7 · Mis propias medidas** (esta vez sí, era la laguna de la primera vuelta):

| Qué | 375 px | 760 px |
|---|---|---|
| Documento | `scrollWidth === clientWidth === 375`, **0 nodos desbordados** | `scrollWidth === 760`, **0 desbordados** |
| La línea de la hora | 69,5 × 18,4 px | 69,5 × 18,4 px (no se estira: el `align-self: flex-start` cumple) |
| El nombre | enlace de 93 × 21 px, `/app/vida/hoy?d=2026-09-23` | 439,9 × 21 px |
| Nombre de 60 caracteres | recortado con puntos suspensivos, sin desbordar | igual |
| Contraste de la hora, oscuro | `rgb(168,179,199)` sobre el vidrio → **8,86:1** | igual |

Su 7,88:1 es más conservador que mi 8,86:1 (mido sobre un fondo de arnés más
oscuro que el de la app); los dos están muy por encima de 4,5:1, así que el
criterio 357 no corre peligro por ningún lado. De paso queda comprobado que el
**vidrio de FEAT-020 sigue al 92 %**: medí `background-color` de la barra y sale
`srgb(0.043 0.071 0.125 / 0.92)`.

**Línea base, corrida por mí, exacta:**

```
pnpm test  → Tests 2 failed | 1992 passed (1994)   [SearchSelect ×2, preexistentes]
pnpm lint  → ✖ 14 problems (14 errors, 0 warnings)
pnpm build → CSS 276,97 kB · index 1.137,69 kB
```

Cuadra al kilobyte con lo que declara la sección 3.

**Hallazgos menores:** el docblock de cabecera de `VidaSessionBar.test.tsx`
sigue describiendo el menú de la primera vuelta («el «···» pasa a ser un menú con
las dos salidas»), que ya no existe: los tests son correctos, el comentario
miente. Y el `aria-label` del botón de la hora incrusta el título entero, así que
con un nombre de 60 caracteres se lee muy largo en voz alta; no es un defecto,
es un gusto.

**Lo que queda para el usuario, a mano** (detrás del login; la API en Render
tarda ~1 min en despertar):

1. Con algo **en marcha**, toca la línea **«desde las 9:00»** de la barra de
   abajo: debe abrirse «¿A qué hora empezaste?» de un solo toque.
2. Pon **8:07** y «Guardar». Debe leerse «Contamos desde las 8:07».
3. Comprueba que **la barra sigue ahí**, que el cronómetro salta al tiempo de
   verdad **sin recargar** y que la sesión **no se ha cerrado**.
4. Pulsa «Terminar» y mira que los minutos guardados son los de desde las 8:07
   (criterio 345, que solo se cierra aquí).
5. Prueba una hora **del futuro** y otra **dentro de un rato ya registrado**.
6. Comprueba que el **«···» de la barra sigue costando un toque** para terminar
   con nota, y que el **nombre** sigue llevando a Hoy.
7. Y lo único que no puedo medir por ti: **acierta la línea de la hora con el
   dedo** en tu teléfono. Mide 18 px de alto. Si se te escapa, dilo: son seis
   píxeles de `padding` y está arreglado.

### Tajada 2 — retoque de la línea tocable y la reserva de abajo

**Veredicto: sigue aceptada, y el retoque queda verificado.** Miré solo lo que se
pidió. Las cinco cosas están, con mis números, y **los suyos cuadran uno a uno**
—incluidos los dos que yo no había medido bien—. La tajada se puede commitear.

**1 · La línea llega a 24 px, y se puede tocar.** Arnés propio, `iframe` de ancho
exacto en `position: absolute` (dev server del usuario en el 5173; borrado antes
de escribir esto — `git status` no lo lista):

| | 375 px | 760 px |
|---|---|---|
| La línea de la hora | **69,5 × 24,8 px** | **69,5 × 24,8 px** |
| `padding` computado | `6.4px 0px` | igual |
| Desbordes | 0 nodos, `scrollWidth === clientWidth === 375` | 0 nodos, 760 |

Supera los **24 px** del mínimo AA de WCAG 2.2, que era exactamente lo que
faltaba. Y que **se toca de verdad** lo comprobé sin fiarme del render:
`elementFromPoint` en el centro **y** en la esquina superior izquierda del botón
devuelve el propio botón —nada lo tapa—, con `pointer-events: auto` y sin
`disabled`. Que ese toque abre la hoja lo fija además el test de
`VidaSessionBar.test.tsx` («un toque en «desde las 9:00» corrige la hora»), que
sigue en verde.

**2 · La barra sin la puerta no ha engordado. Confirmado montando las dos.**

| Variante | La línea | Alto de la barra | Huella hasta el borde |
|---|---|---|---|
| **Sin** `onCorrectStart` (como antes de FEAT-013) | `<span>` de 93 × **16,5** px, `padding: 0px` | **104,6 px** | **116,6 px** |
| **Con** la puerta | `<button>` de 69,5 × **24,8** px | **112,9 px** | **124,9 px** |

El `padding` vive solo en `button.meta`: el `<span>` lo tiene en `0px`, medido.
Su afirmación central se sostiene: **quien no tenga esta puerta paga cero**.

**Y aquí corrijo un número mío, que es lo que hay que hacer con los propios
errores.** En la segunda vuelta escribí que la barra «ya había engordado
+6,4 px». **Era falso**, y lo era porque lo deduje restando el `padding` en vez
de medir: di por hecho que el `<span>` de HEAD medía 12 px. Mide **16,5**, porque
hereda la `line-height` de la barra mientras que el `<button>` usa `normal`. Las
cifras buenas: HEAD 104,6 → segunda vuelta 106,5 (**+1,9 px**, no 6,4) → ahora
112,9 (**+8,3 px sobre HEAD**). Su explicación de la discrepancia es correcta y
además **encaja con lo que yo mismo medí en la segunda vuelta** (106,5 px de
barra), así que las tres medidas cuentan la misma historia.

**3 · La reserva de `8rem`: suficiente, y no sobra.** `8rem` = **128 px** contra
una huella de **124,9 px** con la puerta a 375 px: quedan **3,1 px** de aire —
justo, pero por encima—. Con `7.5rem` (120 px) faltaban **4,9 px** y el último
bloque quedaba tapado, que es lo que el criterio 60 evita: **la subida era
necesaria, no un margen de seguridad inventado**. Y no es excesiva: a 760 px
sobran 10,3 px, que es medio renglón y nadie lo lee como un salto. De paso queda
claro que en la segunda vuelta **todavía cabía** (huella ~118,5 < 120): lo que
rompió la reserva fue este retoque, no lo anterior.

**Sobre las demás pantallas**, que es lo que preguntabas: la reserva vive en **un
solo sitio**, `.root[data-session-bar='on']` de `VidaModuleLayout.module.scss`,
el contenedor que envuelve el `<Outlet/>` de **todo** el módulo. Así que Hoy,
Plantilla, **Revisión** y Actividades reciben los mismos **+8 px**, y solo
**cuando hay algo en marcha**: sin sesión el selector no aplica y ninguna pantalla
cambia ni un píxel. Más aire por debajo no puede tapar nada —solo podría sobrar—,
y 8 px no se ven. **Lo que no puedo hacer es mirar Revisión con datos**: está tras
el login. Va a los pasos manuales.

**4 · Los toques, sin moverse.** Verificado en el código, no en el resumen: no
queda **ni una** mención de `Popover` en `VidaSessionBar.tsx` (0 coincidencias), y
los tres manejadores cuelgan directos de su control —`onFinish` del `Button`
(línea 138), `onOpenFinishModal` del `IconButton` (151), `onCorrectStart` del
botón de la hora (123)—:

| Gesto | HEAD | Ahora | Δ |
|---|---|---|---|
| **Terminar**, barra | 1 | **1** | **0** |
| **Terminar y añadir una nota**, barra | 1 | **1** | **0** |
| Terminar y añadir una nota, bloque | 2 | 2 | **0** |
| Corregir la hora, barra | no existía | **1** + escribir + «Guardar» | — |

**5 · Las listas de selectores, compiladas por mí** (`sass --style=compressed`,
`HEAD` contra el árbol, en los dos `.scss` tocados):

```
VidaSessionBar   HEAD → .bar .capsule .identity .meta .name .root .row .text .timer
VidaSessionBar  árbol → .bar .capsule .identity .meta .name .root .row .text .timer
VidaModuleLayout HEAD → .errorText .root
VidaModuleLayout árbol → .errorText .root
```

**Idénticas las dos.** Ningún comentario se ha comido nada, y encaja con que el
CSS no se mueva: son declaraciones, no reglas.

**Línea base, corrida por mí:**

```
pnpm test  → Tests 2 failed | 1992 passed (1994)   [SearchSelect ×2, preexistentes]
pnpm lint  → ✖ 14 problems (14 errors, 0 warnings)
pnpm build → CSS 276,97 kB · index 1.137,69 kB
```

**Ni un byte de diferencia** con la segunda vuelta, como decía.

**Un hallazgo nuevo, pequeño y del retoque:** el borde superior del botón de la
hora **toca el borde inferior del enlace del nombre** —`gap` medido: **0 px**—,
así que los 6,4 px de `padding` de arriba quedan pegados bajo un enlace de 21 px.
Un dedo que apunte bajo del nombre abre la hoja en vez de ir a Hoy. No es
regresión (antes esa zona era texto muerto) ni lo pide ningún criterio, y separar
los dos costaría subir otra vez la barra: queda escrito, y si el usuario lo nota
al probar, ya sabemos dónde está.

**Para el usuario, un paso más en la prueba manual** (los seis anteriores siguen
igual):

8. Con algo en marcha, baja del todo en **Hoy** y en **Revisión**: bajo el último
   bloque tiene que quedar **aire**, sin que la barra tape nada. Y en tu teléfono,
   **acierta la línea de la hora**: ahora mide 24,8 px, un tercio más alta.
