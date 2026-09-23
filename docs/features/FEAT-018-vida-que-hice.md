---
id: FEAT-018
title: Qué hice — la nota de la sesión, antes, durante y en la línea del día
status: building
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
| 1 | La nota que ya se escribe hoy al terminar se ve y se edita en la línea del día | aceptada |
| 2 | Ver y editar la nota de la sesión en marcha, sin parar nada, con píldoras de lo de otras veces | aceptada |
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
| 1 | La nota que ya se escribe hoy al terminar **se ve y se edita en la línea del día** | **Crea:** `components/VidaNoteLine/{VidaNoteLine.tsx,.module.scss,index.ts}`, `components/VidaNoteSheet/{VidaNoteSheet.tsx,.module.scss,index.ts,VidaNoteSheet.test.tsx}` (sin píldoras todavía), `hooks/useVidaSessionNote.ts`. **Modifica:** `hooks/useVidaSessionUi.ts` (+`openNoteSheet`), `routes/VidaModuleLayout.tsx` (monta la hoja una vez), `components/VidaAgendaBlock/VidaAgendaBlock.tsx` (+`note`,`onEditNote`, línea entre `name` y `meta`), `components/VidaAgendaSession/VidaAgendaSession.tsx` (ídem), `pages/VidaHoyPage.tsx` (cablea las dos; `onEditNote` solo con `canLogPast` y **no** sobre la sesión en marcha), `pages/VidaHoyPage.test.tsx` | 531, 532 (su mitad «¿Qué hiciste?»), 533, 535, 536, 537, 538, 539, 540, 541, 552 | aceptada |
| 2 | **Durante, sin parar nada**: la barra y el bloque en marcha enseñan y editan la nota, con píldoras de «lo de otras veces» | **Crea:** `utils/vida-notes.utils.ts` + `.test.ts`, `hooks/useVidaActivityNoteHistory.ts`. **Modifica:** `shared/api/query-keys.ts` (+`followUps.byActivity`), `graphql/activity-followups.graphql.ts` (+`ACTIVITY_FOLLOW_UPS_BY_ACTIVITY_QUERY`), `api/activity-followups.api.ts` (+`getActivityFollowUpsByActivity`), `components/VidaNoteSheet/VidaNoteSheet.tsx` (+píldoras), `components/VidaSessionBar/VidaSessionBar.tsx` (+`note`,`onEditNote`), `routes/VidaModuleLayout.tsx` (pasa las dos), `components/VidaAgendaBlock/VidaAgendaBlock.tsx` (la rama `isRunning` enseña la línea), `pages/VidaHoyPage.tsx`, `graphql/contracts.test.ts` (**correrlo**, no editarlo) | 542, 543, 544, 545, 546, 547, 532 (su mitad «¿Qué estás haciendo?»), 552 | aceptada |
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

*(una entrada por tajada, añadida debajo)*

### Tajada 1 — la nota en la línea del día

**Resumen para el revisor:**
1. La nota que ya se guardaba al terminar una sesión **ahora se ve** en su fila
   de la agenda de Hoy —bloque del plan y sesión fuera del plan— y **se edita
   ahí mismo** con una hoja corta que solo escribe `notes`.
2. Código nuevo: `VidaNoteLine` (la línea que se lee), `VidaNoteSheet` (el
   editor, ya con la firma de props de las cuatro tajadas) y
   `useVidaSessionNote` (la escritura, silenciosa). Todo lo demás son props
   aditivas y el montaje único en `VidaModuleLayout`.
3. **Lo que más probablemente he roto:** el **alto de las filas de la agenda**.
   La línea entra entre `styles.name` y `styles.meta` dentro de `styles.body`,
   así que **cada sesión terminada de un día que se puede editar suma ~16 px a
   su fila** aunque no tenga nota —porque ofrece «＋ añadir qué hiciste»—. Eso
   toca el cálculo de scroll de la marca «Ahora» (`nowRef`), la altura del
   lateral de escritorio y cualquier cosa que contara con el alto anterior. Los
   tests no miden píxeles: eso hay que mirarlo con ojos. El segundo sitio a
   mirar es `VidaAgendaSession` con la etiqueta «fuera del plan»: la tarjeta es
   `flex-wrap` y la etiqueta comparte línea con la nota, que ahí se queda en
   **114 px** de ancho útil a 375 px (medido). Se recorta bien, pero se lee muy
   poco.

**Qué se construyó:**

- `src/features/vida/components/VidaNoteLine/{VidaNoteLine.tsx,.module.scss,index.ts}`
  — la línea que se lee. Props tal como las pidió la sección 2: `text`,
  `placeholder`, `onEdit`, `tone` (`done` | `running` | `plan`). Sin `text` y
  sin `placeholder` **no pinta nada**. Con `onEdit` es un `<button>`; sin él, un
  `<p>`. El `title` lleva el texto entero. **Los tres tonos están escritos ya**
  —`running` es la caja punteada/mint del render para la barra de la tajada 2, y
  `plan` el de la fila de plantilla de la tajada 4— aunque esta tajada solo use
  `done`: son ocho líneas de SCSS y evitan que la tajada 2 tenga que volver a
  abrir este archivo para lo visual.
- `src/features/vida/components/VidaNoteSheet/{VidaNoteSheet.tsx,.module.scss,index.ts,VidaNoteSheet.test.tsx}`
  — el editor. `SteppedModal` con `ds="aura"`, `mobileSheet`, `size="md"`, el
  estado local dentro, el fallo leído dentro sin perder lo escrito y `onSave`
  que **resuelve**, no lanza: calcado de `VidaFinishSessionModal`. Contador
  «29 / 140». Guardar en blanco llama `onSave(null)`; «Volver» no llama a nada.
- `src/features/vida/hooks/useVidaSessionNote.ts` — `saveNote(session, notes)`
  sobre `useUpdateActivityFollowUpMutation({ silent: true })`, con el error
  traducido por `translateSessionError`.
- `src/features/vida/hooks/useVidaSessionUi.ts` — `openNoteSheet` en el
  contexto, con no-op por defecto, igual que `openFinishModal`.
- `src/features/vida/routes/VidaModuleLayout.tsx` — la hoja se monta **una sola
  vez**, al lado de `VidaFinishSessionModal`, con su `noting`/`noteOpen`/`noteSession`
  y su `key` por apertura. El título sale de `session.isOpen`: «¿Qué estás
  haciendo?» o «¿Qué hiciste?» (criterio 532).
- `src/features/vida/components/VidaAgendaBlock/VidaAgendaBlock.tsx` y
  `src/features/vida/components/VidaAgendaSession/VidaAgendaSession.tsx` —
  props aditivas `note` y `onEditNote`, y `<VidaNoteLine>` entre `styles.name` y
  `styles.meta`. Sin las props, las dos filas se pintan exactamente como antes.
- `src/features/vida/pages/VidaHoyPage.tsx` — cablea las dos, con el helper
  `blockNoteSession()` (la sesión de un bloque, **solo si ya terminó**).
  `onEditNote` se pasa **solo** con `canLogPast` y **nunca** sobre una sesión en
  marcha.
- `src/features/vida/pages/VidaHoyPage.test.tsx` — siete casos nuevos. **No se
  tocó ninguno de los existentes**, incluido el `toEqual(['a-b1'])` que la
  sección 2 protege.

**Por qué así, y qué se descartó:**

- **La decisión que me tocaba resolver: una nota más larga que el `maxLength`.**
  Las dos cajas que ya existen guardan hasta 2000 y esta hoja pide 140, así que
  una nota escrita al terminar puede llegar aquí con 420 caracteres. Lo que hice,
  y por qué:
  - **El texto se pinta entero. Nunca se corta al abrir.** Truncar en silencio
    era la opción a evitar por encima de todo.
  - **El tope efectivo del campo es `max(maxLength, initialValue.length)`.** Con
    `maxLength={140}` a secas el navegador bloquea **toda** inserción en un
    valor que ya se pasa: la nota quedaría congelada y solo se podría borrar,
    que es un castigo raro por haberla escrito en la caja grande. Así se sigue
    pudiendo corregir una palabra en medio; lo que no se puede es **crecer** más
    allá de lo que ya ocupaba.
  - **Se dice en voz alta**: el contador se lee «420 / 140» en negrita y debajo
    aparece una línea, «Esta la escribiste en una caja más larga. Cabe entera:
    si la guardas tal cual, no se pierde nada.» Solo aparece cuando de verdad
    sobra texto.
  - **Guardar manda lo que se ve.** Nadie pierde texto sin enterarse.
  Descartado: truncar al abrir (pierde texto), bloquear el guardado hasta que
  quepa (convierte una nota ya escrita en una tarea) y subir el tope a 2000
  (eso es justo la decisión del usuario que está fuera de alcance).
- **Desviación consciente de la sección 2: las píldoras.** El plan dice que
  `VidaNoteSheet` «nace en la tajada 1 **sin** píldoras». Las props
  `suggestions` e `isSuggestionsPending` **están en la firma** (el encargo pide
  no recortar la forma) y, para que no sean dos parámetros muertos que el linter
  señalaría, el `<section aria-label="Lo de otras veces">` está escrito y es
  **inerte**: sin `suggestions` no pinta nada, ni esqueleto ni hueco. Esta
  tajada no las pasa desde ningún sitio y no hay consulta nueva: **cero
  consultas añadidas**. La tajada 2 solo tiene que conectar el hook.
- **El «＋ añadir qué hiciste» lo decide quien cablea, no el componente.** Las
  dos filas pasan `placeholder={onEditNote ? 'añadir qué hiciste' : null}`. La
  alternativa —que `VidaNoteLine` pusiera el texto por su cuenta cuando hay
  `onEdit`— dejaba el criterio 554 (la fila de plantilla no repite ese texto)
  colgando de un acoplamiento implícito. El coste es que la frase aparece
  **escrita en dos archivos**; no la subí a una constante porque el único sitio
  natural es `utils/vida-notes.utils.ts`, que la sección 2 asigna a la tajada 2.
- **`blockNoteSession()` es una función de módulo y no un `useMemo`**: se llama
  dentro de `renderEntry`, que la sección 2 y FEAT-010 dejaron escrito que no se
  toca de forma.

**Verificación:**

| Qué | Resultado |
|---|---|
| `pnpm typecheck` | **limpio**, sin salida (= línea base) |
| `pnpm lint` | **14 errores / 0 warnings** (= línea base). Ninguno en `features/vida`: los 14 siguen siendo `HabitDifficultyPicker`, `CommandPalette`×2, `CommandPaletteProvider`, `ConfirmDialogProvider`, `IconPicker`, `SteppedModal`, `Tabs`, `toast.context`, `render.tsx` |
| `pnpm test` | **2 fallos de 1835** — los dos de `SearchSelect`, preexistentes. La línea base era 2 de 1820; los 15 de más son los nuevos (8 de `VidaNoteSheet`, 7 de `VidaHoyPage`). `IconPicker` no salió flaky esta vez |
| `pnpm vitest run src/features/vida` | **58 archivos, 1415 tests, todo verde** |
| `pnpm build` | **exit 0**. Chunk inicial **1.124,85 kB** (base 1.121,29 → **+3,56 kB**, los dos componentes y el hook). `app-icons` **620,20 kB**, **sin mover**. `IconPicker` 4,64 kB, igual |
| `graphify update .` | 4151 nodos, 4932 aristas |

**Criterio 541, medido en navegador, no de palabra.** Arnés temporal
(`note-harness.html` + `src/note-harness.tsx`, **ya borrados**) con las tres
filas y la hoja, a **375 × 812**, con una nota de **420 caracteres exactos**:

```
document.documentElement.scrollWidth = 375   clientWidth = 375   (sin desborde)
fila bloque   : scrollWidth 343 = clientWidth 343   alto 87 px
fila suelta   : scrollWidth 343 = clientWidth 343   alto 80 px
span de la nota: scrollWidth 2250  clientWidth 203 / 114   alto 16 px (UNA línea)
                 computed: overflow hidden · text-overflow ellipsis · white-space nowrap
title del botón: 420 caracteres (el texto entero sigue ahí)
hoja abierta  : textarea.value.length 420 · maxLength 420 · contador «420 / 140»
                document.scrollWidth 375 = clientWidth
```

**Criterios que cierra, uno a uno:**

- **531** — nada de lo nuevo lee ni escribe `Activity.description`. La nota sale
  y entra siempre por `ActivityFollowUp.notes`: la fila la lee de
  `entry.span.session.notes` / `blockNoteSession(...)?.notes`, y `saveNote`
  escribe `activityFollowUpEdit({ id, notes })` con el `id` **de la sesión**. Dos
  sesiones de la misma actividad el mismo día son dos filas con dos `id`
  distintos.
- **532** (su mitad «¿Qué hiciste?») — la cabecera de la hoja es la pregunta y
  el `aria-label` del textarea es la misma pregunta. En la fila se lee «añadir
  qué hiciste». Test: *«criterio 532 — la cabecera es la pregunta, no “nota” ni
  “descripción”»*, que además comprueba que ni «nota» ni «descripción» aparecen
  en el texto de la hoja.
- **533** — `maxLength` 140 y contador «N / 140» (test del contador: `0 / 140` →
  `13 / 140`); el recorte con puntos suspensivos vive en `VidaNoteLine` y está
  medido arriba.
- **535** — dos tests: bloque del plan con nota y sesión fuera del plan con nota;
  en los dos la nota se lee dentro de la fila, bajo el nombre. Visto también en
  el arnés.
- **536** — test *«una sesión terminada sin nota ofrece “añadir qué hiciste”, sin
  reproche»*, que comprueba además que no aparece «falta», «vacío», «sin nota» ni
  «olvid…» en la fila.
- **537** — dos tests: en un **día futuro** no hay ningún «añadir qué hiciste»
  (la fila del plan sí se pinta, así que no es un falso verde), y una sesión **en
  marcha** se lee «en marcha» pero no ofrece la línea.
- **538** — dos tests con el contexto de verdad montado: tocar la nota escrita y
  tocar el «＋ añadir qué hiciste» llaman a `openNoteSheet` **una vez** y con la
  sesión correcta (`{ id: 'f1', notes: 'Con agua fría' }` y `{ id: 'f9', notes:
  null }`). Que la hora y la duración no se tocan lo sostiene la forma de la
  llamada: `saveNote` manda **solo** `{ id, notes }` y el backend actualiza solo
  las columnas presentes (verificado por el arquitecto en
  `activity-follow-up.service.ts`). **Lo que no puedo comprobar desde aquí es la
  ida y vuelta real contra el API**: va abajo, en lo pendiente.
- **539** — test *«“Volver” no guarda nada»*: `onSave` no se llama y la hoja
  cierra.
- **540** — test *«guardar en blanco borra la nota»*: `onSave(null)`, y no
  aparece ningún error.
- **541** — medido arriba en navegador a 375 px con 420 caracteres.
- **552** — la tabla de verificación. Todo igual o mejor que la línea base salvo
  los +3,56 kB del chunk inicial, que se dicen y no se esconden.

**Pendiente de prueba a mano (detrás del login, no se puede desde aquí):**

- Que **guardar de verdad** escribe la nota y la fila la refresca sin recargar.
  El camino está: `invalidateFollowUpQueries` invalida `followUps.day(date)`, que
  es la consulta de la que sale la fila. Pero la ida y vuelta contra la API no
  se puede ejecutar sin sesión.
- Que **la hora y la duración no cambian** después de guardar una nota (mirar la
  fila: «14:00 – 16:40 · 2h 40m» antes y después).
- Que **no sale ningún toast** al guardar la nota (`silent: true`), y que el
  error sí se lee dentro de la hoja si el servidor falla.
- Que el alto nuevo de las filas no rompe el salto a «Ahora» al abrir la
  pantalla.

**Riesgos:**

- **El alto de las filas** (ver el resumen). Es el cambio con más alcance y no
  lo cubre ningún test.
- **La nota comparte línea con la etiqueta «fuera del plan»** en
  `VidaAgendaSession`: a 375 px le quedan 114 px. Se recorta bien, pero quizá
  quiera bajar a su propia línea. No lo cambié: tocar el `flex-wrap` de esa
  tarjeta afecta a estados que FEAT-004 ya revisó.
- **`VidaNoteSheet` trae la sección de píldoras escrita e inerte.** Si la tajada
  2 le pasa `suggestions` sin querer desde algún sitio, aparecerían antes de
  tiempo. Hoy no la pasa nadie.
- **`useVidaSessionUi` ganó una clave.** No está mockeado en ningún test del
  repositorio (comprobado), así que no hay mocks a medias que completar; pero el
  siguiente que lo mockee tiene que listar las **dos**.

**Estado del árbol:** sin commitear.

### Tajada 2 — durante, sin parar nada

**Resumen para el revisor:**
1. Con algo en marcha, **la barra de la sesión y las dos filas de la agenda**
   —el bloque del plan y la sesión de fuera del plan— enseñan una línea que
   dice lo que estás haciendo, o pregunta «¿Qué estás haciendo?» si todavía no
   lo has dicho; tocarla abre el editor, que ahora ofrece **«Lo de otras
   veces»**: tus últimas notas de esa misma actividad, de un toque.
2. Código nuevo: `utils/vida-notes.utils.ts` (las palabras + las píldoras),
   `hooks/useVidaActivityNoteHistory.ts` (la consulta, **solo con el editor
   abierto**), `ACTIVITY_FOLLOW_UPS_BY_ACTIVITY_QUERY` +
   `getActivityFollowUpsByActivity` + `vidaKeys.followUps.byActivity`. El resto
   son props aditivas y cableado.
3. **Lo que más probablemente he roto:** el **alto de la barra de la sesión**,
   que ahora es una tarjeta de dos filas. Medido en el navegador a 375 px:
   pasa de **69 px a 117 px** (+3rem) y por eso el hueco reservado de
   `VidaModuleLayout` sube de `4.5rem` a `7.5rem`. Eso afecta a **todas** las
   pantallas del módulo con algo en marcha —Hoy, Plantilla, Revisión,
   Actividades—: si alguna contaba con el hueco viejo, ahora sobra o falta
   espacio abajo, y los tests no miden píxeles. El segundo sitio a mirar es
   `VidaSessionBar.module.scss`: la tarjeta cambió de fila a columna y la fila
   de siempre vive ahora en un `.row` nuevo; cualquier cosa que dependiera de
   que `.bar` fuera el flex-row se resiente.

**Qué se construyó:**

- `src/features/vida/utils/vida-notes.utils.ts` (+ `.test.ts`) — las **palabras
  del módulo** (`VIDA_NOTE_ADD_LABEL`, `VIDA_NOTE_QUESTION_RUNNING`,
  `VIDA_NOTE_QUESTION_DONE`, `VIDA_NOTE_SUGGESTIONS_LABEL`) y
  `recentNoteSuggestions(followUps, { max, excludeId })`: quita vacías, recorta,
  **deduplica ignorando mayúsculas y espacios**, respeta el orden del API y
  excluye la sesión que se está editando. **Cierra el hallazgo H3 de la
  revisión de la tajada 1**: «añadir qué hiciste» ya no vive copiada en dos
  componentes.
- `src/features/vida/graphql/activity-followups.graphql.ts` —
  `ACTIVITY_FOLLOW_UPS_BY_ACTIVITY_QUERY` sobre
  `activityFollowUps(activityId:, limit:)`.
- `src/features/vida/api/activity-followups.api.ts` —
  `getActivityFollowUpsByActivity(activityId, limit)` y el tipo corto
  `ActivityFollowUpNoteRow`.
- `src/shared/api/query-keys.ts` — `vidaKeys.followUps.byActivityAll()` y
  `byActivity(activityId, limit)`.
- `src/features/vida/utils/invalidate-vida-queries.ts` — invalida
  `byActivityAll()` por prefijo (ver «lo que descubrí»).
- `src/features/vida/hooks/useVidaActivityNoteHistory.ts` (+ `.test.tsx`) — la
  consulta, con `useVidaQueryGuard`, `enabled: open && Boolean(activityId)`,
  `staleTime: 5 min` y `limit: 20`. Devuelve `{ suggestions, isPending }`, y
  `isPending` es **falso cuando está apagada**: apagada no es «cargando».
- `src/features/vida/components/VidaNoteSheet/` — las píldoras ganan su
  **rótulo visible** «Lo de otras veces» (render 19), en su propia fila.
- `src/features/vida/components/VidaSessionBar/` — props aditivas `note` y
  `onEditNote`; la tarjeta pasa a columna (`.row` + la línea) y la línea usa el
  tono `running`, que la tajada 1 ya había dejado escrito en `VidaNoteLine`.
  **Sin `onEditNote` la barra se pinta exactamente como antes** (medido: 69 px).
- `src/features/vida/routes/VidaModuleLayout.tsx` — monta
  `useVidaActivityNoteHistory` con la sesión que tiene el editor abierto, pasa
  `suggestions`/`isSuggestionsPending` a la hoja y `note`/`onEditNote` a la
  barra. Los títulos salen ya de las constantes.
- `src/features/vida/components/VidaAgendaBlock/` y `VidaAgendaSession/` — el
  texto del hueco depende de si **esa** fila está en marcha: «¿Qué estás
  haciendo?» mientras corre, «añadir qué hiciste» cuando terminó.
- `src/features/vida/pages/VidaHoyPage.tsx` — **cierra el hallazgo H1**:
  `blockNoteSession()` ya no devuelve `null` con la sesión en marcha y el
  `onEditNote` de la fila de fuera del plan ya no lleva `&& !isRunning`. Las
  dos filas se comportan igual **a propósito**, y las dos preguntan lo mismo
  que la barra.

**Por qué así, y qué se descartó:**

- **La línea va dentro de la tarjeta de la barra, no debajo de ella.** La
  sección 2 decía «dentro de `styles.root`, debajo de `styles.bar`»; ahí la
  línea habría quedado **fuera del vidrio**, flotando sobre la agenda, y el
  render 19 la pinta dentro de la tarjeta («la sesión en marcha lleva la nota
  encima»). Se hizo lo del render: `.bar` es ahora columna y la fila de siempre
  es `.row`. Es la única desviación de forma respecto del plan.
- **La selección del documento nuevo es corta y no usa `FOLLOW_UP_FIELDS`**
  (la sección 2 proponía reusarlo sin `sessionSubtasks`): `FOLLOW_UP_FIELDS`
  incluye `sessionSubtasksCount`, que son **veinte resoluciones más en el
  servidor** por abrir un editor. Se piden `id`, `date`, `startTime` y `notes`.
- **Las píldoras se ofrecen en los cuatro momentos, no solo «durante».** El
  editor es uno y se monta una vez; condicionar las píldoras a que la sesión
  esté abierta habría sido código de más para ofrecer menos. Corregir la nota de
  una sesión terminada también ofrece lo de otras veces, y **nunca se ofrece a
  sí misma** (`excludeId`).
- **Se invalidan las píldoras de todas las actividades, no solo la de la
  sesión.** Es una consulta que solo está viva con el editor abierto: acertar
  la clave exacta no ahorra nada y sí puede fallar.
- **Descartado tocar `useVidaHistoryWindow`**, como mandaba la sección 2.

**Lo que descubrí y no estaba en el plan:**

1. **El validador del API admite más de lo que pedía el plan, y el dato viaja
   distinto de lo que dice `ENVIRONMENT.md`.** En
   `xavi-platform-node/src/validators/schemas/activity.schemas.ts:154-159`,
   `activityFollowUpsArgsSchema` acepta `limit: z.number().int().positive().max(500).nullish()`
   — el SDL solo dice `Int`. **El `limit: 20` del plan entra de sobra**; el
   techo real es 500 y el **defecto del servicio es 100** si no se manda
   (`activity-follow-up.service.ts:539`). Dos cosas más que el SDL no dice y sí
   importan: `activityId` se valida con `/^\d+$/` —**un entero en texto, no un
   UUID**, al contrario de lo que afirma `ENVIRONMENT.md` en «Cómo conseguir
   datos reales»— y el resolver llama a `getActivityById`, así que una
   actividad ajena o inexistente **da error en vez de lista vacía**. El filtro
   de solo-cerradas es literal: `CLOSED_FOLLOW_UP_FILTER = 'af.duration_minutes
   IS NOT NULL'` (`:47`). **No se modificó nada de ese repositorio.**
2. **`invalidateFollowUpQueries` NO arrastraba por prefijo.** Invalida clave a
   clave (`day`, `range`, `open`), no `followUps.all()`: colgar `byActivity` de
   `followUps.all()` **no bastaba**. Hay que nombrarla, y se nombra. Sin esto,
   una nota recién escrita dejaba las píldoras viejas. Se actualizó
   `expectedInvalidations` en `useActivityFollowUps.test.tsx`, que es el test
   que fija esa lista.
3. **`contracts.test.ts` sí tiene una lista que editar.** La sección 2 decía
   que `documentsOf(module)` la recoge sola; recoge los documentos para
   **validarlos**, pero el primer caso (`contracts.test.ts:70`) compara el
   inventario de nombres contra una lista literal. Se añadió el nombre nuevo
   ahí; sin eso el test falla (y falló).
4. **Una hoja cerrada no desaparece del DOM en jsdom.** `SteppedModal` la saca
   con la animación de salida de `AnimatePresence`, que se queda en
   `opacity: 0` sin desmontar —con reloj congelado **y** con reloj de verdad—.
   Los casos nuevos de `VidaModuleLayout.test.tsx` miden qué se guardó y que la
   sesión sigue, no la desaparición del diálogo; que «Guardar» cierra se sigue
   midiendo en `VidaNoteSheet.test.tsx` con `onClose`.
5. **Los espías de `useVidaSessionActions` en `VidaModuleLayout.test.tsx` eran
   inservibles**: se creaban con `vi.fn()` **dentro** de la fábrica del mock, o
   sea uno nuevo por render, así que «esto no se llamó» no se podía afirmar. Se
   sacaron fuera (es lo que el criterio 543 necesita). Ningún caso existente
   cambió de contenido.

**Verificación** (todo con el 5173 del usuario vivo; no arranqué ni paré nada):

- `pnpm typecheck` → limpio, sin salida.
- `pnpm lint` → **14 problemas (14 errores, 0 warnings)**. Línea base clavada.
- `pnpm test` → **2 fallos de 1866** (`SearchSelect` ×2, preexistentes). La
  base eran 2 de 1839: **+27 casos nuevos, ningún fallo nuevo**. El flaky de
  `IconPicker` no salió esta vez.
- `pnpm build` → exit 0. Chunk inicial **1.126,44 kB** (base 1.124,93: **+1,51
  kB**, el código nuevo), `app-icons` **620,20 kB sin mover**, `IconPicker`
  4,64 kB.
- `graphify update .` → 4173 nodos, 4954 aristas.
- **Navegador, arnés temporal a 375 px** (`src/dev-harness/`, **ya borrado**):
  la barra sin `onEditNote` mide **69 px** —lo de siempre—; con la línea, **117
  px**; la línea vacía es la caja punteada con «¿Qué estás haciendo?» y la
  llena la caja mint con el texto, igual que el punto 2 del render 19; con una
  nota de 190 caracteres el texto se recorta (`scrollWidth` 1115 vs
  `clientWidth` 297) y **la página no gana scroll horizontal**
  (`document.scrollWidth === 375`).

**Criterios que cierra, uno a uno:**

- **542** — `VidaModuleLayout.test.tsx`: «sin nota, la barra pregunta “¿Qué
  estás haciendo?”» y «con nota, la barra enseña lo que se escribió».
  `VidaHoyPage.test.tsx`: «el bloque del plan en marcha pregunta “¿Qué estás
  haciendo?”», «con nota escrita, el bloque en marcha la enseña y se toca» y
  «la sesión en marcha **fuera del plan** pregunta lo mismo» — las tres filas
  unificadas (H1 cerrado).
- **543** — `VidaModuleLayout.test.tsx`, «abrir el editor no pausa, no termina
  y no cierra la barra»: tras tocar la línea, la hoja está abierta y
  `finishNow`, `finishWith`, `discard`, `start` y `saveNote` **no se llamaron**;
  «Terminar» sigue en pantalla y, con la hoja abierta, **el cronómetro avanza**
  de `00:24:00` a `00:24:05` al correr cinco segundos. En el código lo sostiene
  que la vía de escritura sea `activityFollowUpEdit({ id, notes })`, que el
  backend aplica **solo a las columnas presentes**.
- **544** — mismo archivo: guardar llama `saveNote(sesión, 'Bug del carrito')`
  **una vez**, con la sesión abierta entera, y ni `finishNow` ni `finishWith`
  se llaman. El refresco sin recargar lo da
  `useUpdateActivityFollowUpMutation` invalidando `followUps.open()`, que es de
  donde la barra lee — **la ida y vuelta real va en «pendiente de prueba a
  mano»**.
- **545** — «se reescribe las veces que haga falta»: dos ciclos completos, dos
  `saveNote` (`['Daily', 'Soporte']`), y **cada apertura arranca de lo
  guardado**, no de lo anterior.
- **546** — `useVidaActivityNoteHistory.test.tsx`: abierto pide
  `getActivityFollowUpsByActivity('7', 20)` y devuelve tres píldoras sin
  duplicados; `VidaModuleLayout.test.tsx`: con el editor cerrado la consulta
  **nunca se enciende**, al abrirlo se pide con `activityId: 'a-casa'` y
  `excludeId: 'f1'`, y tocar una píldora escribe el texto en el campo;
  `VidaNoteSheet.test.tsx`: la píldora es **texto de partida** —se sigue
  editando antes de guardar (`'Daily + planning del sprint y retro'`)—.
- **547** — `VidaNoteSheet.test.tsx` («con la consulta en vuelo no hay ni
  esqueleto ni hueco»), `VidaModuleLayout.test.tsx` («sin notas previas no hay
  sección de píldoras ni explicación»: nada que diga «todavía», «ninguna»,
  «primera vez» ni «error») y `vida-notes.utils.test.ts` (sin nada, lista
  vacía).
- **532, su mitad** — el título de la hoja sale de `VIDA_NOTE_QUESTION_RUNNING`
  con la sesión abierta, y `vida-notes.utils.test.ts` afirma que **ninguna** de
  las tres frases contiene «nota» ni «descripción».
- **552** — las cuatro medidas de arriba, ninguna peor que la línea base.

**Pendiente de prueba a mano, detrás del login** (`ENVIRONMENT.md`: sin
credenciales no hay recorrido real):

1. Con algo en marcha, que la línea de la barra **se vea desde Plantilla,
   Revisión y Actividades**, no solo desde Hoy, y que el hueco de abajo
   (`7.5rem`) no tape el último bloque ni los botones de una hoja abierta.
2. Guardar de verdad y ver la barra **y** la fila de la agenda cambiar sin
   recargar (invalidación de `followUps.open()` y `followUps.day`).
3. Que **las píldoras traigan notas reales** de otras sesiones de esa actividad
   y que al guardar una nota nueva la siguiente apertura ya la ofrezca (la
   invalidación por prefijo).
4. Que el teclado del móvil no tape el editor al tocar la línea de una barra
   que vive pegada abajo.
5. Que una actividad estrenada (sin sesiones cerradas) **no** enseñe ninguna
   sección de píldoras ni ningún error.

**Riesgos:**

- **El alto de la barra y el hueco reservado** (ver el resumen). Es lo único
  que no puede medir ningún test de este repositorio.
- **La consulta nueva se dispara por cada actividad distinta que se edite.**
  Con `staleTime` de 5 min y solo con el editor abierto, pero es +1 consulta
  que antes no existía.
- **El test 537 de la tajada 1 sigue en verde pero su título envejeció**: dice
  «la sesión en marcha no ofrece la línea: eso es la tajada 2», y lo que afirma
  —que ahí no aparece «añadir qué hiciste»— **sigue siendo exactamente el
  criterio 537** y sigue pasando. No lo toqué porque no se editan tests
  ajenos; si el revisor prefiere, el título es lo único que sobra.
- **`VidaAgendaSession` con la etiqueta «fuera del plan»** sigue con los ~130 px
  útiles que anotó H2: la línea en marcha hereda ese ancho.

**Estado del árbol:** sin commitear.

## 4. Review — feature-reviewer

### Tajada 1 — **aceptada** (2026-09-22)

**Veredicto: aceptada.** Los once criterios de la tajada se cumplen, las cuatro
líneas base se reproducen en este árbol y no encontré ninguna regresión en lo
que rodea a las dos filas tocadas. Lo que queda a mano (la ida y vuelta real
contra la API) es lo que el constructor ya dejó escrito, no algo que yo perdone.

**Las cuatro líneas base, corridas por mí sobre el árbol sin commitear:**

| Qué | Resultado | Línea base |
|---|---|---|
| `pnpm typecheck` | exit 0, sin salida | limpio ✅ |
| `pnpm lint` | **14 errores / 0 warnings**, los mismos archivos de cromo compartido | 14/0 ✅ |
| `pnpm test` | **2 fallos de 1839**, los dos de `SearchSelect`. `IconPicker` no salió flaky | 2 de 1839 ✅ |
| `pnpm build` | exit 0 · inicial **1.124,93 kB** (+3,6 kB declarados) · `app-icons` **620,20 kB sin mover** · `IconPicker` 4,64 kB | ✅ |

El build hay que correrlo **después** de borrar cualquier arnés: el mío tumbó
un primer `pnpm build` con un `TS2322` **de mi propio archivo**; repetido con el
árbol limpio, exit 0.

**Criterios, uno a uno:**

- **531 — cumplido.** `git diff` + búsqueda: nada de lo nuevo nombra
  `Activity.description`. La nota entra y sale por el `id` de la **sesión**
  (`saveNote` → `activityFollowUpEdit({ id, notes })`), y la fila la lee de
  `entry.span.session.notes` / `blockNoteSession(...)`.
- **532 (su mitad) — cumplido.** Cabecera de la hoja: «¿Qué hiciste?»;
  `aria-label` del textarea, la misma pregunta; en la fila, «añadir qué
  hiciste». El test que prohíbe «nota»/«descripci» en la hoja es real y pasa.
- **533 — cumplido.** `maxLength` 140 y contador «N / 140»; el recorte,
  **medido por mí en navegador** (abajo).
- **535 — cumplido.** Dos tests y comprobación visual: la nota se pinta entre
  `styles.name` y `styles.meta`, en las dos filas.
- **536 — cumplido.** «＋ añadir qué hiciste» en gris (`--color-text-secondary`,
  0,75 rem), misma línea que el resto de la fila, solo con `canLogPast`.
- **537 — cumplido.** Test de día futuro (con la fila del plan presente, así que
  no es falso verde) y test de sesión en marcha. Ver el hallazgo H1: la sesión
  en marcha **sí** enseña la nota ya escrita en modo lectura; el «＋» no.
- **538 — cumplido en lo comprobable aquí.** Tocar la nota y tocar el «＋»
  llaman `openNoteSheet` una vez con la sesión correcta. Que no se toquen hora
  ni duración lo **verifiqué yo en el repositorio del API**, no de palabra:
  `activityFollowUpEditInputSchema` (`src/validators/schemas/activity.schemas.ts:239-259`)
  acepta `{id, notes}` solo —su `refine` se satisface con `notes`— y **no tiene
  defaults**, y `updateFollowUp` (`src/services/activity-follow-up.service.ts:347-389`)
  construye el `UPDATE` únicamente con las columnas presentes. Ni `start_time`,
  ni `duration_minutes`, ni el cierre de una sesión abierta. **La garantía de la
  que cuelga la tajada 2 está verificada de punta a punta.**
- **539, 540 — cumplidos.** Tests de la hoja: «Volver» no llama a `onSave`;
  guardar en blanco llama `onSave(null)` y no pinta error. En el backend,
  `notes: null` explícito sí borra (`if (input.notes !== undefined)`).
- **541 — cumplido, medido por mí.** Arnés propio (`review-note.html` +
  `src/review-note.tsx`, **ya borrados**), Vite del 5173, viewport 375×812, nota
  de 420 caracteres: `documentElement.scrollWidth = clientWidth = 375` (sin
  barra horizontal); la línea mide **16,2 px de alto, una sola línea**, con
  `overflow: hidden · text-overflow: ellipsis · white-space: nowrap` computados;
  el `<span>` del texto: `scrollWidth 2332` contra `clientWidth 179` en la fila
  del plan y **130** en la fila de fuera del plan; el `title` lleva los 420
  caracteres. La hoja abierta con esa nota: `textarea.value.length 420`,
  `maxLength 420`, contador **«420 / 140»** y la línea «Cabe entera…» visible.
- **552 — cumplido.** La tabla de arriba.

### Lo que miré para ver si rompí algo al lado

- **`graphify explain "VidaAgendaBlock"` y `graphify explain "useVidaSessionUi"`**
  (el grafo es de antes del cambio, que para «¿quién dependía de esto?» es justo
  lo que hace falta): `useVidaSessionUi` tenía **un solo** consumidor,
  `VidaHoyPage`. Confirmado abriendo los archivos y con `<VidaAgendaBlock` /
  `<VidaAgendaSession` en todo `src`: **el único sitio que las monta es
  `VidaHoyPage`**. `VidaReviewRow`, `VidaTemplateItemCard` y `VidaBlockHint`
  solo las nombran en comentarios. El alcance del daño posible es, de verdad,
  esas dos filas.
- **El alto de las filas (lo que el constructor marcó como «lo que más
  probablemente rompí»): comprobado y acotado.** En el arnés, el mismo bloque
  con sesión terminada mide **58,4 px sin las props nuevas y 69,4 px con el «＋»**
  → **+11 px por fila**, no los ~16 estimados; con nota escrita, el mismo 69,4.
  Y lo importante: **las filas de la agenda están en flujo normal**, no
  posicionadas por hora —un bloque de 15 minutos y uno de 45 ya medían los
  mismos 67,3 px antes de esto—, y la marca «Ahora» es **un `<li>` más** de la
  misma lista con `scrollIntoView({ block: 'center' })` sobre el nodo vivo
  (`VidaHoyPage.tsx:730-740`), calculado después del layout y una vez por día.
  Un alto mayor mueve la marca y el scroll **a la vez**: no hay ninguna
  constante de alto que se quede vieja. No es una regresión; es una agenda más
  larga (≈ +11 px por sesión terminada del día que se mira).
- **Los `vi.mock` que caducan en silencio: buscados.** No existe ningún
  `vi.mock` de `hooks/useVidaSessionUi` ni de `hooks/useVidaSessionNote` en el
  repositorio; el único consumidor del contexto en tests
  (`VidaHoyPage.test.tsx:3158`) construye el valor a mano y **lista las dos
  claves** (lo obliga el tipo). Los tres `vi.mock` de
  `hooks/useActivityFollowUps` (`VidaHoyPage`, `VidaLogSessionSheet`,
  `VidaRevisionPage`) los revisé: los dos primeros ya exponen
  `useUpdateActivityFollowUpMutation`; el de `VidaRevisionPage` no lo expone,
  pero **Revisión no monta `VidaModuleLayout`** y ya era así antes de esta
  tajada. Nada verde por casualidad.
- **Nada del API.** `git status` en `~/Developer/xavi-platform-node`: **limpio**.
  Y en este repo el cambio no toca `graphql/`, `api/`, `types/` ni
  `shared/api/query-keys.ts`.
- **Nada duplicado (sección 2).** No hay documento GraphQL nuevo, ni mutación
  nueva, ni una tercera caja de nota: `VidaFinishSessionModal` y
  `VidaLogSessionSheet` están intactos, y el editor se monta **una sola vez** en
  `VidaModuleLayout`. `ActivityDayPlanItem` no ganó campos.

### Estados

- **Sin datos** ✅ — sin nota y sin poder escribirla, `VidaNoteLine` devuelve
  `null`: la fila queda exactamente como antes (visto en el arnés).
- **Cargando** ✅ — guardar deshabilita los dos botones y el campo, y el primario
  se lee «Guardando…».
- **Error** ✅ — `Alert` dentro de la hoja, la hoja no cierra y **no se pierde lo
  escrito** (test). Y **silencioso en el éxito**: `useUpdateActivityFollowUpMutation`
  solo saca toast `if (!options.silent)`, y el hook nuevo pasa `silent: true`;
  no hay `onError` global en `app/providers/query-client.ts` que lo desmienta.
  Las dos mitades, comprobadas.
- **Día futuro / sesión en marcha** ✅ — con test cada uno.
- **Texto largo** ✅ — medido arriba.
- **375 px** ✅ — sin barra horizontal.
- **Sin permisos** — no aplica: el módulo entero vive detrás del login y la hoja
  solo se abre desde una fila que ya es del usuario.
- **Catálogo vacío** — no aplica a esta tajada: nada de lo nuevo lee el catálogo
  de actividades.
- **Sin reproche** ✅ — buscadas «falta», «vacío», «sin nota», «olvidaste» y
  parientes en los tres archivos nuevos y en los dos diffs de fila: no aparecen.
  Lo único que se lee sin nota es «＋ añadir qué hiciste», en gris.

### Hallazgos (anotados, no motivo de devolución)

- **H1 — la sesión en marcha *fuera del plan* sí enseña la nota, en lectura.**
  `VidaHoyPage.tsx:866` pasa `note={entry.span.session.notes}` **sin condición**,
  mientras que el bloque del plan la oculta mientras corre
  (`blockNoteSession()` devuelve `null` con `isRunning`). No rompe el 537 —que
  habla del «＋», y ese sí está bien condicionado— y va en la dirección del 542,
  pero **las dos filas no se comportan igual** y el comentario del propio código
  dice «nunca sobre una sesión en marcha». Hoy casi no se ve (una sesión abierta
  rara vez lleva nota antes de la tajada 3), y la tajada 2 va a tocar justo eso:
  que lo unifique ahí, a propósito y no por descuido.
- **H2 — la nota en la fila de «fuera del plan» se lee muy poco.** Medí **130 px**
  útiles a 375 px (el constructor midió 114 con otro título): unas 18-20 letras
  antes de los puntos suspensivos. Lo acepto porque **es exactamente el mismo
  ancho que ya tiene el nombre de la actividad** en esa fila —lo impone el
  `flex: 1 1 8rem` de `.body` con la etiqueta al lado, que FEAT-004 ya revisó—,
  el texto entero está en el `title` y la hoja se abre de un toque. Si alguna
  vez se baja la etiqueta a su propia línea, esa nota gana el doble de ancho.
- **H3 — la frase «añadir qué hiciste» vive escrita en dos archivos.** Declarado
  por el constructor, con motivo (la constante natural es de la tajada 2). Que
  la tajada 2 la suba a `vida-notes.utils.ts` y borre las dos copias.
- **H4 — las píldoras inertes: comprobadas.** `VidaNoteSheet` solo se monta en
  `VidaModuleLayout` y **nadie le pasa `suggestions`**; con `pills.length === 0`
  no pinta la `<section>` —ni esqueleto ni hueco— y el componente **no monta
  ninguna consulta** (no hay `useQuery` en él ni en `useVidaSessionNote`). Cero
  consultas nuevas al abrir Hoy, confirmado leyendo los tres archivos.
- **H5 — el tope efectivo no congela la nota larga, pero tampoco deja crecer.**
  Con 420 caracteres y `maxLength=420` el navegador bloquea **cualquier**
  inserción hasta que se borre algo (sustituir una selección sí funciona). Es
  mejor que `maxLength=140` —que bloquearía hasta bajar de 140— y la explicación
  se lee en pantalla, pero no es «editar con normalidad». Sin cambio pedido.

### Pendiente de prueba a mano, detrás del login (no se aprueba por simpatía)

Lo dice `ENVIRONMENT.md`: sin credenciales no hay recorrido real. Queda, tal
como lo dejó el constructor:

1. Guardar una nota de verdad y ver la fila refrescarse **sin recargar**
   (`invalidateFollowUpQueries` invalida `followUps.day(date)`: el camino está,
   la ida y vuelta no se puede ejecutar aquí).
2. Que la hora y la duración de la fila **no cambian** tras guardar (la cadena
   web → validador → SQL está verificada arriba; falta verlo).
3. Que **no sale toast** al guardar y que el error del servidor **sí** se lee
   dentro de la hoja.
4. El salto a «Ahora» al abrir un día lleno de sesiones terminadas (medido el
   alto y razonado el mecanismo; falta el día real).

**Sin commitear y sin push.** El arnés que usé está borrado (`git status` solo
muestra lo del constructor). El Vite del 5173 lo encontré vivo y lo dejo vivo:
no arranqué ni paré nada.


### Tajada 2 — **aceptada** (2026-09-22)

**Veredicto: aceptada.** Los ocho criterios de la tajada se cumplen, las cuatro
líneas base se reproducen en este árbol y **medí en navegador** lo que el
constructor marcó como «lo que más probablemente he roto»: el alto de la barra
y el hueco reservado. No encontré ninguna regresión. Lo que queda a mano es la
ida y vuelta real contra la API, que ningún agente puede hacer aquí.

**Las cuatro líneas base, corridas por mí sobre el árbol sin commitear:**

| Qué | Resultado | Línea base |
|---|---|---|
| `pnpm typecheck` | exit 0, sin salida | limpio ✅ |
| `pnpm lint` | **14 problemas (14 errores, 0 warnings)** | 14/0 ✅ |
| `pnpm test` | **2 fallos de 1866**, los dos de `SearchSelect`; `IconPicker` no salió flaky | 2 de 1839 + 27 casos nuevos ✅ |
| `pnpm build` | exit 0 · inicial **1.126,44 kB** · `app-icons` **620,20 kB sin mover** · `IconPicker` 4,64 kB | ✅ |

**Criterios, uno a uno:**

- **542 — cumplido.** Barra: `VidaModuleLayout.test.tsx` («¿Qué estás
  haciendo?» sin nota, el texto con nota). Filas: los tres casos nuevos de
  `VidaHoyPage.test.tsx`. Comprobado en navegador: la línea está **dentro** de
  la tarjeta de vidrio, punteada vacía y mint con texto.
- **543 — cumplido, y el caso mide lo que dice medir.** Lo verifiqué a mano
  antes de creérmelo: en `VidaModuleLayout.test.tsx` **no** están mockeados ni
  `useVidaElapsed`, ni `VidaSessionBar`, ni `VidaNoteSheet` —solo los hooks de
  datos—, así que el `00:24:00 → 00:24:05` con la hoja abierta es el
  cronómetro de verdad re-renderizando con su intervalo vivo: si abrir el
  editor desmontara la barra o parara el reloj, el `getByText('00:24:05')`
  fallaría. Y los espías `finishNow`/`finishWith`/`discard`/`start` ahora viven
  **fuera** de la fábrica del `vi.mock` (los verifiqué en el archivo), que es
  lo que hace afirmable un «no se llamó». En el código lo sostiene que
  `openNote()` solo toca `noting`/`noteOpen`/`noteSession` y no roza
  `finishing`, y que la escritura sea `activityFollowUpEdit({ id, notes })`.
- **544 — cumplido en lo comprobable aquí.** `saveNote` se llama una vez con la
  sesión abierta entera y el texto; ninguna acción de cierre. El refresco real
  sin recargar queda en manual (invalidación de `followUps.open()`).
- **545 — cumplido.** Dos ciclos, dos guardados, y cada apertura arranca de lo
  guardado (la `key` por apertura).
- **546 — cumplido.** Tres capas con caso propio: el util puro (orden del API,
  dedupe, `excludeId`, tope), el hook (`getActivityFollowUpsByActivity('7', 20)`
  y tres píldoras) y la hoja (la píldora es **texto de partida**: se sigue
  editando antes de guardar).
- **547 — cumplido.** Sin píldoras no se pinta la `<section>`; con la consulta
  en vuelo tampoco (`isPending` es **falso cuando está apagada**, comprobado en
  el hook y en su test); ni «todavía», ni «ninguna», ni error.
- **532 (su mitad) — cumplido.** Las cuatro frases viven en
  `vida-notes.utils.ts` y su test prohíbe «nota» y «descripci». La barra y las
  dos filas preguntan lo mismo mientras corre.
- **552 — cumplido.** La tabla de arriba.

### Lo que miré para ver si rompí algo al lado

- **El alto de la barra y el hueco reservado — medido, y no tapa nada.** Arnés
  temporal propio (`review-bar.html` + `src/review-bar.tsx`, **ya borrados**)
  contra el Vite del 5173, viewport 375×812, con el `padding-bottom` real de
  `VidaModuleLayout.module.scss` y doce bloques de relleno:
  - la tarjeta sin `onEditNote` mide **57,1 px** y con la línea **104,6 px**;
    sumando el `padding` de 12 px del contenedor fijo, la **huella** de la
    barra pasa de **69,1 px a 116,6 px** — exactamente lo que declaró el
    constructor;
  - el hueco reservado es **120 px** (`7.5rem`), así que con la página scrolleada
    hasta el final el último bloque termina **3,4 px por encima** del borde
    superior de la barra. Antes el margen era el mismo (69,1 contra 72): la
    relación no empeora, **no hay solape**;
  - con una nota de 180 caracteres la tarjeta **sigue midiendo 104,6 px** (una
    sola línea, `overflow hidden · text-overflow ellipsis · white-space nowrap`,
    `scrollWidth 1078` contra `clientWidth 297`) y
    `document.documentElement.scrollWidth === 375`: **ninguna barra horizontal**.
  - **Lo que no pude hacer, y lo digo:** ese recorrido en Plantilla, Revisión,
    Actividades y Archivadas **con una sesión real en marcha** está detrás del
    login. Lo que sí es verificable sin credenciales: el hueco lo pone el
    **mismo** `.root[data-session-bar='on']` para las cuatro pantallas (una sola
    regla, un solo layout), y la barra se pinta desde `VidaModuleLayout`, que es
    el elemento de ruta común. Queda en manual el pie propio de cada página.
- **Quién más usa lo que se tocó.** `graphify explain "VidaSessionBar"`,
  `"VidaModuleLayout"` e `"invalidateFollowUpQueries"`, confirmado abriendo los
  archivos: `VidaSessionBar` tiene **un solo** consumidor (`VidaModuleLayout`),
  así que `.bar` pasando de fila a columna no puede resentir a nadie más;
  `invalidateFollowUpQueries` lo llaman `useActivityFollowUps` y
  `useVidaWeekFollowUps`, y la clave nueva es un prefijo que **no colisiona**
  con `day`, `range` ni `open`. El único test que fija esa lista
  (`useActivityFollowUps.test.tsx`, `expectedInvalidations`) está actualizado y
  pasa.
- **Las píldoras y su caché: el punto que el constructor descubrió, verificado.**
  `invalidateFollowUpQueries` invalida clave a clave, y la nueva está **nombrada
  a mano** (`vidaKeys.followUps.byActivityAll()`), colgada de `followUps.all()`
  y por delante de `activityId`/`limit`: invalida todas las variantes. La ida y
  vuelta real («escribo una nota y la siguiente apertura ya la ofrece») queda en
  manual, pero el eslabón que faltaba está puesto y con test.
- **El coste de abrir el editor.** La consulta solo se monta en
  `VidaModuleLayout` con `enabled: noteOpen && noting !== null` y
  `Boolean(activityId)`, y `useVidaQueryGuard` devuelve un **booleano** (lo
  comprobé: no es un objeto siempre-verdadero). Abrir Hoy con algo en marcha
  cuesta **cero consultas nuevas**, y el test del layout lo afirma
  (`noteHistoryCalls.every(c => c.enabled === false)` antes de tocar la línea).
  No se ha reinventado el coste de `useVidaHistoryWindow` por otra puerta: ese
  hook no se toca y nadie lo monta desde aquí.
- **Los `vi.mock` que caducan en silencio: buscados uno a uno.** Del módulo de
  API hay seis mocks; los dos con fábrica literal (`useVidaWeekFollowUps`,
  `useVidaHistoryWindow`) no listan `getActivityFollowUpsByActivity` y **no
  deben**: ninguno de esos hooks lo llama. Los mocks de `useActivityFollowUps`
  (`VidaHoyPage`, `VidaLogSessionSheet`, `VidaRevisionPage`) no se ven afectados
  por la clave nueva. Los dos hooks nuevos solo se mockean en
  `VidaModuleLayout.test.tsx`, y ahí el del historial **guarda lo que recibe**
  en vez de ignorarlo. Nada verde por casualidad.
- **`contracts.test.ts`: confirmado que el constructor tenía razón y el plan
  no.** La lista literal de nombres está en el primer caso (línea ~86 en este
  árbol) y `ACTIVITY_FOLLOW_UPS_BY_ACTIVITY_QUERY` entró en orden alfabético;
  el documento valida contra el SDL vendorizado y la suite pasa.
- **Nada duplicado (sección 2).** Un solo documento nuevo, una sola función de
  API, un solo hook de píldoras, un solo montaje del editor. `VidaFinishSessionModal`
  y `VidaLogSessionSheet` intactos; `useVidaHistoryWindow` intacto;
  `ActivityDayPlanItem` sin campos nuevos; `startSessionInput` y `finishNow` sin
  tocar (la tajada 3 es la que los toca).
- **Nada del API.** El repositorio hermano no se tocó: el diff de esta tajada
  vive entero en `xavi-habits-webapp`.

### Estados

- **Sin sesión en marcha** ✅ — sin barra no hay línea, y el hueco reservado
  solo aparece con `data-session-bar='on'`.
- **Actividad estrenada (547)** ✅ — lista vacía, sin sección, sin esqueleto,
  sin reproche. Con caso en tres capas.
- **Error de la consulta de píldoras** ✅ **por construcción, sin caso propio**
  (ver hallazgo H6): sin `throwOnError` ni `onError` global en
  `app/providers/query-client.ts`, una consulta en error deja
  `suggestions: []` e `isPending: false` → la hoja se abre igual y sin píldoras.
- **Error de la mutación** ✅ — heredado de la tajada 1: `Alert` dentro de la
  hoja, no se pierde lo escrito, y guardar bien **no saca toast** (`silent: true`).
- **Texto largo** ✅ — 180 caracteres en la barra: una línea, elipsis, mismo alto.
- **375 px** ✅ — sin barra horizontal, sin solape con el último bloque.
- **Cargando** ✅ — la hoja deshabilita botones y campo al guardar; las píldoras
  en vuelo no pintan nada a propósito.
- **Sin permisos** — no aplica: el módulo entero vive detrás del login.
- **El teclado del móvil sobre la barra pegada abajo** — **no verificable aquí**
  (ni emulador ni sesión): queda en manual, como lo dejó el constructor.

### Hallazgos (anotados, no motivo de devolución)

- **H6 — la consulta de píldoras no tiene caso de error.** El comportamiento es
  el correcto y lo razoné arriba, pero `useVidaActivityNoteHistory.test.tsx`
  cubre apagada, sin actividad, con datos y sin notas — no con la consulta en
  error. Es un caso de tres líneas y fijaría que un fallo de red **no** pinta
  sección ni rompe el editor. Para quien pase por ahí.
- **H7 — el título del test del criterio 537 envejeció.** Dice «la sesión en
  marcha no ofrece la línea: eso es la tajada 2» cuando ahora sí la ofrece (lo
  que no ofrece es el «＋ añadir qué hiciste», que es lo que el caso afirma y
  sigue siendo el 537). El constructor hizo bien en no tocar un test ajeno; el
  título se puede corregir cuando alguien vuelva a ese archivo.
- **H2 sigue vivo** — la línea en la fila de «fuera del plan» tiene ~130 px
  útiles a 375 px, y ahora también en marcha. Sin cambio pedido: el texto entero
  está en el `title` y la hoja se abre de un toque.
- **H8 — el margen entre el hueco reservado y la barra es de 3,4 px**, el mismo
  que antes en proporción. Es suficiente, pero es el mismo margen estrecho de
  siempre: si alguna vez la línea pasa a dos renglones (una fuente más grande
  del sistema, por ejemplo), el `7.5rem` se queda corto. No lo arreglo porque
  hoy no falla y porque la línea es `nowrap` por diseño.

### Pendiente de prueba a mano, detrás del login (no se aprueba por simpatía)

Tal como lo dejó el constructor, y lo confirmo como pendiente:

1. La barra con su línea vista desde **Plantilla, Revisión, Actividades y
   Archivadas**, y el pie de cada una sin quedar tapado.
2. Guardar de verdad y ver **la barra y la fila** cambiar sin recargar.
3. Píldoras con notas reales, y que una nota recién escrita aparezca en la
   siguiente apertura (la invalidación nombrada).
4. El teclado del móvil al tocar la línea de la barra pegada abajo.
5. Una actividad estrenada, sin ninguna sección de píldoras.

**Sin commitear y sin push.** El arnés que usé está borrado (`git status` solo
muestra lo del constructor). El Vite del 5173 lo encontré vivo y lo dejo vivo:
no arranqué ni paré nada. **`ENVIRONMENT.md` no lo toqué.**
