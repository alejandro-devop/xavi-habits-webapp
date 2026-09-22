---
id: FEAT-014
title: La tolerancia del hueco — un rato de 13 minutos también se puede contar
status: specified
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
  hueco, 13 min», y los dos `spinbutton` al abrir «libre».
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
| 1 | **Los 13 minutos se pueden contar.** Nace `MIN_LOG_MINUTES = 5`, el hueco pasado de 5 minutos o más gana «Registrar lo que hice» con la tarjeta que ya existe, y la hoja abre con una duración que cabe («Todo el hueco» y el campo libre hacen el resto). Criterios 400–411. | pending |
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

## 4. Revisión — feature-reviewer

*(una entrada por tajada)*
