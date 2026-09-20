# Feature board

One row per feature. It's the index, not the content: to know *what* exists
you read here; to know *what's known*, the dossier (`FEAT-NNN-*.md`).

The user decides the order, not an agent. The state and slice rules are in
[PROTOCOL.md](PROTOCOL.md); this project's addresses and gotchas, in
`ENVIRONMENT.md` (here or in `docs/bugs/`).

| ID | State | Slice | Area | Title | Requested |
|---|---|---|---|---|---|
| FEAT-001 | delivered | 3/3 | layouts, app/router, features/vida | Cimientos del módulo Vida — la barra cambia de módulo y Vida existe como cascarón | 2026-09-19 |
| FEAT-002 | delivered | 4/4 | features/vida | El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días | 2026-09-19 |
| FEAT-003 | delivered | 5/5 | features/vida | Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos | 2026-09-20 |
| FEAT-004 | building | 4/4 | features/vida | Hoy — vivir el día: lo real encima de lo planeado, con cronómetro y registro | 2026-09-20 |

The **Slice** column says which one it's on: `2/4` is "the second of four". A
feature in `building` at `3/4` has two accepted and one in progress.

## Delivered

| ID | Area | Title | Delivered |
|---|---|---|---|
| FEAT-001 | layouts, app/router, features/vida | Cimientos del módulo Vida — la barra cambia de módulo y Vida existe como cascarón | 2026-09-19 |
| FEAT-002 | features/vida | El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días | 2026-09-20 |
| FEAT-003 | features/vida | Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos | 2026-09-20 |

**FEAT-004, tajada 3 — revisión: `accepted`** (2026-09-20), **con un recorte
escrito y con dueño**. Los criterios 30–38 y 56 se cumplen; el **35 queda cerrado
solo para las sesiones que se pintan sueltas** —el «···» de una sesión
**emparejada con su bloque** no existe todavía—, y no devuelvo por eso porque es
el reparto del arquitecto y el **criterio 41** de la tajada 4 pide exactamente
eso; pero **la tajada 4 no se puede aceptar sin ello**, o el camino más común de
todos (empezar y terminar un bloque) se quedará sin poder corregirse. Medido con
arnés propio (9 casos, borrado, con proveedores de verdad): un **día pasado**
tiene **un solo botón** en la fila del día —«Registrar tiempo pasado»— sin
«Empezar algo» ni atajos de plan; un **día futuro**, ninguno de los dos; y el
«···» de una sesión suelta ofrece **«Corregir»** y **«Quitar del registro»** con
diálogo «¿Quitar «X» del registro?», salida **«Volver»** que no llama a la
mutación, y **cero** controles que digan «cancelar», «eliminar» o «borrar»; una
sesión **en marcha** no lo ofrece. `validateLogPast` rechaza el día futuro, la
hora que no ha llegado y el rato a medias, con mensajes que describen sin
reprochar: esa **tercera regla es del constructor, no del criterio 32**, la doy
por razonable y queda escrita —con un aviso: «Lo hice» (criterio 41) creará
sesiones que terminan en el futuro y esta validación las bloqueará al corregir—.
Sin regresiones: `VidaAgendaSession` —que ya no es puro— **solo lo monta
`VidaHoyPage`**, la extracción de `VidaActivityPicker` deja **un solo buscador**
en el módulo (`filterActivitiesBySearch` no aparece en ninguna hoja), y un día
pasado ya **no pide** el plan de la semana anterior. Nada en `localStorage`, nada
de Font Awesome a pelo. Línea base corrida entera por el revisor: typecheck
**exit 0**, lint **14/0**, `pnpm test` **2 fallos de 1101** (los dos de
`SearchSelect`; 1 archivo rojo de 98), `pnpm build` **exit 0** con chunk inicial
**953,93 kB**, `app-icons` **620,20 kB** e `IconPicker` **4,64 kB**. **Sin
revisar por el revisor:** los 375 px y el tema oscuro de la hoja nueva (medidos
por el constructor en un arnés; mi arnés fue de comportamiento, en jsdom) y
cualquier llamada real al API. Siguiente: la tajada 4, la última — y con ella el
«···» de la sesión de un bloque.

**FEAT-004, tajada 3 `in-review`** (2026-09-20, **sin commitear**; la
construcción está en la sección 3 del dossier): **el día ya registra lo que se
sale del plan.** En hoy hay **«Empezar algo»** —elige qué con el mismo molde de
la hoja de FEAT-003 y **arranca ahora mismo, sin preguntar cuánto va a durar**,
delegando en `useVidaSessionActions` para que siga valiendo el «cierra la
anterior» de D4— y **«Registrar tiempo pasado»** —qué · a qué hora empezó ·
cuánto, con las píldoras 15 · 30 · 45 · 1h · libre y `activityFollowUpAdd`—, que
**también está en los días de atrás** aunque su plan siga sin tocarse (D10); en
un día **futuro**, ninguno de los dos. Lo registrado sale en la agenda en su hora
por el cruce que ya hacía la tajada 2, y su **«···»** lleva a **«Corregir»**
(hora, duración y notas) y a **«Quitar del registro»** (confirmación que nombra
qué se quita, salida **«Volver»**). **Registrar no toca el plan** y está
comprobado con espía: tras registrar, las **cuatro** mutaciones de
`activityDayPlan` siguen sin llamarse. La **hoja de «qué» se extrajo**
(`components/VidaActivityPicker/`) y **la estrenan las dos** el mismo día, con un
test que lo afirma **por estructura**: ninguna de las dos hojas vuelve a nombrar
`filterActivitiesBySearch` ni `useActivitiesQuery`. Línea base sin empeorar:
typecheck limpio, lint **14/0**, `pnpm test` **2 fallos de 1100** (los dos de
`SearchSelect`; **+44 tests**, 1 archivo rojo de 98), `pnpm build` chunk inicial
**953,93 kB** (+8,4 kB, **ninguno de iconos**: `app-icons` 620,20 e `IconPicker`
4,64 clavados). **Una desviación dicha**: `validateLogPast` tampoco deja
registrar un rato que **acabaría después de ahora** —el criterio 32 solo prohíbe
el día futuro—, con su test y su mensaje sin culpa. **Avisos para quien revise:**
`VidaPlaceInGapSheet` perdió su buscador y parte de su SCSS, `VidaDayActions` se
pinta ahora **también en días pasados** (su mitad de plan salió a un componente
interno para no pedir el plan de la semana pasada allí) y `VidaAgendaSession`
**ya no es puro**. **Queda abierto y lo digo**: la sesión **emparejada con su
bloque** todavía no se corrige desde la agenda —el «···» del criterio 35 vive en
la sesión suelta, como puso la tabla del arquitecto—; su dueño natural es el
criterio 41, en la tajada 4. Del navegador solo se midió **la hoja sola** a 375
px (sin scroll horizontal, nombre de 47 caracteres truncado en una línea): todo
`/app/*` está detrás del login.

**FEAT-004, tajada 2 — segunda revisión: `accepted`** (2026-09-20). El motivo de
la devolución está cerrado y lo comprobé con **arnés propio de tests puros** (13
casos, borrado), no de palabra: con un bloque «Pasear» 19:00–19:30 y sesiones a
las **07:30** y a las **19:05**, el bloque se lleva la de las 19:05 y se lee
**«✓ calcado»**, la de la mañana sale **«fuera del plan»**, y el presupuesto
cerrado dice `seguido 25m · de más 3m · fuera del plan 30m · sin dato 932m`
sumando **990 = el día entero** (antes: `seguido 0`). Los bordes del umbral
quedan claros —**60 min exactos casan, 61 es movido**— y el **movido sigue
existiendo** cuando al bloque no le queda otra (una sesión a las 12:30 de un
bloque de las 10:00 sigue dando sombra y «150 min tarde», contada una vez). **Y
no se rompió nada de lo que ya medía:** dos bloques de la misma actividad con una
sesión, una sola sesión en marcha en **un solo** bloque, sesiones solapadas,
sesión que cruza el fin del día, día en marcha, día sin registro idéntico a F2 y
huecos partidos sin pisar la sesión — todo 990 = 990. Añadí dos medidas nuevas:
cinco sesiones sobre tres bloques sin que ningún bloque reciba dos ni ninguna
sesión se pinte dos veces, y el cruce **determinista** al invertir el orden de la
entrada. **El cambio de expectativa del test viejo es legítimo**: la sesión de las
12:00 dista 420 min del bloque de las 19:00, así que por el criterio 19 no es
suya. De paso quedaron cerrados los hallazgos **3** (`isFollowUpsError` fuera) y
**6** (el aviso de plantilla vacía ya no se pierde al partirse un hueco). Línea
base corrida entera por el revisor: typecheck **exit 0**, lint **14/0**,
`pnpm test` **2 fallos de 1056** (los dos de `SearchSelect`; 1 archivo rojo de
96), `pnpm build` **exit 0** con chunk inicial **945,56 kB**, `app-icons`
**620,20 kB** e `IconPicker` **4,64 kB**. **Sigue sin cerrarse por un agente:** el
criterio 62 (375 px y tema oscuro **dentro** de la app) y los criterios 52 y 66,
que son del usuario; y queda abierto el hallazgo de que **una sesión fuera del
horario del día no entra en la barra**. Siguiente: la tajada 3, registrar lo que
se sale.

**FEAT-004, tajada 2 `in-review` otra vez** (2026-09-20, **sin commitear**):
**arreglado lo que devolvió la revisión.** `matchSessionsToBlocks` hace ahora
**dos pases** —primero las parejas que cumplen la condición del criterio 19
(misma actividad y menos de 60 min de distancia, y si varias compiten **gana la
más cercana**), después las movidas del criterio 23 con los bloques que queden
libres—, así que una sesión lejana **ya no le roba el bloque** a la que cayó en
su hora: con «Pasear» a las 19:00 y paseos a las 7:30 y a las 19:05, el bloque se
lee **«✓ calcado»**, el de la mañana va **fuera del plan** y el presupuesto
cerrado dice **seguido 25 min** en vez de `seguido 0`. Dos tests nuevos con el
nombre que pidió el revisor, y un test viejo **cambió de expectativa porque
describía el defecto** (queda dicho en la sección 3). De paso, **dos hallazgos
triviales cerrados**: `isFollowUpsError` se quita —no lo usaba nadie, y el
criterio 58 lo sostiene `failed`— y el aviso de «tu plantilla está vacía» deja de
desaparecer cuando un hueco se parte. Los otros siete hallazgos **siguen donde
estaban**. Línea base: typecheck limpio, lint **14/0**, `pnpm test` **2 fallos de
1056** (los de `SearchSelect`; `src/features/vida` **636/636**), build **945,56
kB** con `app-icons` y `IconPicker` intactos. `graphify update .`: 3171 nodos,
3595 aristas. Sigue pendiente del usuario el recorrido real y el **criterio 62
dentro de la app**: `/app/*` está detrás del login.

**FEAT-004, tajada 2 — revisión: `returned`** (2026-09-20). Lo construido está
bien hecho y la línea base no empeora —la corrí entera yo: typecheck exit 0,
lint **14/0**, `pnpm test` **2 fallos de 1054** (los dos de `SearchSelect`, un
archivo rojo de 96), `pnpm build` exit 0 con chunk inicial **945,13 kB** y
`app-icons` 620,20 / `IconPicker` 4,64 **idénticos**—, y **no encontré ninguna
regresión**: `VidaAgendaBlock`, `VidaDayBudget` y `useVidaDayData` solo los monta
`VidaHoyPage`, las props nuevas son opcionales, los huecos se parten sin pisar la
sesión y las fichas de FEAT-003 se recalculan **sobre el trozo**, así que ya no
ofrecen colocar en un rato ocupado. Los **dos hallazgos de la tajada 1 quedan
cerrados**: el error de la consulta de sesión abierta se ve con «Reintentar», y
con dos bloques de la misma actividad **solo uno** se pone en marcha. **Se
devuelve por una sola cosa:** `matchSessionsToBlocks` empareja por cercanía **sin
aplicar `VIDA_MOVED_THRESHOLD_MINUTES`**, que es la condición literal del
criterio 19, y una sesión lejana le **roba el bloque** a la que cayó en su hora.
Reproducido con arnés propio (borrado): un bloque «Pasear» 19:00, una sesión a
las 7:30 y otra a las 19:05 → el bloque se lee «→ hecho a las 7:30», la de las
**19:05 sale «fuera del plan»** y el día cerrado dice `seguido 0` · `fuera del
plan 58m` · `sin dato 932m`. No es «la pareja cambiada» que el analista aceptó:
es un día seguido leído como no seguido (criterios 19, 20 y 22). El arreglo son
dos pases —primero los que casan dentro del umbral, después los movidos— y un
test con nombre: **un bloque, dos sesiones, la lejana primero**. **La tercera
forma del presupuesto se acepta y queda anotada**: con solo dos, un día pasado
sin registro estrenaría «sin dato 16h 30», el tramo inventado que el criterio 29
prohíbe; medido, con el día en marcha `planned` y `running` dan los mismos
segmentos. Ocho hallazgos más, ninguno devuelve: una sesión **fuera del horario
del día** no entra en la barra (borde del criterio 26), un bloque movido y en
marcha a la vez se pinta dos veces, `isFollowUpsError` no lo usa nadie, el movido
no lleva barrita, «▶ Empezar» se sigue apagando por actividad, el aviso de
plantilla vacía puede perderse al partirse su hueco, y «Cambiar hora o duración»
valida solo contra el plan. **Sin revisar por el revisor:** los 375 px y el tema
oscuro (criterio 62) —medidos por el constructor en un arnés, nunca dentro de
`/app/vida/hoy`, que está detrás del login— y cualquier llamada real al API. El
detalle, en la sección 4 del dossier.

**FEAT-004, tajada 2 `in-review`** (2026-09-20, **sin commitear**; la
construcción está en la sección 3 del dossier): **lo real se pinta encima de lo
planeado.** Cada bloque se queda en su hora y cuenta lo suyo —«✓ calcado»,
«empezó +N», «+N min», «−N min», las horas reales y la barrita **plan frente a
real**—, lo que no es de ningún bloque aparece **punteado en su hora** como
«fuera del plan», y el **movido** deja sombra («→ hecho a las 20:40») con lo real
donde ocurrió («100 min tarde»), contado **una sola vez**. El presupuesto tiene
**dos formas** que no se mezclan: *hecho · en marcha · planeado · libre* con el
día en marcha y *seguido · de más · fuera del plan · sin dato* al cerrarse, con
una línea que explica el cambio y **sumando el 100 %** —los tramos salen de
partir el día por bordes y clasificar cada trocito una vez, no de sumar
duraciones—. El cruce (D1) es puro y está en `utils/vida-execution.utils.ts`,
con sus dos umbrales con nombre y 37 casos de test, incluido el de **dos bloques
de la misma actividad el mismo día**, que era el hallazgo 2 de la tajada 1. Se
cierra también el hallazgo 1: si no se puede saber qué hay en marcha, **se dice
y se ofrece reintentar**. Línea base: typecheck limpio, lint 14/0, `pnpm test`
2 fallos de 1054 (los de `SearchSelect`), build 945,13 kB (+10,3 kB, **no de
iconos**). Queda para el usuario el recorrido real: todo `/app/*` está detrás
del login.

**FEAT-004, tajada 1 `accepted`** (2026-09-20, revisada; **sin commitear**: la
construcción está en la sección 3 del dossier y la revisión en la 4): **la sesión viva existe.** «▶ Empezar» en un bloque de
hoy abre la sesión, el **cronómetro** cuenta contra el `startTime` del servidor
—así que **recargar no lo reinicia**—, «Terminar» es **un toque** y su toast
ofrece **«añadir una nota»**, y el cierre completo —duración, notas en texto
plano, subtareas— vive en el «···» de la barra y del bloque. La sesión se ve en
**todas** las pantallas de Vida desde `routes/VidaModuleLayout.tsx`, que pasa a
ser el `element` del nodo `path: 'vida'` (**ninguna URL cambia**), y fuera del
módulo no se pinta nada. Empezar con otra en marcha **cierra la anterior y lo
dice en un solo mensaje**, y si ese cierre falla **la nueva no se empieza**. La
que quedó abierta de otro día **se pregunta** en vez de enseñar un cronómetro de
catorce horas, y el «No sé» anota **la duración planeada, o 30 min — nunca hasta
el fin del día**. Los tres toasts heredados quedaron reescritos («En marcha»,
«No la guardamos», «Lo quitamos del registro») y un test nuevo lee el módulo
entero buscando vocabulario de culpa. Línea base sin empeorar: typecheck limpio,
lint **14/0**, `pnpm test` 2 fallos de **1005** (los dos de `SearchSelect`; **+74
tests**), chunk inicial **934,79 kB** (+17,8 kB, **ninguno de iconos**). Lo único
fuera de Vida: `shared/ui/Toast` gana una **acción opcional**. **Falta el
recorrido manual del usuario** (criterio 66, con la API despierta) y, dentro de
él, lo que ningún agente pudo tocar: **las subtareas de sesión contra el API de
verdad** (criterio 10, lo más frágil) y el botón del toast pulsado sobre una
sesión real. Tres desviaciones dichas: un contexto nuevo
(`hooks/useVidaSessionUi.ts`) para que el modal se monte **una vez**, `silent`
también en `useStartActivityFollowUpMutation` —si no, un gesto dejaba dos
avisos—, y `VidaAgendaBlock` envolviendo su fila en 375 px, que **afecta a todos
los bloques**. Un test de FEAT-003 quedó **derogado y acotado**, no borrado: el
que decía «no hay nada de vivir el día».

**La revisión de la tajada 1** (sección 4 del dossier) la **acepta**: midió otra
vez la línea base (`pnpm test` **2 de 1005**, `pnpm lint` **14/0**, `pnpm build`
**934,79 kB** con `app-icons` y `IconPicker` intactos) y **no encontró ninguna
regresión** — el único que renderiza `VidaAgendaBlock` es `VidaHoyPage`, así que
el `flex-wrap` no toca ni la semana ni la plantilla, y medido en un arnés a
**375 px y a 720 px** un bloque sin sesión sigue midiendo **una sola fila**. Deja
**siete hallazgos** sin tocar código, dos de ellos **para la tajada 2**: si la
consulta de la sesión abierta **falla** no se ve nada (ni barra, ni aviso, y
«Empezar» acaba en un callejón sin salida), y **dos bloques de la misma actividad
el mismo día se pintan los dos «en marcha»** hasta que llegue el cruce de D1.
Siguen pendientes del usuario el **recorrido manual** (criterio 66) y, dentro de
él, las **subtareas de sesión contra el API de verdad** (criterio 10).

**FEAT-004 `planned`** (2026-09-20): **cuatro tajadas, sin recorte de alcance y
con el API intacto**. La referencia es *la misma pantalla que hay que ampliar*
—`src/features/vida/pages/VidaHoyPage.tsx` con `VidaAgendaBlock`,
`vida-agenda.utils.ts` y `useVidaDayData`—, más `VidaPlaceInGapSheet` como molde
de hoja y `useCreateStartingActivities` como molde del «cierra la anterior y
empieza la nueva» de D4. Las dos hipótesis del analista quedan **confirmadas
leyendo el repo hermano** (sesión abierta = `duration_minutes IS NULL`;
`isCompleted` escribe `completed_at` — y **no se escribe**, porque «hecho» se
deriva de la sesión y dos sitios con la misma verdad se contradicen), y sale una
tercera que hacía falta para D4: el API **ya impide** dos sesiones abiertas y
responde 400 **en inglés**, así que cerrar→empezar va en serie y el mensaje se
traduce. Cuatro decisiones de arquitectura: la barra de sesión vive en un
**elemento de ruta del módulo** (`routes/VidaModuleLayout.tsx`) y **no** en
`AppLayout` —que no conoce `/app/vida/semana` ni las archivadas, y el criterio 7
sí—; `buildDayAgenda` **no gana una cuarta variante**, lo ejecutado es un
segundo pase puro en `utils/vida-execution.utils.ts` y el bloque gana una prop
opcional; la sesión abierta se queda en `vidaKeys.followUps.open()` **sin
`refetchInterval`** (solo este cliente la escribe) y lo único que tictaquea a 1 s
es el cronómetro, en el cliente; y D7/D8 van a un **store de zustand con
`persist`** calcado de `habit-identity.store.ts`. Del módulo borrado (`79bece0`)
se rescatan `useElapsedTimer`, los formatos de cronómetro, `localDateTimeToIso`,
`calculateDurationMinutes` y la **forma** de `useRunningSessionFinishActions`;
se tiran los **cinco modales de sesión** (el criterio 38 pide una sola hoja) y
todo `wasteMinutes`/`wastePercentage`. Se resuelve la **hipótesis abierta del
«No sé»**: registra la **duración planeada** de ese bloque y, si no la hay o hay
varios candidatos, **30 min** — nunca «hasta el fin del día», que inventaría
hasta catorce horas que nadie vivió. Dos recortes escritos: el **criterio 1** se
parte (la mitad de «ni registrado» necesita el cruce de D1 y cierra en la tajada
2) y el **16** resuelve el «No sé» con lo mínimo en la 1. **Un aviso para el
usuario:** el marco B del render está a las **21:40** con el día acabando a las
23:00 y pinta ya la leyenda de día terminado, mientras el **criterio 24** dice
que esa forma llega **al cerrarse el día**; manda el criterio, y la diferencia
queda anotada por si al verlo no le cuadra. Lo único fuera de
`src/features/vida/`: `shared/ui/Toast` gana una **acción opcional** (aditiva),
que es lo que sostiene el «añadir una nota» del criterio 5.

FEAT-003 está `planned` con **las ocho decisiones respondidas** (D1…D8 al final
de la sección 1) y **cinco tajadas** que el arquitecto mantiene tal cual: D6
cambió el modelo —la plantilla de Vida pasa a llevar **hora y duración**— y por
eso la tajada 1 es ese prerrequisito más los **ajustes de Vida** (inicio y fin
del día, en `/app/vida/ajustes`), antes de la agenda. La sección 2 deja las
rutas archivo por archivo, qué se rescata de `79bece0` función por función, y
un único recorte anotado: **el criterio 21 se parte** —el texto de «hoy sin
plan» cierra en la tajada 2 y el botón «Armar desde la plantilla» en la 5, que
es donde vive `activityDayPlanSet`—.

**FEAT-003, tajada 1 `accepted`** (sin commitear; la revisión está en la
sección 4 del dossier): la plantilla de Vida ya lleva **hora y duración** —SDL
recopiado y **verificado contra el repo hermano** carácter a carácter, tipos,
`planVidaItemSave`, la hoja con «a qué hora» y las píldoras 15 · 30 · 45 · 1h ·
libre, y la tarjeta leyendo «8:00 · 40 min · L M X J V»— y existe
**`/app/vida/ajustes`** con el inicio y el fin del día, en el popover «Ajustes»
del módulo y en `⌘K`. El riesgo gordo quedó descartado con un arnés de revisión
propio: **editar solo los días de un ítem que ya tenía hora no se la borra**, y
el test de contrato falla de verdad si el SDL pierde los campos. Línea base sin
empeorar: typecheck limpio, lint 14/0, `pnpm test` 2 fallos de **708** (los dos
de `SearchSelect`, preexistentes), chunk inicial **861,01 kB** (+7,8 kB, ninguno
de iconos). **Falta el recorrido manual del usuario** (criterio 58, con el API
desplegada) y, dentro de él, mirar los 375 px y el tema oscuro: esa medida es de
segunda mano. Hallazgo abierto: lo que *pinta* un `input type="time"` lo decide
el idioma del navegador, aunque el **valor** siempre sea `HH:mm` 24 h.

**FEAT-003, tajada 2 `accepted`** (2ª entrega, sin commitear): **`/app/vida/hoy` dejó de
ser un cascarón.** Arriba el presupuesto —fecha y hora, «te quedan Xh YY hasta
las 23:00», la barra del día entero con la marca de «ahora», la leyenda con los
minutos y una línea de guía compuesta con reglas— y debajo la agenda: los
bloques del `activityDayPlan` ordenados por hora y, entre ellos, los huecos con
su tamaño y las fichas de la plantilla que caben. En escritorio, «Tu plantilla
de \<día\>» marcando lo que ya está en el plan. **Todo es lectura**: colocar
una ficha es la tajada 3, y por eso **no se pinta «+ otra cosa»** —igual que no
se pinta «Armar desde la plantilla»—; los dos son botones muertos hasta su
tajada, y queda dicho en la sección 3, no reescrito en el criterio. Línea base
sin empeorar: typecheck limpio, lint 14/0, `pnpm test` 2 fallos de **761** (los
dos de `SearchSelect`; +53 tests nuevos), chunk inicial **877,89 kB** (+16,9 kB,
ninguno de iconos). Dos tests ajenos tocados: `vida.routes.test.tsx` (la
afirmación de F0 «Hoy sigue siendo un cascarón» queda derogada por el criterio
11) y `AppLayout.test.tsx` (montaba `vidaRoutes` de verdad y ahora Hoy necesita
`useAuthBootstrap`: se mockea el guard, sin cambiar ninguna aserción). **Falta
el recorrido manual del usuario** y, sin `15463da` desplegado, todas las fichas
de los huecos se leerán «sin duración»: eso no es un fallo de la tajada.

**Devuelta por el criterio 20**, y solo por él: la marca «Ahora» —y con ella el
salto de apertura— **solo se pinta si queda alguna entrada de la agenda que
empiece después de ahora**. Medido con un arnés de revisión: a las 20:00 de un
día con el último bloque a las 14:00, **cero marcas y cero `scrollIntoView`**;
lo mismo con un solo bloque por la mañana; y en **hoy sin plan** no hay marca a
ninguna hora, que es justo el estado que el criterio 21 obliga a cuidar aquí. El
test que hay usa las 9:24 con tres bloques por delante, el único caso en que la
regla acierta. Se espera que la marca exista siempre que la hora esté entre el
inicio y el fin del día, cayendo **dentro** del tramo que la contiene. Lo demás
de la tajada está bien y bien probado —los criterios 11–19, 21, 22, 48 y 49–57
se cierran con evidencia, y la línea base no empeora (lo corrí entero: 2 fallos
de 761)—; el arreglo es una regla de una línea en `VidaHoyPage.tsx` más sus
tests. Cinco hallazgos anotados y no devueltos, en la sección 4: dos violetas
distintos para «ahora» en tema oscuro, la barra rebasa el 100 % con bloques
solapados, un hueco que ya empezó se ofrece por su tamaño entero, «en 920 min»
y «te quedan 0m» a las 23:30.

**Re-entregada** el mismo día: la marca de «ahora» dejó de decidirse en la
página y la coloca `buildDayAgenda`, que **parte el hueco que contiene al
reloj** y mete una entrada `kind: 'now'` en medio; existe siempre que
`dayStart ≤ ahora ≤ dayEnd` y **no** fuera de esa franja, con test para cada
uno de los tres casos devueltos, para los dos bordes exactos y para fuera del
horario. Leído del DOM en un arnés: **1 marca** a las 20:00, a las 11:30 y en
hoy sin plan (antes 0), y **0** a las 23:30. **Cuatro de los cinco hallazgos,
cerrados de paso**: la barra suma 100,000 % con bloques pisados (antes 106,06 %,
vía `trackMinutes`, que además hace que la guía y la leyenda digan el mismo
número), un hueco empezado ofrece solo lo que le queda y uno ya pasado no ofrece
nada, «en 15 h 20 min» en vez de «en 920 min», y a las 23:30 se lee «planeado 2h
5 de 16h 30» en vez de «te quedan 0m». **El hallazgo 1 (dos violetas en oscuro)
queda sin arreglar a propósito**: unificarlos pide un token nuevo en
`_theme-variables.scss`, que es una decisión de sistema de diseño con su propio
alcance. Línea base: typecheck limpio, lint 14/0, `pnpm test` 2 fallos de **781**
(+20 tests), chunk inicial **878,72 kB** (+0,8 kB). Aviso para quien revise:
`AgendaEntry` tiene ahora **tres** variantes (`block` · `gap` · `now`) y
`AgendaGap` ganó `trackMinutes` e `isPast`.

**Aceptada en la segunda revisión.** Reproduje con arnés propio los tres casos
que había devuelto y salen **1 marca «Ahora» y 1 `scrollIntoView`** en los tres,
más el reloj dentro de un bloque (la marca va justo debajo, el bloque no se
parte) y los dos bordes exactos; a las 23:30, ninguna, que es lo correcto. Con
bloques pisados los anchos suman **100,000 %** y la leyenda, la guía y las
tarjetas ya dicen números coherentes. Línea base corrida entera por mí:
typecheck limpio, lint 14/0, `pnpm test` **2 fallos de 781** y los dos son los
de `SearchSelect` (único archivo rojo de 84). Ni FEAT-002 ni la tajada 1 tienen
una línea de producto tocada, y lo que cambió de forma (`AgendaEntry`,
`trackMinutes`) no sale del módulo. Tres hallazgos nuevos, todos anotados y
ninguno devuelve: con un bloque planeado antes del inicio del día la barra
enseña la marca y la lista no; con bloques solapados la marca puede quedar fuera
de orden de reloj; y el «2h 5» del formateador de la tajada 1. **Sigue faltando
el recorrido manual del usuario** (criterio 58, con el API desplegada) y mirar
los 375 px y el tema oscuro en un navegador de verdad: esa medida es de segunda
mano. Siguiente: la tajada 3, poner algo en un hueco.

**FEAT-003, tajada 3 `accepted`** (sin commitear): **la agenda de Hoy ya
escribe.** Un toque en una ficha de un hueco la coloca al principio de ese hueco
con su duración (`activityDayPlanItemAdd`); una ficha **sin duración** no se
coloca a ciegas, abre la hoja; **«+ otra cosa»** abre «Poner algo a las HH:MM»
con las tres preguntas —qué (la plantilla del día primero, luego un buscador que
encuentra «Bañarme» escribiendo «banar»), cuánto (15 · 30 · 45 · 1h · libre, con
lo que no cabe **apagado**) y cuándo (el principio del hueco, tres horas más y
«otra hora», que no admite una hora de fuera)— y dice **cuánto queda libre
después**; y el «···» de un bloque lo **quita del plan** (con confirmación y
salida «Volver») o le **cambia la hora o la duración** por `ItemEdit`, dentro de
la ventana del bloque más lo libre de cada lado. **D4 la sostiene entera la web**
—`GapWindow` + `validatePlacement`—, porque el API no valida solapes. Si la
mutación falla, la hoja **no se cierra ni pierde lo elegido**, y los cuatro hooks
del plan del día estrenan `onError` con toast: sin eso, colocar desde una ficha
fallaba en silencio. Línea base sin empeorar: typecheck limpio, lint 14/0,
`pnpm test` 2 fallos de **843** (los dos de `SearchSelect`; +62 tests), chunk
inicial **892,42 kB** (+13,7 kB, ninguno de iconos). Un arnés a 375 px encontró y
arregló **scroll horizontal** (491 px) al volver botón la ficha del hueco.
Avisos para quien revise: **`VidaAgendaBlock` ya no es puro** (usa
`useRemoveDayPlanItemMutation` y `useConfirmDialog`: montarlo pide `QueryClient`
y `ConfirmDialogProvider`, y mockear `useActivityDayPlan` obliga a devolver las
cuatro funciones), la ficha del hueco pasó de `<li>` a `<button>`, y
**`pnpm typecheck` dejó pasar un `TS2783` que sí cazó `pnpm build`**. **Falta el
recorrido manual del usuario** (criterio 58, con el API desplegada, que aún no
lleva `15463da`); los pasos están al final de la sección 3.

**Aceptada.** Los ocho criterios de la tajada (23–30) se cumplen y las partes
de 52–57 que le tocan también. Comprobé el encaje con un arnés propio en los
bordes que faltaban —hora = inicio del hueco, hora = fin − duración (cabe
justo), un minuto más (no), 10:29 y 13:00 fuera, hueco empezado desde «ahora»,
duración 0 · negativa · `null`— y **las píldoras que no caben llevan `disabled`
de verdad, no opacidad**: con la hora en 12:50 de un hueco que acaba a las
13:00, `15 30 45 1h` apagadas, «Aquí caben 10 min» y «Poner» sin habilitar. Los
**375 px y el tema oscuro los medí yo** en el navegador con la hoja abierta y un
nombre de 60 caracteres: `scrollWidth` 375 = `clientWidth`, cero elementos
desbordando y «Poner» visible sin scroll dentro de la hoja; en oscuro, 7,88:1 en
los rótulos. Cambiar hora y duración **no es alcance añadido**: lo pide el
criterio 30 y la ventana de edición se deriva de la agenda pintada, así que
validar contra ella **es** validar contra los vecinos (D4). Sin regresiones:
`graphify` y `grep` confirman que `VidaAgendaBlock`/`VidaAgendaGap` solo los
monta `VidaHoyPage`, fuera de `src/features/vida/` no hay un archivo tocado, y
la corrida entera da typecheck limpio, lint 14/0, **2 fallos de 843** (los de
`SearchSelect`) y build **892,42 kB** sin crecer por iconos. Seis hallazgos
anotados y ninguno devuelve, entre ellos: si falla la consulta de actividades el
buscador dice «Nada con ese nombre» en vez de decir que no se pudo cargar, y
`durationPillsForWindow` todavía no la usa ningún componente. Sobre el
`TS2783`: los dos comandos son `tsc -b` sobre las mismas referencias y en mi
corrida los dos salen limpios, así que fue **estado incremental**, no cobertura
distinta — **cerrar una tajada con `pnpm build`, no solo con `pnpm typecheck`**
(va para `ENVIRONMENT.md`, que no toco). **Sigue faltando el recorrido manual
del usuario** (criterio 58, con el API desplegada). Siguiente: la tajada 4,
cualquier día y no solo hoy.

**FEAT-003, tajada 4 `accepted`** (sin commitear): **Hoy ya no es solo hoy.**
Arriba de la agenda hay una **tira de siete días** —dos antes del que se mira—
con su día de la semana, su número, «Hoy» marcado y un **punto rayado** en los
que tienen plan; el día visto viaja en la URL (`/app/vida/hoy?d=YYYY-MM-DD`, sin
duplicar la ruta ni la píldora). Un **día futuro** enseña la misma agenda en
trazo suave y el presupuesto cuenta **planeado frente a libre** («planeado 1h 40
de 16h 30»), sin marca de «ahora», sin «en N min» y sin «te quedan». Un **día
pasado** es **solo lectura**: cero botones en su agenda —ni fichas, ni «+ otra
cosa», ni «···»— y una línea que lo dice sin reproche. En los días que sí se
planean hay dos atajos con `activityDayPlanSet`: **«Copiar del \<día\> pasado»**
(solo en días sin plan, diciendo cuántos bloques trae, apagado con motivo si
aquel día no tuvo) y **«Vaciar y rehacer»** (con confirmación que nombra cuántos
bloques; salida «Volver», nunca «Cancelar»). Los siete puntos usan **la misma
clave** que la agenda (`vidaKeys.dayPlan.byDate`): ni clave ni invalidación
nuevas, y el día abierto es un acierto de caché. Línea base sin empeorar:
typecheck limpio, lint 14/0, `pnpm test` 2 fallos de **885** (los de
`SearchSelect`; +42 tests), chunk inicial **901,19 kB** (+8,8 kB, ninguno de
iconos). **Una desviación del plan, dicha:** la ventana de D5 va del **lunes de
esta semana** al domingo de la siguiente, y no «de hoy en adelante» como escribió
el arquitecto — con `from: hoy` ningún día pasado sería alcanzable y el criterio
38 no tendría cómo cumplirse; planear sigue limitado a hoy y futuros por
`isEditableDate`. Avisos para quien revise: **`VidaHoyPage` ya no monta sin
router** (usa `useSearchParams`) y quien mockee `useActivityDayPlan` tiene que
dar `useSetActivityDayPlanMutation` y responder **por fecha**; el lateral «Tu
plantilla de \<día\>» sigue pintándose en días pasados (inocuo hoy, **no** en la
tajada 5, cuando gane botón); y **«Copiar» con datos no se pudo ver en el arnés**
—leerlo exigía falsear la sesión y eso escribe en el `localStorage` del 5173—:
está cubierto por tests. **Falta el recorrido manual del usuario** (criterio 58,
con el API desplegada, que aún no lleva `15463da`); los siete pasos están al
final de la sección 3, e incluyen el único trozo del criterio 34 que no se probó:
el «atrás» del navegador.

**Revisión de la tajada 4 — `accepted`.** Los criterios 31–38 se cumplen contra
el texto literal del analista, comprobados con un arnés de tests propio (17
casos, borrado) y un arnés de navegador a 375 px en los dos temas (borrado): la
tira con «Hoy» marcado aunque se mire otro día, el punto que sale del **plan** y
no de la plantilla, el día futuro con «planeado X de Y» y sin «ahora», el día
pasado con **cero botones** en su agenda, el `?d=` raro que se recorta al
domingo 27 con su frase, el «atrás»/«adelante» del historial dentro de
`MemoryRouter`, el `mutate` exacto de copiar (sin `id` ni `isCompleted`, con
`orderIndex` renumerado) y el de vaciar (`items: []`). **La desviación de D5 se
acepta**: la ventana desde el lunes de esta semana es lo que el criterio 35 dice
literalmente y es lo único que hace alcanzable el criterio 38; planear sigue
atado a `isEditableDate`, con fecha **local** (probado en los dos lados de la
medianoche). Línea base corrida entera por el revisor: lint **14/0**, test **2
fallos de 885**, build **901,19 kB** con `app-icons` y `IconPicker` clavados.
Sin regresiones: nadie más usa `VidaAgendaBlock`/`VidaAgendaGap`, `vidaPaths.hoy`
**no se duplicó** y las siete consultas de la tira son **7 al abrir y 1 más al
moverse un día** (misma clave, acierto de caché). **Hallazgos abiertos:** si una
de las siete consultas **falla**, el punto afirma «sin plan todavía» sin saberlo;
el punto «cargando» no se distingue del vacío a la vista; copiar no mira si la
actividad está **archivada** (decide el backend, nadie lo decidió aquí); `?d=`
igual a hoy se queda en la URL; y el lateral «Tu plantilla de \<día\>» sigue
en días pasados (**hay que esconderlo en la tajada 5**). Siguiente: la tajada 5,
la semana y armar desde la plantilla.

**FEAT-003, tajada 5 `returned`** (sin commitear, tras la revisión): **planear dejó de hacerse a
mano.** Un día vacío que se puede planear ofrece **«Armar desde la plantilla (N
cosas)»**, que copia la hora y la duración de cada ítem, corre detrás lo que se
pisaría, encadena al final lo que no tiene hora y **lo dice** («1 de 3 no cabían
a su hora y quedaron después» · «1 cosa sin hora, puesta al final — ponles una
hora en tu plantilla», con enlace al catálogo). El lateral de escritorio gana
**«Mañana, \<día\>»** con «Armar mañana desde la plantilla» (o «Ver mañana»), y
existe **`/app/vida/semana`**: una línea por día, «Armar» en los vacíos
editables y «Armar toda la semana desde la plantilla» con confirmación que dice
cuántos días se arman y cuántos no se tocan — una mutación por día, un solo
aviso, y si uno falla se lee «Armamos 1 de 2 días» con el día que falló, nunca
«semana armada». **Los dos avisos de los revisores, atendidos:** el lateral ya
no se pinta en días pasados (criterio 38) y armar **no pone actividades
archivadas** (hubo que pedir `status` en la selección de `vida-items`: ese es el
riesgo número uno de la tajada, porque afecta a las cuatro consultas del módulo,
no solo a armar). Línea base sin empeorar: typecheck limpio, lint **14/0**,
`pnpm test` **2 fallos de 918** (los dos de `SearchSelect`; +33 tests), chunk
inicial **914,52 kB** (+13,3 kB, ninguno de iconos). **Falta el recorrido manual
del usuario** (criterio 58) y **el cronómetro del criterio 47** — armar mañana en
menos de un minuto y la semana en menos de cinco—, los dos con la API
desplegada. Hallazgos anotados y no tocados: «los sábado» (plural de
`VIDA_DAY_LABELS`, heredado), el bloque «Mañana» se pinta también estando ya en
mañana, y el criterio 48 sigue sin «ponerla en el primer hueco donde cabe» desde
la tajada 2.

**FEAT-003, tajada 5 — revisión: `returned`** (2026-09-20). Lo construido
funciona y la línea base no empeora (typecheck limpio vía `pnpm build` exit 0,
lint **14/0**, **2 fallos de 918** —los de `SearchSelect`—, chunk inicial
**914,52 kB** con `app-icons` e `IconPicker` clavados: nada de iconos al
arranque). Devuelta por dos cosas: **(1) el criterio 48 sigue sin «el botón de
ponerla en el primer hueco donde cabe»** en el lateral —lo aplazó la tajada 2, no
lo hizo la 3, lo avisó la 4 y la 5 lo declaró fuera de alcance; como es la última
tajada, aceptarla entregaría la feature con un criterio explícito sin cumplir, y
el toque en la ficha de un hueco (criterio 23) no lo cierra: es otra superficie y
otro comportamiento—; y **(2) la vista de semana ofrece «Armar» sobre un día cuya
consulta de plan **falló**: `useVidaWeekPlans` no expone `isError`, un fallo se
lee como «Sin plan todavía» y armar es `activityDayPlanSet`, que reemplaza el día
entero. Un parpadeo de red puede borrar un plan.** Ocho hallazgos más, ninguno
motivo de devolución: los contadores de «movidos» y «sin hora» se suben antes de
comprobar que el bloque cabe (dos frases que se contradicen),
`usedDefaultDuration` no se pinta en ninguna parte, «(N cosas)» en Hoy no
descarta las archivadas, los días que no dejan ningún bloque no salen en el
resumen del lote, «los sábado», y el bloque «Mañana» que se pinta estando ya en
mañana. **Sigue pendiente del usuario:** el criterio 47 (cronómetro) y el 58 (el
recorrido entero con su cuenta y la API desplegada). El detalle, en la sección 4
del dossier.

**Dependencia externa de FEAT-003:** el API gana `VidaItem.startTime`,
`VidaItem.durationMinutes` y `UserSettings.vidaDayStartTime` /
`vidaDayEndTime`; se construye en `~/Developer/xavi-platform-node` y **no desde
este repo**. Los tests de contrato validan contra el **SDL vendorizado**, no
contra el servidor: mientras Cloud Run no lleve el cambio, `pnpm test` puede
estar verde y una consulta real fallar con «campo desconocido» — no es un fallo
del constructor. El **recorrido real (criterio 58) no se puede hacer hasta que
esté desplegado**.

**FEAT-003, tajada 5 `in-review` (2ª entrega, sin commitear):** los **dos
motivos de la devolución, cerrados**. (1) El lateral «Tu plantilla de \<día\>»
trae ahora, en cada cosa que no está en el plan, **«Ponerla HH:MM»** —el primer
hueco vivo del día donde cabe, con su duración de plantilla o 30 min, colocando
con `activityDayPlanItemAdd`— y, si no cabe en ninguno, el botón queda apagado
diciendo «No queda un rato de 20m en este día»: **el criterio 48 ya está
entero**. (2) `useVidaWeekPlans` expone **`isError` por día**: un día cuya
consulta falla se pinta «No pudimos cargar este día» con «Reintentar», **no
ofrece «Armar» y queda fuera del lote** —un fallo de red ya no puede acabar en
`activityDayPlanSet` borrando un plan—, y el punto de la tira de Hoy tampoco
afirma «sin plan» sin saberlo (cierra de paso el hallazgo 1 de la revisión de la
tajada 4). **Los ocho hallazgos baratos, cerrados**: cada ítem se cuenta una
sola vez (se acabaron «movido» y «se quedó fuera» sobre el mismo), `0` y
negativos cuentan como sin duración, la duración por defecto se **dice** («1
cosa sin duración, puesta a 30 min»), «(N cosas)» ya no cuenta archivadas, los
días del lote que no dejaron nada salen nombrados, fuera el `<p>` vacío, «los
sábados» y el bloque «Mañana» escondido estando ya en mañana. Línea base:
typecheck limpio, lint **14/0**, `pnpm test` **2 fallos de 931** (los dos de
`SearchSelect`; +13 tests), chunk inicial **916,95 kB** (+15,7 kB sobre la línea
base, +2,4 sobre la 1ª entrega; `app-icons` e `IconPicker` idénticos). Medido
esta vez **en el navegador** a 375 px y en oscuro, el lateral y la semana: sin
scroll horizontal. **Sigue faltando** el criterio 47 (cronómetro) y el 58
(recorrido con cuenta), los dos detrás del login.

**FEAT-003 `delivered`** (2026-09-20, **sin commitear**). Segunda revisión de la
tajada 5: **`accepted`**, y con ella las cinco. Comprobé los dos motivos de la
devolución con arnés propio, no de palabra: el botón del lateral ofrece **el
primer hueco vivo** —con el reloj dentro del hueco, parte desde **ahora**
(09:24, no desde las 6:30), y tres «Ponerla» seguidas caen en 09:24, en 10:00 y
a la tercera el botón se apaga porque solo quedan restos—; y un día de la semana
cuya consulta falla **no ofrece «Armar» ni entra en el lote**, así que
`activityDayPlanSet` no lo toca. Los ocho hallazgos baratos, verificados uno a
uno (contadores tras el encaje, `0` y negativos como «sin duración» con su frase
pintada, «los sábados»…). Línea base corrida entera por mí: `pnpm build` exit 0
con chunk inicial **916,95 kB** y `app-icons`/`IconPicker` **idénticos**, lint
**14/0**, `pnpm test` **2 fallos de 931** (los dos de `SearchSelect`).

**Lo que queda para el usuario, y solo él puede cerrarlo:** el **criterio 47**
(cronómetro: mañana armado en menos de un minuto, la semana en menos de cinco) y
el **criterio 58** (el recorrido entero con su cuenta y la API despierta).
Pasos: ponerles hora y duración a tres o cuatro cosas de la plantilla dejando
alguna **sin hora** → fijar el inicio y el fin del día en Ajustes de Vida → en
Hoy, «Armar desde la plantilla (N cosas)» y contrastar el aviso con la agenda →
**tocar «Ponerla» en tres cosas seguidas** del lateral y ver que cada una cae en
el primer rato libre que queda, y que con el día lleno el botón se apaga → «Armar
mañana desde la plantilla» y «Ver mañana» (cronómetro) → «Ver la semana», armar
un día suelto y después «Armar toda la semana» leyendo la confirmación
(cronómetro) → y, si se puede provocar, **un día que no cargue**: tiene que
leerse «No pudimos cargar este día» y no ofrecer «Armar». El detalle y el texto
para el usuario, en la sección 4 del dossier.

FEAT-002 queda con el **criterio 36 pendiente**: el recorrido real con sesión
(primer minuto → catálogo → crear con categoría nueva → plantilla → editar →
archivar → restaurar → cambiar una categoría). No es de ningún agente — está
detrás del login; los pasos están al final del dossier.

FEAT-001 queda con el **criterio 10 pendiente**: el recorrido real con sesión
(cambiar de Hábitos a Vida y volver). No es de ningún agente — está detrás del
login; los pasos están al final del dossier.

**FEAT-004 `specified`** (2026-09-20): F3 del plan de Vida, «Hoy: vivir el día»,
sobre la misma agenda que dejó FEAT-003. **66 criterios y cuatro tajadas**, con
**las diez decisiones respondidas** (D1…D10 al final de la sección 1) y **el API
sin tocar**: 1 empezar/terminar con cronómetro y la sesión visible en todo el
módulo · 2 lo real encima de lo planeado y el presupuesto **en dos formas** (día
en marcha / día terminado) · 3 registrar lo que se sale, en cualquier día de la
tira · 4 «pendiente» y «no hecho», las **tres salidas** de un bloque que no se
hizo, los tramos «sin dato» y la frase de cierre. `architect: yes`. La capa de
follow-ups de F0 **existe y está sin estrenar** (`hooks/useActivityFollowUps.ts`):
sesión abierta = `durationMinutes === null` y «Terminar» es
`activityFollowUpEdit`. **D7 se amplió y reordenó las tajadas**: el usuario pidió
poder decir **qué otra cosa hizo**, así que un bloque no hecho ofrece «Lo hice»,
**«Hice otra cosa»** y **«No se pudo»** — y como «Hice otra cosa» necesita la
hoja de elegir actividad, registrar (3) va **antes** del rescate (4). **Dos
deudas de portabilidad a Flutter, dichas en pantalla**: el «dejarlo así» de un
tramo sin dato (D8) y la razón de un «No se pudo» (D7) se guardan **en el
aparato**, porque el API no tiene dónde. El cruce real↔planeado es **de cliente**
(D1): con dos bloques de la misma actividad el mismo día puede cambiar la pareja,
y está escrito como limitación conocida. Siguiente: el `feature-architect`.
