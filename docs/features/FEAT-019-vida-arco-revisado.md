---
id: FEAT-019
title: El arco de trabajo, corregido — lo que falta dentro, un semáforo que sabe si te da tiempo, y solo los días que trabajas
status: in-review
architect: yes    # toca el API en otro repo (columna nueva + mutación en vida_goals), cruza dos componentes que hoy no se hablan (VidaDayBudget y VidaGoalArc) y estrena la primera edición de una meta en el front; razón completa abajo
area: features/vida, API (xavi-platform-node)
requested: 2026-09-22
updated: 2026-09-23
---

# FEAT-019 — El arco de trabajo, corregido

## Aviso de herramientas

Este análisis se hizo **sin `Bash`**, así que no pude correr `graphify query`
ni `graphify explain` antes de explorar el código, aunque
`docs/features/ENVIRONMENT.md` confirma que el grafo existe
(`graphify-out/graph.json`). Usé `Grep` y `Glob` en su lugar — más lento, sin
la vista de comunidades/relaciones que da el grafo — y lo dejo escrito para
que quien retome esta feature (sobre todo el arquitecto) corra `graphify`
primero si tiene el tool disponible.

## 1. La petición — feature-analyst

**Resumen para quien venga detrás:** FEAT-016 (arco de trabajo) está
entregada y en producción, pero el usuario no entendió el número grande: era
la hora a la que pararía, y él esperaba el tiempo que le faltaba. Esta feature
corrige tres cosas sobre esa misma pieza, ya con render aprobado
(`docs/vida/assets/20-vida-arco-lo-que-falta.html`): **(1)** dentro del arco
va lo que falta, no la hora — la hora baja a una línea visible debajo;
**(2)** un semáforo verde/naranja/rojo que mide **si da tiempo hoy** (no el
porcentaje de la meta); **(3)** el arco —y la pregunta que lo crea— solo
aparecen los días que el usuario marca como laborables para esa meta. **La
primera tajada corrige la confusión original sin tocar el API**: es la más
urgente y la más barata.

**Qué problema resuelve:** el usuario miró el arco en producción y preguntó
«¿Falta tiempo? ¿esa es la hora?» — no distinguía si el número grande era una
hora del reloj o una cuenta pendiente. Después, viéndolo con calma, añadió dos
cosas que sí pidió de entrada y que FEAT-016 no cubría: una señal de si va a
llegar a tiempo, y que el arco no le hable en un día que no trabaja.

**Para quién es:** para el usuario, mirando Hoy durante la jornada — el mismo
momento que FEAT-016 — y también los sábados/domingos, donde ahora mismo el
arco le sale igual que un lunes aunque no aplique.

**Palabras del usuario:** «Ahhhh ya entiendo se supone que es la hora a la que
"acabaría de trabajar, no me gusta… ( me refiero al arco de trabajo )
debería mostrar el tiempo que me faltó para completar las ocho horas…. Y
debería tener un semáforo de colores verde si me acerco a un 90% y naranja
cerca y rojo sino, adicional este arco de trabajo aplica para días
configurables para el usuario, por ejemplo yo no trabajo los fines de semana,
no tiene sentido que me salga ese arco».

**Lo ya decidido con el usuario — cerrado, no se reabre:**

1. **Dentro del arco va lo que falta, no la hora.** «TE FALTAN 4h 30». La hora
   a la que pararía no se pierde: baja a una línea visible debajo del arco,
   donde ya vive la frase de la sesión en marcha. Único caso sin cambio:
   **pasada la meta no falta nada**, así que ahí sigue siendo una hora («a qué
   hora cruzó las 8h»), sin cambios de FEAT-016.
2. **El semáforo mide «lectura B» — si te va a dar tiempo hoy —, no el
   porcentaje de la meta (lectura A).** El usuario pidió la A al pie de la
   letra («verde si me acerco a un 90%…») y la descartó al ver el render: a
   las 9:15 de un lunes normal llevas 15 minutos de 8 horas y esa lectura
   pinta rojo, regañando por ir al ritmo de cualquier lunes en un módulo
   escrito entero para no juzgar. La lectura B usa los mismos tres colores
   contra **el final del día que el módulo ya calcula** (la línea «te quedan
   Xh Ym hasta las 23:00» de `VidaDayBudget`, encima del arco): verde si sobra
   más de una hora antes de que dé tiempo a completar la meta, naranja si cabe
   justo, rojo si hoy ya no da. Un lunes normal es verde de principio a fin.
3. **El arco (y la pregunta que lo crea) solo aparecen los días laborables de
   esa meta.** De lunes a viernes de partida. Un día no laborable: ni arco, ni
   pregunta, ni hueco donde estaban — y **no cuenta como un día en rojo ni en
   ningún color**: no es que faltara a la meta, es que ese día la meta no
   existe. Lo que se trabaje ese día se sigue registrando igual; solo deja de
   sumar contra nada. Los días laborables van en la **meta**, no en la
   categoría (mismo modelo que FEAT-016: cada meta futura trae los suyos sin
   rediseñar nada).

**El render está hecho y aprobado**: `docs/vida/assets/20-vida-arco-lo-que-falta.html`.
Cubre las tres cosas con antes/después, las dos lecturas del semáforo lado a
lado con las mismas horas y los mismos datos (para que se vea que dan colores
opuestos) y el caso del sábado. La fila de días en Ajustes → Metas está
dibujada pero marcada explícitamente como algo que el render **pregunta**, no
que resuelve del todo (ver decisiones).

**Consecuencias que no son mías y que tuve que resolver yo, con su
argumento** (el usuario las dejó explícitamente para el analista, ver los
«tres avisos» de mi encargo):

- **¿Un día pasado tiene color de semáforo? No, nunca.** El semáforo responde
  a «¿me va a dar tiempo hoy?», una pregunta hacia adelante. Un día que ya
  terminó no tiene un «ahora» desde el que proyectar — es el mismo argumento
  que ya sostiene D-B de FEAT-016 (por qué un día pasado no lleva «a este
  ritmo paras a las…»). Pintar un día pasado de rojo porque no llegó a la meta
  sería además el reproche exacto que el criterio 493 de FEAT-016 prohíbe,
  aplicado a algo que ya no se puede cambiar.
- **El rojo puede aparecer sin que el usuario haya hecho nada mal, y es
  aceptable.** Empezar tarde por una reunión, por ejemplo. El semáforo no
  juzga una decisión pasada: informa de un hecho presente y accionable — si
  cabe o no lo que falta antes de que se acabe el día —, y esa es información
  que el usuario puede usar ahora mismo (saltarse algo, empezar ya). Lo que sí
  es mío, y lo dejo como criterio: el rojo no puede venir acompañado de
  ningún texto de juicio ni de `role="alert"` — solo el color y el mismo
  texto neutro que ya existe.
- **Reconciliación con el criterio 493 de FEAT-016** («pasados los minutos de
  la jornada no hay ningún adjetivo, ni color de alarma»): **no se deroga, se
  acota**. 493 sigue gobernando el caso «meta ya cruzada» (ahí no hay
  semáforo posible: no falta nada). El semáforo vive exclusivamente en el
  tramo anterior a cruzar la meta, y es un dato de si cabe, no una alarma
  sobre lo ya hecho — la distinción que sostiene que esto no contradice al
  493, solo abre un caso que el 493 no contemplaba.
- **¿Sale la pregunta «¿Cuál de estas es tu trabajo?» en un día no
  laborable? No.** Dos razones. La primera es de conjunto: el render agrupa
  arco, pregunta y hueco como una sola cosa que no aparece un sábado — son la
  misma pieza en dos estados. La segunda es más dura: el criterio 501 de
  FEAT-016 promete que tocar una categoría en la pregunta hace aparecer el
  arco **al instante, sin recargar**. Si la pregunta siguiera saliendo un
  sábado y el usuario tocara una categoría, el arco **no aparecería** —porque
  ese día no es laborable— y la promesa del 501 se rompería en silencio: el
  usuario tocaría algo y no vería ningún resultado. Ocultar la pregunta el
  mismo día que se oculta el arco evita ese callejón.
  **Matiz que dejo escrito y no resuelvo del todo** (ver «Fuera de alcance»):
  esta regla es limpia cuando **todavía no existe ninguna meta** — se compara
  contra el mismo lunes-a-viernes por defecto con el que nacería la meta. El
  caso de una meta que **ya existe**, con sus propios días configurados, pero
  con **cero categorías apuntándola** (por ejemplo, el usuario desmarcó la
  única que tenía) es distinto: hoy el catálogo de categorías no trae ninguna
  meta que no tenga al menos una categoría apuntándola (`buildGoalArcs` solo
  ve metas a través de `category.goal`), así que el front no tendría de dónde
  leer los días de esa meta huérfana para aplicar la misma regla. Lo marco
  como fuera de alcance con su razón, no como una decisión tomada a la ligera.

**Lo verificado en el código, para que nadie lo vuelva a buscar:**

- `src/features/vida/utils/vida-goals.utils.ts` — `toArc()` (líneas
  213–286) es donde nace el problema: cuando la meta no está cruzada,
  `arcValue` es `stopAtTime` formateado como hora («A este ritmo paras a
  las…» o «Si arrancas ahora…»), y solo cuando `workedMinutes >=
  targetMinutes` se convierte en la hora en que se cruzó. **Nunca hoy es
  `targetMinutes - workedMinutes`.** El resto de la máquina —`toSessionSpans`,
  `passedAtOf`, `canProject`, la distinción `isPastDay`— no se toca: la
  tajada 1 cambia qué se elige como `arcValue`/`arcCaption` en la rama «no
  cruzada, hay reloj, hoy», no cómo se calcula nada.
- `src/features/vida/components/VidaGoalArc/VidaGoalArc.tsx` — el `<p
  className={styles.srLine}>` que hoy lleva `arc.line` es **1×1 px, solo para
  lectores de pantalla** (comentario del propio componente y hallazgo cerrado
  en la revisión de FEAT-016 tajada 3: antes se oía/veía dos veces). El
  render 20 pide que esa misma frase («A este ritmo paras a las 17:55.») sea
  **visible** cuando el arco muestra «TE FALTAN» — así que la tajada 1 no
  crea una frase nueva, cambia si la que ya existe es 1×1 px o de verdad, y
  solo en ese estado (para no reabrir el hallazgo de la doble lectura en los
  otros).
- `src/features/vida/components/VidaGoalPrompt/VidaGoalPrompt.tsx` — no lee
  ninguna fecha ni día de la semana hoy; decide solo por `categories.length`.
  Necesitará el día mostrado y el catálogo de metas (o su ausencia) para
  aplicar la regla del punto 3.
- `src/features/vida/components/VidaDayBudget/VidaDayBudget.tsx:102-109` — la
  línea «te quedan Xh Ym hasta las 23:00» ya existe como
  `budget.remainingMinutes` formateado; es el dato que el semáforo necesita
  y **no hace falta recalcularlo**.
- `src/features/vida/pages/VidaHoyPage.tsx` — `budget` (de `getDayBudget`,
  línea 291) y la llamada a `buildGoalArcs` (línea 364) **viven en la misma
  página, en el mismo nivel**: pasar `budget.remainingMinutes` o
  `dayHours.endTime` a `buildGoalArcs` no pide ninguna consulta nueva, es
  cablear un dato que ya está ahí. `VidaGoalPrompt` se monta en la línea 1180
  y `VidaGoalArcRow` en la 1188, ambos ya con el catálogo de categorías
  disponible en la página.
- `src/features/vida/pages/VidaAjustesPage.tsx` — existe, vive en
  `/app/vida/ajustes`, y hoy **solo** tiene el horario del día (su propio
  comentario lo dice: «y nada más», D2 de FEAT-016). No hay ninguna fila de
  metas todavía: la del render («Ajustes → Metas») sería una sección nueva en
  esta misma página, no una pantalla distinta.
- `src/features/vida/utils/vida-date.utils.ts` — ya existe
  `getVidaDayOfWeek` y un orden de días (`VIDA_DAY_ORDER`), usado hoy por
  `vida-adherence.utils.ts`. Es el candidato natural para saber qué día de la
  semana es la fecha mostrada; no hace falta escribir ese cálculo de nuevo.
- No encontré, buscando con `Grep` en `xavi-platform-node/src`, ninguna
  columna ni patrón de «días activos» en `vida_goals` ni en ninguna tabla
  cercana (`weekly-routine.service.ts` no tiene nada equivalente). **No hay
  precedente de qué forma tiene un conjunto de días de la semana en este
  API**: queda como decisión técnica del arquitecto (ver abajo), no como algo
  que se pueda copiar.
- No existe hoy ninguna consulta que traiga una meta **sin** categorías
  apuntándola (confirma el matiz de la pregunta en día no laborable, arriba):
  `listGoals` en `vida-goal.service.ts` no tiene consumidor en el front
  (anotado ya en la sección 2 de FEAT-016).

**Fuera de alcance:** (lo que alguien podría dar por incluido y NO está)

- **Renombrar la meta, cambiarle el icono, el color o los minutos objetivo.**
  Sigue fuera, igual que en FEAT-016; esta feature añade **solo** la fila de
  días laborables a Ajustes → Vida, no un formulario de edición completo.
- **Crear una meta nueva desde Ajustes.** Las metas siguen naciendo solo
  desde la casilla del formulario de categoría o desde la pregunta en Hoy
  (FEAT-016); Ajustes solo edita los días de una meta que ya existe (y que
  tiene al menos una categoría apuntándola, ver matiz arriba).
- **Los días laborables de una meta huérfana** (existe, pero ninguna
  categoría le apunta hoy). El modelo de datos actual no la expone en ningún
  sitio del front; resolverlo pide una consulta nueva (`vidaGoals` o
  similar) que hoy no existe y que esta feature no añade.
- **Notificaciones o cualquier aviso sonoro/push por el semáforo.** Sigue
  siendo «solo mirar» (decisión ya cerrada en FEAT-016, confirmada aquí).
- **Un indicador único de semáforo para el día entero**, si hubiera varias
  metas. El semáforo es por arco/meta, no un resumen agregado.
- **El semáforo o el arco en Revisión** (día ya cerrado). Revisión sigue sin
  tocarse, mismo alcance que FEAT-016.
- **Cruzar la medianoche.** Límite conocido y general del módulo (FEAT-016),
  no se resuelve aquí.
- **Redactar de nuevo el criterio 497 de FEAT-016** («Trabajaste Xh Ym.» vs.
  lo construido, «Registraste 5 h de Trabajo.»). Es una enmienda del revisor
  que el usuario no ha contestado; la traigo a este expediente para que no se
  pierda (ver decisiones), pero esta feature no toca el caso de día pasado y
  no la resuelve.

**Qué criterios de FEAT-016 quedan enmendados o derogados** (ninguno se
deroga entero; se acotan o se les añade una condición):

- **489** (el arco aparece con al menos una categoría apuntando a una meta):
  **enmendado**. Gana una condición más: y el día mostrado es laborable para
  esa meta. Sin esa condición, no aparece — mismo lugar que hoy ocuparía.
- **492** (el número grande dentro del arco es una hora, «ahora + lo que
  queda», y «ningún texto obliga a restar»): **enmendado de fondo**. Deja de
  ser universal: en el tramo antes de cruzar la meta, el número grande pasa a
  ser lo que falta (una resta, justo lo que 492 decía que no debía obligarse
  a hacer — se invierte a propósito). La hora que 492 protegía no desaparece:
  se conserva, visible, en la línea de debajo (criterios 561-562 de esta
  feature). Pasada la meta, 492 deja de aplicar del todo porque ahí nunca
  hubo «lo que falta» que mostrar — ver el criterio 493, que sigue mandando
  ese caso sin cambios.
- **495** (con la meta marcada y cero minutos hoy, el arco aparece vacío con
  la misma fórmula de la hora): **enmendado**. Con cero minutos, el arco
  ahora muestra «TE FALTAN» con la jornada entera (p. ej. «TE FALTAN 8h»), no
  una hora de parada proyectada a partir de cero. La hora que antes ocupaba
  ese lugar sigue existiendo en la línea de debajo.
- **500** (si ninguna categoría apunta a una meta, aparece la pregunta):
  **enmendado**. Gana la misma condición que el 489: solo si el día mostrado
  es laborable (o, sin meta todavía, laborable contra el lunes-a-viernes por
  defecto). En un día no laborable, ese sitio se queda vacío igual que el del
  arco.

**Confirmados sin cambios, uno por uno para que no se les dé por tocados**:
490, 491, **493** (reconciliado con el semáforo, ver arriba, pero no se
reescribe), 494, 496, 497 (pendiente solo de una enmienda de redacción que el
usuario no ha contestado, ver decisiones — el cálculo no cambia), 498, 499,
501, 502, 503.

**Criterios de aceptación:** (la numeración del módulo sigue: FEAT-018 llega
hasta el 558. Esta feature empieza en el **559**.)

*Lo que falta, dentro del arco (tajada 1 — solo front, sin migración)*

- [ ] 559. Con el día mostrado siendo **hoy**, con reloj (`nowMinutes` no
  nulo) y la meta **sin cruzar**, el número grande dentro del arco es
  `targetMinutes − workedMinutes` (lo que falta), con el rótulo «TE FALTAN»
  en una sola línea — no la hora a la que se pararía.
- [ ] 560. La hora a la que se pararía a este ritmo no desaparece: en ese
  mismo estado aparece en una línea **visible** (no 1×1 px, no solo para
  lectores de pantalla) debajo del arco, con la misma frase que hoy compone
  `arc.line` («A este ritmo paras a las 17:55.» / «Si arrancas ahora,
  acabarías a las…» con cero minutos).

  > **SUPERADO por decisión del usuario del 2026-09-22 (tajada 5).** No se
  > borra —se cumplió, se revisó y se aceptó en la tajada 1—, pero ya no se
  > exige: el usuario lo anuló usando la app esa noche. Sus palabras: «quiero
  > remover ese cálculo de "a qué hora terminaría mi jornada", no lo veo
  > necesario… solo con saber cuánto me quedó faltando es suficiente». Con la
  > hora fuera, la línea repetía la cabecera («7h 09 de 8h») y el interior del
  > arco («TE FALTAN 51m»), así que deja de verse. Lo vigente es el **589** y
  > el **590**. Los criterios 559, 561–565 siguen en pie sin cambios.
- [ ] 561. Con cero minutos trabajados hoy y la meta sin cruzar, el arco
  muestra igualmente «TE FALTAN» con el total de la jornada (p. ej. «TE
  FALTAN 8h»), sin un estado de texto distinto — sustituye, en este caso, la
  hora de parada que D-C de FEAT-016 dejaba como número grande.
- [ ] 562. Pasada la meta (`workedMinutes ≥ targetMinutes`), el arco **no
  cambia respecto a FEAT-016**: sigue mostrando la hora a la que se cruzaron
  las 8h, con su rótulo («PASASTE LAS 8H A LAS»), sin la línea visible nueva
  del 560 (no hay «lo que falta» que anunciar) y sin ningún adjetivo ni color
  de alarma (criterio 493 de FEAT-016, sin cambios).
- [ ] 563. En un **día pasado** de la tira (`isPastDay`), el arco no cambia
  de esta tajada: sigue el criterio 497 de FEAT-016 tal cual está construido
  hoy (pendiente solo la enmienda de redacción de la decisión D4, que no
  bloquea esta feature).
- [ ] 564. La frase que hoy vive en el `<p>` 1×1 px no se duplica: en el
  estado «TE FALTAN» se lee **una vez** (visible), no una vez visible y otra
  para lectores de pantalla — mismo cuidado que cerró el hallazgo de FEAT-016
  tajada 3.
- [ ] 565. Estados: a 375 px, con la jornada más larga que el módulo permite
  (1440 min → «TE FALTAN 24h») y con la línea visible del 560 en su versión
  más larga, no hay scroll horizontal ni el número se corta contra el trazo
  del arco.

*El semáforo — lectura B (tajada 2 — solo front, sin migración)*

- [ ] 566. Con la meta **sin cruzar** y el día mostrado siendo **hoy**
  (mismas condiciones que el 559), el arco lleva un color —verde, naranja o
  rojo— que depende de si cabe lo que falta antes de que termine el día
  (`dayEnd` de `VidaDayBudget`/`useVidaDayHours`), no del porcentaje de la
  meta: `margen = minutos hasta dayEnd − minutos que faltan para la meta`.
- [ ] 567. **Verde** cuando el margen es mayor a 60 minutos (umbral
  propuesto por el render; ver decisión D1, abierta).
- [ ] 568. **Naranja** cuando el margen está entre 0 y 60 minutos, ambos
  incluidos.
- [ ] 569. **Rojo** cuando el margen es negativo (hoy ya no da tiempo a
  completar la meta antes de `dayEnd`).
- [ ] 570. Un lunes cualquiera a las 9:15 de la mañana, con 15 minutos
  trabajados de una meta de 480, el arco es **verde** — prueba directa contra
  la lectura A que el usuario pidió y luego descartó al verla en el render.
- [ ] 571. Fuera de esa ventana —meta ya cruzada (562), día pasado (563), o
  sin reloj (día futuro de la tira)— el arco **no lleva ningún color de
  semáforo**: ni verde, ni naranja, ni rojo. El criterio 493 de FEAT-016 sigue
  mandando ahí sin colorear nada.
- [ ] 572. El color no añade ningún adjetivo, signo de exclamación ni
  `role="alert"` al texto existente, **tampoco en rojo**: es una marca visual
  (el trazo del arco, un punto), y la frase visible del 560 dice lo mismo que
  diría sin semáforo.
- [ ] 573. Un **día pasado** nunca lleva color de semáforo, haya llegado o no
  a la meta ese día — resuelto en la sección de arriba: el semáforo pregunta
  si da tiempo *hoy*, y un día terminado no tiene ningún «hoy» que proyectar.
- [ ] 574. Con dos metas visibles el mismo día (p. ej. «Trabajo» y otra meta
  futura), cada arco lleva su propio color calculado con sus propios minutos
  objetivo — el semáforo no se comparte entre arcos.

*Solo los días laborables (tajada 3 — toca el API)*

- [ ] 575. `vida_goals` gana una forma de guardar **qué días de la semana**
  cuenta esa meta (migración en `xavi-platform-node`); una meta creada
  automáticamente («Trabajo») nace con **lunes a viernes** marcados (ver
  decisión D2).
- [ ] 576. En Hoy, el arco de una meta **no aparece** en un día que no está
  marcado como laborable para esa meta: ni vacío, ni con ceros, ni con
  semáforo — el mismo hueco que si nunca hubiera pasado nada ese día.
- [ ] 577. Lo que se registre un día no laborable **se sigue guardando
  igual** (ninguna sesión ni actividad deja de contarse en el catálogo o en
  Revisión): solo deja de sumar contra la meta de ese día.
- [ ] 578. Un día no laborable **no cuenta como un día en rojo** ni en
  ningún otro color: no hay ningún nodo de semáforo pintado ni oculto para
  ese día — la meta, ese día, no existe, no falla.
- [ ] 579. Con dos metas que tienen días laborables distintos (p. ej.
  «Trabajo» de lunes a viernes y «Sueño» los siete días), cada arco aparece o
  no según **sus propios** días, no según los de la otra.
- [ ] 580. En un día no laborable, si además **ninguna** categoría apunta a
  ninguna meta, tampoco aparece la pregunta «¿Cuál de estas es tu trabajo?»:
  mismo hueco vacío que ocuparía el arco (resuelto arriba, con su razón:
  evita que tocar una categoría ese día no muestre ningún resultado).
- [ ] 581. En Ajustes → Vida, la fila de **cada meta que ya tiene al menos
  una categoría apuntándola** enseña los siete días de la semana como
  botones de estado (L a D), y tocar uno cambia si esa meta cuenta ese día —
  un toque, un guardado, sin pantalla ni confirmación intermedia.
- [ ] 582. Con el catálogo sin ninguna meta creada todavía, Ajustes → Vida
  **no** muestra ninguna fila de metas — no se ofrece crear una desde aquí.
- [ ] 583. Estados: a 375 px, la fila de los siete botones de días no
  produce scroll horizontal, en ninguna de las dos secciones de Ajustes
  (horario del día + metas).
- [ ] 584. `typecheck` limpio; lint y tests no peores que la línea base de
  `ENVIRONMENT.md` en los dos repositorios.

*El rojo que no era rojo, y la hora que sobraba (tajada 5 — solo front, sin
migración). Pedida por el usuario la noche del **2026-09-22** usando la app,
con prioridad sobre la tajada 4. No pasó por el analista: la escribo yo, el
constructor, a partir de su encargo, y por eso va marcada como tal.*

**Sus palabras, sin reinterpretar:** «el semáforo quedó inverso… creo que
completé al menos un 80 % de mi jornada, debería ser naranja o verde (80 % me
parece bien), eso es bueno, trabajé un buen tiempo» · «quiero remover ese
cálculo de "a qué hora terminaría mi jornada", no lo veo necesario… solo con
saber cuánto me quedó faltando es suficiente».

**Lo que pasó:** cabecera «→ 22:00», arco en rojo, dentro «TE FALTAN 51m»,
debajo «Llevas 7 h 9 min. A este ritmo paras a las 23:59.», pasadas las 23:00.
La aritmética era correcta —`fitMinutes = (22:00 − 23:0x) − 51m ≈ −2 h` →
`over`—, pero el color **solo miraba el reloj que queda por delante y nunca lo
que ya llevas hecho**: a las 23:00, con el día acabado a las 22:00, «ya no
cabe» es cierto e inútil, y se leía como un veredicto sobre una jornada de
7 h 09.

- [ ] 585. El **rojo** exige **dos** cosas a la vez: que lo que falta ya no
  quepa (`fitMinutes < 0`) **y** que el día vaya a acabar por debajo del
  **80 %** de la meta. «Lo mejor a lo que puede acabar el día» es
  `workedMinutes + max(0, dayEnd − ahora)`. Si ya no cabe pero el día acaba en
  el 80 % o más, el arco es **naranja**.
- [ ] 586. El caso literal del usuario —meta de 480, día hasta las 22:00, son
  las 23:05, lleva 429 minutos (89 %)— el arco es **naranja**, no rojo.
- [ ] 587. El **verde no cambia**: sigue siendo `fitMinutes >
  GOAL_FIT_OK_MARGIN_MINUTES` y nada más. Verde en este módulo afirma
  «todavía da para la meta entera», y a las 23:00 con un 89 % eso sería
  mentira. Una mañana con cero trabajado sigue siendo verde.
- [ ] 588. **Las 20:00 con casi nada registrado siguen en rojo** (0 o 30
  minutos de 480, con el día hasta las 23:00): es el momento en el que el rojo
  sirve, y si se vuelve naranja la tajada 2 está rota.
- [ ] 589. Ni «A este ritmo paras a las H» ni «Si arrancas ahora, acabarías a
  las H» aparecen en ninguna parte del arco: ni a la vista, ni en el nodo de
  1×1 px, ni en ningún atributo. **No se toca**: el arco de meta cruzada sigue
  enseñando dentro la hora a la que la cruzaste («PASASTE LAS 8H / A LAS
  17:55» y su frase), y el día pasado sigue con «Registraste X de Y» y «No hay
  nada registrado de Y ese día».
- [ ] 590. El arco **no se queda mudo**: en el estado «te faltan» sigue
  habiendo **un solo** nodo de texto real que dice lo que el SVG dibuja (el
  SVG es `aria-hidden`), sin reintroducir por la puerta de atrás la hora que
  el usuario quitó.

**Tajadas:**

| # | Qué hace | Estado |
|---|---|---|
| 1 | **Lo que falta, dentro del arco.** Cambia qué se pinta como número grande cuando la meta no está cruzada, y hace visible la hora que antes estaba dentro. Solo front, sin migración: corrige la confusión original del usuario de inmediato. Criterios 559–565. | **accepted** |
| 2 | **El semáforo, lectura B.** El color verde/naranja/rojo según si da tiempo hoy, usando un dato que `VidaDayBudget` ya calcula. Solo front, sin migración; usable sin depender de la tajada 1 (aunque tiene más sentido junto a ella). Criterios 566–574. | **accepted** (2.ª vuelta) |
| 3 | **Solo los días laborables.** Migración en el API, filtro del arco y la pregunta por día de la semana, y la fila de días en Ajustes → Vida. La única que toca el backend. Criterios 575–584. | **partida en la sección 2**: la 3 (575–580, camino de lectura) **accepted**; los 581–583 van en la 4, pending |
| 5 | **El rojo solo si el día acaba corto, y fuera la proyección de la hora.** Pedida por el usuario la noche del 2026-09-22 usando la app: el semáforo salía rojo a las 23:00 con 7 h 09 de 8 h hechas, y la frase de «a este ritmo paras a las…» le sobraba. Va **antes** de la 4. Criterios 585–590; **supera el 560**. | **accepted** |

Tres tajadas: la 1 es la más barata y la más urgente —es literalmente lo que
el usuario no entendió—, y no depende de nada; la 2 añade una capa visual
sobre la misma pieza, también sin backend; la 3 es la única con migración y
la que más cuesta, y puede ir última sin que las otras dos pierdan sentido —
un lunes normal ya se lee bien con solo las tajadas 1 y 2 construidas, y el
usuario seguiría viendo el arco el sábado hasta que la 3 llegue.

**¿Arquitecto? Sí**, por tres razones:

1. **Toca el API en otro repositorio** (`xavi-platform-node`): `vida_goals`
   gana una columna nueva, hace falta una migración y una mutación para
   escribirla (o extender la que ya existe). No encontré ningún precedente en
   ese repo de cómo se guarda un conjunto de días de la semana (busqué con
   `Grep`): alguien tiene que fijar la forma —máscara de bits, array de
   enteros, siete booleanos— y no soy yo quien debe elegirla (ver D3).
2. **Cruza dos componentes que hoy no se hablan.** El semáforo necesita un
   dato que hoy vive y se calcula en `VidaDayBudget`/`getDayBudget`
   (`remainingMinutes`, `dayEnd`) dentro de `vida-goals.utils.ts`, que hoy
   solo conoce `nowMinutes`. Verifiqué que los dos ya conviven en
   `VidaHoyPage.tsx` sin consulta nueva, pero alguien tiene que decidir si el
   dato viaja como prop nueva a `buildGoalArcs` o si el semáforo se calcula
   fuera de esa función, en la página.
3. **Es la primera vez que el front edita una meta.** FEAT-016 dejó explícito
   que no había ninguna pantalla para tocar una meta ya creada («no hay UI
   para editarla en esta feature»); esta feature abre esa puerta, aunque sea
   solo para los días. Hace falta decidir la mutación nueva (o extender
   `activityCategoryGoalSet`), y cómo `VidaAjustesPage` —que hoy solo lee y
   escribe horario, nunca metas— llega a saber qué metas existen sin la
   consulta `vidaGoals` que hoy no se usa desde ningún sitio.

**Decisiones que no son mías:**

- **D1 — los umbrales exactos del semáforo** (más de 60 min de margen =
  verde, entre 0 y 60 = naranja, negativo = rojo). Es lo que **propone** el
  render; el usuario no lo confirmó palabra por palabra, solo aprobó la
  lectura B frente a la A. Opciones: aceptar el umbral de 60 minutos tal
  cual, o afinarlo (por ejemplo, un umbral relativo a lo que falta en vez de
  un número fijo de minutos). Consecuencia de no decidirlo antes de construir:
  quien construya fija un número por su cuenta y puede no ser el que el
  usuario tenía en la cabeza.
- **D2 — los días laborables por defecto al crear la meta automática.**
  El render propone lunes a viernes; la alternativa que el propio render deja
  sobre la mesa es arrancar con los **siete** días marcados y que el usuario
  quite los que no trabaja. Con lunes a viernes de partida, un usuario que sí
  trabaja el sábado tiene que ir a Ajustes a añadirlo; con los siete de
  partida, alguien que de verdad no trabaja el fin de semana ve el arco un
  sábado hasta que lo apague. Ninguna de las dos es gratis.
- **D3 — la forma del dato en la migración** (máscara de bits, array de
  enteros 0-6, siete columnas booleanas). Es una decisión técnica, no del
  usuario: la dejo escrita aquí solo para que el arquitecto la fije con su
  razón, no para que se tome sin mirar.
- **D4 — la redacción del criterio 497 de FEAT-016** («Trabajaste Xh Ym.» en
  el texto original, «Registraste 5 h de Trabajo.» en lo construido, porque
  el componente no sabe que la meta es «trabajo»). Es una enmienda que el
  revisor de FEAT-016 propuso y el usuario no ha contestado todavía. No
  bloquea esta feature —el caso de día pasado no se toca aquí— pero la traigo
  para que no se quede perdida en el histórico del board.

**Con qué features se toca** (constriñe el orden):

- **FEAT-016 — El arco de trabajo (delivered).** Esta feature la modifica
  directamente: ver la lista de criterios enmendados arriba. No se puede
  construir sin haber leído esa sección 1 entera (ya lo dice el encargo, y lo
  hice).
- **FEAT-012 — La noche (specified, en cola).** Sigue sin compartir tabla ni
  columna con esta feature (el objetivo y ahora los días viven en
  `vida_goals`, no en `user_settings`). Si algún día «Sueño» quiere su propio
  arco, la columna de días laborables de esta feature es justo lo que le
  permitiría marcar los siete días desde el principio (ver el render, panel
  «Dónde se elige»), pero esa meta sigue sin existir hasta que llegue esa
  feature.

**¿Hace falta render?** No, ya existe y está aprobado:
`docs/vida/assets/20-vida-arco-lo-que-falta.html`. Cubre las tres cosas con
antes/después, comparte el mismo día y las mismas horas en las dos lecturas
del semáforo para que se vean los colores opuestos, y dibuja el sábado sin
arco. La fila de Ajustes → Metas está en el render pero marcada ahí mismo
como «para enseñarte que esto no es una pantalla nueva», no como una
maqueta final del formulario completo — quien construya la tajada 3 necesita
mirar ese panel para la forma, no inventar un formulario de edición de meta
más grande que lo que pide el criterio 581.

## 2. El plan — feature-architect

**Resumen para quien construya:** no se crea ninguna pieza nueva en las tajadas
1 y 2: se modifica `toArc()` dentro de
`src/features/vida/utils/vida-goals.utils.ts` y se cambia **una clase** en
`VidaGoalArc.tsx`; el arco sigue siendo tonto. La implementación de referencia
de la tajada 3 es **`vida_items.days`, la lista de días de la plantilla,
entera de punta a punta** (migración 058 → SDL → validador → servicio → tipo
del front → botones L-M-X-J-V-S-D de `VidaActivitySheet`): el repositorio
**sí** tiene precedente de «qué días de la semana», tres veces, y esta feature
lo copia en vez de inventar nada. **Lo que no hay que crear:** ni formateador,
ni componente de arco, ni selector de días compartido, ni la consulta
`vidaGoals` — las metas siguen llegando dentro del catálogo de categorías.

### Lo que ya existe

#### Corrección a la sección 1: el precedente de «días de la semana» SÍ existe

El analista buscó sin `Bash` y concluyó que no había ninguno. Lo hay, y en el
propio módulo Vida:

| Qué | Dónde | Qué significa aquí |
|---|---|---|
| **`vida_items.days TEXT[] NOT NULL`** + `CHECK (cardinality(days) >= 1)` | `xavi-platform-node/migrations/058_vida_items.sql:9,16` | **Es el molde exacto.** La plantilla de Vida ya guarda un conjunto de días como array de texto. |
| `routines.days_of_week TEXT[] NOT NULL DEFAULT '{}'` + índice GIN | `migrations/008_create_routine_tables.sql:7,30` | Segundo precedente, otro módulo, misma forma. |
| `day_of_week VARCHAR(10) CHECK (… 'monday'…'sunday')`, **una fila por día** | `migrations/032_create_weekly_routine_tables.sql:28`, `039_quarter_week_schedule.sql:8` | Es la forma de un **horario con carga por día**, no la de un conjunto plano. Se descarta aquí (ver «Dónde NO va»). |
| **`enum VidaDayOfWeek { monday … sunday }`** ya declarado en el SDL del módulo | `src/graphql/modules/vida/vida.schema.ts` (arriba del todo, sobre `type VidaItem`) | El tipo GraphQL **ya existe y está en el mismo módulo**: la columna nueva no estrena vocabulario. |
| `daysArray` de Zod: `z.array(vidaDayOfWeek).min(1).max(7).refine(sin duplicados)` | `src/validators/schemas/vida.schemas.ts:27-33` | Se **reutiliza tal cual** para el input nuevo. No se escribe ningún validador de días. |
| `VidaDayOfWeek`, `VIDA_DAY_ORDER`, `VIDA_DAY_SHORT_LABELS` (L M X J V S D), `VIDA_DAY_LABELS`, `getVidaDayOfWeek(date)` | front: `src/features/vida/types/vida-item.types.ts:13`, `src/features/vida/utils/vida-date.utils.ts:57,68,79,108` | El front ya sabe pasar de `YYYY-MM-DD` al día de la semana **en el mismo vocabulario que la columna**. No se escribe ese cálculo otra vez. |
| **La fila de siete botones de días, ya construida** | `src/features/vida/components/VidaActivitySheet/VidaActivitySheet.tsx` (bloque de la plantilla: `<button aria-pressed={isOn} aria-label={VIDA_DAY_LABELS[day]}><span aria-hidden>{VIDA_DAY_SHORT_LABELS[day]}</span></button>`, con `disabled={isMutating}` y un `<p role="alert">` de error debajo) | Es el criterio 581 ya resuelto en otro sitio: se copia el marcado y los estilos, no se diseña. |

**Hallazgo de duplicación, para que no se pierda:** esa fila de siete botones
existe **al menos tres veces** — `VidaActivitySheet.tsx`,
`VidaTemplateAddPanel.tsx` y `VidaStartingPoints.tsx`, las tres consumiendo
`VIDA_DAY_SHORT_LABELS`. Ajustes → Vida sería la cuarta. **No se extrae aquí**
un `VidaDayToggleRow` compartido: es otra tarea con su propio expediente (y
tendría que absorber los estados propios de cada una: el `isFlagged` de la
hoja, el aviso de la plantilla). Queda escrito como deuda medida, no como algo
que nadie vio.

#### En el front, lo que esta feature toca

| Qué | Dónde | Qué significa |
|---|---|---|
| **La aritmética del arco**, entera | `src/features/vida/utils/vida-goals.utils.ts` — `buildGoalArcs()` y `toArc()` (la cascada `if (day.isPastDay \|\| stopAtTime === null) … else if (passedAtTime !== null) … else if (workedMinutes === 0) … else`) | Aquí se escriben las tres tajadas. `toSessionSpans`, `passedAtOf`, `canProject` y la distinción `isPastDay` **no se tocan**. |
| **El arco tonto** | `src/features/vida/components/VidaGoalArc/VidaGoalArc.tsx` + `VidaGoalArcRow.tsx` + `VidaGoalArc.module.scss` | Recibe `arc` ya calculado, no llama a ningún hook y no muta nada. **Esa garantía de FEAT-016 se mantiene en las tres tajadas.** |
| El `<p className={styles.srLine}>{arc.line}</p>` | `VidaGoalArc.tsx`, al final del `<article>` | Es **un solo nodo** hoy, 1×1 px. El criterio 560 lo quiere visible **solo** en el estado «te faltan»: se cambia la clase, no se añade un `<p>`. Eso cierra el 564 de paso. |
| El dato del final del día | `src/features/vida/utils/vida-agenda.utils.ts` → `getDayBudget({ agenda, dayEnd, nowMinutes })`, `remainingMinutes = nowMinutes === null ? null : max(0, parseTimeToMinutes(dayEnd) − nowMinutes)` | **Ojo: está topado en 0.** El semáforo necesita el margen **con signo**, así que no se consume `remainingMinutes` (ver «El cruce», abajo). |
| Las dos llamadas, ya vecinas en la misma página | `VidaHoyPage.tsx`: `getDayBudget({ agenda, dayEnd: dayHours.endTime, nowMinutes })` y, unas líneas más abajo, el `useMemo` de `buildGoalArcs({ followUps: dayFollowUps, date, nowMinutes, categories, isPastDay: isPast })` | El cruce es **cablear un dato que ya está en el ámbito**: `dayHours.endTime` (de `useVidaDayHours`). Ninguna consulta nueva. |
| La pregunta | `src/features/vida/components/VidaGoalPrompt/VidaGoalPrompt.tsx` y su rama en `VidaHoyPage.tsx` (`goalArcs.arcs.length === 0 ? <VidaGoalPrompt …/> : <VidaGoalArcRow …/>`) | Hoy la pregunta y el arco ya salen de **una sola expresión**. La tajada 3 mantiene esa propiedad (ver «Dónde vive la condición del sábado»). |
| La meta dentro de la categoría | `src/features/vida/types/vida-goal.types.ts` (`VidaGoal`), `types/activity-category.types.ts:12-13` (`goalId`, `goal`), y las sub-selecciones `goal { … }` de **los cinco documentos** de `src/features/vida/graphql/activity-categories.graphql.ts` | `activeDays` entra en el tipo y en **las cinco** sub-selecciones, o la meta llegará sin días en alguno de los caminos. |
| La mutación que ya escribe el puntero | `hooks/useActivityCategories.ts` → `useSetActivityCategoryGoalMutation()`, `api/activity-categories.api.ts` → `setActivityCategoryGoal()`, invalidación con `invalidateActivityCategoryQueries` (`utils/invalidate-vida-queries.ts`) | Es el molde literal del hook nuevo de la tajada 4, **y su invalidación se reutiliza**: al volver el catálogo, el arco se repinta sin recargar. |
| Ajustes del módulo | `src/features/vida/pages/VidaAjustesPage.tsx` (+ `.module.scss`, `.test.tsx`) | Hoy **solo** el horario del día. La fila de metas es una `<Card>` más en esta misma página, no una pantalla nueva. |
| El contrato GraphQL vendorizado | `src/features/vida/graphql/schema/vida.schema.graphql` + `src/features/vida/graphql/contracts.test.ts` (lista de documentos, L50-58 y L77-82) | Si el SDL del API cambia, **nadie lo compara solo**: se recopia a mano y el documento nuevo entra en la lista del test. |

#### En el API (`~/Developer/xavi-platform-node`), lo que esta feature toca

| Qué | Dónde | Qué significa |
|---|---|---|
| La tabla de metas | `migrations/069_vida_goals.sql` (la escribió el usuario; último número usado hoy) | La columna nueva va en una migración **aparte**, `070_…`: la 069 **ya corrió en producción** (`ENVIRONMENT.md`: un push a `main` migra con el job de Cloud Run) y una migración desplegada no se edita. |
| El servicio de metas | `src/services/vida-goal.service.ts` — `GoalRow`, `mapGoal()`, `ensureDefaultGoal()` (upsert `ON CONFLICT (user_id, slug) DO UPDATE`), `getOwnedGoalRowOrThrow()`, `listGoals()`, `getGoalById()`, `setCategoryGoal()`, export `vidaGoalService` | El `INSERT` de `ensureDefaultGoal` **no lista** la columna nueva: con `DEFAULT` en la migración, la meta automática nace con lunes-a-viernes **sin tocar esa función**. |
| El SDL y los resolvers | `src/graphql/modules/vida/vida.schema.ts` (`type VidaGoal`, `extend type ActivityCategory { goalId, goal }`, `activityCategoryGoalSet`), `vida.resolvers.ts` (resolver de campo `ActivityCategory.goal` con `requireAuth`, y `withValidatedResolver` para las mutaciones) | El módulo `vida` **ya está registrado** en `schema.ts`/`resolvers.ts`: la mutación nueva no añade ninguna línea de registro. |
| Los validadores | `src/validators/schemas/vida.schemas.ts` — `vidaGoalCategorySetInputSchema` (L88-92, **sin `.refine`**), `daysArray` (L27-33) | Ver «La trampa del `.refine`», abajo. |
| Los tests del API a imitar | `tests/unit/services/vida-goal.service.test.ts` (`describe('VidaGoalService')`, mock de `getDbPool` y de `connect()`), `tests/unit/validators/vida.schemas.test.ts` | El servicio nuevo tiene vecino directo. **No hay tests de resolvers de vida** (`tests/unit/graphql/resolvers/` solo tiene expense y wallet): no se estrena uno aquí. |

**Lo que NO existe, dicho explícitamente:** no hay **ninguna** mutación que
edite una meta (`vidaGoalService` solo expone `listGoals`, `getGoalById` y
`setCategoryGoal`); `listGoals`/`vidaGoals` **sigue sin consumidor** en el
front y esta feature no lo estrena; no hay ningún color de estado en el arco
(el `--vida-goal-color` de hoy es el color **de la meta**, no un semáforo); y
no hay ninguna función que cruce el presupuesto del día con las metas — el
grafo lo confirma: el camino más corto entre `getDayBudget()` y
`buildGoalArcs()` son **4 saltos** y pasa por `parseTimeToMinutes()`, es decir,
no se hablan.

### Implementación de referencia

**`vida_items.days`, de punta a punta.** Es la que hay que abrir y copiar,
porque hace *exactamente la misma figura* que la tajada 3: una entidad de Vida
que guarda un conjunto de días de la semana, lo publica por GraphQL, lo valida
y lo deja tocar con botones:

1. `xavi-platform-node/migrations/058_vida_items.sql:9,16` — `days TEXT[] NOT NULL` + `CHECK (cardinality(days) >= 1)`.
2. `src/graphql/modules/vida/vida.schema.ts` — `enum VidaDayOfWeek`, `days: [VidaDayOfWeek!]!` en `VidaItem`, y `days: [VidaDayOfWeek!]` en `VidaItemUpdateInput`.
3. `src/validators/schemas/vida.schemas.ts:27-33,45,56` — `daysArray`, reutilizado por create y update.
4. `src/services/vida.service.ts` — el `UPDATE … SET days = $n` y el mapeo de la fila.
5. Front: `src/features/vida/types/vida-item.types.ts:13,26` y la fila de botones de `VidaActivitySheet.tsx`.

**Por qué esa y no otra:** está viva, es del mismo módulo, la escribió la misma
cadena de features y **ya resolvió cada decisión que la tajada 3 tiene delante**
(tipo de columna, enum compartido, mínimo de un día, marcado accesible de los
siete botones). Copiarla cuesta menos que discutirla.

Para las tajadas 1 y 2 la referencia no es un módulo nuevo: es **el propio
`VidaGoalArc`** y su vecino de arriba `src/features/vida/components/VidaDayBudget/`
(la referencia que fijó FEAT-016 y que no cambia: componente tonto, todo
calculado fuera, proporciones por variable CSS).

### D3, resuelta: la forma del dato

**`vida_goals.active_days TEXT[] NOT NULL DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday']::TEXT[]`,
con `CHECK (cardinality(active_days) >= 1)`.**

- **Array de texto y no máscara de bits ni siete booleanos**: es lo que ya hace
  el módulo (058) y lo que hace el repositorio (008); se lee en `psql` sin
  descifrar nada; el front ya habla ese vocabulario (`VidaDayOfWeek`), así que
  no hay traducción en ningún borde; y el enum de GraphQL ya está escrito. Una
  máscara de bits obligaría a un traductor en el servicio y otro en el front, y
  dejaría el dato ilegible en la base para siempre a cambio de nada.
- **`active_days` y no `work_days`**: la meta es genérica (el render dibuja
  «Sueño» con los siete días). Ninguna columna del modelo dice «trabajo».
- **`NOT NULL` con `DEFAULT` de lunes a viernes** — esto es lo que responde a
  «qué pasa con las filas que ya existen en producción»: añadir una columna
  `NOT NULL` **con** `DEFAULT` rellena las filas existentes con ese valor en el
  mismo `ALTER TABLE` (Postgres no reescribe la tabla desde la 11). La meta
  «Trabajo» que el usuario ya tiene creada **amanece con lunes a viernes
  marcados**: nadie se queda sin arco el lunes siguiente, y no hace falta
  ningún `UPDATE` de relleno ni un despliegue en dos pasos.
- **El `DEFAULT` se queda en el esquema, no se borra después**: es lo que hace
  que `ensureDefaultGoal()` —cuyo `INSERT` no lista la columna— siga creando
  metas correctas sin tocar esa función, que es la que tiene el upsert
  anticarrera dentro. Cambiar el valor por defecto el día de mañana es un
  `ALTER COLUMN … SET DEFAULT`, una línea.
- **`CHECK (cardinality >= 1)`** (y `daysArray.min(1)` en Zod, que ya lo
  impone): una meta con cero días es un arco que desaparece para siempre sin
  que nada lo explique. Para quitar el arco ya existe el camino bueno —
  desapuntar la categoría. El front bloquea el último botón encendido; **cómo
  se avisa de eso se copia de `VidaActivitySheet`**, que ya tiene ese caso
  resuelto con su `daysError` en un `<p role="alert">`.
- **Índice: ninguno.** No se filtra por días en SQL; el filtro es del front,
  sobre un puñado de metas por usuario. El GIN de `routines` está ahí porque
  `routine.service.ts:152` hace `$n = ANY(r.days_of_week)`; aquí nadie lo hace.

**D2 queda servida por el `DEFAULT`** (lunes a viernes), que es lo que el
usuario contestó.

### El cruce que hoy no existe: por dónde viaja el dato del semáforo

**Regla que no se rompe:** `VidaGoalArc` recibe el arco ya calculado y no llama
a ningún hook (garantía de FEAT-016), y `vida-goals.utils.ts` no importa nada
de presentación. Las dos se cumplen con esto:

1. **Quién lo tiene:** `VidaHoyPage.tsx`, en `const { dayHours } = …`
   (`useVidaDayHours`). `dayHours.endTime` es un `'HH:mm'` y ya viaja desde esa
   misma página a `getDayBudget({ …, dayEnd: dayHours.endTime, … })` y a
   `buildDayExecution({ …, dayEnd: dayHours.endTime, … })`.
2. **Quién lo recibe:** `buildGoalArcs`, con **un campo más en
   `BuildGoalArcsInput`**, del mismo nombre y el mismo tipo que ya usan sus dos
   vecinas:

   ```ts
   export type BuildGoalArcsInput = {
     followUps: ActivityFollowUp[]
     date: string
     nowMinutes: number | null
     categories: ActivityCategory[]
     isPastDay: boolean
     /** `'HH:mm'` en que termina el día del usuario. Mismo dato que recibe `getDayBudget`. */
     dayEnd: string
   }
   ```

   En la página: añadir `dayEnd: dayHours.endTime` a la llamada y
   `dayHours.endTime` a las dependencias del `useMemo` de `goalArcs`.
   `parseTimeToMinutes` se importa de `@/features/vida/utils/vida-time.utils`,
   de donde `vida-goals.utils.ts` ya importa otras cuatro funciones.
3. **Qué sale:** tres campos nuevos en `VidaGoalArc` (el tipo del arco), no un
   objeto aparte:

   ```ts
   /** Lo que falta para la meta. 0 si ya se cruzó. */
   missingMinutes: number
   /** Margen con signo: (dayEnd − ahora) − missingMinutes. `null` fuera de la ventana del semáforo. */
   fitMinutes: number | null
   /** El semáforo. `null` = sin color (meta cruzada, día pasado, día futuro). */
   fitLevel: 'ok' | 'tight' | 'over' | null
   ```

   y una constante exportada **para que D1 sea una línea**:
   `export const GOAL_FIT_OK_MARGIN_MINUTES = 60`.
   `fitLevel` se calcula **solo** en la misma rama que ya produce «te faltan»
   (el `else` final y el `workedMinutes === 0` de `toArc`): en las otras dos
   ramas vale `null`, y con eso salen solos los criterios 571, 573 y 562.
4. **Quién lo pinta:** `VidaGoalArc.tsx` pone
   `data-fit={arc.fitLevel ?? undefined}` en el `<article>` que ya existe, y
   `VidaGoalArc.module.scss` colorea `.valuePath` (y el punto, si el
   constructor lo añade) con `[data-fit='ok' \| 'tight' \| 'over']`. **Ni una
   palabra nueva en el texto** (criterio 572), y el `<article>` sigue
   localizándose por `role="article"` con el nombre de la meta: los tests de
   página no se mueven por esto.

**Por qué no se pasa `budget` ni `budget.remainingMinutes`:** (a) está topado
en `max(0, …)`, así que después de la hora de fin el margen mentiría; (b)
`DayBudget` se calcula a partir de `agenda`, y el arco de una meta no depende
del plan del día — atarlos obligaría a construir una agenda entera en cada test
de `vida-goals.utils.test.ts`, que hoy son de datos mínimos; (c) `dayEnd` es
**el mismo nombre y el mismo formato** que ya reciben `getDayBudget` y
`buildDayExecution`: no se estrena vocabulario.

### Dónde vive la condición del sábado (que la pregunta y el arco no puedan divergir)

**En `buildGoalArcs`, y en ningún otro sitio.** La página no vuelve a preguntar
por el día de la semana: recibe las dos respuestas del mismo objeto.

En `vida-goals.utils.ts`:

```ts
/** Con qué días nace una meta y contra qué se compara cuando aún no hay ninguna. */
export const DEFAULT_GOAL_ACTIVE_DAYS: readonly VidaDayOfWeek[] = VIDA_DAY_ORDER.slice(0, 5)

function countsOn(activeDays: readonly VidaDayOfWeek[], date: string): boolean {
  return activeDays.includes(getVidaDayOfWeek(date))
}
```

`buildGoalArcs` descarta del `Map` de tallies las metas cuyo `activeDays` no
incluye el día de `date` (antes de sumar nada), y **devuelve además**:

```ts
export type VidaGoalArcs = {
  arcs: VidaGoalArc[]
  noDataMinutes: number
  noDataLabel: string
  /**
   * Si este día admite la pregunta «¿Cuál de estas es tu trabajo?». `false` un
   * día no laborable: el mismo dato que esconde el arco esconde la pregunta,
   * y por eso no pueden divergir.
   */
  promptAllowed: boolean
}
```

`promptAllowed = countsOn(DEFAULT_GOAL_ACTIVE_DAYS, date)` cuando no hay
ninguna meta en el catálogo; cuando **sí** hay metas pero ninguna cuenta hoy,
`false`. En `VidaHoyPage.tsx`, la rama de hoy
(`goalArcs.arcs.length === 0 ? <VidaGoalPrompt … /> : <VidaGoalArcRow … />`)
pasa a `goalArcs.arcs.length === 0 ? (goalArcs.promptAllowed ? <VidaGoalPrompt … /> : null) : …`.
**El `VidaGoalPrompt` no recibe ninguna fecha** y sigue sin saber qué día es:
la condición no se reparte entre dos componentes. La prueba de que no divergen
es un test de la util, barato: «un sábado, `arcs` está vacío **y**
`promptAllowed` es `false`» (criterios 576, 578, 580 en una sola aserción).

### La primera edición de una meta: la mutación

**Se crea una mutación nueva, `vidaGoalDaysSet`, y no se extiende ninguna.**

```graphql
"""Cambia los días en que una meta cuenta. Devuelve la meta entera."""
vidaGoalDaysSet(input: VidaGoalDaysSetInput!): VidaGoal!

input VidaGoalDaysSetInput {
  goalId: ID!
  activeDays: [VidaDayOfWeek!]!
}
```

**Comprobado lo que pide el encargo — aquí la trampa del `.refine` no se
repite, y por tres razones medidas:**

1. **No hay nada que extender.** `vidaGoalService` no tiene ninguna mutación de
   edición de meta: `activityCategoryGoalSet` escribe el **puntero de la
   categoría**, no campos de la meta. Meter los días ahí sería meter un campo
   de la meta en la mutación de la categoría, que es exactamente el error que
   FEAT-016 evitó al revés.
2. **El `.refine` que mordió sigue vivo, pero en otra puerta:**
   `activityCategoryEditInputSchema` (`src/validators/schemas/activity.schemas.ts:135-152`,
   «At least one field is required to update»). Esta feature **no lo toca**.
   `vidaGoalCategorySetInputSchema` (`vida.schemas.ts:88-92`) **no tiene
   `.refine`**.
3. **El input nuevo no puede caer en la trampa aunque alguien lo copie mal:**
   sus dos campos son **obligatorios**, así que no hay «entrada que solo lleva
   un campo» que rechazar. La validación reutiliza `daysArray`
   (`vida.schemas.ts:27-33`), que ya impone mínimo uno, máximo siete y sin
   duplicados — y sus mensajes ya están probados en
   `tests/unit/validators/vida.schemas.test.ts`.

Devuelve `VidaGoal!` (no la categoría) porque el dato que cambia es de la meta;
el front no lo escribe en caché a mano: invalida
`vidaKeys.categories.list()` con `invalidateActivityCategoryQueries`, el
catálogo vuelve con `goal.activeDays` nuevo y el arco aparece o desaparece sin
recargar — el mismo mecanismo del criterio 501 de FEAT-016.

**Autorización:** `getOwnedGoalRowOrThrow(client, goalId, userId)` **ya existe**
en `vida-goal.service.ts` y lanza `NotFoundError`/`ForbiddenError`. La mutación
nueva es: `getOwnedGoalRowOrThrow` → `UPDATE vida_goals SET active_days = $1
WHERE id = $2 AND user_id = $3 RETURNING *` → `mapGoal`. **Sin transacción**:
es un solo `UPDATE` de una sola fila, no hay `ensure` ni segundo escritor
(`setCategoryGoal` abre `BEGIN` porque son dos escrituras; copiar el `connect()`
aquí sería carga sin motivo).

### Dónde va el código nuevo, archivo por archivo

#### API (`~/Developer/xavi-platform-node`) — solo la tajada 3

- **Nuevo:** `migrations/070_vida_goals_active_days.sql` — **lista `migrations/`
  justo antes de escribir**: hoy el último es el `069`, pero otra sesión puede
  haber tomado el número. Forma: `-- UP` / `-- DOWN` comentado, como la 069.
  `ALTER TABLE vida_goals ADD COLUMN IF NOT EXISTS active_days TEXT[] NOT NULL
  DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday']::TEXT[];` +
  `ALTER TABLE vida_goals ADD CONSTRAINT vida_goals_active_days_not_empty CHECK
  (cardinality(active_days) >= 1);` (el `CHECK` en su propio `ALTER`, para que
  el `DOWN` pueda quitarlo suelto).
- `src/types/services/vida.types.ts` — `VidaGoal` gana `activeDays: string[]`;
  interfaz nueva `SetGoalDaysInput { goalId: string; activeDays: string[] }`,
  al lado de `SetCategoryGoalInput`.
- `src/services/vida-goal.service.ts` — `GoalRow` gana `active_days: string[]`;
  `mapGoal` gana `activeDays: row.active_days`; función `setGoalDays` nueva; se
  exporta en el objeto `vidaGoalService` del final. **`ensureDefaultGoal` no se
  toca** (el `DEFAULT` de la columna hace el trabajo).
- `src/graphql/modules/vida/vida.schema.ts` — `activeDays: [VidaDayOfWeek!]!` en
  `type VidaGoal`; `vidaGoalDaysSet` en el `extend type Mutation`; el `input`
  nuevo junto a `ActivityCategoryGoalSetInput`.
- `src/validators/schemas/vida.schemas.ts` — `vidaGoalDaysSetInputSchema =
  z.object({ goalId: uuidString, activeDays: daysArray })`.
- `src/graphql/modules/vida/vida.resolvers.ts` — un `withValidatedResolver` más
  en `Mutation`, calcado del de `activityCategoryGoalSet` (`requireAuth`,
  `uid(context)`).
- `tests/unit/services/vida-goal.service.test.ts` — casos nuevos dentro del
  `describe('VidaGoalService')`: guarda los días de una meta propia; rechaza la
  meta de otro usuario **antes** del `UPDATE`.
- `tests/unit/validators/vida.schemas.test.ts` — el input nuevo: acepta los
  cinco días, rechaza el array vacío y los duplicados.
- **No se toca:** `schema.ts`, `resolvers.ts` (el módulo ya está registrado),
  `activity-category.service.ts`, `user_settings`, la migración 069.

#### Front (`xavi-habits-webapp`)

- `src/features/vida/utils/vida-goals.utils.ts` — **el archivo de las tres
  tajadas.** Tajada 1: la rama «no cruzada» de `toArc` (`arcValue`,
  `arcCaption`, el discriminador `variant`). Tajada 2: `dayEnd` en el input,
  `missingMinutes` / `fitMinutes` / `fitLevel`, `GOAL_FIT_OK_MARGIN_MINUTES`.
  Tajada 3: el filtro por día, `DEFAULT_GOAL_ACTIVE_DAYS`, `promptAllowed`.
- `src/features/vida/components/VidaGoalArc/VidaGoalArc.tsx` — tajada 1: la
  clase del `<p>` según `arc.variant`. Tajada 2: `data-fit`.
- `src/features/vida/components/VidaGoalArc/VidaGoalArc.module.scss` — `.line`
  (la versión visible del `.srLine`, en el sitio que el render deja para
  `.osub`) y las tres reglas de `[data-fit]`.
- `src/features/vida/pages/VidaHoyPage.tsx` — **tres toques y ninguno más**:
  `dayEnd: dayHours.endTime` en la llamada a `buildGoalArcs` + su dependencia
  en el `useMemo`; y el `goalArcs.promptAllowed ? … : null` en la rama de la
  pregunta. **Ancla por el `useMemo` de `goalArcs` y por el bloque
  `<VidaGoalPrompt … /> / <VidaGoalArcRow … />`, no por número de línea:** hay
  otro constructor en este archivo ahora mismo (FEAT-018 tajada 3).
- `src/features/vida/types/vida-goal.types.ts` — `activeDays: VidaDayOfWeek[]`
  (tajada 3), importando el tipo de `@/features/vida/types/vida-item.types`.
- `src/features/vida/graphql/activity-categories.graphql.ts` — `activeDays` en
  **las cinco** sub-selecciones `goal { … }`.
- `src/features/vida/graphql/schema/vida.schema.graphql` — recopiar a mano el
  SDL del repo hermano (cabecera con fecha y origen), o el `contracts.test.ts`
  validará contra un esquema viejo y dejará pasar un documento roto.
- **Nuevos (tajada 4):** `src/features/vida/graphql/vida-goals.graphql.ts`
  (`VIDA_GOAL_DAYS_SET_MUTATION`), `src/features/vida/api/vida-goals.api.ts`
  (calcado de `setActivityCategoryGoal` en `activity-categories.api.ts`),
  `src/features/vida/hooks/useVidaGoals.ts`
  (`useSetVidaGoalDaysMutation`, calcado de
  `useSetActivityCategoryGoalMutation`, con `invalidateActivityCategoryQueries`
  y `toast.error` con `toErrorMessage`).
- `src/features/vida/graphql/contracts.test.ts` — `import * as vidaGoalDocuments`
  y el módulo dentro de `vidaDocuments`.
- `src/features/vida/pages/VidaAjustesPage.tsx` (+ `.module.scss`) — una
  `<Card>` más bajo la del horario: las metas se derivan del catálogo
  (`useActivityCategoriesQuery()` → `categories.filter(c => c.goal)`,
  deduplicadas por `goal.id`, ordenadas por `orderIndex` y nombre — el mismo
  gesto que hace `buildGoalArcs`). **Sin metas, no se pinta la sección**
  (criterio 582). Los siete botones se copian de `VidaActivitySheet.tsx`.

### Lo que NO hay que crear

- **Ningún componente de arco, ninguna fila nueva en Hoy.** `VidaGoalArc` y
  `VidaGoalArcRow` ya existen y se quedan donde están.
- **Ningún formateador.** `formatDurationFromMinutes` da la forma corta que el
  número grande necesita («4h 30», «8h», «24h»), y ya la usan `workedLabel` y
  `targetLabel`.
- **Ninguna función de día de la semana.** `getVidaDayOfWeek` existe.
- **Ningún selector de días compartido** (ver el hallazgo de duplicación).
- **Ninguna consulta `vidaGoals`.** Las metas llegan dentro del catálogo.
- **Ninguna invalidación nueva.** `invalidateActivityCategoryQueries`.
- **Ningún `role="alert"` ni texto nuevo por el semáforo** (criterio 572).

### Dónde NO va

- **Máscara de bits o siete columnas booleanas** para los días: sin precedente,
  ilegible en la base, y obligaría a traducir en los dos bordes. Descartada
  contra tres precedentes de `TEXT[]`.
- **Tabla hija `vida_goal_days`** (una fila por día, al estilo de
  `weekly_routine_activities` o `week_schedule_slots`): esas guardan **carga por
  día** (una actividad, una franja). Aquí es un conjunto plano que se lee en
  cada render de Hoy; una tabla hija añade un `JOIN` para siete banderas.
- **Los días en `activity_categories`**: lo cerró el usuario (van en la meta) y
  además el modelo lo rechaza — dos categorías apuntando a la misma meta
  podrían contradecirse.
- **Pasar `budget` o `budget.remainingMinutes` a `buildGoalArcs`**: topado en 0
  y atado a `agenda`. Ver «El cruce».
- **Calcular el semáforo en `VidaHoyPage` o dentro de `VidaGoalArc`**: rompe la
  garantía de FEAT-016 (el arco tonto) o empuja aritmética a la página, donde
  solo se puede probar a través del DOM. En la util cuesta un test de tres
  líneas.
- **Extender `activityCategoryEdit` o `activityCategoryGoalSet`** con los días:
  campo de la meta en la mutación de la categoría, y el `.refine` de
  `activity.schemas.ts:135-152` acecha ahí.
- **Editar la migración 069**: ya está desplegada y corrida.
- **Un formulario de edición de meta** (nombre, icono, minutos): fuera de
  alcance por la sección 1.
- **Tocar `user_settings`**: los días son de la meta, no del usuario.

### Las tajadas, con sus archivos

**La 3 se parte en dos, y el resto no se toca.** La 1 y la 2 quedan exactamente
como las cortó el analista — la 1 primero, sola, sin nada del API, porque es lo
que el usuario no entendió en producción. La 3 del analista reunía migración +
mutación + filtro del front + sección nueva de Ajustes: son dos verticales
distintas separadas por **un despliegue del usuario**, y cada una se puede
probar sola. Partida, la 3 entrega el sábado sin arco (que es la queja) sin
arrastrar la pantalla de Ajustes, y la 4 es el camino de escritura, que solo
tiene sentido una vez desplegada la 3. Siguen siendo verticales: la 3 se ve en
Hoy un sábado; la 4, tocando un botón en Ajustes y volviendo a Hoy.

| # | Qué hace | Archivos | Criterios que cierra | Estado |
|---|---|---|---|---|
| 1 | **Lo que falta, dentro del arco.** `arcValue = formatDurationFromMinutes(target − worked)`, `arcCaption = ['Te faltan']` (una línea), y la frase de la hora pasa a **visible** solo en ese estado. Sin API. | `utils/vida-goals.utils.ts` (`toArc`, tipo `VidaGoalArc` + `variant`), `components/VidaGoalArc/VidaGoalArc.tsx` (clase del `<p>` + geometría del render), `VidaGoalArc.module.scss` (`.line`), `utils/vida-goals.utils.test.ts`, `pages/VidaHoyPage.test.tsx` | 559, 560, 561, 562, 563, 564, 565 | **accepted** |
| 2 | **El semáforo, lectura B.** `dayEnd` entra en `buildGoalArcs`; salen `missingMinutes`, `fitMinutes`, `fitLevel`; el arco pinta `data-fit`. Sin API. | `utils/vida-goals.utils.ts` (`BuildGoalArcsInput`, `GOAL_FIT_OK_MARGIN_MINUTES`), `pages/VidaHoyPage.tsx` (la llamada a `buildGoalArcs` y su `useMemo`), `components/VidaGoalArc/VidaGoalArc.tsx` (`data-fit`), `VidaGoalArc.module.scss`, `utils/vida-goals.utils.test.ts`, `pages/VidaHoyPage.test.tsx` (un caso nuevo) | 566, 567, 568, 569, 570, 571, 572, 573, 574 | **accepted** (2.ª vuelta) |
| 3 | **El sábado sin arco (camino de lectura).** Migración 070, `activeDays` en servicio/SDL/tipos, y el filtro por día en la util + la pregunta atada al mismo dato. **Requiere que el usuario haga push y se despliegue** antes de verse. | API: `migrations/070_vida_goals_active_days.sql`, `types/services/vida.types.ts`, `services/vida-goal.service.ts` (`GoalRow`, `mapGoal`), `graphql/modules/vida/vida.schema.ts`, `tests/unit/services/vida-goal.service.test.ts`. Front: `types/vida-goal.types.ts`, `graphql/activity-categories.graphql.ts` (5 sub-selecciones), `graphql/schema/vida.schema.graphql` (recopiar), `utils/vida-goals.utils.ts` (`DEFAULT_GOAL_ACTIVE_DAYS`, filtro, `promptAllowed`), `pages/VidaHoyPage.tsx` (la rama de la pregunta), `utils/vida-goals.utils.test.ts`, `pages/VidaHoyPage.test.tsx` | 575, 576, 577, 578, 579, 580 | **accepted** |
| 4 | **Elegir los días (camino de escritura).** Mutación `vidaGoalDaysSet` y la fila de siete botones en Ajustes → Vida. | API: `graphql/modules/vida/vida.schema.ts` (input + mutación), `validators/schemas/vida.schemas.ts`, `graphql/modules/vida/vida.resolvers.ts`, `services/vida-goal.service.ts` (`setGoalDays`), `tests/unit/validators/vida.schemas.test.ts`, `tests/unit/services/vida-goal.service.test.ts`. Front **nuevos**: `graphql/vida-goals.graphql.ts`, `api/vida-goals.api.ts`, `hooks/useVidaGoals.ts`; **modificados**: `graphql/contracts.test.ts`, `pages/VidaAjustesPage.tsx` (+ `.module.scss`, `.test.tsx`) | 581, 582, 583 | pending |
| 5 | **El rojo exige día corto de verdad, y se va la proyección de la hora.** `toFitLevel` mira también el mejor final posible del día (80 % de la meta); `line` deja de decir una hora y vuelve al `<p>` de 1×1 px. Sin API. **Sin arquitecto: la pidió el usuario esta noche y cae entera dentro de lo que ya existe.** | `utils/vida-goals.utils.ts` (`toFitLevel`, `toArc`, tipo `VidaGoalArc`, `GOAL_FIT_SHORT_DAY_RATIO`), `components/VidaGoalArc/VidaGoalArc.tsx` (la clase del `<p>`), `VidaGoalArc.module.scss` (se va `.line`), `utils/vida-goals.utils.test.ts`, `pages/VidaHoyPage.test.tsx` | 585, 586, 587, 588, 589, 590 (y **supera el 560**) | **accepted** |

**584** (`typecheck` limpio; lint y tests no peores que la línea base **de los
dos repositorios**) se comprueba al cerrar **cada** tajada, no solo la última.

### Qué se rompe al cambiar `arcValue` — los tests

**Hay que mover (son de lo que esta feature enmienda):**

- `utils/vida-goals.utils.test.ts` → `it('la línea principal es una hora, no una
  resta (criterio 492)')` — afirma `arcValue === '16:05'` y
  `arcCaption === ['A este ritmo', 'paras a las']`. Es **el criterio que la
  sección 1 enmienda de fondo**: se reescribe a lo que falta y se le cambia la
  referencia a **559**. Su aserción de `line` (`'Llevas 3 h 40 min. A este ritmo
  paras a las 16:05.'`) **se conserva tal cual**: el 560 conserva la frase, solo
  cambia dónde se ve.
- `utils/vida-goals.utils.test.ts` → `it('con cero minutos el arco aparece vacío
  y la fórmula va en condicional (criterio 495, D-C)')` — el `arcValue` pasa a
  `'8h'` con `arcCaption === ['Te faltan']`; el `line` («Si arrancas ahora,
  acabarías a las 17:00.») **no se toca** (criterio 561).

**No se pueden tocar — son la red de otra cosa:**

- `utils/vida-goals.utils.test.ts`, el test que recorre `arcs[0].arcCaption`
  midiendo cada línea y exige `arcCaption.length <= 2`: **es la red del arreglo
  de ayer** (`10a8fcb`, el rótulo que rozaba el trazo). `['Te faltan']` tiene
  que seguir pasando por ahí; se **añaden** casos, no se relaja el límite.
- `it('pasada la jornada dice el dato y ni un adjetivo (criterio 493)')` y
  `it('en un día pasado …(criterio 497, D-B)')` + `it('en un día pasado que se
  pasó de la meta, la misma frase sin reproche')`: son la red de **«nada de
  culpa»** y los criterios 562/563 dicen que ese caso **no cambia**. Si se
  ponen rojos, el cambio se metió en la rama equivocada de `toArc`.
- `it('… sin dato … (criterio 494)')`, `it('una sesión empezada antes … (D-A)')`,
  `it('las sesiones de otro día no entran')`: red de la aritmética que esta
  feature no toca.
- `it('devuelve un arco por meta, ordenados por orderIndex')`: red del criterio
  574 (cada arco con su color) y de «que hoy haya un solo arco lo garantiza el
  dato, no un tope».
- `it('sin ninguna categoría apuntando a una meta no hay ningún arco')`: red de
  la puerta de la pregunta. La tajada 3 **añade** al lado el caso del sábado; no
  lo sustituye.
- `pages/VidaHoyPage.test.tsx` → el helper `goalArc()`
  (`screen.queryByRole('article', { name: 'Trabajo' })`) y el comentario de
  encima: es **la red del hallazgo de la doble lectura** cerrado en FEAT-016
  tajada 3. No se cambia el localizador. `data-fit` y el cambio de clase del
  `<p>` no lo mueven.
- `pages/VidaHoyPage.test.tsx` → `'Llevas 9 h 10 min. Pasaste las 8 h a las
  17:00.'`, `'Registraste 5 h de Trabajo.'` y, pegada a ella,
  `expect(arco).not.toHaveTextContent('A este ritmo')`: esta última es la red de
  «un día pasado no proyecta». Intocables.
- `pages/VidaHoyPage.test.tsx` → las tres aserciones de `'Llevas 1 h. A este
  ritmo paras a las 16:24.'` **siguen verdes sin tocarlas**, porque `line` no
  cambia y `getByText` encuentra el nodo esté visible o a 1×1 px. **Si alguien
  se ve obligado a editarlas, es la señal de que cambió `line`, que es
  justamente lo que el 560 prohíbe.**

**Trampa de `ENVIRONMENT.md` que aplica a la tajada 4:** los `vi.mock` de
`useActivityCategories` viven en **siete** archivos de test
(`VidaHoyPage`, `VidaCategoriasPage`, `VidaActividadesPage`,
`VidaPlantillaPage`, `VidaArchivadasPage`, `VidaActivitySheet`,
`useActivityCategories.test.tsx`). El hook nuevo va en **otro módulo**
(`useVidaGoals.ts`), así que no los rompe — pero `VidaAjustesPage.test.tsx`
estrena el mock del catálogo y hay que escribirlo entero.

### Cómo se verifica

`docs/features/ENVIRONMENT.md` manda, y **son dos líneas base distintas**: este
repositorio (`pnpm typecheck` limpio, `pnpm lint` 14/0, `pnpm test` 2 fallos de
1866 — el tercero de `IconPicker` es flaky, córrelo aislado — y `pnpm build` al
cerrar) y `xavi-platform-node` (`npx tsc --noEmit` limpio, `npm test` 3 fallos
de 560 y 6 suites en rojo, `npm run lint` **no es puerta**: se compara con
`npx eslint` **solo los archivos tocados**, nunca `lint:fix` a lo ancho).

Hoy está detrás del login y **los agentes no entran**: lo que se puede ver de
verdad es un **arnés temporal** (`.html` + `.tsx` bajo `src/`, `MemoryRouter`,
datos sintéticos) que monte `VidaGoalArc` con los estados del render 20. Hay uno
vivo ahora mismo en el árbol de otro constructor (`harness-feat018.html` +
`src/harness-feat018.tsx`, sin versionar): **es su molde y no se toca**; el
tuyo se llama distinto y se borra antes de reportar. Es la única forma de medir
el criterio 565: **«TE FALTAN 24h» es más ancho que «17:55»**, y el componente
tiene el número a `fontSize="32"` con el rótulo de una línea en `y=70`,
mientras que el render aprobado dibuja ese estado con `font-size="34"` y el
rótulo en `y=66`. Si al medirlo el número roza el trazo, manda el render.

El recorrido real —un lunes con el arco verde, un sábado sin nada, tocar un
botón de día en Ajustes— lo hace el usuario al cerrar cada tajada.

### Lo que este plan no pudo averiguar

- **No corrí `typecheck`, `lint`, `test` ni `build` en ninguno de los dos
  repositorios**: el arquitecto no escribe ni mide código. Las líneas base son
  las de `ENVIRONMENT.md` y se vuelven a medir antes de empezar.
- **No pude comprobar contra la base de Neon** que la meta «Trabajo» del usuario
  exista ni cuántas filas tiene `vida_goals` (está detrás del login y de un
  `DATABASE_URL` que no es mío). Lo que digo sobre las filas existentes se
  sostiene en la semántica del `ALTER TABLE … NOT NULL DEFAULT`, no en una
  consulta: **si `vida_goals` estuviera vacía, el resultado es el mismo** (la
  meta nacería con el `DEFAULT`).
- **No verifiqué el ancho real de «TE FALTAN 24h»** dentro del arco: hace falta
  el navegador con un arnés, y el criterio 565 se cierra ahí, no aquí.
- **D1 y D4 siguen abiertas** y no las cierro: D1 va como constante exportada
  (`GOAL_FIT_OK_MARGIN_MINUTES = 60`) para que cambiarla sea una línea; D4 no
  bloquea nada de estas cuatro tajadas.

## 3. Construcción — feature-builder

### Tajada 1 — Lo que falta, dentro del arco

**Resumen para quien revise:**
1. Dentro del arco ya no va una hora del reloj sino **lo que falta** («TE FALTAN
   4h 30») mientras la meta no se ha cruzado y hay reloj; la hora a la que
   pararías baja a una línea **visible** debajo del arco, con la misma frase
   palabra por palabra. Pasada la meta y en un día pasado no cambia nada.
2. Está en `toArc()` (un discriminador nuevo, `variant`), en la clase del `<p>`
   que ya existía y en la geometría del SVG del estado nuevo. `VidaGoalArc`
   sigue sin llamar a ningún hook.
3. **Lo que más probablemente rompí:** la geometría. Metí `fontSize={34}` y el
   rótulo en `y=66` **solo** para el estado «te faltan», que es lo que dibuja el
   render 20; los otros dos estados se quedan en 32 y 70/58+71. Si el revisor
   mira el arco pasada la meta o en un día pasado y lo ve distinto de ayer, eso
   es un fallo mío, no del plan. El segundo candidato es la línea visible: dice
   la frase **entera** («Llevas 3 h 30 min. A este ritmo paras a las 17:55.»),
   así que «3 h 30 min» se lee ahora dos veces en la tarjeta —arriba en la
   cabecera («3h 30 de 8h») y abajo en la frase—. Es lo que mandan el criterio
   560 y la sección 2, pero el render solo enseña la mitad de atrás de esa
   frase. Lo dejo dicho abajo con su razón.

**Qué se construyó:**

- `src/features/vida/utils/vida-goals.utils.ts`
  - `toArc()`: las dos ramas de «meta sin cruzar, hay reloj, es hoy» pasan a
    `arcValue = formatDurationFromMinutes(targetMinutes − workedMinutes)` y
    `arcCaption = ['Te faltan']`. **`line` no cambia en ninguna de las dos**
    (criterios 560 y 561): ni la del ritmo ni la condicional de cero minutos.
  - El tipo `VidaGoalArc` gana **`variant: 'missing' | 'passed' | 'logged'`**.
    Es el único campo nuevo. `missingMinutes`, `fitMinutes` y `fitLevel` son de
    la tajada 2 y **no** se han adelantado.
  - `toSessionSpans`, `passedAtOf`, `canProject`, `stopAtTime`, `share`,
    `overMinutes` y la distinción `isPastDay`: sin tocar.
- `src/features/vida/components/VidaGoalArc/VidaGoalArc.tsx`
  - El `<p>` sigue siendo **uno solo**; lo que cambia es su clase:
    `arc.variant === 'missing' ? styles.line : styles.srLine` (criterios 560 y
    564). No se añadió ningún nodo de texto.
  - Geometría **solo** del estado `'missing'`: rótulo en `y=66` y número a
    `fontSize=34`, que es lo que dibuja `20-vida-arco-lo-que-falta.html` en su
    segunda columna. Los otros estados siguen en `y=70` (una línea) / `58` y
    `71` (dos) con `fontSize=32`.
- `src/features/vida/components/VidaGoalArc/VidaGoalArc.module.scss`
  - `.line` nueva, con las mismas propiedades que `.sub` (la línea de la sesión
    en marcha, que va justo debajo): es el `.osub` del render. `.srLine` se
    queda tal cual para los otros dos estados.
- `src/features/vida/utils/vida-goals.utils.test.ts`
  - El test del criterio 492 se reescribe al **559** (es el criterio que la
    sección 1 enmienda de fondo) conservando literalmente la aserción de `line`.
  - El del 495 pasa al **561**, con `arcValue === '8h'`; su `line` no se toca.
  - La prueba de anchura del rótulo (la red de `10a8fcb`) **no se relaja**: se
    le añade una columna para la meta y **tres casos** con la jornada de 24 h.
  - `it.each` nuevo de tres casos para los criterios 562 y 563.
- `src/features/vida/pages/VidaHoyPage.test.tsx`
  - El caso «criterios 489, 490 y 492 … dice una hora» se renombra a «489, 490 y
    **559** … dice lo que falta» y gana dos aserciones (`'7h'` y `'Te faltan'`).
    **Las aserciones de la frase no se tocaron**, que es lo que la sección 2
    pedía como prueba de que `line` no cambió.
  - Dos casos nuevos: 560+564 (un solo nodo con la frase, y no es el de 1×1 px)
    y 562 (pasada la meta, dentro sigue la hora y la frase vuelve al lector).

**Por qué así, y qué se descartó:**

- **Por qué la geometría del render y no la de hoy.** El encargo pedía medirlo,
  no razonarlo. Medido con `getComputedTextLength()` en un arnés a 375 px (ver
  abajo), **las dos caben**: con `32`/`y=70` el peor número posible ocupa 94,6
  de 146,5 unidades de cuerda. Lo que decide no es el ancho sino el **aire entre
  el rótulo y el número**: con `32`/`70` quedan **1,46** unidades; con `34`/`66`,
  **4,44**. Mandó el render, que es lo aprobado y lo que arregla justo el
  problema de legibilidad que abrió esta feature.
- **Por qué `34` no se aplica a todo el componente.** Medido: con el rótulo de
  dos líneas (`58`/`71`, el estado «pasaste las 8h»), el número a 34 invade la
  segunda línea — el hueco pasa a **−0,56** unidades. Y los criterios 562 y 563
  dicen que ahí no cambia nada. Por eso va atado a `variant`, no a
  `arcCaption.length`.
- **Por qué un discriminador y no `arcCaption[0] === 'Te faltan'`.** Comparar
  contra una cadena visible ata la presentación a la redacción: cambiar «Te
  faltan» por otra palabra rompería la clase del `<p>` sin que nada avise.
- **Por qué la frase visible va entera.** El render solo enseña «A este ritmo
  paras a las 17:55.», pero el criterio 560 dice «la misma frase que hoy compone
  `arc.line`» y la sección 2 lo blinda: «su aserción de `line` se conserva tal
  cual». Partir la frase habría obligado a cambiar `line`, que es lo que el 560
  prohíbe. **Queda como pregunta para el usuario**, no como algo resuelto: ver
  «Lo que descubrí».

**Verificación** (líneas base de `docs/features/ENVIRONMENT.md`, medidas también
**antes** de empezar en este mismo árbol):

| Qué | Antes | Después |
|---|---|---|
| `pnpm typecheck` | exit 0, limpio | **exit 0, limpio** |
| `pnpm lint` | `✖ 14 problems (14 errors, 0 warnings)` | **`✖ 14 problems (14 errors, 0 warnings)`** |
| `pnpm test` | 2 fallos de 1893 | **`Tests  2 failed \| 1899 passed (1901)`** — los dos de `SearchSelect`, los mismos de la línea base. El total sube en 8 porque esta tajada añade 8 casos. `IconPicker` no salió flaky en esta corrida. |
| `pnpm build` | exit 0, inicial 1.128,43 kB · `app-icons` 620,20 kB | **exit 0**, inicial **1.128,56 kB** (+0,13 kB: un campo y un ternario) · `app-icons` **620,20 kB, sin mover** · `IconPicker` 4,64 kB |

`graphify update .` corrido al terminar (4234 nodos, 5020 aristas).

**La medición del criterio 565, con sus números.** Arnés temporal
(`harness-feat019.html` + `src/harness-feat019.tsx`, **borrados**; `git status`
lo confirma) montando `VidaGoalArcRow` con siete estados sintéticos, a **375 px**
y a **760 px**. La cuerda útil se calcula desde el radio interior **81** y el
centro **(110, 106)**: `cuerda(y) = 2·√(81² − (106−y)²)`, evaluada en la **cima
del `getBBox()`** del número, que es donde el semicírculo es más estrecho.

| Estado | Número | `getComputedTextLength()` | Cuerda a esa altura | Holgura |
|---|---|---|---|---|
| Te faltan (caso del render) | `4h 30` | 82,03 | 145,56 | **+63,53** |
| Te faltan, jornada entera | `8h` | 37,69 | 145,56 | **+107,87** |
| **Jornada de 24 h sin empezar** | `24h` | 56,18 | 145,56 | **+89,37** |
| **El peor caso que existe** | `23h 59` | 100,52 | 145,56 | **+45,03** |
| Pasada la meta (sin cambios) | `14:00` | 76,84 | 146,53 | +69,69 |
| Día pasado (sin cambios) | `5h` | 35,49 | 146,53 | +111,04 |

El peor número posible dentro del arco **no es «24h»** (3 caracteres): es
**«23h 59»** (6), que sale con una meta de 1440 min y un minuto trabajado.
Aun así sobran **45 unidades**, un 31 % de la cuerda. Y el aire vertical entre la
base del rótulo y la cima del número es **4,44** unidades en todos los estados
«te faltan», sea cual sea el número.

Sin scroll horizontal en ninguna de las dos anchuras:
`document.documentElement.scrollWidth === clientWidth` (375 = 375 y 760 = 760), y
`article.scrollWidth` 357 ≤ 359 a 375 px, 742 ≤ 744 a 760 px. La línea visible
en su versión más larga —«Llevas 23 h 59 min. A este ritmo paras a las 23:51.»—
ocupa **una sola línea de 18 px** a las dos anchuras.

**Criterios, uno por uno:**

- **559 — cerrado.** `arcValue` es `targetMinutes − workedMinutes` y
  `arcCaption` es `['Te faltan']`, una sola línea. Evidencia: el test
  «dentro del arco va lo que falta, no la hora (criterio 559)» afirma
  `arcValue === '4h 20'` con 220 min de 480 a las 11:45; en el navegador, con
  210 de 480 a las 13:25, dentro del arco se lee **«TE FALTAN / 4h 30»** — el
  caso exacto de la segunda columna del render.
- **560 — cerrado.** El `<p>` lleva `styles.line` (visible) en ese estado, y
  `line` no cambió ni una coma: el test de la util sigue afirmando
  `'Llevas 3 h 40 min. A este ritmo paras a las 16:05.'`, y las tres aserciones
  de `'Llevas 1 h. A este ritmo paras a las 16:24.'` de `VidaHoyPage.test.tsx`
  siguen verdes **sin tocarlas**. En el navegador la línea mide 18 px de alto
  (visible) frente a 1 px en los otros estados. El test nuevo comprueba que la
  clase de ese nodo **no** contiene `srLine`.
- **561 — cerrado.** Test «con cero minutos faltan las ocho horas enteras»:
  `arcValue === '8h'`, `arcCaption === ['Te faltan']`, y el `line` condicional
  intacto (`'Si arrancas ahora, acabarías a las 17:00.'`). En el navegador,
  «TE FALTAN / 8h».
- **562 — cerrado.** Test de página «criterio 562»: dentro se lee `17:00` con
  el rótulo `Pasaste las 8h`, no aparece «Te faltan», la frase está en un solo
  nodo y su clase **sí** contiene `srLine`. Los tests del criterio 493 (la red
  de «nada de culpa») siguen verdes sin tocarse. En el navegador: `fontSize=32`,
  rótulo en 58/71, `<p>` de 1 px.
- **563 — cerrado.** `it.each` «fuera de «te faltan» el arco no cambia»:
  día pasado sin llegar → `variant 'logged'`, `arcValue '5h'`; día pasado que se
  pasó → `'passed'`, `'17:00'`; ninguno con «Te faltan». El test del criterio
  497 y el `expect(arco).not.toHaveTextContent('A este ritmo')` siguen verdes
  sin tocarse.
- **564 — cerrado.** No hay un segundo `<p>`: es el mismo nodo con otra clase.
  Evidencia literal, en `VidaHoyPage.test.tsx`:
  `expect(within(arco).getAllByText(frase)).toHaveLength(1)` en los dos estados
  (visible y de lector). El SVG sigue `aria-hidden` y el localizador
  `getByRole('article', { name: 'Trabajo' })` **no se movió**.
- **565 — cerrado**, con la tabla de números de arriba. Medido, no razonado.

**Riesgos:**

- **La geometría de los otros dos estados.** Es el sitio donde un despiste se ve
  y nadie lo mide: si `isMissing` se hubiera atado mal, «pasaste las 8h» se
  rompería. Medido en el navegador que sigue en 32 y 58/71 — y medido también
  **por qué** no puede ir a 34 (el hueco se va a −0,56).
- **La frase visible repite «3 h 30 min», que la cabecera ya dice.** No rompe
  nada, pero es ruido que el render no tiene. Ver abajo.
- **No hay mocks que caduquen.** `vida-goals.utils` no está mockeado en ningún
  archivo de test del repositorio (`grep -rn "vi.mock.*vida-goals" src` → vacío)
  y `VidaGoalArc` solo lo consumen `VidaGoalArcRow` y `VidaHoyPage`. El campo
  nuevo es obligatorio, así que cualquier constructor a mano lo habría cazado
  `tsc`; no hay ninguno.
- **Todo está detrás del login y no entré con credenciales.** Lo de arriba se
  midió en un arnés aislado y en los tests; el recorrido real es del usuario.

**Lo que descubrí y no estaba en el plan:**

1. **El peor número no es «24h», es «23h 59».** El criterio 565 fija el caso en
   1440 min → «24h» (3 caracteres). Pero una meta de 1440 con un minuto
   trabajado da «23h 59» (6 caracteres, 100,5 unidades frente a 56,2). Cabe
   igual, pero **el criterio está mal apuntado** y quien lo escriba la próxima
   vez debería apuntar al ancho, no a la meta. No lo reescribo.
2. **El estado «pasaste las 8h» ya venía tocándose, y no es de esta tajada.**
   Con el rótulo de dos líneas y el número a 32, el hueco entre la base de la
   segunda línea (`y=71`) y la cima del número es **0,46 unidades**. No se
   solapan, pero es un cuarto del aire que tiene ahora el estado «te faltan»
   (4,44). Viene de antes de esta feature y **no lo toqué** (criterio 562 dice
   que no cambia). Queda apuntado.
3. **Dos estados de una sola línea con dos geometrías distintas.** «TE FALTAN»
   queda en `y=66`/34 y «REGISTRASTE» (día pasado) en `y=70`/32. Es lo que sale
   de aplicar el render sin tocar el 563, pero es una incoherencia visible si
   alguien compara hoy con ayer en la tira de días. Si molesta, moverlo es una
   línea — pero es una decisión de forma, y **el render 20 no dibuja ese
   estado**, así que no la tomo yo.
4. **Pregunta para el usuario, no resuelta:** la línea visible dice la frase
   entera —«Llevas 3 h 30 min. A este ritmo paras a las 17:55.»— mientras el
   render solo enseña «A este ritmo paras a las 17:55.». La cabecera de la
   tarjeta ya dice «3h 30 de 8h», así que «3 h 30 min» aparece dos veces. La
   construí entera porque el criterio 560 y la sección 2 lo exigen
   explícitamente (y recortarla obligaba a cambiar `line`, que el 560 prohíbe).
   **Si el usuario prefiere el render literal**, es cambiar la rama `'missing'`
   de `line` y ajustar tres aserciones — pero entonces hay que decidir qué pasa
   con lo que el lector de pantalla deja de oír.

**Estado del árbol:** sin commitear. Siete archivos modificados, ninguno nuevo,
ninguno borrado. El arnés temporal está borrado.

### Tajada 2 — El semáforo (lectura B)

**Resumen para quien revise:**
1. El arco **se pinta de verde, naranja o rojo** mientras la meta no se ha
   cruzado y hay reloj, según si lo que falta **cabe antes de que se acabe el
   día** (`margen = (dayEnd − ahora) − lo que falta`), no según el porcentaje
   de la meta. Fuera de esa ventana —meta cruzada, día pasado, día futuro— el
   trazo sigue siendo el color de la meta y **no hay ningún atributo de color**.
2. Está en `toArc()` (`missingMinutes`, `fitMinutes`, `fitLevel` y la constante
   `GOAL_FIT_OK_MARGIN_MINUTES`), en un `dayEnd` nuevo en `BuildGoalArcsInput`
   que la página ya tenía en el ámbito, y en un `data-fit` en el `<article>`
   que el SCSS traduce a `--vida-fit-color`. `VidaGoalArc` sigue sin llamar a
   ningún hook y la util sigue sin importar nada de presentación.
3. **Lo que más probablemente rompí:** el color del trazo. `.valuePath` deja de
   ser siempre `--vida-goal-color` y pasa a `var(--vida-fit-color, --vida-goal-color)`.
   Si el revisor ve un arco de un color raro en un estado **sin** semáforo, eso
   es un fallo mío. Y el segundo, que no es mío pero sale aquí: **el naranja de
   Aura en claro es `#C93400` y el rojo `#BA1A1A` — a tamaño de trazo son casi
   el mismo color** (medido en el navegador, captura en «Lo que descubrí»). El
   semáforo funciona, pero en tema claro el escalón naranja→rojo casi no se ve.

**Qué se construyó:**

- `src/features/vida/utils/vida-goals.utils.ts`
  - `GOAL_FIT_OK_MARGIN_MINUTES = 60`, **exportada** (D1 sigue abierta: cambiar
    el umbral es esta línea y nada más).
  - `BuildGoalArcsInput` gana **`dayEnd: string`** (`'HH:mm'`, obligatorio):
    el mismo nombre y el mismo formato que ya reciben `getDayBudget` y
    `buildDayExecution`. **No** se consume `budget.remainingMinutes`: está
    topado en `max(0, …)` y después de la hora de fin diría que aún cabe.
  - `VidaGoalArc` gana `missingMinutes`, `fitMinutes` (margen **con signo**) y
    `fitLevel` (`'ok' | 'tight' | 'over' | null`).
  - `toFitLevel()`, función nueva de cuatro líneas: `> 60` verde, `>= 0`
    naranja, negativo rojo, y `null` entra y sale igual.
  - El margen se calcula **una vez** (`fitCandidate`, detrás de `canProject`) y
    solo se asigna en las **dos ramas de «te faltan»**. En las otras dos
    `fitMinutes` se queda en `null` — que es como está inicializado.
  - `toSessionSpans`, `passedAtOf`, `canProject`, `stopAtTime`, `share`,
    `overMinutes`, `variant`, `line` y `arcCaption`: **sin tocar**. Ni una
    palabra de texto cambia en esta tajada.
- `src/features/vida/pages/VidaHoyPage.tsx` — **un solo toque**: `dayEnd:
  dayHours.endTime` en la llamada a `buildGoalArcs` y su dependencia en el
  `useMemo`. Anclado por el `useMemo` de `goalArcs`, no por número de línea.
  Ninguna consulta nueva: `dayHours.endTime` ya viajaba a `getDayBudget` 70
  líneas más arriba.
- `src/features/vida/components/VidaGoalArc/VidaGoalArc.tsx` — una línea:
  `data-fit={arc.fitLevel ?? undefined}` en el `<article>` que ya existía. Con
  `null` el atributo **no se escribe**.
- `src/features/vida/components/VidaGoalArc/VidaGoalArc.module.scss` —
  `.valuePath { stroke: var(--vida-fit-color, var(--vida-goal-color)) }` y tres
  reglas `.card[data-fit='…']` que declaran `--vida-fit-color` con
  `--color-success` / `--color-warning` / `--color-danger`.
- `src/features/vida/utils/vida-goals.utils.test.ts` — `DAY_END = '23:00'` y
  `dayEnd` en las 14 llamadas que ya había (el campo es obligatorio a
  propósito: así ningún constructor futuro se lo salta). `describe('el
  semáforo')` nuevo con 8 casos, entre ellos el **570** y los dos bordes.
- `src/features/vida/pages/VidaHoyPage.test.tsx` — 5 casos nuevos: verde, rojo,
  «en rojo el texto es el mismo y no hay ningún aviso» (572), pasada la meta
  sin color (571) y día pasado sin color (573).

**Por qué así, y qué se descartó:**

- **Por qué el color va en el trazo y no en el número ni en la frase.** Es lo
  que dibuja el render 20 (columna «lectura B»: el `stroke` del arco cambia, el
  texto no). Colorear el número grande habría puesto el color **encima de la
  información**, que es justo el paso de «marca visual» a «tono de voz» que el
  criterio 572 prohíbe.
- **Por qué `data-fit` ausente en vez de `data-fit="none"`.** El plan avisaba
  de que si `fitLevel` es `null` en las otras ramas, los criterios 571, 573 y
  562 «salen solos». **Comprobado, y es cierto**, pero solo porque el atributo
  no se escribe: con un valor «neutro» habría una regla que acordarse de no
  poner. Con `undefined`, React no emite el atributo y no hay ninguna regla de
  color que pueda aplicar. Verificado en el DOM:
  `arco.hasAttribute('data-fit') === false` en los dos estados.
- **Por qué el cero de margen es naranja y no rojo.** Margen 0 = cabe, sin un
  minuto de sobra. Es lo que dice el criterio 568 («entre 0 y 60, ambos
  incluidos») y lo que hace que el rojo signifique siempre lo mismo: **hoy ya
  no da**.
- **Por qué `dayEnd` obligatorio y no opcional con respaldo `'23:00'`.** Un
  respaldo escondido en la util habría dejado pasar en silencio a cualquier
  llamador que no lo pase, y el color saldría de una hora inventada. Con el
  campo obligatorio, `tsc` cazó las 16 llamadas del test y la de la página.
- **Por qué no se toca `_theme-variables.scss`.** Ver «Lo que descubrí»: el
  ámbar de Aura no está afinado. Arreglarlo es cambiar un color **de toda la
  app** (lo usan avisos de hábitos, de ajustes y de Vida), y eso no es una
  decisión de esta tajada.

**Verificación** (líneas base de `docs/features/ENVIRONMENT.md`):

| Qué | Línea base | Después |
|---|---|---|
| `pnpm typecheck` | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 errores / 0 avisos | **`✖ 14 problems (14 errors, 0 warnings)`** |
| `pnpm test` | 2 fallos de 1901 | **`Tests  2 failed \| 1918 passed (1920)`** — los dos de `SearchSelect`, los mismos. `IconPicker` no salió flaky. El total sube en 19: los casos nuevos. |
| `pnpm build` | inicial 1.128,56 kB · `app-icons` 620,20 kB | **exit 0**, inicial **1.128,81 kB** (+0,25 kB: tres campos y una función de cuatro líneas) · `app-icons` **620,20 kB, sin mover** · `IconPicker` 4,64 kB |
| `graphify update .` | — | **4237 nodos, 5025 aristas** |

**En el navegador** (arnés temporal `harness-feat019-t2.html` +
`src/harness-feat019-t2.tsx`, **borrados**, `git status` lo confirma): siete
casos montados con `buildGoalArcs` + `VidaGoalArcRow`, a **375 px** y a
**760 px**, en Aura claro y Aura oscuro. Medido con `getComputedStyle` sobre el
`path` del trazo:

| Caso | `data-fit` | Trazo (Aura claro) | Trazo (Aura oscuro) |
|---|---|---|---|
| lunes 9:15, 15 min de 480 | `ok` | `rgb(5,150,105)` = `--color-success` | `rgb(78,222,163)` |
| 16:00, faltan 7 h, quedan 7 h | `tight` | `rgb(201,52,0)` = `--color-warning` | `rgb(255,149,0)` |
| 17:00, faltan 7 h, quedan 6 h | `over` | `rgb(186,26,26)` = `--color-danger` | `rgb(255,180,171)` |
| pasada la meta (18:00, 9 h) | *(sin atributo)* | `rgb(2,132,199)` = color de la meta | ídem |
| día pasado (5 h registradas) | *(sin atributo)* | `rgb(2,132,199)` = color de la meta | ídem |

`document.documentElement.scrollWidth === clientWidth` (375 y 760) en los siete
casos, incluido el de la jornada de 24 h, y ningún `<article>` desborda.

**Criterios que cierra, uno por uno:**

- **566 — cerrado.** `fitLevel` se calcula **solo** en las dos ramas de «meta
  sin cruzar, hay reloj, es hoy» (las mismas condiciones del 559), y sale de
  `parseTimeToMinutes(dayEnd) − nowMinutes − missingMinutes`. Evidencia además
  de que **manda el final del día y no el porcentaje**: el mismo momento (14:00,
  1 h hecha de 8) es `ok` con `dayEnd = '23:00'`, `tight` con `'21:00'` y
  `over` con `'20:00'` — test «el final del día manda».
- **567 — cerrado.** `> GOAL_FIT_OK_MARGIN_MINUTES`. Borde medido: margen **61
  → `'ok'`**, margen **60 → `'tight'`** (`it.each`, «el borde del umbral»).
- **568 — cerrado.** Margen 30 → `tight`; margen 60 → `tight`; margen **0 →
  `tight`** (test dedicado: a las 16:00 faltan 420 y quedan 420).
- **569 — cerrado.** Margen **−1 → `over`** (16:01) y −30 → `over` (16:30).
- **570 — cerrado, y es el caso que más miré.** Dos pruebas independientes:
  - En la util (`it('un lunes a las 9:15 con 15 minutos de 480 el arco es
    verde')`, fecha real de un lunes, `2026-09-21`): `missingMinutes === 465`,
    `fitMinutes === 360`, `fitLevel === 'ok'`. El test **deja escrito en una
    aserción el contraste con la lectura descartada**:
    `expect(worked / target).toBeLessThan(0.9)` — por porcentaje esto es un 3 %
    y sería rojo; por margen sobran 6 horas y es verde.
  - En el navegador, el mismo caso montado en el arnés: trazo
    `rgb(5,150,105)`, el verde de Aura, con el arco casi vacío (3 % de avance).
    **Un arco casi vacío y verde es exactamente la lectura que el usuario
    eligió**, y es lo que se ve.
- **571 — cerrado.** Tres estados sin atributo, comprobados en el DOM de la
  página (`hasAttribute('data-fit') === false`): pasada la meta, día pasado y
  día futuro (`nowMinutes === null`, test de la util). El trazo vuelve al color
  de la meta porque el respaldo de la variable CSS es `--vida-goal-color`.
- **572 — cerrado, con la prueba hecha a propósito para que no se pueda
  aprobar de vista.** Dos sitios:
  - En la util, el mismo arco a dos horas distintas (9:00 → `ok`, 17:00 →
    `over`): `rojo.arcCaption` **es igual** a `verde.arcCaption`, `rojo.arcValue`
    **es igual** a `verde.arcValue`, `rojo.variant` igual, y las dos frases
    pasan por la **misma** expresión regular `/^Llevas 1 h\. A este ritmo paras
    a las \d\d:\d\d\.$/` — lo único que cambia entre el verde y el rojo es la
    hora que dice.
  - En la página, con el rojo puesto:
    `expect(within(arco).queryAllByRole('alert')).toHaveLength(0)` y
    `expect(arco.textContent).not.toMatch(/!|tarde|corre|no llegas|deberías|cuidado/i)`,
    con la frase literal «Llevas 1 h. A este ritmo paras a las 23:59.» presente.
    Ningún nodo del componente gana texto por llevar color: el `data-fit` vive
    en el `<article>` y el CSS solo toca `stroke`.
- **573 — cerrado.** Día pasado sin llegar a la meta y día pasado pasándose de
  ella: `fitLevel === null` en la util, `data-fit` ausente en la página, y el
  arco sigue sin decir «A este ritmo» (la red del 497 sigue verde).
- **574 — cerrado.** Dos metas el mismo día a la misma hora, cada una con sus
  minutos: «Trabajo» (480, faltan 450) sale **`over`** y «Estudiar» (60, faltan
  30) sale **`ok`**, con `fitMinutes` distintos (−30 y 390). Visto también en el
  navegador a 760 px, los dos arcos en la misma fila: uno rojo, uno verde.
  El semáforo no se comparte porque se calcula **dentro de `toArc`**, una vez
  por meta.
- **584 (parcial, para esta tajada):** typecheck limpio, lint y tests no peores
  que la línea base. El API no se toca en esta tajada, así que su línea base no
  se movió (ningún archivo de `xavi-platform-node` modificado).

**Pendiente de prueba manual (no lo marco como cumplido):** todo lo que hay
detrás del login. Los agentes no entran con credenciales
(`ENVIRONMENT.md`), así que **el arco real en `/app/vida/hoy`, con los datos del
usuario y su hora de fin de día, lo confirma él**. Los pasos están abajo.

**Riesgos:**

- **El trazo del arco.** Es el único píxel que cambia. Si alguna rama dejara
  `fitLevel` puesto donde no toca, el arco de un día pasado se pintaría de rojo
  — que es exactamente el reproche que el módulo prohíbe. Por eso hay tres
  tests para lo mismo (util, página, arnés).
- **`dayEnd` obligatorio rompe a cualquier llamador nuevo.** Es deliberado, pero
  quien añada una llamada a `buildGoalArcs` tiene que pasar el final del día.
  Hoy hay **una** llamada en producción (`VidaHoyPage`) y ningún `vi.mock` de
  este módulo en todo el repositorio (`grep -rn "vi.mock.*vida-goals" src` →
  vacío; los únicos consumidores son `VidaHoyPage` y los dos componentes del
  arco).
- **La medianoche sigue sin arreglarse.** Con `dayEnd = '00:00'` el margen se
  mediría contra el minuto cero y todo saldría rojo. Es el límite conocido del
  módulo (`getDayBudget` hace la misma lectura), no una regresión de esta
  tajada; queda dicho en el comentario del código.
- **El ámbar de Aura.** Ver abajo: funciona, pero en claro casi no se distingue
  del rojo.

**Lo que descubrí y no estaba en el plan:**

1. **`--color-warning` no está definido en los bloques de Aura, y el que hereda
   no es naranja: es `#C93400`.** Los tres colores **existen** en el tema activo
   —no hay ningún hueco, no hice falta inventarme nada—, pero
   `[data-ds='aura']` (claro) y `[data-theme='dark'] [data-ds='aura']`
   redefinen `--color-success` y `--color-danger` y **no** `--color-warning`,
   que cae al `:root` (`$color-orange-600` = `#C93400`) y al bloque oscuro
   (`#FF9500`). Medido en el navegador dentro del ámbito Aura. En **claro**, el
   naranja `rgb(201,52,0)` y el rojo `rgb(186,26,26)` son, a 14 px de trazo,
   **casi el mismo color**: el escalón «cabe justo» → «ya no da» prácticamente
   no se ve. En **oscuro** sí se distinguen (`#FF9500` frente a `#FFB4AB`).
   **No lo arreglo**: añadir `--color-warning` al bloque de Aura cambia el ámbar
   de toda la app (avisos de hábitos, de ajustes, de la plantilla), y eso es una
   decisión del sistema de diseño, no de esta tajada. Opciones, para quien la
   tome: (a) añadir un ámbar Aura a los dos bloques del tema —una línea cada
   uno, afecta a todo—; (b) dar al semáforo su propia variable local en
   `VidaGoalArc.module.scss` —no toca a nadie más, pero estrena un color fuera
   del tema—; (c) dejarlo, asumiendo que el naranja se lee como «rojo suave».
2. **El 570 no se puede probar entero desde la util sin fijar la fecha.** Lo
   dejé con un lunes real (`2026-09-21`) aunque `buildGoalArcs` **hoy no mira
   el día de la semana** —eso llega en la tajada 3—, para que cuando llegue el
   filtro por días laborables ese test siga diciendo lo que dice su nombre y no
   empiece a pasar por casualidad un viernes.
3. **El caso «cabe justo» casi no existe en la vida real.** Con `dayEnd` a las
   23:00 y una meta de 8 h, la ventana naranja dura **exactamente 60 minutos**
   de reloj (entre las 15:00 y las 16:00 si llevas 1 h hecha) y después ya es
   rojo. No es un defecto —es lo que define el umbral— pero conviene que el
   usuario lo sepa al probarlo: **para ver el naranja hay que mirar en una hora
   muy concreta**, y por eso los pasos de abajo dicen cómo forzarlo.
4. **`missingMinutes` era necesario y no solo cómodo.** `toArc` calculaba
   `targetMinutes − workedMinutes` sin topar, y en la rama de meta cruzada eso
   es negativo. Ahora es `Math.max(0, …)` y el mismo número alimenta el rótulo
   y el semáforo: no hay dos restas que puedan dejar de coincidir.
5. **Accesibilidad — el color no es el único portador, pero le falta medio
   paso.** Quien no distinga rojo de verde puede leer lo mismo en texto: la
   frase visible del criterio 560 dice **«A este ritmo paras a las 23:59.»** y
   la línea de `VidaDayBudget`, justo encima del arco, dice **«te quedan Xh Ym
   hasta las 23:00»**. Comparar las dos horas da exactamente lo que dice el
   color. **Lo que le falta es que están en dos sitios**: la hora de fin del día
   no se repite dentro de la tarjeta del arco. No añado nada porque cualquier
   texto nuevo choca de frente con los criterios 572 y 564 (y con el 560, que
   blinda `line` palabra por palabra). Si el usuario quiere cerrarlo del todo,
   la vía barata es que `line` diga la hora de fin en el caso rojo —pero eso
   **es** cambiar `line`, y es una decisión suya, no mía.

**Estado del árbol:** sin commitear. Seis archivos de código modificados
(`vida-goals.utils.ts`, `vida-goals.utils.test.ts`, `VidaGoalArc.tsx`,
`VidaGoalArc.module.scss`, `VidaHoyPage.tsx`, `VidaHoyPage.test.tsx`) más este
expediente; ninguno nuevo, ninguno borrado. El arnés temporal está
borrado. **El API no se ha tocado.**

**El recorrido a mano, para el usuario:**

1. Abre `http://localhost:5173/app/vida/hoy` un día laborable, por la mañana,
   con algo de Trabajo ya registrado. El arco debe estar **verde** aunque lleves
   poco: eso es la lectura que elegiste — el color dice «te da tiempo», no «vas
   bien de porcentaje».
2. Mira la línea de debajo del arco («A este ritmo paras a las …») y la de
   encima («te quedan … hasta las 23:00»). El verde significa que la primera
   cae más de una hora antes de la segunda.
3. **Para ver el naranja y el rojo sin esperar a la tarde**, cambia la hora de
   fin del día en `Vida → Ajustes`: ponla de forma que a lo que te falta le
   sobre menos de una hora (naranja) o no le quepa (rojo). El arco cambia de
   color al instante, sin recargar.
4. Comprueba lo que **no** debe pasar: pasada la meta, el arco vuelve al color
   de «Trabajo» (azul) y dice la hora a la que cruzaste las 8 h; y un día
   pasado de la tira de días **nunca** lleva color, hayas llegado o no.
5. Y lo importante: en rojo, **lee la frase**. Tiene que decir exactamente lo
   mismo que decía en verde, sin ningún «ya no llegas» ni exclamación. Si algo
   ahí suena a reproche, devuélvelo.

#### Tajada 2 · vuelta de la devolución — el cero, y un `*/` que faltaba

**Resumen para quien revise:**
1. **El caso devuelto está cerrado con un punto.** Con cero minutos no hay
   `valuePath` que teñir, así que el color se apoyaba en algo que no se
   dibujaba: ahora hay un `<circle>` de 14 px en el arranque del arco, del
   color del semáforo, que se pinta **solo** cuando hay `fitLevel`. A las 20:00
   sin nada registrado el arco ya se ve rojo.
2. **Además encontré y arreglé algo peor, que no estaba en la devolución: el
   bloque de comentario del color se quedó sin `*/`.** Se comía todo hasta la
   línea 201 del SCSS. En el CSS emitido **no había ni una regla `[data-fit]`**
   —el semáforo entero estaba apagado— **ni `.caption`, ni `.value`, ni
   `.edge`**, que son de la tajada 1 y ya estaba aceptada.
3. **Lo que más probablemente rompí:** el punto se solapa 1 px con la caja del
   rótulo «0h» del borde izquierdo. Es el **mismo** espacio que ya ocupaba el
   remate redondo del trazo (un círculo de `r=7` en `(22,106)`, idéntico), así
   que no es un solape nuevo — pero si el revisor mira ahí y lo ve feo, es lo
   que hay que mirar. Y el segundo: `dayEnd` ahora admite `null`, así que si
   algún llamador futuro pasa `null` por descuido se quedará **sin color y sin
   avisar**.

**Qué se construyó en esta vuelta:**

- `VidaGoalArc.module.scss` — **el `*/` que faltaba** (línea 163) y `.fitDot`,
  que usa la **misma** `--vida-fit-color` que el trazo: un solo sitio donde
  vive el color, dos formas de enseñarlo.
- `VidaGoalArc.tsx` — `<circle className={styles.fitDot} cx="22" cy="106" r="7" />`,
  dibujado **antes** del trazo y **solo** si `arc.fitLevel !== null`.
- `vida-goals.utils.ts` — `dayEnd` pasa a `string | null`; `fitCandidate` exige
  `day.dayEnd !== null`. Nada más cambia.
- `VidaHoyPage.tsx` — `dayEnd: dayHours.isPending ? null : dayHours.endTime`,
  con `dayHours.isPending` en las dependencias del `useMemo`.
- Tests nuevos: dos en la util para el cero (9:00 verde, 20:00 rojo) y uno para
  `dayEnd: null`; dos en la página (el cero pinta punto y **no** pinta trazo; y
  fuera de la ventana no hay `<circle>`).

**Por qué el punto, y no las otras dos salidas** (medido, no razonado a ojo):

- **Un trazo mínimo** («pintar siempre un 1-2 % de avance») está descartado
  porque **miente sobre el dato**: el arco es una proporción y el criterio 495
  de FEAT-016 dice que con cero minutos el arco aparece **vacío**. Un semáforo
  no puede pagarse falsificando el avance.
- **Teñir la pista** (`.trackPath`) pinta el **semicírculo entero** de rojo
  cuando no has hecho nada — que es exactamente la mañana de cualquiera. Es lo
  más lejos del render 20 aprobado (que tiñe el avance, no la pista) y lo que
  más se parece a un reproche a pantalla completa. Descartado por el 572 y por
  el 493 de FEAT-016.
- **El punto** es la marca que **el propio criterio 572 nombra** («el trazo del
  arco, **un punto**») y la que menos se aleja del render: `r=7` es exactamente
  la mitad de `strokeWidth=14`, y está en `(22,106)`, que es el punto de
  arranque del `path`. **Consecuencia medida: con un solo minuto trabajado el
  remate redondo del trazo lo tapa por completo** —misma posición, mismo radio,
  mismo color—, así que en todos los estados que el revisor ya aceptó **no se
  ve nada nuevo**. El único sitio donde aparece es el que no tenía nada.

**Verificación** (todo remedido después del arreglo):

| Qué | Línea base | Después |
|---|---|---|
| `pnpm typecheck` | limpio | **exit 0, limpio** |
| `pnpm lint` | 14/0 | **`✖ 14 problems (14 errors, 0 warnings)`** |
| `pnpm test` | 2 fallos de 1920 | **`Tests  2 failed \| 1923 passed (1925)`** — los dos de `SearchSelect`. +5 casos nuevos. |
| `pnpm build` | inicial 1.128,81 kB · `app-icons` 620,20 kB | **exit 0**, inicial **1.128,98 kB** (+0,17: un `<circle>` y un `null`) · `app-icons` **620,20 kB, sin mover** · `IconPicker` 4,64 kB |
| CSS emitido | 273,61 kB **con el semáforo apagado** | **274,32 kB** con las cuatro reglas `[data-fit]`, `.fitDot`, `.caption`, `.value` y `.edge` de vuelta |

**La prueba del `*/`, para que nadie tenga que fiarse de mí.** En el `dist`
anterior al arreglo, las clases del módulo del arco eran **16** y ninguna de
ellas `caption`/`value`/`edge`, y `grep -c "data-fit"` daba **0**. Después son
**20** y las cuatro reglas están:

```
[data-fit=ok]{--vida-fit-color:var(--color-success)}
[data-fit=tight]{--vida-fit-color:var(--color-warning)}
[data-fit=tight]{--vida-fit-color:#d97706}
[data-fit=over]{--vida-fit-color:var(--color-danger)}
```

**En el navegador** (arnés temporal propio, **borrado**; diez casos a **375** y
**760 px**, Aura claro y Aura oscuro), medido con `getComputedStyle`:

| Caso | `data-fit` | punto | trazo |
|---|---|---|---|
| **cero** minutos, 9:00 | `ok` | `rgb(5,150,105)`, **14×14 px** | *(no existe)* |
| **cero** minutos, 14:30 | `tight` | `rgb(217,119,6)`, 14×14 | *(no existe)* |
| **cero** minutos, 20:00 | `over` | `rgb(186,26,26)`, 14×14 | *(no existe)* |
| 60 min, 16:00 | `tight` | `rgb(217,119,6)` | `rgb(217,119,6)` |
| ajustes cargando (`dayEnd: null`) | *(sin atributo)* | *(no hay punto)* | color de la meta |
| pasada la meta / día pasado | *(sin atributo)* | *(no hay punto)* | color de la meta |

En **oscuro**, los tres puntos: `ok rgb(78,222,163)`, `tight rgb(217,119,6)`,
`over rgb(255,180,171)` — el ámbar propio aplica en los dos temas, como quedó
decidido. `scrollWidth === clientWidth` a 375 y a 760, y ningún `<article>`
desborda. Y la prueba de que el SCSS volvió a compilar entero:
`getComputedStyle(<text class=caption>).textTransform === 'uppercase'` — antes
del arreglo esa regla no existía.

**Criterios, lo que cambia respecto a la vuelta anterior:**

- **566 y 569 — ahora sí cerrados también en el cero.** «20:00, nada
  registrado» → `data-fit="over"`, sin `valuePath` y **con** punto rojo. Es el
  caso que el revisor puso como ejemplo.
- **561 leído junto al 566 — cerrado.** El cero está dentro de la ventana: dos
  casos en la util (9:00 `ok`, 20:00 `over`), con `share === 0` y
  `missingMinutes === 480` afirmados en el mismo test.
- **571 y 573 — siguen cerrados, y ahora hay que comprobarlos dos veces**
  (atributo **y** punto): `arco.querySelector('svg circle')` es `null` pasada
  la meta y en día pasado. Está en un test propio.
- **572 — sigue cerrado.** El punto no añade texto: en el caso del cero en
  rojo, `queryAllByRole('alert')` sigue dando 0 y el `textContent` sigue sin
  `/!|tarde|corre|no llegas|deberías|cuidado/i`. La única frase visible sigue
  siendo «Si arrancas ahora, acabarías a las 23:59.», la de FEAT-016.
- **567, 568, 570, 574** — sin tocar; los dio por buenos el revisor y ninguno
  de estos cambios los roza (el punto se alimenta del mismo `fitLevel`).

**El hallazgo del respaldo de las 23:00: lo cierro aquí, no lo dejo anotado.**
`useVidaDayHours` sirve `VIDA_DAY_END_FALLBACK` mientras carga
`useUserSettingsQuery`, así que un usuario cuyo día acaba a las 18:00 veía el
arco **verde y saltando a rojo** al llegar el dato. Lo cierro porque un rojo
que aparece solo porque una consulta iba a medias es el peor de los rojos: no
es información, es un susto, y es justo lo que el 572 quiere evitar. La forma
—`dayEnd: null` mientras `isPending`— es la más barata que no miente: el resto
de la pantalla **sigue** usando el respaldo (una agenda aproximada es mejor que
un hueco), y lo único que se retiene es el color. **No se retiene con
`isDefault`**: un usuario que nunca configuró su día tiene las 23:00 como hora
real y su semáforo es tan válido como el de cualquiera; lo que no es real es un
dato **a medio cargar**, y eso es `isPending`.

**`probe.sh` no repite cifras viejas: no tiene ninguna.** Comprobado
(`docs/features/probe.sh:36-38`): lee la tabla de `ENVIRONMENT.md` con `grep -E
'^\| (Tipos|Linter|Tests|Paquete) \|'` y la imprime. Repite lo que diga ese
archivo, así que no hay nada que arreglar aquí — cuando se actualice
`ENVIRONMENT.md`, la sonda dice lo nuevo sola. Lo dejo escrito porque es la
segunda vez que alguien va a buscar números dentro de la sonda.

**Lo que descubrí en esta vuelta y no estaba en el plan:**

1. **Un comentario sin cerrar en un `.module.scss` no rompe nada visible:
   apaga reglas en silencio.** No lo caza `typecheck` (no es TS), no lo caza
   `lint` (no mira SCSS), no lo cazan los tests (vitest no compila CSS) y **el
   build pasa en verde**. La única señal era el tamaño del CSS: 273,61 kB en
   vez de 274,18. La forma barata de cazarlo, para quien venga: contar
   `grep -c -F '/*'` contra `grep -c -F '*/'` en el archivo tocado, o mirar que
   las clases del módulo salgan en el `dist`. **Esto merece entrar en las
   trampas del repositorio**, pero `ENVIRONMENT.md` no lo toco yo.
2. **El punto pisa 1 px la caja del rótulo «0h»** (`dot.bottom 668` contra
   `edge.top 667`, medido a 375 px). No es un solape nuevo —el remate del trazo
   es un círculo idéntico en la misma posición— y a la vista el «0h» se lee
   limpio en las capturas. Lo dejo dicho con el número, no con un «se ve bien».
3. **Los tres «CERO minutos» no son un caso de borde: son tres estados
   distintos a lo largo del día** (verde por la mañana, naranja entre las 14:00
   y las 15:00 con la jornada de 8 h, rojo después). La ventana naranja del
   cero dura, otra vez, exactamente 60 minutos de reloj.

**Estado del árbol:** sin commitear. Los mismos seis archivos de código que la
vuelta anterior (ninguno nuevo, ninguno borrado) más este expediente y el
`BOARD.md`. El arnés temporal está borrado. **El API no se ha tocado.**

**Lo que se añade al recorrido a mano** (el resto sigue igual):

6. **Mira el arco antes de empezar a trabajar, con el día en cero.** Por la
   mañana tiene que verse un **punto verde** en el arranque del arco, a la
   izquierda; por la tarde, sin haber registrado nada, **rojo**. Ese punto es
   todo el semáforo cuando aún no hay trazo — si ahí no hay nada, devuélvelo
   otra vez.
7. Y si entras con la conexión lenta: el arco **no** debe parpadear de verde a
   rojo al cargar. Sale sin color hasta que se sabe a qué hora acaba tu día.

### Tajada 3 — El sábado sin arco (camino de lectura)

**Resumen para quien revise:**
1. **Un sábado ya no hay arco, ni semáforo, ni pregunta.** `vida_goals` gana
   `active_days TEXT[] NOT NULL DEFAULT ARRAY['monday'…'friday']` (migración
   **070**, sin desplegar), el dato viaja dentro de la categoría
   (`goal.activeDays`) y `buildGoalArcs` saca del reparto a las metas que no
   cuentan el día mostrado **antes de sumar nada**.
2. La pregunta «¿Cuál de estas es tu trabajo?» cuelga del **mismo objeto**
   (`goalArcs.promptAllowed`), así que no puede salir un sábado mientras el
   arco no sale.
3. **Lo que más probablemente he roto:** el **orden del despliegue**. Los cinco
   documentos GraphQL del catálogo ya piden `activeDays`, que es un campo
   **no nulo**. Si el front sale antes de que la migración 070 corra, el
   resolver de `ActivityCategory.goal` devolverá una meta sin ese campo, el
   campo no nulo hará nulo el `goal` entero y **el usuario verá la pregunta en
   vez de su arco, un lunes**. El API va primero, y con su migración. Segundo
   candidato: el test del criterio 571 («un día futuro de la tira, sin reloj»)
   usaba el **sábado** 19; lo moví al lunes 21 porque ese día ya no produce
   arco — misma aserción, otro día.

**Qué se construyó:**

*API (`~/Developer/xavi-platform-node`) — sin commitear, sin push:*

- **`migrations/070_vida_goals_active_days.sql` (nuevo).** `ADD COLUMN IF NOT
  EXISTS active_days TEXT[] NOT NULL DEFAULT ARRAY['monday','tuesday',
  'wednesday','thursday','friday']::TEXT[]` + el `CHECK (cardinality >= 1)` en
  su propio `ALTER` (para que el `DOWN`, comentado como en la 069, pueda
  quitarlo suelto). El último número era el 069; lo comprobé al escribirla.
- `src/types/services/vida.types.ts` — `VidaGoal.activeDays: string[]`.
- `src/services/vida-goal.service.ts` — `GoalRow.active_days` y
  `mapGoal().activeDays`. **`ensureDefaultGoal` no se ha tocado**: su `INSERT`
  no lista la columna y el `DEFAULT` hace el trabajo (probado, abajo).
- `src/graphql/modules/vida/vida.schema.ts` — `activeDays: [VidaDayOfWeek!]!`
  en `type VidaGoal`, con el enum que **ya existía** en el mismo módulo.
- `tests/unit/services/vida-goal.service.test.ts` — `active_days` en el
  `goalRow()`, la aserción de que el upsert **no** nombra la columna, un caso
  de meta de siete días y uno nuevo de `listGoals`.

*Front (este repositorio) — sin commitear:*

- `types/vida-goal.types.ts` — `activeDays: VidaDayOfWeek[]`, importando el
  tipo de `vida-item.types` (el vocabulario de la plantilla, sin traducir nada).
- `graphql/activity-categories.graphql.ts` — `activeDays` en **las cinco**
  sub-selecciones `goal { … }`.
- `graphql/schema/vida.schema.graphql` — **recopiado del repo hermano**, no
  editado a mano: comprobé antes que el cuerpo vendorizado era **literalmente
  igual** al de la cadena `gql` del API (único diff: mi campo nuevo) y lo
  regeneré desde ahí, actualizando la cabecera de origen.
- `utils/vida-goals.utils.ts` — `DEFAULT_GOAL_ACTIVE_DAYS`, `countsOn()`, el
  filtro del `Map` de tallies antes de sumar, y `promptAllowed` en
  `VidaGoalArcs`.
- `pages/VidaHoyPage.tsx` — un solo toque: `goalArcs.promptAllowed ? <VidaGoalPrompt …/> : null`
  dentro de la rama que ya existía. **Ni una consulta nueva, ni una fecha más
  al componente de la pregunta.**
- `utils/vida-goals.utils.test.ts` (+5 casos), `pages/VidaHoyPage.test.tsx`
  (+5 casos), `pages/VidaCategoriasPage.test.tsx` (fixture).

**Por qué así, y qué descarté:**

- **`promptAllowed` sale de `buildGoalArcs` y no de la página.** Es lo que pide
  la sección 2 y el motivo se sostiene solo: si la página volviera a preguntar
  por el día de la semana habría **dos** condiciones que mantener iguales, y el
  día que divergieran el usuario tocaría una categoría un sábado y no vería
  aparecer nada (el criterio 501 de FEAT-016 promete lo contrario).
- **Sin metas en el catálogo, la pregunta se compara con
  `DEFAULT_GOAL_ACTIVE_DAYS`** —la constante duplica el `DEFAULT` de la
  columna, con un comentario que lo dice—. La alternativa era preguntar siempre
  y dejar que el sábado el toque no enseñe nada: es exactamente el caso que el
  criterio 580 prohíbe.
- **El filtro quita la meta del reparto; no pinta un arco vacío ni uno oculto.**
  Un `hidden`, o un arco con ceros, sería «hoy vas por 0 de 8»: un día en rojo
  disfrazado. El 578 dice que ese día la meta **no existe**.
- **No toqué `arcValue`/`variant` (tajada 1) ni `fitLevel`/`fitDot`
  (tajada 2)**, ni una línea del SCSS del arco: el punto y el remate del trazo
  siguen compartiendo centro y radio.

**Verificación:**

*La migración, contra un Postgres de verdad* (contenedor `postgres:17-alpine`
efímero, creado y **borrado** en la misma sesión; no se tocó Neon ni ningún
servicio del proyecto). Sobre una tabla que imita `vida_goals` con **una fila
ya dentro**, el `-- UP` literal de la 070:

```
--- la fila que YA existia, despues de la 070 ---
 slug |                active_days
------+--------------------------------------------
 work | {monday,tuesday,wednesday,thursday,friday}
--- meta nueva por el INSERT de ensureDefaultGoal (no lista active_days) ---
 user_id |                active_days
---------+--------------------------------------------
       2 | {monday,tuesday,wednesday,thursday,friday}
--- el CHECK rechaza el array vacio ---
ERROR:  new row for relation "vida_goals" violates check constraint "vida_goals_active_days_not_empty"
--- y acepta un dia suelto ---
 user_id | active_days
---------+-------------
       1 | {saturday}
```

Es decir: **la meta «Trabajo» que el usuario ya tiene en producción amanecerá
con lunes a viernes sin ningún `UPDATE` de relleno**, y el upsert que no nombra
la columna sigue creando metas correctas. (Lo que **no** pude comprobar: que en
Neon esa fila exista y cuántas hay — es la base de producción detrás de un
`DATABASE_URL` que no es mío.)

*Puertas, las dos líneas base:*

| Repo | Comando | Antes (ENVIRONMENT.md) | Ahora |
|---|---|---|---|
| API | `npx tsc --noEmit` | limpio, exit 0 | **limpio, exit 0** |
| API | `npm test` | 3 fallos, 6 suites en rojo | **3 fallos / 576 (573 ok), 6 suites en rojo — las mismas seis** (habits ×3, sleep, standup, expense; ninguna de Vida). `vida-goal.service.test.ts`: **9/9 verde** |
| API | `npx eslint` (solo lo tocado) | no es puerta; «no empeorar» | **sin errores nuevos**: el único de `vida.types.ts` está en la línea 2 (una unión que no toqué) y el «Parsing error» del test es de config, preexistente |
| Front | `pnpm typecheck` / `tsc -b` | limpio | **limpio** |
| Front | `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos |
| Front | `pnpm test` | 2 fallos de 1925 | **2 fallos de 1935** — los dos de `SearchSelect`; +10 son los casos nuevos |
| Front | `pnpm build` | inicial 1.128,98 kB · **CSS 274,32 kB** | exit 0 · inicial **1.129,25 kB** (+0,27, el código nuevo) · `app-icons` 620,20 kB · **CSS 274,32 kB, clavado** (no toqué SCSS; lo miro por lo de ayer) |

**Criterios, uno a uno:**

- **575 — la columna, y la meta automática nace L-V.** ✅ Migración 070 +
  `GoalRow`/`mapGoal`/SDL, y la salida de psql de arriba: la fila existente y
  la creada por el `INSERT` sin la columna salen las dos con los cinco días.
  **Pendiente de despliegue**: la migración no ha corrido (la corre el push del
  usuario).
- **576 — un sábado no aparece el arco.** ✅ En la util
  (`arcs` es `[]` un sábado con una meta L-V, con sesión registrada incluida) y
  en la página, en jsdom con el reloj puesto en **sábado 19**: `queryByRole('article', {name:'Trabajo'})`
  nulo **y** `document.querySelector('[data-fit]')` nulo —ni escondido ni con
  ceros— y la agenda sigue pegada al presupuesto (sin hueco).
- **577 — lo registrado ese día se sigue guardando.** ✅ Comprobado en los dos
  lados de lo que esta tajada toca: en la util, la sesión de ese sábado **no**
  se recoloca en «sin dato» (`noDataMinutes` 0, `noDataLabel` vacío) y el array
  de `followUps` entra y sale intacto (`structuredClone` comparado); en la
  página, la sesión «Working at lululemon» **se sigue viendo** en la línea del
  día sin arco. Nada del camino de escritura (mutaciones de sesión, Revisión,
  catálogo) se ha tocado.
- **578 — no cuenta como día en rojo.** ✅ Es la misma evidencia del 576 más el
  caso del **sábado pasado** (12/09): `arcs` vacío y `promptAllowed` falso, sin
  ningún `fitLevel`. No existe ningún nodo de semáforo, pintado ni oculto.
- **579 — cada meta por sus propios días.** ✅ Util: con «Trabajo» (L-V) y
  «Estudiar» (7 días), el sábado sale `['Estudiar']` y el viernes
  `['Trabajo','Estudiar']`. Página: el sábado, `article` «Trabajo» nulo y
  `article` «Sueño» presente al mismo tiempo.
- **580 — sin metas, el sábado tampoco pregunta.** ✅ Util: catálogo sin ninguna
  meta → `promptAllowed` **true** el viernes, **false** el sábado. Página: con
  dos categorías y ninguna apuntando, el sábado no hay `region` «¿Cuál de estas
  es tu trabajo?» ni texto suelto; **y el lunes siguiente vuelve** (un test
  aparte, para que nadie la apague para siempre).
- **584 (se comprueba en cada tajada)** — ✅ la tabla de puertas de arriba.

**Lo que NO pude verificar (y no doy por cerrado):**

1. **Nada de `/app/*` a mano.** Todo está detrás de un login en el que un
   agente no entra. Lo de arriba es jsdom y aritmética, no la pantalla real.
   Además **el 5173 estaba apagado** durante toda la sesión (`probe.sh`:
   «APAGADO» en 5173 y 5174); no levanté nada.
2. **La migración no está desplegada.** Hasta que el usuario haga push, la API
   en Render/Cloud Run devuelve metas **sin** `activeDays`.
3. **No hay arnés esta vez** y no hacía falta: esta tajada no dibuja nada
   nuevo, solo quita. No hay geometría que medir.

**Recorrido a mano, para el usuario** (después del push del API, y en este
orden):

1. Push del API → esperar a que el workflow termine en verde (ejecuta la 070).
2. Abrir **Hoy** un lunes cualquiera: el arco tiene que estar donde estaba, con
   su color. Si aquí sale la **pregunta** en vez del arco, el orden se rompió:
   la migración no corrió.
3. Abrir **Hoy** un **sábado** (o esperar al sábado): ni arco, ni pregunta, ni
   hueco. El presupuesto del día y la agenda, pegados.
4. Registrar algo ese sábado y mirar **Revisión** de ese día: la sesión está
   entera, con su categoría.

**Riesgos:**

- **El orden del despliegue** (dicho arriba): front después del API, no antes.
- **`DEFAULT_GOAL_ACTIVE_DAYS` duplica el `DEFAULT` de la columna.** Si mañana
  cambia uno y no el otro, la pregunta y la meta recién creada discreparían un
  día. Está escrito en el comentario de la constante; no hay forma barata de
  atarlos sin una consulta nueva (`vidaGoals` sigue sin consumidor).
- **Los días todavía no se pueden cambiar**: eso es la tajada 4. Hasta
  entonces, cualquiera que trabaje los sábados se queda sin arco ese día y sin
  manera de decirlo. Es lo que el corte del arquitecto acepta a propósito.
- Toqué el fixture `WORK_GOAL` de `VidaHoyPage.test.tsx` y el de
  `VidaCategoriasPage.test.tsx` (el tipo lo exige): si algún test de esos
  archivos dependía de que la meta contara **todos** los días, ahora depende de
  que el día de la prueba sea laborable. El día por defecto de los dos es
  **viernes 18**, y las 196 + 63 pruebas siguen verdes.

**Lo que encontré y no estaba en el plan:**

- **El test del criterio 571 usaba el sábado 19** como «día futuro de la tira».
  Con esta tajada ese día deja de producir arco y `arcs[0]` era `undefined`: lo
  moví al **lunes 21**, mismas aserciones, con el motivo escrito encima. Es un
  choque real entre las tajadas 2 y 3 que el plan no anticipó.
- **El cuerpo del SDL vendorizado era literal-idéntico** al del repo hermano
  (lo comparé línea a línea antes de tocarlo). Eso permite regenerarlo en vez
  de editarlo a mano — merece la pena dejarlo escrito para la tajada 4.
- **`npm test` del API ya no da «3 de 560»** sino **3 de 576** (52 suites, no
  51): la línea base de `ENVIRONMENT.md` se quedó corta, con los mismos 3
  fallos y las mismas 6 suites. No lo edito (el archivo es del usuario), pero
  ahí queda.

**Estado del árbol:** sin commitear, en **los dos** repositorios. Front: 8
archivos modificados (+ este expediente y `BOARD.md`), ninguno nuevo, ninguno
borrado. API: 4 modificados y **1 nuevo** (`migrations/070_vida_goals_active_days.sql`).
Sin `git add`, sin commit y **sin push** en ninguno de los dos. El contenedor
de Postgres de la prueba está borrado (`docker ps -a` no lo lista).

### Tajada 5 — El rojo solo si el día acaba corto, y fuera la hora proyectada

**Resumen para quien revise:**

1. El rojo ya no sale por mirar el reloj: pide **dos** cosas a la vez —que lo
   que falta ya no quepa **y** que el día vaya a acabar por debajo del 80 % de
   la meta—. El caso del usuario (23:05, día hasta las 22:00, 7 h 09 de 8 h)
   pasa de rojo a **naranja**, y las 20:00 con casi nada registrado siguen en
   rojo.
2. La hora proyectada desaparece del módulo: ni «A este ritmo paras a las H»
   ni «Si arrancas ahora, acabarías a las H». Con ella se fue la línea
   visible bajo el arco —repetía la cabecera y el interior— y el `<p>` volvió a
   1×1 px, que es donde estaba en FEAT-016. `stopAtTime` sale del tipo.
3. **Lo que más probablemente he roto:** el rojo ahora es bastante más raro, y
   el umbral del 80 % se mide contra `targetMinutes`, no contra la parte del
   día que la meta ocupa — con una meta pequeña (`Estudiar`, 60 min) basta con
   que queden 48 minutos de día para que no haya rojo nunca. Lo segundo es la
   **baja de `stopAtTime`**: nadie lo leía fuera de la util, pero es un campo
   público menos y el `git grep` que hice es toda la prueba que tengo. Y lo
   tercero, **el CSS: he borrado la regla `.line`**, así que el CSS emitido
   **baja** 0,13 kB respecto a la línea base — que es justo la señal que
   `ENVIRONMENT.md` manda investigar. Abajo dejo la comprobación de que no se
   comió nada más.

**Qué se construyó:**

- `src/features/vida/utils/vida-goals.utils.ts`
  - **`GOAL_FIT_SHORT_DAY_RATIO = 0.8`**, exportada y documentada como del
    usuario, no del render.
  - **`toFitLevel(fitMinutes, { bestPossibleMinutes, targetMinutes })`**: el
    verde y el naranja no se tocan; el rojo pasa a exigir además
    `bestPossibleMinutes < targetMinutes * 0,8`. `bestPossibleMinutes =
    workedMinutes + max(0, dayEnd − ahora)`, calculado en `toArc` con el mismo
    `parseTimeToMinutes(dayEnd)` que ya usaba `fitCandidate` (una sola lectura
    del dato, dos usos).
  - **Se va `stopAtTime`**, del tipo y del cálculo. La puerta que escribía
    `stopAtTime === null` vuelve a ser `!canProject`, que es lo que siempre
    significó (`minutesToTime` nunca devuelve `null`), con un comentario que lo
    dice.
  - **Las dos ramas de «te faltan» se funden en una**: solo se diferenciaban en
    la frase de la hora. `line` pasa a ser
    `Te faltan <duración larga> de <meta>.` en los dos casos, cero minutos
    incluido.
- `src/features/vida/components/VidaGoalArc/VidaGoalArc.tsx`: el `<p>` es
  siempre `styles.srLine`. Sigue siendo **uno solo** (criterio 564, ahora
  trivial). El resto del componente no cambia: la geometría de `isMissing`
  (rótulo en 66, número a 34), el punto del semáforo y `data-fit` se quedan
  como los dejó la tajada 2.
- `src/features/vida/components/VidaGoalArc/VidaGoalArc.module.scss`: fuera la
  regla `.line`, con un comentario en su sitio que explica la baja **y avisa
  de la bajada del CSS** para que nadie la confunda con un comentario sin
  cerrar.
- `src/features/vida/utils/vida-goals.utils.test.ts` y
  `src/features/vida/pages/VidaHoyPage.test.tsx`: los casos que fijaban la
  frase de la hora ahora fijan que **no está**, y los del semáforo se
  recalculan. Cuatro casos nuevos: el del usuario con sus números exactos, el
  borde del 80 %, la red de las 20:00 y la mañana verde.

**Por qué así, y qué descarté:**

- **La línea desaparece entera en vez de quedarse reducida.** El encargo lo
  dejaba a mi criterio. Lo que podía quedar era «Llevas 7 h 9 min.», y eso es
  **exactamente** lo que ya dice la cabecera («7h 09 de 8h») dos centímetros
  más arriba: una tercera copia del mismo dato en la misma tarjeta. Medido en
  el arnés: las cinco tarjetas quedan a 180 px de alto, la de «te faltan»
  incluida, y ya no es la única más alta que las demás.
- **Pero el `<p>` no se borra, se esconde.** El SVG es `aria-hidden` (y lo es
  a propósito desde FEAT-016 tajada 3, que cerró la doble lectura), así que
  sin ese `<p>` un lector de pantalla oiría del arco solo «Trabajo, 7h 9 de
  8h» y **nada** de lo que el dibujo dice. La frase que queda —«Te faltan 51
  min de Trabajo.»— es el interior del arco dicho en texto, **no** la frase
  que el usuario quitó: no hay ninguna hora proyectada en ella. Descarté
  `aria-label` en el `<article>` por la misma razón que FEAT-016: se acaba
  oyendo dos veces.
- **`stopAtTime` fuera del tipo y no un comentario.** El encargo admitía las
  dos. Quedaba muerto de verdad: `git grep` no encuentra ningún lector fuera
  de `vida-goals.utils.ts` y de su propio test, y la puerta que parecía
  necesitarlo (`stopAtTime === null`) es literalmente `!canProject`. Dejarlo
  habría sido publicar una proyección que ya nadie pinta.
- **El umbral se mide contra `targetMinutes`** y no contra «la parte de la meta
  que cabía en el día». Es lo que dice el encargo palabra por palabra («que el
  día vaya a acabar por debajo del 80 % de la meta») y es lo que el usuario
  usó para juzgar su propio día («completé al menos un 80 % de mi jornada»).
  La consecuencia rara está arriba, en lo que puedo haber roto.
- **Verde intacto**, como pedía el encargo: a las 23:05 con un 89 % el arco es
  naranja, nunca verde, porque verde aquí afirma que todavía da para la meta
  entera.

**Verificación:**

| Qué | Comando | Resultado |
|---|---|---|
| Tipos | `pnpm typecheck` | limpio, exit 0 |
| Linter | `pnpm lint` | **14 errores / 0 warnings** — la línea base exacta |
| Tests | `pnpm test` | **2 fallos de 1943** (`SearchSelect` ×2, preexistentes). Eran 2 de 1935: +8 son los casos nuevos de esta tajada |
| Suites tocadas | `npx vitest run …vida-goals.utils.test.ts` | 52/52 |
| | `npx vitest run …VidaHoyPage.test.tsx` | 197/197 |
| Paquete | `pnpm build` | chunk inicial **1.129,17 kB** (base 1.129,25), `app-icons` 620,20 kB, `IconPicker` 4,64 kB. **CSS 274,19 kB** (base 274,32) |

**La bajada del CSS, comprobada y no supuesta.** `ENVIRONMENT.md` manda buscar
un comentario sin cerrar cuando el CSS baja. Contadas las clases que el módulo
del arco emite en `dist/assets/index-*.css` contra las declaradas en el
`.module.scss`: **19 y 19**, las mismas —`arc, capsule, caption, card, count,
countValue, edge, fitDot, head, label, noData, root, row, srLine, sub,
subValue, trackPath, value, valuePath`—. Y las cuatro reglas del semáforo
siguen ahí: `[data-fit=ok]`, `[data-fit=tight]` (×2, la de tema claro y la de
contraste), `[data-fit=over]`. Lo único que falta es `.line`, que es lo que
borré: −0,13 kB ≈ los ~125 bytes de esa regla minificada.

**Criterios, uno por uno:**

- **585 (el rojo exige las dos cosas)** — `toFitLevel` devuelve `'over'` solo
  si `fitMinutes < 0` **y** `bestPossibleMinutes < targetMinutes * 0,8`.
  Probado en los dos bordes: a las 17:36 con 60 min hechos el mejor final son
  384 minutos clavados → `'tight'`; a las 17:37 son 383 → `'over'`. También en
  la tabla: «ya no cabe, pero el día acaba bien» (16:30, margen −30) →
  `'tight'`; «ya no cabe y además el día acaba corto» (19:00, margen −180) →
  `'over'`. **Cumplido.**
- **586 (el caso del usuario es naranja)** — `fitMinutes` sigue siendo −116 y
  `fitLevel` es `'tight'`, en la util y en la página (con
  `vidaDayEndTime: '22:00'` y el reloj a las 23:05, el `<article>` sale con
  `data-fit="tight"` y dentro «TE FALTAN 51m»). Visto también renderizado en
  el arnés: arco ámbar. **Cumplido.**
- **587 (el verde no cambia)** — la rama del verde es la misma línea de antes.
  La mañana a las 8:00 con cero trabajado da margen 420 y `'ok'`; el lunes a
  las 9:15 con 15 min (criterio 570) sigue verde. Y el caso del 586 **no** es
  verde. **Cumplido.**
- **588 (las 20:00 siguen en rojo)** — `it.each` con 0, 30 y 60 minutos a las
  20:00 con el día hasta las 23:00: los tres `'over'`. En la página, el caso de
  cero minutos sigue pintando el punto rojo. Visto en el arnés con 30 minutos.
  **Cumplido.**
- **589 (ni una hora proyectada)** — el `textContent` y el `innerHTML` del
  `<article>` no contienen `ritmo`, `acabarías` ni la hora; comprobado en el
  DOM real del arnés sobre los cinco estados. Lo que **no** se tocó, verificado
  en el mismo sitio: el arco de meta cruzada sigue con «PASASTE LAS 8H / A LAS
  / 16:00» y su frase, y el día pasado con «Registraste 5 h de Trabajo.» y «No
  hay nada registrado de … ese día». **Cumplido.**
- **590 (el arco no se queda mudo)** — un solo `<p>` por tarjeta, de 1×1 px
  medido en el navegador (`getBoundingClientRect()` → 1×1 en los cinco), con
  «Te faltan 51 min de Trabajo.» / «Te faltan 8 h de Trabajo.» / «Llevas 9 h.
  Pasaste las 8 h a las 16:00.». El `<svg>` sigue `aria-hidden`. **Cumplido.**
- **584 (las puertas)** — tabla de arriba. Solo este repositorio: la tajada no
  toca el API. **Cumplido.**
- **560** — **superado por decisión del usuario del 2026-09-22**, anotado en la
  sección 1 debajo del propio criterio, con sus palabras y sin borrarlo. Esta
  tajada lo incumple **a propósito**: la hora ya no está en `line` ni se ve.
- **Los que esta tajada no debía mover y he vuelto a medir**: 559 (dentro va lo
  que falta), 561 (cero minutos → «TE FALTAN 8h»), 562 (pasada la meta, sin
  cambios), 563 (día pasado), 564 (una sola vez), 565 (el rótulo por debajo de
  18 caracteres — el test paramétrico sigue verde, no lo he aflojado), 566–574
  (el semáforo de la tajada 2, con el rojo redefinido por el 585), 576–580 (el
  sábado). Todos en verde en las dos suites.

**Lo que queda para prueba manual del usuario** (`/app/*` está tras un login
que no puedo pasar, y el arnés usa datos sintéticos):

1. Abrir **Vida → Hoy** un día laborable con la jornada empezada. Debajo del
   arco **no debe haber ninguna frase**: la tarjeta acaba en el arco (o en
   «Cuenta …, en marcha desde las …» si hay sesión abierta).
2. Repetir el momento de la captura: pasadas las 23:00, con el día configurado
   hasta las 22:00 y ~7 h registradas. El arco tiene que verse **ámbar**, no
   rojo, con «TE FALTAN 51m» dentro.
3. Comprobar que el rojo sigue apareciendo cuando toca: sobre las 20:00 de un
   día con poco o nada registrado.
4. Con lector de pantalla (VoiceOver/TalkBack), el arco debe leerse «Trabajo,
   7h 09 de 8h» y «Te faltan 51 min de Trabajo.», **sin ninguna hora**.

**Lo que descubrí y no estaba en el plan** (no lo he tocado, por alcance):

- **El semáforo no distingue una meta que hoy no podía caber de una que se
  abandonó.** Con «Estudiar» (60 min), el rojo exige que queden menos de 48
  minutos de día: entre semana eso solo pasa después de las 22:12. Para metas
  pequeñas el rojo es casi inalcanzable. No es un defecto de esta tajada —el
  umbral es el que el usuario fijó— pero conviene saberlo antes de crear la
  segunda meta.
- **La medianoche sigue sin arreglarse** en todo el módulo (`getDayBudget`
  incluido): un día que acaba a las 00:00 se lee como el minuto cero. Con la
  hora de parada fuera, el síntoma más visible de eso (el «23:59» que salía en
  la frase) ha desaparecido — pero la causa sigue ahí y ahora se ve menos.
- **`ENVIRONMENT.md` no dice que no exista `preview_stop`** en el juego de
  herramientas del constructor. Ver la nota de abajo.

**Nota de entorno (no he tocado `ENVIRONMENT.md`, que es del usuario).** El
probe dio el **5173 apagado** al empezar. Para ver el arco renderizado arranqué
el servidor de `.claude/launch.json` (`preview_start {name}`), que cogió el
**5173** (no el 5174, así que el CORS de la API no se ve afectado), y monté el
arnés temporal `arnes-arco.html` + `src/arnes-arco.tsx` con datos sintéticos y
`MemoryRouter`. **Los dos archivos están borrados** (`git status` no los lista;
lo que aparece es esta tajada más lo que reescribe `graphify update .`). Lo que no pude hacer es **pararlo**: no tengo
`preview_stop` entre mis herramientas, solo `preview_start`. Queda un dev server
en el 5173 que yo arranqué; si el usuario levanta el suyo, que sepa de dónde
sale.

**Estado del árbol:** sin commitear. **Seis archivos de código y documento**
—`vida-goals.utils.ts`, `vida-goals.utils.test.ts`, `VidaGoalArc.tsx`,
`VidaGoalArc.module.scss`, `VidaHoyPage.test.tsx` y este expediente—, más
`BOARD.md` y lo que reescribe `graphify update .` bajo `graphify-out/` (regla
de `CLAUDE.md`). Ninguno nuevo, ninguno borrado.

## 4. Revisión — feature-reviewer

### Tajada 1 — Lo que falta, dentro del arco

**Veredicto: `accepted`.** Los siete criterios (559–565) se cumplen, medidos
por mi cuenta en el navegador y en el árbol; las cuatro líneas base se repiten
enteras y clavadas; no encontré ninguna regresión. Queda **una pregunta para el
usuario** (la frase visible entera, ver abajo) y **dos hallazgos anotados** que
no devuelven la tajada.

**Cómo verifiqué.** Arnés temporal propio (`harness-rev019.html` +
`src/harness-rev019.tsx`, **borrados**, `git status` lo confirma) montando
`VidaGoalArcRow` con seis estados sintéticos vía `buildGoalArcs` —los mismos
datos que ve la página—, a **375 px** y a **760 px**. No entré a `/app/*`: el
recorrido con sesión sigue siendo del usuario (límite estructural del
`ENVIRONMENT.md`).

**Criterios, uno por uno:**

- **559 — cumplido.** Medido en el navegador: con 210 min de 480 a las 13:25,
  dentro del arco se lee **«TE FALTAN / 4h 30»** en una sola línea de rótulo
  (`y=66`), y el `<text>` del valor contiene `4h 30`, no `17:55`. En el árbol,
  `arcValue === '4h 20'` y `arcCaption === ['Te faltan']`.
- **560 — cumplido.** El `<p>` con la frase entera mide **317 × 18 px** a 375
  y **702 × 18 px** a 760 (no 1×1), con clase `_line_…`, y dice literalmente
  «Llevas 3 h 30 min. A este ritmo paras a las 17:55.». Con cero minutos, «Si
  arrancas ahora, acabarías a las 17:00.», también visible. `line` no cambió
  en ninguna rama: lo comprobé contra el `git diff` —las tres asignaciones de
  `line` de `toArc` son idénticas a las de HEAD— y contra la aserción literal
  del test, que sigue siendo la misma cadena.
- **561 — cumplido.** Con 0 minutos: dentro «TE FALTAN / 8h» (no una hora de
  parada), y la cabecera sigue diciendo «0m de 8h». Mismo estado de texto, no
  uno distinto.
- **562 — cumplido.** Con 560 de 480 a las 18:10: dentro sigue **«PASASTE LAS
  8H / A LAS / 17:00»**, rótulo de dos líneas en `y=58/71` y `font-size=32`,
  exactamente la geometría de HEAD; la frase vuelve al `<p>` de 1×1 px; no
  aparece «Te faltan» por ningún lado. Sin adjetivos, sin `role="alert"` y sin
  un solo color de alarma: el `module.scss` no gana ningún ámbar ni rojo (lo
  verifiqué archivo entero, todos los colores son `--color-text`,
  `--color-text-secondary` o `--vida-goal-color`), y en pantalla solo hay azul
  de la meta y gris de la pista. **Cero naranja, cero rojo, cero exclamación**
  en los seis estados: el semáforo no se ha colado.
- **563 — cumplido.** Día pasado con 300 min: «REGISTRASTE / 5h», `font-size=32`,
  rótulo en `y=70`, frase a 1×1 px, sin proyección. Igual que HEAD.
  `variant = passedAtTime !== null ? 'passed' : 'logged'` cubre además el día
  **sin reloj** (futuro, `stopAtTime === null`) por la misma rama: tampoco ahí
  se ve la línea nueva.
- **564 — cumplido, y comprobado a la vista y al oído.** En el DOM hay **un
  solo `<p>`** con la frase (`getAllByText` de longitud 1 en el test, y en el
  navegador un único nodo); el `find` del árbol de accesibilidad devuelve
  **una sola coincidencia** para «A este ritmo paras a las 17:55»; el `<svg>`
  lleva `aria-hidden="true"` y **no tiene `aria-label`**, así que no hay
  segunda lectura por ahí. En «pasada la meta» y «día pasado» el mismo nodo
  vuelve a `srLine` (1×1 px) y la frase se oye una vez, no se ve ninguna.
  El hallazgo de FEAT-016 tajada 3 **no se ha reabierto**.
- **565 — cumplido, repitiendo la medición.** A 375 y a 760:
  `documentElement.scrollWidth === clientWidth` (375=375, 760=760) y
  `article.scrollWidth − clientWidth === 0` en los seis estados. La línea
  visible cabe en **una sola línea de 18 px** a las dos anchuras.

**La geometría, medida de nuevo (y dónde discrepo del constructor).** Repetí
`getComputedTextLength()` y `getBBox()` a 375 y 760 px. **Los anchos coinciden
cifra por cifra** con los suyos: `4h 30` 82,03 · `8h` 37,69 · `24h` 56,18 ·
`23h 59` **100,52** · `17:00` 76,84 · `5h` 35,49, contra una cuerda de 144,54
unidades a la altura de la cima del número. **Confirmo que el peor caso real es
«23h 59», no «24h»**, y que aun así sobran **44 unidades** (un 30 % de la
cuerda): el número no toca el trazo. La geometría es idéntica a 375 y a 760
—son unidades del `viewBox`, no píxeles—, así que la anchura no la cambia.

Donde **no** reproduzco sus números es en el aire vertical: yo mido la cima del
número con `getBBox()` y él con otra referencia, y sale un desfase constante de
~0,09 × `font-size` (≈3 unidades a 34, ≈2 a 32). Mis cifras: «te faltan» con
`34`/`y=66` → **+1,39**; el mismo estado con la geometría anterior (`32`/`y=70`)
→ **−0,58**; «pasaste las 8h» tal como está (`32`, rótulo `58`/`71`) → **−1,58**;
y ese mismo estado forzado a `34` → **−3,61**. **Las tres conclusiones del
constructor se sostienen con mis números**: la geometría del render da más aire
que la anterior, el `34` **no puede ser global** (empeora el rótulo de dos
líneas), y el estado «pasaste las 8h» es el más apretado de todos.

**Dictamen sobre «PASASTE LAS 8H»: queda anotado, no se arregla ahora.** Es
preexistente (FEAT-016), el criterio 562 dice expresamente que ese estado no
cambia en esta tajada, y **en pantalla no se ve colisión**: el solape es de
cajas de texto, no de trazos —comprobado en captura a 375 px, «A LAS» y «17:00»
se tocan de cerca pero se leen sin ambigüedad—. Arreglarlo aquí habría sido
tocar justo lo que el criterio blinda. **Hallazgo abierto para quien retome la
pieza**, no defecto de esta tajada.

**Qué se rompió cerca — cómo busqué.** `graphify explain "VidaGoalArc"` da
grado 3: solo `VidaGoalArcRow.tsx`, el propio archivo y el barril. `graphify
query "who uses buildGoalArcs and VidaGoalArc arcValue line"` (35 nodos, BFS 2)
no saca ningún consumidor fuera del módulo. Lo confirmé abriendo los archivos:
`buildGoalArcs` solo se llama en `VidaHoyPage.tsx:379` y en sus tests; el tipo
`VidaGoalArc` solo lo importan `VidaGoalArc.tsx` y `VidaGoalArcRow.tsx`; y
`arc.line` / `arc.arcValue` no se leen en ningún otro archivo de `src/`
(comprobado con `grep` acotado). Como el campo `variant` es **obligatorio** en
el tipo, cualquier otro productor del objeto habría reventado en `tsc`: el
typecheck sale limpio, así que no hay ninguno. **Ningún hallazgo.**

Lo que el constructor marcó como «lo que más probablemente rompí» —la doble
lectura de la frase— lo miré primero y es lo que está en el 564. **El
componente sigue siendo tonto**: `VidaGoalArc` no importa ni llama ningún hook
(lo único que añade es `const isMissing = arc.variant === 'missing'`), así que
la garantía de FEAT-016 se mantiene.

**Los tests, ¿se ablandaron?** Los leí con `git diff`, aserción por aserción.
**No.** Los dos casos «re-apuntados» conservan sus aserciones de `line`
literales (`'Llevas 3 h 40 min. A este ritmo paras a las 16:05.'` y `'Si
arrancas ahora, acabarías a las 17:00.'`), que es justo lo que ata el criterio
560, y **ganan** aserciones (`arcValue`, `arcCaption`, `variant`, y un
`not.toContain('4h 20')` sobre `line`). Nada quedó preguntando menos. Se añaden
8 casos (1893 → 1901 total, cuadra).

Dos matices que sí anoto:

- **La red de ancho de rótulo creció poco, no mucho.** Los tres casos de 24 h
  entran en un `it.each` cuyo cuerpo solo comprueba `caption.length ≤ 18` y
  `≤ 2` líneas — y «Te faltan» son 9 caracteres: pasan sin esfuerzo. Lo que de
  verdad estrena esta tajada es **el ancho del número**, y eso ningún test
  automático lo mide (`getComputedTextLength` no existe en jsdom); vive solo en
  la medición del navegador, que caduca en cuanto alguien cambie la geometría.
  No es un test ablandado, es una red que no cubre el riesgo nuevo. **Hallazgo.**
- El cambio de `startTime: '08:00'` a `'00:00'` en ese `it.each` **no debilita**
  los cuatro casos viejos: sus aserciones son solo sobre el rótulo, que no
  depende de la hora de arranque; era necesario para que 1450 minutos cupieran
  en el día.

**Estados.** Sin datos: con cero metas `VidaGoalArcRow` devuelve `null` —sin
cambios—; con cero minutos, el 561 es exactamente ese caso y está construido.
Cargando y error: no aplican, la tajada no añade ninguna consulta (el arco se
deriva de datos que la página ya tenía). Permisos: no aplica, no hay roles.
Texto largo: cubierto por el 565 y medido (el número más largo que existe,
«23h 59», y la frase visible). Móvil: 375 px sin scroll horizontal, verificado
en el documento **y** en la tarjeta. **Ninguno pendiente.** Matiz honesto: la
frase visible más larga que llegué a medir tiene 44 caracteres; si la de 50
llegara a partirse en dos líneas no sería defecto —no hay recorte ni scroll—,
pero no la vi con mis ojos.

**¿Duplica algo que ya existía?** No. Contra la sección 2: no se añadió ningún
`<p>`, es el mismo nodo con otra clase (lo que la sección 2 pedía
explícitamente); no se creó ninguna utilidad de formato nueva —usa
`formatDurationFromMinutes`, que ya existía en `vida-time.utils.ts`—; `toArc`
sigue siendo el único sitio donde se decide qué va dentro del arco; y el
discriminador `variant` es un campo del tipo que ya estaba, no una estructura
paralela. La clase `.line` es nueva pero necesaria: `.sub` (la línea de la
sesión en marcha) ya está ocupada por otro texto que convive con esta.

**Líneas base, repetidas enteras (mismo árbol, con el cambio dentro):**

| Qué | Línea base | Medido ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **`✖ 14 problems (14 errors, 0 warnings)`** |
| `pnpm test` | 2 fallos (`SearchSelect`) | **`Tests 2 failed \| 1899 passed (1901)`**, los dos de `SearchSelect`. `IconPicker` no salió flaky |
| `pnpm build` | exit 0 · inicial 1.128,56 kB · `app-icons` 620,20 kB | **exit 0** · inicial **1.128,56 kB** · `app-icons` **620,20 kB, sin mover** · `IconPicker` 4,64 kB |

**La pregunta que el constructor dejó abierta, dictaminada: es del usuario, y
el 560 no la resuelve.** El criterio 560 dice «con la misma frase que hoy
compone `arc.line`», así que **construirla entera fue lo correcto** y recortarla
por iniciativa propia habría sido desobedecer el criterio. Pero lo que el
constructor observó es real y lo confirmé en pantalla: la tarjeta dice «3h 30 de
8h» arriba y la línea de abajo repite «Llevas 3 h 30 min.», mientras el render
20 solo dibuja «A este ritmo paras a las 17:55.». **Dos razones para no
resolverlo aquí:** (1) recortar la parte visible cambia lo que oye un lector de
pantalla, que hoy recibe la frase entera y perdería el «llevas» que le da
contexto —o exige partir `line` en dos campos, que es diseño, no retoque—; y
(2) el render aprobado y el criterio se contradicen en este punto, y quien
desempata un render aprobado es el usuario. **Va como pregunta, con el matiz de
accesibilidad incluido.** No bloquea: lo que hay hoy es correcto y cumple el
criterio escrito.

**Para el usuario:** mañana, cuando esto esté desplegado, el número grande de
dentro del arco de trabajo dejará de ser una hora del reloj y pasará a ser **lo
que te falta**: «TE FALTAN 4h 30». Es la respuesta directa a tu pregunta
—«¿falta tiempo? ¿esa es la hora?»—: el arco mide horas trabajadas, así que
ahora dentro hay una cantidad de horas, no una hora. La hora a la que pararías
a ese ritmo **no se pierde**: baja a una línea que ahora se lee de verdad
debajo del arco («Llevas 3 h 30 min. A este ritmo paras a las 17:55.»), donde
antes estaba escondida para lectores de pantalla.

Dos cosas siguen exactamente igual, a propósito: cuando ya pasaste las ocho
horas, dentro sigue la hora a la que las cruzaste («PASASTE LAS 8H A LAS
17:00»), porque ahí ya no falta nada que anunciar; y un día que ya terminó
sigue contándose en pasado, sin proyección. **El semáforo de colores todavía no
está** —es la tajada 2—, así que si mañana ves algún naranja o rojo, eso sí
sería un defecto. Para probarlo a mano: entra en Vida → Hoy un día laborable
con la sesión de trabajo a medias, mira dentro del arco (tiene que decir «TE
FALTAN» y unas horas) y la línea de debajo (la hora de parada, dicha una sola
vez); luego pasa las ocho horas y comprueba que dentro vuelve a haber una hora
y que la línea de debajo desaparece.

### Revisión de la tajada 2 — **devuelta**

**Veredicto: `returned`.** Un criterio de los nueve no se cumple en un estado
que se alcanza todos los días: **con cero minutos trabajados el semáforo se
calcula pero no se pinta nada**. El resto de la tajada —la aritmética, los
bordes, la independencia entre arcos, la neutralidad del texto— está bien
hecha y verificada, y el token de color añadido por el usuario mide lo que dice
que mide. Es una devolución corta y concreta: una condición de render.

**El motivo, con el detalle exacto.** `VidaGoalArc.tsx` solo dibuja el trazo de
avance cuando hay avance:

```tsx
{arc.share > 0 ? (
  <path className={styles.valuePath} … />
) : null}
```

y `--vida-fit-color` **lo consume únicamente `.valuePath`** (comprobado en el
CSS emitido por `pnpm build`: las tres reglas `[data-fit=…]` solo declaran la
variable, y el único `stroke:var(--vida-fit-color,…)` es el de `.valuePath`).
Con `workedMinutes === 0`, `share` es `0`, el `<path>` no existe y **no hay ni
un píxel de color**, aunque `toArc` sí haya puesto `fitLevel` (esa rama asigna
`fitMinutes = fitCandidate`) y el `<article>` lleve el `data-fit` puesto.

Eso choca de frente con el criterio 566: «con la meta **sin cruzar** y el día
mostrado siendo **hoy** (mismas condiciones que el 559), el arco lleva un
color», y el 561 mete explícitamente el caso de cero minutos dentro de esa
ventana («con cero minutos trabajados hoy y la meta sin cruzar, el arco muestra
igualmente "TE FALTAN"»). No es un estado raro: es **cada mañana antes de la
primera sesión**, y es justamente donde el rojo tendría más valor —las 20:00,
nada registrado, ocho horas de meta: `fitLevel` vale `'over'` y la pantalla se
ve idéntica a un arco neutro—. Hoy el semáforo se enciende solo después del
primer minuto registrado.

No dictamino **cómo** arreglarlo (el trazo mínimo visible, el punto que el
propio criterio 572 menciona como alternativa, o pintar la pista): es una
decisión de forma y toca el render aprobado.

**Criterios, uno a uno**

| # | Estado | Evidencia |
|---|---|---|
| 566 | **no cumplido** | La fórmula y la ventana son correctas (`fitCandidate = parseTimeToMinutes(dayEnd) − nowMinutes − missingMinutes`, tras `canProject`), pero con `share === 0` no se pinta ningún color. Ver arriba. |
| 567 | cumplido | `toFitLevel`: `> GOAL_FIT_OK_MARGIN_MINUTES` → `'ok'`. Test del borde 61 (`14:59`, faltan 420, fin 23:00 → 61 → `ok`). |
| 568 | cumplido | `>= 0` → `'tight'`. Bordes **60** (`15:00`) y **0** (`16:00`) con test propio cada uno. |
| 569 | cumplido | `< 0` → `'over'`. Borde **−1** (`16:01`) con test propio. Los cuatro bordes que pedía el encargo están, y ninguno pasa por casualidad: cada uno comprueba `fitMinutes` **y** `fitLevel`. |
| 570 | cumplido | `vida-goals.utils.test.ts`: lunes `2026-09-21` (verificado con `date -d`: **Monday**), 9:15, 15 min de 480 → `fitMinutes` 360, `fitLevel` `'ok'`. El test afirma además que el porcentaje está por debajo de 0,9, así que la red falla si alguien reintroduce la lectura A. La prueba viva de la decisión del usuario está puesta y en verde. |
| 571 | cumplido | `data-fit` no se escribe: `data-fit={arc.fitLevel ?? undefined}`. Las tres ramas: meta cruzada (`passedAtTime !== null`) y `isPastDay || stopAtTime === null` no tocan `fitMinutes`, que nace en `null`. Verificado renderizado en dos de los tres casos (`VidaHoyPage.test.tsx`: `hasAttribute('data-fit') === false` pasada la meta y en día pasado) y en la util en el tercero (día futuro sin reloj: `nowMinutes` es `null` porque `useVidaNowMinute(isToday)` solo cuenta hoy). |
| 572 | cumplido | Lo verifiqué **en el rojo**, que es donde pedías: a las 17:00 con 1 h hecha el `<article>` lleva `data-fit="over"` y el texto es literalmente `Llevas 1 h. A este ritmo paras a las 23:59.` + `Te faltan`, sin `role="alert"` (`queryAllByRole('alert')` → 0) y sin ningún signo ni adjetivo (`textContent` contra `/!|tarde|corre|no llegas|deberías|cuidado/i`). En el código, `fitLevel` no entra en ninguna rama que componga `line` ni `arcCaption`: se calcula después y solo viaja al `data-` del `<article>`. El 493 de FEAT-016 sigue respetado. |
| 573 | cumplido | Mismo mecanismo que el 571, con test de página propio sobre `?d=2026-09-17` y `isPastDay`, más el `it.each` de la util con el día pasado **que llegó a la meta** y el que **no llegó**. |
| 574 | cumplido | `fitLevel` se calcula dentro de `toArc`, por arco, sobre `tally`; no hay estado de módulo, ni memo compartido, ni variable fuera de la función. El caso de colores opuestos existe y es real: a las 16:00, «Trabajo» (faltan 420, quedan 420) → `tight`, «Estudiar» (faltan 50) → `ok`. En el DOM tampoco pueden mezclarse: `--vida-fit-color` se declara en cada `.card`, así que cada `<article>` hereda el suyo. |

**El cambio de color que metiste tú, revisado como cualquier otro: las cifras
están bien.** Reimplementé tu ΔE con **el mismo código del proyecto** (`toOklab`
+ `100 * Math.hypot(...)` de `src/features/habits/data/habit-colors.test.ts:16-44`,
la escala 0-100 que usa el validador de paletas) y sale exactamente lo que
escribiste:

| Par | ΔE |
|---|---|
| `#c93400` (ámbar heredado) vs `#ba1a1a` (rojo Aura claro) | **5,2** |
| `#d97706` vs `#ba1a1a` | **18,8** |
| `#d97706` vs `#059669` (verde Aura claro) | **23,7** |
| `#ff9500` (ámbar heredado en oscuro) vs `#ffb4ab` (rojo Aura oscuro) | **13,7** |
| `#ffd166` / `#f7c948` / `#fcd34d` / `#eab308` vs `#ffb4ab` | 12,5 / 13,5 / **14,7** / 14,6 |

Y el diagnóstico de partida también: `[data-ds='aura']` (línea 155 de
`_theme-variables.scss`) y `[data-theme='dark'] [data-ds='aura']` (línea 239)
redefinen `--color-success` y `--color-danger` y **no** `--color-warning`.

**La cascada gana en claro y pierde en oscuro de verdad.** No me fié de la
especificidad sobre el papel: la leí en el CSS emitido por `pnpm build`
(`dist/assets/index-B0DZBaPe.css`), donde las reglas salen **en este orden**:

```
._card_tc5xt_21[data-fit=tight]{--vida-fit-color:var(--color-warning)}
[data-ds=aura] ._card_tc5xt_21[data-fit=tight]{--vida-fit-color:#d97706}
[data-theme=dark] [data-ds=aura] ._card_tc5xt_21[data-fit=tight]{--vida-fit-color:var(--color-warning)}
```

0-2-0 < 0-3-0 < 0-4-0 y además en orden creciente, así que no depende del
orden. Y el descendiente funciona porque **son dos elementos distintos**:
`data-theme` vive en `<html>` (`theme.utils.ts:19`) y `data-ds` en el `<main>`
de `AppLayout.tsx:196`; si alguna vez acabaran en el mismo nodo, la regla
oscura dejaría de casar y el ámbar claro se colaría en oscuro. Queda dicho.

**Dónde más muerde ese selector: en ningún sitio.** `.card` está hasheado por
CSS Modules (`_card_tc5xt_21` en el bundle), así que `[data-ds='aura'] .card`
no puede alcanzar ninguna otra tarjeta de la app; `--vida-fit-color` no aparece
en ningún otro `.scss` ni `.tsx` (`grep -rn "data-fit\|vida-fit-color" src/`
solo devuelve el componente del arco y sus tests); y `VidaGoalArc` solo se
monta desde `VidaGoalArcRow`, que solo se monta en `VidaHoyPage`, que vive bajo
`main[data-ds='aura']` (`contentDs` solo es `undefined` en `/app/settings`).

**Un hueco en tu razonamiento del oscuro, que no bloquea nada.** El comentario
dice «medí cinco candidatos y ninguno pasa de 14,7», pero lista cuatro
(`#FFD166`, `#F7C948`, `#FCD34D`, `#EAB308`) y **el quinto no es el que uno
esperaría**: `#D97706`, el que elegiste para claro, da en oscuro **ΔE 19,6
contra `#FFB4AB` y 28,1 contra `#4EDEA3`** — pasa el listón de 15 con holgura.
Es decir, «no hay mejora que ganar» no está demostrado; lo que probablemente
haya es otra razón (un ámbar oscuro sobre un fondo oscuro pierde contraste
contra la superficie, que es un criterio distinto del ΔE entre peldaños). Si la
razón es esa, merece estar escrita, porque tal como está el comentario invita a
que el siguiente repita la búsqueda.

**Regresiones: cómo busqué y qué encontré.** Nada roto.

- `graphify explain "buildGoalArcs"` y `graphify explain "VidaGoalArc"` sobre
  el grafo (que refleja el estado **anterior** al cambio, que es justo lo que
  quiero para «¿quién dependía de esto?»): `buildGoalArcs` solo lo contiene su
  módulo y llama hacia abajo; `VidaGoalArc` solo tiene entrantes de
  `VidaGoalArcRow.tsx` y del barril. Confirmado abriendo los archivos y con
  `grep -rn "buildGoalArcs\|VidaGoalArc" src/`: **un único llamador de
  producción**, `VidaHoyPage.tsx:380`.
- El riesgo que tú mismo marcaste primero —«si alguna rama dejara `fitLevel`
  puesto donde no toca»— es el que más miré: leí las cuatro ramas de `toArc` y
  solo las dos de `variant === 'missing'` asignan `fitMinutes`. Correcto.
- `dayEnd` obligatorio en `BuildGoalArcsInput`: `pnpm typecheck` limpio
  (exit 0) cubre a todos los llamadores, y no hay ningún `vi.mock` de
  `vida-goals` en el repositorio, así que no hay mock que caducara en
  silencio. El `useMemo` de `VidaHoyPage` sí añadió `dayHours.endTime` a las
  dependencias: sin eso el color se habría quedado congelado al cambiar las
  horas del día.
- Lo que convive en la misma pantalla: `VidaDayBudget` y `getDayBudget` reciben
  el **mismo** `dayHours.endTime` y no se han tocado; el arco no toma
  `budget.remainingMinutes` (que está topado en 0), y la razón está escrita en
  el tipo. `VidaGoalPrompt` está en la misma rama del JSX y no cambió.
- La red de los 18 caracteres del rótulo (`vida-goals.utils.test.ts:222-229`)
  sigue intacta: el diff de ese archivo es +250/−1, y la única línea borrada es
  el `import`, que ganó `GOAL_FIT_OK_MARGIN_MINUTES`.
- Las dos garantías de FEAT-016 que pedías comprobar: `VidaGoalArc.tsx` importa
  `CSSProperties`, el tipo del arco, `AppIcon` y sus estilos — **ni un hook**;
  y `vida-goals.utils.ts` solo importa tipos y utilidades (`vida-time.utils`,
  `vida-execution.utils`), **nada de presentación**. Las dos se mantienen.

**Estados**

- **Sin datos (cero minutos)** — es el fallo de arriba. El estado existe y está
  pensado en la aritmética; lo que falta es que se vea.
- **Cargando** — hay un hueco. El arco se pinta en cuanto llega el **catálogo**
  (`categoriesLoading` es la única puerta, `VidaHoyPage.tsx:1208`), pero el
  final del día viene de `useVidaDayHours`, que **mientras carga devuelve el
  respaldo 23:00** y avisa con `isDefault`/`isPending`. Si los ajustes tardan
  más que el catálogo y el usuario tiene el día acabando a las 18:00, el arco
  se pinta **verde y luego salta a rojo**. El propio hook documenta que
  `isPending` existe «para que nadie pinte un presupuesto con horas por defecto
  que luego salte». No lo devuelvo por esto —ningún criterio lo pide y la
  ventana es de milisegundos con caché caliente—, pero queda como hallazgo: es
  el mismo argumento del criterio 50 aplicado al color.
- **Error** — cubierto por lo que ya había: `failed.length === 0 &&
  !categoriesFailed` esconde el bloque entero, así que no hay semáforo sobre
  datos incompletos.
- **Permisos** — no aplica: no hay roles en este módulo.
- **Texto largo** — no aplica: esta tajada no añade ni una palabra (es
  precisamente el criterio 572).
- **Móvil (375 px)** — sin riesgo estructural y **no medido en el navegador**:
  el cambio no añade ni un nodo al DOM ni toca una sola propiedad de
  disposición; es un `stroke` y un atributo `data-`. La geometría del arco es
  la de la tajada 1, ya medida y aceptada. Dicho sin disimular, como manda
  `ENVIRONMENT.md`: **Hoy está detrás del login y yo no entro con
  credenciales**, así que a 375 y a 760 px esto lo cierra el usuario.

**Accesibilidad — mi dictamen: hay que subírselo al usuario, pero no bloquea
esta tajada.** El criterio 572 obliga a que el color **no** añada texto, y está
bien cumplido; ningún criterio de los nueve pide un portador alternativo, así
que devolverlo por esto sería inventarme un criterio. Ahora, concretamente,
esto es lo que **no** puede saber alguien que no distingue rojo de verde:

1. **El escalón naranja es directamente indeducible.** «Cabe, pero con menos de
   una hora de margen» no está escrito en ninguna parte: habría que restar la
   hora de parada del arco de la hora de fin del día de `VidaDayBudget` y
   compararla con 60. Los 60 minutos del umbral no aparecen en ningún texto.
2. **El rojo sí es deducible, pero cruzando dos sitios** —la línea del arco
   («paras a las 19:30») y la de `VidaDayBudget` («hasta las 18:00»)—, que es lo
   que ya dijiste.
3. **Y hay un caso donde ni cruzándolos se puede:** cuando lo que falta se
   pasa de medianoche, `minutesToTime` **recorta a 23:59**, así que la frase
   dice «A este ritmo paras a las 23:59» tanto si pararías a las 23:59 como a
   las 3 de la mañana. Se ve en el propio test nuevo de la página (17:00 + 7 h
   → «23:59»). Con el día acabando a las 23:00 todavía se nota que no cabe; con
   un día que acaba a las 23:30 o más tarde, el rojo es **solo** color. Esto no
   lo trae esta tajada (el recorte es de FEAT-016), pero el semáforo es lo que
   lo convierte en información perdida.

Lo que yo le llevaría al usuario, en una frase: *«¿quieres que el semáforo diga
también con palabras cuánto margen te queda, aunque eso añada una línea al
arco?»* — es la misma pregunta que ya dejaste abierta sobre partir `line` en
dos campos, y conviene que se decidan juntas, no una en cada tajada.

**Líneas base, repetidas enteras y después de tu cambio de color** (las cuatro
en el árbol tal como está, sin commitear):

| Qué | Resultado | Línea base | Veredicto |
|---|---|---|---|
| `pnpm typecheck` | limpio, exit 0 | limpio | igual |
| `pnpm lint` | **14 errores / 0 warnings** | 14/0 | igual |
| `pnpm test` | **2 fallos de 1920** (`SearchSelect` ×2, `1 failed / 117 passed` de 118 archivos, 109,8 s) | 2 de 1920 | igual, y el `IconPicker` flaky no apareció |
| `pnpm build` | **exit 0**, inicial **1.128,81 kB**, `app-icons` **620,20 kB**, `IconPicker` 4,64 kB | 1.128,81 / 620,20 | **sin mover** |

Tu cambio es CSS y no entra en esos dos números; el único sitio donde podría
notarse es `index-….css`, que queda en **274,35 kB** (gzip 42,31) — no tengo
cifra anterior con la que compararlo porque `ENVIRONMENT.md` no mide el CSS, y
lo dejo apuntado como lo que es: un dato sin línea base.

**Dos cosas de `ENVIRONMENT.md` que están desfasadas y que no toco** (no es mi
archivo): la tabla dice `pnpm test → 2 fallos de **1901**` y `pnpm build →
**1.128,56 kB**; hoy son 1920 y 1.128,81 kB. La `probe.sh` lee esas cifras y
las repite, así que quien venga detrás las leerá mal.

**Lo que no revisé:** no vi la pantalla real a 375 ni a 760 px (login), no
ejecuté el arnés que dice el constructor haber usado y borrado, y no comprobé
el render aprobado `20-vida-arco-lo-que-falta.html` contra el resultado píxel a
píxel — me quedé en que la lectura implementada es la B y en el caso del
criterio 570, que es lo que decide la discusión.

**Para volver a mí:** basta con que el color se vea también con cero minutos
trabajados. Todo lo demás de esta tajada me vale tal cual está.

### Revisión de la tajada 2, segunda vuelta — **aceptada**

**Veredicto: `accepted`.** El único criterio que faltaba —el 566 con cero
minutos— está cerrado, el incidente del comentario SCSS no llegó a producción y
el `dist` actual lo demuestra, y el respaldo de las 23:00 se resolvió mejor de
lo que yo lo había anotado. Los nueve criterios (566–574) quedan cumplidos con
evidencia. No es la última tajada: quedan la 3 y la 4, las del API.

**1. El punto, y la afirmación que lo sostiene: verificada, y es más fuerte de
lo que dice el constructor.** El orden de pintado dentro del `<svg>` es
`trackPath` → `<circle class="fitDot">` → `valuePath`, y en SVG manda el orden
del documento. De ahí salen las dos cosas que había que comprobar:

- **Con cero minutos se ve**, porque el punto va **después** de la pista gris:
  la tapa, no al revés. Si el `<circle>` estuviera antes del `trackPath` no se
  vería nada y el arreglo sería aparente; no es el caso.
- **Con un minuto desaparece**, y no «queda tapado casi del todo»: queda tapado
  **exactamente**. `valuePath` arranca en el mismo `M22 106`, con
  `strokeWidth="14"` y `strokeLinecap="round"`, así que su remate redondo es un
  disco de radio 7 centrado en (22,106) — **el mismo disco** que
  `cx="22" cy="106" r="7"`. Y vale para cualquier avance por pequeño que sea:
  el `strokeDasharray` acorta el tramo, pero el remate redondo del arranque no
  depende de su longitud. Ningún estado ya aceptado cambia de aspecto.

**Y con eso contesto lo del solape de 1 px, que es un no-problema.** El
`trackPath` se dibuja **siempre**, entero (no lleva `dasharray`), con los
mismos `strokeWidth="14"` y `strokeLinecap="round"`: es decir, **ese disco de
radio 7 sobre la caja del «0h» ya lo estaba pintando la pista gris desde
FEAT-016**. El punto no ocupa un píxel nuevo, repinta los que ya estaban
ocupados, solo que de color. No es «el mismo espacio, aproximadamente»: es la
misma circunferencia, misma `cx`, misma `cy`, mismo radio. **Dictamen: se queda
como está**, y no hay nada que subirle al usuario por esto. Lo digo desde la
geometría del SVG y no desde el navegador, que sigue estando detrás del login.

Las otras dos salidas están bien descartadas y por la razón correcta: el trazo
mínimo **falsificaría el dato** (el 495 de FEAT-016 exige el arco vacío con
cero) y teñir la pista pondría el semicírculo entero en rojo cada mañana. El
punto es, además, literalmente la marca que nombra el criterio 572.

**2. El comentario sin cerrar: confirmado sano, y lo he comprobado yo, no de
oídas.**

- **El commit desplegado `1a8423d` está limpio.** Quité todos los comentarios
  del SCSS de ese commit con un `re.sub(r'/\*.*?\*/', '', …, re.S)` y comprobé
  que **sobreviven** `.caption`, `.value`, `.edge`, `.valuePath`, `.trackPath`
  y `.line`, y que no queda ningún `/*` huérfano. Nunca llegó a producción.
- **El `dist` actual trae todo.** En `dist/assets/index-DXPH2KHF.css` están las
  **cuatro** reglas del semáforo
  (`._card_bvfr8_21[data-fit=ok|tight|over]` + `[data-ds=aura] …{#d97706}`) y
  las veinte clases del módulo del arco, incluidas las tres que se habían
  evaporado: `_caption_bvfr8_179`, `_value_bvfr8_119` y `_edge_bvfr8_194`, más
  el `_fitDot_bvfr8_175` nuevo.

Sobre el incidente en sí, y esto vale para quien venga detrás más que el
propio arreglo: **ninguna de las cuatro puertas mira dentro de un `.scss`**. El
SCSS mal cerrado compila sin error (un comentario abierto es CSS válido hasta
el final del archivo), `tsc` no lo ve, el linter no lo mira, vitest no compila
CSS y el build acaba en verde. La única señal fue el tamaño del CSS, que es
justo lo que se ha añadido a la línea base. Es la respuesta correcta al
incidente.

**3. El respaldo de las 23:00: cerrado, y con la distinción que yo pedía.** El
código hace exactamente lo que dice que hace: `dayEnd: dayHours.isPending ?
null : dayHours.endTime` (`VidaHoyPage.tsx`), con `dayHours.isPending` en las
dependencias del `useMemo`. Es `isPending`, **no** `isDefault`: quien nunca
configuró su día tiene las 23:00 como hora real y ve su semáforo igual que
todos. `BuildGoalArcsInput.dayEnd` pasa a `string | null` y la puerta en
`toArc` es `canProject && day.dayEnd !== null`, así que el `null` sale por el
mismo sitio que ya apagaba el color fuera de la ventana. **No queda ningún
camino pintando con el respaldo**: hay una sola llamada a `buildGoalArcs` en
producción y `typecheck` cubre al resto. Hay test de la util (`dayEnd: null` →
`fitLevel` y `fitMinutes` nulos, y **todo lo demás igual**: `variant`,
`missingMinutes` y `line` intactos). *Hallazgo menor, no bloquea:* no hay test
de página que fije el cableado —que la página mande `null` cuando los ajustes
cargan—, así que si alguien quita ese ternario, la util sigue en verde. Los
tests nuevos de color sí fallarían si el ternario se invirtiera, que es media
red.

**4. Tu color, revisado otra vez porque cambió desde la primera vuelta.** Ahora
hay **una sola** regla (`[data-ds='aura'] .card[data-fit='tight']` →
`#d97706`), sin la excepción oscura que había antes: el ámbar propio manda en
los dos temas. Es coherente con lo que medí en la primera vuelta —en oscuro
`#D97706` da **ΔE 19,6** contra `#FFB4AB` y **28,1** contra `#4EDEA3`, los dos
por encima del listón de 15—, así que el hueco que señalé queda cerrado por el
camino de arriba. Lo comprobado en el CSS emitido: la regla existe una vez y no
hay ninguna `[data-theme=dark]` que la deshaga. *Dato para la hucha, no
defecto:* sobre la superficie oscura de Aura (≈ `#1a202d`), `#D97706` queda a
**5,12:1** de contraste frente a 7,4-9,6 de los otros tres colores — muy por
encima del 3:1 que pide un objeto gráfico, pero es el peldaño más apagado de
los tres en oscuro. Si alguna vez se ve flojo en pantalla, ahí está el número.

**Regresiones de esta vuelta: ninguna.** Volví a mirar lo que el cambio toca:
el `<circle>` es el único nodo nuevo del DOM y vive dentro del `<svg>` que ya
existía (no cambia la caja de nada: el `viewBox` manda); `VidaGoalArc` sigue sin
un solo hook; `vida-goals.utils.ts` sigue sin importar presentación; el
`useMemo` de la página ganó su dependencia. Los criterios que ya había aceptado
en la primera vuelta (567-574) siguen con sus mismos tests y les he sumado los
nuevos: el punto presente con cero minutos y `data-fit="over"` a las 20:00 (con
`valuePath` **ausente**, que es lo que prueba que el arco sigue vacío como
exige el 495), y el punto **ausente** fuera de la ventana.

**Líneas base, repetidas enteras sobre el árbol de esta segunda vuelta:**

| Qué | Resultado | Línea base nueva | Veredicto |
|---|---|---|---|
| `pnpm typecheck` | limpio, exit 0 | limpio | igual |
| `pnpm lint` | **14 errores / 0 warnings** | 14/0 | igual |
| `pnpm test` | **2 fallos de 1925** (1 archivo de 118). Comprobado que son los de siempre: `pnpm test src/shared/ui/SearchSelect` aislado da **2 fallos de 2** | 2 de 1925 | igual |
| `pnpm build` | **exit 0**, inicial **1.128,98 kB**, `app-icons` **620,20 kB**, `IconPicker` 4,64 kB | 1.128,98 / 620,20 | sin mover |
| CSS | **274,32 kB** (medido en el archivo, `dist/assets/index-DXPH2KHF.css`) | 274,32 kB | igual — y ahora **sí** hay línea base que mirar |

**Lo que sigue sin revisarse, dicho como manda `ENVIRONMENT.md`:** no he visto
la pantalla real a 375 ni a 760 px, porque Hoy está detrás del login y no entro
con credenciales. El punto lo he dictaminado por geometría del SVG (que es
determinista) y el color por el CSS emitido, pero **el recorrido a mano lo
cierra el usuario**. Tampoco he cotejado píxel a píxel contra el render 20.

### Revisión de la tajada 3 — **aceptada**

**Cómo revisé.** Contra los criterios literales de la sección 1 (575–580 y
584), no contra el resumen del constructor; en **los dos** repositorios, con el
árbol tal como lo dejó (sin revertir nada) y corriendo yo las puertas.
`graphify explain "buildGoalArcs"` y `graphify explain "ensureDefaultGoal"`
para el radio de lo tocado, y `graphify query` para el resolver de
`ActivityCategory.goal`. **No entré a `/app/*`** (login): todo lo de abajo es
jsdom, SQL, `graphql` y aritmética.

**Criterios, uno a uno:**

- **575 — la columna, y la meta automática nace L-V.** ✅ en código, **pendiente
  de despliegue** (lo dice el propio criterio de hecho: la migración la corre
  el push del usuario). `ALTER TABLE … ADD COLUMN IF NOT EXISTS active_days
  TEXT[] NOT NULL DEFAULT ARRAY['monday'…'friday']` rellena las filas que ya
  existen en el mismo `ALTER` (PG ≥ 11 no reescribe), y **verifiqué que
  `ensureDefaultGoal` sigue siendo correcto sin nombrar la columna leyendo el
  SQL, no el resumen**: su `INSERT … ON CONFLICT DO UPDATE RETURNING *` —igual
  que `getOwnedGoalRowOrThrow` y `listGoals`, que también son `SELECT *`—
  trae la columna nueva sin listarla, así que `mapGoal` la ve. Ningún `SELECT`
  de metas enumera columnas: no hay sitio donde el campo se caiga.
  El runner (`scripts/migrate.ts`) lleva registro en la tabla `migrations`,
  ordena por nombre y corre cada `-- UP` en su propia transacción → la
  070 no se reejecuta.
- **576 — un sábado no aparece el arco.** ✅ El filtro saca la meta del `Map` de
  tallies **antes** de sumar (`vida-goals.utils.ts:319`), no pinta un arco
  vacío ni oculto; el test de página lo comprueba en negativo por tres vías
  (`article` nulo, `[data-fit]` nulo, sin el texto «Te faltan») y además que la
  agenda queda pegada al presupuesto (sin hueco). Corrí yo las suites.
- **577 — lo registrado ese día se sigue guardando.** ✅ Lo comprobé por el lado
  que más me preocupaba, que no es el test: **quién más lee las metas**. El
  único consumidor de `buildGoalArcs` en todo el front es `VidaHoyPage`
  (`grep` tras `graphify`: `VidaHoyPage.tsx:380`), y **`VidaRevisionPage` no
  menciona `goal` ni una vez** — la Revisión nunca pasó por aquí, así que no
  hay forma de que este filtro le quite una sesión. En la util, la sesión del
  sábado no se recoloca en «sin dato» (`noDataMinutes` 0) y el array de
  `followUps` sale idéntico; en la página, «Working at lululemon» se sigue
  viendo. Ninguna mutación de escritura se ha tocado.
- **578 — no cuenta como día en rojo.** ✅ No existe ningún nodo de semáforo:
  `[data-fit]` es nulo en el DOM y `arcs` es `[]` también en el **sábado
  pasado** (12/09). No hay color, ni pintado ni escondido.
- **579 — cada meta por sus propios días.** ✅ El filtro lee
  `tally.goal.activeDays` meta a meta; util (sábado → solo «Estudiar») y página
  (sábado → «Trabajo» nulo y «Sueño» presente) lo cubren.
- **580 — la pregunta no puede divergir del arco.** ✅ y es lo que mejor está
  resuelto: `promptAllowed` **sale del mismo `buildGoalArcs`** y la página solo
  lo consume (`VidaHoyPage.tsx:1225`), dentro de la rama `arcs.length === 0`
  que ya existía. Miré si podían divergir por algún camino: con metas en el
  catálogo, `promptAllowed` es `tallies.size > 0` **después** del filtro, y si
  hay tallies hay arcos → la pregunta no puede salir con arcos ocultos; sin
  ninguna meta, se compara con `DEFAULT_GOAL_ACTIVE_DAYS`. No hay una segunda
  condición de día de la semana en la página. El test del lunes siguiente evita
  que alguien la apague para siempre.
- **584 — puertas en los dos repositorios.** ✅ **corridas por mí**, no
  heredadas: front `pnpm typecheck` limpio, `pnpm lint` **14 errores / 0
  warnings**, `pnpm test` **2 fallos de 1935** (los dos de `SearchSelect`),
  `pnpm build` exit 0 con **CSS 274,32 kB clavado** (la señal de SCSS perdido
  que pide `ENVIRONMENT.md`) y JS inicial 1.129,25 kB. API: `npx tsc --noEmit`
  exit 0 y `npm test` **3 fallos de 576, 6 suites en rojo — las mismas seis**
  (hábitos, sueño, standup, gastos), `vida-goal.service` 9/9.

**Qué se rompió alrededor (cómo busqué, no solo el resultado):**

- `graphify explain "buildGoalArcs"` → aristas a `countsOn`, `categoryIdOf`,
  `toSessionSpans`, `formatDurationMinutes`; ningún consumidor nuevo. Confirmado
  abriendo los archivos: **un solo llamador**, `VidaHoyPage`.
- **Las tajadas 1 y 2, intactas.** `git diff --stat` no lista
  `VidaGoalArc.tsx`, `VidaGoalArcRow.tsx` ni ningún `.module.scss`: `arcValue`,
  `variant`, `fitLevel` y `fitDot` no se tocan, y el CSS sale byte a byte con
  el mismo tamaño. **El test movido del criterio 571 no afloja nada**: comparé
  la versión de `HEAD` con la actual línea a línea — cambia `date:
  '2026-09-19'` por `'2026-09-21'` (lunes, y sigue siendo futuro respecto al
  viernes 18 de la suite) y **las dos aserciones son idénticas**
  (`arcs[0].stopAtTime` nulo, `arcs[0].fitLevel` nulo). Con el sábado, `arcs[0]`
  habría sido `undefined` y el test habría reventado en vez de afirmar: el
  cambio lo devuelve a medir lo que medía.
- **Quién más depende del dato tocado:** los cinco documentos del catálogo los
  consume `useActivityCategories`, y de ahí cuelgan **nueve archivos** de Vida
  (Hoy, Categorías, Actividades, Archivadas, `VidaTemplateAddPanel`,
  `VidaActivitySheet`, `CreateVidaCategoryStep`, `vida-error.utils`). De ahí
  sale el hallazgo 1.
- `getVidaDayOfWeek` usa `parseYmdToLocalDate` (no `new Date(ymd)`): no hay
  corrimiento de día por zona horaria al comparar `activeDays`.

**Hallazgo 1 — el orden del despliegue es correcto, pero el fallo que describe
el constructor es más pequeño que el real.** No me fié de la descripción y lo
reproduje: construí el esquema con el SDL vendorizado **de `HEAD`** (el que hay
desplegado hoy) y validé con `graphql` los documentos nuevos:

```
ACTIVITY_CATEGORIES_QUERY      → Cannot query field "activeDays" on type "VidaGoal".
ACTIVITY_CATEGORY_QUERY        → Cannot query field "activeDays" on type "VidaGoal".
ACTIVITY_CATEGORY_ADD_MUTATION → Cannot query field "activeDays" on type "VidaGoal".
ACTIVITY_CATEGORY_EDIT_MUTATION→ Cannot query field "activeDays" on type "VidaGoal".
ACTIVITY_CATEGORY_GOAL_SET_MUTATION → Cannot query field "activeDays" on type "VidaGoal".
```

Es un error de **validación del documento**, antes de que corra ningún
resolver: el servidor no devuelve `data` en absoluto. Y
`graphql-client.ts:51-53` lanza en cuanto `json.errors` trae algo, incluso con
datos parciales. Es decir: si el front sale antes que el API **no se ve «la
pregunta en vez del arco un lunes»** — se cae **el catálogo entero** de Vida
(listar, crear, editar categoría y apuntar la meta) en las nueve pantallas de
arriba, cualquier día de la semana. El síntoma que hay que buscar en el paso 2
del recorrido a mano no es la pregunta: es el estado de error del módulo.

**¿Hay forma barata de que el front tolere `activeDays` ausente? No, y conviene
decirlo sin adornos.** Un `activeDays?:` en el tipo o un `?? DEFAULT_GOAL_
ACTIVE_DAYS` en `countsOn` no ayudan: el documento sigue pidiendo el campo y el
fallo ocurre en la validación, no al leer la respuesta. Lo único que taparía
algo es hacer el campo **anulable** en el SDL del API, y solo taparía la
segunda ventana (código desplegado con la migración aún sin correr), a cambio
de un contrato más flojo para siempre. **El orden API-primero es la única red
de verdad.** Y con un matiz que `ENVIRONMENT.md` ya trae y que conviene leer
junto a esto: **Render auto-despliega por su cuenta y el job de migración de
Cloud Run tarda minutos**, así que la referencia no es «ya hice push» sino **el
workflow en verde**; hasta entonces el front nuevo tampoco debe usarse. El
front que hay hoy en producción no pide el campo y no se entera de esa ventana.

**Hallazgo 2 (menor) — la migración no es reejecutable a mano.** El
`ADD COLUMN` lleva `IF NOT EXISTS`, pero el `ADD CONSTRAINT
vida_goals_active_days_not_empty` no puede llevarlo (Postgres no lo soporta):
correr la 070 dos veces contra la misma base sin pasar por el runner falla.
Con el runner y su tabla `migrations` no ocurre; lo dejo escrito porque la
asimetría entre los dos `ALTER` invita a pensar que sí es idempotente.

**Hallazgo 3 (menor) — el `DOWN` va entero comentado** (como la 069): una
vuelta atrás con `migrate:rollback` no quita ni la columna ni el `CHECK`.
Es el precedente del repositorio, no una desviación de esta tajada.

**Estados que nadie construye:** esta tajada **quita** interfaz, no dibuja
nada; ninguno de los estados nuevos aplica. *Vacío*: es precisamente el caso
que construye (sábado → hueco limpio, comprobado que la agenda no deja
agujero). *Carga*: la rama del `Skeleton` no se toca y va **antes** del filtro.
*Error*: sin cambios propios, pero es el que amplifica el hallazgo 1. *Sin
permisos*: no aplica (todo es del usuario y el resolver ya valida propiedad;
`getOwnedGoalRowOrThrow` sigue igual). *Texto largo* y *móvil a 375 px*: no
aplican, no hay nada nuevo que pintar y el CSS no cambió. Lo que sí queda
**pendiente de prueba manual**: cualquier cosa en `/app/*` —el sábado real sin
arco, el lunes con arco, la sesión del sábado en Revisión— porque está detrás
del login y **el 5173 sigue apagado**; y la migración 070 contra Neon, que solo
existe cuando el usuario haga push.

**¿Duplica algo que ya existía?** No. Contra la sección 2: reutiliza
`getVidaDayOfWeek`, `VIDA_DAY_ORDER` y el tipo `VidaDayOfWeek` (no inventa
vocabulario ni traduce en ningún borde), no crea consulta `vidaGoals`, no toca
`user_settings`, no añade componentes ni formateadores y respeta la forma
`TEXT[]` con sus tres precedentes. La única duplicación es
`DEFAULT_GOAL_ACTIVE_DAYS` frente al `DEFAULT` de la columna, que el propio
plan acepta y el código documenta; no hay forma de atarlas sin una consulta que
la sección 2 prohíbe.

**Veredicto: aceptada.** Los seis criterios de lectura (575–580) están
cumplidos con evidencia propia y el 584 lo he medido yo en los dos
repositorios; lo pendiente (migración desplegada, recorrido a mano) es del
usuario por construcción, no una deuda de la tajada. Los tres hallazgos se
quedan escritos: ninguno es un criterio incumplido ni una regresión.

**Nota para `ENVIRONMENT.md` (no lo edito, es del usuario):** la línea base del
API dice «3 fallos de 560» y hoy son **3 de 576, 52 suites** (los mismos tres
fallos y las mismas seis suites rotas) — lo confirmo con mi propia corrida, el
constructor ya lo había señalado.

### Tajada 5 — El rojo solo si el día acaba corto, y fuera la hora proyectada

**Veredicto: `accepted`.** Los seis criterios (585–590) están cumplidos con
evidencia propia —barrido de la frontera minuto a minuto, no solo los casos que
el constructor eligió—, el 584 lo he vuelto a medir entero, la bajada del CSS
es **exactamente** la regla `.line` y nada más, y `stopAtTime` no tenía ningún
consumidor vivo. No encontré ninguna regresión. Cuatro hallazgos anotados;
ninguno devuelve la tajada.

**Cómo verifiqué la aritmética (y no solo los casos del constructor).** Monté
un barrido temporal (`src/features/vida/utils/zz-rev-sweep.test.ts`, **borrado**
— `git status` solo lista los cinco archivos de la tajada más el expediente,
`BOARD.md` y `graphify-out/`) que llama a `buildGoalArcs` **minuto a minuto de
las 6:00 a las 23:59** para varios valores de minutos trabajados, y anota cada
cambio de `fitLevel`. Meta de 480, día hasta las **22:00** (el caso del
usuario):

| Trabajado | Verde hasta | Naranja desde | **Rojo desde** |
|---|---|---|---|
| 0 | 12:59 | 13:00 | **15:37** |
| 30 | 13:29 | 13:30 | **16:07** |
| 2 h | 14:59 | 15:00 | **17:37** |
| 4 h | 16:59 | 17:00 | **19:37** |
| 5 h | 17:59 | 18:00 | **20:37** |
| 6 h 24 (80 %) | 19:23 | 19:24 | **nunca** |
| 7 h 09 (89 %) | 20:08 | 20:09 | **nunca** |

**La frontera cae donde tiene sentido y no deja ningún hueco raro.** Tres cosas
que el barrido demuestra y que no se ven leyendo el código:

1. **Cada fila cambia de color una sola vez en cada sentido** (verde →
   naranja → rojo, nunca de vuelta): el semáforo es monótono en el reloj, no
   parpadea.
2. **El rojo sigue donde servía.** Las 20:00 con poco registrado son rojas: con
   el día hasta las 23:00 lo son con **cualquier cosa por debajo de 3 h 24**
   trabajadas, y con el día hasta las 22:00, por debajo de **4 h 24**. El
   criterio 588 (0, 30 y 60 min) es el borde fácil de ese rango, no el límite.
3. **Lo único que el rojo perdió está donde debía perderlo.** Con cero
   trabajado y el día hasta las 22:00, antes había rojo desde las **14:01**;
   ahora desde las **15:37**. En esa franja de hora y media el día todavía
   puede acabar por encima del 80 % (a las 15:00 con nada hecho aún caben 7 h
   de 8), así que el aviso que se retira es justo el que el usuario llamó
   «cierto e inútil». No hay ningún tramo en que el rojo desaparezca **y** el
   día vaya a acabar corto: la condición es exactamente «lo mejor a lo que
   puede acabar el día < 80 % de la meta».

**Criterios, uno por uno** (y también **como redacción**, que es lo que pedía
el encargo: los escribió el constructor):

- **585 — cumplido.** `toFitLevel` devuelve `'over'` solo con las dos
  condiciones, y el empate está donde la redacción lo pone: con 384 minutos
  clavados de mejor final (el 80 % exacto) el arco es **naranja**; con 383,
  rojo. Medido en el barrido a las 19:24 con 6 h 24 hechas. *Como redacción es
  preciso y comprobable* —da la fórmula y el caso de empate—, con **un matiz
  que anoto abajo**: las «dos cosas a la vez» son, en la aritmética, una sola.
- **586 — cumplido.** Los números exactos del usuario: 429 de 480, día hasta
  las 22:00, reloj a las 23:05 → `fitMinutes` −116, `fitLevel` `'tight'`,
  `arcValue` «51m». En la página, el `<article>` sale con `data-fit="tight"`.
- **587 — cumplido.** El verde es la misma línea de antes (`fitMinutes >
  GOAL_FIT_OK_MARGIN_MINUTES`); en el barrido, todas las filas empiezan en
  verde y el caso del 586 nunca lo es. La mañana con cero trabajado sigue
  verde.
- **588 — cumplido**, y con margen (ver la tabla y el punto 2 de arriba).
- **589 — cumplido.** Ni «A este ritmo paras a las…» ni «Si arrancas ahora,
  acabarías a las…» existen ya en `src/` (grep en todo el árbol: solo quedan
  como comentario histórico y como aserciones **negativas** en los tests). Lo
  que **no** se tocó, medido por mí en la util: `'passed'` sigue diciendo
  «Llevas 9 h. Pasaste las 8 h a las 16:00.» con «16:00» dentro del arco —esa
  hora ocurrió—, y el día pasado, «Registraste 5 h de Trabajo.».
- **590 — cumplido.** Un solo `<p>`, siempre `styles.srLine`, con «Te faltan 51
  min de Trabajo.» (y «Te faltan 8 h de Trabajo.» con cero minutos): es el
  interior del arco dicho en texto, sin ninguna hora. El `<svg>` sigue
  `aria-hidden`. *Como redacción*, «**un solo** nodo de texto real» es laxo —la
  tarjeta tiene además la cabecera y, con sesión abierta, la línea de «Cuenta
  …»—; leído en su contexto («que dice lo que el SVG dibuja») se entiende y se
  comprueba, pero se presta a leerse como que la tarjeta entera tiene un solo
  texto.
- **584 — cumplido, medido por mí, entero:** `pnpm typecheck` limpio;
  `pnpm lint` **14 errores / 0 warnings** (la línea base clavada); `pnpm test`
  **2 fallos de 1943** (`SearchSelect` ×2, preexistentes; eran 2 de 1935, +8
  son los casos nuevos de la tajada); `pnpm build` en verde con chunk
  **1.129,17 kB** y **CSS 274,19 kB**. Solo este repositorio: la tajada no toca
  el API.
- **560 — anotado, no borrado, y correctamente.** Sigue en la sección 1 en su
  sitio, con el aviso «SUPERADO por decisión del usuario del 2026-09-22» y sus
  palabras literales debajo del propio criterio. Lo comprobé en el texto: no se
  reescribió el criterio, se le añadió la nota.

**Qué se oye ahora, comparado con lo que se oía (la pregunta del encargo).**
El `<article>` se nombra con `aria-labelledby` → el nombre de la meta; la
cabecera es texto real («Trabajo», «7h 09 de 8h»); el SVG es `aria-hidden`; y
el `<p>` de 1×1 px dice «Te faltan 51 min de Trabajo.». Antes de esta tajada,
ese mismo `<p>` era **visible** y decía «Llevas 7 h 9 min. A este ritmo paras a
las 23:59.». **Lo que se oye no ha empeorado**: lo que se pierde es la hora
proyectada (la que el usuario quitó) y el «Llevas 7 h 9 min», que la cabecera
sigue diciendo con las mismas cifras; lo que se gana es «lo que falta», que es
justo lo que el arco dibuja y antes no se decía en texto. Y no cuela la frase
de vuelta por ningún lado: comprobé `textContent` e `innerHTML` del arco en los
tests de página, y el grep del árbol.

**Texto visible duplicado y hueco de maquetación: ninguno de los dos.**
`.srLine` es `position: absolute` con `clip-path: inset(50%)`, así que **no es
un ítem en el flujo** del `.card` (flex column con `gap: 0.35rem`): no deja
hueco ni suma separación. Y como `.row` es `display: flex` con el
`align-items: stretch` por defecto, las tarjetas de una misma fila siguen
midiendo lo mismo aunque la de «te faltan» tenga ahora una línea menos: no hay
tarjetas desparejas. A la vista, la tarjeta queda cabecera + arco (+ la línea
de sesión en marcha, que no se tocó).

**Regresiones: dónde busqué y qué encontré (nada).**

- **`graphify explain "VidaGoalArc"` y `graphify explain "buildGoalArcs"`** (el
  grafo refleja el commit anterior a la tajada, que es exactamente lo que hace
  falta para «¿quién dependía de esto?»): `buildGoalArcs` solo tiene aristas
  hacia abajo (`countsOn`, `toSessionSpans`, `categoryIdOf`,
  `formatDurationMinutes`) y `VidaGoalArc()` solo lo importan
  `VidaGoalArcRow.tsx` y el barril. Confirmado abriendo los archivos: el único
  consumidor de `buildGoalArcs` en todo `src/` es `VidaHoyPage.tsx:380`, y el
  único que lee campos del arco es `VidaGoalArc.tsx`.
- **`stopAtTime`, el campo que se fue del tipo.** Cero lectores vivos:
  `grep -rn "stopAtTime" src/` solo devuelve **tres comentarios** dentro de
  `vida-goals.utils.ts`. Fuera de `src/` aparece únicamente en expedientes
  (FEAT-016, FEAT-019, `BOARD.md`), que son historia, no código. El grafo no
  tiene nodo para él.
- **La puerta del color, que es lo que podía cambiar sin que nadie lo viera.**
  `canProject = nowMinutes !== null && !isPastDay` y
  `hasFitWindow = canProject && dayEnd !== null` — la misma condición que
  antes: `stopAtTime === null` era, literalmente, `!canProject`
  (`minutesToTime` nunca devuelve `null`). Comprobado además **en ejecución**:
  con `dayEnd: null` (lo que sirve la página mientras cargan los ajustes) el
  arco sale con `fitMinutes: null` y `fitLevel: null` —sin color— y su frase
  intacta. Sin hora de fin conocida, sin color.
- **`styles.line` en otros componentes.** Hay siete componentes más con una
  clase `.line` (`VidaNoteLine`, `VidaReviewFigures`, `VidaEndTimeLine`,
  `VidaPatternCard`, `VidaPatternsAside`, `HabitPurposeBanner`…): son **módulos
  CSS distintos**, con su propio ámbito, y ninguno importa el `.module.scss`
  del arco. Nada se llevó por delante.
- **Las tajadas 1, 2 y 3, una por una, ejecutadas por mí** en el barrido: lo
  que falta dentro del arco (`arcValue` «4h 20» / «8h», `arcCaption`
  `['Te faltan']`); el punto de color a cero minutos (con cero trabajado el
  arco trae `fitLevel` —verde a las 9:00, rojo a las 20:00—, que es lo único de
  lo que depende el `<circle>`); la meta cruzada con su hora dentro («16:00»,
  «Pasaste las 8h / a las», sin color); el día pasado («Registraste 5 h de
  Trabajo.», sin color); y el filtro por días laborables de `17e69be`
  (`countsOn` no se tocó, y las suites del sábado siguen verdes). Las 1943
  pruebas lo confirman: los dos únicos fallos son los de `SearchSelect`.
- **Los tests que el constructor borró, revisados uno a uno** (`git diff` de
  los dos ficheros de test): todo lo que se fue nombraba la hora proyectada o
  el rojo viejo, y cada caso tiene su relevo —el 569 sigue probado (19:00 y las
  20:00 de la página), el cero de margen sigue en naranja (568), y el test de
  «el final del día manda» conserva el contraste con `dayEnd` 17:00 → rojo—.
  **Ninguna aserción se aflojó para que pasara la tajada.**

**El CSS, comprobado y no supuesto (la alarma de `ENVIRONMENT.md`).** No me
quedé con el recuento de clases del constructor: compilé **las dos versiones
del `.module.scss`** —`git show HEAD:…` y la del árbol— con `sass --style=compressed`
y comparé los selectores emitidos. Resultado: **26 reglas antes, 25 después**;
la única que falta es **`.line`**, ninguna se añadió, y la diferencia son
**117 bytes** comprimidos (los ~130 del `dist`, con el nombre hasheado, que
explican la bajada de 274,32 a **274,19 kB**). Las cuatro reglas del semáforo
(`[data-fit='ok']`, las dos de `'tight'` y `'over'`) siguen emitiéndose. **No
hay ningún comentario sin cerrar**: si lo hubiera, el bloque se habría comido
las reglas siguientes y el diff de selectores lo habría mostrado.

**El hallazgo que el constructor declaró: ¿defecto nuevo o ya existente?**
**Ya existente, y de la tajada 2 — esta tajada no lo introduce, lo agranda 12
minutos.** La aritmética: el rojo pide `trabajado + (dayEnd − ahora) < k`, con
`k = targetMinutes` antes de esta tajada y `k = 0,8 × targetMinutes` después.
Con la meta de 60 minutos y cero trabajado, el rojo ya solo era posible en los
**últimos 60 minutos del día** (con la tajada 2, que está en `main` desde
`1fc019d`); ahora, en los **últimos 48**. Medido en el barrido con el día hasta
las 23:00: rojo desde las **22:13** con cero hecho, desde las **22:23** con 10
minutos, y **nunca** con 48. O sea: la ventana de rojo se encoge siempre en
`0,2 × meta` —96 minutos para una jornada de 8 h, 12 para una de 60— y lo que
hace que sea «casi inalcanzable» en una meta pequeña es que la ventana **ya
era** pequeña, porque es proporcional a la meta. No es una regresión de la
tajada 5; es una propiedad del semáforo desde que nació. Queda como hallazgo,
no como criterio incumplido.

**Hallazgos (ninguno devuelve la tajada):**

1. **Las «dos condiciones» del 585 son, en la aritmética, una.** Si el día
   puede acabar por debajo del 80 % de la meta, entonces **necesariamente** ya
   no cabe (`mejor final < 0,8·meta < meta` ⟹ `fitMinutes < 0`), y cuando ya
   pasó la hora de fin, `fitMinutes < 0` se cumple siempre. El rojo es, en
   realidad, **una sola regla**: «el día no puede acabar en el 80 % de la
   meta». El código es correcto y el guardián de `fitMinutes < 0` no hace daño
   —documenta la intención—, pero la redacción del criterio y el comentario de
   `toFitLevel` sugieren dos filtros independientes que no lo son. Si alguien
   afina el umbral mañana, conviene saber cuál es la condición que manda.
2. **El naranja carga ahora dos significados muy distintos**: «cabe justo»
   (margen entre 0 y 60) y «ya no cabe, pero acabarás por encima del 80 %».
   Son estados opuestos en lo accionable —en el primero todavía llegas, en el
   segundo no— y se ven igual. Lo pidió el usuario así («80 % me parece bien»),
   así que no lo toco; lo dejo escrito por si algún día quiere distinguirlos.
3. **Después de la hora de fin, un día que acabó por debajo del 80 % sigue en
   rojo.** Con la meta de 480, el día hasta las 22:00 y 6 h hechas (75 %), a
   las 23:05 el arco es rojo. Es exactamente el umbral que el usuario fijó, y
   por eso no es un incumplimiento; pero la crítica que originó la tajada
   —«cierto e inútil» cuando ya no hay nada que hacer— sigue viva por debajo
   del 80 %. Si vuelve a molestarle, la pregunta no es el umbral sino si el
   semáforo debe seguir hablando **después** de que el día se acabe.
4. **El criterio 565 quedó con una cláusula huérfana**: pide 375 px «con la
   línea visible del 560 en su versión más larga», y esa línea ya no existe. Al
   superarse el 560, esa parte del 565 se queda sin objeto (el resto —«TE
   FALTAN 24h» sin scroll ni número cortado— sigue vigente y su test
   paramétrico sigue verde). No lo reescribo: es un hallazgo, no una licencia.

**Estados.** *No hay datos* (cero minutos): cubierto y medido —«TE FALTAN 8h»
con su punto de color—. *Carga*: cubierto por construcción —mientras los
ajustes no llegan, `dayEnd` es `null` y el arco sale **sin color** en vez de
saltar de verde a rojo—, verificado en ejecución. *Error* y *sin permisos*: no
aplican, la tajada no añade ninguna petición ni ninguna ruta. *Texto largo*: el
riesgo bajó en vez de subir (se quita una línea; el número grande no cambió) y
el test paramétrico del rótulo sigue verde, pero **no lo he vuelto a medir en
un navegador**. *Móvil 375 px*: **no verificado en navegador por mí** — ver
abajo.

**Lo que no revisé, dicho sin disimular.** No entré a `/app/*`: está detrás del
login y los agentes no entran con credenciales (límite estructural del
`ENVIRONMENT.md`). No monté arnés propio en el navegador esta vez —el dev
server del 5173 que dejó el constructor sigue vivo y no lo toqué—, así que **la
medida en píxeles a 375 px, la altura de las tarjetas y el ámbar del arco
renderizado son del constructor, no míos**; lo que sí es mío es que la
maquetación no puede dejar hueco (`position: absolute` + `stretch`, leído en el
SCSS) y todo lo aritmético y de DOM de arriba.

**Pendiente de prueba manual del usuario** (nada de esto puede cerrarlo un
agente):

1. **Vida → Hoy**, día laborable con la jornada empezada: debajo del arco **no
   debe quedar ninguna frase** — la tarjeta acaba en el arco, o en «Cuenta …,
   en marcha desde las …» si hay sesión abierta.
2. **El caso de la captura**: pasadas las 23:00, día configurado hasta las
   22:00, ~7 h registradas → arco **ámbar**, con «TE FALTAN 51m» dentro.
3. **Que el rojo siga apareciendo**: sobre las 20:00 con poco o nada
   registrado (con el día hasta las 23:00, cualquier cosa por debajo de 3 h 24
   trabajadas).
4. **Con lector de pantalla**: el arco debe leerse «Trabajo, 7h 09 de 8h» y «Te
   faltan 51 min de Trabajo.», **sin ninguna hora**.
5. **A 375 px** (móvil real o el inspector): sin scroll horizontal y con las
   tarjetas de la fila parejas.

**¿Duplica algo que ya existía?** No. Contra la sección 2: no crea ningún
componente, ningún formateador ni ninguna constante paralela —`toFitLevel`
sigue siendo la única puerta del color, `GOAL_FIT_SHORT_DAY_RATIO` vive al lado
de `GOAL_FIT_OK_MARGIN_MINUTES`, y `bestPossibleMinutes` reutiliza el
`parseTimeToMinutes(dayEnd)` que ya leía `fitCandidate` (una lectura, dos
usos)—. La frase del `<p>` se compone con `formatDurationMinutes`, la misma que
usa el resto de la util. El arco sigue siendo tonto: ni un hook, ni una
mutación, ni una consulta nueva. Y **no se reintrodujo** ninguna variante del
cálculo de la hora que se borró.
