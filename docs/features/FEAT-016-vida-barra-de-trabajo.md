---
id: FEAT-016
title: El arco de trabajo — la primera meta de tu día, cuánto llevas y a qué hora paras
status: planned
architect: yes    # toca el API en otro repo (nace una tabla de metas, no dos columnas) y una agregación viva que no existe hoy; razón completa en la sección 1
area: features/vida, API (xavi-platform-node)
requested: 2026-09-22
updated: 2026-09-22
---

# FEAT-016 — El arco de trabajo

## 1. La petición — feature-analyst

**Resumen para quien venga detrás:** hoy, para saber cuánto ha trabajado en el
día, el usuario tiene que sumar a mano con calculadora. Viendo el primer
render cambió una decisión de fondo: esto ya no es una casilla suelta, es
**la primera de una familia de metas** («Sueño», «Workout», «Estudiar» —
palabras suyas). Una tabla pequeña de **metas** (nombre, icono, color, minutos
objetivo, orden) y en `activity_categories` un **puntero** a una meta —varias
categorías pueden compartir la misma—, no un booleano. **Esta feature crea y
enseña exactamente una meta: «Trabajo, 8h»**, nacida sola la primera vez que
se necesita. En Hoy aparece un **arco** (semicírculo, la hora en grande
dentro, no una barra) que suma en vivo esas sesiones —incluida la que está en
marcha— y dice **una hora a la que parar**. La tajada 1 crea la tabla, el
puntero y la casilla del formulario de categoría: el usuario ya puede marcar
sus categorías mientras se construye el resto.

**Qué problema resuelve:** «uno de mis vicios es el trabajo». El usuario quiere
una jornada explícita de 8 horas y una **señal para parar**, no una métrica
para interpretar. Hoy no hay forma de saber, sin sacar calculadora, cuánto
lleva trabajado en el momento — y lo que no se ve fácil, no gobierna nada.

**Para quién es:** para el usuario, mirando Hoy en cualquier momento del día
mientras trabaja, para decidir si sigue o para.

**Palabras del usuario:** «estaba tratando de ver en hoy cuánto he trabajado,
uno de mis vicios es el trabajo, quiero trabajar explícitamente las 8 horas
que me corresponde y ya… pero me di cuenta de que si quiero hacerlo me toca
manualmente sacar calculadora y sumar los tiempos que trabajé… quiero una
barra visual».

**Palabras del usuario, viendo los renders (2026-09-22, lo que cambia esta
sección):** sobre el arco: «Uff!! la de arco me gusta, por que pienso en
barras como "Sueño", "Workout", "Estudiar"». Sobre si el objetivo va en la
categoría o en algo propio: «Una meta, no una casilla».

**Lo ya decidido con el usuario — cerrado, no se reabre:**

1. **El trabajo se marca apuntando la categoría a una meta**, no con una
   propiedad suelta de la categoría ni de la sesión: `activity_categories`
   gana un puntero **nullable** a una fila de una tabla nueva de metas.
   Varias categorías pueden apuntar a la misma meta (a diferencia de
   `sleepActivityCategoryId`, que es el puntero al revés: una cuenta, una
   categoría de sueño).
2. **Los minutos objetivo viven en la meta**, no en la categoría ni en los
   ajustes del usuario. Dos categorías que apuntan a la misma meta no tienen
   dos jornadas.
3. **Esta feature crea y enseña exactamente una meta: «Trabajo», 480
   minutos.** Nace sola —sin formulario, sin que el usuario la nombre ni la
   configure— la primera vez que una categoría se apunta a ella, sea desde la
   casilla del formulario o desde el botón de la pregunta en Hoy. **La
   pantalla nunca enseña más de una meta en esta feature**; el día que se
   quiera «Estudiar 1h» es una fila nueva, no una migración ni un componente
   nuevo, y ese día es otra feature.
4. **Se marca donde se crea y donde se edita la categoría**: mientras exista
   una sola meta, un cuarto campo — una **casilla** («Esto es trabajo»), no
   una lista — con una línea debajo que dice qué provoca («Sus horas suman en
   el arco de trabajo de Hoy»). El día que haya una segunda meta, ese mismo
   campo se dibuja como lista: es el mismo campo creciendo con el dato, no dos
   campos, y esa lista no es de esta feature.
5. **Diario, sin arrastre.** «No quiero deberme horas y x o y día las pago…
   no». Cada día empieza en cero; no existe la deuda.
6. **Solo mirar, no avisa.** El usuario lo eligió explícitamente. Nada de
   notificaciones.
7. **El arco vive en Hoy, bajo `VidaDayBudget`** (`VidaHoyPage.tsx:846`),
   encima de la agenda.
8. **Cuenta la sesión en marcha**, con el minuto vivo que ya existe
   (`useVidaNowMinute`, late cada 60 s).
9. **La línea que de verdad sirve** es «a este ritmo paras a las 18:40» —
   ahora + lo que queda. No un número que obligue a restar.
10. **Pasadas las 8 h no hay reproche**: «Llevas 9h 10m. Pasaste las 8h a las
    18:40.» El dato, sin adjetivos (regla del módulo, `docs/vida/PLAN.md`, «La
    regla que se hereda de hábitos»).
11. **Las sesiones sin categoría se confiesan**, no se callan: una línea
    aparte con la palabra del módulo, **sin dato** (no «sin categoría»: ese
    nombre ya lo usa `CategoryBreakdown` en Revisión para otra vista —el
    desglose por categoría de un día cerrado— y aquí es una advertencia sobre
    lo que el arco **no puede saber**, no una fila de un desglose. Queda
    marcado como decisión de vocabulario para quien construya el render, por
    si conviene una sola palabra en las dos pantallas).
12. **Si ninguna categoría apunta a una meta**, el arco no aparece: aparece
    la pregunta, ahí mismo en Hoy, con las categorías en botones, y tocar una
    apunta esa categoría a la meta (creándola —«Trabajo», 480 min— si aún no
    existe). Un campo, dos puertas.
13. **La forma visual es un arco, no una barra.** Un semicírculo con la hora
    en grande dentro. Render vigente: `docs/vida/assets/18-vida-arcos-familia.html`
    — panel 1 es lo que se construye ahora, panel 2 es cómo se ve el día que
    haya tres metas (fuera de alcance), panel 3 es la casilla volviéndose
    lista (fuera de alcance). Los renders `15-` (barra), `16-`
    (arco/bloques/franja) y `17-` (donut) quedan como alternativas
    descartadas, citables pero no vigentes.

**Consecuencias aceptadas, dichas para que nadie las redescubra:**

- **Desmarcar una categoría (quitarle el puntero) cambia el pasado.** La suma
  se calcula, no se guarda por día: soltar el puntero baja también el arco de
  ayer. Es lo que de verdad cuentas como trabajo, aplicado hacia atrás con
  honestidad; congelar cada día al cerrarlo es maquinaria que hoy no vale lo
  que cuesta.
- **Muerta, dicho explícitamente: «una casilla por concepto».** La sección 1
  anterior decía que generalizar a etiquetas era «construir para un usuario
  que no existe» y que «estudio» o «familia» pedirían otra columna y otra
  migración. Ya no: la tabla de metas generaliza sola —cada meta futura es una
  fila, no una migración—, y lo que sí queda pendiente el día que haya una
  segunda meta es la lista en el formulario, no el dato. No quede nadie
  creyendo que esa frase sigue gobernando algo.
- **La tajada 1 es más grande que en el plan anterior.** Cambiar un booleano
  en una columna existente por crear una entidad nueva de verdad —tabla,
  tipo de servicio, alta en el esquema GraphQL, y la regla de «se crea sola la
  primera vez que hace falta»— es más superficie de backend que la de dos
  columnas simples. Es el precio de que la próxima meta sea una fila; lo digo
  porque es, con franqueza, lo que empeora frente al plan viejo.
- **La creación automática de la meta es una regla implícita.** Nadie la ve
  nacer, no hay pantalla que la anuncie, y si dos categorías se marcaran casi
  a la vez antes de que exista la meta, alguien tiene que decidir en el
  backend que no salgan dos filas «Trabajo» duplicadas. No es una decisión
  mía —es técnica—, pero se deja escrita para que no se descubra tarde.
- **El módulo no cruza la medianoche.** `calculateEndTime` no tiene `% 24` y
  `minutesToTime` corta en 23:59 (`vida-time.utils.ts`). Trabajar hasta las
  2am cae, con esa limitación, en el día siguiente. Es un límite conocido del
  módulo entero, no algo que esta feature deba arreglar.

**Lo verificado en el código, para que nadie lo vuelva a buscar:**

- La consulta de Hoy **ya trae la categoría de cada sesión**
  (`src/features/vida/graphql/activity-followups.graphql.ts:18-30`, bloque
  `FOLLOW_UP_ACTIVITY_FIELDS`: `category { id name color icon }`): la suma es
  aritmética sobre datos ya cargados, más el catálogo de categorías (ver más
  abajo), sin documento GraphQL nuevo.
- `category` es **nullable** en el esquema (`categoryId: ID`, `category:
  ActivityCategory` sin `!` en `activity.schema.graphql:131,137`), así que
  «sesión sin categoría» es un estado real y ya contemplado por el backend,
  no una hipótesis.
- `VidaCategoryForm` (`src/features/vida/components/VidaCategoryForm/VidaCategoryForm.tsx`)
  existe con sus tres campos de hoy — `name`, `icon`, `color` — y ningún
  campo de meta: confirmado que el archivo sigue ahí y sin ese campo.
- **`VidaCategoryForm` solo edita; crear es otro archivo.** Hallazgo del
  arquitecto en la sección 2 (no invalidado por el cambio de modelo): se usa
  en `VidaCategoriasPage.tsx:209` dentro de un `Modal`; crear una categoría
  ocurre únicamente en `CreateVidaCategoryStep.tsx`, que repite nombre/icono/
  color por su cuenta y muta aparte. El criterio de «la casilla al crear y al
  editar» son **dos archivos**, no uno.
- **`isWorkout` existe y es una trampa — comprobado por mí, en los dos
  repositorios.** En `xavi-platform-node`, `is_workout BOOLEAN NOT NULL
  DEFAULT FALSE` vive en la tabla `activities` desde
  `migrations/060_workout_entrenamiento.sql`, y `isWorkout` está en los tipos
  de entrada del servicio (`src/types/services/activity.types.ts:52,64`) y en
  `input ActivityInput` / `input ActivityEditInput` del esquema GraphQL
  (`src/graphql/modules/activity/activity.schema.ts:190,204`) — pero **no**
  está en `type Activity` (el mismo archivo, líneas 83-101), que es lo único
  que el front puede leer. Se puede escribir y no se puede leer: un arco de
  «Workout» no se puede pintar hoy sin tocar el backend (exponerlo en el tipo
  de lectura, el resolver y el SDL vendorizado del front).
- **«Sueño» no encaja en esta familia.** `sleepActivityCategoryId` ya existe
  en `user_settings` (`src/features/settings/types/user-settings.types.ts:4,20`)
  con su propio modelo de puntero al revés (la cuenta apunta a una categoría,
  no la categoría a una meta), más las horas de acostarse/levantarse de
  FEAT-012, «la noche» (en cola). Cruza la medianoche, que este módulo no
  sabe hacer. Su arco, si llega, cuelga de FEAT-012, no de esta tabla de
  metas.
- **La trampa del validador, otra vez — comprobado por mí, con las líneas
  exactas.** `activityCategoryEditInputSchema`
  (`xavi-platform-node/src/validators/schemas/activity.schemas.ts:135-152`)
  tiene un `.refine` (líneas 144-151) que hoy solo cuenta `name`,
  `description`, `icon`, `color`, `orderIndex` como «al menos un campo».
  Guardar **solo** `{ id, <el puntero a la meta> }` —que es literalmente lo
  que hacen la casilla sola y el botón de la pregunta, la premisa entera de
  «una acción, un guardado»— se rechaza hoy con «At least one field is
  required to update» si el campo nuevo no entra también en esa condición.
- **Decidir si se pinta el arco o la pregunta necesita el catálogo de
  categorías**, que hoy **no** se consulta en Hoy. Los minutos sí salen de la
  consulta que ya existe; el catálogo es una consulta más en la pantalla —ya
  cacheada por Categorías y Actividades, así que no es tráfico nuevo, pero sí
  es una consulta que Hoy no hace hoy.
- La agregación por categoría de un día **ya existe y está probada**, pero es
  de otra pantalla: `CategoryRow` / `CategoryBreakdown` /
  `buildCategoryBreakdown` en `src/features/vida/utils/vida-review.utils.ts:904-1039`,
  con «Sin categoría» como fila aparte de un día ya cerrado (Revisión). Lo
  nuevo aquí es **la versión viva de Hoy** —incluye la sesión en marcha y
  decide si se pinta el arco o la pregunta—, no la aritmética de sumar
  minutos por categoría, que ya está resuelta y puede imitarse.
- `useVidaNowMinute` existe (`src/features/vida/hooks/useVidaNowMinute.ts`) y
  ya lo usan `VidaHoyPage.tsx` y `VidaRevisionPage.tsx`: es el reloj que hace
  vivir la sesión en marcha.
- **Al desplegar el API viaja también la migración 068 de FEAT-012**
  (`migrations/068_user_settings_vida_night.sql`), que sigue sin correr en
  producción (`RUN_MIGRATIONS` en `false` en Render a propósito).

**Fuera de alcance:** (lo que alguien podría dar por incluido y NO está)

- **Notificaciones o avisos al llegar a las 8h.** El usuario lo pidió
  explícitamente así: solo mirar.
- **Arrastre de horas entre días**, de más o de menos. No hay deuda ni saldo.
- **Marcar una sesión o una actividad suelta como trabajo.** Se marca la
  categoría, apuntándola a la meta; no hay excepción por sesión.
- **Más de una meta.** El día que se quiera «Estudiar», «Sueño» (salvo el
  caso especial de arriba) u otra, es una fila nueva en la tabla de metas y el
  campo del formulario pasa a lista de golpe elegible. Ninguna de las dos
  cosas se construye aquí.
- **El arco de «Workout».** `isWorkout` es de solo escritura hoy (ver
  hallazgo verificado); exponerlo en lectura —tipo, resolver, SDL— es trabajo
  de backend que esta feature no hace.
- **El arco de «Sueño».** Tiene su propio modelo y su propia feature en cola
  (FEAT-012); no cuelga de la tabla de metas de esta feature.
- **Una pantalla para renombrar la meta «Trabajo», cambiarle el icono, el
  color o los 480 minutos.** Nace con sus valores fijos; no hay UI para
  editarla en esta feature. *Hipótesis marcada:* si se pide, es una pantalla
  nueva de «mis metas» — no hay hoy un lugar que ya exista del que cuelgue,
  a diferencia del plan anterior (que colgaba de `VidaAjustesPage.tsx`),
  precisamente porque el dato ya no vive en los ajustes del usuario.
- **Cruzar la medianoche.** Limitación conocida y general del módulo (ver
  arriba); esta feature no la resuelve.
- **Cualquier cosa en Revisión.** El arco no toca `VidaRevisionPage` ni
  `CategoryBreakdown`; son dos vistas distintas de datos parecidos.
- **Un desglose dentro del arco** (por categoría de trabajo, por actividad).
  Es una sola cifra y una sola hora, no un gráfico.
- **Sonido, vibración o cualquier interrupción** al llegar a la jornada.

**Criterios de aceptación:** (la numeración del módulo sigue: FEAT-015 llega
hasta el 480. **Esta feature empieza en el 481**. Los criterios 481, 482 y 490
de la versión anterior de esta sección **mueren** con el cambio a metas —se
dice explícitamente para no dejar un hueco mudo—: 481 y 482 describían dos
columnas (`is_work` booleano, `vida_work_target_minutes` en `user_settings`)
que ya no existen como tales, y el 490 de la versión anterior está fundido
aquí con el 492 nuevo. Todo lo demás se renumera dentro del mismo rango
481–503.)

*La meta nace: la tabla, el puntero y la casilla (tajada 1)*

- [ ] 481. Existe una tabla nueva de metas (migración en `xavi-platform-node`)
  con nombre, icono, color, minutos objetivo y orden.
- [ ] 482. `activity_categories` gana un puntero **nullable** a una fila de
  esa tabla (no un booleano); varias categorías pueden apuntar a la misma
  meta a la vez.
- [ ] 483. Los minutos objetivo viven en la fila de la meta: ni
  `activity_categories` ni `user_settings` ganan una columna de minutos en
  esta feature.
- [ ] 484. La primera vez que una categoría se apunta a una meta —desde la
  casilla del formulario o desde el botón de la pregunta en Hoy (tajada 3)— y
  no existe ninguna meta todavía, se crea automáticamente una sola: «Trabajo»,
  480 minutos. No hay pantalla ni paso donde el usuario la nombre, la
  configure o elija sus 480 minutos.
- [ ] 485. `VidaCategoryForm` (editar) y `CreateVidaCategoryStep` (crear —son
  dos archivos) muestran, mientras exista una sola meta, un cuarto campo: una
  **casilla** («Esto es trabajo»), no una lista, con una línea debajo que dice
  qué provoca marcarla.
- [ ] 486. Marcar o desmarcar la casilla en una categoría existente es **una
  acción, un guardado**: no abre una pantalla intermedia ni pide una
  confirmación aparte.
- [ ] 487. `activityCategories` (la consulta que ya trae el catálogo) devuelve
  el puntero a la meta **sin un documento GraphQL nuevo**: el mismo documento,
  ampliado.
- [ ] 488. Ninguna pantalla existente que lista o edita categorías (Ajustes →
  Categorías, el selector de categoría al crear/editar una actividad) cambia
  de comportamiento por el campo nuevo.

*El arco (tajada 2)*

- [ ] 489. En Hoy, con **al menos una categoría apuntando a una meta**,
  aparece un **arco** (semicírculo, la hora en grande dentro, la forma del
  render 18 panel 1 — no una barra) debajo de `VidaDayBudget`
  (`VidaHoyPage.tsx:846`) y encima de la agenda.
- [ ] 490. El arco suma, **sin ningún documento GraphQL nuevo**, los minutos
  de las sesiones de hoy cuya actividad tiene una categoría que apunta a la
  meta — sale de los datos que la consulta de Hoy ya trae más el catálogo de
  categorías, leído en Hoy con la consulta ya existente y cacheada (no un
  documento nuevo, pero sí la primera vez que Hoy la usa).
- [ ] 491. La sesión **en marcha** (si la hay) cuenta sus minutos vivos hasta
  el minuto actual, y el arco se actualiza cada 60 segundos sin recargar la
  página (mismo reloj que `useVidaNowMinute`).
- [ ] 492. La línea principal es una **hora**, no una resta: «a este ritmo
  paras a las HH:MM», calculada como *ahora + (jornada − trabajado)*. Ningún
  texto obliga a restar minutos para saber cuánto queda.
- [ ] 493. Pasados los minutos de la jornada (480 por defecto) **no hay
  ningún adjetivo, ni color de alarma, ni signo de exclamación**: se dice el
  dato, por ejemplo «Llevas 9h 10m. Pasaste las 8h a las 18:40.» —
  comprobable en el DOM: esa línea no lleva `role="alert"` ni el tono
  ámbar/rojo que el módulo reserva para avisos, y su texto no contiene
  palabras de reproche.
- [ ] 494. Las sesiones de hoy cuya actividad **no tiene categoría**
  (`category === null`) no entran en la suma de trabajo, pero se confiesan
  en una línea propia bajo el arco con la palabra **sin dato** (p. ej. «2h
  40m sin dato hoy»). Una sesión cuya categoría existe pero **no** apunta a
  la meta no aparece en esa línea: ya se sabe que no cuenta.
- [ ] 495. Con la meta marcada y **cero minutos registrados hoy**, el arco
  aparece igual, vacío, con la misma línea de hora (ver D-C).
- [ ] 496. El arco **no aparece en un día futuro** de la tira: nada vivido
  que sumar, así que no se pinta ni vacío ni con ceros.
- [ ] 497. En un **día pasado** de la tira, el arco se pinta con los datos
  de esa fecha, **en pasado y sin proyección**: «Trabajaste Xh Ym.», con la
  misma frase sin reproche si pasó de la jornada y la misma línea «sin dato»
  si aplica; sin la línea «a este ritmo paras a las…» (ver D-B).
- [ ] 498. Quitarle a una categoría el puntero a la meta **cambia el cálculo
  de todos los días** al instante, incluidos los pasados: no hay ningún total
  congelado por día.
- [ ] 499. **Estados:** a 375 px el arco y sus líneas no provocan scroll
  horizontal, ni con la hora más larga ni con la línea de «sin dato» más
  larga; si la consulta de Hoy **o** la del catálogo de categorías falla, el
  arco **no aparece** —sigue la regla ya existente del aviso «Falta una parte
  de tu día» (`VidaHoyPage.tsx:834`) en vez de mostrar un cálculo a medias.

*Cuando ninguna categoría apunta a una meta (tajada 3)*

- [ ] 500. Si **ninguna** categoría apunta a una meta, en el lugar donde
  iría el arco aparece, en su lugar, una pregunta con las categorías del
  usuario en botones.
- [ ] 501. Tocar una categoría en esos botones **la apunta a la meta**
  (creándola —«Trabajo», 480 min— si aún no existe; misma mutación que la
  casilla del formulario) y, sin recargar la página, el sitio pasa a mostrar
  el arco con esa categoría ya contando.
- [ ] 502. Tocar una categoría no manda a Ajustes ni abre ningún formulario:
  es un toque, una acción. Una vez que al menos una categoría apunta a la
  meta, la pregunta no vuelve a aparecer en ningún día.
- [ ] 503. Con el catálogo de categorías **vacío**, el sitio de la pregunta
  no se rompe: no ofrece botones vacíos ni un error.

**Tajadas:**

| # | Qué hace | Estado |
|---|---|---|
| 1 | **La meta nace.** Tabla de metas y su migración, el puntero en `activity_categories`, la creación automática de «Trabajo, 8h» al primer uso, y la casilla en los dos formularios de categoría. El usuario ya puede marcar sus categorías mientras se construye el resto. Criterios 481–488. | pendiente |
| 2 | **El arco.** Aparece en Hoy cuando al menos una categoría apunta a la meta, suma en vivo (incluida la sesión en marcha), la línea de hora, sin reproche pasadas las 8h, la confesión de «sin dato», y su comportamiento en días futuros/pasados. Criterios 489–499. | pendiente |
| 3 | **La pregunta cuando nada apunta a una meta.** El segundo camino al mismo puntero, desde Hoy. Criterios 500–503. | pendiente |

Tres tajadas, mismo corte que antes: la 1 es la única que toca el backend y
desbloquea al usuario de inmediato (puede marcar categorías aunque el arco no
exista todavía) — ahora crea una tabla y un puntero, no dos columnas, y por
eso es más grande de lo que era; la 2 resuelve el caso entero para quien ya
marcó desde Categorías; la 3 es la segunda puerta para quien no fue a marcar
nada primero — mejora el primer minuto, pero la 2 ya es útil sin ella.

**¿Arquitecto? Sí**, por tres razones y cualquiera bastaría:

1. **Toca el API en otro repositorio** (`xavi-platform-node`), y ahora es más
   que dos columnas: nace una **tabla nueva** (metas), con su tipo de
   servicio, su tramo de esquema GraphQL, y la regla de «se crea sola la
   primera vez que hace falta». El «casi intocable» del backend en la v1 ya
   tiene sus excepciones declaradas (FEAT-003, FEAT-012); esta es otra, y
   alguien tiene que fijar el nombre de la tabla, la clave foránea, el tipo
   exacto y si la creación de la meta va en el propio resolver de editar
   categoría o en un servicio aparte.
2. **Nace una agregación viva que no existe hoy.** `CategoryBreakdown` en
   `vida-review.utils.ts` es la foto fija de un día ya cerrado, para
   Revisión. Esto necesita el minuto vivo de la sesión en marcha y la
   decisión de pintar el arco o la pregunta. Hay que decidir en qué archivo
   vive esa función nueva y qué comparte con `CategoryBreakdown` y qué no.
3. **El patrón «pregunta con botones que escribe un campo existente» es
   nuevo en Hoy.** Hay que decidir dónde vive ese componente y cómo invalida
   la consulta del catálogo de categorías sin refrescar la página entera.

**Decisiones que no son mías:** ninguna bloquea. El usuario pidió
explícitamente que las tres siguientes las decida yo, con su argumento, para
que las corrija en una línea si no está de acuerdo:

- **D-A — la sesión que no cabe en el día (empezada antes de la hora de
  inicio de Vida). Decido: cuenta entera, sin recortar.** FEAT-013 ya
  encontró que las cifras del día (la barra de sesión, `VidaSessionBar`)
  **sí** cuentan una sesión así aunque la agenda no la muestre («las cifras
  del día sí la cuentan» mientras la lista no la enseña). Esta barra es del
  mismo tipo de cifra: recortarla al arranque del día mentiría exactamente en
  lo que más importa —cuánto llevas trabajado de verdad— y esa es la premisa
  entera de la feature. No hace falta consulta nueva para esto: la sesión ya
  llega con la consulta de hoy por su `date`, no por si cabe en la ventana de
  horas.
- **D-B — ¿se pinta el arco en días pasados de la tira, y con qué texto?
  Decido: sí, en pasado y sin proyección.** Un día que ya terminó no tiene
  «ahora» desde el que proyectar, así que «a este ritmo paras a las…» no
  aplica; lo que sí aplica es el mismo dato sin reproche que hoy («Trabajaste
  Xh Ym.» y, si pasó la jornada, la misma frase neutra con la hora en que
  pasó). No mostrar nada en un día pasado escondería justo el dato que el
  usuario quería dejar de calcular a mano cuando repasa su semana.
- **D-C — ¿qué enseña el arco si hay una meta marcada y hoy no se ha
  trabajado nada? Decido: el arco vacío, con la misma fórmula de la hora.**
  La fórmula «ahora + lo que queda» ya está bien definida en cero: con cero
  minutos trabajados, «lo que queda» es la jornada entera, y la hora
  resultante es exacta (si empieza ahora y no para, esa es la hora). No hace
  falta un estado de texto distinto. *Se deja marcado para quien construya el
  render: puede sonar mejor como «si arrancas ahora, acabarías a las…» en vez
  de «a este ritmo», que es un matiz de redacción, no de cálculo.*

**Con qué features se toca** (constriñe el orden, y por eso se escribe):

- **FEAT-006/FEAT-007 — Revisión y Lo que se repite (entregadas).**
  `CategoryBreakdown` es la referencia de la aritmética por categoría, pero
  es de un día cerrado; esta feature no la reutiliza tal cual, la imita para
  el día vivo. No hay orden de construcción entre ellas.
- **FEAT-004 — Vivir el día (entregada).** `useVidaNowMinute` y el patrón de
  la sesión en marcha son la base del minuto vivo del arco.
- **FEAT-012 — La noche (specified, en cola).** También toca el API, pero ya
  no comparte tabla ni columna con esta feature —el objetivo de trabajo dejó
  de vivir en `user_settings`—, así que el motivo de revisar las dos
  migraciones juntas que tenía la versión anterior de esta sección **ya no
  aplica**. Lo que sí sigue vigente: **si algún día «Sueño» quiere su arco,
  cuelga de FEAT-012 y de `sleepActivityCategoryId`, no de la tabla de metas
  de esta feature** (ver «Fuera de alcance» y el hallazgo verificado).
- **FEAT-013 — Empezar con hora (en construcción).** Es la fuente del
  hallazgo que sostiene la D-A (las cifras del día cuentan una sesión que no
  cabe en la ventana, aunque la agenda no la muestre).

**¿Hace falta render?** Sí, y a diferencia de la versión anterior de esta
sección **ya existe y está aprobado**: `docs/vida/assets/18-vida-arcos-familia.html`,
panel 1. Cubre el arco (progreso, línea de hora, la frase sin reproche, la
línea de «sin dato») y el patrón de la casilla; la pregunta con botones en Hoy
(tajada 3) no está dibujada ahí y sigue sin marco previo — quien construya esa
tajada necesita algo equivalente a `VidaBlockOutcomes` con las palabras
exactas, no un render nuevo entero. La tajada 1 (casilla + línea en un
formulario que ya existe) sigue sin necesitarlo: es un campo más en
`VidaCategoryForm` y en `CreateVidaCategoryStep`, del mismo tipo que los que
ya tienen.

## 2. El plan — feature-architect

**Resumen para quien construya:** la referencia del front es `VidaDayBudget`
(`src/features/vida/components/VidaDayBudget/`) — el vecino de arriba en la
misma pantalla, componente tonto que recibe todo calculado; la del API es
`activity-category.service.ts` (CRUD de una entidad pequeña del mismo dueño) más
`activity-day-plan.service.ts:95-140` (transacción con `client.connect()`). Lo
nuevo: una tabla `vida_goals` con su servicio y su tramo en el **módulo vida**
del API (`src/graphql/modules/vida/`, ya registrado — no se toca ni
`schema.ts` ni `resolvers.ts`), un `goal_id` en `activity_categories`, y en el
front un `vida-goals.utils.ts` con dos componentes tontos. **No se escribe de
nuevo** la aritmética de minutos vivos (`toSessionSpans`), ni un formateador,
ni una invalidación, ni el catálogo de categorías.

> **Cambio de nombres frente al plan anterior de esta sección** (por si alguien
> guarda la versión vieja): no existen `is_work` ni `vida_work_target_minutes`,
> no hay `VidaWorkBar` ni `vida-work.utils.ts`, y **`user_settings` no se toca
> en esta feature**. El render aprobado ya fija el vocabulario: tabla
> `vida_goals`, columna `goal_id` (`docs/vida/assets/18-vida-arcos-familia.html`
> L253-254).

### Lo que ya existe

#### En este repositorio (front)

| Qué | Dónde | Qué significa para esta feature |
|---|---|---|
| Los minutos de cada sesión del día, **con la abierta contada hasta el minuto vivo** | `src/features/vida/utils/vida-execution.utils.ts:89-140` (`SessionSpan`, `ToSessionSpansInput`, `toSessionSpans`) | **No se duplica.** La abierta ya es `max(1, nowMinutes - startMinutes)`, `nowMinutes === null` ya está resuelto, y los tramos **ya vienen ordenados por hora** (línea 139), que es lo que hace posible `passedAtTime`. La suma por meta es un `filter` + `reduce` sobre esto. |
| La categoría de cada sesión, ya cargada | `src/features/vida/graphql/activity-followups.graphql.ts:18-30` (`FOLLOW_UP_ACTIVITY_FIELDS`: `category { id name color icon }`) | Criterio 490: los minutos salen de datos ya en memoria. Solo se cruza `category.id`. |
| La agregación por categoría de un día cerrado | `src/features/vida/utils/vida-review.utils.ts:904-1039` (`categoryKeyOf`, `CategoryRow`, `buildCategoryBreakdown`) | Es de Revisión. Se **imita** (ver abajo), no se importa ni se toca. |
| El reloj de 60 s | `src/features/vida/hooks/useVidaNowMinute.ts`, ya invocado en `VidaHoyPage.tsx:155` (`nowMinutes`, `nowLabel`) | Criterio 491: el arco solo lee `nowMinutes`, que ya está en el ámbito de la página. |
| El catálogo de categorías, su consulta y sus mutaciones | `src/features/vida/hooks/useActivityCategories.ts:22-74` (`useActivityCategoriesQuery`, `useCreateActivityCategoryMutation`, `useUpdateActivityCategoryMutation`), `api/activity-categories.api.ts:35-68`, `graphql/activity-categories.graphql.ts` | Tajadas 2 y 3 lo consumen tal cual. Ya cacheado (`staleTime` 5 min) por Categorías y Actividades: en Hoy es una consulta nueva **de esa pantalla**, no tráfico nuevo. |
| La invalidación sin recargar | `src/features/vida/utils/invalidate-vida-queries.ts:49-59` (`invalidateActivityCategoryQueries` → `vidaKeys.categories.list()`) | El hook de la mutación nueva la reusa: criterio 501 sale **sin escribir una invalidación nueva** (ver «Decisión A»). |
| El formulario de categoría, **que solo edita** | `src/features/vida/components/VidaCategoryForm/VidaCategoryForm.tsx:9-22` (`VidaCategoryFormValues` = `name`, `icon`, `color`), usado en `VidaCategoriasPage.tsx:209` dentro de un `Modal` | Aquí entra la casilla. |
| **El mismo trío otra vez, para crear** | `src/features/vida/components/CreateVidaCategoryStep/CreateVidaCategoryStep.tsx` | **Existe dos veces** (hallazgo que sigue vivo con el modelo nuevo). El criterio 485 son **dos archivos**. Unificarlos es otra tarea con su dossier. |
| El patrón «pregunta con botones que valen lo mismo» en Hoy | `src/features/vida/components/VidaBlockOutcomes/VidaBlockOutcomes.tsx` | Referencia de la tajada 3: componente tonto, botones de igual peso, `isBusy`, la mutación en la página. |
| Formateadores de duración y de hora | `src/features/vida/utils/vida-time.utils.ts:134` (`formatDurationMinutes`), `:49` (`minutesToTime`), `:191` (`formatTimeForDisplay`) | No se escribe ningún formateador nuevo. |
| La paleta y el catálogo de iconos | `src/shared/ui/ColorPicker/color-palette.ts:49-54` (azul núcleo `#0284c7`), `briefcase` existe en el catálogo (`src/shared/icons/catalog-integrity.test.ts:82`) | De ahí salen el color y el icono con que nace la meta «Trabajo». |
| El contrato GraphQL vendorizado | `src/features/vida/graphql/contracts.test.ts:37-39` construye **un solo esquema** con los cuatro SDL unidos (`buildSchema([activitySdl, activityDayPlanSdl, vidaSdl, userSettingsSdl].join('\n'))`) | Por eso un `extend type ActivityCategory` puesto en `vida.schema.graphql` valida sin problema: los cuatro se concatenan antes de construir. |

#### En `xavi-platform-node` (API)

| Qué | Dónde | Qué significa |
|---|---|---|
| El módulo `vida` del esquema, **ya registrado** | `src/graphql/modules/vida/vida.schema.ts` (120 l.), `vida.resolvers.ts` (127 l.), servicio en `src/services/vida.service.ts`, tipos en `src/types/services/vida.types.ts`, validadores en `src/validators/schemas/vida.schemas.ts` | `vidaTypeDefs` y `vidaResolvers` ya están en `src/graphql/schema.ts` y `src/graphql/resolvers.ts`: **la entidad nueva no añade ninguna línea de registro**. |
| CRUD de una entidad pequeña del mismo dueño | `src/services/activity-category.service.ts` (`CategoryRow` L9-19, `mapCategory` L21-32, `getOwnedCategoryOrThrow` L46-52, `createCategory` L68-87, `updateCategory` L89-132) | Es la forma que copia `vida-goal.service.ts`. |
| **«Se crea sola la primera vez» — ya existe, y con la carrera dentro** | `src/services/activity-category.service.ts:151-164` (`ensureDefaultCategoryId`: `SELECT … WHERE name='General'` y si no hay, `createCategory`) | **Es la forma a imitar y a la vez el error a no repetir**: `SELECT`-y-luego-`INSERT` sin índice único es exactamente la condición de carrera que la sección 1 dejó abierta. Ver «La carrera» abajo. |
| Transacción | `src/services/activity-day-plan.service.ts:95-140` (`const client = await db.connect(); await client.query('BEGIN') … COMMIT/ROLLBACK/release`) | El patrón literal del `ensure` + puntero en un solo `BEGIN`. |
| `ON CONFLICT` ya usado en el repo | `src/services/workout.service.ts:927,959`, `course.service.ts:666`, `quarter.service.ts:480` | El upsert no estrena idioma. |
| Precedente de tabla nueva con dueño, orden y trigger | `migrations/025_activity_categories_and_followups.sql` (tabla + columna FK **en el mismo archivo**), `migrations/058_vida_items.sql`, `migrations/065_create_app_ideas.sql` (`-- UP` / `-- DOWN`, `uuid_generate_v7()`, `update_updated_at_column`) | De ahí sale, línea por línea, la migración 069. |
| Precedente de `extend type` de otro módulo | `src/graphql/modules/workout/workout.schema.ts:137` (`extend type Activity`) + `workout.resolvers.ts:23` (`Activity: { … }`), unidos con `mergeResolvers` (`src/graphql/resolvers.ts:1,34`) | Un `extend type ActivityCategory` desde `vida.schema.ts` con su resolver en `vida.resolvers.ts` es patrón vivo, no invento. |
| La trampa del `.refine` | `src/validators/schemas/activity.schemas.ts:135-152` | **Comprobada otra vez y sigue ahí** — pero con el diseño de abajo **no se toca**, porque el puntero no viaja por `activityCategoryEdit`. Si alguien cambia de idea y lo mete ahí, tiene que añadir su `||` en el `.refine` (L144-151) o «solo el puntero» se rechaza con «At least one field is required to update». |
| Los tests del API que hay que imitar | `tests/unit/services/activity-category.service.test.ts` (mock de `getDbPool`), `tests/unit/services/activity-day-plan.service.test.ts:34-45` (**mock de `connect()` y del `client`**, que es lo que hace falta para probar la transacción), `tests/unit/validators/vida.schemas.test.ts` | No hay tests de resolvers de actividad ni de vida (`tests/unit/graphql/resolvers/` solo tiene expense y wallet): **no se estrena uno aquí**. |

**Lo que NO existe, dicho explícitamente:** no hay ninguna tabla de metas ni
nada parecido a un objetivo de minutos por concepto en los dos repositorios
(buscado `goal`, `meta`, `target`, `jornada`, `work`); no hay ninguna suma de
minutos «en vivo» filtrada por una propiedad del catálogo; no hay ninguna barra
ni arco normalizado contra un objetivo del usuario (`VidaDayBudget`,
`VidaPlanVsRealBar` y `VidaSessionBar` normalizan contra el propio día o contra
el mayor de dos números); y **no hay ningún SVG de arco** en el front (los
gráficos a mano que existen son las barras de `<div>` y los de
`habits/components/HabitPanel/`). La geometría se copia del render, no del
código.

### Implementación de referencia

**Front: `src/features/vida/components/VidaDayBudget/`** (+ su invocación en
`VidaHoyPage.tsx:985-1000`). Es la que hay que imitar y no otra: ocupa
**exactamente el hueco de al lado** —el arco va debajo de ese mismo elemento—,
recibe todo calculado desde la página, no llama a ningún hook y no muta nada.
`VidaPlanVsRealBar.tsx:23-39` es la versión de 40 líneas del mismo truco si hace
falta leerlo de un vistazo.

**Front, aritmética: `buildCategoryBreakdown`** (`vida-review.utils.ts:904-1039`),
de la que se imitan tres cosas y **solo** tres: (1) leer
`session.activity?.category ?? null` y tratar el nulo como su propio cubo
(criterio 494); (2) el reparto «tally → formato»: la función pura devuelve
minutos **y** etiquetas ya compuestas **y** un `share` de 0 a 1, y el componente
solo pinta; (3) `formatDurationMinutes` para los textos. **No comparte** nada del
lado del plan (`plannedMinutes`, `missing`, `offPlanCount`,
`describeCategoryNote`) ni la palabra `UNCATEGORIZED_GROUP_NAME` («Sin
categoría»): aquí la palabra es **«sin dato»** (criterio 494).

**API: `src/services/activity-category.service.ts`** para la forma del servicio
(row → `mapCategory`, `getOwnedCategoryOrThrow`, export de un objeto al final) y
**`src/services/activity-day-plan.service.ts:95-140`** para la transacción. La
función `ensureDefaultCategoryId` (L151-164) es la forma de «se crea sola», pero
**su implementación no se copia**: le falta justo lo que resuelve la carrera.

### Dónde va el código nuevo — API (`~/Developer/xavi-platform-node`)

Todo esto es **tajada 1**. Las tajadas 2 y 3 no tocan el API.

#### 1. La migración — **una sola**, `migrations/069_vida_goals.sql`

**Una, no dos**, y el argumento es la FK: la columna `activity_categories.goal_id`
no puede existir sin la tabla, y separarlas dejaría un `DOWN` que no se puede
correr por mitades. El precedente es literal: `025_activity_categories_and_followups.sql`
crea `activity_categories` **y** añade `activities.category_id` en el mismo
archivo. **Lista `migrations/` justo antes de escribir**: hoy el último es el
`068` (FEAT-012, aún sin correr en producción), así que el `069` está libre,
pero puede haberlo tomado otra sesión.

```sql
-- Vida: metas con minutos objetivo. Una categoría apunta a una meta (goal_id);
-- varias categorías pueden apuntar a la misma.

-- UP
CREATE TABLE IF NOT EXISTS vida_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(255),
  color VARCHAR(255),
  target_minutes INTEGER NOT NULL
    CHECK (target_minutes > 0 AND target_minutes <= 1440),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vida_goals_user_slug_unique UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_vida_goals_user_id ON vida_goals(user_id);

CREATE TRIGGER update_vida_goals_updated_at BEFORE UPDATE ON vida_goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE activity_categories
  ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES vida_goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activity_categories_goal_id
  ON activity_categories(goal_id) WHERE goal_id IS NOT NULL;

-- DOWN
-- DROP INDEX IF EXISTS idx_activity_categories_goal_id;
-- ALTER TABLE activity_categories DROP COLUMN IF EXISTS goal_id;
-- DROP TRIGGER IF EXISTS update_vida_goals_updated_at ON vida_goals;
-- DROP TABLE IF EXISTS vida_goals;
```

Las decisiones de esa tabla, para que no se rediscutan:

- **`id UUID` con `uuid_generate_v7()`**: es lo que usan `activity_categories`
  (025), `vida_items` (058) y `app_ideas` (065). `user_id INTEGER` porque
  `users.id` es `SERIAL`.
- **`slug VARCHAR(64) NOT NULL` + `UNIQUE (user_id, slug)`**: la identidad
  estable de la meta. La automática nace con `slug = 'work'`. **Por slug y no
  por nombre** porque el día que exista la pantalla de editar y el usuario
  renombre «Trabajo» a «Curro», un `ensure` por nombre crearía una segunda
  fila; por slug, no. Y es el índice único el que hace atómica la creación
  (ver «La carrera»).
- **`target_minutes INTEGER` con `CHECK` 1..1440**: `INTEGER` es el tipo de
  todos los minutos del esquema (`duration_minutes` en 025); el `CHECK` sigue
  el precedente de `050_wallet_user_settings_period_cutoff.sql`. Criterio 483:
  los minutos viven **aquí**, y ni `activity_categories` ni `user_settings`
  ganan columna de minutos.
- **`icon` / `color` `VARCHAR(255)` nullable**, igual que en
  `activity_categories`: mismo vocabulario (nombre del catálogo de iconos, hex
  de la paleta).
- **`order_index INTEGER NOT NULL DEFAULT 0`**: es lo que ordenará la fila de
  arcos el día que haya tres (panel 2 del render). Hoy hay una y da igual, pero
  cuesta cero y evita una migración después.
- **`goal_id … ON DELETE SET NULL`** (no `CASCADE`): borrar una meta **no**
  puede borrar categorías del usuario; las desapunta, que es exactamente lo
  que significa. Mismo criterio que `activities.category_id` en 025.
- **Índice parcial** en `goal_id`: la inmensa mayoría de las filas lo tendrán a
  `NULL`.
- **Sin `UPDATE` de relleno**: nadie tiene metas todavía; `goal_id` nace `NULL`
  para todos (criterio 482, puntero nullable).

**Al desplegar:** un push a `main` despliega Cloud Run y Render a la vez, y
`RUN_MIGRATIONS` está en `false` en Render — **la migración la corre alguien a
mano contra Neon**, y en ese mismo viaje entra la **068 de FEAT-012**, que sigue
pendiente. Está escrita y commiteada; solo hay que saberlo antes de pulsar.

#### 2. El tipo de servicio

`src/types/services/vida.types.ts` (hoy 71 líneas: `VidaItem`, `VidaTakenToday`,
`VidaSuggestion`) gana, **en el mismo archivo** —ese archivo ya guarda varias
entidades del módulo—:

```ts
export interface VidaGoal {
  id: string;
  userId: number;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  targetMinutes: number;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SetCategoryGoalInput {
  categoryId: string;
  /** false: se quita el puntero (goal_id = NULL). */
  attached: boolean;
  /** Meta explícita. Omitida con `attached: true`: la meta por defecto del usuario, creada si no existe. */
  goalId?: string | null;
}
```

Y `src/types/services/activity-category.types.ts` gana `goalId: string | null`
en `ActivityCategory` (junto a L8). **No** entra en
`CreateActivityCategoryInput` ni en `UpdateActivityCategoryInput`: el puntero no
se escribe por ahí (ver «Dónde NO va»).

#### 3. El servicio — `src/services/vida-goal.service.ts` (**nuevo**)

Archivo propio y no dentro de `vida.service.ts` (359 líneas, sobre ítems de la
plantilla y «tomado hoy»): otra entidad, otra tabla, y aquí hay transacción.
Sigue la forma de `activity-category.service.ts`: `GoalRow`, `mapGoal`,
`getOwnedGoalOrThrow`, y un `export const vidaGoalService = { … }` al final.

```ts
export const WORK_GOAL: { slug: string; name: string; targetMinutes: number; icon: string; color: string }
// { slug: 'work', name: 'Trabajo', targetMinutes: 480, icon: 'briefcase', color: '#0284c7' }

async function ensureDefaultGoal(client: PoolClient, userId: number): Promise<GoalRow>
async function listGoals(userId: number): Promise<VidaGoal[]>
async function setCategoryGoal(userId: number, input: SetCategoryGoalInput): Promise<ActivityCategory>
async function getGoalById(id: string, userId: number): Promise<VidaGoal>   // para el field resolver
```

- **`icon: 'briefcase'`** — comprobado que existe en el catálogo del front
  (`src/shared/icons/catalog-integrity.test.ts:82`). **`color: '#0284c7'`** — el
  azul **núcleo** de la paleta compartida
  (`src/shared/ui/ColorPicker/color-palette.ts:54`), **no** el `#38bdf8` del
  render: ese hex no está en la paleta y el front pinta categorías con hexes de
  esa lista. Si el usuario prefiere el tono del render, se cambia esa constante
  y ya.
- `listGoals` hoy **no tiene consumidor** (el front no pide las metas: le llegan
  dentro de la categoría). Se escribe igualmente porque el field resolver lo
  necesita en su versión `getGoalById`; **no se expone una Query `vidaGoals`**
  en esta feature (ver «Lo que NO hay que crear»).

#### 4. La carrera — resuelta aquí, en el servicio, no en el cliente

La sección 1 la dejó escrita como riesgo. Dos toques rápidos en la pregunta de
Hoy, o el formulario y la pregunta a la vez, harían dos `SELECT` que no ven
nada y dos `INSERT`: dos metas «Trabajo». Se cierra con **tres cosas a la vez**,
y ninguna sobra:

1. **La restricción única `UNIQUE (user_id, slug)`** de la migración. Es la
   única garantía de verdad: aunque el código falle, la base no admite dos.
2. **Un upsert que siempre devuelve la fila**, en vez de `SELECT`-y-si-no-`INSERT`:

   ```sql
   INSERT INTO vida_goals (user_id, slug, name, icon, color, target_minutes, order_index)
   VALUES ($1, $2, $3, $4, $5, $6, 0)
   ON CONFLICT (user_id, slug)
   DO UPDATE SET name = vida_goals.name
   RETURNING *
   ```

   El `DO UPDATE` con un valor que no cambia nada **no es un adorno**:
   `DO NOTHING` no devuelve fila cuando hay conflicto, y el `SELECT` de rescate
   puede no ver todavía la fila de la transacción concurrente (READ COMMITTED),
   que es la carrera otra vez. `DO UPDATE` devuelve **y bloquea** la fila
   existente. Efecto secundario aceptado: el trigger `update_updated_at_column`
   toca `updated_at` de la meta en un `ensure` que no cambió nada. Es cosmético
   y nadie lo lee; si molestara, se afina con
   `DO UPDATE SET updated_at = vida_goals.updated_at`.
3. **La misma transacción que la escritura del puntero.** El `ensure` y el
   `UPDATE activity_categories SET goal_id = …` van dentro de un solo
   `BEGIN … COMMIT` sobre el mismo `client`, copiando
   `activity-day-plan.service.ts:95-140` (incluido el `ROLLBACK` en `catch` y
   el `release()` en `finally`). Así no queda nunca una meta creada sin
   categoría apuntándola si el segundo `UPDATE` falla.

Esqueleto de `setCategoryGoal`, que es donde vive la regla entera:

```ts
// 1. getOwnedCategoryOrThrow(categoryId, userId)  ← la categoría es suya (403 si no)
// 2. BEGIN
// 3. attached === false        → goalId final = null
//    attached && input.goalId  → getOwnedGoalOrThrow dentro de la tx (403 si es de otro)
//    attached && !input.goalId → ensureDefaultGoal(client, userId)  ← el upsert de arriba
// 4. UPDATE activity_categories SET goal_id = $1 WHERE id = $2 AND user_id = $3 RETURNING *
// 5. COMMIT · catch → ROLLBACK · finally → client.release()
// 6. devuelve mapCategory(row)  ← la categoría ya con su goalId
```

**Por qué en el API y no en el cliente:** el cliente no puede garantizar
unicidad entre dos pestañas, y si «crear la meta» fuese una llamada aparte
seguida de «apuntar la categoría», cada toque serían dos viajes con una ventana
de carrera en medio y un estado intermedio posible (meta creada, categoría sin
apuntar). Aquí es **un viaje, una transacción**.

#### 5. El tramo de esquema GraphQL — en el módulo `vida`

`src/graphql/modules/vida/vida.schema.ts` (hoy 120 líneas). Se añaden, en este
orden dentro del `gql` que ya existe:

```graphql
  type VidaGoal {
    id: ID!
    userId: Int!
    """Identidad estable de la meta. La automática es 'work'."""
    slug: String!
    name: String!
    icon: String
    color: String
    targetMinutes: Int!
    orderIndex: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type ActivityCategory {
    """Meta a la que apunta esta categoría, o null."""
    goalId: ID
    goal: VidaGoal
  }

  input ActivityCategoryGoalSetInput {
    categoryId: ID!
    """false quita el puntero. true lo pone."""
    attached: Boolean!
    """Meta explícita. Omitida con attached: true, se usa la meta por defecto del usuario, creándola si no existe."""
    goalId: ID
  }

  extend type Mutation {
    activityCategoryGoalSet(input: ActivityCategoryGoalSetInput!): ActivityCategory!
  }
```

`extend type ActivityCategory` desde otro módulo es patrón vivo
(`workout.schema.ts:137` hace `extend type Activity`), y los typeDefs se unen en
`src/graphql/schema.ts` donde `vidaTypeDefs` **ya está** (L15 y L59): **cero
líneas de registro**.

#### 6. Resolvers, mapeo de fila y validadores — la lista completa, ninguno opcional

| # | Archivo | Qué |
|---|---|---|
| 1 | `src/services/activity-category.service.ts` | `goal_id: string \| null` en `CategoryRow` (L9-19) y `goalId: row.goal_id` en `mapCategory` (L21-32). **Sin esto el campo viaja vacío aunque el SDL lo declare.** `createCategory` y `updateCategory` **no se tocan**. |
| 2 | `src/types/services/activity-category.types.ts` | `goalId: string \| null` en `ActivityCategory` (junto a L8). |
| 3 | `src/types/services/vida.types.ts` | `VidaGoal` y `SetCategoryGoalInput` (§2 de arriba). |
| 4 | `src/services/vida-goal.service.ts` (**nuevo**) | §3 y §4. |
| 5 | `src/graphql/modules/vida/vida.schema.ts` | §5. |
| 6 | `src/graphql/modules/vida/vida.resolvers.ts` | `ActivityCategory: { goal: … }` — campo resuelto como `Activity.category` en `activity.resolvers.ts:40-48`: `if (!parent.goalId) return null; requireAuth(...); return vidaGoalService.getGoalById(parent.goalId, uid(context))`. Y en `Mutation` (L72), `activityCategoryGoalSet` con `withValidatedResolver(vidaGoalCategorySetInputSchema, …)`, copiando cualquiera de los de ese bloque. Los resolvers se unen con `mergeResolvers` (`src/graphql/resolvers.ts:1,34`), así que `ActivityCategory` en dos módulos no se pisa — y aquí solo lo define este. |
| 7 | `src/validators/schemas/vida.schemas.ts` | `vidaGoalCategorySetInputSchema = z.object({ categoryId: uuidString, attached: z.boolean(), goalId: uuidString.nullish() })`. **Sin `.refine`**: los dos campos obligatorios ya están. **La lección del `limit ≤ 100`: el validador manda sobre el SDL.** Un campo declarado `Boolean!` en GraphQL y ausente del `z.object` se cae con un error feo, no con el de GraphQL. |
| 8 | `tests/unit/services/vida-goal.service.test.ts` (**nuevo**) | Modelado sobre `tests/unit/services/activity-day-plan.service.test.ts:34-45` (mock de `connect()` + `client`). Cuatro casos mínimos: (a) sin meta previa, `attached: true` sin `goalId` → hace el `INSERT … ON CONFLICT` y luego el `UPDATE` con el id devuelto, **dentro de `BEGIN`/`COMMIT`**; (b) con meta previa → el mismo upsert devuelve la fila existente y **no** se crea otra; (c) `attached: false` → `goal_id = NULL` y **no** se llama al upsert; (d) categoría de otro usuario → `ForbiddenError` y `ROLLBACK`. |
| 9 | `tests/unit/services/activity-category.service.test.ts` | `goal_id` en las filas de fixture y `goalId` en lo que devuelve `mapCategory` (en `listCategories`, `getCategoryById` y `createCategory`). Es donde se ve que el dato viaja. |
| 10 | `tests/unit/validators/vida.schemas.test.ts` | El esquema nuevo: acepta `{categoryId, attached:true}`, acepta `{categoryId, attached:false}`, rechaza sin `attached` y rechaza un `categoryId` que no es UUID. |

**Lo que NO se toca en el API:** `user_settings` entero (ni tabla, ni servicio,
ni esquema, ni validador — el objetivo dejó de vivir ahí),
`src/validators/schemas/activity.schemas.ts` (el `.refine` no hace falta con
este diseño), `src/graphql/schema.ts`, `src/graphql/resolvers.ts`,
`activity.schema.ts` y `activity.resolvers.ts`.

### Dónde va el código nuevo — front

#### El SDL vendorizado (tajada 1)

Dos archivos, copia literal del árbol de trabajo del API:

- **`src/features/vida/graphql/schema/vida.schema.graphql`** — `type VidaGoal`,
  `extend type ActivityCategory`, `input ActivityCategoryGoalSetInput` y la
  línea de `extend type Mutation`. Actualizar la fecha `Copiado:` de la
  cabecera.
- **`src/features/vida/graphql/schema/activity.schema.graphql`** — **solo si**
  el builder decide poner los campos en `type ActivityCategory` en vez de en el
  `extend`. Con el diseño de arriba **no hace falta tocarlo**; se dice para que
  nadie lo recopie «por si acaso» y se lleve por delante los **bloques base que
  solo viven en el front** (Query/Mutation vacíos, escalares, `Todo`/`TodoFolder`
  reducidos) que la propia cabecera enumera y que `contracts.test.ts:25-29`
  explica.
- **`src/features/settings/graphql/schema/user-settings.schema.graphql`** — **no
  se toca**. (En el plan viejo sí; ya no.)

`contracts.test.ts` une los cuatro SDL antes de construir
(`contracts.test.ts:37-39`), así que el `extend type ActivityCategory` en
`vida.schema.graphql` valida contra el `type ActivityCategory` de
`activity.schema.graphql` sin más.

#### Los documentos y los tipos (tajada 1)

- `src/features/vida/graphql/activity-categories.graphql.ts` — en las **cuatro**
  selecciones que ya existen (`ACTIVITY_CATEGORIES_QUERY` L2,
  `ACTIVITY_CATEGORY_QUERY` L16, `ACTIVITY_CATEGORY_ADD_MUTATION` L30,
  `ACTIVITY_CATEGORY_EDIT_MUTATION` L44) se añade
  `goalId` y `goal { id slug name icon color targetMinutes orderIndex }`.
  **Criterio 487 cumplido: ningún documento de consulta nuevo.** Y en el mismo
  archivo, **un documento de mutación nuevo**:
  `ACTIVITY_CATEGORY_GOAL_SET_MUTATION` (`mutation ActivityCategoryGoalSet($input: ActivityCategoryGoalSetInput!)`),
  que devuelve la categoría con los mismos campos. Vive aquí, y no en un
  archivo nuevo, porque devuelve una `ActivityCategory` y lo consumen los mismos
  hooks.
- `src/features/vida/graphql/contracts.test.ts` — **sí hay que tocarlo** (esto
  cambia respecto al plan viejo): añadir `'ACTIVITY_CATEGORY_GOAL_SET_MUTATION'`
  a la lista literal de nombres (L77-81, **está ordenada alfabéticamente**: va
  entre `ACTIVITY_CATEGORY_EDIT_MUTATION` y `ACTIVITY_CATEGORY_QUERY`). No hace
  falta importar nada nuevo.
- `src/features/vida/types/vida-goal.types.ts` (**nuevo**) —
  `export type VidaGoal = { id, slug, name, icon: string | null, color: string | null, targetMinutes: number, orderIndex: number }`.
  Sin `userId` ni fechas: no se seleccionan.
- `src/features/vida/types/activity-category.types.ts` — `goalId: string | null`
  y `goal: VidaGoal | null` en `ActivityCategory`.
- `src/features/vida/api/activity-categories.api.ts` — `setActivityCategoryGoal(input)`
  junto a las cinco que ya hay (L35-68), con `graphqlRequest` como las demás.
- `src/features/vida/hooks/useActivityCategories.ts` —
  `useSetActivityCategoryGoalMutation()` copiando
  `useUpdateActivityCategoryMutation` (L58-73), **incluido su
  `onSuccess: invalidateActivityCategoryQueries(...)`**: ahí está el criterio
  501 sin escribir invalidación nueva.

#### La casilla, en los dos formularios (tajada 1)

- `src/features/vida/components/VidaCategoryForm/VidaCategoryForm.tsx` —
  `VidaCategoryFormValues` (L9-13) gana `isWork: boolean`, y el cuerpo un cuarto
  campo: casilla «Esto es trabajo» con la línea «Sus horas suman en el arco de
  trabajo de Hoy» (render 18, panel 3, L193-200). El componente sigue **tonto**:
  no muta. **Se llama `isWork` y no `goalId` a propósito**: hoy el formulario no
  puede producir un id (la meta puede no existir todavía). El día de la lista,
  este campo pasa a `goalId: string | null` y la mutación ya lo acepta sin tocar
  el API.
- `src/features/vida/components/CreateVidaCategoryStep/CreateVidaCategoryStep.tsx` —
  la misma casilla, el mismo texto. **Es el segundo archivo del criterio 485.**
- `src/features/vida/pages/VidaCategoriasPage.tsx` — el estado inicial (~L55-58),
  `openEdit` (~L74-76) y `handleSubmit` (~L84-91) pasan ahora cuatro campos; y
  **al guardar**: `activityCategoryEdit` (o `Add`) con nombre/icono/color **y**,
  si `isWork` cambió respecto al valor inicial, `activityCategoryGoalSet`. En
  **crear**, la de la meta va encadenada tras la de crear (hacen falta el id de
  la categoría): si la segunda falla, la categoría queda creada y sin marcar y
  se dice con el toast de error — recuperable desde la casilla de editar. En
  **editar**, marcar o desmarcar es **una sola llamada** (criterio 486).
- `src/features/vida/pages/VidaCategoriasPage.test.tsx` — la casilla marca y
  desmarca, y el guardado dispara la mutación de la meta.

#### La aritmética (tajada 2)

**Archivo nuevo: `src/features/vida/utils/vida-goals.utils.ts`** (+
`vida-goals.utils.test.ts` al lado, como todos los `utils` del módulo).
**No** dentro de `vida-execution.utils.ts`, y el argumento es doble: ese archivo
tiene **1.274 líneas** y un asunto concreto —el cruce entre el plan y lo
vivido—, y lo consumen Hoy **y** Revisión, mientras que esto es solo de Hoy. La
dependencia va en un solo sentido (importa `toSessionSpans` y `SessionSpan`) y
no crea ciclo.

**La firma es lo que garantiza que «el día que haya dos sea una fila más»**
(punto 4 del encargo). Nada aquí dice «trabajo»: la meta es un dato.

```ts
import type { VidaGoal } from '@/features/vida/types/vida-goal.types'

export type VidaGoalArc = {
  /** La meta entera, tal como vino del catálogo: nombre, icono, color, minutos. */
  goal: VidaGoal
  /** Las categorías que apuntan a ella (para la línea «Cuenta X»). */
  categoryIds: string[]
  workedMinutes: number
  workedLabel: string          // formatDurationMinutes
  targetMinutes: number        // goal.targetMinutes, copiado para el pintor
  share: number                // 0..1, topado en 1 para el trazo del arco
  overMinutes: number          // 0 si no se pasó
  stopAtTime: string | null    // «18:40»; null si nowMinutes === null o es día pasado
  passedAtTime: string | null  // la hora a la que se cruzó la meta, o null
  runningTitle: string | null  // la sesión en marcha que cuenta para esta meta
}

export type VidaGoalArcs = {
  /** Una por meta con al menos una categoría apuntándola, ordenadas por goal.orderIndex y luego name. */
  arcs: VidaGoalArc[]
  noDataMinutes: number        // sesiones con category === null
  noDataLabel: string
}

export function buildGoalArcs(input: {
  followUps: ActivityFollowUp[]
  date: string
  nowMinutes: number | null
  categories: ActivityCategory[]   // el catálogo: de aquí salen las metas y el cruce
  isPastDay: boolean
}): VidaGoalArcs
```

Cuatro cosas que no son obvias y van escritas para que no se redescubran:

- **Las metas salen del catálogo, agrupando**: `categories.filter(c => c.goal)`
  agrupado por `goal.id`. No hay lista de metas por otro lado, y por eso no hace
  falta ninguna consulta de metas. Una meta sin ninguna categoría apuntándola
  **no produce arco** — que es exactamente el estado de la pregunta (criterio 500).
- **`stopAtTime` = `minutesToTime(nowMinutes + (targetMinutes - workedMinutes))`**
  (criterio 492), `null` en día pasado (D-B). Con cero trabajado da la jornada
  entera desde ahora, que es exacto (D-C).
- **`passedAtTime` no es `nowMinutes - over`**: hay que recorrer los tramos de
  esa meta **ordenados por hora** acumulando minutos y quedarse con aquel en que
  el acumulado cruza `targetMinutes`; la hora es
  `span.startMinutes + (targetMinutes - acumuladoAntesDeEseTramo)`.
  `toSessionSpans` ya los devuelve ordenados (`vida-execution.utils.ts:139`).
- **La medianoche no se arregla aquí.** `minutesToTime` corta en 23:59: una hora
  de parada posterior se lee 23:59. Límite conocido del módulo (sección 1). **No
  lo parchees en esta función.**

El test (`vida-goals.utils.test.ts`) lleva, además de los casos de los criterios,
**uno con dos metas en el catálogo** que comprueba que devuelve dos arcos
ordenados por `orderIndex`. No es una función que la app pueda ejercitar hoy
—la base solo permite una meta por usuario, por el `UNIQUE (user_id, slug)` y
porque solo nace la de slug `'work'`—, y ese test es la prueba de que la forma
aguanta sin rediseño. **Por eso la pantalla nunca enseña más de una meta en esta
feature: lo garantiza el dato, no un `slice(0, 1)` en la vista** — un tope en la
vista sería código muerto que la feature siguiente tendría que quitar.

#### Los componentes (tajadas 2 y 3)

- **`src/features/vida/components/VidaGoalArc/`** (tajada 2) — `VidaGoalArc.tsx`,
  `VidaGoalArcRow.tsx`, `VidaGoalArc.module.scss`, `index.ts`. Los dos tontos:
  - `VidaGoalArc` recibe `{ arc: VidaGoalArc; isPastDay: boolean }` **y nada
    más**. Pinta el semicírculo, la hora grande dentro, el nombre y el icono
    **de `arc.goal`**, y el trazo con `arc.goal.color`. Ni una constante
    «Trabajo» ni «480» dentro del componente.
  - `VidaGoalArcRow` recibe `{ arcs: VidaGoalArc[]; noDataLabel: string; isPastDay: boolean }`
    y mapea. Con un arco ocupa el ancho (panel 1 del render); con varios, la
    fila en pequeño (panel 2) — **eso ya es otra feature, pero la fila es este
    mismo componente**.
  - **Geometría, copiada del render aprobado**
    (`docs/vida/assets/18-vida-arcos-familia.html:123-135`): `viewBox="0 0 220 124"`,
    dos `path d="M22 106 A 88 88 0 0 1 198 106"` (pista y trazo),
    `pathLength="100"` + `stroke-dasharray="{share*100} 100"` — el mismo truco de
    proporción por variable que `VidaDayBudget`, aplicado a un arco.
  - **Accesibilidad y criterio 493:** el `<svg>` va con `role="img"` y un
    `aria-label` con la frase entera (como el render), y la cifra y la frase van
    **además** en `<p>` de texto real fuera del SVG — el `<text>` de un SVG no
    lo encuentra `getByText`. Ese `<p>` **no lleva `role="alert"`** ni el tono
    ámbar/rojo reservado a avisos, y su texto no lleva adjetivos.
- **`src/features/vida/components/VidaGoalPrompt/`** (tajada 3) — los tres
  archivos de siempre. Recibe `{ categories, onPick(categoryId), isBusy }`;
  copia el reparto de `VidaBlockOutcomes.tsx` (botones del mismo peso, la
  mutación en la página). Con `categories` vacío devuelve `null` —
  criterio 503.
- **Los componentes de Vida no llevan test co-locado** (comprobado en
  `VidaBlockOutcomes/`, `VidaDayBudget/`, `VidaUpNextCard/`): lo suyo se prueba
  desde `VidaHoyPage.test.tsx` y la aritmética desde `vida-goals.utils.test.ts`.
  No estrenes un `VidaGoalArc.test.tsx`.

#### El cableado en Hoy (tajadas 2 y 3)

`src/features/vida/pages/VidaHoyPage.tsx`:

- `const { data: categories = [], isError: categoriesFailed } = useActivityCategoriesQuery()`
  **en la página**, no dentro de `useVidaDayData`: ese hook documenta que el
  catálogo no entra ahí y su `failed` habla de las cuatro consultas del día.
- El resumen, en un `useMemo` al lado del de `execution` (~L246-248):
  `buildGoalArcs({ followUps: dayFollowUps, date, nowMinutes, categories, isPastDay: isPast })`.
- **Sitio del render: justo debajo del elemento `<VidaDayBudget … />`**, dentro
  de `<div className={styles.main}>` y antes de la agenda (hoy **L985-1000**;
  el aviso «Falta una parte de tu día» está en L970-981 y `isPast` en L151).
  **Anclar por el elemento `<VidaDayBudget`, no por el número de línea:** este
  archivo lo está tocando ahora mismo FEAT-010 y las líneas se habrán movido.
- Guardas, con variables que ya existen en el ámbito:
  - `failed.length > 0 || categoriesFailed` → **no se pinta nada** (criterio 499,
    misma regla que el aviso de L970-981).
  - `!isToday && !isPast` (día futuro) → nada (criterio 496).
  - `isPast` → `VidaGoalArcRow` con `isPastDay`, sin `stopAtTime` (criterio 497).
  - `arcs.length === 0` → **tajada 3**: `VidaGoalPrompt` con `categories` y
    `onPick` = `useSetActivityCategoryGoalMutation().mutate({ categoryId, attached: true })`.
    Hasta que exista la tajada 3, ese caso **no pinta nada**.
- `src/features/vida/pages/VidaHoyPage.module.scss` — solo si el arco necesita
  hueco propio en `.main`.
- `src/features/vida/pages/VidaHoyPage.test.tsx` — aquí se comprueban los
  criterios de las tajadas 2 y 3.

#### Decisión A — de dónde sale la meta al sumar (importa más de lo que parece)

**Del catálogo (`useActivityCategoriesQuery`), cruzando por `category.id`; ni
`goalId` ni `goal` se añaden a `FOLLOW_UP_ACTIVITY_FIELDS`**
(`activity-followups.graphql.ts:18-30`). Es el mismo razonamiento que en el plan
viejo, y con el modelo nuevo vale igual o más:

1. Los `followUps` están cacheados **por fecha**. Si cada sesión llevara su copia
   del puntero, desapuntar una categoría dejaría copias viejas en todas las
   fechas ya visitadas y habría que invalidar `vidaKeys.followUps.day(…)` de cada
   día — justo lo que rompen los criterios 498 y 501. Y ahora sería peor:
   viajaría embebida también la meta entera (nombre, minutos objetivo), así que
   cambiar los 480 minutos el día que haya pantalla dejaría arcos viejos en cada
   fecha cacheada.
2. Con el catálogo como única fuente, **la invalidación ya existe**:
   `invalidateActivityCategoryQueries` (`invalidate-vida-queries.ts:49-59`)
   invalida `vidaKeys.categories.list()`, React Query refetchea y el arco se
   recalcula solo, en Hoy y en cualquier día de la tira, sin recargar.
3. El criterio 490 sigue en pie: los **minutos** salen de la consulta de Hoy sin
   pedir nada nuevo; lo único que se cruza es el `id` de la categoría, que ya
   viene en la sesión.

La sesión **sin** categoría (`category === null`) se detecta igual que hoy,
mirando el `category` embebido: es lo que alimenta la línea de «sin dato»
(criterio 494).

### Lo que NO hay que crear

- **Ninguna consulta GraphQL nueva**: el catálogo ya trae la meta dentro de la
  categoría (criterio 487). Lo único nuevo es **un documento de mutación**,
  `ACTIVITY_CATEGORY_GOAL_SET_MUTATION`.
- **Ninguna Query `vidaGoals` en el API**, ni hook ni clave de caché de metas:
  hoy no habría quien la llame. El día de la pantalla de metas, se añade.
- **Ninguna pantalla para renombrar la meta, cambiarle icono, color o minutos**
  (fuera de alcance, sección 1). La meta nace con sus valores y ahí se queda.
- **Ninguna función de invalidación nueva** (Decisión A).
- **Ningún formateador de duración ni de hora**: `formatDurationMinutes`,
  `minutesToTime` y `formatTimeForDisplay` están en `vida-time.utils.ts`.
- **Ninguna reescritura de `toSessionSpans`** ni de la cuenta de la sesión
  abierta: ya está y ya está probada en `vida-execution.utils.test.ts`.
- **Nada en `user_settings`** (ni columna, ni tipo, ni SDL, ni validador): el
  objetivo vive en la meta.
- **Nada en `VidaRevisionPage`, `VidaReviewCategories` ni
  `buildCategoryBreakdown`** (fuera de alcance).
- **Ningún `slice(0, 1)` ni tope en la vista** para «enseñar una sola meta»: lo
  garantiza el dato (ver la aritmética).
- **Ningún test de resolvers en el API**: `tests/unit/graphql/resolvers/` solo
  tiene expense y wallet; esta feature no estrena esa costumbre.

### Dónde NO va

- **El puntero no viaja por `activityCategoryEdit`.** Dos razones: (a) al primer
  uso el cliente **no tiene** el id de la meta —no existe todavía—, y un input
  `goalId` no sabe decir «créala»; hacerlo en dos llamadas abriría la carrera
  que el §4 cierra; (b) meterlo ahí obliga además a ensanchar el `.refine` de
  `activityCategoryEditInputSchema`
  (`src/validators/schemas/activity.schemas.ts:144-151`), porque guardar **solo**
  `{id, goalId}` se rechaza hoy con «At least one field is required to update».
  Con la mutación propia, esa trampa **no se pisa**. Si alguien revierte esta
  decisión, tiene que tocar ese `.refine` — y el SDL no se lo va a recordar.
- **No va dentro de `vida-execution.utils.ts`** (1.274 líneas, otro asunto, dos
  pantallas consumiéndolo).
- **No va dentro de `useVidaDayData`**: su contrato documentado son las cuatro
  consultas del día y su `failed`; el catálogo no es del día.
- **No va dentro de `VidaDayBudget`**: es el vecino y la referencia, pero mezclar
  el presupuesto del día con la meta haría un componente que dice dos cosas
  sobre dos denominadores distintos; el criterio 489 pide el arco **debajo**.
- **No va en `vida.service.ts` del API** (359 líneas, ítems y «tomado hoy»):
  entidad distinta y con transacción.
- **No se marca por sesión ni por actividad** (columna en `activity_follow_ups` o
  en `activities`): descartado en la sección 1.
- **No se congela un total por día**: la sección 1 lo acepta como consecuencia y
  el criterio 498 lo exige al revés.
- **No se recorta la sesión que empieza antes del día** (D-A): cuenta entera.
- **No se toca el arco de «Sueño» ni el de «Workout»**: `sleepActivityCategoryId`
  tiene su modelo propio (FEAT-012) e `isWorkout` es de solo escritura hoy.

### Las tajadas, con sus archivos

**Se mantienen las tres de la sección 1, en el mismo orden y con los mismos
criterios.** Bajando al código el corte aguanta: la 1 se prueba sola (marcar una
categoría y que el catálogo devuelva su meta), la 2 es útil sin la 3, y la 3 es
la segunda puerta al mismo puntero. El único ajuste es de alcance, no de corte:
la tajada 1 toca **dos** formularios y **además** estrena un documento de
mutación y el `contracts.test.ts`.

**Orden obligado dentro de la tajada 1** (no es un corte nuevo, es una
secuencia): API escrito y en verde → recopiar el SDL del árbol de trabajo →
front → **push del API** → **correr la migración a mano contra Neon** (y saber
que la 068 de FEAT-012 viaja en el mismo empujón) → prueba a mano del usuario →
aceptar. El front se construye y se prueba entero sin red: `contracts.test.ts`
no llama a nadie.

**Las tajadas 2 y 3 ya tienen render aprobado** (`18-vida-arcos-familia.html`,
panel 1 para el arco, panel 3 para la casilla). Lo que **no** está dibujado es la
pregunta con botones de la tajada 3: sus palabras exactas las fija el usuario o
se copian del tono de `VidaBlockOutcomes`.

| # | Qué hace | Archivos | Criterios | Estado |
|---|---|---|---|---|
| 1 | **La meta nace.** Tabla `vida_goals`, el `goal_id` en `activity_categories`, la creación automática sin carrera, y la casilla en los dos formularios. | **API:** `migrations/069_vida_goals.sql` (nuevo) · `src/types/services/vida.types.ts` · `src/types/services/activity-category.types.ts` · `src/services/vida-goal.service.ts` (nuevo) · `src/services/activity-category.service.ts` (`CategoryRow` L9-19 y `mapCategory` L21-32) · `src/graphql/modules/vida/vida.schema.ts` · `src/graphql/modules/vida/vida.resolvers.ts` · `src/validators/schemas/vida.schemas.ts` · `tests/unit/services/vida-goal.service.test.ts` (nuevo) · `tests/unit/services/activity-category.service.test.ts` · `tests/unit/validators/vida.schemas.test.ts`. **Front:** `src/features/vida/graphql/schema/vida.schema.graphql` (recopiar) · `src/features/vida/graphql/activity-categories.graphql.ts` · `src/features/vida/graphql/contracts.test.ts` (un nombre en la lista L77-81) · `src/features/vida/types/vida-goal.types.ts` (nuevo) · `src/features/vida/types/activity-category.types.ts` · `src/features/vida/api/activity-categories.api.ts` · `src/features/vida/hooks/useActivityCategories.ts` · `src/features/vida/components/VidaCategoryForm/VidaCategoryForm.tsx` (+ `.module.scss`) · `src/features/vida/components/CreateVidaCategoryStep/CreateVidaCategoryStep.tsx` (+ `.module.scss`) · `src/features/vida/pages/VidaCategoriasPage.tsx` (~L55-58, ~L74-76, ~L84-91) · `src/features/vida/pages/VidaCategoriasPage.test.tsx`. | 481–488 | pendiente |
| 2 | **El arco.** La suma viva por meta, la hora en grande, la frase sin reproche, «sin dato», y los días pasados y futuros. | `src/features/vida/utils/vida-goals.utils.ts` (nuevo) · `src/features/vida/utils/vida-goals.utils.test.ts` (nuevo) · `src/features/vida/components/VidaGoalArc/{VidaGoalArc.tsx,VidaGoalArcRow.tsx,VidaGoalArc.module.scss,index.ts}` (nuevos) · `src/features/vida/pages/VidaHoyPage.tsx` (import, `useActivityCategoriesQuery`, el `useMemo`, el render bajo `<VidaDayBudget/>`) · `src/features/vida/pages/VidaHoyPage.module.scss` (si hace falta hueco) · `src/features/vida/pages/VidaHoyPage.test.tsx`. **Nada del API.** | 489–499 | pendiente |
| 3 | **La pregunta cuando nada apunta a una meta.** | `src/features/vida/components/VidaGoalPrompt/{VidaGoalPrompt.tsx,VidaGoalPrompt.module.scss,index.ts}` (nuevos) · `src/features/vida/pages/VidaHoyPage.tsx` (la rama `arcs.length === 0` y `useSetActivityCategoryGoalMutation`) · `src/features/vida/pages/VidaHoyPage.test.tsx`. **Nada del API, ningún documento nuevo, ninguna invalidación nueva.** | 500–503 | pendiente |

### Cómo se verifica cada tajada

**Front (las tres tajadas)** — `docs/features/ENVIRONMENT.md`, línea base de hoy:
`pnpm typecheck` limpio · `pnpm lint` **14 errores / 0 warnings** · `pnpm test`
**2 fallos de 1746** (y a veces un tercero, `IconPicker` flaky: córrelo aislado
antes de culpar a tu cambio) · `pnpm build` al cerrar, no solo `typecheck`. La
regla es «no peor que la línea base».

**API (solo tajada 1)** — línea base medida el 2026-09-22 y **ya rota de
antes**: `npx tsc --noEmit` **limpio, y eso sí es una puerta**; `npm test`
**3 fallos de 560 y 6 suites de 51 en rojo** (hábitos, gastos, sueño, standup;
cuatro ni compilan) — **ninguna toca `activity_categories` ni `vida_*`**, así que
cualquier fallo nuevo en esas áreas es tuyo; `npm run lint` **895 problemas** y
**no es una puerta utilizable**: se corre `npx eslint <solo los archivos que
tocas>` antes y después y se compara **esa** cuenta. **Nunca `lint:fix` a lo
ancho**: reformatearía medio repositorio en un commit que despliega.

Lo más útil de la tajada 1, y es barato: correr **solo** las tres suites que
tocas (`npm test -- tests/unit/services/vida-goal.service.test.ts tests/unit/services/activity-category.service.test.ts tests/unit/validators/vida.schemas.test.ts`)
mientras construyes, y la corrida entera al cerrar para comparar con 3/560 y 6/51.

**Lo que no se puede verificar desde aquí:** todo lo que está detrás del login.
La casilla y el arco con datos reales los prueba el usuario; los agentes se
quedan en tests, arneses aislados (`src/harness-*.tsx` + su `.html`, que **se
borran antes de reportar**) y el DOM. Y la migración **no la corre un agente**.

### Lo que este plan no pudo averiguar

- **Las palabras exactas de la pregunta de la tajada 3** (el render 18 no la
  dibuja). Las del arco y las de la casilla sí están en el render aprobado.
- **No se ejecutó nada**: los dos repositorios se leyeron, no se corrió ningún
  test ni ninguna migración en esta sesión. Las líneas base son las que
  `ENVIRONMENT.md` documenta, medidas hoy por el usuario.
- **El comportamiento real del `ON CONFLICT … DO UPDATE` contra Neon** no se ha
  probado contra una base viva (sí está razonado y es el idioma estándar). El
  test del servicio lo prueba contra un mock, que verifica la **forma** de la
  consulta, no el motor. La confirmación de que no nacen dos metas «Trabajo» con
  dos toques rápidos es una prueba a mano del usuario tras el despliegue.

## 3. Construcción — feature-builder

*(una entrada por tajada, añadida debajo)*

## 4. Revisión — feature-reviewer

*(una entrada por tajada)*
