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
| FEAT-003 | building | 3/5 | features/vida | Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos | 2026-09-20 |

The **Slice** column says which one it's on: `2/4` is "the second of four". A
feature in `building` at `3/4` has two accepted and one in progress.

## Delivered

| ID | Area | Title | Delivered |
|---|---|---|---|
| FEAT-001 | layouts, app/router, features/vida | Cimientos del módulo Vida — la barra cambia de módulo y Vida existe como cascarón | 2026-09-19 |
| FEAT-002 | features/vida | El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días | 2026-09-20 |

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

**Dependencia externa de FEAT-003:** el API gana `VidaItem.startTime`,
`VidaItem.durationMinutes` y `UserSettings.vidaDayStartTime` /
`vidaDayEndTime`; se construye en `~/Developer/xavi-platform-node` y **no desde
este repo**. Los tests de contrato validan contra el **SDL vendorizado**, no
contra el servidor: mientras Cloud Run no lleve el cambio, `pnpm test` puede
estar verde y una consulta real fallar con «campo desconocido» — no es un fallo
del constructor. El **recorrido real (criterio 58) no se puede hacer hasta que
esté desplegado**.

FEAT-002 queda con el **criterio 36 pendiente**: el recorrido real con sesión
(primer minuto → catálogo → crear con categoría nueva → plantilla → editar →
archivar → restaurar → cambiar una categoría). No es de ningún agente — está
detrás del login; los pasos están al final del dossier.

FEAT-001 queda con el **criterio 10 pendiente**: el recorrido real con sesión
(cambiar de Hábitos a Vida y volver). No es de ningún agente — está detrás del
login; los pasos están al final del dossier.
