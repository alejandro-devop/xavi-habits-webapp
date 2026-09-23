---
id: FEAT-016
title: El arco de trabajo — la primera meta de tu día, cuánto llevas y a qué hora paras
status: delivered
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
| 1 | **La meta nace.** Tabla de metas y su migración, el puntero en `activity_categories`, la creación automática de «Trabajo, 8h» al primer uso, y la casilla en los dos formularios de categoría. El usuario ya puede marcar sus categorías mientras se construye el resto. Criterios 481–488. | aceptada |
| 2 | **El arco.** Aparece en Hoy cuando al menos una categoría apunta a la meta, suma en vivo (incluida la sesión en marcha), la línea de hora, sin reproche pasadas las 8h, la confesión de «sin dato», y su comportamiento en días futuros/pasados. Criterios 489–499. | aceptada (498 pendiente de prueba a mano) |
| 3 | **La pregunta cuando nada apunta a una meta.** El segundo camino al mismo puntero, desde Hoy. Criterios 500–503. | aceptada |

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
| 1 | **La meta nace.** Tabla `vida_goals`, el `goal_id` en `activity_categories`, la creación automática sin carrera, y la casilla en los dos formularios. | **API:** `migrations/069_vida_goals.sql` (nuevo) · `src/types/services/vida.types.ts` · `src/types/services/activity-category.types.ts` · `src/services/vida-goal.service.ts` (nuevo) · `src/services/activity-category.service.ts` (`CategoryRow` L9-19 y `mapCategory` L21-32) · `src/graphql/modules/vida/vida.schema.ts` · `src/graphql/modules/vida/vida.resolvers.ts` · `src/validators/schemas/vida.schemas.ts` · `tests/unit/services/vida-goal.service.test.ts` (nuevo) · `tests/unit/services/activity-category.service.test.ts` · `tests/unit/validators/vida.schemas.test.ts`. **Front:** `src/features/vida/graphql/schema/vida.schema.graphql` (recopiar) · `src/features/vida/graphql/activity-categories.graphql.ts` · `src/features/vida/graphql/contracts.test.ts` (un nombre en la lista L77-81) · `src/features/vida/types/vida-goal.types.ts` (nuevo) · `src/features/vida/types/activity-category.types.ts` · `src/features/vida/api/activity-categories.api.ts` · `src/features/vida/hooks/useActivityCategories.ts` · `src/features/vida/components/VidaCategoryForm/VidaCategoryForm.tsx` (+ `.module.scss`) · `src/features/vida/components/CreateVidaCategoryStep/CreateVidaCategoryStep.tsx` (+ `.module.scss`) · `src/features/vida/pages/VidaCategoriasPage.tsx` (~L55-58, ~L74-76, ~L84-91) · `src/features/vida/pages/VidaCategoriasPage.test.tsx`. | 481–488 | aceptada |
| 2 | **El arco.** La suma viva por meta, la hora en grande, la frase sin reproche, «sin dato», y los días pasados y futuros. | `src/features/vida/utils/vida-goals.utils.ts` (nuevo) · `src/features/vida/utils/vida-goals.utils.test.ts` (nuevo) · `src/features/vida/components/VidaGoalArc/{VidaGoalArc.tsx,VidaGoalArcRow.tsx,VidaGoalArc.module.scss,index.ts}` (nuevos) · `src/features/vida/pages/VidaHoyPage.tsx` (import, `useActivityCategoriesQuery`, el `useMemo`, el render bajo `<VidaDayBudget/>`) · `src/features/vida/pages/VidaHoyPage.module.scss` (si hace falta hueco) · `src/features/vida/pages/VidaHoyPage.test.tsx`. **Nada del API.** | 489–499 | aceptada (498 pendiente de prueba a mano) |
| 3 | **La pregunta cuando nada apunta a una meta.** | `src/features/vida/components/VidaGoalPrompt/{VidaGoalPrompt.tsx,VidaGoalPrompt.module.scss,index.ts}` (nuevos) · `src/features/vida/pages/VidaHoyPage.tsx` (la rama `arcs.length === 0` y `useSetActivityCategoryGoalMutation`) · `src/features/vida/pages/VidaHoyPage.test.tsx`. **Nada del API, ningún documento nuevo, ninguna invalidación nueva.** | 500–503 | aceptada |

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

### Tajada 1 — La meta nace

**Resumen para quien revise:**
1. Nace la tabla `vida_goals` en el API con su migración `069`, el puntero
   `activity_categories.goal_id`, la mutación propia `activityCategoryGoalSet`
   (que crea la meta «Trabajo, 480 min» sola y sin carrera), y la casilla «Esto
   es trabajo» en **los dos** formularios de categoría del front.
2. Dos repositorios tocados, **nada commiteado y nada desplegado**; la
   migración **no se ha corrido** contra ninguna base.
3. **Lo que más probablemente rompí:** el tipo `ActivityCategory` del front ganó
   dos campos **obligatorios** (`goalId`, `goal`), así que **toda fixture de
   categoría en tests** tuvo que crecer — toqué siete archivos de test por eso.
   Y cambié `mutate` por `mutateAsync` en el guardado de `VidaCategoriasPage` y
   en `CreateVidaCategoryStep`: si algún test de otra rama mockea `mutate` de
   esas dos mutaciones, se cae. Tercer sospechoso: cualquier consumidor del
   catálogo de categorías recibe ahora una selección GraphQL más grande —el
   `goal` embebido—, y si el backend desplegado no tiene todavía el campo, esa
   consulta **falla entera** (ver «Riesgos»).

**Qué se construyó:**

*API (`~/Developer/xavi-platform-node`, sin commitear):*

- `migrations/069_vida_goals.sql` (**nuevo**) — tabla `vida_goals` con
  `UNIQUE (user_id, slug)`, `CHECK` de 1..1440 minutos, índice por usuario y
  trigger de `updated_at`; y en el mismo archivo la columna
  `activity_categories.goal_id UUID REFERENCES vida_goals(id) ON DELETE SET NULL`
  con su índice parcial. `DOWN` comentado, como la 068. **No se ha corrido.**
- `src/types/services/vida.types.ts` — `VidaGoal` y `SetCategoryGoalInput`.
- `src/types/services/activity-category.types.ts` — `goalId: string | null` en
  `ActivityCategory`.
- `src/services/activity-category.service.ts` — `goal_id` en `CategoryRow` y
  `goalId` en `mapCategory`. `createCategory`/`updateCategory` intactos (usan
  `RETURNING *`, comprobado: el campo viaja sin tocarlos).
- `src/services/vida-goal.service.ts` (**nuevo**) — `WORK_GOAL`
  (`slug: 'work'`, «Trabajo», 480, `briefcase`, **`#0284c7`**, el azul núcleo de
  la paleta del front, no el `#38bdf8` del render), `ensureDefaultGoal` con el
  `INSERT … ON CONFLICT (user_id, slug) DO UPDATE SET name = vida_goals.name
  RETURNING *`, `getGoalById`, `listGoals` y `setCategoryGoal` con
  `BEGIN/COMMIT/ROLLBACK/release` sobre un solo `client`.
- `src/graphql/modules/vida/vida.schema.ts` — `type VidaGoal`, `extend type
  ActivityCategory { goalId, goal }`, `input ActivityCategoryGoalSetInput` y la
  mutación `activityCategoryGoalSet`. Ni `schema.ts` ni `resolvers.ts` tocados.
- `src/graphql/modules/vida/vida.resolvers.ts` — `ActivityCategory.goal` (igual
  que `Activity.category`) y la mutación con `withValidatedResolver`.
- `src/validators/schemas/vida.schemas.ts` — `vidaGoalCategorySetInputSchema`.
- `tests/unit/services/vida-goal.service.test.ts` (**nuevo**, 7 casos),
  `tests/unit/services/activity-category.service.test.ts` (+2),
  `tests/unit/validators/vida.schemas.test.ts` (+5).

*Front (`~/Developer/xavi-habits-webapp`, sin commitear):*

- `src/features/vida/graphql/schema/vida.schema.graphql` — recopiado literal
  del árbol de trabajo del API (extraído del `gql` con un script, no a mano),
  con la fecha de la cabecera actualizada.
- `src/features/vida/graphql/activity-categories.graphql.ts` — `goalId` y el
  bloque `goal { … }` en las cuatro selecciones que ya existían (criterio 487:
  **ningún documento de consulta nuevo**) + el documento de mutación nuevo
  `ACTIVITY_CATEGORY_GOAL_SET_MUTATION`.
- `src/features/vida/graphql/contracts.test.ts` — el nombre nuevo en la lista
  literal, entre `…_EDIT_MUTATION` y `…_QUERY`.
- `src/features/vida/types/vida-goal.types.ts` (**nuevo**) y
  `activity-category.types.ts` (`goalId`, `goal`, `ActivityCategoryGoalSetInput`).
- `src/features/vida/api/activity-categories.api.ts` — `setActivityCategoryGoal`.
- `src/features/vida/hooks/useActivityCategories.ts` —
  `useSetActivityCategoryGoalMutation`, con `invalidateActivityCategoryQueries`
  reusada.
- `src/features/vida/components/VidaCategoryForm/VidaCategoryForm.tsx` —
  `isWork` en `VidaCategoryFormValues` y la casilla con su línea.
- `src/features/vida/components/CreateVidaCategoryStep/CreateVidaCategoryStep.tsx`
  — la misma casilla y el encadenado crear → apuntar.
- `src/features/vida/pages/VidaCategoriasPage.tsx` — estado inicial, `openEdit`
  (la casilla llega marcada si `goalId`), y el guardado.
- Tests tocados por el tipo o por la casilla:
  `VidaCategoriasPage.test.tsx` (+3 casos), `VidaActivitySheet.test.tsx`,
  `useActivityCategories.test.tsx`, `useCreateStartingActivities.test.tsx`,
  `VidaActividadesPage.test.tsx`, `VidaArchivadasPage.test.tsx`,
  `vida-catalog.utils.test.ts`.

**Por qué así, y qué se descartó:**

- **Cuatro desvíos del plan, ninguno de diseño**, y los digo porque el plan
  daba otra letra pequeña:
  1. **`setCategoryGoal` no usa `getOwnedCategoryOrThrow` ni `mapCategory`**:
     son privados de `activity-category.service.ts` y **en este repositorio
     ningún servicio exporta su mapper** (comprobado: cero `export function
     map…` en `src/services`). Usa el público
     `activityCategoryService.getCategoryById`, que hace las dos cosas —
     comprobar propiedad antes de abrir la transacción y devolver la categoría
     mapeada después del `COMMIT`. Cuesta dos consultas de más en una acción
     rara; la alternativa era duplicar el mapper o exponer internos.
  2. **El `UPDATE` del puntero lleva `AND user_id` y comprueba filas**: si no
     casa ninguna, lanza `ForbiddenError` dentro de la transacción y hace
     `ROLLBACK`. Es la comprobación de propiedad **dentro** de la ventana de la
     transacción, no solo antes.
  3. **La casilla usa el `Checkbox` de `@/shared/ui/Checkbox`**, que ya trae
     `label` + `description` + `aria-describedby`: no hace falta ningún
     `.module.scss` nuevo en los dos formularios (el plan los dejaba «si hace
     falta»).
  4. **`useSetActivityCategoryGoalMutation` no lanza toast de éxito** (sí de
     error). Al guardar la edición viaja junto a `activityCategoryEdit`, que ya
     dice «Categoría actualizada»: dos avisos por un guardado serían ruido.
- **Guardar en editar es `mutateAsync` encadenado**: primero nombre/icono/color,
  después el puntero **solo si la casilla cambió**, y el modal se cierra al
  final. Con `mutate` + `onSuccess` anidados el cierre quedaba a merced de dos
  callbacks y el estado de carga no cubría la segunda llamada.
- **En crear son dos viajes y no se puede hacer en uno** sin ensanchar el API:
  la mutación de crear categoría (`activityCategoryAdd`) no acepta el puntero
  —el plan lo prohíbe a propósito, porque el `.refine` de
  `activityCategoryEditInputSchema` y la creación de la meta son dos problemas
  distintos— y el id de la categoría no existe antes de crearla. Mirado el
  código: la única forma de un solo viaje sería un campo `goalAttached` en
  `ActivityCategoryInput` + su rama en `createCategory`, que es API nuevo. **No
  lo hice**; queda dicho, como pediste, en vez de hecho.
- **El `.refine` de `activity.schemas.ts` no se tocó**, como manda el plan: el
  puntero viaja por su mutación propia.

**Verificación:**

*Front* — `pnpm typecheck`: limpio (sin salida). `pnpm lint`: **14 errores / 0
warnings**, los mismos de la línea base (el último sigue siendo el
`react-refresh/only-export-components`). `pnpm test`: **2 fallos de 1788**
(línea base 2 de 1783; los cinco de más son míos) — los dos son los de
`SearchSelect`, y el `IconPicker` flaky no salió esta vez. `pnpm build`: exit 0,
chunk inicial **1.115,06 kB** (línea base 1.112,22 kB: **+2,84 kB**, que es la
selección GraphQL nueva, el tipo, el hook, la función de API y las dos
casillas), `app-icons` **620,20 kB sin mover** e `IconPicker` 4,64 kB.

*API* — `npx tsc --noEmit`: **limpio, exit 0**. `npm test`: **3 fallos de 574 y
6 suites de 52 en rojo** — misma cifra de fallos y de suites rojas que la línea
base (3/560 y 6/51); el total sube porque añadí 14 casos y la suite de más es
`vida-goal.service.test.ts`, **en verde**. `npx eslint` sobre los siete archivos
de `src/` que toqué: **2 problemas, los dos preexistentes y en líneas que no
toqué** (el docstring de `clientId` en `vida.schema.ts` y la unión de días en
`vida.types.ts`); los cuatro que introduje al escribir los `"""…"""` en una
línea los corregí a mano. **No se corrió `lint:fix`.** Los tres archivos de
`tests/` dan el mismo error de parseo de siempre (no están en el `tsconfig`),
también preexistente.

**Criterios que cierra:**

- **481 ✔** — `migrations/069_vida_goals.sql`: `vida_goals` con `name`, `icon`,
  `color`, `target_minutes`, `order_index` (y `slug`).
- **482 ✔** — `goal_id UUID` **nullable** en `activity_categories`, sin `UNIQUE`
  en la columna: dos categorías pueden apuntar a la misma meta. El test
  `vida-goal.service.test.ts` → «reuses the existing goal instead of creating a
  second one» lo prueba del lado del servicio.
- **483 ✔** — los minutos están solo en `vida_goals.target_minutes`;
  `user_settings` no se tocó (cero diferencias en ese archivo, comprobado con
  `git status`) y `activity_categories` solo ganó el puntero.
- **484 ✔ (en test, no contra base viva)** — `ensureDefaultGoal` con el upsert y
  la transacción; probado en `vida-goal.service.test.ts`: se comprueba el `SQL`
  literal (`ON CONFLICT (user_id, slug)` + `DO UPDATE`), los parámetros
  (`['work','Trabajo','briefcase','#0284c7',480]`), el `BEGIN`/`COMMIT`, y que
  con meta previa **no** sale un segundo `INSERT`. Lado front, `VidaCategoriasPage.test.tsx`
  manda `{ categoryId, attached: true }` **sin `goalId`**: es el servidor quien
  la crea. **Que de verdad no nazcan dos metas con dos toques concurrentes solo
  se puede confirmar contra Postgres**: queda como prueba a mano (abajo).
- **485 ✔** — los dos archivos. Editar: `VidaCategoriasPage.test.tsx` → «la
  casilla … llega marcada si la categoría apunta a una meta» comprueba la
  casilla y el texto «Sus horas suman en el arco de trabajo de Hoy.». Crear:
  `VidaActivitySheet.test.tsx` → «+ nueva» comprueba la misma casilla y la misma
  línea dentro de `CreateVidaCategoryStep`. Es una **casilla**, no una lista.
- **486 ✔** — `VidaCategoriasPage.test.tsx` → «marcar la casilla y guardar
  apunta la categoría a la meta, sin pantalla intermedia»: un clic en la
  casilla, un clic en «Guardar», ninguna confirmación, y el modal se cierra. El
  caso de desmarcar tiene su propio test (`attached: false`).
- **487 ✔** — `activity-categories.graphql.ts`: las cuatro selecciones que ya
  existían crecieron; no hay documento de **consulta** nuevo. El único
  documento nuevo es de mutación y está en la lista de `contracts.test.ts`, que
  pasa (77 casos).
- **488 ✔ parcialmente, con la parte de red pendiente** — ninguna pantalla
  cambia de comportamiento: las suites de `VidaActividadesPage`,
  `VidaArchivadasPage`, `VidaActivitySheet` (42 casos) y `VidaCategoriasPage`
  pasan solo con la fixture crecida, sin tocar sus expectativas. **Lo que no se
  puede comprobar desde aquí** es la pantalla real contra el API desplegado:
  mientras el backend no lleve el campo, la consulta del catálogo falla entera
  (ver «Riesgos»).

**Lo que queda a mano del usuario** (todo esto está detrás del login, y los
agentes no entran):

1. **Empujar el API** (`xavi-platform-node`, sin commitear hoy). Ojo: ese push
   despliega Cloud Run y Render, y arrastra la **068 de FEAT-012**, que sigue
   sin correr.
2. **Correr `069_vida_goals.sql` a mano contra Neon** (y decidir qué pasa con la
   068). **Antes de desplegar el front**, o mejor a la vez: en cuanto el front
   nuevo pida `goalId`/`goal` a un backend viejo, el catálogo de categorías
   entero devuelve error.
3. En Ajustes → Categorías, editar una categoría, marcar «Esto es trabajo» y
   guardar; volver a abrirla y ver la casilla marcada. Desmarcar y repetir.
4. Crear una categoría desde la hoja de actividad («+ nueva») con la casilla
   marcada y comprobar que queda marcada al editarla.
5. **La prueba de la carrera:** marcar dos categorías distintas casi a la vez
   (dos pestañas) y comprobar en la base que hay **una sola** fila en
   `vida_goals` con `slug = 'work'`.

**Riesgos:**

- **El front nuevo exige un backend nuevo.** `goalId` y `goal` están en las
  cuatro selecciones del catálogo: contra el API actual, `activityCategories`
  devuelve error de validación y **Categorías, Actividades y la hoja de
  actividad se quedan sin catálogo**. No es degradación suave. Orden obligado:
  API primero.
- **`ActivityCategory` ganó dos campos obligatorios en el front.** Cualquier
  rama viva con una fixture de categoría no compilará hasta añadir
  `goalId`/`goal`.
- **`mutate` → `mutateAsync`** en `VidaCategoriasPage` y
  `CreateVidaCategoryStep`: los mocks de test que solo tenían `mutate` fallan.
- **El `DO UPDATE` toca `updated_at` de la meta** en cada `ensure` que no cambia
  nada (el trigger). Cosmético y aceptado en el plan.
- **La migración no se ha ejecutado** en ningún sitio: el SQL está razonado y
  copiado de precedentes, pero **nadie lo ha visto aplicarse**.
- **Lo que no llegué a cubrir con un test automático:** el encadenado
  crear → apuntar de `CreateVidaCategoryStep`. Escribí dos casos que lo probaban
  y **pasaban aislados pero no en la corrida del archivo entero**
  (`VidaActivitySheet.test.tsx`, 42 casos: el paso apilado carga el `IconPicker`
  en diferido y la cadena se pasaba del tiempo; no es el flaky del `IconPicker`
  que documenta `ENVIRONMENT.md`, pero huele al mismo sitio). Los quité en vez
  de dejarlos en rojo o de subirles el tiempo hasta que colaran. Lo que **sí**
  quedó probado ahí es que la casilla y su línea se pintan en ese formulario;
  el encadenado se apoya en el tipado y en el punto 4 de la prueba a mano.

**Estado del árbol:** **sin commitear en los dos repositorios.** Nada de `push`,
ninguna migración corrida, ningún `lint:fix`. En el front, `graphify update .`
sí se corrió (4.070 nodos), así que `graphify-out/` sale también modificado.

### Tajada 1 — segunda vuelta (lo devuelto)

**Resumen para quien revise:**
1. Los dos arreglos pedidos, **los dos de test**: el caso «+ nueva» que ya
   existía ahora marca la casilla y afirma la segunda llamada **y su orden**, y
   los dos mocks a medias de `VidaActividadesPage` y `VidaPlantillaPage` están
   completos.
2. **Ni una línea del API ni del producto** cambió en esta vuelta: solo tres
   archivos `.test.tsx` del front.
3. **Lo que más probablemente rompí:** nada nuevo, y lo digo con la medida
   delante — el `pnpm build` devuelve el **mismo artefacto byte a byte**
   (`index-VIzbn6Ne.js`, 1.115,06 kB), que es lo que se espera de un cambio que
   solo toca tests. El único riesgo real es que el caso «+ nueva» ahora hace
   **dos** afirmaciones más dentro de un archivo que ya era el más lento del
   módulo: si algún día se pasa de tiempo, el sitio a mirar es ese.

**Qué se arregló:**

- `src/features/vida/components/VidaActivitySheet/VidaActivitySheet.test.tsx` —
  dentro del caso «+ nueva» que ya existía (no uno nuevo): se marca la casilla
  antes de pulsar «Crear categoría» y se afirma que
  `setCategoryGoal.mutateAsync` se llama **una vez** con
  `{ categoryId: 'plantas', attached: true }` y **después** de
  `createCategory.mutateAsync` — el orden con
  `mock.invocationCallOrder`, aferrado y no supuesto. Sustituye al
  `expect(setCategoryGoal.mutateAsync).not.toHaveBeenCalled()` que había ahí;
  el caso «sin marcar» sigue cubierto en `VidaCategoriasPage.test.tsx` («Editar»
  guarda el cambio sin tocar la casilla → la mutación de la meta no viaja).
- `src/features/vida/pages/VidaActividadesPage.test.tsx` — `buildMutation()`
  gana `mutateAsync` y el mock del módulo gana
  `useSetActivityCategoryGoalMutation`.
- `src/features/vida/pages/VidaPlantillaPage.test.tsx` — lo mismo en el mock de
  `useActivityCategories`.

**El revisor tenía razón y el dato lo confirma.** Lo que se me pasaba de tiempo
era un caso **nuevo** que repetía el montaje entero de la hoja y del paso
apilado; añadir un clic y dos afirmaciones al caso que **ya** monta todo eso no
cuesta nada. Medido: el caso «+ nueva» tarda **851 ms** y el archivo entero
**7,42 s** (antes de este cambio, 7,29 s). No hizo falta ni un test propio de
`CreateVidaCategoryStep` ni `vi.mock('@/shared/ui/IconPicker')`.

**Verificación (las dos líneas base, otra vez):**

*Front* — `pnpm typecheck` limpio · `pnpm lint` **14 errores / 0 warnings** ·
`pnpm test` **2 fallos de 1788**, y esta vez con nombre:
`SearchSelect > filters options by search query` y
`SearchSelect > selects an option` (el flaky del `IconPicker` no salió) ·
`pnpm build` exit 0, chunk inicial **1.115,06 kB**, `app-icons` **620,20 kB sin
mover**, `IconPicker` 4,64 kB.

*API* — `npx tsc --noEmit` **limpio** · `npm test` **3 fallos de 574 y 6 suites
de 52 en rojo**, las mismas de siempre. **El API no se tocó en esta vuelta**
(`git status` del repo hermano idéntico al de la primera).

**Criterios:** los mismos que cerraba la primera vuelta (481–487, y 488 salvo la
parte de red). Lo que cambia es que **484 y 485 ya no dependen del tipado en el
camino de crear**: la cadena crear → apuntar está afirmada, con su orden.

**Anotado para quien siga, idea del revisor que NO se implementó aquí** (es
mejora, no defecto, y esta devolución venía apretada): el `UPDATE` del puntero
en `vida-goal.service.ts` podría hacer `RETURNING *` y
`activity-category.service.ts` exportar **solo** `mapCategory` —función pura,
no un interno peligroso—. Ahorraría las dos llamadas a `getCategoryById` y, lo
que más importa, quitaría la lectura de después del `COMMIT`, que hoy ocurre
**fuera** de la transacción. Quien lo haga: `mapCategory` sería el primer mapper
exportado de `src/services/` en ese repositorio, así que conviene decirlo en su
comentario para que no parezca un accidente.

**Estado del árbol:** sin commitear en los dos repositorios, sin push, sin
ninguna migración corrida. `graphify update .` corrido tras el cambio.

### Tajada 2 — El arco

**Resumen para quien revise:**
1. En Hoy aparece **el arco** del render 18 panel 1 —semicírculo, la hora en
   grande dentro— debajo de `VidaDayBudget` y encima de la agenda, con la suma
   viva de las categorías que apuntan a una meta (la abierta incluida, cada 60 s),
   la línea «Llevas 2 h 50 min. A este ritmo paras a las 16:15.», la confesión
   «2 h 40 min sin dato hoy.» y, pasada la jornada, el dato sin un adjetivo.
2. Solo front y **nada del API**: un `utils` nuevo con su test, un componente
   nuevo con su fila, y el cableado en `VidaHoyPage`. Ni un documento GraphQL
   nuevo.
3. **Lo que más probablemente rompí:** `VidaHoyPage` estrena una consulta —el
   catálogo de categorías— y por eso su test estrena el `vi.mock` de
   `@/features/vida/hooks/useActivityCategories`. Cualquier otra suite que monte
   la página **sin** ese mock intentará la consulta de verdad (queda salvada por
   `useVidaQueryGuard`, que la deja `enabled: false` sin sesión, pero es el sitio
   a mirar si algo se cae). Segundo sospechoso: el arco mete un elemento más en
   `styles.main`, entre el presupuesto y la agenda — cualquier test que anclara
   por `previousElementSibling` o por posición de nodo ahí se descoloca. Tercero:
   el `pnpm build` subió el chunk inicial de 1.115,06 a **1.119,84 kB** (+4,8 kB),
   que es lo que pesa el código nuevo, y `app-icons` **no se movió** (620,20 kB).

**Qué se construyó:**

- `src/features/vida/utils/vida-goals.utils.ts` (**nuevo**) — `buildGoalArcs`,
  con la firma que dejó el arquitecto y tres añadidos que se explican abajo.
  Importa `toSessionSpans` (la sesión abierta **ya** viene contada hasta el
  minuto vivo: no se reimplementó) y los formateadores de `vida-time.utils.ts`.
  Las metas salen del catálogo agrupando por `goal.id`; la hora de parada es
  `minutesToTime(ahora + (jornada − trabajado))`; `passedAtTime` recorre los
  tramos ordenados acumulando, **no** resta de «ahora».
- `src/features/vida/utils/vida-goals.utils.test.ts` (**nuevo**, 13 casos) —
  uno por criterio y **uno con dos metas** que comprueba que devuelve dos arcos
  ordenados por `orderIndex`, cada uno con su hora. Es el que el arquitecto pidió
  y el revisor anunció.
- `src/features/vida/components/VidaGoalArc/{VidaGoalArc.tsx,VidaGoalArcRow.tsx,VidaGoalArc.module.scss,index.ts}`
  (**nuevos**) — los dos tontos. La geometría es la del render, copiada:
  `viewBox="0 0 220 124"`, dos `path d="M22 106 A 88 88 0 0 1 198 106"`,
  `pathLength="100"` y `stroke-dasharray`. El nombre, el icono, el color y los
  minutos salen de `arc.goal`: **ni una constante «Trabajo» ni un 480** dentro
  del componente, y **ningún `slice(0, 1)`**.
- `src/features/vida/pages/VidaHoyPage.tsx` — `useActivityCategoriesQuery()` **en
  la página** (no en `useVidaDayData`), el `useMemo` de `buildGoalArcs` al lado
  del de `execution`, y el `<VidaGoalArcRow/>` **anclado al elemento
  `<VidaDayBudget … />`**, no a un número de línea (acabó sobre la 1035).
- `src/features/vida/pages/VidaHoyPage.test.tsx` — el `vi.mock` del módulo de
  categorías **entero** (las seis exportaciones, no solo la consulta: es
  exactamente la trampa que `ENVIRONMENT.md` documentó en la tajada 1) y 12
  casos nuevos, uno por criterio del 489 al 499.

**Por qué así, y qué se descartó:**

- **La posición se comprueba por el DOM, no por confianza**: el caso del criterio
  489 afirma con `compareDocumentPosition` que el arco va **después** del
  presupuesto y **antes** de la primera fila del plan. Un `toBeInTheDocument()`
  habría pasado con el arco en cualquier sitio.
- **Tres campos más en `VidaGoalArc` de los que enumeraba el plan**, y es la única
  desviación de forma: `targetLabel`, `runningSince`, y el par
  `arcValue`/`arcCaption` (lo grande de dentro del arco y su rótulo) más `line`
  (la misma frase, entera, para el `<p>` de fuera del SVG). Razón: el render pone
  dentro del arco una hora con rótulo y debajo una frase, y **la frase tiene que
  existir como texto de verdad** para que el criterio 493 sea comprobable en el
  DOM. Dejarlo en el componente habría metido ahí la lógica de «qué frase toca»,
  que es justo lo que el reparto «tally → formato» evita. `runningSince` sale del
  render («en marcha desde las 10:15»), que el plan no había traducido a campo.
- **«Trabajaste Xh Ym.» del criterio 497 se dice «Registraste 5 h de Trabajo.»**
  — el único texto que se aparta de la letra de un criterio, y a propósito: el
  componente y la función **no saben** que la meta es trabajo, así que el verbo
  no puede ser «trabajar». Con una meta «Estudiar» la misma frase sigue siendo
  cierta. **No he reescrito el criterio**; lo dejo aquí para que el revisor o el
  usuario decidan si la palabra vale.
- **Dos formateadores, no uno**: el corto (`formatDurationFromMinutes`, «2h 50»)
  en la cabecera y en los topes del arco, el largo (`formatDurationMinutes`,
  «2 h 50 min») dentro de las frases — la misma costumbre que `CategoryRow` y
  `describeCategoryNote`. Ninguno nuevo. Efecto secundario visible: la frase dice
  «9 h 10 min» y no «9h 10m» como el ejemplo del criterio 493.
- **La guarda del catálogo caído no ensancha nada**: `failed.length === 0 &&
  !categoriesFailed` en la página, y el aviso «Falta una parte de tu día» sigue
  hablando solo de las cuatro consultas del día. Hay un caso que lo afirma.

**Verificación** (todo con la web del usuario en el 5173, que respondía):

| Qué | Resultado | Línea base |
|---|---|---|
| `pnpm typecheck` | limpio | limpio ✔ |
| `pnpm lint` | **14 errores / 0 warnings** | 14/0 ✔ |
| `pnpm test` | **2 fallos de 1812** (`SearchSelect` ×2) | 2 de 1788 ✔ (+25 casos nuevos; en la primera corrida salió el tercero de `IconPicker`, el flaky documentado, y en la segunda no) |
| `pnpm build` | exit 0 · chunk inicial **1.119,84 kB** · `app-icons` **620,20 kB** · `IconPicker` 4,64 kB | 1.115,06 kB · 620,20 kB — **el inicial sube 4,78 kB**, `app-icons` **no se mueve** |
| `pnpm vitest run src/features/vida/utils/vida-goals.utils.test.ts` | 13 de 13 | — |
| `pnpm vitest run src/features/vida/pages/VidaHoyPage.test.tsx` | 152 de 152 (eran 140) | — |

**Lo que se vio de verdad, y cómo**: `/app/vida/hoy` está detrás del login, así
que el arco se miró con un **arnés temporal** (`harness-goal-arc.html` +
`src/harness-goal-arc.tsx`) servido por Vite, a **375 px**, con los cuatro
estados: en marcha con «sin dato», pasada la jornada, cero minutos y día pasado.
Medido en el DOM: `scrollWidth === clientWidth === 375` (**sin scroll
horizontal**) y **cero** `[role="alert"]` en la página. Se miró en **oscuro y en
claro**. El arnés **está borrado** (`git status` lo confirma).

**Criterios, uno por uno:**

- **489** ✔ El arco se pinta y va **entre** el presupuesto y la agenda, afirmado
  con `compareDocumentPosition` en `VidaHoyPage.test.tsx`. La forma es la del
  render: semicírculo con la hora dentro, visto en el arnés.
- **490** ✔ Suma solo las sesiones cuya categoría apunta a la meta; una categoría
  sin meta no suma (caso propio). **Ningún documento GraphQL nuevo**: el único
  hook nuevo en la pantalla es `useActivityCategoriesQuery`, que ya existía.
- **491** ✔ La sesión abierta suma su minuto vivo: «1h 24» a las 9:24 y «1h 25»
  tras `advanceTimersByTime(60_000)`, sin volver a montar nada.
- **492** ✔ «Llevas 1 h. A este ritmo paras a las 16:24.» — una hora, no una
  resta. En el `utils`, `stopAtTime === '16:05'` con 220 min a las 11:45.
- **493** ✔ «Llevas 9 h 10 min. Pasaste las 8 h a las 17:00.» Sin `role="alert"`
  dentro del arco (afirmado), sin clase de `Alert`, y sin ninguna de las palabras
  de reproche de la lista del módulo. El color del trazo es el de la meta, el
  mismo antes y después de pasar la jornada: no hay ámbar ni rojo en el componente.
- **494** ✔ «2 h 40 min sin dato hoy.» en su línea bajo el arco; con una sesión
  de «Casa» —categoría sin meta— **no** aparece esa línea.
- **495** ✔ Con cero minutos, el arco se pinta vacío y dice «Si arrancas ahora,
  acabarías a las 17:24.» (D-C, en condicional).
- **496** ✔ En `?d=2026-09-19` no hay arco.
- **497** ✔ En `?d=2026-09-17`: «Registraste 5 h de Trabajo.», sin «A este ritmo»
  —`stopAtTime` es `null`— y con «40 min sin dato ese día.». **Ver la desviación
  del verbo, arriba.**
- **498** ⚠ **No comprobado de punta a punta desde aquí.** Lo que sí está
  comprobado: el cálculo sale **solo** del catálogo y de las sesiones, no hay
  ningún total guardado por día, y la mutación de la tajada 1 ya invalida
  `vidaKeys.categories.list()`. Quitarle el puntero a una categoría y ver bajar
  el arco **de un día pasado** pide sesión: queda como prueba a mano (pasos
  abajo).
- **499** ✔ A 375 px, `scrollWidth === clientWidth` con la frase más larga (la de
  «Pasaste las 8 h a las 17:00.») y con la de «sin dato». Con el catálogo caído,
  el arco no aparece **y** el aviso del día no se inventa una línea; con una
  consulta del día caída, sale el aviso de siempre y tampoco hay arco. Dos casos.

**Lo que queda a mano (detrás del login, con la tajada 1 del API desplegada):**

1. Entrar en `/app/vida/hoy` con al menos una categoría marcada como trabajo y
   comprobar que el arco aparece bajo el presupuesto, con la hora correcta.
2. Empezar una sesión de esa categoría y esperar un minuto: la cifra sube sola.
3. Abrir un día pasado en la tira (`?d=`) y comprobar «Registraste …», sin la
   línea de «a este ritmo».
4. **Criterio 498:** con el arco de ayer a la vista, quitarle en Ajustes →
   Categorías la casilla «Esto es trabajo» a esa categoría y volver: el arco de
   **ese día pasado** tiene que bajar sin recargar la página.
5. En el móvil de verdad, a 375 px, mirar que nada se sale de ancho.

**Lo que descubrí y no estaba en el plan** (anotado, **no tocado**):

- **El backend desplegado todavía no trae `goal`.** La tajada 1 del API está
  escrita y sin subir, así que hoy el catálogo llega sin ese campo y `goal` es
  `undefined` → `buildGoalArcs` no produce ningún arco y Hoy queda exactamente
  como estaba. Es el comportamiento correcto mientras tanto, pero **significa que
  nada de esta tajada se ve vivo hasta que el usuario haga el push del API**.
- **`VidaHoyPage.tsx` pasa de 1.050 líneas.** No es de esta tajada arreglarlo,
  pero el siguiente que añada un bloque ahí se va a encontrar con que el `return`
  de la página ya no cabe en una pantalla.
- **El render 18 dibuja el trazo en `#38bdf8` y la meta nace con `#0284c7`** (el
  azul núcleo de la paleta, decisión de la tajada 1). El componente usa **el
  color de la meta**, así que en oscuro el arco se ve un punto más apagado que el
  render. Si molesta, es un cambio de una línea **en el dato**, no en el código.

**Estado del árbol:** sin commitear, sin push. El arnés temporal, borrado.
`graphify update .` corrido tras el cambio. **El repositorio del API no se tocó
en esta tajada.**

### Tajada 3 — La pregunta

**Resumen para quien revise:** cuando **ninguna** categoría apunta a una meta,
en el sitio exacto del arco (bajo `VidaDayBudget`, sobre la agenda) aparece la
pregunta del render 15, momento 8 —«¿Cuál de estas es tu trabajo?», las
categorías en píldoras con su icono, y «Ahora no»—; un toque escribe el puntero
con **la misma mutación de la casilla** y el arco sale ahí mismo sin recargar.
De paso se cierran las **dos deudas** de la revisión de la tajada 2: la frase del
arco se lee **una sola vez** (el SVG pasa a decorativo y el `<p>` a
«solo lectores de pantalla») y el catálogo **ya tiene estado de carga**.
**Lo que más probablemente rompí:** el localizador del arco en los tests —era
`getByRole('img', {name:/Trabajo/})` y ahora es `getByRole('article', {name:
'Trabajo'})`—, y el hueco nuevo en `styles.main` de Hoy, que mete un tercer
elemento (esqueleto / pregunta / arco) entre el presupuesto y la agenda.

**Qué se construyó:**

- **`src/features/vida/components/VidaGoalPrompt/`** (nuevo: `VidaGoalPrompt.tsx`,
  `VidaGoalPrompt.module.scss`, `index.ts`). Tonto y del reparto de
  `VidaBlockOutcomes`: recibe `{ categories, onPick, isBusy }`, ordena por
  `orderIndex` y luego nombre (el orden de Ajustes → Categorías) y pinta una
  píldora por categoría con su icono (`AppIcon`, `circle-dot` de repuesto). Con
  el catálogo **vacío devuelve `null`** (criterio 503). El texto y la forma
  salen del render 15, momento 8 (`docs/vida/assets/15-vida-barra-de-trabajo.html:280-301`):
  la pregunta, la línea de qué gana el usuario, las píldoras y el «Ahora no».
  **Del 15 solo se toma la pregunta**; el gráfico vigente es el arco del 18.
- **`src/features/vida/pages/VidaHoyPage.tsx`** — tres cosas en el mismo sitio
  donde ya estaba el arco (anclado al elemento `<VidaDayBudget/>`, no a un
  número de línea):
  1. `useSetActivityCategoryGoalMutation()` en la página, con
     `onPick = (categoryId) => mutate({ categoryId, attached: true })`. **La
     misma mutación de la tajada 1** —el servidor crea «Trabajo, 8 h» si no hay
     meta— y **ninguna invalidación nueva**: el `onSuccess` del hook ya invalida
     `vidaKeys.categories.list()`.
  2. La rama `goalArcs.arcs.length === 0` → `VidaGoalPrompt` (criterio 500), que
     antes no pintaba nada.
  3. **El estado de carga del catálogo**: `categoriesLoading = isPending &&
     fetchStatus !== 'idle'` (el idioma de `useVidaDayData.ts:71-78`, donde
     `idle` + `isPending` es «deshabilitada», no «cargando») → un `Skeleton` de
     176 px en el hueco.
- **`src/features/vida/pages/VidaHoyPage.module.scss`** — `.goalLoading`, la
  caja del esqueleto.
- **`src/features/vida/components/VidaGoalArc/VidaGoalArc.tsx` y su
  `.module.scss`** — la deuda 1 de la revisión anterior: el `<svg>` pierde
  `role="img"` y su `aria-label` y pasa a `aria-hidden`; el `<p>` de la frase
  pasa de visible a **`.srLine`** (la clase de «solo lectores de pantalla» del
  módulo, la misma receta que `VidaReviewRow`). El margen negativo de `.arc`
  (`-0.9rem`), que existía para compensar el margen superior de ese `<p>`,
  vuelve a `0`.
- **`src/features/vida/pages/VidaHoyPage.test.tsx`** — ocho casos nuevos
  (500, 501, 502 ×2, 503, carga, «Ahora no», botones inhabilitados), el
  localizador del arco movido y el caso «la tajada 3 aún no existe» reescrito:
  ahora afirma que ahí va la pregunta.

**Por qué así, y qué se descartó:**

- **La doble lectura, resuelta hacia el render y no hacia el DOM.** Tres salidas
  posibles: (a) quitar el `<p>` visible y quedarse con el `aria-label`; (b)
  quitar el `aria-label` y dejar el `<p>` a la vista; (c) **SVG decorativo + el
  `<p>` en texto real pero oculto a la vista**. Elegida la (c). La (a) deja la
  frase sin texto real: `getByText` no entra en un `<text>` de SVG y el
  criterio 493 se quedaría sin nada que comprobar en el DOM. La (b) deja a la
  vista una frase que el arco **ya dice dentro** (la hora a 32 px y su rótulo) y
  que el render 18 panel 1 no tiene. La (c) deja la pantalla clavada al render,
  la frase entera para quien la oye, y el criterio 493 comprobable. **Coste,
  dicho sin adornos:** los tests ya no pueden encontrar el arco por el
  `role="img"`, así que el localizador se movió con la estructura accesible —es
  lo que la revisión de la tajada 2 avisó que habría que hacer— y ahora el
  ancla es el `<article aria-labelledby>`, que ya existía y no se inventó para
  el test.
- **El estado de carga dejó de ser cosmético y por eso entra aquí.** Sin él, el
  primer viaje del día trae `categories = []`, de ahí salen cero arcos y con
  esta tajada eso ya no es «no pintar nada»: es **enseñar la pregunta a quien ya
  marcó su categoría** y cambiarla por el arco un instante después. El esqueleto
  arregla a la vez ese parpadeo y el salto que empujaba la agenda (hallazgo
  «Carga» de la revisión de la tajada 2). Sale barato porque `Skeleton` ya
  existe y la página ya lo usa.
- **La pregunta vive en el mismo hueco que el arco, también en un día pasado.**
  El criterio 500 dice «en el lugar donde iría el arco» y no distingue día; la
  guarda `(isToday || isPast)` que ya estaba se reutiliza tal cual. En un día
  **futuro** no hay hueco, así que tampoco hay pregunta.
- **Nada de una bandera de «ya preguntado».** El criterio 502 —«una vez que al
  menos una categoría apunta a la meta, la pregunta no vuelve a aparecer en
  ningún día»— lo garantiza **el dato**: en cuanto hay un arco, la rama de la
  pregunta no se evalúa. Ni `localStorage`, ni ajuste, ni columna.
- **Es el único sitio del front que dice «trabajo» a pelo**, y es a propósito:
  ahí todavía **no existe** ninguna meta de la que leer el nombre. El arco, que
  sí la tiene, sigue genérico (ni «Trabajo» ni 480 dentro del componente).

**A juicio del revisor — un estado que ningún render dibuja:**

- **Qué hace «Ahora no» después de tocarlo.** El render 15 lo dibuja pero no
  dibuja el después, y no hay criterio que lo mande. **Decidido lo mínimo que no
  inventa un dato: aparta la pregunta de esta visita** (un `useState` en el
  componente, como el `isWriting` de `VidaBlockOutcomes`), sin guardar nada en
  el aparato ni en el servidor, así que vuelve al recargar o al día siguiente.
  Las alternativas —callarla ese día, o para siempre— piden un sitio donde
  guardarlo (`localStorage` o un ajuste del usuario) y eso **nadie lo decidió**:
  queda como pregunta para el usuario, en una línea. Si dice «que no vuelva en
  todo el día», es la llave del `vida-device-notes.store` y cinco líneas.

**Verificación (comandos y salidas literales):**

| Qué | Resultado | Línea base |
|---|---|---|
| `pnpm typecheck` | exit 0, sin salida | limpio ✔ |
| `pnpm lint` | `✖ 14 problems (14 errors, 0 warnings)` | 14/0 ✔ |
| `pnpm test` | `Test Files  1 failed \| 114 passed (115)` · `Tests  2 failed \| 1818 passed (1820)` — los dos de `SearchSelect`; el flaky de `IconPicker` no salió | 2 de 1812 ✔ (1812 + 8 casos nuevos = 1820) |
| `pnpm build` | exit 0 · inicial **1.121,29 kB** · `app-icons` **620,20 kB** · `IconPicker` 4,64 kB | 1.119,84 kB → **+1,45 kB** de código propio (el componente nuevo y el cableado); `app-icons` **sin mover**, que es lo que importa ✔ |
| `npx vitest run src/features/vida/pages/VidaHoyPage.test.tsx` | `Tests 160 passed (160)` | — |

**En el navegador** (arnés temporal `src/harness-goal-prompt.tsx` +
`harness-goal-prompt.html`, **ya borrados**; servidor de Vite arrancado por el
agente en el 5173 porque el del usuario estaba apagado, a 375×812):

- La pregunta se ve como el render: caja de borde punteado, la pregunta, la
  línea de qué gana, las píldoras con icono y «Ahora no» centrado debajo.
- **Sin scroll horizontal a 375 px:** `document.documentElement.scrollWidth`
  **375** = `clientWidth` **375**, también con una categoría de nombre absurdo
  («Consultoría de sistemas distribuidos y plataformas»), que **envuelve dentro
  de la píldora** en vez de estirarla (`overflow-wrap: anywhere`).
- **Catálogo vacío:** el `<div id="vacio">` queda literalmente en blanco
  (`innerHTML === ''`). Ni botones vacíos, ni error, ni caja.
- **El arco, tras el arreglo:** `viewBox="0 0 220 124"` con `role → null` y
  `aria-hidden → "true"`; el `<p>` de la frase mide **1×1 px** y sigue en el
  DOM con «Llevas 3 h 40 min. A este ritmo paras a las 16:00.»; `[role=alert]`
  dentro del arco: **0**. Entre el borde inferior del SVG y el de la tarjeta
  quedan **13 px** (el `padding` de siempre): quitar el margen negativo no dejó
  los topes «0h»/«8h» pegados al borde.

**Criterios que cierra:**

- **500 ✔** `criterio 500 — la pregunta ocupa el sitio del arco, con las
  categorías en botones`: con dos categorías sin meta, la pregunta aparece con
  un botón por categoría, y su sitio se afirma **por posición**
  (`compareDocumentPosition` contra el `<section>` del presupuesto y contra la
  primera fila del plan), no con un `toBeInTheDocument`.
- **501 ✔ (en test; a mano, paso 2 del usuario)** `criterio 501 — un toque
  escribe el puntero y el arco aparece sin recargar`: el clic llama **una vez**
  a `mutate({ categoryId: 'cat-trabajo', attached: true })` —la misma forma que
  usa la casilla del formulario, sin `goalId`, que es lo que hace que el
  servidor cree la meta— y, cuando el catálogo vuelve con la meta dentro, **la
  misma página ya montada** (`rerender`, sin desmontar) pinta el arco con
  «Llevas 1 h. A este ritmo paras a las 16:24.» y la pregunta desaparece.
- **502 ✔** dos casos: `ni navegación, ni formulario, ni confirmación` (tras el
  toque no hay ningún `role="dialog"`, la agenda sigue en su sitio y la mutación
  se llamó una sola vez) y `con una categoría ya apuntada la pregunta no vuelve
  en ningún día` (hoy y un día pasado, `?d=2026-09-17`).
- **503 ✔** `con el catálogo vacío no hay botones vacíos ni error`, más la
  comprobación en el navegador de arriba.
- **Las dos deudas de la revisión de la tajada 2**, que no son criterios pero se
  cerraron: una sola lectura de la frase, y el estado de carga del arco.

**Lo que NO se puede comprobar desde aquí** (queda como prueba a mano, sin
disimulo): el recorrido real está **detrás del login**. No se ha visto la
pregunta con el catálogo de verdad, ni el arco apareciendo tras el toque contra
la API desplegada, ni los 375 px en el teléfono del usuario. Los pasos están al
final del resumen.

**Riesgos (lo que esto pudo romper):**

1. **El localizador del arco.** Cualquier test o herramienta que buscara el arco
   por `role="img"` ya no lo encuentra. En el repositorio solo lo hacía
   `VidaHoyPage.test.tsx` (buscado `role="img"` en `src/features/vida/`), y se
   movió; si alguien tiene una rama con otro, ahí está el motivo.
2. **El hueco entre el presupuesto y la agenda** cambia de un elemento a tres
   posibles. Los anclajes por posición del test de Hoy siguen en verde (160/160),
   pero es el sitio donde FEAT-010 también está trabajando.
3. **El margen negativo del arco.** Se quitó porque su pareja (el margen
   superior del `<p>`) desapareció. Si alguien devuelve el `<p>` a la vista sin
   devolver el margen, los topes «0h»/«8h» se pegarán a la frase.
4. **`VidaGoalPrompt` monta `AppIcon` una vez por categoría.** El catálogo está
   topado (`CATALOG_LIMIT`) y los iconos entran por el registro diferido, así
   que no toca el arranque: `app-icons` sigue en **620,20 kB** exactos.

**Lo que descubrí y no toqué (fuera de alcance):**

- **`VidaArchivadasPage.test.tsx:43-45` mockea el módulo `useActivityCategories`
  con **una sola** exportación** (`useActivityCategoriesQuery`). No es la trampa
  que avisa el `ENVIRONMENT.md` —esa es la del mock que pasa **en verde por
  casualidad**—: esta pantalla usa solo ese hook y, si algún día usara otro,
  fallaría a gritos. No se tocó porque esta tajada **no cambia la forma de
  ninguna mutación**. Los otros cinco mocks del módulo (`VidaActivitySheet`,
  `VidaCategoriasPage`, `VidaActividadesPage`, `VidaPlantillaPage`,
  `VidaHoyPage`) sí listan las seis exportaciones.
- **El chunk inicial creció 1,45 kB.** Es el código nuevo, no un barril mal
  importado; el troceado sigue siendo deuda propia del proyecto.

**Estado del árbol:** sin commitear, sin push. Los dos archivos del arnés,
borrados (`git status --porcelain` no los lista). `graphify update .` corrido
tras el cambio. **El repositorio del API no se tocó.** Queda arrancado un
servidor de Vite en el **5173** (el del usuario estaba apagado y no tengo
herramienta para pararlo).

## 4. Revisión — feature-reviewer

*(una entrada por tajada)*

### Tajada 1 — devuelta

**Veredicto: devuelta.** No por lo construido —el servicio, la migración y la
casilla están bien— sino por **la ruta que estrena la feature y que nadie
comprueba**: crear una categoría con la casilla marcada. No queda ni un test
que afirme que salen las dos mutaciones en orden, y detrás del login yo no
puedo verlo. La salida barata existía y está señalada abajo.

**Criterios, uno a uno** (contra la sección 1):

- **481 — cumple.** `migrations/069_vida_goals.sql`: `vida_goals` con `name`,
  `icon`, `color`, `target_minutes`, `order_index`, `slug`, `CHECK
  (target_minutes > 0 AND <= 1440)` y `UNIQUE (user_id, slug)`. Leído el SQL,
  no la prosa.
- **482 — cumple.** `goal_id UUID REFERENCES vida_goals(id) ON DELETE SET
  NULL`, nullable, **sin `UNIQUE` en la columna**: dos categorías pueden
  apuntar a la misma meta. Índice parcial `WHERE goal_id IS NOT NULL`.
- **483 — cumple.** Los minutos viven solo en `vida_goals.target_minutes`.
  `git status` del API no lista ningún archivo de `user_settings`; el diff de
  `activity_categories` es el puntero y nada más.
- **484 — cumple en el camino de editar; sin comprobar en el de crear.** El
  servicio está bien (ver «la carrera»); `VidaCategoriasPage.test.tsx` prueba
  el camino de editar mandando `{ categoryId, attached: true }` **sin
  `goalId`**. El camino de **crear** —que el propio criterio nombra («desde la
  casilla del formulario»)— no tiene test y no es verificable desde fuera del
  login. Esta es la razón de la devolución.
- **485 — cumple.** Los dos archivos, `Checkbox` con `label` + `description` +
  `aria-describedby` (`src/shared/ui/Checkbox/Checkbox.tsx`). Es casilla, no
  lista. Probado en `VidaCategoriasPage.test.tsx` y en
  `VidaActivitySheet.test.tsx:212`.
- **486 — cumple.** Un clic en la casilla, un clic en «Guardar», ninguna
  pantalla intermedia; la segunda mutación solo sale si la casilla cambió
  (`goalChanged`). Con test propio y con el de desmarcar.
- **487 — cumple.** `activity-categories.graphql.ts`: +64 líneas, **ningún
  documento de consulta nuevo**; el único documento nuevo es
  `ACTIVITY_CATEGORY_GOAL_SET_MUTATION`, y está en la lista literal de
  `contracts.test.ts`.
- **488 — cumple en tests, y la parte de red queda pendiente a mano, que es
  correcto.** Las suites de `VidaActividadesPage`, `VidaArchivadasPage`,
  `VidaActivitySheet` y `VidaCategoriasPage` pasan solo con la fixture
  crecida. Dos matices que el constructor no dice: (a) el orden de despliegue
  no es una recomendación, es parte del criterio —entre el front nuevo y el
  API viejo, esas tres pantallas se quedan **sin catálogo**—; (b) dos mocks
  quedaron incompletos (abajo).

**La carrera — las tres cosas, verificadas en el SQL y en el servicio:**

1. **Índice único: existe de verdad.** `CONSTRAINT vida_goals_user_slug_unique
   UNIQUE (user_id, slug)` en la tabla, no solo en el comentario.
2. **`DO UPDATE`, no `DO NOTHING`.** `ON CONFLICT (user_id, slug) DO UPDATE SET
   name = vida_goals.name RETURNING *` (`vida-goal.service.ts:78-84`): con
   conflicto devuelve y bloquea la fila existente, que es justo lo que
   `DO NOTHING` no hace.
3. **Una sola transacción.** `BEGIN` → `ensureDefaultGoal` → `UPDATE
   activity_categories SET goal_id …` → `COMMIT`, sobre el mismo `client`
   (`setCategoryGoal`). Busqué caminos que escriban el puntero fuera:
   `grep -rn "goal_id" src/` en el API da **una sola** escritura, la de dentro
   de la transacción; `createCategory` y `updateCategory` no lo tocan y usan
   `RETURNING *`, así que el campo viaja sin modificarlos.
4. **Si el `UPDATE` falla, la meta se revierte.** El `throw` cae en el `catch`
   que hace `ROLLBACK` antes de relanzar, y el `ensure` iba dentro: no queda
   meta huérfana. Probado en `vida-goal.service.test.ts` → «rolls back and
   releases when the pointer update matches no row».
   Lo que **no** está comprobado y solo se ve contra Postgres es que dos
   sesiones concurrentes no dejen dos filas: queda como paso a mano.

**El hueco que el constructor declara — por qué devuelve:**

Lo que queda probado del camino de crear es la casilla *pintada* y el caso
**sin marcar** (`VidaActivitySheet.test.tsx:229`,
`expect(setCategoryGoal.mutateAsync).not.toHaveBeenCalled()`). No queda **nada**
afirmando el caso marcado. Y había salida: ese mismo test —«+ nueva» crea la
categoría…, que **pasa hoy**— ya monta el paso apilado, ya paga la carga
diferida del `IconPicker`, ya encuentra la casilla por su rol y ya pulsa «Crear
categoría» esperando la cadena `async`. Marcar la casilla antes del clic y
añadir una afirmación no añade ni un render ni una carga: no es el caso que se
pasaba de tiempo. Lo que se pasaba de tiempo era **un caso nuevo** que repetía
el montaje entero; no es lo mismo, y por eso no acepto que no hubiera salida.
Alternativas, por si se prefiere otra: un test propio de
`CreateVidaCategoryStep` aislado (hoy no existe ninguno en su carpeta), o
`vi.mock('@/shared/ui/IconPicker')` en ese archivo.

Importa además porque la ruta sin red no es trivial: decide **el orden** de las
dos llamadas, y decide **tragarse el error del segundo viaje y cerrar el paso
igual**. Eso es una decisión de producto sin un solo test que la sujete.

**`mutate` → `mutateAsync`: qué quedó suelto.**
`grep -rn "useCreateActivityCategoryMutation\|useSetActivityCategoryGoalMutation" src/`
da dos mocks incompletos que **hoy pasan por casualidad**, porque ninguna de
esas dos suites llega a abrir «+ nueva» (comprobado: cero apariciones de
`'+ nueva'` en ambos archivos):

- `src/features/vida/pages/VidaActividadesPage.test.tsx:28-29 y 43-46` —
  `buildMutation()` devuelve `{ mutate, reset, isPending, isError }`, **sin
  `mutateAsync`**, y el mock del módulo **no incluye**
  `useSetActivityCategoryGoalMutation`. Esa página monta `VidaActivitySheet`:
  el día que un test de ahí abra el paso de crear, revienta con «no es una
  función».
- `src/features/vida/pages/VidaPlantillaPage.test.tsx:76` — el mismo mock a
  medias (`mutate: vi.fn()`), también sin `useSetActivityCategoryGoalMutation`.

Los dos son trampas puestas, no fallos de hoy. Se arreglan en dos líneas y van
en la devolución.

**Caso de error del segundo viaje.** Recuperable y no silencioso en los dos
formularios: `useSetActivityCategoryGoalMutation` tiene `onError` con
`toast.error('No pudimos guardar la meta de la categoría')`. Al **editar**, el
`catch` deja el modal abierto con lo escrito. Al **crear**, el paso se cierra y
la categoría queda creada y sin marcar —lo que el plan acepta—, con el toast
encima; se recupera desde la casilla de editar. Sin toast de éxito propio: de
acuerdo, el de «Categoría actualizada» ya suena.

**Que la pantalla no limite a una meta.** El test con dos metas que pidió el
arquitecto es de `vida-goals.utils.test.ts`, que es de **la tajada 2**: aquí no
se puede exigir todavía, y se exige al revisar esa. En lo de esta tajada no hay
ningún tope escondido: la casilla no lee ninguna lista de metas ni indexa un
`goals[0]`; manda `{ categoryId, attached }` sin `goalId` y el servidor decide.
El campo se llama `isWork` en `VidaCategoryFormValues` y no `goalId`, con el
porqué escrito encima: cuando haya varias, el campo pasa a lista sin tocar el
API. No hay `slice(0, 1)` en ninguna parte del diff.

**`setCategoryGoal` con `getCategoryById` público.** Me parece bien y no lo
devuelvo: son dos lecturas de más en una acción rara, a cambio de no exportar
internos ni duplicar el mapper, y la comprobación de propiedad se repite
**dentro** de la transacción (`AND user_id` + filas afectadas), que es lo que
de verdad importa. La salida mejor que no se vio, por si se recoge alguna vez:
el `UPDATE` ya podría hacer `RETURNING *` y `activity-category.service.ts`
exportar solo su `mapCategory` —una función pura, no un interno peligroso—;
eso ahorraría **las dos** consultas y, de paso, la lectura de después del
`COMMIT`, que hoy ocurre fuera de la transacción.

**Qué más miré cerca, y cómo.** `graphify explain "CreateVidaCategoryStep"` (da
sus tres llamadas: `useModalStep`, `useCreateActivityCategoryMutation`,
`useSetActivityCategoryGoalMutation`) y `graphify query "who uses
ActivityCategory type and the activity categories catalog"` para los
consumidores del tipo; confirmado abriendo los archivos. En el API, que no
tiene grafo, `grep -rn "goal_id|goalId|vida_goals" src/`. Las dos líneas base
reproducidas enteras: front `typecheck` limpio, `lint` **14/0**, `test` **2
fallos de 1788** (los dos de `SearchSelect`; el `IconPicker` flaky no salió),
`build` exit 0 con chunk inicial **1.115,06 kB** y `app-icons` **620,20 kB sin
mover**; API `tsc --noEmit` exit 0 y `npm test` **3 fallos de 574, 6 suites de
52 en rojo**, las mismas seis de la línea base, con `vida-goal.service.test.ts`
en verde. Ninguna regresión medible: la única que encontré es la de los dos
mocks incompletos, que es de red de seguridad, no de comportamiento.

**Estados que nadie construye.** Vacío, carga y error no cambian: los dos
formularios ya los tenían y la casilla no depende de ningún dato que pueda
faltar (`Boolean(category.goalId)`). Permisos no aplica en el front (un solo
usuario) y en el API está cubierto por partida doble. **Texto largo** no
aplica: la etiqueta y su línea son fijas. **Móvil a 375 px**: no lo pude
comprobar —el formulario vive detrás del login y no monté arnés—, pero el
`Checkbox` es el compartido y ya se usa en formularios del mismo ancho; queda
como **no revisado**, no como aprobado.

**¿Duplica algo que ya existía?** No, contra la sección 2: ningún documento de
consulta nuevo, ninguna función de invalidación nueva (reusa
`invalidateActivityCategoryQueries`), ninguna Query `vidaGoals` ni hook de
metas en el API, nada en `user_settings`, ningún `.module.scss` nuevo (usa el
`Checkbox` compartido) y ningún formateador nuevo. El `.refine` de
`activity.schemas.ts` sigue sin tocarse, como manda el plan.

**Lo que hay que hacer para que pase** (nada más que esto):

1. Un test del encadenado crear → apuntar: marcar la casilla dentro del caso
   «+ nueva» que ya existe en `VidaActivitySheet.test.tsx` y afirmar que
   `setCategoryGoal.mutateAsync` se llama **una vez**, con
   `{ categoryId: 'plantas', attached: true }`, **después** de
   `createCategory.mutateAsync`.
2. Completar los dos mocks a medias: `mutateAsync` en el `buildMutation()` de
   `VidaActividadesPage.test.tsx` y `useSetActivityCategoryGoalMutation` en el
   mock del módulo de ese archivo y de `VidaPlantillaPage.test.tsx`.

Nada del API hay que tocar.

### Tajada 1 — segunda vuelta: aceptada

**Veredicto: aceptada.** Lo devuelto está arreglado y el arreglo no rompió
nada. Reviso **solo** eso y lo que pueda haberse llevado por delante; el resto
—la carrera en sus tres piezas, el error recuperable, que no haya tope a una
sola meta— quedó bueno en la primera vuelta y esta vuelta no lo toca (el árbol
del API está intacto: mismos once archivos, `git diff --stat` idéntico y los
tres nuevos con el mismo `md5`).

**1. El encadenado, ahora con red.** Dentro del caso «+ nueva» que ya existía
(`VidaActivitySheet.test.tsx`): se marca la casilla antes de «Crear categoría»
y se afirma `setCategoryGoal.mutateAsync` **una vez**, con
`{ categoryId: 'plantas', attached: true }`, y **después** de
`createCategory.mutateAsync` vía `mock.invocationCallOrder`. No es una
afirmación hueca: el `categoryId` sale del `mockResolvedValue({ id: 'plantas' })`
del **primer** viaje, así que lo que se prueba es que el id del uno alimenta al
otro, que es justo lo que no se podía hacer en una sola llamada.

**2. Que la aserción de orden sea de orden.** Comprobado a mano, no razonado:
sonda temporal con dos `vi.fn()` (creada, corrida y **borrada**;
`src/__rev_order_probe.test.ts` ya no existe). `toBeGreaterThan` sobre
`invocationCallOrder` **lanza** en los dos casos malos —llamadas invertidas, y
segunda llamada ausente (el índice queda `undefined`)— y solo pasa en el orden
correcto. La regresión que importa la caza: si alguien quitara el `if (isWork)`
o el `await`, el caso cae.

**3. Cobertura cambiada, no sumada — y hay que decirlo con precisión.** El
`expect(setCategoryGoal.mutateAsync).not.toHaveBeenCalled()` que vivía en ese
caso **se fue**, y lo que hay en `VidaCategoriasPage.test.tsx:160` **no es el
mismo camino**: es el formulario de **editar** (la guarda `goalChanged`), no la
rama falsa del `if (isWork)` de `CreateVidaCategoryStep`. O sea: crear una
categoría **sin** marcar la casilla y que el puntero no viaje ya no lo prueba
nadie. **No devuelvo por esto** —la rama positiva vale más que la negativa, el
estado nace en `false` y está cableado a la casilla, y un tercer caso pagaría
otra vez el montaje entero que fue el problema de origen—, pero queda escrito
como hallazgo: si algún día se quita ese `if`, toda categoría nueva nacería
marcada como trabajo y ninguna suite se enteraría.

**4. Los mocks a medias, y si quedaba un tercero.** Completados los dos:
`VidaActividadesPage.test.tsx` (`buildMutation()` con `mutateAsync` y
`useSetActivityCategoryGoalMutation` en el mock del módulo) y
`VidaPlantillaPage.test.tsx` (los dos hooks con `mutateAsync`). Busqué el
tercero: `grep -rn "vi.mock('@/features/vida/hooks/useActivityCategories'"
src/` da **cinco** archivos. Tres ya estaban bien y el quinto,
`VidaArchivadasPage.test.tsx`, mocka **solo** `useActivityCategoriesQuery` — y
está bien así: esa página no monta `VidaActivitySheet` (las dos únicas que lo
montan son Actividades y Plantilla, comprobado en el `.tsx` de cada una), así
que no tiene ninguna mutación que doblar. **No queda ninguno con la forma
vieja.**

**Líneas base, reproducidas las dos.** Front: `typecheck` exit 0 · `lint`
**14 errores / 0 warnings** · `test` **2 fallos de 1788** (`SearchSelect >
filters options by search query` y `SearchSelect > selects an option`; el flaky
del `IconPicker` no salió) · `build` exit 0, chunk inicial **1.115,06 kB**,
`app-icons` **620,20 kB**. Y la mirada que pedía el artefacto: no es que las
cifras coincidan, es que **los hashes son los mismos** que la primera vuelta
(`index-VIzbn6Ne.js`, `app-icons-C_2IJqUq.js`, `IconPicker-COcHAhsf.js`,
`index-jJlQAt8W.css`). Vite nombra por contenido: bit a bit, lo que se
desplegaría es idéntico. Es exactamente lo que debe pasar tocando solo tests, y
es la prueba de que el arreglo no se coló en el paquete. API: `npx tsc
--noEmit` exit 0 · `npm test` **3 fallos de 574 y 6 suites de 52 en rojo**, las
mismas de la línea base.

**Criterios 481–488: cumplidos.** Los de la primera vuelta siguen igual; el 484
y el 486 ganan ahora el camino de **crear**, que era lo que faltaba. Queda
pendiente a mano, como siempre estuvo y sin disimulo: el recorrido real detrás
del login y la prueba de la carrera contra Postgres.

**Lo que no revisé.** A 375 px sigue **sin revisar** (formulario tras el login,
no monté arnés). Y el `RETURNING *` + exportar `mapCategory` queda anotado sin
implementar, por orden del coordinador: no lo reclamo aquí.

**Nota que no es mía:** `docs/features/ENVIRONMENT.md` aparece modificado en el
árbol con un párrafo nuevo sobre los mocks de módulo de `useActivityCategories`.
**No lo escribí yo** —el revisor no toca ese archivo—; lo digo para que conste
quién lo cambió y que el cambio es correcto.

**Para el usuario — el orden es obligado, no una recomendación:**

1. **Commit y push del API** (`~/Developer/xavi-platform-node`). Ese push
   despliega **Cloud Run y Render a la vez**, y arrastra la migración **068 de
   FEAT-012**, que sigue sin correr, además de la **069** de esta tajada.
2. **Correr a mano contra Neon la 068 y la 069**, en ese orden. Render no migra
   al arrancar (`RUN_MIGRATIONS: 'false'`), así que nadie lo hace por ti.
3. **Solo entonces, el front.** El catálogo nuevo pide `goalId` y `goal`:
   contra un backend viejo, `activityCategories` falla entera y **Categorías,
   Actividades y la hoja de actividad se quedan sin catálogo**. No hay
   degradación suave.
4. En **Ajustes → Categorías**, editar una categoría, marcar «Esto es trabajo»,
   guardar; reabrirla y ver la casilla marcada. Desmarcar y repetir.
5. Crear una categoría desde la hoja de actividad («+ nueva») **con la casilla
   marcada** y comprobar, al editarla, que llega marcada.
6. **La prueba de la carrera:** marcar dos categorías distintas casi a la vez,
   en dos pestañas, y comprobar en la base que hay **una sola** fila en
   `vida_goals` con `slug = 'work'`.

Todavía **no hay arco**: eso es la tajada 2. Lo que esta tajada te deja hacer
es marcar tus categorías de trabajo para que, cuando llegue, ya tengan historia.

### Tajada 2 — aceptada

**Cómo se revisó.** Grafo primero (`graphify explain "VidaHoyPage"`,
`"useVidaDayData"`, `"buildCategoryBreakdown"`, `"toSessionSpans"`) para saber
**quién dependía de lo tocado antes del cambio**, y después el árbol: `git
status --porcelain` (solo los cinco archivos de la tajada), `git diff` de
`VidaHoyPage.tsx` y de su test, y lectura entera de `vida-goals.utils.ts`, de
los dos componentes y del `.module.scss`. Las cuatro comprobaciones se
reprodujeron enteras.

**Líneas base, reproducidas aquí:**

| Qué | Resultado | Línea base |
|---|---|---|
| `pnpm typecheck` | exit 0, limpio | limpio ✔ |
| `pnpm lint` | **14 errores / 0 warnings** | 14/0 ✔ |
| `pnpm test` | **2 fallos de 1812** (`SearchSelect` ×2) | 2 de 1812 ✔ — el tercero de `IconPicker` **no salió** en esta corrida |
| `pnpm build` | exit 0 · inicial **1.119,84 kB** · `app-icons` **620,20 kB** · `IconPicker` 4,64 kB | idénticas a las del constructor ✔ |

**Criterios, uno por uno (contra la sección 1, no contra el resumen):**

- **489 ✔** El arco es el del render 18 panel 1: mismo `viewBox="0 0 220 124"`,
  mismo `path d="M22 106 A 88 88 0 0 1 198 106"` doblado (pista y trazo),
  `pathLength="100"`, la hora a 32 px dentro y los topes `0h`/`8h`. Su sitio se
  afirma con `compareDocumentPosition` contra el `<section>` del presupuesto y
  contra la primera fila del plan, no con un `toBeInTheDocument`.
- **490 ✔** `buildGoalArcs` cruza las sesiones del día con el catálogo por
  `category.id`; una categoría sin meta no suma (caso propio). **Ningún
  documento GraphQL nuevo**: `git status` no toca `graphql/` y el único hook
  nuevo en la página es `useActivityCategoriesQuery`, que ya existía.
- **491 ✔** La sesión abierta la cuenta `toSessionSpans` —**no se
  reimplementó**: se importa de `vida-execution.utils.ts`, que el grafo confirma
  intacto y con sus otros cinco llamantes—; el reloj es el `nowMinutes` de
  `useVidaNowMinute` que la página ya tenía. El caso «1h 24 → 1h 25» tras
  `advanceTimersByTime(60_000)` lo prueba sin volver a montar.
- **492 ✔** La línea principal es una hora: «Llevas 1 h. A este ritmo paras a
  las 16:24.» Ninguna de las cuatro frases posibles (`line` en
  `vida-goals.utils.ts`) contiene un número de minutos que restar: se leyeron
  las cuatro ramas.
- **493 ✔** Verificado por mi parte, no por el resumen: en
  `src/features/vida/components/VidaGoalArc/` **no aparece la cadena
  `role="alert"` en ningún sitio** (el único `role` es el `role="img"` del SVG),
  y el `.module.scss` no usa ni `--color-warning`, ni `--color-error`, ni ámbar
  ni rojo: el trazo es `var(--vida-goal-color)`, el mismo antes y después de
  pasar la meta, y «sin dato» va en `--color-text-secondary`. **Leídos los
  textos, uno a uno**, incluido el `aria-label` (`${goal.name}. ${line}`): «Llevas
  9 h 10 min. Pasaste las 8 h a las 17:00.», «Registraste 5 h de Trabajo.», «No
  hay nada registrado de Trabajo ese día.», «Si arrancas ahora, acabarías a las
  17:24.», «2 h 40 min sin dato hoy.», «Cuenta Working at lululemon, en marcha
  desde las 10:15.» — ni un adjetivo, ni un signo de exclamación, ni una palabra
  de juicio en ninguna, tampoco en el rótulo de dentro del arco («PASASTE LAS 8H
  A LAS»).
- **494 ✔** Solo `category === null` entra en la línea «sin dato»; una categoría
  que existe pero no apunta a la meta no aparece (caso propio, y la rama del
  `continue` en el bucle lo dice).
- **495 ✔** Cero minutos: arco vacío (no se pinta el trazo con `share === 0`) y
  la fórmula en condicional, que es **lo que la D-C autorizó por escrito**.
- **496 ✔** Guarda `(isToday || isPast)` en la página: en día futuro no se
  pinta.
- **497 ✔ con reparo de redacción — ver abajo.** El cálculo es el que pide el
  criterio (pasado, sin proyección: `stopAtTime === null`, sin «a este ritmo», y
  «40 min sin dato ese día»). Lo que no coincide es el **verbo**.
- **498 — sigue pendiente de prueba a mano** (está detrás del login). Lo que sí
  queda comprobado desde aquí: no hay ningún total por día en ninguna parte —el
  `useMemo` depende de `categories` y de `dayFollowUps` y nada más— y la
  mutación de la tajada 1 invalida `vidaKeys.categories.list()`. **No se aprueba
  por simpatía: queda escrito como paso 4 del usuario.**
- **499 ✔ en su mitad comprobable.** La guarda del fallo es
  `failed.length === 0 && !categoriesFailed`, con dos casos que la afirman, y el
  aviso «Falta una parte de tu día» **no nombra el arco ni el catálogo**: su
  contrato sigue siendo el de las cuatro consultas del día. Lo de los 375 px
  **no se puede reproducir aquí** —el arnés del constructor está borrado, y
  `git status` lo confirma: en `src/` no queda ningún archivo de arnés—; leído
  el CSS, no hay ni un ancho fijo (`flex: 1 1 14rem`, `min-width: 0` en las
  cinco cajas, `flex-wrap` en la fila, `svg { width: 100%; max-width: 13.5rem }`)
  y el único `white-space: nowrap` está en «1h 24 de 8h», que no crece. Queda
  como paso 5 a mano.

**Las tres cosas que el constructor puso a juicio:**

1. **El texto del 497.** Veredicto: **la construcción es correcta y el criterio
   está mal redactado.** El componente recibe una meta genérica —nombre, icono,
   color y minutos salen del dato—, y esa genericidad **la exigió el plan y la
   sección 1** («la primera de una familia de metas»). Un verbo conjugado
   («Trabajaste») obligaría a la función a saber que la meta es trabajo, que es
   exactamente lo que el criterio 484 y la nota de la sección 1 prohíben; el día
   de «Estudiar» habría que escribir un `switch` de verbos por meta. «Registraste
   5 h de Trabajo.» dice el mismo dato, en pasado y sin reproche, con la palabra
   que ya usa el módulo para lo vivido. **El criterio 497 no se reescribe aquí**
   (no es mío): queda como enmienda propuesta al analista, «Trabajaste Xh Ym.» →
   «el dato del día en pasado, con el nombre de la meta y sin proyección».
2. **Los campos de más en `VidaGoalArc`.** Fiel al plan, no exceso. El propio
   plan escribió el reparto «tally → formato» —«devuelve minutos **y** etiquetas
   ya compuestas… el componente solo pinta»—; `targetLabel`, `arcValue`,
   `arcCaption` y `line` son etiquetas compuestas, no lógica nueva, y elegir la
   frase en el componente habría roto el reparto y dejado el criterio 493 sin
   nada que comprobar en el DOM. `runningSince` sale del propio render («en
   marcha desde las 10:15»). Ninguno añade una consulta, una dependencia ni una
   rama de negocio.
3. **El `vi.mock` de `useActivityCategories`.** **Completo**: las seis
   exportaciones del módulo (`useActivityCategoriesQuery`,
   `useActivityCategoryQuery`, `useCreateActivityCategoryMutation`,
   `useUpdateActivityCategoryMutation`, `useDeleteActivityCategoryMutation`,
   `useSetActivityCategoryGoalMutation`), verificadas contra los seis `export
   function` del hook. Y **ningún otro quedó a medias por este cambio**: buscados
   los seis `vi.mock` de ese módulo en el repositorio (`VidaActivitySheet`,
   `VidaArchivadasPage`, `VidaPlantillaPage`, `VidaCategoriasPage`,
   `VidaActividadesPage`, `VidaHoyPage`); ninguna de esas pantallas estrena en
   esta tajada un camino que use una exportación que su mock no tenga, y la
   única que monta Hoy en un comentario (`VidaPlantillaPage.test.tsx:103`) no lo
   renderiza.

**Qué rompió al lado, y cómo se buscó:**

- **Por el grafo (estado previo al cambio, que es justo lo que aquí sirve):**
  `useVidaDayData` tenía dos llamantes, `VidaHoyPage` y `VidaRevisionPage`; el
  hook **no se tocó** (`git diff` vacío), así que Revisión no puede haberse
  movido. `toSessionSpans` tenía cinco llamantes (`buildDayExecution`,
  `buildWeekRow`, `buildTemplateBridge`, `buildActivityPatterns`, `describe1`) y
  tampoco se tocó: `buildGoalArcs` entra como sexto llamante, no como copia.
  `buildCategoryBreakdown` sigue con sus cinco aristas y su `spansOf` propio.
- **Quién más usa el hook que Hoy estrena:** cinco pantallas más
  (`VidaTemplateAddPanel`, `VidaActivitySheet`, `VidaArchivadasPage`,
  `VidaActividadesPage`, `VidaCategoriasPage`). El hook no cambió; Hoy solo se
  suma a una caché con `staleTime` de 5 min y `enabled` por `useVidaQueryGuard`.
- **Lo que vive al lado en la pantalla:** el presupuesto del día y la agenda. El
  arco mete un elemento entre los dos; buscados los anclajes por posición del
  test de Hoy (`previousElementSibling`, cuatro sitios) y los cuatro están
  **dentro de la lista del plan**, no alrededor del presupuesto. La corrida
  completa lo confirma: 1.810 pasan, los 2 fallos son los de `SearchSelect`.
- **Lo que el constructor señaló como más probable:** los tres sospechosos
  (mock del catálogo, posición en `styles.main`, peso del paquete) comprobados
  arriba; ninguno se materializó.

**Duplicación (contra la sección 2):** nada de la lista «lo que NO hay que
crear» se saltó. Ni consulta nueva, ni formateador nuevo (los cuatro que importa
son de `vida-time.utils.ts`), ni reescritura de `toSessionSpans`, ni `slice(0,
1)` —buscado en los tres archivos nuevos y en la página: no existe—, ni nada en
`useVidaDayData`, `VidaDayBudget`, `VidaRevisionPage` o `buildCategoryBreakdown`.
La aritmética por categoría de Revisión **no se copió**: `buildGoalArcs` agrupa
por meta y proyecta una hora, que es lo que allí no hay.

**Estados:** *vacío* ✔ (495) y *sin meta* ✔ (no se pinta nada, que es la puerta
de la tajada 3). *Error* ✔ (499). *Permisos* no aplica (app de un solo usuario
tras el login). *Móvil*: razonado sobre el CSS, medido por el constructor, y
paso a mano del usuario. **Faltan dos, como hallazgo, no como devolución:**

- **Carga.** Mientras el catálogo viaja, `categories` es `[]` y el arco
  simplemente **no existe**; cuando llega, aparece y empuja la agenda hacia
  abajo. Ningún criterio pide un esqueleto, pero el salto se va a ver la primera
  vez del día (después la caché de 5 min lo tapa).
- **Texto largo.** El nombre de la meta va en un `flex` con `min-width: 0` pero
  **sin `overflow-wrap`**: hoy la única meta se llama «Trabajo» y nace sola, así
  que no hay manera de provocarlo; el día que el nombre se pueda editar, ese es
  el sitio.

**Dos hallazgos más, anotados y no tocados:**

- **La frase va dos veces a la vista.** El render 18 panel 1 pone el dato
  **dentro** del arco (rótulo + hora) y debajo solo la línea de la sesión en
  marcha; la construcción añade además un `<p>` visible con la frase entera, que
  repite la hora y los minutos. Es lo que hace comprobable el 493 y es la
  costumbre del módulo (`ChartPanel` y su tabla oculta) —solo que allí la
  alternativa textual va **oculta**—. No incumple ningún criterio y por eso no se
  devuelve: queda para el ojo del usuario en el recorrido a mano, y si molesta es
  una clase de «solo para lectores de pantalla», no un rediseño.
- **El SVG y el `<p>` dicen lo mismo a un lector de pantalla** (el `aria-label`
  del `role="img"` contiene la misma frase que el párrafo de debajo): se oye dos
  veces. Mismo sitio, misma línea de arreglo que el punto anterior.

**Veredicto: aceptada.** Los once criterios comprobables desde aquí se cumplen,
el 498 queda **explícitamente pendiente de la prueba a mano** del usuario (no se
da por bueno), las cuatro líneas base se reproducen clavadas y no apareció
ninguna regresión en los tres sitios donde se buscó. El único desvío de letra
—el verbo del 497— es, a mi juicio, un error de redacción del criterio y no de
la construcción.

**Para el usuario (tajada 2, con el API ya desplegado):**

El arco ya está en Hoy. Como la migración 069 corrió contra Neon con el
despliegue de `e6c0b7c`, el catálogo **ya llega con su meta dentro**: en cuanto
marques una categoría como trabajo, Hoy te pinta debajo del presupuesto un
semicírculo con **la hora a la que paras** en grande —no unos minutos que restar—
y arriba «3h 40 de 8h». La sesión que tengas en marcha cuenta sola y la cifra
sube cada minuto sin tocar nada. Si te pasas de las ocho horas, la pantalla lo
dice y se calla: «Llevas 9 h 10 min. Pasaste las 8 h a las 17:00.» Ni un color
de alarma, ni un adjetivo, ni un aviso.

Y si hay ratos que no sabías de dónde salían, el arco te los confiesa en vez de
tragárselos: «2 h 40 min sin dato hoy» debajo, en voz baja. En un día pasado de
la tira el arco se pinta igual, en pasado y sin proyectar nada; en un día futuro
no aparece, porque no hay nada vivido que sumar.

Para probarlo a mano (ya no hace falta ningún push):

1. En **Ajustes → Categorías**, marca «Esto es trabajo» en la categoría con la
   que sueles trabajar.
2. Entra en **Vida → Hoy**: el arco tiene que aparecer justo debajo del
   presupuesto del día y encima de la agenda, con la hora dentro.
3. Empieza una sesión de esa categoría y espera un minuto: la cifra sube sola,
   sin recargar.
4. Abre un día pasado en la tira de arriba: tiene que decir «Registraste …» y
   **no** «a este ritmo paras a las…».
5. **El que falta por comprobar:** con el arco de un día pasado a la vista,
   quítale a esa categoría la casilla «Esto es trabajo» y vuelve a Hoy — el arco
   de **ese día pasado** tiene que bajar, porque nada se guarda congelado.
6. En el móvil, a 375 px, mira que ni el arco ni sus frases saquen barra
   horizontal.

### Tajada 3 — aceptada

**Cómo se revisó:** líneas base reproducidas enteras en este árbol (typecheck
`exit 0`; lint `✖ 14 problems (14 errors, 0 warnings)`; `pnpm test` → `Tests 2
failed | 1818 passed (1820)`, los dos de `SearchSelect`, el flaky de
`IconPicker` no salió; `pnpm build` exit 0 con inicial **1.121,29 kB**,
`app-icons` **620,20 kB** sin mover y `IconPicker` 4,64 kB). Más un arnés
temporal propio (`harness-review-016.{html,tsx}`, **ya borrado**) servido por un
Vite arrancado por mí en el 5173 —el del usuario estaba apagado, lo dijo la
sonda— a 375×812, para mirar el arco y la pregunta con datos sintéticos.

**Criterios, uno a uno (sección 1, literal):**

- **500 ✔** Sin ninguna categoría apuntando a una meta, en el hueco del arco
  sale la pregunta con las categorías en botones. Comprobado en el test por
  **posición** (`compareDocumentPosition` contra el `<section>` del presupuesto
  y contra la fila «Bañarme» del plan), no por presencia, y visto en el arnés:
  caja de borde punteado, pregunta, línea de qué gana, píldoras con icono.
- **501 ✔ (en test; el viaje real queda a mano)** El toque llama **una vez** a
  `mutate({ categoryId, attached: true })` —sin `goalId`, la misma forma que
  usan `VidaCategoriasPage.tsx:110` y `CreateVidaCategoryStep.tsx:61`, así que
  es la meta que crea el servidor— y, al volver el catálogo con la meta dentro,
  **la misma página ya montada** (`rerender`) pinta el arco y la pregunta
  desaparece. El hook no se tocó (`git status` no lista
  `useActivityCategories.ts`): la invalidación es la que ya existía.
- **502 ✔** Dos casos y los dos aprietan: tras el toque no hay `role="dialog"`,
  la agenda sigue en su sitio y la mutación se llamó una sola vez; y con una
  categoría ya apuntada la pregunta no vuelve ni hoy ni en `?d=2026-09-17`. No
  hay bandera de «ya preguntado»: lo garantiza el dato.
- **503 ✔** Catálogo vacío: el componente devuelve `null` antes de pintar nada.
  En el arnés, el contenedor queda con `innerHTML === ''` y **0 px de alto**.

**Las dos deudas de la tajada 2, cerradas y verificadas en navegador:** el SVG
del arco tiene `role → null` y `aria-hidden → "true"`, y la frase entera vive
**una sola vez** en el `<p>` de solo lectores de pantalla, que mide **1×1 px**,
va `position:absolute` con `clip-path: inset(50%)` y **no desplaza nada**. Lo
que sí se miró con lupa, porque era el riesgo de verdad del arreglo: **la hora
de parar sigue viéndose**. Está dentro del arco (`<text>` «A este ritmo paras a
las» + «16:00»), así que esconder el `<p>` **no se llevó por delante el criterio
492**. Y el estado de carga del catálogo distingue de verdad: `isPending &&
fetchStatus !== 'idle'` deja fuera la consulta deshabilitada (`idle`, sin
sesión), los reintentos siguen en `fetching`/`paused` —esqueleto— y el fallo
real cae en `categoriesFailed`, que ya escondía el bloque entero (criterio 499).
**No encontré ningún camino que le enseñe la pregunta a quien ya marcó su
categoría.**

**El localizador movido — ¿se ablandó?** No. `goalArc()` pasó de
`getByRole('img', {name:/Trabajo/}).closest('article')` a
`getByRole('article', {name:'Trabajo'})`, y los nueve casos de la tajada 2
(489–497 y los dos del 499) siguen afirmando lo mismo **dentro** del arco: la
frase literal, el valor grande, «1h 24» → «1h 25» tras 60 s, la posición entre
el presupuesto y la agenda, la ausencia de `role="alert"` y de palabras de
reproche, «Registraste 5 h de Trabajo.» sin «A este ritmo», y el arco ausente en
día futuro y con consulta caída. Lo único que el ancla nuevo ya no prueba por sí
mismo es que exista un `<svg>`, pero el dibujo sigue cubierto de rebote: «1h»,
«0m», «16:24» y la caption se leen de los `<text>` de dentro.

**Qué miré alrededor (y cómo):**

- `graphify explain "useSetActivityCategoryGoalMutation"` → la llaman
  `VidaHoyPage` (nuevo), `VidaCategoriasPage` y `CreateVidaCategoryStep`; abrí
  las dos últimas y usan `mutateAsync` con la **misma forma** de entrada. El
  hook no cambió, así que no hay nada que se haya movido bajo sus pies.
- `graphify explain "VidaGoalArc"` → solo lo importa `VidaGoalArcRow`, y a ese
  solo `VidaHoyPage`. El margen negativo que se quitó no tiene más clientes.
- `role="img"` en `src/features/vida/`: el único otro sitio es
  `VidaActivityCard.tsx:141`, que no es el arco. Ningún test ajeno buscaba el
  arco por ahí.
- **Los mocks de módulo que caducan en silencio** (la trampa del
  `ENVIRONMENT.md`): el mock de `VidaHoyPage.test.tsx:125-135` **sí** lista
  `useSetActivityCategoryGoalMutation`, que es la exportación que esta tajada
  estrena en la página. Y el de `VidaArchivadasPage.test.tsx:43-45`, con una
  sola exportación, **no miente**: abrí la página y solo importa
  `useActivityCategoriesQuery` (`VidaArchivadasPage.tsx:5`). El constructor lo
  declaró bien.
- Suite entera en verde salvo los dos `SearchSelect` de siempre.

**Estados:**

- **Vacío ✔** (criterio 503, visto en navegador). **Carga ✔** (esqueleto de
  176 px en el hueco, sin salto). **Error de la consulta ✔** (el bloque entero
  desaparece, criterio 499). **Texto largo ✔**: «Consultoría de sistemas
  distribuidos y plataformas de datos» **envuelve dentro de la píldora**.
  **Móvil ✔**: a 375 px `scrollWidth 375 = clientWidth 375`. **Permisos:** no
  aplica, todo es del único usuario tras el login.
- **Error de la mutación:** el usuario **sí** ve algo —el `onError` del hook
  levanta un toast «No pudimos guardar la meta de la categoría»
  (`useActivityCategories.ts:96-98`)— y la pregunta se queda donde estaba. No
  hay caso de test para esa rama desde Hoy: **hallazgo, no motivo de
  devolución.**
- **Doble toque rápido en dos píldoras distintas:** `isBusy` llega por
  `isPending`, así que dos clics en el mismo tick pueden disparar dos
  mutaciones y dejar **dos** categorías apuntando a la meta. Es exactamente lo
  que el criterio 482 permite y se deshace desde Ajustes → Categorías:
  **hallazgo menor**.
- **«Ahora no»:** como estado de partida es sensato. Aparta la pregunta de la
  visita con un `useState`, **no escribe nada** ni en el aparato ni en el
  servidor, y como la otra puerta (la casilla de Ajustes → Categorías) sigue
  abierta, no se pierde nada al recargar. Callarla más tiempo pide dónde
  guardarlo y eso es del usuario.

**Hallazgos que no devuelven la tajada:**

1. `aria-labelledby="vida-goal-prompt-title"` es un id **fijo** en el
   componente (el arco, en cambio, lo deriva de `arc.goal.id`). Con una sola
   instancia no colisiona; si algún día se pinta dos veces, sí.
2. El esqueleto lleva `aria-live="polite"` sobre una caja sin texto: no anuncia
   nada. Inofensivo, pero es ruido de atributos.
3. Tercera copia de la receta «solo lectores de pantalla» en el módulo
   (`.srLine` aquí, `.srOnly` en `VidaHoyPage.module.scss`): deuda de estilo del
   proyecto, no de esta tajada.
4. A 375 px la caption de dentro del arco («A ESTE RITMO PARAS A LAS») **roza
   el trazo verde** por la izquierda. Viene de la tajada 2, no de este cambio.

**¿Duplica algo que ya existía?** No. Contra la sección 2: el puntero, la
mutación y su invalidación son los de la tajada 1 —ni documento GraphQL nuevo,
ni clave de caché nueva, ni ajuste nuevo—, y `VidaGoalPrompt` es el primer
«pregunta con píldoras» de Hoy, que es justo lo que el arquitecto dio por no
existente. **El repositorio del API no se tocó** (`git status` allí:
limpio, `HEAD = origin/main = e6c0b7c`, con `069_vida_goals.sql` ya desplegada).

**Veredicto: aceptada.** Con ella, **FEAT-016 queda `delivered`**: lo único que
sigue abierto es prueba a mano detrás del login —el criterio **498** (quitarle
el puntero a una categoría y ver bajar también los días pasados), heredado de
la tajada 2, y el recorrido real de esta tajada contra la API desplegada—,
porque los agentes no entran con credenciales.

**Para el usuario:** (va en el resumen de la sesión)
