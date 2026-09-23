---
id: FEAT-019
title: El arco de trabajo, corregido — lo que falta dentro, un semáforo que sabe si te da tiempo, y solo los días que trabajas
status: building
architect: yes    # toca el API en otro repo (columna nueva + mutación en vida_goals), cruza dos componentes que hoy no se hablan (VidaDayBudget y VidaGoalArc) y estrena la primera edición de una meta en el front; razón completa abajo
area: features/vida, API (xavi-platform-node)
requested: 2026-09-22
updated: 2026-09-22
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

**Tajadas:**

| # | Qué hace | Estado |
|---|---|---|
| 1 | **Lo que falta, dentro del arco.** Cambia qué se pinta como número grande cuando la meta no está cruzada, y hace visible la hora que antes estaba dentro. Solo front, sin migración: corrige la confusión original del usuario de inmediato. Criterios 559–565. | **accepted** |
| 2 | **El semáforo, lectura B.** El color verde/naranja/rojo según si da tiempo hoy, usando un dato que `VidaDayBudget` ya calcula. Solo front, sin migración; usable sin depender de la tajada 1 (aunque tiene más sentido junto a ella). Criterios 566–574. | pending |
| 3 | **Solo los días laborables.** Migración en el API, filtro del arco y la pregunta por día de la semana, y la fila de días en Ajustes → Vida. La única que toca el backend. Criterios 575–584. | pending |

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
| 2 | **El semáforo, lectura B.** `dayEnd` entra en `buildGoalArcs`; salen `missingMinutes`, `fitMinutes`, `fitLevel`; el arco pinta `data-fit`. Sin API. | `utils/vida-goals.utils.ts` (`BuildGoalArcsInput`, `GOAL_FIT_OK_MARGIN_MINUTES`), `pages/VidaHoyPage.tsx` (la llamada a `buildGoalArcs` y su `useMemo`), `components/VidaGoalArc/VidaGoalArc.tsx` (`data-fit`), `VidaGoalArc.module.scss`, `utils/vida-goals.utils.test.ts`, `pages/VidaHoyPage.test.tsx` (un caso nuevo) | 566, 567, 568, 569, 570, 571, 572, 573, 574 | pending |
| 3 | **El sábado sin arco (camino de lectura).** Migración 070, `activeDays` en servicio/SDL/tipos, y el filtro por día en la util + la pregunta atada al mismo dato. **Requiere que el usuario haga push y se despliegue** antes de verse. | API: `migrations/070_vida_goals_active_days.sql`, `types/services/vida.types.ts`, `services/vida-goal.service.ts` (`GoalRow`, `mapGoal`), `graphql/modules/vida/vida.schema.ts`, `tests/unit/services/vida-goal.service.test.ts`. Front: `types/vida-goal.types.ts`, `graphql/activity-categories.graphql.ts` (5 sub-selecciones), `graphql/schema/vida.schema.graphql` (recopiar), `utils/vida-goals.utils.ts` (`DEFAULT_GOAL_ACTIVE_DAYS`, filtro, `promptAllowed`), `pages/VidaHoyPage.tsx` (la rama de la pregunta), `utils/vida-goals.utils.test.ts`, `pages/VidaHoyPage.test.tsx` | 575, 576, 577, 578, 579, 580 | pending |
| 4 | **Elegir los días (camino de escritura).** Mutación `vidaGoalDaysSet` y la fila de siete botones en Ajustes → Vida. | API: `graphql/modules/vida/vida.schema.ts` (input + mutación), `validators/schemas/vida.schemas.ts`, `graphql/modules/vida/vida.resolvers.ts`, `services/vida-goal.service.ts` (`setGoalDays`), `tests/unit/validators/vida.schemas.test.ts`, `tests/unit/services/vida-goal.service.test.ts`. Front **nuevos**: `graphql/vida-goals.graphql.ts`, `api/vida-goals.api.ts`, `hooks/useVidaGoals.ts`; **modificados**: `graphql/contracts.test.ts`, `pages/VidaAjustesPage.tsx` (+ `.module.scss`, `.test.tsx`) | 581, 582, 583 | pending |

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
