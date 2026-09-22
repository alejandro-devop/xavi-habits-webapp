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
| FEAT-004 | delivered | 4/4 | features/vida | Hoy — vivir el día: lo real encima de lo planeado, con cronómetro y registro | 2026-09-20 |
| FEAT-005 | delivered | 4/4 | features/vida | La plantilla Vida — tu semana tipo, con hora y duración por ítem | 2026-09-20 |
| FEAT-006 | delivered | 4/4 | features/vida | Revisar el día — plan frente a real, la historia del día y el puente a tu plantilla | 2026-09-20 |
| FEAT-007 | delivered | 4/4 | features/vida | Lo que se repite — adherencia, patrones por actividad y avisos con tus propios datos | 2026-09-22 |

The **Slice** column says which one it's on: `2/4` is "the second of four". A
feature in `building` at `3/4` has two accepted and one in progress.

**FEAT-007 `delivered` 4/4** (2026-09-22, revisor). **Tajada 4 aceptada: la
feature queda entregada y con ella se cierra el módulo Vida (F0–F6).** Los seis
criterios de la tajada (95–100) y los tres transversales (101, 103, 104),
comprobados uno a uno y **con el navegador abierto**: arnés propio con los
componentes y las hojas de estilo reales, servido desde el **5173 del usuario**
(no arranqué nada) y borrado. Medido a 375 px: `scrollWidth === clientWidth ===
375`, **0 nodos desbordados**, ni un «%», el día señalado en **violeta punteado**
con `aria-pressed="true"` intacto, la línea de «Cuánto» **sin caja** y sin un
solo botón; en oscuro el violeta pasa a `#a78bfa` y todo se lee; a 1280 px la
rejilla es **893 + 336** con las tarjetas en **dos columnas de 440,5**. El
criterio 96 está probado como el analista lo pidió —**el cuerpo de la mutación
con patrón y sin patrón es idéntico** (`toEqual`)— y **juzgo correcto** que la
salida afirmativa escriba en el borrador y no en el API: un `vidaItemUpdate`
suelto con la hoja abierta dejaría dos versiones compitiendo. La arista queda
dicha: **aceptar y cerrar sin guardar pierde el cambio**, exactamente igual que
cualquier campo de esa hoja desde FEAT-005 —que **no tiene guarda de cambios sin
guardar**, deuda de aquella—, y se avisa al pulsar («se guarda cuando pulses
Guardar»), no al cerrar. Las dos desviaciones, **bien resueltas**: un
`VidaPatternAdvice` para los dos sitios (el render los dibuja iguales y
`VidaBlockHint` no servía: es un `<li>` con la canaleta de la agenda) y «De
dónde sale todo esto» **también en móvil**, que suscribo. **Los cuatro arreglos
de las tajadas anteriores están hechos**: el violeta desde `--aura-ring-to` —la
premisa falsa que yo di por buena en la tajada 2—, «Contestadas» mirando
`source` antes que `answer`, una sola línea de cierre en la tarjeta desactivada
y el aviso de Hoy fuera del selector que le comía el fondo. Sin regresiones: la
hoja es la pantalla más compartida del módulo y las tres props son opcionales
—solo Plantilla las pasa—, los cuatro archivos de test suman **367 líneas y
borran 1**, que es un `import`. Línea base corrida entera: typecheck limpio,
lint 14/0, **2 fallos de 1570**, build exit 0 con el chunk en **1.092,02 kB**
(+6,85, ninguno de iconos). **La nota de cierre para el usuario, la deuda de
FEAT-007 entera y la lista de lo que solo puede comprobar él —incluido el
cronómetro real contra la API dormida, que es lo único que nadie ha medido en
segundos— están al final de la sección 4 del dossier.**

**FEAT-007 `in-review` 4/4** (2026-09-22, constructor). **Tajada 4 construida y
verificada — la última de la fase F6 y del módulo Vida.** La hoja del ítem de
la plantilla dice lo que dicen tus semanas **debajo del campo del que hablan**
(bajo «A qué hora», con su salida y el día marcado en violeta; bajo «Cuánto»,
una línea que **confirma también cuando va bien**), y en escritorio «Lo que se
repite» se reparte como el marco E: patrones en **rejilla** y un lateral con
«Sin contestar», «Contestadas» y «De dónde sale todo esto» —este último también
en móvil, que es donde se usa—. Criterios 95–100, 101, 103 y 104 cerrados con
evidencia; 105 y 106 son del usuario. **En la hoja la salida afirmativa escribe
en el borrador, no en el API**: es la lectura literal del criterio 96 y evita
que dos escrituras se pisen. Se crean `VidaPatternAdvice/` (la caja violeta que
comparten la hoja y el lateral: el render la dibuja igual en los dos sitios) y
`VidaPatternsAside/`. **Cerrados de lo anterior:** el violeta ahora sale de
`--aura-ring-to` en la tarjeta de patrones (la desviación de la tajada 2 se
apoyaba en una premisa falsa), «Contestadas» mira `source` porque `answer` puede
ser `null`, la tarjeta desactivada ya no imprime dos líneas de cierre, y el
fondo del aviso de Hoy ya no lo pisa `.agenda[data-tone='plan']`. **Queda
escrito, no arreglado:** el silencio de Hoy cuando la ventana falla y el nombre
repetido en el aviso, los dos con su arreglo propuesto. **Coste:** entrar en
Plantilla cuesta **0 consultas nuevas** —la ventana se monta al abrir la
primera hoja— y el lateral de escritorio, 0. **Línea base:** typecheck limpio,
lint 14/0, **2 fallos de 1570** (los mismos de `SearchSelect`, +16 tests),
build exit 0 con chunk **1.092,02 kB** (+6,85). Visto en el navegador a 375 px,
en claro y en oscuro, y a 1280 px, con un arnés temporal servido desde el 5173
del usuario y **borrado**. **Sin commitear.**

**FEAT-007 `building` 3/4** (2026-09-22, revisor). **Tajada 3 aceptada.** Los
ocho criterios (87–94) y los tres transversales (101, 103, 104) comprobados uno
a uno, y **esta vez con el navegador abierto**: monté un arnés propio con los
avisos que genera `pickBlockHints` de verdad, dentro de la lista real de la
agenda, lo serví desde el **5173 del usuario** (no arranqué nada) y lo borré.
Medido ahí a 375 px: `scrollWidth === clientWidth === 375`, ni un nodo
desbordado, el orden es `bloque, aviso, bloque, aviso` —**debajo**, sin tapar ni
desplazar—, trazo **violeta punteado** (`dashed`, `rgb(124,58,237)/0.45`),
cabecera violeta con «1 de 2», la consecuencia **antes** de los botones y ningún
`role="alert"`; en oscuro el violeta pasa a `#a78bfa` y todo se lee. **El coste,
que era la pregunta:** 39 planes + 1 rango + 1 plantilla al abrir Hoy en frío el
peor día, **0 nuevas llegando desde Revisión**, **1 al volver** y **0 en un día
pasado** —verificado corriendo sus tests con espías—. **Me parece defendible**:
el primer pintado no lo paga nadie (criterio 92, probado), acortar la ventana
estaba prohibido con buen argumento, lo que se podía contener se contuvo
(interruptor de cuatro condiciones, plantilla apagada con él, días cerrados que
ya no caducan) y el arreglo de verdad —consulta de rango en el backend, 39 → 1—
queda escrito. **La condición: está medido en consultas, no en segundos**;
cronometrar la primera apertura de Hoy en frío contra Render dormido es del
usuario (criterio 105) y la palanca, si duele, es una línea. La afirmativa manda
**un** `activityDayPlanItemEdit` y **cero** `vidaItemUpdate` (espiadas las
cinco); «Así está bien» no llama a nadie y entra en la regla de las cuatro
semanas. Hoy no se ha roto: **0 líneas borradas** en sus 97 casos. Línea base
corrida entera: typecheck limpio, lint 14/0, **2 fallos de 1554**, build exit 0
con el chunk en **1.085,17 kB** (+4,34, ninguno de iconos). Ocho hallazgos en la
sección 4; los que más pesan: **el fondo violeta del aviso lo pisa la agenda en
modo «plan»** (el trazo y la cabecera sí quedan), **el criterio 18 de FEAT-003
queda derogado en parte** por el 91 —el hueco filtra por la costumbre, no por la
plantilla—, si la ventana falla **en Hoy no se dice nada**, y **el token de
violeta sí existía**: la desviación que la tajada 2 declaró —y que yo di por
buena— se cierra en una línea. Siguiente: el `feature-builder`, tajada 4, la
última.

**FEAT-007 `in-review` 3/4** (2026-09-21, constructor). **Tajada 3 construida y
verificada: el aviso llega al planear.** En Hoy, un bloque del que hay
costumbre trae su aviso **pegado debajo**, en violeta punteado
(`--aura-ring-to`, que sí existe como token), numerado «1 de 2», con las dos
salidas escritas y la consecuencia antes de los botones: **«solo para hoy: tu
plantilla se queda como está»** (D2). Dos como mucho, nunca dos del mismo
bloque, elegidos en `pickBlockHints` —puro y probado—; la salida afirmativa
manda **un** `activityDayPlanItemEdit` y **cero** `vidaItemUpdate`; «Así está
bien» entra en la regla de las cuatro semanas. Y los chips del hueco ofrecen ya
**la duración que sueles tardar** y lo dicen. **El coste, medido y contenido**:
abrir Hoy en frío pasa de ≈11 consultas a ≈52 el peor día (39 planes + rango +
plantilla); llegando desde Revisión, **0 nuevas**; volviendo dentro de la
sesión, **1**; un día pasado, **0**. Dos decisiones para eso: la ventana se
monta **diferida y solo si puede servir**, y los días cerrados dejan de caducar
solos (`invalidateDayPlanQueries` los caduca igual). **Línea base no peor**:
typecheck limpio, lint 14/0, **2 fallos de 1554** (+28 tests), chunk
**1.085,17 kB** (+4,34), `app-icons` sin tocar. **Visto en el navegador** con un
arnés temporal ya borrado, a 375 px y en oscuro, servido por el 5173 del
usuario: no se arrancó ningún servidor. Sin commitear. Criterios 87–94, 101,
103 y 104 cerrados; 105, 106 y el trozo de `/app/*` del 94, del usuario.

**FEAT-007 `building` 2/4** (2026-09-21, revisor). **Tajada 2 aceptada tras la
corrección.** Lo que la devolvía está arreglado de raíz: fuera los `?? 0` de
`isSettled`, «sin dato» deja de ser «sin desfase», las líneas «Sueles empezar» y
«Suele llevarte» se pintan **siempre** (con «—/sin dato» cuando no hay ninguna
sesión) y esa tarjeta cierra con «De estas 5 veces no hay ninguna registrada…»
en vez de con la frase del criterio 77. **Criterios 74 y 77 cumplidos**,
comprobado con probe propio sobre el `utils` y con el test de la página sobre el
DOM. **Ninguna rama termina muda**: `closingLabelFor` es una función total y la
única rama que añade el hook —la sugerencia callada— siempre trae nota, también
cuando el silencio viene del puente; probé ocho combinaciones fuera de la matriz
del constructor y todas cierran. **El puente de FEAT-006 no sufre**: contra
`main` el código nuevo **solo añade condiciones que ocultan**, el `58` se evalúa
**antes** y sin tocar, y `buildTemplateBridge` sigue fuera del diff; el «puede
volver a aparecer» es contra la entrega devuelta, no contra lo entregado, y es
la lectura correcta de D1. Cerrados también los hallazgos de «Contestadas» con
`source: 'pattern' | 'bridge'` (la respuesta del puente ya se ve, con su fecha
de vuelta) y de `useVidaItemsQuery(includeInactive, enabled = true)` —aditivo,
las **seis** llamadas existentes sin tocar y ninguna pasaba segundo argumento—.
Línea base corrida entera por el revisor: typecheck limpio, lint 14/0, **2
fallos de 1526**, build exit 0 con el chunk en **1.080,83 kB** (+1,36,
justificado, ninguno de iconos). **Nadie ha visto esta tarjeta pintada**: ni el
constructor ni el revisor abrieron el navegador en la corrección; la evidencia
es DOM y hoja de estilos. Seis hallazgos abiertos en la sección 4, ninguno
bloqueante; los más vivos: el desfase del puente y el de la sugerencia son
magnitudes distintas comparadas con el margen de diez, «Contestadas» de la
tajada 4 debe mirar `source` porque `answer` puede ser `null`, y
**`ENVIRONMENT.md` va tres tajadas por detrás** (dice 1479 tests y 1.065,85 kB).
Pendiente del usuario: 105, 106 y 375 px/oscuro dentro de `/app/*` —con un paso
nuevo y fácil: **planear algo y no registrarlo**—. Siguiente: el
`feature-builder`, tajada 3.

**FEAT-007 `in-review` 2/4** (2026-09-21, constructor, **corrección**).
**Arreglado lo que devolvía la tajada**: «sin dato» ya no se lee como «sin
desfase». Una actividad planeada varias veces y **nunca registrada** pinta sus
dos líneas con «—/sin dato» —el criterio 74 vuelve a cumplirse en todas las
tarjetas— y termina diciendo que no hay ninguna registrada, **no** la frase del
criterio 77, que queda reservada a un patrón dentro de tolerancia. Campo nuevo
`closingLabel` para que **ninguna rama termine muda** (incluye el hallazgo del
día suelto). De los seis hallazgos van resueltos los cuatro pedidos: `enabled`
honrado en `useVidaItemsQuery` (parámetro aditivo), la dirección puente →
patrón **con test y con la excepción de D1**, «Contestadas» que ya muestra la
respuesta dada en el puente, y el umbral del día suelto escrito como decisión
del constructor con su razón. Línea base: typecheck limpio, lint 14/0, **2
fallos de 1526** (+13 tests), build exit 0 con el chunk en **1.080,83 kB**.
Detalle en la sección 3, bajo «Tajada 2 · corrección tras la devolución».

**FEAT-007 `returned` 2/4** (2026-09-21, revisor). **Tajada 2 devuelta**, por
una sola cosa y concreta: una actividad **planeada cuatro veces o más y nunca
registrada** pinta «Esto pasa como lo planeaste. Aquí no hay nada que proponer.»
justo debajo de «se siguió 0 de 5 veces», y sin las líneas «Sueles empezar» y
«Suele llevarte» que el criterio 74 exige en todas las tarjetas: los `?? 0` de
`isSettled` (`vida-patterns.utils.ts:629`) convierten «sin dato» en «sin
desfase». **Criterios 74 y 77 no cumplidos**; comprobado con un test temporal
sobre el `utils`, borrado después. **Todo lo demás se cumple y lo he verificado
yo**: la salida afirmativa manda **un solo `vidaItemUpdate`** con `{id}` + un
campo y **cero** mutaciones del plan (espías de las cuatro), «Dejarlo» no llama
a nadie y **no estrena clave** —un `deviceNotes` de FEAT-006 sembrado a mano
rehidrata sin perder nada y deja `patternAnswers` en `{}`—, la regla de las
cuatro semanas de D1 está en una función pura con sus tres ramas probadas y la
fecha de vuelta a la vista desde que se contesta, y `buildTemplateBridge` **no
se tocó** (no está en el diff): de los criterios 54-59 de FEAT-006 solo cambia
el contorno del 58, en la dirección de callar, y el test de la página **borra 0
líneas**. Línea base corrida entera por el revisor y no peor: typecheck limpio,
lint 14/0, **2 fallos de 1513** (los de `SearchSelect`), build exit 0 con el
chunk en **1.079,47 kB** (+13,62 kB, justificados: 1.400 líneas propias y
`app-icons` sin tocar). Ocho hallazgos en la sección 4; los que más pesan: la
tarjeta del día suelto **también** se queda sin frase de cierre, la cabecera de
`useVidaPatterns` promete un `enabled` que la consulta de plantilla no respeta
(muerde en las tajadas 3 y 4), la dirección puente → patrón **no tiene test**, y
«Contestadas» (criterio 99) no verá los «Dejarlo» dados en el puente. Pendiente
del usuario, como siempre: 105, 106 y 375 px/oscuro dentro de `/app/*`.
Siguiente: el `feature-builder`, tajada 2.

**FEAT-007 `in-review` 2/4** (2026-09-21, constructor). **Tajada 2 construida
y verificada, sin commitear.** «Lo que se repite» ya trae **una tarjeta por
actividad** con su pregunta de dos salidas —o con la línea que dice que no hay
nada que proponer—, y aquí nace **el modelo de sugerencia con respuesta
guardada** (`utils/vida-patterns.utils.ts` + `hooks/useVidaPatterns.ts`) que
consumirán Hoy y la hoja de la plantilla sin volver a decidir nada. La salida
afirmativa manda **un solo `vidaItemUpdate`** y **cero** mutaciones del plan;
«Dejarlo» se guarda en `xavi.vida.deviceNotes` —**ninguna clave nueva**— con la
regla de las cuatro semanas de D1 y su fecha de vuelta a la vista. Cruzado con
el puente de FEAT-006 en las dos direcciones. Línea base no peor: typecheck
limpio, lint 14/0, **2 fallos de 1513** (+34 tests), build exit 0 con el chunk
en **1.079,47 kB** (+13,6 kB, ninguno de iconos). Criterios 74-86, 101 y 104
cerrados; 105, 106 y el 86 dentro de `/app/*`, del usuario. Detalle en la
sección 3.

**FEAT-007 `building` 1/4** (2026-09-21, revisor). **Tajada 1 aceptada.** Los
catorce criterios (64–73 y 101–104) comprobados uno a uno contra la sección 1,
línea base **corrida entera de nuevo por el revisor** y no peor: typecheck
limpio, lint 14/0, 2 fallos preexistentes de 1479, build exit 0 con el chunk en
1.065,85 kB. Sin regresiones en «Un día», «La semana» ni el puente (el diff del
test de la página borra **3** líneas y ninguna es una afirmación de FEAT-006).
Verificadas las tres desviaciones del constructor: `buildAdherence` **usa**
`buildWeekReview` —criterio 70 cierto por construcción—, el «0 consultas con la
sección cerrada» está sujeto por montaje **y** por espía sobre la API, y el
nombre de 60 caracteres del criterio 72 no aplica porque la tajada no pinta
ningún texto del usuario. Cinco hallazgos anotados en la sección 4, ninguno
bloqueante; los más vivos: **la frase del render que nombra el día que menos se
parece al plan se omitió a propósito** (regla de «ni una palabra de reproche»,
decisión que el usuario puede revertir en una línea) y **`ENVIRONMENT.md` tiene
la línea base vieja** (1439 tests, 1.054,0 kB). Pendiente del usuario: criterios
105 y 106, y 375 px y oscuro dentro de `/app/*`.

**FEAT-007 `in-review`** (2026-09-21, constructor). **Tajada 1 construida y
verificada**, sin commitear: «Lo que se repite» es la tercera sección de
Revisión y cuenta la adherencia de las últimas seis semanas en fracción. Coste
medido (criterio 103): 43 consultas en frío, 22 llegando desde Revisión, 0 al
volver a abrir. Línea base no peor: typecheck limpio, lint 14/0, 2 fallos
preexistentes de 1479, chunk inicial 1.065,81 kB (+11,8 kB).

**FEAT-007 `planned`** (2026-09-21, arquitecto). Plan escrito en la sección 2.
**Referencia: la tajada 4 de FEAT-006 entera** — `vida-week-review.utils.ts` +
`useVidaWeekPlans`/`useVidaWeekFollowUps` + `VidaReviewBridge` +
`VidaReviewBridgeSection` (`VidaRevisionPage.tsx:945`), el sub-componente que
monta sus consultas solo con su sección abierta. **La ventana de 42 días
queda decidida** (criterio 102, que me la delegaba): los planes por
`vidaKeys.dayPlan.byDate` —**42 consultas, no hay consulta de rango en el SDL y
no se crea documento**— y los seguimientos por **`vidaKeys.followUps.range`**,
**una sola**, la clave que el puente de FEAT-006 ya usa para 14 días. Peor caso
en frío **43 consultas**, ≈22 llegando desde Revisión, 0 al reabrir; se contiene
con montaje solo-con-la-sección-abierta, `staleTime` 5 min para el pasado y
`gcTime` 30 min. El derivado va en **dos `utils` puros**
(`vida-adherence.utils.ts`, `vida-patterns.utils.ts`) y **dos hooks**
(`useVidaHistoryWindow.ts`, `useVidaPatterns.ts`); la respuesta a una sugerencia
es un campo más de `vida-device-notes.store.ts` (`patternAnswers`), **sin clave
nueva de `localStorage`**. Dos hallazgos: **`shiftYmd` ya está duplicada**
(`vida-window.utils.ts:39` y `VidaRevisionPage.tsx:87`) y **el puente de
FEAT-006 y las sugerencias de hora de F6 preguntarían lo mismo dos veces** si no
se cruzan las dos respuestas — resuelto en la tajada 2 sin tocar los criterios
54-59. Las **cuatro tajadas se mantienen** tal como las cortó el analista.
Siguiente: el `feature-builder`, tajada 1.

**FEAT-007 `specified`** (2026-09-21, **fase F6 del plan, la última del módulo
Vida**). Dossier escrito: `FEAT-007-vida-sistema-entiende.md`, criterios
**64–106** (siguen la numeración del módulo, que FEAT-006 dejó en el 63) y
**cuatro tajadas**. La sección vive **dentro de Revisión** como tercera sección
(«Un día» · «La semana» · «Lo que se repite»): **ni ruta, ni píldora, ni
backend** — todo se deriva en cliente de `activityDayPlan` y
`activityFollowUpsInDates` de las **últimas 6 semanas** y con
`vidaKeys.followUps.day`, como hizo la tajada 4 de FEAT-006. **Arquitecto: sí**
— la ventana de **42 días** y la «sugerencia con respuesta guardada» que
consumen **tres pantallas** (Revisión, Hoy y la hoja de la plantilla) son
conceptos nuevos que no deben decidirse tres veces. **Dos decisiones
escritas:** **D1**, fijada por el analista y cerrada —una sugerencia contestada
con «Dejarlo» **vuelve a las 4 semanas** si el patrón sigue, y **antes** si el
número se mueve 10 min o más, siempre con la fecha de vuelta a la vista en
«Contestadas»—; y **D2**, con valor por defecto y **no bloqueante** —en Hoy la
salida afirmativa cambia **solo el día**, no la plantilla (criterio 89): si el
usuario prefiere lo contrario, se corrige antes de la tajada 3—. **D3** no es
decisión: los umbrales salen del render (adherencia 2 semanas, tendencia 3, día
de la semana 3, actividad 4 apariciones) y el «3 semanas» del plan es el
titular. Siguiente: **`feature-architect`**.

**FEAT-006 `delivered`** (2026-09-21). Cuarta revisión: **`accepted`**, y con
ella las cuatro tajadas. **El criterio 53 queda a medias y con su nota**: la
segunda mitad se cumple entera —`useVidaWeekFollowUps` usa **`vidaKeys.followUps.day`**,
la **misma** clave del día, así que la semana **reutiliza la caché** de Hoy y de
la revisión, y `query-keys`, `invalidate-vida-queries`, `useVidaWeekPlans`,
`routes/`, `graphql/` y `VidaSemanaPage` están **sin tocar**—, y la primera **no
puede cumplirse a la vez que el criterio 55**, que por definición pide el plan de
los últimos 14 días: con el puente activo la peor lectura en frío llega a **~21
consultas** (7+7 de la semana y hasta 7 de la semana anterior; los otros siete
son la misma clave y salen de caché). Es una **tensión entre dos criterios**, no
un defecto, y está dicha. Lo demás se cumple: **ninguna ruta nueva** (`view` es
estado local y `/app/vida/semana` no se toca), un día cuya consulta falla dice
**«No pudimos cargar este día»** y **nunca «Sin plan»** —cierra el hallazgo que
venía de FEAT-003—, **«—» donde no hay dato**, la hora del puente sale de la
**mediana de lo real** y **si no hay sesiones no hay aviso**, el puente escribe
**literalmente `{ id, startTime }`** y los espías confirman que ni el plan ni las
sesiones se tocan, «Dejarlo como está» guarda con **el lunes en la clave** dentro
del store que ya existía —**ninguna clave nueva de `localStorage`**— y
`VidaDayStrip` **sin `dots` es la de antes**. Línea base corrida entera por el
revisor: typecheck **exit 0**, lint **14/0**, `pnpm test` **2 fallos de 1439**
(los dos de `SearchSelect`; 1 archivo rojo de 106), `pnpm build` **exit 0** con
chunk inicial **1.054,00 kB**, `app-icons` **620,20 kB** e `IconPicker`
**4,64 kB**.

**Lo que queda del usuario, y solo él puede cerrarlo** (con la API despierta;
Render tarda ~1 min): **ver la revisión con datos de verdad** —la historia, la
cifra «6 de 8», los carriles, el reparto por categoría, los tramos sin registrar
y la semana con su puente—, comprobar que **«Lo hice», «Registrar tiempo pasado»
y «¿Qué pasó?» escriben de verdad** contra el servidor, que **«Moverlo a las
HH:MM» cambia la plantilla y ningún día armado**, y que **«Dejarlo así» y
«Dejarlo como está» no vuelven a preguntar** tras recargar. Y lo que **ningún
agente ha podido mirar nunca**: **los 375 px y el contraste en oscuro dentro de
`/app/*`** —la pantalla está detrás del login—, en especial **las salidas nuevas
de la tajada 3**, que nadie ha visto en un navegador.

**La deuda anotada de las cuatro tajadas, en un solo sitio:** **`Button
variant="primary"` mide 2,54:1** y `variant="danger"` es ilegible en oscuro —las
dos son del **sistema de diseño**, vienen de FEAT-003/004 y merecen su propia
tarea— · el **punto «a medias» de la tira** se distingue poco del rayado a 8 px ·
una **categoría sin color** y «Sin categoría» comparten acento, así que solo las
separa el nombre · **abrir la semana con puente cuesta ~21 consultas** en frío ·
el **reparto por categoría no cuadra con el presupuesto** a propósito (minutos de
sesión frente a minutos de reloj), y está dicho en el código · en un **día sin
ningún registro** el «¿Qué pasó?» del marco E abre por la primera hora del día ·
y el **chunk inicial sigue creciendo** (1.054,00 kB, **nada de iconos**): el
troceado del módulo Vida ya venía anotado desde FEAT-005.

**FEAT-006, tajada 4 `in-review`** (2026-09-21, **sin commitear**; la
construcción está en la sección 3 del dossier): **la semana y el puente, y con
ellos el círculo se cierra.** «Ver por semana» es **un estado de la misma
pantalla** —ni ruta nueva, ni píldora, ni un `?d=` movido, y `VidaSemanaPage.tsx`
no aparece en el diff—: **siete filas** con su titular en cuatro formas («3 de
5» · «Hoy · aún abierto» · «Planeado · 2 bloques» · «Sin plan»), la **barrita de
los cuatro tramos con los colores de `VidaDayBudget`**, «**5h 37 de 4h 30**» y
**«—» donde no hay dato, nunca «0»**; cada fila es **un enlace** a la revisión de
ese día, con su leyenda y la **frase de la semana**, que nombra el día que
destaca **solo si destaca** (≥60 % y 15 puntos sobre el segundo) y calla si la
semana está pareja. Un día cuya consulta —de plan **o** de sesiones— falló dice
**«No pudimos cargar este día»** y el test afirma que esa fila **no dice «Sin
plan»**. Con la semana cargada **la tira estrena el punto de tres estados**
(seguido · a medias · solo planeado), y **antes de abrirla sigue siendo el de
Hoy**, también afirmado. **El puente es uno solo, en forma de pregunta**: «Leer
un rato · 21:30 · 3 de las últimas 4 noches no llegó a esa hora · ¿lo movemos a
las **20:30**?», con **la consecuencia escrita antes de tocar nada** («está 5
días (L M X J V): se mueve en todos»); «Moverlo» manda **exactamente**
`{ id, startTime }` a `vidaItemUpdate` con **los cuatro espías del plan en cero**,
y «Dejarlo como está» va al **mismo** store del aparato (`dismissedBridges`,
clave `xavi.vida.deviceNotes`, `localStorage.length` sigue en **1**) con **el
lunes en la clave**, así que la semana siguiente puede volver a preguntar. **La
hora se deriva de lo real** (mediana redondeada a 15 min) y **sin sesiones —o si
la mediana es la hora que ya tiene— no hay aviso**. **Ni un documento GraphQL, ni
una clave de caché, ni una invalidación, ni una ruta, ni una clave nueva de
`localStorage`**, y `useVidaWeekPlans` **sin tocar**. Medido **en el navegador**
con arnés borrado: a 375 px `scrollWidth` **375 = clientWidth**, **cero**
elementos fuera, y contraste compuesto (52 textos) **6,29:1 → 17,69:1 en claro**
y **4,79:1 → 12,3:1 en oscuro**. Línea base: typecheck **exit 0**, lint
**14/0**, `pnpm test` **2 fallos de 1439** (los dos de `SearchSelect`; **+38
tests**; 1 archivo rojo de 106), `pnpm build` **exit 0** con chunk inicial
**1.054,00 kB** (**+13,14**, **ninguno de iconos**: `app-icons` 620,20 e
`IconPicker` 4,64 clavados; CSS 241,31). `graphify update .`: 3601 nodos, 4260
aristas. **Avisos, por orden de riesgo:** **(1)** `VidaDayStrip` **cambió la
lógica del punto** y **esa tira la usa Hoy**: sin la prop `dots` se comporta
igual (con test), pero el `data-state` y el `aria-label` pasan ahora por una rama
más. **(2)** el **caso exacto del render no lo puede producir
`matchSessionsToBlocks`**: su segundo pase **no tiene tope de distancia**, así
que cualquier sesión de esa actividad ese día empareja, y «no se siguió» acaba
significando **«ese día no hubo ninguna sesión de esa actividad»**; la hora
propuesta sale por fuerza de los días en que sí la hubo. **(3)** se construyó la
opción **(a)** del conflicto 53/55 que dejó abierto el arquitecto: el puente
cuesta **8 consultas más** (7 planes, que en su mayoría son caché, + **1** de
rango), **solo con la semana abierta y con plantilla**, y la lectura peor queda
en **≈21**, no en 14 — **el criterio 53 no lo reescribo**. **(4)**
`Button variant="primary"` mide **2,54:1** (blanco sobre el degradado mint de
`shared/ui/Button`, medido aquí, usado por toda la app): hermano del `danger` de
1,7:1. **(5)** el punto «a medias» **se distingue poco** del rayado a 8 px; lo
que se oye sí es distinto. **Del usuario:** el **recorrido completo de FEAT-006
en trece pasos** al final de la sección 3 —incluidos los criterios 61, 62 y 63— y
con él **todo lo que pasa por el API**: **ningún `vidaItemUpdate` del puente ha
viajado nunca**, y la revisión y la semana **no se han visto a 375 px ni en
oscuro dentro de `/app/*`**, que es la deuda que ya venía de la tajada 3.

**FEAT-006, tajada 3 — revisión: `accepted`** (2026-09-20, revisada ya
**commiteada**, sobre `0f4ffe7..8238d16`), **con una cosa que nadie ha medido y
queda dicha: los 375 px y el tema oscuro con los botones nuevos.** Ningún
criterio de los 35–44 lo exige —el 34 era de la tajada 2—, así que no devuelve,
pero **tampoco lo doy por bueno**: lo que sí comprobé es que la **forma** es la
correcta (`flex-wrap: wrap` + `min-width: 0` y etiquetas `nowrap`, el patrón con
el que pasaron las tajadas anteriores), y **va al recorrido manual como lo
primero que hay que mirar**. Lo demás: **«Lo hice» es la función de Hoy, no una
copia** (las dos páginas importan `plannedSessionMinutes` de
`vida-execution.utils`); **«Dejarlo así» no estrena clave** —el mismo store del
aparato, y la única aparición de `localStorage` en el diff es un comentario—;
las **cuatro afirmaciones derogadas** nombran el criterio que las deroga (36, 37,
38) y **se reemplazan por tests que ejercen** las salidas nuevas; **el plan no se
toca**, con los espías de las cuatro mutaciones de `activityDayPlan` en **cero
llamadas**; y **ningún botón usa `danger`**, sin una palabra de culpa. La
decisión de abrir el «¿Qué pasó?» del marco E por la primera hora del día en un
día sin registros es razonable y **no contradice** el criterio 39, que habla de
peso visual. Línea base corrida entera por el revisor: typecheck **exit 0**, lint
**14/0**, `pnpm test` **2 fallos de 1401** (los dos de `SearchSelect`; 1 archivo
rojo de 104), `pnpm build` **exit 0** con chunk inicial **1.040,86 kB**,
`app-icons` **620,20 kB** e `IconPicker` **4,64 kB**. Siguiente: la tajada 4, la
última.

**FEAT-006, tajada 3 `in-review`** (2026-09-20, **sin commitear**; la
construcción está en la sección 3 del dossier): **la revisión rellena el día.**
Cada bloque **sin sesión** —y cada fila del **plan fantasma** de un día sin
registros— estrena **«Lo hice»**, que es **la función de Hoy** (`clearBlockNote`
+ `logSessionInput` + `plannedSessionMinutes`, no una copia de la aritmética):
registra la hora y la duración **planeadas** y **recorta a «ahora»** (un bloque
de 9:00 a 10:00 marcado a las 9:24 guarda **24 min**). **«Registrar tiempo
pasado» dejó de ser un enlace a Hoy**: abre **la misma `VidaLogSessionSheet` de
FEAT-004 aquí dentro**, con `key` por apertura y las `suggestions` que
`useVidaDayData` **ya pedía** —ni una consulta más, ni una segunda hoja—. Cada
tramo sin registrar trae **«¿Qué pasó?»** —la hoja con **la hora del tramo**, no
con la de «media hora antes»: el test lee la franja del renglón y la compara con
el campo— y **«Dejarlo así»**, que va al **mismo** `dismissedNoData` del store
del aparato: el tramo **sigue ahí**, deja de preguntar, y sigue dejado así tras
desmontar y volver a montar. El **marco E** trae **las tres salidas con la misma
`className`** (comprobado por estructura) y su «Dejarlo así» **cierra el día
entero**. Y **toda cifra de lo que no salió lleva su salida al lado**:
«Sin registrar» con «Registrar tiempo pasado» **dentro de la tarjeta de las
cifras**, cada bloque con su «Lo hice» **en su fila**. **Nada toca el plan**: las
**cuatro** mutaciones de `activityDayPlan` están **espiadas en todo el archivo de
test** y dan **0 llamadas** —también encadenando «Lo hice» + «Dejarlo así» +
abrir la hoja—, y `useActivityDayPlan` **no se importa** en ninguno de los cuatro
archivos tocados. **No se creó ni un archivo**: ni consulta, clave,
invalidación, mutación, ruta, documento GraphQL ni clave de `localStorage`
nuevos —el «dejarlo así» del día entero entra con el id `dia-entero` en la lista
que ya existe—. Línea base: typecheck **exit 0**, lint **14/0**, `pnpm test` **2
fallos de 1401** (los dos de `SearchSelect`; **+13 tests**; `src/features/vida`
**981/981**), `pnpm build` **exit 0** con chunk inicial **1.040,86 kB**
(**+3,11**, **ninguno de iconos**: `app-icons` 620,20 e `IconPicker` 4,64
clavados; CSS 236,09). `graphify update .`: 3538 nodos, 4158 aristas. **Avisos,
por orden de riesgo:** **(1)** **cuatro afirmaciones de las tajadas 1 y 2 quedan
derogadas** —«en toda la pantalla no hay ni un botón», «el marco E sin Lo hice»,
«los tramos sin botones» y la de la línea del aparato—, todas reemplazadas por lo
contrario con su porqué escrito; si algo se lee raro en los tests, es ahí.
**(2)** «Registrar tiempo pasado» **ya no es un `link`**: cualquier test ajeno
que lo busque por rol cambia de resultado. **(3)** en **escritorio** el «Lo
hice» vive en el panel «Lo que no se hizo» y **no** en los carriles —para no
duplicar el control del mismo bloque—, decisión mía y a una línea de cambiarse.
**(4)** el «¿Qué pasó?» del **marco E** abre por **la primera hora del día**,
porque en un día sin registros `buildNoDataSlices` no da ningún tramo (el aviso
que dejó la tajada 2). **Del usuario, y es lo primero que miraría quien revise:**
**los 375 px y el oscuro con los botones nuevos no se han visto renderizados**
—esta tajada fue sin arnés, por cuota; lo nuevo son píldoras de contorno
copiadas de `VidaAgendaNoData`, medidas en FEAT-004, sobre filas con
`flex-wrap`— y **todo lo que pasa por el API**: ningún `activityFollowUpAdd`
desde esta pantalla ha viajado nunca, y el criterio 40 —la cifra subiendo **sin
recargar** tras la invalidación real— solo está probado con las consultas
simuladas. Los cinco pasos del recorrido, al final de la sección 3.

**FEAT-006, tajada 2 — revisión: `accepted`** (2026-09-20, revisada ya
**commiteada**, sobre `31ebd0a..0bea895`). **«Sin registrar» es fila aparte**:
fuera de `rows`, con su frase literal y su tamaño contra el día entero, y en todo
el diff **no aparece «desperdicio»** ni ninguna palabra de culpa; **«Sin
categoría»** tiene su propia fila, la última, y **no se reparte**. La
**divergencia con el presupuesto es deliberada y está probada en las dos
direcciones**: dos sesiones pisadas suman **120 min** de categoría y **60 min**
de reloj, y el test afirma los dos números. La **historia solo nombra categoría
cuando el dato la sostiene** (la nombra con media tarde; no la nombra en el día
del render, sin categorías) y sigue sin culpa. **El día abierto no deja título
huérfano**: la sección de tramos va dentro de `noDataSlices.length > 0`
(criterio 32). Línea base corrida entera por el revisor: typecheck **exit 0**,
lint **14/0**, `pnpm test` **2 fallos de 1388** (los dos de `SearchSelect`; 1
archivo rojo de 104), `pnpm build` **exit 0** con chunk inicial **1.037,75 kB**,
`app-icons` **620,20 kB** e `IconPicker` **4,64 kB**; cero `localStorage` y cero
Font Awesome a pelo. **Hallazgo anotado:** una categoría **sin color** y «Sin
categoría» comparten acento, así que a la vista solo las separa el nombre.
**Sin revisar:** 375 px, oscuro y cualquier llamada real al API. Siguiente: la
tajada 3.

**FEAT-006, tajada 2 `in-review`** (2026-09-20, **sin commitear**; la
construcción está en la sección 3 del dossier): **el día ya dice en qué se
repartió.** Al final de la revisión —después de los carriles y antes de las
salidas, que es el sitio del marco D— van **«Minutos por categoría»** con la
**paleta del catálogo** y **dos barras por fila** (planeado **rayado**,
registrado **sólido**, el rayado hecho con **dos opacidades del mismo color**,
así que en oscuro sube y baja con él), cabecera **«Casa · 45m → 3h 3»**, **«Sin
categoría» con fila propia** —sus minutos **no se reparten** y va siempre al
final—, **«Sin registrar» como fila aparte** tras la línea punteada, con su
tamaño **frente al día entero** y la **frase literal** del criterio 28 palabra
por palabra; y debajo **«Los cuatro tramos más largos sin registrar»** con su
franja y su tamaño, **el mismo umbral de Hoy** (`VIDA_NO_DATA_MIN_MINUTES`, sin
una segunda constante) y **la sección entera desaparece** si no hay ninguno —ni
«no hay tramos», ni tramos menores de relleno—. La **historia** cierra su
criterio 8: puede decir **«la tarde, casi toda en Casa»**, pero **solo si una
categoría se lleva al menos la mitad** de lo registrado en esa mitad del día;
repartida entre varias **no afirma ninguna**, y «Sin categoría» **nunca se
nombra**. **Ni un porcentaje ni la palabra «cumplimiento»** en toda la pantalla
(comprobado sobre `container.textContent`). **Sigue siendo solo lectura**:
`queryByRole('button')` **no encuentra nada** fuera de «Reintentar» —el «¿Qué
pasó?» es de la tajada 3 y no se pinta muerto—, y **ni una consulta, clave,
invalidación, mutación, ruta, documento GraphQL ni `localStorage` nuevos**; las
dos secciones salen del **mismo `execution`** que ya estaba montado y
**`vida-execution.utils.ts` sigue sin tocarse**. Medido **en el navegador** con
arnés borrado: a 375 px `scrollWidth` **375 = clientWidth**, **cero desbordes**
con un nombre de categoría de 60 caracteres y la nota de tres líneas; contraste
compuesto sobre el vidrio (34 textos) **9,05:1 → 18,78:1 en oscuro** y **6,52:1 →
17,19:1 en claro**. Línea base: typecheck **exit 0**, lint **14/0**, `pnpm test`
**2 fallos de 1388** (los dos de `SearchSelect`; **+21 tests**; `src/features/vida`
**968/968**), `pnpm build` **exit 0** con chunk inicial **1.037,75 kB**
(**+6,77**, **ninguno de iconos**: `app-icons` 620,20 e `IconPicker` 4,64
clavados; CSS 233,98). `graphify update .`: 3530 nodos, 4144 aristas. **Avisos,
por orden de riesgo:** **(1)** `describeNuance` —la **primera frase de la
historia, de la tajada 1**— cambió de comportamiento: admite el matiz de
categoría y **se corta a dos matices** (antes los unía todos); si una historia se
lee rara, es ahí. **(2)** `buildCategoryBreakdown` suma **minutos de sesión**, así
que **no cuadra con el presupuesto** —magnitudes distintas, dicho en el código y
fijado con un test de dos sesiones pisadas (120 registrados contra 60 de reloj)—
y alguien lo querrá «arreglar». **(3)** una categoría **sin color** y la fila
**«Sin categoría»** caen en el mismo color de acento, que es el `fallback` que ya
usaba `VidaReviewRow`. **(4)** en un día **con plan y sin un solo registro** el
reparto **sí se pinta** (barras de planeado con registrado a cero), una casilla
que el render no dibuja; y en un **día abierto** los tramos **nunca** salen,
porque `buildNoDataSlices` solo existe con el presupuesto cerrado —conviene
saberlo antes de la tajada 3, donde el «¿Qué pasó?» cuelga de esos tramos—.
**Del usuario:** los cuatro pasos del recorrido al final de la sección 3 y, con
ellos, **todo lo que pasa por el API**: este reparto **nunca se ha visto con
categorías de verdad**, y los 375 px y el oscuro se midieron en un arnés, no
dentro de `/app/*`.

**FEAT-006, tajada 1 — revisión: `accepted`** (2026-09-20). Lo delicado era **no
romper Hoy**, y lo medí con arnés propio (5 casos, borrado): `buildDayStrip` sin
tercer parámetro es **idéntico** al de siempre en cuatro fechas,
`clampToPlanningWindow` recorta **exactamente igual** —el domingo de ayer siendo
lunes **sigue cayendo fuera** al planear— y **la revisión sí lo abre**, que era
el punto del criterio 2. `uncoveredMinutes` descuenta solapes (900 con 60+60
pisadas) y cuadra con la leyenda. La **historia** no pasa de tres frases en seis
variantes, **no reprocha** (barrí once palabras) y **no nombra categorías**. Sin
consulta, clave, invalidación, mutación, documento, tipo, `api/` ni
`localStorage` nuevos; **`vida-execution.utils.ts` sin tocar**; de `routes/` solo
`vida-paths.ts`, que gana `revisionForDate` —una query string, **ninguna ruta
nueva**—. Los dos tests ajenos están **acotados y reforzados**: donde se afirmaba
«no hay nada» ahora se afirma **qué** hay. **Los umbrales de Hoy** (±5 calcado,
>60 movido) frente a los del render son **lo correcto** por los criterios 9 y 13
y por D6 de FEAT-004: queda anotado como decisión del usuario. Línea base corrida
entera por el revisor: typecheck **exit 0**, lint **14/0**, `pnpm test` **2
fallos de 1367** (los dos de `SearchSelect`; 1 archivo rojo de 104), `pnpm build`
**exit 0** con chunk inicial **1.030,98 kB**, `app-icons` **620,20 kB** e
`IconPicker` **4,64 kB**. Hallazgos: el **chunk sigue creciendo** (nada de
iconos; el troceado ya venía anotado de FEAT-005) y la ventana de la revisión
llega hasta el domingo que viene por el criterio 4. **Sin revisar:** 375 px,
oscuro y cualquier llamada real al API. Siguiente: la tajada 2.

**FEAT-006, tajada 1 `in-review`** (2026-09-20, **sin commitear**; la
construcción está en la sección 3 del dossier): **el día se lee.**
`/app/vida/revision` dejó de ser un cascarón y cuenta el día: **la historia en
prosa** (≤3 frases por reglas, abriendo siempre por lo que sí salió), la **cifra
grande «6 / 8 bloques seguidos»** —que es literalmente
`collectDayClosing().followedCount/plannedCount`, **sin una segunda definición de
«seguido»**— con **planeado 4h 30 · registrado 5h 37 · de lo registrado 1h 50
fuera del plan**, **«Sin registrar 10h 53 · de las 16h 30 de tu día · no hay
dato, no se adivina»**, **plan frente a real** bloque a bloque con **las
etiquetas de Hoy y ninguna nueva**, la sección **«Fuera del plan»** con el
**mismo número** que la cifra, y en **escritorio los dos carriles alineados por
hora** —el plan quieto, lo de fuera **sin nada enfrente**, el movido como
**sombra** a su hora y su tarjeta donde ocurrió (**una sola**), y los tramos
**sin registrar ocupando su sitio con su tamaño**—. Los **cuatro días raros**
tienen estado propio y salida a Hoy (futuro sin una sola cifra, hoy «aún
abierto» sin hablar en pasado cerrado, el marco E literal con el plan en trazo
fantasma, y sin plan con o sin sesiones), y los **cuatro estados** van separados:
**el plan caído** y **lo vivido caído** dicen cosas **distintas**, cada uno con
«Reintentar», y **ninguno afirma «no quedó nada apuntado»**. **Solo lectura**:
`queryByRole('button')` **no encuentra nada** fuera de «Reintentar», y las dos
salidas son **enlaces a Hoy**. Y **Hoy enlaza aquí** al cerrarse el día
(«Ver cómo fue el día», con `href` comprobado). **Ni una consulta, clave,
invalidación, ruta, mutación, `localStorage` ni documento GraphQL nuevos**, y
**`vida-execution.utils.ts` sin tocar**: lo nuevo es `utils/vida-review.utils.ts`,
puro, que **consume** aquel (A1). Medido **en el navegador** con arnés borrado: a
375 px `scrollWidth` **375 = clientWidth** y **cero desbordes** con un nombre de
60 caracteres y una razón de tres líneas; contraste compuesto sobre el vidrio
(187 textos) **7,70:1 → 16,74:1 en oscuro** y **6,39:1 → 17,61:1 en claro**.
Línea base: typecheck **exit 0**, lint **14/0**, `pnpm test` **2 fallos de 1367**
(los dos de `SearchSelect`; **+62 tests**), `pnpm build` **exit 0** con chunk
inicial **1.030,98 kB** (**+23,22**, **ninguno de iconos**: `app-icons` 620,20 e
`IconPicker` 4,64 clavados; CSS 230,79). `graphify update .`: 3498 nodos, 4101
aristas. **Avisos, por orden de riesgo:** **(1)** `buildDayStrip` ganó un **tercer
parámetro** y `VidaDayStrip` la prop **`basePath`** —los dos con valor por
defecto, con test de que **sin ellos nada cambia**—, pero **los usa Hoy**;
`clampToPlanningWindow` además se reescribió para delegar en un recorte común.
**(2)** **dos casillas del render no se pueden reproducir** con los umbrales que
ya existen: «empezó +5» cae **dentro** de la tolerancia (5, inclusive) y «movido
· 40 min tarde» no llega al umbral de movido (60), así que la pantalla lee
«✓ calcado» y «empezó +40». **Manda el código de FEAT-004** (criterios 9 y 13) y
queda dicho por si el usuario prefiere mover los umbrales. **(3)** `VidaDayBudget`
pinta un enlace **dentro** de la frase de cierre, y **un test ajeno quedó
derogado y reemplazado por algo más fuerte** (`vida.routes.test.tsx` ya no
afirma «sigue siendo un cascarón», afirma **qué** enseña sin sesión). **(4)** la
única aritmética nueva es `uncoveredMinutes`, que existe **solo** porque el día
abierto no tiene tramo «sin dato» en ninguna forma del presupuesto — y hay test
de que sobre un día cerrado da **exactamente** lo que dice la leyenda. **Del
usuario:** el recorrido entero en **catorce pasos** al final de la sección 3 y,
con él, **todo lo que pasa por el API**: esta pantalla **nunca se ha visto con un
día de verdad**, y los 375 px y el oscuro se midieron en un arnés, no dentro de
`/app/*`.

## Delivered

| ID | Area | Title | Delivered |
|---|---|---|---|
| FEAT-001 | layouts, app/router, features/vida | Cimientos del módulo Vida — la barra cambia de módulo y Vida existe como cascarón | 2026-09-19 |
| FEAT-002 | features/vida | El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días | 2026-09-20 |
| FEAT-003 | features/vida | Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos | 2026-09-20 |
| FEAT-004 | features/vida | Hoy — vivir el día: lo real encima de lo planeado, con cronómetro y registro | 2026-09-20 |
| FEAT-005 | features/vida | La plantilla Vida — tu semana tipo, con hora y duración por ítem | 2026-09-20 |
| FEAT-006 | features/vida | Revisar el día — plan frente a real, la historia del día y el puente a tu plantilla | 2026-09-21 |

**FEAT-005 `delivered`** (2026-09-20, **sin commitear**). Cuarta revisión:
**`accepted`**, y con ella las cuatro tajadas. **Nada de lo que el arquitecto
prohibía**: el diff **no toca** `graphql/`, `api/`, `types/`,
`hooks/useVidaItems.ts` ni `invalidate-vida-queries.ts` — copiar es **un
`vidaItemUpdate` por ítem** con `{ id, days }` y la invalidación de siempre.
**`planCopyDay`, medido con arnés propio** (12 casos, borrado): no copia
desactivados, no añade un día que el ítem ya tiene, **no pisa otro ítem de la
misma actividad a ninguna hora** —lo nombra en vez de copiarlo—, no toca ítems de
otros días, y el `days` que viaja es siempre **la unión**: nunca `[]`, nunca
quita un día, y el origen nunca es destino. **La cuadrícula usa una ventana
común** —con algo a las 05:00 el domingo las siete columnas arrancan ahí, y
comprobé el `topPercent` del lunes contra la fórmula—, **dos que se pisan se ven
los dos** en carriles distintos, y la cabecera cuenta **la unión** (90 min con
60+60 pisados), el mismo número que el resumen del día. Las **tres decisiones
juzgadas y escritas**: los bloques son **botones con `aria-label` completo** en
vez de lienzo con tabla oculta —cumple mejor la intención de la regla de
`ChartPanel`, porque cada dato es un control enfocable—; en escritorio la
cuadrícula **se suma al día** en vez de sustituirlo, que es **lo que dice el
criterio 42** aunque el marco C del render sustituya (manda el criterio, y no se
pierde nada); y el alto mínimo de 30 min de escala sostiene el criterio 47. Las
**tres afirmaciones tocadas están justificadas**: dos acotadas con
`within(agenda)` porque la cuadrícula pinta los mismos textos, y la de «ningún
botón muerto» **se hizo más fuerte** (ahora afirma que los dos atajos están
habilitados y que el diálogo abre). Línea base corrida entera por el revisor:
typecheck **exit 0**, lint **14/0**, `pnpm test` **2 fallos de 1305** (los dos de
`SearchSelect`; 1 archivo rojo de 102), `pnpm build` **exit 0** con chunk inicial
**1.007,76 kB**, `app-icons` **620,20 kB** e `IconPicker` **4,64 kB** (CSS
222,14 kB).

**Lo que queda del usuario, y solo él puede cerrarlo** (con la API despierta;
Render tarda ~1 min): el **criterio 55**, el recorrido entero —moverse por las
pestañas, cambiarle la hora a un ítem y verlo reordenarse, quitarle la hora y
verlo caer al cajón, desactivar y reactivar, **quitar uno de un solo día** y
comprobar que la actividad sigue en el catálogo, añadir desde «Añadir a mi Vida»,
**darle una segunda hora a una que ya estaba**, copiar un día a otros tres, y
volver a **Hoy** a ver que los huecos y «Armar desde la plantilla» lo ven todo y
que **un día ya armado no se movió**—; el **criterio 39** (dejar un día entero
puesto sin salir de la pantalla); el **criterio 27** (que Hoy lo vea sin
recargar); y **todo lo que pasa por el API**: ni un `vidaItemDelete`, ni un
`vidaItemUpdate` de copiar, ni una actividad creada de verdad se han visto nunca
contra el servidor. También quedan sin ojo humano los **375 px** y el **tema
oscuro** dentro de `/app/vida/plantilla`: lo medido son arneses.

**La deuda anotada de las cuatro tajadas, en un solo sitio** (ninguna devolvió,
todas escritas en la sección 4): el **chunk inicial pasó del megabyte**
(1.007,76 kB, **nada de iconos**) y el troceado merece su propia tarea ·
`Button variant="danger"` **no se lee en oscuro** (1,7:1) y ya está en pantalla
en FEAT-003 y FEAT-004: es del sistema de diseño · las **píldoras no elegidas**
quedan en 5,01:1, heredado de FEAT-002 · el **panel de añadir, sin sesión, diría
«todavía no tienes actividades»** · **«Cocinar» pasó a «Cocinar y almorzar»**, así
que quien ya tuviera la vieja recibirá una segunda actividad · la **nota del ítem
depende de que `notes` siga en la selección GraphQL** (si dejara de pedirse,
guardar la borraría en silencio) · el catálogo manda ahora `notes` en el `update`
aunque no cambie · **si solo fallan los ajustes de Vida** la pantalla usa
06:30–23:00 y no dice que no pudo leer los tuyos · el **desactivado cuenta** en la
cuenta de la pestaña · el **acople por atributo con `Tabs`** · en escritorio la
**cuadrícula se suma al día** en vez de sustituirlo · y la misma actividad **se
lee dos veces** en la página (agenda y cuadrícula), que con lector de pantalla es
recorrer lo mismo dos veces.

**FEAT-005, tajada 4 `in-review`** (2026-09-20, **sin commitear**; la
construcción está en la sección 3 del dossier): **la semana entera existe, y
copiar un día es el atajo que sustituye al arrastrar.** Siete columnas con cada
cosa **a su hora y con el alto de su duración**, sobre **una sola ventana para
los siete días** —el aviso que dejó la tajada 1: `buildTemplateDay` estira la
ventana por día y siete escalas no se comparan—, con la cabecera «L · 7 · 3h 45»
y **hoy marcado**, los **sin hora** en píldoras punteadas **debajo de su
columna**, la **leyenda** por categoría más «trazo punteado = desactivada · no
sale en Hoy», el total **«8 cosas puestas · 2h 15 a la semana de 115h 30 · tu día
va de 6:30 a 23:00»** y **dos que se pisan vistos los dos**, en carriles
(medido: uno en `width: calc(50% - 0.3rem)`, el otro en `left: calc(50% +
0.15rem)`, los dos con alto). En escritorio la cuadrícula está **siempre arriba**
y el día sigue debajo; en móvil se abre con **«Ver la semana entera»**, que es
**un estado más de la misma página** —la URL no se mueve y `vida-paths.ts` está
sin tocar— con **«Volver al día»**. Y **«Copiar este día a otros»**: se parte del
día que se ve, se marcan destinos, «Copiar a 2 días», salida **«Volver»**, y lo
que viaja es **un `vidaItemUpdate` por ítem** con `{ id, days }` y nada más —**ni
un create ni un delete en ninguna ruta**—: copiar **añade días al ítem que ya
existe** (A7), **no pisa** lo que ya hay a cualquier hora, **no copia los
desactivados** y **no borra nunca nada**; con un fallo a mitad dice «Copiamos 1
cosa a 1 día; Leer se quedó sin copiar» y **nunca** escribe «copiado» de lo que
no lo está. **Ni un documento GraphQL, ni un tipo, ni un `api/`, ni una clave de
caché, ni invalidación nueva** (una sola `invalidateQueries` con `['vida',
'items']`, y solo si algo cambió), nada en `localStorage`, ninguna ruta, ningún
Font Awesome a pelo. Medido **en el navegador** con arnés borrado: a 375 px
`scrollWidth` **375 = clientWidth** y **cero elementos fuera** —el que se
desplaza es **el contenedor de la cuadrícula** (555 px dentro de 343), nunca el
cuerpo—, los bloques de 15 min miden **18 px**, la misma escala del render; en
**oscuro** lo nuevo va de **5,03:1** a **12,3:1** y en claro de **5,42:1** a
**7,15:1**. Línea base sin empeorar: typecheck **exit 0**, lint **14/0**, `pnpm
test` **2 fallos de 1305** (los dos de `SearchSelect`; **+46 tests**;
`src/features/vida` **885/885**), `pnpm build` **exit 0** con chunk inicial
**1.007,76 kB** (+13,43 kB, **ninguno de iconos**: `app-icons` 620,20 e
`IconPicker` 4,64 clavados; CSS 222,14 kB). `graphify update .`: 3428 nodos,
3987 aristas. **Avisos para quien revise, por orden de riesgo:** **(1)** la
cuadrícula **pinta los mismos nombres que la agenda del día**, así que en jsdom
hay dos elementos con el mismo texto y **tres afirmaciones del test de la
pantalla quedaron acotadas o derogadas** —dos se miran ahora dentro de la agenda
y la de «la tajada 4 no se pinta» **queda derogada por los criterios 48 y 49** y
afirma lo contrario—. **(2)** en **escritorio** la pantalla es más larga: la
cuadrícula se **suma** encima del día en vez de sustituirlo como el marco C,
porque quitar el día se llevaría por delante editar desde la tarjeta (tajadas 2
y 3). **(3)** los bloques son **botones que abren la hoja del ítem** —la otra
mitad de la regla de accesibilidad, en vez de una tabla de 43 líneas— y por eso
`VidaTemplateDaySummary` gana una prop **aditiva** (`actions`). **Del usuario, y
es lo único que queda:** el **criterio 55**, el recorrido entero de FEAT-005 en
**doce pasos** al final de la sección 3 —y dentro de él lo que ningún agente ha
visto nunca: **`vidaItemUpdate` copiando un día de verdad**, que **Hoy vea la
plantilla nueva sin recargar** (criterio 53) y que un día **ya armado no se
mueva**—.

**FEAT-005, tajada 3 — revisión: `accepted`** (2026-09-20). El riesgo número uno
era real —`useCreateStartingActivities` lo comparte el catálogo de FEAT-002, ya
entregado— y **lo medí yo** con un arnés propio (9 casos, borrado) montando el
hook con las tres APIs simuladas: **sin `schedule` el catálogo se comporta igual
que antes** (crea la actividad, **no toca la plantilla**, reutiliza la categoría
que ya existía); con una actividad **ya existente** —comparando «bañarme» en
minúsculas— **no se duplica ni se modifica nada** y entra en `reused`; una
**archivada no se reutiliza**; y si el catálogo **no se puede leer**, se crea
igual y no se apunta ningún fallo. Con `schedule`, el punto entra en la plantilla
con sus días, su hora y su duración, y **si el ítem falla el punto cuenta como
fallido** (criterio 38). Los **seis puntos con hora** son exactamente los del
render (7:00 · 7:30 · 8:30 · 9:00 · 13:00 · 21:30) con **tres** marcados, y
`scheduleRecommended` es **aditivo**: la lista sigue con **13 puntos y seis
`recommended`**, la forma que pinta el catálogo. **`buildVidaItemsByActivity` y
`findVidaItemForActivity` están sin tocar** (el diff de `vida-catalog.utils.ts`
es solo la función nueva), que es lo que exige el criterio 35. Los solapes
**avisan y no bloquean**: `describeFitAt` solo escribe una línea y guardar solo
se inhabilita mientras la mutación vuela. Las afirmaciones ajenas que se tocaron
están **derogadas con su porqué y reemplazadas por algo más fuerte** —ahora se
afirma que el enlace al catálogo **ya no está** y que «Añadir a mi Vida» **sí**,
que es el criterio 29 literal—. **Hallazgo con alcance:** «Cocinar» pasó a
**«Cocinar y almorzar»**, que es lo correcto por criterio y por render, pero como
el dedupe compara nombres, **quien ya tuviera «Cocinar» del primer minuto del
catálogo recibiría una segunda actividad** con el nombre nuevo — ni pérdida de
datos ni duplicado exacto, y se arregla archivando una. Otros tres, anotados: una
**consulta más** por guardado (el catálogo fresco que evita duplicar), el panel
que **sin sesión diría «todavía no tienes actividades»**, y las píldoras no
elegidas en **5,01:1** en oscuro (heredado de FEAT-002). Línea base corrida
entera por el revisor: typecheck **exit 0**, lint **14/0**, `pnpm test` **2
fallos de 1259** (los dos de `SearchSelect`; 1 archivo rojo de 101), `pnpm build`
**exit 0** con chunk inicial **994,33 kB**, `app-icons` **620,20 kB** e
`IconPicker` **4,64 kB** (CSS 214,66 kB). **Sin revisar por el revisor:** 375 px
y oscuro (medidos por el constructor), cualquier llamada real al API, y el
**criterio 39** —dejar un día entero puesto sin salir de la pantalla—, que es del
usuario. Siguiente: la tajada 4, la semana entera y copiar un día.

**FEAT-005, tajada 3 `in-review`** (2026-09-20, **sin commitear**; la
construcción está en la sección 3 del dossier): **la plantilla ya se llena desde
la plantilla.** En escritorio, el panel **«Añadir a mi Vida»** al lado; en móvil,
**el mismo panel** dentro de la hoja que abre el **«+» flotante** —una sola
implementación, dos envoltorios, y en escritorio el «+» se apaga para no tener
dos puertas a lo mismo—. Dentro: el catálogo **buscable sin tildes**
(`filterActivitiesBySearch`, sin un quinto normalizador) y **agrupado por
categoría**, sin las archivadas, cada actividad diciendo **en qué estado está**
(«aún no está · **+ Añadir**» o «en tu plantilla · V · 7:30»), y al elegir una,
**días, hora y cuánto en el mismo panel**. Lo gordo: **una actividad que ya está
puede recibir otra hora** —son **dos `VidaItem`**— y la pantalla **lo dice
antes** («*Pasear a las mascotas* ya está a las 7:30 · esto le añade otra
hora»); el test comprueba que sale un **`create`**, que `vidaItemUpdate` **no se
llama** y que el cuerpo **no lleva ninguna clave `id`**: es `targetItem: null`
(A3) haciendo lo que el arquitecto escribió. El panel **dice si cabe y no
bloquea** («Cabe: a las 19:00 no tienes nada» / «…ya tienes *Pasear a las
mascotas*»), y con la plantilla **vacía del todo** llega **el primer minuto**:
los **seis puntos de partida con hora** (7:00 Bañarme 15m · 7:30 Pasear 40m ·
8:30 Desayunar 30m · 9:00 Organizar 45m · 13:00 Cocinar y almorzar 1h · 21:30
Leer 30m), **tres marcados**, los días **de lunes a viernes**, «**Ponerlas en mi
plantilla**» y la línea que quita presión. **Ni un documento GraphQL, ni una
clave, ni una ruta, ni `localStorage`, ni invalidación nueva.** Medido **en el
navegador** con arnés borrado: a 375 px `scrollWidth` **375 = clientWidth** y
**cero desbordes** con la lista y con el mini-formulario abiertos, y en **oscuro**
lo nuevo va de **5,01:1** (las píldoras de día **no elegidas**, `--color-text-muted`
sobre vidrio, el mismo tratamiento que ya traía `VidaStartingPoints` de FEAT-002)
a **18,78:1**. Línea base sin empeorar: typecheck **limpio**, lint **14/0**,
`pnpm test` **2 fallos de 1259** (los dos de `SearchSelect`; **+29 tests**),
`pnpm build` **exit 0** con chunk inicial **994,33 kB** (+11,38 kB, **ninguno de
iconos**: `app-icons` 620,20 e `IconPicker` 4,64 clavados). `graphify update .`:
3380 nodos, 3918 aristas. **Avisos para quien revise, por orden de riesgo:**
**(1)** `useCreateStartingActivities` **cambió de contrato y de
comportamiento** —`mutate({ points, schedule? })` y **reutiliza la actividad que
ya exista por nombre normalizado** (criterio 37; antes creaba a ciegas)— y ese
hook **lo estrena el catálogo de FEAT-002**: si algo se rompe en el primer
minuto del catálogo, es ahí. **(2)** **«Cocinar» pasó a llamarse «Cocinar y
almorzar»** en los datos de los puntos de partida, porque así lo nombran el
criterio 36 y el render; **también cambia lo que ve el catálogo**. **(3)** tres
afirmaciones de tests quedaron **derogadas y acotadas, no borradas** (el «+» ya
existe, el día vacío ya no enlaza al catálogo, y el mock del hook). Y **una
desviación de forma dicha**: el enlace del criterio 35 va **al lado** de la línea
(«Ir a Plantilla»), porque `multipleItemsNote` es un `string`. **Del usuario, y
es lo primero que hay que tocar:** que el servidor acepte **dos `VidaItem` de la
misma actividad** —el riesgo concentrado de la tajada, **nunca probado contra el
servidor vivo**— y con él todo lo que pasa por el API: la deduplicación del
criterio 37, el criterio 39 de punta a punta y que Hoy lo vea sin recargar. Diez
pasos al final de la sección 3.

**FEAT-005, tajada 2 — revisión: `accepted`** (2026-09-20). El riesgo de esta
tajada no era la hoja, era que **`planVidaItemSave` cambió de cuerpo** y esa
función la comparte el catálogo de FEAT-002, ya entregado. **Lo medí yo con un
arnés de tests propio** (8 casos, borrado): crear sin nota manda
`{ activityId, days }` **y nada más**, apagar el interruptor manda
`{ id, isActive: false }` **y nada más**, y editar **sin pintar el campo**
(`notes: undefined`) produce un cuerpo que **no lleva la clave `notes`** —
comprobado sobre las claves, no de vista—. O sea: **el catálogo sin nota se
comporta exactamente igual que antes**. La nota **no se borra sin querer** porque
la hoja la precarga del ítem y `notes` **está en la selección GraphQL**; vaciar
el campo a propósito sí la limpia. Y de las «cuatro expectativas cambiadas» de
FEAT-002: miré **todas las líneas borradas del diff** y lo único que se toca es
el renombrado `item:` → `targetItem:`; **ninguna afirmación de comportamiento se
eliminó ni se debilitó**. Con dos «Pasear», guardar el de las 19:00 escribe
**ese id** y el JSON del plan **no contiene** el de la mañana; `targetItem: null`
sobre una actividad que ya tiene ítem **crea otro**. «Quitar de la plantilla» usa
**`vidaItemDelete`** y **en ninguna ruta se nombra `activityRemove`**; «Quitarlo
solo del \<día\>» **no borra nada** (es un `update` con los días restantes, y
corta en seco si no queda ninguno); las salidas son «Volver», «Quitarlo solo
del…» y «Quitarlo de los N días», **sin «cancelar», «eliminar» ni «borrar»**.
«Activar» manda solo `{ id, isActive: true }`. El test de la tajada 1 quedó
**derogado y acotado, no borrado**. **El criterio 27 —que Hoy lo vea sin
recargar— no lo puede cerrar ningún agente**: queda del usuario. Línea base
corrida entera por el revisor: typecheck **exit 0**, lint **14/0**, `pnpm test`
**2 fallos de 1230** (los dos de `SearchSelect`; 1 archivo rojo de 101),
`pnpm build` **exit 0** con chunk inicial **982,95 kB**, `app-icons` **620,20
kB** e `IconPicker` **4,64 kB** (CSS 208,82 kB). **Hallazgo transversal
anotado:** `Button variant="danger"` **no se lee en tema oscuro** (1,7:1); aquí
se esquivó con `secondary`, pero ya está en pantalla en FEAT-003 («Vaciar y
rehacer») y FEAT-004 («Quitar del registro») — es del sistema de diseño, con su
propio alcance. **Sin revisar por el revisor:** 375 px y oscuro (medidos por el
constructor) y cualquier llamada real al API. Siguiente: la tajada 3, añadir sin
salir de la pantalla.

**FEAT-005, tajada 2 `in-review`** (2026-09-20, **sin commitear**; la
construcción está en la sección 3 del dossier): **la plantilla ya se edita desde
la plantilla.** Tocar una tarjeta abre **la misma hoja del catálogo**
—`VidaActivitySheet` con **props aditivas**, no una segunda hoja— pero **por el
ítem que se tocó, por su id**: con dos «Pasear a las mascotas» (7:30 y 19:00),
abrir el de las 19:00 y guardar escribe **ese** id y el otro no aparece ni en el
plan. Dentro: días, hora, **15 · 30 · 45 · 1h · libre**, **la nota**, el
interruptor **«Activa en mi plantilla»** con su explicación literal y la **vista
previa** —«Así queda en Hoy: lunes, miércoles y viernes **de 9:00 a 9:45**»—,
que **nunca enseña un rango falso**: sin duración dice los 30 min que Hoy le
pondría, sin hora dice que la encadena al final del día. Fuera: **«Ponerle
hora»** en el cajón y **«Activar»** de un toque (`{ id, isActive: true }` y nada
más, **sin abrir la hoja**). Y **«Quitar de la plantilla»**, que es el **primer
uso de `vidaItemDelete` en la vida del proyecto**, con una confirmación de **dos
salidas afirmativas** —«Quitarlo solo del viernes» (le resta el día) y
«Quitarlo de los 3 días» (borra)— más **«Volver»**, que no llama a nadie; con un
solo día, una sola salida. **Ni un documento GraphQL, ni una clave, ni una ruta,
ni `localStorage`, ni invalidación nueva**: las tres mutaciones ya invalidan
`items.all()` por prefijo, que es lo que sostiene el criterio 27. **La duda que
dejó el arquitecto, cerrada leyendo el código:** `useConfirmDialog` **no admite
dos salidas afirmativas** (resuelve `Promise<boolean>` y pinta dos botones), así
que el diálogo es un `Modal` corto, que era la otra mitad de su bifurcación.
Medido **en el navegador** con arnés borrado: a 375 px `scrollWidth` **375 =
clientWidth**, cero desbordes con la hoja y con el diálogo abiertos, **«Guardar»
y «Quitar de la plantilla» visibles sin desplazar la hoja** —y eso **no salía
gratis**: los dos bloques nuevos la dejaban en 820 px contra 746 de alto útil—,
y en **oscuro** lo nuevo va de **7,88:1** a **18,67:1**. Línea base sin
empeorar: typecheck **limpio**, lint **14/0**, `pnpm test` **2 fallos de 1230**
(los dos de `SearchSelect`; **+30 tests**; `src/features/vida` **810/810**),
`pnpm build` **exit 0** con chunk inicial **982,95 kB** (+6,46 kB, **ninguno de
iconos**: `app-icons` 620,20 e `IconPicker` 4,64 clavados). `graphify update .`:
3357 nodos, 3871 aristas. **Avisos para quien revise, por orden de riesgo:**
**(1)** el criterio 18 pide **la nota** y **no existía en la hoja** —la sección 1
la daba por construida y no lo estaba—, así que la añadí y con ella
**`planVidaItemSave` sí cambió de cuerpo**, contra lo que escribió el arquitecto;
el cinturón es que `notes: undefined` significa «no se toca» y entonces **no
viaja en el `update`**, pero **cuatro expectativas de tests de FEAT-002
cambiaron** por esto. **(2)** `Button variant="danger"` es **ilegible en tema
oscuro** (blanco sobre `rgb(255,180,171)`, **1,7:1**, medido): por eso las dos
salidas del diálogo van `secondary`, y queda dicho que **todas las
confirmaciones de Vida** que usan `variant: 'danger'` tienen ese mismo número —no
lo arreglo, vive en `shared/ui/Button` y lo usa hábitos—. **(3)** un test de la
tajada 1 quedó **derogado y acotado**, no borrado: el que afirmaba «cero
botones». **Del usuario:** el recorrido real —once pasos al final de la sección
3— y con él **todo lo que pasa por el API**: ningún agente entra a `/app/*`, así
que **nunca he visto a `vidaItemDelete` responder** ni a Hoy releer la plantilla
sin recargar (criterio 27).

**FEAT-005, tajada 1 — revisión: `accepted`** (2026-09-20). Los quince criterios
se cumplen y **no encontré ninguna regresión**. Lo que medí **yo**, con un arnés
de tests puros (8 casos, borrado): la barra suma **el día entero** y con dos
ítems pisados lo puesto son **90 min, no 120**; el orden es **por hora y, a igual
hora, por nombre**; `0` y las duraciones negativas se leen **«sin duración»** y
no aportan minutos; las cuentas de las pestañas miran los días **del ítem** e
incluyen al desactivado; una actividad **archivada** no se pinta; y la frase de
guía **nombra un hueco de verdad y calla uno de 40 min**, sin una palabra de
culpa en ninguna variante. Lo de pantalla lo verifiqué **leyendo la página** —los
estados van en orden y **el fallo de los ítems corta antes de pintar nada**, con
«Reintentar», así que no puede disfrazarse de plantilla vacía; si lo que falla
son los ajustes, `useVidaDayHours` cae a **06:30/23:00** sin romperse— y con los
tests del constructor, verdes en mi corrida entera. **Los tres puntos de ojo,
resueltos:** el ajuste del relleno de `Tabs` vive **dentro de una clase de
CSS-module** de esta pantalla y `src/shared/ui/Tabs/` está **sin tocar**, así que
hábitos no puede notarlo; los **dos tests ajenos están acotados, no borrados**
(la lista de cascarones conserva `revision`, entra un test nuevo para
`plantilla`, y **la píldora sigue diciendo «Plantilla»**, con `app-nav.config.ts`
intacto: el `⌘K` no se rompe); y las tres reglas de una línea del constructor
—hueco nombrable desde **90 min**, «lleno por la mañana» con **más de la mitad**,
el desactivado que **cuenta**— las contrasté con los criterios y **las tres
valen**, con la tercera señalada como la que el usuario podría querer del revés.
**Aviso escrito para la tajada 4:** `buildTemplateDay` **estira la ventana por
día** (con algo a las 05:00 el resumen pasa de «de 16h 30» a «de 18h»), así que
la cuadrícula necesitará **una ventana común para las siete columnas**. Nada
duplicado, nada en `localStorage`, ningún documento GraphQL, ninguna ruta y ni un
Font Awesome a pelo. Línea base corrida entera por el revisor: typecheck **exit
0**, lint **14/0**, `pnpm test` **2 fallos de 1200** (los dos de `SearchSelect`;
1 archivo rojo de 101), `pnpm build` **exit 0** con chunk inicial **976,49 kB**,
`app-icons` **620,20 kB** e `IconPicker` **4,64 kB** (CSS 207,06 kB). **Sin
revisar por el revisor:** los **375 px** y el **tema oscuro** (medidos por el
constructor en un arnés, no por mí) y cualquier llamada real al API — la pantalla
**nunca se ha visto con datos de verdad**, que es el límite del login. Siguiente:
la tajada 2, la hoja del ítem.

**FEAT-005, tajada 1 `in-review`** (2026-09-20, **sin commitear**; la
construcción está en la sección 3 del dossier): **la plantilla se ve.**
`/app/vida/plantilla` dejó de ser un cascarón y enseña **la semana tipo, un día
a la vez**: siete pestañas con su letra, su cuenta y su punto rayado —envolviendo
`@/shared/ui/Tabs`, así que las flechas del teclado salen gratis—, el resumen
«Viernes · **4h 5 puestas de 16h 30**» con la barra del día entero, la agenda
**ordenada por hora** (icono y color de la categoría **sin consulta extra**,
«45 min · L M X J V», **«sin duración»** cuando no la tiene, el desactivado
**en su hora** con trazo suave y «desactivada · no sale en Hoy») y el cajón
**«Sin hora»** con su explicación literal. **Todo lectura**: en la pantalla no
hay **ni un botón** fuera de las pestañas —«Activar», «Ponerle hora», el «···» y
el «+» son de las tajadas 2 y 3 y no se pintan muertos—. Los estados van
distinguidos como en `VidaSemanaPage`: sin sesión ≠ esqueletos ≠ **«No pudimos
cargar tu plantilla» + Reintentar**, que **nunca afirma que no hay nada**; y la
plantilla vacía del todo trae el texto del marco D con la cuenta real del
catálogo. Lo puro vive en **`utils/vida-template.utils.ts`** (26 casos): los
`segments` suman el día entero **también con dos ítems pisados** (`trackMinutes`,
copiado de la agenda de Hoy), la ventana **se estira** si algo cae fuera del
horario, y la frase de guía sale **palabra por palabra** como el render
(«Seis cosas con hora y una sin ella. Tu viernes está lleno por la mañana y
libre de 14:00 a 19:00») **sin afirmar un hueco que no existe**. Medido **en el
navegador** con arnés borrado: a 375 px `scrollWidth` **375 = clientWidth** y
cero elementos desbordando, un nombre de **60 caracteres** deja la tarjeta en
**una fila** sin tapar la hora, y en **oscuro** lo peor de lo nuevo es **9,5:1**
(8,38:1 en claro). Línea base sin empeorar: typecheck **limpio**, lint **14/0**,
`pnpm test` **2 fallos de 1200** (los dos de `SearchSelect`; **+47 tests**),
`pnpm build` **exit 0** con chunk inicial **976,49 kB** (+11,8 kB, **ninguno de
iconos**: `app-icons` 620,20 e `IconPicker` 4,64 clavados). `graphify update .`:
3319 nodos, 3821 aristas. **Avisos para quien revise:** el título pasó de
«Plantilla» a **«Tu plantilla»** y con eso **derogué tres afirmaciones ajenas**
—dos de `vida.routes.test.tsx` (la de «sigue siendo un cascarón» deja dentro a
`revision`, y hay un test nuevo de «sin sesión enseña la vía para entrar») y una
de `AppLayout.test.tsx`—; **ajusté el relleno de las pestañas compartidas por
selector de atributo desde mi módulo** (con el relleno de `Tabs` el domingo se
salía de la vista, y el domingo puede ser el día que se abre al entrar), sin
tocar `src/shared/ui/Tabs/`; y `VidaPlantillaPage` **ya no monta sin
proveedores**. **Siete decisiones mías van dichas** en la sección 3, y las que
más se pueden querer al revés: el hueco se nombra **desde 90 min**, «lleno por la
mañana» pide **más de la mitad** del tiempo puesto (un empate no dice nada), y un
ítem **desactivado cuenta** en la pestaña y en la frase. **Del usuario:** el
recorrido real —diez pasos al final de la sección 3— y con él **todo lo que pasa
por el API**: ningún agente entra a `/app/*`, así que esta pantalla nunca se ha
visto con datos de verdad.

**FEAT-004 `delivered`** (2026-09-20, **sin commitear**). Cuarta revisión:
**`accepted`**, y con ella **las cuatro tajadas**. Los tres obligatorios los
comprobé con arnés propio (7 casos, borrado): **(1)** el «···» de la sesión
**emparejada con su bloque** ya existe —«Corregir» y «Quitar del registro», con
«¿Quitar «Bañarme» del registro?» y salida **«Volver»** que no llama a la
mutación, **también en un día pasado** y ahí **sin un solo control de plan**—, y
con eso el criterio 35 queda entero; **(2)** «Lo hice» **recorta a ahora**
(14:00–15:00 marcado a las 14:50 → **50 min**), nunca da 0 ni negativo (mínimo
**1**), no recorta en un día pasado y **no puede empezar en el futuro** porque
`describeMissingBlock` da `upcoming` a las 14:59 y `pending` en el minuto exacto
del fin, y el bloque **no pinta las tres salidas con `upcoming`**; **(3)** la
**sesión fuera del horario del día** sigue sin entrar en la barra y **la acepto
como deuda anotada**: arreglarla es ensanchar la ventana del presupuesto, o sea
tocar el criterio 26 entero, que es de la tajada 2 y está aceptado con sus
medidas. Leí **las cuatro variantes** de la frase de cierre generándolas yo:
ninguna trae una palabra de culpa (barrí nueve) y **todas abren por lo que sí
salió**. Las tres salidas comparten **una sola** `className` (mismo peso visual).
El store es el **único `localStorage`** de la feature, con una clave
(`xavi.vida.deviceNotes`) y `partialize` que guarda solo razones y «dejarlo
así». Las cuatro decisiones fuera del plan quedan escritas y ninguna devuelve;
la más discutible es que **«sin dato» y su «¿qué pasó?» solo aparecen con el
presupuesto en forma cerrada**: eso es lo que garantiza el criterio 29 en el caso
principal, pero deja sin preguntar el día **sin plan y sin nada apuntado** — es
una decisión de producto, está a una línea de cambiarse y **la pongo en manos del
usuario**. Línea base corrida entera por el revisor: typecheck **exit 0**, lint
**14/0**, `pnpm test` **2 fallos de 1153** (los dos de `SearchSelect`; 1 archivo
rojo de 99), `pnpm build` **exit 0** con chunk inicial **964,65 kB**,
`app-icons` **620,20 kB** e `IconPicker` **4,64 kB** (CSS 199,97 kB).

**Lo que queda del usuario, y solo él puede cerrarlo** (con la API despierta;
Render tarda ~1 min): el **criterio 66** —el recorrido entero, once pasos al
final de la sección 3 del dossier— y el **criterio 52**, el de fase: vivir un día
a medias y comprobar que quedó registrado **sin mover ni quitar un solo bloque
del plan**. Dentro de eso, lo que ningún agente pudo tocar nunca: **ninguna
llamada real al API** (las subtareas de sesión del criterio 10, el
`activityFollowUpAdd` de «Lo hice» y el `activityFollowUpRemove` de deshacerlo),
el **tema oscuro y los 375 px dentro de `/app/vida/hoy`** (criterios 60, 61 y 62:
medidos en arneses, nunca en la pantalla real) y el `localStorage` del navegador
de verdad. Y siguen abiertos de antes: **FEAT-001 criterio 10**, **FEAT-002
criterio 36** y **FEAT-003 criterios 47 y 58**, todos recorridos con sesión.

**La deuda anotada de las cuatro tajadas, en un solo sitio** (ninguna devuelve,
todas escritas en la sección 4): una **sesión fuera del horario del día** no
entra en la barra del presupuesto (criterio 26; arreglo: ensanchar la ventana) ·
un bloque **movido que además está en marcha** se pinta dos veces · al **movido**
le falta la barrita plan-frente-a-real · **«▶ Empezar»** se apaga por actividad y
no por bloque · **«Cambiar hora o duración»** valida solo contra el plan, sin
mirar lo registrado · el **buscador de actividades** no distingue «no hay nada»
de «no cargó» (heredado de FEAT-003) · **«Corregir» no puede cambiar el «qué»**
(el API no lo admite) y ninguna pantalla lo explica · **registrar no avisa de
solapes** · en un **día sin plan y sin nada apuntado** no se pregunta «¿qué
pasó?» · la frase de cierre dice **«Otras 1 quedaron explicadas»** con
exactamente tres bloques explicados, y **no nombra el bloque movido** · la línea
de «esta nota se queda en este dispositivo» se enseña **cada vez**, no solo la
primera · y **lo del aparato no viaja**: en otro dispositivo no se ven las
razones y el «¿qué pasó?» vuelve a preguntar (deuda de portabilidad de D7/D8,
dicha en pantalla desde el principio).

**FEAT-004, tajada 4 `in-review`** (2026-09-20, **sin commitear**; la
construcción está en la sección 3 del dossier): **el día ya cuenta lo que
falta.** Un bloque sin sesión se lee **«pendiente»** al pasar su hora de fin y
**«no hecho»** solo cuando el día se cierra (D9, con seis casos puros y los dos
momentos vistos en pantalla), y ofrece **las tres salidas con el mismo peso
visual** —comprobado por estructura: los tres botones comparten `className`—:
**«Lo hice»** (escribe la sesión con la hora y la duración planeadas y **no
toca ninguna de las cuatro mutaciones del plan**), **«Hice otra cosa»** (abre la
hoja de la tajada 3 con **08:00** y la píldora **45** ya puestas; el bloque queda
no hecho **con «en su lugar, X»** y un ancla a la fila de lo que sí pasó) y
**«No se pudo»** (marca al instante, razón opcional que se puede cambiar y
quitar). Los ratos pasados sin plan y sin sesión se llaman **«sin dato»**, con
sus horas y sus minutos, y a partir de **30 min** preguntan **«¿Qué pasó?»** o
**«Dejarlo así»** — y lo dejado así **sigue ahí y no vuelve a preguntar**, ni
tras desmontar y volver a montar. El presupuesto de un día cerrado cierra con
**una frase sin reproche** («Seguiste 1 de 3. En lugar de Cocinar y almorzar
hiciste Llamada con el banco…») que **releva a la guía de FEAT-003** y cuya
cifra de lo que no salió **nunca abre** la línea. **Lo que pedía el revisor de la
tajada 3, hecho:** la **sesión emparejada con su bloque** ya tiene su «···» con
**«Corregir»** y **«Quitar del registro»** (diálogo que la nombra, salida
«Volver» que no llama a la mutación), **también en un día pasado** — con eso el
criterio 35 queda entero y el deshacer del 41 también. **Y la decisión sobre
`validateLogPast`, escrita y con test: «Lo hice» recorta a «ahora»** (un bloque
14:00–15:00 marcado a las 14:50 registra **50 min**), así que no hace falta
exceptuar la validación y nunca nace una sesión que termina en el futuro. Lo del
aparato va en `store/vida-device-notes.store.ts` (`persist`, molde
`habit-identity.store.ts`, probado también con un `localStorage` **que lanza**) y
es **lo único** de la feature en `localStorage`; la pantalla lo dice. Línea base
sin empeorar: typecheck **limpio**, lint **14/0**, `pnpm test` **2 fallos de
1153** (los dos de `SearchSelect`; **+52 tests**, 1 archivo rojo de 99), `pnpm
build` chunk inicial **964,65 kB** (+10,7 kB, **ninguno de iconos**: `app-icons`
620,20 e `IconPicker` 4,64 clavados); `src/features/vida` **733/733**. Medido
**en el navegador** con arnés borrado: 375 px sin scroll horizontal con las tres
salidas, un nombre de 59 caracteres y una razón de tres líneas, y **oscuro
contra fondo negro** entre 9,1:1 y 18,8:1 en todo lo nuevo. **Avisos:** un bloque
de hoy cuya hora ya pasó **cambia de texto** («planeado 45 min · pendiente» donde
antes decía «45 min») y por eso **dos tests anteriores cambiaron de consulta, no
de afirmación**; `VidaAgendaBlock` monta ahora `useDeleteActivityFollowUpMutation`
y su «···» aparece en días pasados. **Queda dicho y no arreglado:** el hallazgo
de la tajada 2 —una sesión **fuera del horario del día** no entra en la barra—
**sigue abierto**, porque cerrarlo es ensanchar la ventana del presupuesto y eso
toca el criterio 26 entero; y **en un día del que no se apuntó nada no se
pregunta «¿qué pasó?»**, por el criterio 29, que es una lectura mía y es de una
línea cambiarla. **Del usuario:** los criterios **52** y **66** — el recorrido
manual entero está al final de la sección 3, en once pasos.

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

**FEAT-005 `specified`** (2026-09-20): F4 del plan de Vida, «La plantilla», sobre
el render aprobado hoy (`docs/vida/assets/06-vida-plantilla.html`, marcos A·B·C·D
y sus notas al pie). **55 criterios y cuatro tajadas**, con **el API intacto**:
1 la plantilla **se ve** —pestañas de día, la agenda del día **ordenada por
hora**, el cajón «Sin hora» con su explicación y el resumen «3h 40 puestas de
16h 30»— · 2 **se edita desde aquí** con **la misma hoja del catálogo**, ahora
por ítem, con «Quitar de la plantilla» (y la salida de quitarlo de un solo día) y
«Activar» de un toque · 3 **«Añadir a mi Vida»** sin salir de la pantalla y el
primer minuto con seis puntos de partida **con hora**, que es lo que cierra el
criterio de la fase · 4 la **semana entera** en siete columnas y **«Copiar este
día a otros»**, que añade lo que falta y no pisa nada. `architect: yes`: la
cuadrícula semanal por horas **no existe en el repo** y hay que generalizar
`VidaActivitySheet` / `planVidaItemSave` de «el ítem de esta actividad» a «**este
ítem**» — código que hoy sostiene el catálogo de FEAT-002. **Las seis preguntas
que el render dejaba abiertas quedan resueltas por el analista con lo que el
render enseña** (pestañas en móvil · el interruptor se queda · dos ítems para dos
horas · copiar un día entra · las notas se quedan · los solapes se ven y no se
bloquean) y **ninguna bloquea**. Dos cosas verificadas en el repo hermano y
escritas para que nadie las vuelva a buscar: **el API no tiene unicidad por
(usuario, actividad)** —`migrations/058_vida_items.sql`; el único índice único es
el de `client_id`—, así que **pasear a las 7:30 y a las 19:00 son dos ítems
legales**, y **`vidaItemDelete` existe sin estrenar**: «Quitar de la plantilla»
es su primer uso y no contradice el «apagar no borra» de FEAT-002, porque son dos
gestos distintos. Limitación dicha y no disimulada: la tarjeta del catálogo sigue
enseñando **un** ítem por actividad, así que su hoja tiene que avisar («tiene 2
horas · se cambian en Plantilla») en vez de enseñar una hora como si fuera la
única.

**FEAT-005 `planned`** (2026-09-20): plan escrito sobre HEAD `5026236`. La
implementación de referencia es **`pages/VidaSemanaPage.tsx`** —la única pantalla
que ya vive de `useVidaItemsQuery` + `useVidaDayHours` para los siete días, con
sus tres estados distinguidos y su lote— y **no `VidaHoyPage`**, que está abierta
por el constructor de FEAT-004. El código nuevo cae en
`pages/VidaPlantillaPage.tsx` (hoy 6 líneas de cascarón), en un util puro nuevo
`utils/vida-template.utils.ts` que crece con cada tajada, y en cinco componentes
nuevos. **Ni un documento GraphQL, ni un tipo, ni una clave de caché, ni una
invalidación**: `invalidateVidaItemQueries` ya cubre lista + sugerencias por
prefijo, y `VIDA_ITEM_DELETE_MUTATION` ya está en `contracts.test.ts`. Cuatro
hallazgos que cambian el plan del analista: **(1)** `planVidaItemSave` **no
necesita lógica nueva**, solo que su parámetro deje de significar «el ítem de
esta actividad» y signifique «el ítem sobre el que se escribe» —con eso, editar
por id y crear una segunda hora salen los dos del cuerpo que ya hay—; **(2)**
`VidaItem.activity` es un `ActivityFollowUpActivityRef` y **no trae
`categoryId`**, que es lo que la hoja lee, así que se abre con `lockActivity` y
la cabecera del render en vez de pedir la actividad entera; **(3) copiar un día
no crea ítems: añade días al ítem que ya existe** (`vidaItemUpdate`), que es lo
único que hace verdad el criterio 51 y lo que convierte el criterio 22 en su
salida; **(4)** `useCreateStartingActivities` **deduplica categorías pero no
actividades**, y el criterio 37 pide lo contrario: es trabajo nuevo de la tajada
3 y de rebote mejora el primer minuto del catálogo. La cuadrícula semanal se
confirma **sin hermana**: se escribe pieza nueva y **no se generaliza
`buildDayAgenda`**, que entra por `ActivityDayPlanItem` con horas obligatorias y
arrastraría a dos archivos que FEAT-004 tiene abiertos. Las cuatro tajadas **se
mantienen como las cortó el analista**. Dos cosas sin averiguar, escritas: si
`useConfirmDialog` admite dos salidas afirmativas (la tajada 2 está planeada como
bifurcación, no como supuesto) y si el servidor vivo acepta de verdad dos ítems
de la misma actividad —**nadie lo ha probado contra la API** y desde aquí no se
puede—. Siguiente: el `feature-builder`, tajada 1.
