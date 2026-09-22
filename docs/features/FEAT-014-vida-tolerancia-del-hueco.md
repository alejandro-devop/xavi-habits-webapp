---
id: FEAT-014
title: La tolerancia del hueco — un rato de 13 minutos también se puede contar
status: building
architect: no    # cuelga de MIN_GAP_MINUTES y de la rama del hueco ya construida; razón en la sección 1
area: vida
requested: 2026-09-22
updated: 2026-09-22
---

# FEAT-014 — La tolerancia del hueco

## 1. La petición — feature-analyst

**Resumen para quien venga detrás:** hoy un hueco de menos de 15 minutos se pinta
fino y sin nada que pulsar, así que los 13 minutos que el usuario tuvo libres no
se pueden contar. Se separa el umbral de **planear** (sigue en 15: la píldora más
pequeña) del de **registrar** (baja a **5**, que es lo que pidió), y la tajada 1
hace exactamente eso en el hueco pasado de Hoy: el de 13 minutos gana su
«Registrar lo que hice» y la hoja abre con una duración que cabe.

**Qué problema resuelve:** un rato que la app no deja contar es un rato que no se
registra, y el módulo entero —revisión, adherencia, patrones— vive de que haya
datos (`docs/vida/PLAN.md`, «La premisa que manda sobre todo lo demás»). El
número 15 se eligió porque **la píldora de duración más pequeña es de 15
minutos**: en un hueco de 13 no cabe nada que *planear*, y eso es cierto. Pero
está haciendo un segundo trabajo que **no** es cierto: decidir qué es demasiado
pequeño para **contarlo**. Lo que ya hiciste duró lo que duró; no tiene suelo.

**Para quién es:** para el usuario al final del día o a ratos, mirando Hoy, con
un espacio pequeño entre dos bloques que sí ocupó en algo.

**Palabras del usuario:** «en el pantallazo te puse un espacio que me queda de 13
minutos, la app no me habilita registrar algo ahí. Creo que para evitar espacios
debería haber una tolerancia de unos 5 minutos: si es inferior a eso la
diferencia, entonces no habilitamos registrar, pero si es superior a 5 minutos se
habilita registrar».

**Lo que ya está verificado en el código** (para que nadie lo vuelva a buscar):

- `MIN_GAP_MINUTES = 15` — `src/features/vida/utils/vida-time.utils.ts:203`.
  Marca `isSliver` en cuatro sitios: `vida-agenda.utils.ts:221` y `:345,349`,
  `vida-execution.utils.ts:694`, `vida-template.utils.ts:319`.
- La puerta que le cierra el paso al usuario es una sola línea:
  `VidaAgendaGap.tsx:106` — `if (gap.isSliver || (isPast && !onLogPast))` sale
  antes de pintar ningún control. FEAT-011 lo dejó escrito en su **D3**: «no se
  ofrece ahí, y no se prohíbe… **es una línea cambiarlo**».
- El gemelo: `MIN_PLACEMENT_MINUTES = 15` (`vida-gap-form.utils.ts:34`, usado en
  `:176`), documentado como «lo más corto que se deja poner: la píldora más
  pequeña». Dos constantes, mismo valor, mismo trabajo.
- **Lo que ya existe y no hay que inventar:** `VidaDurationPills` acepta
  `maxMinutes` (apaga las que no caben y dice «Aquí caben N»), `fillMinutes`
  («Todo el hueco», solo cuando ese número no es ya una píldora fija) y
  `freeInput="hoursAndMinutes"` (el campo libre de FEAT-008). `VidaLogSessionSheet`
  ya los pasa los tres (`VidaLogSessionSheet.tsx:385-399`). En un hueco de 13
  minutos la hoja **ya sabe** enseñar las cuatro fijas apagadas, «Todo el hueco ·
  13 min» y el campo libre: no hace falta recortar píldoras ni crear ninguna.

**Lo que se decide aquí, y por qué así:**

1. **Dos umbrales con nombres honestos, no uno con dos usos.** Un solo número
   obligaría a escribir un comentario explicando que a veces significa una cosa y
   a veces otra, y es justo lo que produjo este defecto. Quedan:
   `MIN_PLANNING_MINUTES = 15` («lo más corto que se puede **poner**: la píldora
   más pequeña») y `MIN_LOG_MINUTES = 5` («lo más corto que se ofrece **contar**;
   lo ya vivido no tiene suelo»).
2. **La deuda del gemelo cabe, y se paga en su propia tajada.** `MIN_GAP_MINUTES`
   y `MIN_PLACEMENT_MINUTES` son la misma idea: se funden en
   `MIN_PLANNING_MINUTES`. Es mecánico y sin efecto visible, así que va **aparte
   de la tajada 1** para no arriesgar el caso del usuario.
3. **En un hueco corto no se recortan las píldoras.** Mandan «Todo el hueco» y
   «libre», que ya existen. Recortar 15·30·45 a 5·10 sería inventar controles de
   planear en un sitio donde no se planea.
4. **El hueco fino no desaparece.** Por debajo de 5 sigue igual que hoy: su línea
   con sus minutos, sin nada que pulsar. Tiene su razón escrita (FEAT-003
   criterio 14, FEAT-009 criterio 143): si desapareciera, la barra del
   presupuesto diría que hay libre donde la lista no enseña nada.
5. **Se aplica a lo de registrar, donde esa salida exista.** Hoy eso es el hueco
   **pasado** de Hoy (FEAT-011, criterio 220), y es lo único que construye esta
   feature. **La plantilla no cambia**: allí solo se planea, no hay nada real que
   contar, y su umbral sigue siendo el de planear.

**Fuera de alcance:** (lo que alguien podría dar por incluido y NO está)

- **Bajar el umbral de planear.** Sigue en 15 y por la razón de siempre: en un
  hueco de 13 minutos no cabe ninguna píldora. En un hueco corto **no** aparecen
  fichas de plantilla, ni «+ otra cosa», ni «Poner algo».
- **Píldoras nuevas de 5 o 10 minutos.** No. Las píldoras son de planear.
- **La plantilla (FEAT-009).** Su hueco fino sigue exactamente como se entregó
  (criterio 143). Ni su umbral ni su renglón se tocan.
- **El hueco de delante y el que contiene «ahora».** Esa segunda salida la
  construye **FEAT-011 tajada 3** (criterios 238–242). Esta feature **no la
  construye**; cuando exista, hereda el umbral de registrar sin trabajo extra.
- **Que el hueco de menos de 5 minutos desaparezca de la agenda.** No: la leyenda
  del presupuesto dejaría de cuadrar con lo que se ve.
- **Registrar varias cosas de una vez en el mismo hueco.** Una por apertura, como
  en FEAT-011. El hueco se encoge y se vuelve a pulsar si queda sitio.
- **Cambiar «Registrar tiempo pasado» de la cabecera.** Sigue donde está.
- **Huecos de 0 minutos o negativos.** No existen y no se pintan (FEAT-009,
  criterio 144). Nada cambia ahí.
- **Backend.** Ni un campo, ni un documento GraphQL, ni una mutación.
- **Render nuevo.** Ver «¿Hace falta render?».

**Criterios de aceptación:** (la numeración del módulo sigue: FEAT-008 ocupa
107–134, FEAT-009 140–171, FEAT-010 180–218 y se reescribe desde el 370,
FEAT-011 220–251, FEAT-012 260–319, FEAT-013 330–361. **Esta feature empieza en
el 400.**)

*Los 13 minutos se pueden contar (tajada 1)*

- [ ] 400. Existen **dos umbrales, con dos nombres y dos porqués escritos**:
  `MIN_PLANNING_MINUTES = 15` («lo más corto que se puede poner: la píldora más
  pequeña») y `MIN_LOG_MINUTES = 5` («lo más corto que se ofrece contar; lo ya
  vivido no tiene suelo»). Comprobable con un test que afirma los dos valores;
  ninguna línea de código usa uno para el trabajo del otro.
- [ ] 401. En Hoy, un hueco **que ya pasó** de **5 minutos o más** trae
  «Registrar lo que hice», **con la misma tarjeta y las mismas palabras** del
  criterio 220 de FEAT-011 — no hay una variante corta. Comprobable: un día con
  un hueco de **13 min** entre dos bloques pasados enseña el botón; hoy no lo
  enseña.
- [ ] 402. Un hueco pasado de **4 minutos o menos** sigue **exactamente como
  hoy**: la línea fina con sus horas y sus minutos, sin nada que pulsar.
  Comprobable con un hueco de 4 min (línea, cero botones) y otro de 13 (tarjeta).
- [ ] 403. **En 5 minutos exactos se ofrece** (ver D1). Comprobable: hueco de 5
  min → hay botón; hueco de 4 min → no lo hay.
- [ ] 404. **La salida de planear no se mueve.** Un hueco de 5 a 14 minutos —haya
  pasado o no— **no ofrece fichas de plantilla, ni «+ otra cosa», ni «Poner
  algo»**: ahí no cabe ninguna píldora. El umbral de planear sigue en 15 y el
  renglón del hueco **futuro** corto se ve igual que antes de esta feature.
- [ ] 405. **La hoja abre con una duración que cabe.** En el hueco de 13 minutos
  la duración de partida es **13** —el hueco entero— y no los 30 de la plantilla:
  **Guardar está encendido desde el primer render** y no hay ningún aviso de que
  no cabe. Refina el criterio 224 de FEAT-011 **solo cuando la duración sugerida
  no cabe en la ventana**: en un hueco de 2 h la hoja sigue sin proponer 2 h.
- [ ] 406. En ese mismo hueco la hoja ofrece, **sin controles nuevos**: las cuatro
  píldoras fijas **apagadas** con su línea «Aquí caben 13 min», **«Todo el hueco»
  con 13 min**, y **«libre»** con los dos campos de horas y minutos (FEAT-008).
  Comprobable en el DOM: cuatro botones `disabled`, uno con `aria-label` «Todo el
  hueco, 13 min», y las dos cajas de horas y minutos (`textbox` con
  `inputMode="numeric"` desde FEAT-008, no `spinbutton`) al abrir «libre».
- [ ] 407. Guardar manda `activityFollowUpAdd` con **los minutos elegidos
  exactos** (13 si se eligió «Todo el hueco»), la sesión aparece en su hora
  marcada **«fuera del plan»**, y **ninguna mutación de `activityDayPlan`**.
- [ ] 408. **El hueco se encoge con el umbral nuevo.** En un hueco de 13 minutos:
  registrar 8 deja 5 libres y **el renglón sigue ofreciendo registrar**;
  registrar 10 deja 3 y el renglón vuelve a ser **la línea fina sin salida**;
  registrar 13 no deja hueco. Los tres casos, comprobables.
- [ ] 409. **Funciona igual en un día pasado de la tira** (FEAT-011, criterio
  232): todos sus huecos de 5 minutos o más ofrecen contar y ninguno ofrece
  planear. En un **día futuro** no se ofrece nada.
- [ ] 410. **Lo que ya funcionaba no cambia de resultado.** Los tests de FEAT-003,
  FEAT-009 y FEAT-011 sobre huecos, `isSliver` y colocación **pasan sin
  tocarlos**; si alguno se toca, se dice cuál y por qué. En particular, el hueco
  fino de la **plantilla** (FEAT-009, criterio 143) se ve idéntico, y la suma de
  los minutos de hueco sigue cuadrando con el `freeMinutes` de «Tu día».
- [ ] 411. **Estados:** a **375 px** la tarjeta del hueco de 5 minutos entra sin
  scroll horizontal y con el botón visible sin desplazarse; un nombre de
  actividad de **60+ caracteres** en la hoja no desborda (se corta como ya se
  corta en el hueco grande); si la mutación **falla**, la hoja no se cierra ni
  pierde lo elegido y no queda sesión fantasma (FEAT-011, criterio 231).

*El gemelo: un solo umbral de planear (tajada 2)*

- [ ] 412. **`MIN_PLACEMENT_MINUTES` deja de existir.** Su uso
  (`vida-gap-form.utils.ts:176`) pasa a `MIN_PLANNING_MINUTES`, y `grep -r
  MIN_PLACEMENT_MINUTES src/` da **cero** resultados.
- [ ] 413. **Cambio sin efecto visible:** las horas de inicio que se ofrecen en
  «cuándo», los huecos pintados y las píldoras apagadas son **los mismos** antes
  y después. Los tests existentes pasan sin cambiar ninguna expectativa.
- [ ] 414. La constante única lleva **una línea que dice cómo se llamaba antes**
  (`MIN_GAP_MINUTES` y `MIN_PLACEMENT_MINUTES`) y qué criterios ya entregados la
  nombran (FEAT-003 criterio 17, FEAT-009 criterio 143, FEAT-011 criterio 221),
  para que esos dossieres se sigan pudiendo leer. Y deja escrito, en una línea,
  que **el umbral de contar es otro y vive aparte**.

**Tajadas:**

| # | Qué hace | Estado |
|---|---|---|
| 1 | **Los 13 minutos se pueden contar.** Nace `MIN_LOG_MINUTES = 5`, el hueco pasado de 5 minutos o más gana «Registrar lo que hice» con la tarjeta que ya existe, y la hoja abre con una duración que cabe («Todo el hueco» y el campo libre hacen el resto). Criterios 400–411. | aceptada |
| 2 | **Un solo umbral de planear.** `MIN_PLACEMENT_MINUTES` se funde en `MIN_PLANNING_MINUTES`; nada cambia en pantalla. Criterios 412–414. | pending |

Dos tajadas y no más: la 1 resuelve el caso del usuario entero y se puede probar
sola; la 2 es la deuda, que sin la 1 no le sirve a nadie.

**¿Arquitecto? No**, porque no introduce ningún concepto nuevo: cuelga de cosas
que ya existen y están localizadas.

- El umbral: `src/features/vida/utils/vida-time.utils.ts:203` (`MIN_GAP_MINUTES`)
  y `src/features/vida/utils/vida-gap-form.utils.ts:34`
  (`MIN_PLACEMENT_MINUTES`). *Hipótesis marcada:* la constante nueva vive junto a
  la vieja en `vida-time.utils.ts`; si al constructor le encaja mejor en otro
  sitio, lo dice y lo mueve.
- La puerta: `src/features/vida/components/VidaAgendaGap/VidaAgendaGap.tsx:106`
  —la rama que sale antes de pintar controles— y su condición hermana en
  `src/features/vida/pages/VidaHoyPage.tsx:253`.
- La hoja y sus controles, **ya construidos y sin tocar su forma**:
  `src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx:385-399`
  y `src/features/vida/components/VidaDurationPills/VidaDurationPills.tsx`
  (`maxMinutes`, `fillMinutes`, `freeInput="hoursAndMinutes"`).

**Orden obligatorio:** esta feature **se construye después de que FEAT-011 esté
entregada**. Sus tajadas 2 y 3 están en vuelo sobre los mismos archivos
(`VidaHoyPage.tsx`, `VidaLogSessionSheet.tsx`, `VidaAgendaGap.tsx:108-232`) y dos
constructores a la vez sobre esos archivos es exactamente lo que el plan prohíbe.

**¿Hace falta render? No.** Todo lo que se ve ya está aprobado: la tarjeta del
hueco pasado es la de `12-vida-hoy-registrar-en-hueco.html` y los controles de
duración son los de `09-vida-cuanto.html`. Lo único nuevo es **dónde** aparece
esa tarjeta —en un hueco de 5 a 14 minutos, donde hoy hay una línea— y **qué
enseña la hoja cuando no cabe ninguna píldora fija**, que es un estado que los
componentes ya saben pintar (apagadas + «Todo el hueco» + «libre»). Si al verlo
el usuario quiere una tarjeta más baja en los huecos cortos, eso es CSS sobre lo
aprobado, no un render.

**Decisiones que no son mías:** ninguna bloquea. Tres las decido yo y las dejo
marcadas para que el usuario las contradiga en una línea.

- **D1 — ¿Qué pasa en 5 minutos exactos? La decido yo: se ofrece.** El usuario
  dijo «si es inferior a eso, no» y «si es superior a 5, sí»; los 5 justos quedan
  sin decir. Se incluyen, porque lo que excluyó explícitamente es lo *inferior* y
  un rato de 5 minutos es contable. La comparación es `>= MIN_LOG_MINUTES`.
  **En 0 minutos no hay hueco**: un tramo de 0 ni se pinta ni existe (FEAT-009,
  criterio 144), así que la pregunta no llega a plantearse; entre 1 y 4, línea
  fina sin salida. *Si el usuario prefiere que 5 no entre, es cambiar `>=` por
  `>` y el criterio 403.*
- **D2 — ¿Con qué duración abre la hoja en un hueco donde no cabe la sugerida? La
  decido yo: con el hueco entero.** Abrir con 30 minutos en un hueco de 13
  significaría abrir con Guardar apagado y un aviso rojo antes de que el usuario
  haga nada, y arreglarlo a mano son dos acciones para una sola intención —lo que
  la premisa del plan llama un defecto de la feature, no una salida aceptable—.
  Es un tope (`min(sugerida, ventana)`), no un cambio de la sugerencia: el
  criterio 224 de FEAT-011 sigue valiendo entero para los huecos donde la
  sugerida cabe.
- **D3 — ¿Se recortan las píldoras en un hueco corto? La decido yo: no.** Se
  quedan las cuatro, apagadas y con su razón, y el trabajo lo hacen «Todo el
  hueco» y el campo libre de horas y minutos, que ya existen y ya están ahí.
  Reutilizar antes que inventar, y las píldoras son la escala de **planear**.

**Con qué features se toca** (constriñe el orden, y por eso se escribe):

- **FEAT-011 — Registrar en el hueco (en construcción).** Es la feature de la que
  cuelga esta entera: su criterio 220 pone la salida y su **D3** decidió —con la
  información que había entonces— que el hueco corto no la ofreciera. Esta
  feature **revisa esa decisión con el dato que faltaba**: el 15 era el suelo de
  las píldoras, no el de contar. Su criterio 221 queda **sustituido por el 402**
  para el tramo de 5 a 14 minutos y **sigue vigente por debajo de 5**. *Ese
  dossier no se toca aquí; quien lo lea tiene que llegar a este.*
- **FEAT-009 — Los huecos en la plantilla (entregada).** Su criterio 143 usa el
  umbral y **sigue siendo cierto tal cual**: en la plantilla solo se planea, así
  que su umbral es el de planear. La tajada 2 le cambia el **nombre** a la
  constante que nombra, no el valor ni el comportamiento (criterio 414).
- **FEAT-003 — Planear el día (entregada).** Su criterio 17 y su D1 (las píldoras
  15·30·45·1h) son la razón de que el umbral de planear se quede en 15.

## 2. El plan — feature-architect

*(no aplica: sin arquitecto)*

## 3. Construcción — feature-builder

*(una entrada por tajada, añadida debajo)*

### Tajada 1 — Los 13 minutos se pueden contar

**Resumen para el revisor:**
1. Nace `MIN_LOG_MINUTES = 5` y `MIN_GAP_MINUTES` pasa a llamarse
   `MIN_PLANNING_MINUTES` (mismo valor, 15): un hueco **pasado** de 5 minutos o
   más trae «Registrar lo que hice» con la tarjeta que ya existía.
2. El cambio de comportamiento es **una condición** en `VidaAgendaGap.tsx`; la
   hoja no se tocó: ya sabía abrir con el hueco entero y apagar las píldoras.
3. **Lo que más probablemente he roto:** el renombrado toca cinco archivos del
   módulo (`vida-agenda`, `vida-execution`, `vida-template`, `VidaAgendaGap`,
   `VidaTemplateGapRow`) — si alguien tenía una rama con `MIN_GAP_MINUTES`, le
   va a chocar. Y **el hueco corto ya no es solo una línea**: donde antes
   cabía un renglón de 20 px ahora puede haber una tarjeta con botón, así que
   la agenda de un día muy picado (varios restos de 5–14 min seguidos) se hace
   bastante más alta. Eso no lo mide ningún test; se ve en pantalla.

**Qué se construyó:**

- `src/features/vida/utils/vida-time.utils.ts` — `MIN_GAP_MINUTES` renombrada a
  **`MIN_PLANNING_MINUTES`** (sigue valiendo 15) con su porqué escrito y una
  línea que dice **cómo se llamaba antes** y qué criterios ya entregados la
  nombran (FEAT-003 c.17, FEAT-009 c.143, FEAT-011 c.221). Debajo, nueva
  **`MIN_LOG_MINUTES = 5`** con el suyo: lo ya vivido no tiene suelo, la
  comparación es `>=` (D1) y **no es** el umbral de planear.
- Renombrado mecánico en los cinco archivos que la usaban:
  `vida-agenda.utils.ts`, `vida-execution.utils.ts`, `vida-template.utils.ts`,
  `VidaAgendaGap.tsx` y `VidaTemplateGapRow.tsx` (comentarios incluidos).
  `grep -rn MIN_GAP_MINUTES src/` da **cero** resultados de código (queda una
  mención dentro del comentario que explica el nombre viejo, a propósito).
- `src/features/vida/components/VidaAgendaGap/VidaAgendaGap.tsx` — la puerta.
  Nace `canLogHere = isPast && Boolean(onLogPast) && gap.durationMinutes >=
  MIN_LOG_MINUTES` y la salida temprana pasa de
  `if (gap.isSliver || (isPast && !onLogPast))` a
  `if ((gap.isSliver && !canLogHere) || (isPast && !onLogPast))`. **Nada más**:
  el hueco corto que se salva cae en la rama del pasado que ya existía, así que
  usa la **misma** tarjeta, el **mismo** rótulo accesible y las **mismas**
  palabras (c.401). El comentario del componente deja dicho que el criterio 221
  queda sustituido por el 402 de 5 a 14 y sigue vigente por debajo de 5.
- `src/features/vida/components/VidaAgendaGap/VidaAgendaGap.test.tsx` — **nuevo**
  (no había test de este componente): siete casos sobre la puerta (13 pasado, 5
  exactos, 4, sin `onLogPast`, corto futuro, día de la tira, día futuro, y el
  hueco que se encoge a 5 y a 3).
- `src/features/vida/utils/vida-time.utils.test.ts` — el test de constantes
  afirma los **dos** valores y que el de contar es menor que el de planear.
- `src/features/vida/pages/VidaHoyPage.test.tsx` — **el único test existente que
  hubo que tocar** (c.410, dicho en voz alta): el del criterio 221 medía la
  línea fina con un hueco de **10 minutos**, que es justo el tramo que el
  criterio 402 sustituye. Se baja a **4 minutos** —donde el 221 sigue vigente—
  y se añade al lado el caso del usuario entero: hueco pasado de 13, tarjeta,
  hoja, píldoras apagadas, «Todo el hueco · 13 min» y la mutación con 13.

**Por qué así:**

- **El renombrado entra en la tajada 1** porque el criterio 400 nombra
  literalmente `MIN_PLANNING_MINUTES` y pide que «ninguna línea use uno para el
  trabajo del otro». Se descartó la alternativa de dejar `MIN_GAP_MINUTES` como
  alias: serían **tres** nombres para dos ideas, que es peor que el defecto que
  se está arreglando. Lo que **no** se hizo es la tajada 2:
  `MIN_PLACEMENT_MINUTES` sigue existiendo, intacta.
- **El umbral se mide sobre `gap.durationMinutes`**, no sobre la ventana real
  del hueco. Es lo mismo que mira `isSliver`, así que lo que se ve y lo que se
  ofrece no pueden discrepar. Consecuencia dicha: un hueco de 4 minutos cuya
  ventana real sea mayor —porque el bloque de antes acabó pronto— sigue sin
  ofrecer nada.
- **`canLogHere` exige `isPast`**, así que el hueco corto **futuro** no cambia
  ni un píxel (c.404), aunque la página le pase `onLogPast` por la salida de
  FEAT-011 tajada 3.
- **La hoja no se tocó.** `proposeLogDuration` ya hacía `Math.min(candidato,
  maxMinutes)` (`vida-session.utils.ts:465`) y la hoja ya pasaba `maxMinutes` y
  `fillMinutes`: la D2 estaba construida de antes por FEAT-011. Se verificó, no
  se reimplementó.

**Verificación:**

- `pnpm typecheck` → limpio (sin salida).
- `pnpm lint` → `✖ 14 problems (14 errors, 0 warnings)` — **la línea base
  exacta**, ninguno nuevo.
- `pnpm test` → `Test Files 1 failed | 112 passed (113)`, `Tests 2 failed | 1744
  passed (1746)`. Los **2 fallos son los de siempre** (`SearchSelect ×2`). El
  total sube de 1738 a 1746: +8 casos nuevos.
- `pnpm build` → chunk inicial **1.106,50 kB** (línea base 1.106,47 kB: **+0,03
  kB**, la constante nueva). `app-icons` 620,20 kB e `IconPicker` 4,64 kB, igual.
- **En el navegador**, a **375 px y en oscuro**, con un arnés temporal
  (`src/harness-feat014.tsx` + `harness-feat014.html`, **ya borrados**; el
  `git status` solo tiene los archivos de arriba). `devicePixelRatio` es 2 y la
  captura sale a media escala, así que **todo lo numérico está medido sobre el
  DOM**, no sobre la imagen:
  - Cuatro huecos seguidos: **13 min pasado → tarjeta con «Registrar lo que
    hice»**; **4 min pasado → línea «Libre 9:00 – 9:04 · 4m»** sin un solo
    botón; **5 min pasado → tarjeta**; **13 min futuro → línea**. Es el estado
    que nadie había visto: se ve como los renders ya aprobados, sin variante
    corta.
  - Con la hoja abierta anclada al hueco de 13 (medido en el DOM):
    `[{"15",disabled},{"30",disabled},{"45",disabled},{"1h",disabled},
    {"libre",enabled},{"Todo el hueco",enabled,aria-label:"Todo el hueco, 13
    min"}]` y la línea **«Aquí caben 13 min.»**. Ni un control nuevo (c.406).
  - Al elegir el «qué» (actividad con 30 min en plantilla): «Todo el hueco»
    queda `aria-pressed="true"` — es decir, **13** —, **Guardar encendido**,
    **ningún `role="alert"`** y la línea «Acaba a las 8:58» (c.405, D2).
  - `document.documentElement.scrollWidth === innerWidth === 375` con la
    tarjeta y con la hoja abierta: **sin scroll horizontal** (c.411). Un título
    de actividad de 60+ caracteres se corta con puntos suspensivos dentro de su
    ficha, como ya se cortaba.
- `graphify update .` corrido: 3991 nodos, 4757 aristas.

**Criterios que cierra:**

- **400 ✅** — `MIN_PLANNING_MINUTES = 15` y `MIN_LOG_MINUTES = 5`, cada una con
  su porqué. Test: `vida-time.utils.test.ts` («las constantes son las que mandan
  las decisiones del dossier») afirma los dos valores y su orden.
  `grep -rn "MIN_GAP_MINUTES" src/` → solo la línea del comentario que dice cómo
  se llamaba antes.
- **401 ✅** — `VidaAgendaGap.test.tsx`: un hueco pasado de 13 min (`isSliver`
  true) enseña el botón `Registrar lo que hiciste entre las 9:47 y las 10:00`
  con texto «Registrar lo que hice», dentro de la región `Libre de 9:47 –
  10:00`. Y en la página entera: `VidaHoyPage.test.tsx`, hueco 8:45–8:58.
  Visto en el navegador.
- **402 ✅** — 4 min pasado: `queryByRole('button')` es `null` y se lee
  `Libre 10:00 – 10:04 · 4m`. En la página, el test que medía el 221 ahora lo
  mide con 4 min y pasa igual.
- **403 ✅** — 5 minutos exactos traen botón; 4 no. Los dos en el mismo test.
- **404 ✅** — hueco de 13 min **que aún no ha llegado** con las tres props
  puestas: cero botones y la línea de siempre. Y el hueco corto **pasado** tiene
  exactamente **un** botón, sin «+ otra cosa» ni fichas. En la página, el mismo
  `getAllByRole('button')).toHaveLength(1)`. El umbral de planear no se movió:
  sigue en 15 y con otro nombre.
- **405 ✅** — medido en el navegador y en `VidaHoyPage.test.tsx`: al elegir el
  qué, «Todo el hueco, 13 min» queda `aria-pressed=true`, Guardar enabled y no
  hay aviso. En un hueco grande la hoja sigue sin proponer el hueco entero (los
  tests 222–224 y 238–240 de FEAT-011 pasan sin tocarse).
- **406 ✅** — cuatro botones `disabled`, `aria-label="Todo el hueco, 13 min"`,
  «Aquí caben 13 min.» y el campo libre disponible. DOM y test.
- **407 ✅** — `VidaHoyPage.test.tsx`: `createFollowUpMutation.mutate` llamada
  una vez con `{date:'2026-09-18', startTime:'08:45', durationMinutes:13}` y
  `addMutation` / `editMutation` / `setMutation` **sin llamar**. Lo de «fuera
  del plan» en la agenda es la pintura de FEAT-011, que no se tocó y sigue
  cubierta por sus tests.
- **408 ✅** — los tres tamaños que quedan tras registrar (5 → ofrece, 3 → línea
  fina, 0 → no hay hueco) en `VidaAgendaGap.test.tsx`. El encogerse en sí es la
  reconstrucción de la agenda de FEAT-011, que no cambia.
- **409 ✅** — con `isPastDay` y sin `gap.isPast`, el hueco corto ofrece contar;
  un día futuro (sin `onLogPast`) no ofrece nada.
- **410 ✅ con una salvedad dicha** — los tests de FEAT-003, FEAT-009 y FEAT-011
  pasan sin cambiar ninguna expectativa **salvo uno**: el del criterio 221 en
  `VidaHoyPage.test.tsx`, que medía con 10 minutos el tramo que el 402
  sustituye; se baja a 4 min y se deja el porqué escrito encima. El hueco fino
  de la **plantilla** no se tocó (`VidaTemplateGapRow` solo cambió el nombre en
  un comentario) y sus tests pasan.
- **411 ⚠️ parcial** — a 375 px no hay scroll horizontal y el botón se ve sin
  desplazarse (medido); el nombre largo se corta. **Lo que falla:** el caso de
  «si la mutación falla, la hoja no se cierra ni pierde lo elegido» no lo
  reverifiqué aquí — es el criterio 231 de FEAT-011, entregado y con su test, y
  este cambio no toca ese camino. **Pendiente de prueba manual** (ver abajo).

**Pendiente de prueba manual** (todo lo real está detrás del login y los agentes
no entran, límite estructural del proyecto):

1. Abrir **Vida · Hoy** en un día con un hueco pasado de entre 5 y 14 minutos
   (o crear dos bloques seguidos que dejen 13 min entre ellos, ya pasados).
2. Comprobar que el renglón trae «Registrar lo que hice» y que uno de 4 minutos
   o menos sigue siendo la línea fina.
3. Pulsar, elegir una actividad y ver que la duración queda en los minutos del
   hueco y Guardar está encendido sin tocar nada más. Guardar.
4. Ver la sesión en su hora, marcada «fuera del plan», y el hueco encogido; si
   quedan 5 minutos o más, el renglón sigue ofreciendo registrar.
5. Con el móvil en avión (o cortando la red), pulsar Guardar: la hoja debe
   quedarse abierta con lo elegido y sin sesión fantasma (criterio 231/411).

**Riesgos:**

- **La altura de la agenda.** Un día con varios restos de 5–14 minutos pasados
  pasa de varias líneas finas a varias tarjetas. Es lo que pidió el usuario,
  pero cambia la densidad de la pantalla y nadie lo ha visto con un día real.
- **El renombrado** es amplio aunque mecánico; el compilador lo cubre entero
  (no hay accesos dinámicos ni strings con ese nombre), pero choca con cualquier
  rama abierta sobre esos cinco archivos.
- **`isSliver` sigue significando «no cabe ninguna píldora»** y ahora hay un
  sitio donde un `isSliver` **sí** pinta tarjeta. Quien lea `isSliver` como «se
  pinta fino» se equivocará: el nombre no se cambió porque eso sería una tercera
  tajada y un renombrado mayor. Queda anotado como deuda.
- **La plantilla no se miró en el navegador** (no cambia nada suyo salvo el
  nombre en un comentario); su hueco fino está cubierto por los tests de
  FEAT-009.

**Sobre la tajada 2 (fundir `MIN_PLACEMENT_MINUTES`):** esta tajada la deja
**más fácil, no más difícil**. El destino del merge ya existe con el nombre
definitivo y con su documentación escrita —incluida la línea del criterio 414
sobre los nombres viejos, que ya nombra a `MIN_GAP_MINUTES` y solo habrá que
añadirle `MIN_PLACEMENT_MINUTES`—, así que la tajada 2 se reduce a: borrar la
constante de `vida-gap-form.utils.ts:34`, importar `MIN_PLANNING_MINUTES` en su
único uso (`:176`) y ajustar dos comentarios. No hay nada en la tajada 1 que la
estorbe: `MIN_LOG_MINUTES` vive aparte y nadie de `vida-gap-form.utils.ts` la
toca.

**Lo que descubrí y no estaba en el plan** (anotado, **no tocado**):

- **La D2 ya estaba construida.** `proposeLogDuration` recorta a `maxMinutes`
  desde FEAT-011 tajada 3 (`vida-session.utils.ts:465`), así que el criterio 405
  no necesitó ni una línea. El dossier lo daba por hacer.
- **`VidaAgendaGap` no tenía test propio**; los 200+ tests de `VidaHoyPage` lo
  cubrían de rebote. Ahora tiene uno.
- **Un tercer umbral que nadie ha nombrado:** `VIDA_NO_DATA_MIN_MINUTES = 30`
  (`vida-execution.utils.ts:920`), el suelo del «¿Qué pasó?» de los tramos sin
  dato. No es `isSliver` ni `MIN_PLACEMENT_MINUTES`: es un cuarto número con su
  propia razón. Fuera de alcance aquí, pero si alguien va a ordenar umbrales,
  ese está en la lista y no en el dossier.

**Estado del árbol:** sin commitear. 10 archivos modificados y 1 nuevo
(`VidaAgendaGap.test.tsx`). El arnés temporal se borró; `graphify-out/` cambió
por el `graphify update .` que manda `CLAUDE.md`.

## 4. Revisión — feature-reviewer

*(una entrada por tajada)*

### Tajada 1 — Un rato de 13 minutos también se puede contar

**Veredicto: `accepted`** — y con prisa, porque es lo que el usuario está
esperando para su hueco de hoy. Los criterios 400–410 se cumplen; el **411**
queda parcial y es aceptable (abajo). **He visto el estado que nadie había
visto**: las cuatro píldoras apagadas con «Todo el hueco» encendida, y los
cuatro bordes pintados uno al lado de otro.

**El caso del usuario, comprobado por mí**

Test temporal propio (borrado) sobre el componente, un render limpio por caso
—es donde se cuela un falso positivo si se reutiliza el documento—:

| Hueco pasado | Qué sale |
|---|---|
| **13 min** | Tarjeta entera: «Libre 8:45 – 8:58», «13m» y **«Registrar lo que hice»** |
| **5 min** | Lo mismo: **los 5 exactos entran** (`>=`, D1) |
| **4 min** | **Línea fina**, sin un solo control (`data-sliver`) |
| **1 min** | Línea fina |
| **20 min** | Como siempre |
| **13 min, futuro** | **Línea fina**: ni «Registrar», ni fichas, ni «+ otra cosa» |
| **13 min, sin `onLogPast`** | Línea fina (criterio 244 de FEAT-011, intacto) |

Y en el navegador los vi **los cuatro juntos** a 375 px: el de 13 y el de 5 con
su tarjeta y su botón de **44 px**, el de 4 y el futuro de 13 como líneas finas.

**La condición, leída con cuidado (donde se cuela un caso)**

```
canLogHere = isPast && Boolean(onLogPast) && gap.durationMinutes >= MIN_LOG_MINUTES
if ((gap.isSliver && !canLogHere) || (isPast && !onLogPast)) → línea fina
```

Recorrí la tabla entera —pasado/futuro × corto/largo × con y sin `onLogPast`, y
el día de la tira (`isPastDay`)— y **no encontré ningún caso que se cuele**. El
que más me interesaba: un hueco **futuro corto con `onLogPast` puesto** (que la
página sí pasa hoy, por el criterio 241 de FEAT-011) sale **línea fina**, igual
que antes de esta feature — la segunda salida «Registrar» del hueco futuro vive
en la tarjeta normal, que sigue pidiendo `!isSliver`. El criterio 404 se cumple
por ahí.

**El renombrado: mecánico de verdad**

`grep -rn "MIN_GAP_MINUTES" src/` devuelve **una sola línea**, y es el comentario
que explica el renombrado. Los cinco usos reales —`makeGap`, `findLargestGap`
(×2), `sliceGap`, `buildTemplateDay`— pasan a `MIN_PLANNING_MINUTES` **con el
mismo valor, 15**, y el resto son cadenas de documentación. **No cambia ni un
comportamiento**: ni en la plantilla (FEAT-009: `isSliver` de `TemplateGapRow`
sigue siendo `< 15`), ni en el camino de planear (FEAT-003: el suelo de las
fichas sigue en 15), ni en `buildNoDataSlices`. Lo confirma también la suite
entera en verde, incluidos los tests de aquellas dos features.

**La hoja abre con una duración que cabe (criterios 405 y 406)**

Verificado por mí, y es cierto que **no hizo falta código**: `proposeLogDuration`
recorta a `maxMinutes` desde FEAT-011 —lo revisé entonces— y aquí solo hay que
pasarle un hueco pequeño. En el DOM, con 13 minutos: **las cuatro píldoras fijas
`disabled`**, «**Todo el hueco**» encendida con `aria-label` **«Todo el hueco,
13 min»**, la línea «**Aquí caben 13 min.**» y «libre», que al pulsarla abre los
**dos campos** de horas y minutos. Y el test de la página lo lleva hasta el
final: al elegir la actividad, la duración se queda en **13** —no en los 30 de la
plantilla—, «Registrar» va **encendido desde el primer render** y no hay ningún
aviso de que no cabe.

**Un matiz del criterio 406, que no es culpa de esta tajada:** pide «los dos
`spinbutton` al abrir libre», y desde FEAT-008 esos campos **ya no son
`spinbutton`** —son cajas de texto con `inputMode="numeric"`, precisamente para
que la rueda del ratón no cambie el valor—. Lo que el criterio quiere decir —dos
campos, horas y minutos— **se cumple**; la palabra se quedó vieja. Queda como
hallazgo, no como incumplimiento.

**El test que cambió: no se relaja nada**

El caso del criterio 221 medía la línea fina con un hueco de **10 minutos**, que
es justo el tramo que el 402 sustituye. Ahora lo mide con **4**, donde el 221
sigue siendo cierto, y el de 10 se mide en el test de al lado **con su salida**.
Es decir: la afirmación no se debilita, se **muda al tramo donde sigue valiendo**,
y queda dicho en voz alta (criterio 410). Bien hecho.

**Los 7 casos nuevos de `VidaAgendaGap`**

El componente llevaba tres features encima sin test propio, así que esto es
deuda que se paga: cubren la tarjeta del corto pasado, los bordes 5/4, el caso
sin `onLogPast`, el futuro corto, que el corto pasado **no** ofrece planear, el
día de la tira y el hueco que se encoge. Me parecen los siete que había que
escribir.

**El 411 parcial: aceptable, y menos parcial de lo que él cree**

Lo verificado está bien: a 375 px `scrollWidth === clientWidth === 375` y **0
nodos desbordados** —lo medí yo, en claro y en oscuro—, y el botón mantiene sus
**44 px**. La mitad que deja a prueba manual —«si la mutación falla, la hoja se
queda abierta»— es el criterio **231 de FEAT-011**, que **ya revisé y acepté**, y
el camino de error de la hoja **no se ha tocado en esta tajada**: es el de
FEAT-004. Así que no es una promesa pendiente, es comportamiento heredado y
probado en su sitio. Lo doy por bueno.

**El tercer umbral y el nombre de `isSliver`: sí, a la tajada 2**

Su hallazgo es bueno y lo confirmo: hoy conviven **tres** números con el mismo
trabajo repartido —`MIN_PLANNING_MINUTES = 15`, su gemelo
`MIN_PLACEMENT_MINUTES = 15` (`vida-gap-form.utils.ts:34`, 3 usos, del camino de
planear que el criterio 236 de FEAT-011 congela) y `VIDA_NO_DATA_MIN_MINUTES = 30`
(`vida-execution.utils.ts:920`)—, más un `isSliver` que **ahora miente un poco**:
significa «no se puede planear aquí», pero hay un sitio donde sí pinta tarjeta.
**Debe caer en la tajada 2, junto al gemelo**, y por una razón práctica: mientras
el mismo concepto tenga dos nombres y un booleano que ya no dice lo que dice, el
siguiente que cambie un umbral lo cambiará en un sitio y no en los otros —que es
exactamente lo que esta feature vino a arreglar—. No aquí: esta tajada es la que
desbloquea al usuario y debe ir sola.

**Línea base, corrida entera por mí**

| Qué | `ENVIRONMENT.md` | Constructor | **Medido ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos |
| `pnpm test` | 2 de 1738 | 2 de 1746 | **2 fallidos de 1746**, 112 archivos de 113 en verde |
| `pnpm build` | 1.106,47 kB | 1.106,50 kB | **exit 0**, `index` **1.106,50 kB** (+0,03), `app-icons` **620,20 kB sin tocar** |

**Estados, medidos por mí** — y lo digo como toca: **las cifras son del DOM**,
porque con `devicePixelRatio: 2` la captura sale a media escala; lo que la
imagen sí me dejó ver, y es lo que importaba, es **el estado que nadie había
visto**: las cuatro píldoras apagadas, «Todo el hueco» en mint y «Aquí caben 13
min.» debajo. A 375 px: 0 nodos desbordados en claro y en oscuro; píldora
apagada **7,3:1** en claro y **9,05:1** en oscuro; «Todo el hueco» **5,38:1**;
«Libre 8:45 – 8:58» **19,28:1** en oscuro; el botón, **44 px**.

**Hallazgos — se anotan, no devuelven la tajada**

1. **El criterio 406 pide `spinbutton`** y desde FEAT-008 esos campos son cajas
   de texto. La intención se cumple; la palabra hay que corregirla en el
   dossier.
2. **Tres umbrales y un `isSliver` que ya no dice lo que dice**: a la tajada 2,
   con su razón arriba.
3. **`ENVIRONMENT.md` vuelve a quedarse corto** (hoy **1746** tests y
   **1.106,50 kB**). **No lo he tocado.**

**Lo que no he podido revisar:** el hueco de verdad del usuario, con su sesión y
sus datos —que es justo lo que va a hacer él en cuanto esto se publique—: abrir
Hoy, pulsar su rato de 13 minutos, contar qué hizo y ver la sesión en su sitio.
