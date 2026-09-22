---
id: FEAT-018
title: Qué hice — la nota de la sesión, antes, durante y en la línea del día
status: planned
architect: yes    # un editor de nota reutilizado en tres sitios distintos (fila del día, barra en marcha, antes de empezar) más una decisión sin resolver — de dónde salen las píldoras de "lo de otras veces" sin pagar una consulta nueva en Hoy — cruzan página, componente de sesión y capa de datos; no hay un único "cuelga de X" que lo resuelva todo, así que toca elegir el ancla.
area: features/vida
requested: 2026-09-22
updated: 2026-09-22
---

# FEAT-018 — Qué hice: la nota de la sesión, antes, durante y en la línea del día

## 1. The request — feature-analyst

**Summary for whoever's next:** El campo `notes` de una sesión (`ActivityFollowUp`)
ya existe entero en el API y ya se escribe al terminar y al registrar un hueco
pasado; lo que falta es escribirlo **antes** de empezar, editarlo **durante**
sin parar nada, y sobre todo **pintarlo en la línea del día**, donde hoy es
invisible aunque se haya escrito. La primera tajada es pintar y editar lo que
ya se escribe hoy al terminar: no toca el arranque ni la sesión en marcha, y ya
hace legible la semana.

**What problem it solves:** Tres sesiones de la misma actividad el mismo día
se leen todas igual — «Trabajo, Trabajo, Trabajo» — y no se puede releer qué
pasó en cada una. La nota que ya se escribe al cerrar una sesión se guarda y
desaparece: no hay ningún sitio de la app donde se vuelva a ver.

**Who it's for:** Cualquiera que vive el día en Vida (`/app/vida/hoy`) y
quiere dejar constancia de qué hizo dentro de un bloque, no solo cuánto duró.

**User's words:** «Hay un feat que necesito, y es poder decir en la actividad
que hice... como una descripción, puedo añadirla antes de iniciar la
actividad, puedo editarla durante la ejecución y puedo agregarla al terminar,
también en el timeline podría editarlo, ejemplo, "Trabajo en lululemon -
Revisando MRs"»

**Render mostrado y aprobado:** `docs/vida/assets/19-vida-que-hice.html`
(«Aprobado», 2026-09-22). Es la fuente de la forma y de las palabras; las
decisiones de producto de la sección de abajo vienen de ahí, no las repito.

**Verificado antes de escribir esto** (no se repite la exploración):

- El campo existe entero y viaja: `ActivityFollowUp.notes`,
  `ActivityFollowUpStartInput.notes`, `ActivityFollowUpAddInput.notes` y
  `ActivityFollowUpEditInput.notes` están en el SDL vendorizado
  (`src/features/vida/graphql/schema/activity.schema.graphql`), y `notes`
  está en `FOLLOW_UP_FIELDS` de **los cinco documentos**
  (`src/features/vida/graphql/activity-followups.graphql.ts:1-16`), así que
  cualquier consulta de sesión ya lo trae. **No hace falta migración ni tocar
  el API.**
- `useVidaSessionActions.ts` confirma el reparto exacto que dice el render:
  `start(activityId, startTime)` (línea 119) **no tiene parámetro de nota** —
  antes de empezar no hay dónde ponerla—; `finishNow()` (línea 200) es el
  toque único y tampoco pide nada — **así se queda, no se toca**—; y
  `finishWith({ id, durationMinutes, notes })` (línea 232) es el cierre
  completo que ya usa `VidaFinishSessionModal` y ya guarda la nota. La
  edición posterior (menú «Corregir» de `VidaAgendaSession.tsx` y
  `VidaAgendaBlock.tsx`) abre la misma hoja, y el comentario de
  `VidaAgendaSession.tsx:41-42` ya dice que esa hoja «pinta hora, duración y
  notas» — **el editor con el campo de nota ya existe**, lo que falta es
  ofrecerlo también desde la fila y mostrar lo que guarda.
- **Confirmado leyendo los tres archivos enteros, no por `grep`**:
  `VidaSessionBar.tsx`, `VidaAgendaSession.tsx` y `VidaAgendaBlock.tsx` no
  tienen ni una referencia a `notes` ni a ningún campo parecido. La nota que
  ya se guarda hoy **no se pinta en ningún sitio** — es la mitad del valor de
  la feature, tal como lo dice el render, y lo confirmo yo mismo componente
  por componente.
- **Un hallazgo que contradice al render**: la nota de la sección 1 dice
  «Revisión lo hereda gratis». **No es cierto, verificado.**
  `VidaRevisionPage.tsx` no usa `VidaAgendaBlock` ni `VidaAgendaSession` —
  construye su propia fila con `VidaReviewRow`, `VidaReviewOffPlanRow` y
  `VidaReviewStory` (`src/features/vida/pages/VidaRevisionPage.tsx:1-22`).
  Pintar la nota en Revisión es trabajo aparte, con sus propios componentes,
  y queda fuera de esta feature — lo digo en el resumen para que no se dé por
  hecho.
- **Lo que no resolví y dejo para el arquitecto, con lo que encontré**: de
  dónde salen las píldoras de «lo de otras veces» sin una consulta nueva en
  Hoy. Existe ya una ventana de seis semanas de sesiones
  (`useVidaHistoryWindow`, `src/features/vida/hooks/useVidaHistoryWindow.ts`)
  que **sí se monta en Hoy** a través de `useVidaPatterns`
  (`VidaHoyPage.tsx:316`), pero **condicionada**:
  `enabled: canShowPatterns && (planItems.length > 0 || suggestions.length > 0)`
  — no está garantizada cuando se abre el editor de nota, y lo que devuelve
  `useVidaPatterns` son patrones ya derivados por ítem de plantilla, no
  necesariamente las notas en crudo agrupadas por `activityId`. Puede que
  sirva tal cual, puede que haga falta derivar de sus datos crudos, o puede
  que compense un documento nuevo con `activityId` y un límite — cualquiera
  de las tres cambia el costo de abrir Hoy, así que lo dejo escrito y sin
  decidir.

**Ampliación pedida por el usuario mientras escribía esto (2026-09-22):**
«esto de la descripción de las actividades también debe aplicar para las
plantillas». Lo que decidí en la sección de arriba sigue en pie; esto se
suma.

- **El ítem de plantilla ya tiene el campo, y verifiqué algo más fuerte de lo
  que se me pidió comprobar: ya se escribe, no está muerto.**
  `VidaActivitySheet.tsx:679-693` tiene un `Textarea` («Nota · opcional,
  texto plano», `maxLength={280}`, placeholder «Ej. Empezar por la cocina»)
  que lee y guarda `VidaItem.notes` a través de
  `useSaveVidaItemForActivity.ts:300` (`vidaItemUpdate`/`vidaItemCreate` con
  `notes`). Lo trajo **FEAT-005, criterio 18, delivered** — no hay que
  escribir ni el campo ni el formulario, ya existen los dos. El límite de
  caracteres de la plantilla (280) **no es el mismo** que el de la sesión
  (~140 del render 19): son dos campos con dos preguntas distintas, no hay
  que igualarlos.
- **Lo que sí está muerto es pintarla fuera de esa hoja.** Confirmado
  leyendo el archivo entero: `VidaTemplateItemCard.tsx` (la fila del ítem
  dentro de un día de la plantilla) no tiene ninguna referencia a `notes`.
  Tampoco la pinta `VidaUpNextCard.tsx` («Lo que viene», FEAT-010 tajada 1,
  **ya entregada, no en construcción como escribí más arriba** — corrijo esa
  frase con esto—: su `metaLine` es la hora/duración planeada, no la nota.
- **`VidaUpNextCard` tiene una regla explícita que esta ampliación tiene que
  respetar.** Su comentario (línea 52-54) lo dice con todas las letras: el
  botón «▶ Empezar» manda **`start(activityId)` y nada más** — «ni la
  duración planeada ni la hora de la plantilla viajan a la sesión». Cualquier
  control que proponga la nota del ítem ahí tiene que ser **aditivo y
  opcional**, igual que ya exige el criterio 534 para el botón de arrancar:
  no se puede romper esa garantía para meter la nota.

**Decidido por mí, con argumento, como pide el coordinador — hipótesis
marcadas, corregibles en una línea:**

- **Relación entre las dos notas.** La de la plantilla es **lo que sueles
  hacer** («Revisando MRs y daily»); la de la sesión es **lo de hoy**. Al
  arrancar desde un ítem de plantilla, su nota se **propone** dentro del
  control de «antes de empezar» (tajada 3) — ya escrita, editable, borrable
  — y no se copia en silencio a la sesión si nadie abre ese control. Encaja
  con la decisión ya cerrada (D-4 del render): la sesión nace en blanco y lo
  de otras veces se ofrece como atajo, no como copia automática; la nota de
  plantilla es **la primera píldora**, la única que no depende de que ya
  hayas hecho esa actividad antes.
- **Dónde se ve antes de pulsar.** Sí en `VidaUpNextCard` («Lo que viene») y
  en la fila del ítem dentro del día armado desde la plantilla
  (`VidaTemplateItemCard`): si la plantilla dice qué sueles hacer, leerlo
  antes de tocar el botón vale — y es lo mismo que ya hace la hora o la
  duración planeada en esas dos pantallas, que tampoco esperan a que se
  pulse nada.
- **Dónde se escribe.** Ya existe: la hoja del ítem, `VidaActivitySheet.tsx`.
  No se crea un formulario nuevo ni una hoja nueva.
- **Corte.** Tajada **nueva y última**, la 4, porque depende de que exista
  el control de «antes de empezar» (tajada 3, para tener dónde proponerla) y
  de que la nota de sesión ya se pinte en una fila (tajada 1, para repetir
  el mismo patrón visual en la fila de la plantilla). Las tres primeras
  siguen siendo útiles solas sin esta.

**No hace falta render nuevo para esta ampliación**: lo que añade —una línea
de nota en `VidaTemplateItemCard` y en `VidaUpNextCard`, y que el control ya
diseñado en el punto 4 del render 19 se abra con el texto de la plantilla en
vez de vacío— es el mismo patrón visual que el render ya aprobó para la
sesión, aplicado a dos filas más. Si al construirlo aparece un estado que el
render 19 no contempla (por ejemplo, cómo se ve `VidaUpNextCard` con una nota
de plantilla larga y el «▶ Empezar» al lado), eso sí necesitaría un boceto y
lo digo en el resumen de entrega, no lo decido yo.

**Out of scope:**
- Etiquetas y subtareas — las subtareas ya existen y son otra cosa.
- Buscar por el texto de la nota.
- Párrafos largos: el campo sigue siendo una línea, ~140 caracteres.
- Tocar el esquema GraphQL, el validador del API o correr una migración —
  nada de eso hace falta.
- Pintar la nota en `VidaRevisionPage` — verificado que **no** se hereda
  gratis (ver arriba); es candidata a una tajada o feature aparte, decisión
  de quien priorice, no de este dossier.
- Cualquier analítica o resumen agregado de lo que se escribió en las notas.
- Copiar la nota de una sesión a la siguiente automáticamente — al contrario,
  cada sesión nace en blanco (decisión del usuario, ver abajo).
- Tocar `VidaLogSessionSheet` ni `VidaFinishSessionModal` en lo que ya
  funciona: guardar la nota al terminar y al registrar un hueco pasado no se
  toca, salvo para que usen el mismo componente de edición que las otras
  tajadas si el arquitecto decide que conviene compartirlo.

**Acceptance criteria:**

*Transversales a toda la feature:*
- [ ] 531. La nota es un campo de **la sesión** (`ActivityFollowUp.notes`),
  no de la actividad: dos sesiones de la misma actividad el mismo día pueden
  mostrar notas distintas, y la `description` de la `Activity` no se lee ni
  se escribe desde ningún sitio nuevo de esta feature.
- [ ] 532. En ningún texto visible para el usuario aparece la palabra «nota»
  ni «descripción»: la pregunta es **«¿Qué estás haciendo?»** mientras la
  sesión está en marcha y **«¿Qué hiciste?»** en cualquier otro momento
  (terminada, o añadida después).
- [ ] 533. El campo admite hasta ~140 caracteres (el mismo tope que ya usan
  `VidaFinishSessionModal` y `VidaLogSessionSheet`); en cualquier línea donde
  se pinte recortada, se recorta con puntos suspensivos y no rompe el layout.
- [ ] 534. El botón de empezar una actividad no cambia de tamaño ni de
  comportamiento en ningún estado de esta feature: sigue siendo un solo
  toque y no pide nada.

*Tajada 1 — pintar y editar en la línea del día (lo que ya se escribe hoy):*
- [ ] 535. Una sesión terminada que ya tiene nota —guardada por
  `VidaFinishSessionModal` o por `VidaLogSessionSheet`, hoy o cualquier día
  anterior— muestra esa nota en su propia línea, debajo del nombre de la
  actividad, tanto en `VidaAgendaBlock` (bloques del plan) como en
  `VidaAgendaSession` (lo que pasó fuera del plan).
- [ ] 536. Una sesión terminada **sin** nota ofrece un «＋ añadir qué
  hiciste» en gris, del mismo tamaño que el resto de la fila, **solo en el
  día que se está mirando** (hoy, o el día abierto con `?d=`).
- [ ] 537. Ese «＋ añadir qué hiciste» no aparece en un día distinto al que
  se está mirando ni en una sesión en marcha (esa es la tajada 2).
- [ ] 538. Tocar una nota ya escrita, o el «＋ añadir qué hiciste», abre un
  editor con el texto actual (o vacío) y guardar actualiza **solo** la nota
  de esa sesión: la hora y la duración no se tocan.
- [ ] 539. Cancelar el editor no cambia nada.
- [ ] 540. Guardar el editor con el campo vacío borra la nota (la fila vuelve
  a mostrar «＋ añadir qué hiciste»), sin error.
- [ ] 541. Con una nota de ~420 caracteres (el triple del ejemplo del
  render) forzada por datos, la línea de la fila no desborda ni rompe el
  ancho a 375 px: se recorta con puntos suspensivos.

*Tajada 2 — durante, sin parar nada:*
- [ ] 542. Mientras hay una sesión en marcha, `VidaSessionBar` y el bloque de
  la agenda que la muestra en marcha (`VidaAgendaBlock` con `isRunning`)
  enseñan una línea con la nota si la hay, o **«¿Qué estás haciendo?»** en
  gris si no.
- [ ] 543. Tocar esa línea abre el editor **sin pausar el cronómetro, sin
  terminar la sesión y sin cerrar la barra**.
- [ ] 544. Guardar cambia la nota al instante y se ve en la barra sin
  recargar la página.
- [ ] 545. La nota se puede reescribir las veces que haga falta mientras la
  sesión sigue abierta, sin ningún límite de ediciones.
- [ ] 546. El editor ofrece, si existen, **las últimas notas de otras
  sesiones de esa misma actividad** como píldoras de un toque; tocar una la
  usa como texto de partida (se puede seguir editando antes de guardar).
- [ ] 547. Sin notas previas de esa actividad (actividad estrenada, o
  ninguna sesión suya llevó nota todavía), el editor no enseña la sección de
  píldoras y no lo presenta como un error ni un hueco vacío.

*Tajada 3 — antes de empezar:*
- [ ] 548. Antes de empezar una actividad existe un control **aparte** del
  botón de arrancar donde se puede escribir la nota; el botón grande no
  cambia de tamaño ni de posición cuando ese control está vacío.
- [ ] 549. Escribir la nota antes y pulsar «▶ Empezar» hace que la sesión
  nazca ya con esa nota: **una sola** llamada a `activityFollowUpStart` con
  `notes`, nunca una llamada de arranque más una de edición aparte.
- [ ] 550. Empezar sin tocar el control de nota arranca exactamente igual
  que hoy: un toque, sin nota, sin diálogo de por medio.
- [ ] 551. Con una nota ya escrita antes de empezar, el control dejar de ser
  un lápiz vacío y muestra el texto puesto (igual que el segundo estado del
  punto 4 del render).

*Tajada 4 — la plantilla propone, la sesión decide (ampliación del usuario):*
- [ ] 553. La fila de un ítem dentro de un día de la plantilla
  (`VidaTemplateItemCard`) muestra su nota, si la tiene, en su propia línea
  debajo del nombre — mismo patrón de recorte que el criterio 541 (hasta
  ~140 caracteres visibles ahí, aunque el campo guarde hasta 280).
- [ ] 554. Un ítem de plantilla sin nota no añade nada a su fila: no se
  repite ahí el «＋ añadir qué hiciste» de la sesión — esa nota se escribe
  desde la hoja del ítem, que ya existe desde FEAT-005.
- [ ] 555. `VidaUpNextCard` («Lo que viene») muestra la nota del ítem de
  plantilla del que viene, si la tiene, en una línea aparte de `metaLine`;
  la hora y la duración planeada que ya pinta no se tocan ni se reemplazan.
- [ ] 556. El control de «antes de empezar» (tajada 3), al abrirse sobre una
  sesión que nace de un ítem de plantilla con nota, propone esa nota como
  texto de partida — editable y borrable con el mismo gesto que cualquier
  otra nota.
- [ ] 557. Pulsar «▶ Empezar» sin abrir el control de nota, con un ítem de
  plantilla que sí tiene nota, arranca exactamente igual que hoy: un toque,
  sin abrir nada, y la sesión nace **sin** nota — la propuesta de la
  plantilla solo se ve si se abre el control; nunca se copia en silencio.
- [ ] 558. Cuando la sesión no viene de ningún ítem de plantilla (una
  actividad suelta, «Empezar otra cosa»), el control de «antes de empezar»
  no propone ningún texto: sin plantilla detrás no hay nada que proponer.

*Transversal de construcción:*
- [ ] 552. `typecheck` limpio; lint y tests no peores que la línea base de
  `ENVIRONMENT.md` al cerrar cada tajada, y `pnpm build` limpio.

**Slices:** (vertical, cada una usable por sí sola)
| # | What it does | State |
|---|---|---|
| 1 | La nota que ya se escribe hoy al terminar se ve y se edita en la línea del día | pending |
| 2 | Ver y editar la nota de la sesión en marcha, sin parar nada, con píldoras de lo de otras veces | pending |
| 3 | Escribir la nota antes de empezar, sin tocar el botón de arrancar | pending |
| 4 | La nota del ítem de plantilla se ve en su fila y en «Lo que viene», y se propone (sin imponerse) al empezar desde ahí | pending |

Corte propuesto por mí, no del usuario: empiezo por lo que ya es útil con el
dato que **hoy ya se escribe** (tajada 1 no depende de resolver las píldoras
ni de tocar `start()`), sigo por «durante» —donde el usuario dijo que
probablemente se use más, y que es la única que necesita la decisión de las
píldoras— y dejo «antes de empezar» al final porque es la más delicada: toca
el botón que todo el módulo protege como el gesto más barato que existe.

**Architect? yes** — porque no hay un único sitio del que esto «cuelgue»: la
tajada 1 se apoya en `VidaAgendaBlock`/`VidaAgendaSession` (existentes), la 2
necesita decidir de dónde salen las píldoras sin inflar el costo de abrir Hoy
(la ventana de seis semanas existe pero está condicionada y su forma de datos
no es la que hace falta sin verificarlo), y la 3 toca `useVidaSessionActions`
y el punto de entrada de «▶ Empezar», que hoy vive en `VidaAgendaBlock` **y
también en `VidaUpNextCard`** («Lo que viene»). **Corrijo con lo que verifiqué
después**: `VidaUpNextCard` no es un componente nuevo por construir, es de
FEAT-010 tajada 1, **ya entregada** — existe hoy en el árbol y su botón manda
`start(activityId)` y nada más, por diseño explícito. Eso no baja la falta de
arquitecto: al contrario, confirma que hay **dos botones de empezar en dos
componentes distintos** (`VidaAgendaBlock.onStart` y `VidaUpNextCard.onStart`)
que tienen que ganar el mismo control de nota sin romper la garantía de
ninguno de los dos, y con la tajada 4 se suma un tercer y cuarto sitio
(`VidaTemplateItemCard` y otra vez `VidaUpNextCard`, esta vez para *mostrar*
en vez de *escribir*) más la lógica de «proponer sin imponer» que cruza la
plantilla (`VidaItem.notes`) con la sesión (`ActivityFollowUp.notes`), dos
tipos y dos capas distintas. Ese reparto — qué prop nueva entra en cada
componente, y si el «proponer» vive en el hook de sesión o en la hoja — es
justo el tipo de decisión que el arquitecto tiene que dejar escrita con
rutas, no yo con una hipótesis.

**Decisions that aren't mine:**

- **De quién es la nota — resuelto en el render aprobado.** De la sesión, no
  de la actividad. Dos sesiones de la misma actividad el mismo día pueden
  decir cosas distintas; la `description` de `Activity` es otra cosa y no se
  toca.
- **El botón de empezar — resuelto en el render aprobado.** No cambia y no
  pide nada; la nota es opcional y va en un control aparte al lado.
- **Editar durante — resuelto en el render aprobado.** No para el
  cronómetro, no cierra la sesión, se puede reescribir las veces que haga
  falta.
- **De dónde nace cada nota — resuelto en el render aprobado.** Cada sesión
  nace en blanco, nunca arrastra la de la sesión anterior; en su lugar, las
  últimas notas de esa actividad se ofrecen como píldoras de un toque.
- **Cuánto cabe — resuelto en el render aprobado.** Una línea, ~140
  caracteres, recortada con puntos suspensivos en la línea del día.
- **Cómo se llama — resuelto en el render aprobado.** Es una pregunta
  («¿Qué estás haciendo?» / «¿Qué hiciste?»), nunca «nota» ni «descripción»
  en un sitio visible.
- **Una sesión sin nota no grita — resuelto en el render aprobado.** «＋
  añadir qué hiciste» en gris, solo en el día que se está mirando.

Nada de esto queda abierto para el usuario: son las siete decisiones que ya
contestó al aprobar el render. Lo único sin resolver (de dónde salen las
píldoras, y si esta feature toca o no el componente de FEAT-010) es técnico y
queda para el arquitecto, no para él.

## 2. The plan — feature-architect

**Summary for the builder:** La implementación de referencia es
`src/features/vida/components/VidaFinishSessionModal/VidaFinishSessionModal.tsx`
+ cómo lo monta `src/features/vida/routes/VidaModuleLayout.tsx` (una sola vez,
por contexto): un modal sobre **una** `ActivityFollowUp` que escribe `notes`
con `activityFollowUpEdit`. El código nuevo son **dos componentes** —
`VidaNoteLine` (la línea que se lee) y `VidaNoteSheet` (el editor que se abre
desde los cuatro sitios)— más un hook de escritura, un hook de píldoras y un
util puro; todo lo demás es cablear props aditivas en componentes que ya
existen. **No crees** ni el campo, ni la mutación, ni el formulario de la nota
del ítem de plantilla, ni una segunda ventana de historia: las cuatro cosas ya
están y se dicen abajo con su ruta.

### What already exists

**El dato, entero y verificado otra vez** (no hace falta migración ni tocar el
API — confirmado, no heredado de la sección 1):

- `notes` está en `FOLLOW_UP_FIELDS` (`src/features/vida/graphql/activity-followups.graphql.ts:1-16`),
  así que **toda** consulta de sesión de este módulo ya lo trae: el día
  (`ACTIVITY_DAY_FOLLOW_UPS_QUERY`), el rango de seis semanas
  (`ACTIVITY_FOLLOW_UPS_IN_DATES_QUERY`) y la sesión abierta.
- `ActivityFollowUpEditInput` tiene **todos** los campos opcionales menos `id`
  (`src/features/vida/types/activity-followup.types.ts:73-79`, SDL
  `graphql/schema/activity.schema.graphql:288-294`), y el backend actualiza
  **solo las columnas presentes** (`~/Developer/xavi-platform-node/src/services/activity-follow-up.service.ts:347-389`:
  `if (input.notes !== undefined) updates.push('notes = …')`). Consecuencia que
  sostiene el criterio 543: **`activityFollowUpEdit({ id, notes })` no toca hora
  ni duración y no cierra una sesión abierta.** Y `notes: null` explícito borra;
  omitirlo deja lo que hubiera.
- `ActivityFollowUpStartInput.notes` existe (`activity-followup.types.ts:61-70`)
  pero **nadie lo manda**: `startSessionInput()`
  (`src/features/vida/utils/vida-session.utils.ts:151-163`) devuelve solo
  `activityId`, `date` y `startTime`.

**Dónde se escribe hoy la nota (y no hay que volver a escribirlo):**

- Al terminar: `VidaFinishSessionModal.tsx:162-177` (textarea, `rows={3}`).
- Al registrar un hueco pasado: `VidaLogSessionSheet.tsx:483-495`.
- La del ítem de plantilla: `VidaActivitySheet.tsx:679-693` →
  `useSaveVidaItemForActivity.ts:300`. `notes` viaja en `VIDA_ITEM_FIELDS`
  (`src/features/vida/graphql/vida-items.graphql.ts:1-12`) y por tanto también
  dentro de `vidaSuggestionsForDate` (mismo archivo, `:46-56`).

**Dónde NO se pinta (el hueco de esta feature), comprobado archivo a archivo:**
`VidaAgendaBlock.tsx`, `VidaAgendaSession.tsx`, `VidaSessionBar.tsx`,
`VidaUpNextCard.tsx` y `VidaTemplateItemCard.tsx` no tienen ni una referencia a
`notes`.

**Existe dos veces, y es un hallazgo, no una queja:** la caja de la nota está
duplicada entre `VidaFinishSessionModal.tsx:162-177` y
`VidaLogSessionSheet.tsx:483-495` (mismo bloque, mismo `maxLength={2000}`,
mismo `placeholder` de cierre). Esta feature **no las unifica** (la sección 1 lo
deja fuera de alcance) pero tampoco añade una tercera copia suelta: todo lo
nuevo pasa por `VidaNoteSheet`.

**Lo que hay para las píldoras, verificado (punto 4 del encargo):**

- `useVidaHistoryWindow` **sí** devuelve las sesiones en crudo, con `notes`
  dentro: `VidaHistoryDay.followUps: ActivityFollowUp[]`
  (`src/features/vida/hooks/useVidaHistoryWindow.ts:45-52, 128-135`), alimentado
  por el documento de rango, que selecciona `FOLLOW_UP_FIELDS`. **La forma de
  los datos sirve.** Lo que no sirve es el reparto: (a) en Hoy está
  condicionada —`VidaHoyPage.tsx`, la llamada a `useVidaPatterns` con
  `enabled: canShowPatterns && (planItems.length > 0 || suggestions.length > 0)`—,
  (b) **la barra de sesión vive en `VidaModuleLayout`**, o sea que el editor de
  «durante» se abre también desde Plantilla, Actividades o Archivadas, donde esa
  ventana **no está montada**, y montarla ahí son ~43 consultas para sacar tres
  píldoras, y (c) para acertar su clave de caché habría que recalcular el mismo
  `from`/`to` que hoy se computa dentro del hook.
- La alternativa existe ya en el esquema y **no toca el backend**:
  `activityFollowUps(activityId: ID, from: String, to: String, limit: Int)`
  (`src/features/vida/graphql/schema/activity.schema.graphql:165`), resuelta por
  `listFollowUps` (`xavi-platform-node/src/services/activity-follow-up.service.ts:513-547`):
  filtra **solo sesiones cerradas**, `ORDER BY date DESC, start_time DESC` y
  aplica `LIMIT`. Es literalmente «las últimas notas de esa actividad». **En la
  web no hay documento para ese campo todavía.**

**El eslabón que falta entre plantilla y día, y que decide la tajada 4:**
`ActivityDayPlanItem` **no tiene `notes` ni ninguna referencia al `VidaItem` del
que salió** (`src/features/vida/types/activity-day-plan.types.ts:15-29` y
`DAY_PLAN_ITEM_FIELDS` en `activity-day-plan.graphql.ts:1-12`). El **único**
vínculo disponible sin tocar el API es `activityId`.

### Reference implementation

**`src/features/vida/components/VidaFinishSessionModal/VidaFinishSessionModal.tsx`**,
leído junto con `src/features/vida/routes/VidaModuleLayout.tsx:45-62, 95-120` y
`src/features/vida/hooks/useVidaSessionUi.ts`.

Por qué esa y no otra: es lo más parecido en **forma** a lo que hay que
construir —un modal corto sobre **una** sesión, que edita `notes` y guarda con
`activityFollowUpEdit`—, está vivo y es el patrón que este módulo ya eligió para
el problema exacto que reaparece aquí: **se llega al mismo editor desde varias
puertas y se monta una sola vez**, en el layout del módulo, con
`key={finishSession}` para que se remonte limpio en cada apertura, con el estado
local dentro y con el fallo leído dentro sin perder lo escrito. Copia de ahí:
`SteppedModal` con `ds="aura"`, `mobileSheet` y `size="md"`; el `footer` con
`Button` secundario/primario; `onSave` que **resuelve** `{ ok, message }` en vez
de lanzar.

Referencia secundaria para la fila: `VidaAgendaSession.tsx:120-147` — la
anatomía `gutter / card / body (name + meta)` que comparten las tres filas de la
agenda; la línea de la nota entra ahí, entre `name` y `meta`, igual en las tres.

### Where the new code goes

**Se crea:**

| Ruta | Qué es |
|---|---|
| `src/features/vida/components/VidaNoteLine/VidaNoteLine.tsx` (+ `.module.scss`, `index.ts`) | **La línea que se lee.** Props: `text: string \| null`, `placeholder?: string \| null`, `onEdit?: () => void`, `tone?: 'done' \| 'running' \| 'plan'`. Una sola línea con `text-overflow: ellipsis`, `white-space: nowrap`, `min-width: 0` y `title={text}`. Sin `text` y sin `placeholder` **no pinta nada** (criterio 554). Con `onEdit` es un `<button>`; sin él, un `<p>`. **Aquí y solo aquí** se cumplen los criterios 533 y 541: si el recorte se rompe, se arregla en un archivo. |
| `src/features/vida/components/VidaNoteSheet/VidaNoteSheet.tsx` (+ `.module.scss`, `index.ts`, `VidaNoteSheet.test.tsx`) | **El editor, uno para los cuatro momentos.** Props: `open`, `onClose`, `title`, `subtitle`, `initialValue: string`, `maxLength = 140`, `suggestions?: string[]`, `isSuggestionsPending?: boolean`, `onSave: (notes: string \| null) => Promise<{ ok: boolean; message?: string }> \| void`. **No muta nada**: recibe `onSave`, que es lo que permite usarlo también **antes de empezar**, cuando todavía no hay sesión que editar. Contador «29 / 140» del render. Guardar con el campo vacío llama `onSave(null)` (criterio 540); «Cancelar» cierra sin llamar (539). |
| `src/features/vida/hooks/useVidaSessionNote.ts` | **La escritura sobre una sesión.** Envuelve `useUpdateActivityFollowUpMutation({ silent: true })` en `saveNote(session, text)` → `mutateAsync({ id: session.id, notes: text })`. **Silencioso a propósito**: el cambio se ve en la línea; un toast por cada nota sería ruido sobre el gesto que la feature quiere abaratar. El error sí se dice, con el texto de `translateSessionError` del hook de sesión. |
| `src/features/vida/hooks/useVidaActivityNoteHistory.ts` | **Las píldoras.** `useQuery` con `vidaKeys.followUps.byActivity(activityId, limit)`, `enabled: open && Boolean(activityId) && guard` (`useVidaQueryGuard`, como el resto), `staleTime: 1000 * 60 * 5`, `limit: 20`. Devuelve `{ suggestions: string[], isPending }` pasando por el util de abajo. |
| `src/features/vida/utils/vida-notes.utils.ts` (+ `.test.ts`) | Aritmética pura, sin JSX y sin React: `recentNoteSuggestions(followUps, { max: 3, excludeId })` —quita vacías, recorta, **deduplica ignorando mayúsculas y espacios**, respeta el orden que ya trae el API (la más reciente primero)— y `templateNoteForActivity(suggestions, activityId)` —busca en `VidaSuggestion[]` el ítem de esa actividad y devuelve su `notes`; con dos ítems de la misma actividad el mismo día, **el de `startTime` más temprano**, escrito y con test—. |

**Se modifica** (anclado por elemento, nunca por número de línea: FEAT-016 está
tocando `VidaHoyPage.tsx` ahora mismo):

| Ruta | Qué se toca |
|---|---|
| `src/shared/api/query-keys.ts` | Dentro de `vidaKeys.followUps` (junto a `range`): `byActivity: (activityId: string, limit: number) => [...vidaKeys.followUps.all(), 'byActivity', activityId, limit] as const`. Cuelga de `followUps.all()`, así que `invalidateFollowUpQueries` ya la arrastra por prefijo — **compruébalo** en `src/features/vida/utils/invalidate-vida-queries.ts` antes de dar por hecho que una nota nueva refresca las píldoras. |
| `src/features/vida/graphql/activity-followups.graphql.ts` | Nueva constante exportada `ACTIVITY_FOLLOW_UPS_BY_ACTIVITY_QUERY` sobre `activityFollowUps(activityId:, limit:)` con `FOLLOW_UP_FIELDS` **sin** `sessionSubtasks` y sin `activity` (para tres píldoras no hace falta nada de eso). `contracts.test.ts` la recoge **sola** (`documentsOf(module)` lista los `string` exportados): no hay lista que editar, pero sí hay que correr el test. |
| `src/features/vida/api/activity-followups.api.ts` | `getActivityFollowUpsByActivity(activityId, limit)`, copiando `getActivityFollowUpsInDates` (`:68-78`). |
| `src/features/vida/hooks/useVidaSessionUi.ts` | Añadir `openNoteSheet: (session: ActivityFollowUp) => void` al contexto, con no-op por defecto (mismo razonamiento escrito ahí: esto es cromo, no dato). |
| `src/features/vida/routes/VidaModuleLayout.tsx` | Montar `<VidaNoteSheet>` **una vez**, al lado del `<VidaFinishSessionModal>`, con su propio `noting`/`noteOpen`/`noteSession` y `key` por apertura; añadir `openNoteSheet` al `useMemo` de `sessionUi`; pasar `note` y `onEditNote` a `<VidaSessionBar>`. |
| `src/features/vida/components/VidaSessionBar/VidaSessionBar.tsx` | Props aditivas `note?: string \| null` y `onEditNote?: () => void`. La línea va **dentro de `styles.root`, debajo de `styles.bar`** (la `.noteline` del render: punteada con «¿Qué estás haciendo?» cuando está vacía, sólida mint cuando tiene texto). Sin `onEditNote` la barra se pinta exactamente como hoy. |
| `src/features/vida/components/VidaAgendaBlock/VidaAgendaBlock.tsx` | Props aditivas `note`, `onEditNote`, y `noteDraft`/`onEditStartNote` (tajada 3). `<VidaNoteLine>` entre `<p className={styles.name}>` y `<p className={styles.meta}>`, dentro de `styles.body`. El lápiz de «antes de empezar» va **junto al botón `▶ Empezar`**, en la rama `) : onStart ? (` del pie de la tarjeta. |
| `src/features/vida/components/VidaAgendaSession/VidaAgendaSession.tsx` | Props aditivas `note`, `onEditNote`; `<VidaNoteLine>` en el mismo sitio, entre `styles.name` y `styles.meta`. |
| `src/features/vida/components/VidaUpNextCard/VidaUpNextCard.tsx` | Props aditivas `templateNote?: string \| null`, `noteDraft?: string \| null`, `onEditNote?: () => void`. **`onStart` sigue siendo `() => void`**: la tarjeta no ve `activityId`, ni hora, ni duración, y eso no cambia. Con `noteDraft` vacío, el lápiz va al lado del botón; con texto, `<VidaNoteLine>` encima y el botón vuelve a ocupar la fila entera (punto 4 del render). `templateNote` se pinta como línea aparte de `metaLine`, sin sustituirla (criterio 555). |
| `src/features/vida/components/VidaTemplateItemCard/VidaTemplateItemCard.tsx` | `<VidaNoteLine text={item.notes} />` entre `styles.name` y `styles.meta`. **Sin `onEdit` y sin `placeholder`** (criterio 554). |
| `src/features/vida/hooks/useVidaSessionActions.ts` | `start(activityId, startTime?, options?: { notes?: string \| null })`. Dentro, después de `const input = startSessionInput(activityId, now, startTime)`: `if (options?.notes) input.notes = options.notes`. **`startSessionInput` no se toca** (sus tests siguen valiendo) y `finishNow()` tampoco. |
| `src/features/vida/pages/VidaHoyPage.tsx` | Cablear `note`/`onEditNote` en `<VidaAgendaBlock>` y `<VidaAgendaSession>` (la nota sale de `execution.byBlockId[entry.id]?.span.session` y de `entry.span.session`), el borrador de «antes de empezar» y **un solo** `startWithNote(blockId, activityId)` usado por las dos puertas. |
| `src/features/vida/pages/VidaHoyPage.test.tsx` | Tests nuevos; **la línea que hoy afirma `expect(startSession.mock.calls[0]).toEqual(['a-b1'])` no se edita** (ver la garantía, abajo). |

### Los dos botones de empezar: qué comparten y qué no

`VidaAgendaBlock` y `VidaUpNextCard` **no** comparten un componente de
«control de nota» propio, y es deliberado: uno es una fila de agenda y el otro
una tarjeta con su propio layout, y forzar un envoltorio común obligaría a
pasarle el estilo desde fuera. Lo que comparten es **todo lo que puede
divergir**:

- **El editor**: `VidaNoteSheet`, el mismo, montado una vez en
  `VidaModuleLayout` y abierto por contexto.
- **La línea que se lee**: `VidaNoteLine`, la misma en las cinco filas.
- **La llamada**: `startWithNote(blockId, activityId)` en `VidaHoyPage`, **una
  función**, usada por el `onStart` del bloque y por el de la tarjeta. Ninguno
  de los dos componentes llama nunca a `sessionActions.start`.
- **El borrador**: un único `startNoteDrafts: Record<string, string>` en
  `VidaHoyPage`, con la clave `block.id` —el bloque, no la actividad, por el
  mismo motivo que ya está escrito en `VidaHoyPage` para `isRunning`: dos
  bloques de la misma actividad el mismo día son dos cosas distintas—. La
  tarjeta «Lo que viene» lee ese mismo borrador con `upNext.blockId`, así que
  escribir la nota en la fila y pulsar en la tarjeta **usa la misma nota**, que
  es lo que cualquiera esperaría.

Lo que cada uno pone de su parte es solo la **posición** del lápiz: al lado del
botón en los dos, pero con su propio `styles`.

### La garantía del «▶ Empezar», y cómo se fija

La regla que no se puede romper: el botón de `VidaUpNextCard` manda
`start(activityId)` **y nada más**; ni la duración planeada ni la hora de la
plantilla viajan. Se protege en cuatro sitios, y ninguno depende de que alguien
se acuerde:

1. **La firma solo admite `notes`.** El tercer parámetro es
   `{ notes?: string | null }` —no un `input` abierto, no
   `Partial<ActivityFollowUpStartInput>`—, así que `durationMinutes` ni existe
   (y `activityFollowUpStart` tampoco tiene ese campo) y `startTime` sigue
   siendo el segundo parámetro, que estas dos puertas **nunca** rellenan.
2. **La rama sin nota es literalmente la llamada de hoy.** En `startWithNote`:
   `const note = (startNoteDrafts[blockId] ?? '').trim()`, y después
   `if (!note) return void sessionActions.start(activityId)` — **un solo
   argumento**. Solo si hay texto: `sessionActions.start(activityId, null, { notes: note })`.
3. **El test que ya existe se queda como está y es la red.**
   `src/features/vida/pages/VidaHoyPage.test.tsx` — el caso de «Lo que viene»
   que afirma `expect(startSession.mock.calls[0]).toEqual(['a-b1'])`. Compara el
   **array entero**: si alguien filtra la hora de la plantilla o la duración en
   ese camino, ese test se pone rojo. **Prohibido editarlo para «adaptarlo».**
   Si se pone rojo, el error está en el código nuevo.
4. **Dos tests nuevos al lado del anterior, con la misma comparación de array
   entero:**
   - con una nota escrita antes de pulsar:
     `expect(startSession.mock.calls[0]).toEqual(['a-b1', null, { notes: 'Revisando MRs' }])`
     — el `null` del segundo hueco es justo lo que deja escrito que la hora del
     plan no viaja;
   - con un ítem de plantilla **que sí tiene nota** y el control **sin abrir**:
     `expect(startSession.mock.calls[0]).toEqual(['a-b1'])` (criterio 557).

### Proponer sin imponer: dónde vive y cómo se distingue

**De dónde sale la nota de la plantilla en Hoy, sin pagar nada:**
`useVidaDayData` ya monta `vidaSuggestionsForDate` **sin condiciones** (es una
de sus cuatro consultas) y su `item` selecciona `VIDA_ITEM_FIELDS`, que incluye
`notes`. O sea: `suggestions[].item.notes` **ya está en memoria** en cada
pintado de Hoy. El cruce es por `activityId` —el único que hay, porque el ítem
del plan del día no guarda de qué ítem de plantilla salió— y vive en
`templateNoteForActivity()` (`vida-notes.utils.ts`), **fuera de los
componentes**, con sus tests.

**Cómo se distingue «la dejó igual» de «la borró a propósito»:** por el estado
del borrador, no por comparar textos.

- `startNoteDrafts[blockId] === undefined` → **nunca se abrió el control**. La
  propuesta de la plantilla es solo el `initialValue` del editor cuando se
  abre; mientras no se abra, no existe. `start(activityId)`, un argumento, sin
  nota (criterios 550 y 557).
- El editor se abre con la nota de la plantilla ya escrita, y al guardar se
  escribe `startNoteDrafts[blockId] = valor.trim()`. Si el usuario la dejó tal
  cual, la sesión nace con ella **porque él le dio a guardar**, no porque nadie
  la copiara.
- Si la vació y guardó, el borrador queda en `''` → la rama sin nota de
  `startWithNote` → `start(activityId)`, un argumento. «Borrada a propósito» y
  «nunca abierta» acaban en la misma sesión sin nota, y eso es correcto: la
  diferencia que importa no es la intención, es que **nunca se copia sola**.
- Sin ítem de plantilla detrás (`templateNoteForActivity` devuelve `null`), el
  editor abre vacío (criterio 558).

La nota de la sesión (`ActivityFollowUp.notes`) y la del ítem
(`VidaItem.notes`) **nunca se escriben la una a la otra**: el editor de la
sesión guarda con `activityFollowUpEdit`; la del ítem se sigue escribiendo solo
desde `VidaActivitySheet`. Ningún camino de esta feature escribe en
`vidaItemUpdate`.

### Las píldoras: de dónde salen y cuánto cuestan de verdad

**Decisión: documento nuevo, sin tocar el backend.**
`activityFollowUps(activityId:, limit:)` ya está en el esquema y ya está
resuelto (ordena por fecha y hora descendente y devuelve **solo sesiones
cerradas**, que es exactamente «lo de otras veces»).

**El coste, dicho y no escondido:** **+1 consulta GraphQL**, con estas
condiciones:

- Se monta **solo con el editor abierto** (`enabled: open && Boolean(activityId)`).
  **El primer pintado de Hoy no cambia en nada: cero consultas nuevas al abrir
  la pantalla.**
- `limit: 20`, sin subtareas y sin `activity` en la selección: la respuesta son
  veinte filas cortas. **Comprueba el máximo que admite `activityFollowUpsArgsSchema`**
  en `xavi-platform-node/src/graphql/modules/activity/` antes de fijar el 20; si
  el validador es más estricto, manda el suyo.
- `staleTime: 5 min`: abrir y cerrar el editor tres veces sobre la misma
  actividad cuesta **una** consulta.
- Clave nueva `vidaKeys.followUps.byActivity`, colgada de `followUps.all()`:
  escribir una nota la invalida por prefijo como al resto.

**Por qué no la ventana de seis semanas** (aunque su forma de datos sí sirva):
está condicionada en Hoy, **no existe en Plantilla ni en Actividades**, que es
desde donde también se abre la barra de sesión, y montarla ahí serían ~43
consultas para tres píldoras. Reusar su caché solo funcionaría en el caso
afortunado y obligaría a recalcular su `from`/`to` fuera del hook.

**Criterio 547 sin consulta en vuelo:** con `isSuggestionsPending` no se pinta
la sección de píldoras —ni esqueleto ni hueco—; con la consulta resuelta y cero
notas, tampoco. Nunca un error, nunca un vacío con explicación.

### What NOT to create

- **El campo, la mutación y la migración.** Nada de esto se toca: ni el SDL
  vendorizado, ni `xavi-platform-node`, ni una migración. (Sí hay un
  **documento** nuevo en la web, que es otra cosa.)
- **Otra caja de nota en el cierre ni en el registro**:
  `VidaFinishSessionModal.tsx:162-177` y `VidaLogSessionSheet.tsx:483-495`
  funcionan y se quedan como están.
- **El formulario de la nota del ítem de plantilla**: `VidaActivitySheet.tsx:679-693`
  ya existe, con su `maxLength={280}`. No se iguala a 140: son dos preguntas
  distintas.
- **Un segundo montaje del editor.** `VidaNoteSheet` se monta **una sola vez**
  en `VidaModuleLayout` y se abre por `useVidaSessionUi`, igual que el cierre
  completo. Montarlo por pantalla son dos estados que se contradicen.
- **Una segunda ventana de historia ni un segundo `useVidaPatterns`.**
- **`notes` en `ActivityDayPlanItem`.** El plan del día no gana campos: el
  cruce es por `activityId`.

### Where it does NOT go

- **No cuelga de `VidaTemplateAside`** (`VidaTemplateAside.tsx`): FEAT-010
  tajada 3 lo retira, y va la última de todo el módulo.
- **No entra en Revisión** (`VidaRevisionPage.tsx`, `VidaReviewRow`,
  `VidaReviewOffPlanRow`, `VidaReviewStory`): construyen su propia fila y la
  sección 1 lo dejó fuera. Cuando se haga, `VidaNoteLine` vale tal cual — esa es
  la razón de que la línea sea un componente y no tres `<p>` sueltos.
- **No se crea `startWithNote` dentro de `useVidaSessionActions`** como una
  segunda función de arranque: dos funciones de empezar divergen, y la garantía
  del botón se defiende mejor con **una** firma cuyo tercer parámetro solo
  admite `notes`.
- **No se guarda nada en `vida-device-notes.store.ts`**: la nota es dato del
  servidor, no del aparato. Ese store es para lo que no viaja.
- **No se baja el `maxLength` de 2000** de las dos cajas que ya existen (ver la
  nota del criterio 533 en el reporte de entrega).
- **No se usa `Activity.description`** para nada (criterio 531).

### Slices, with paths

| # | What it does | Files | Criteria it closes | State |
|---|---|---|---|---|
| 1 | La nota que ya se escribe hoy al terminar **se ve y se edita en la línea del día** | **Crea:** `components/VidaNoteLine/{VidaNoteLine.tsx,.module.scss,index.ts}`, `components/VidaNoteSheet/{VidaNoteSheet.tsx,.module.scss,index.ts,VidaNoteSheet.test.tsx}` (sin píldoras todavía), `hooks/useVidaSessionNote.ts`. **Modifica:** `hooks/useVidaSessionUi.ts` (+`openNoteSheet`), `routes/VidaModuleLayout.tsx` (monta la hoja una vez), `components/VidaAgendaBlock/VidaAgendaBlock.tsx` (+`note`,`onEditNote`, línea entre `name` y `meta`), `components/VidaAgendaSession/VidaAgendaSession.tsx` (ídem), `pages/VidaHoyPage.tsx` (cablea las dos; `onEditNote` solo con `canLogPast` y **no** sobre la sesión en marcha), `pages/VidaHoyPage.test.tsx` | 531, 532 (su mitad «¿Qué hiciste?»), 533, 535, 536, 537, 538, 539, 540, 541, 552 | pending |
| 2 | **Durante, sin parar nada**: la barra y el bloque en marcha enseñan y editan la nota, con píldoras de «lo de otras veces» | **Crea:** `utils/vida-notes.utils.ts` + `.test.ts`, `hooks/useVidaActivityNoteHistory.ts`. **Modifica:** `shared/api/query-keys.ts` (+`followUps.byActivity`), `graphql/activity-followups.graphql.ts` (+`ACTIVITY_FOLLOW_UPS_BY_ACTIVITY_QUERY`), `api/activity-followups.api.ts` (+`getActivityFollowUpsByActivity`), `components/VidaNoteSheet/VidaNoteSheet.tsx` (+píldoras), `components/VidaSessionBar/VidaSessionBar.tsx` (+`note`,`onEditNote`), `routes/VidaModuleLayout.tsx` (pasa las dos), `components/VidaAgendaBlock/VidaAgendaBlock.tsx` (la rama `isRunning` enseña la línea), `pages/VidaHoyPage.tsx`, `graphql/contracts.test.ts` (**correrlo**, no editarlo) | 542, 543, 544, 545, 546, 547, 532 (su mitad «¿Qué estás haciendo?»), 552 | pending |
| 3 | **Antes de empezar**, sin tocar el botón de arrancar | **Modifica:** `hooks/useVidaSessionActions.ts` (`start(activityId, startTime?, { notes })`), `components/VidaUpNextCard/VidaUpNextCard.tsx` (+`noteDraft`,`onEditNote`; `onStart` intacto), `components/VidaAgendaBlock/VidaAgendaBlock.tsx` (lápiz junto al `▶ Empezar`), `pages/VidaHoyPage.tsx` (`startNoteDrafts` + `startWithNote`, una sola función para las dos puertas), `pages/VidaHoyPage.test.tsx` (los dos tests nuevos; **el de `toEqual(['a-b1'])` no se toca**) | 548, 549, 550, 551, 534, 552 | pending |
| 4 | **La plantilla propone, la sesión decide** | **Modifica:** `utils/vida-notes.utils.ts` (+`templateNoteForActivity` con su test), `components/VidaTemplateItemCard/VidaTemplateItemCard.tsx` (línea de solo lectura), `components/VidaUpNextCard/VidaUpNextCard.tsx` (+`templateNote`, línea aparte de `metaLine`), `pages/VidaHoyPage.tsx` (la propuesta como `initialValue` del editor, desde `suggestions[].item.notes`), `pages/VidaPlantillaPage.test.tsx` y `pages/VidaHoyPage.test.tsx` | 553, 554, 555, 556, 557, 558, 552 | pending |

**Corte:** el de la sección 1, sin recortar. Cuatro tajadas verticales, cada una
usable sola, y el orden es el único posible: la 2 necesita la hoja de la 1, la 3
necesita que la nota se vea en algún sitio antes de escribirla a ciegas, y la 4
necesita el control de la 3 para tener dónde proponer. Dos avisos de secuencia
que no cambian el corte: `VidaNoteSheet` **nace en la tajada 1 sin píldoras** y
la 2 se las añade (no es una tajada de andamio: la 1 ya es útil sin ellas); y la
línea de la sesión en marcha, aunque sea de la tajada 2, usa el `VidaNoteLine`
que crea la 1.

## 3. Construction — feature-builder

*(pendiente)*

## 4. Review — feature-reviewer

*(pendiente)*
