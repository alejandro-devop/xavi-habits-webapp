---
id: FEAT-006
title: Revisar el día — plan frente a real, la historia del día y el puente a tu plantilla
status: in-review
architect: yes    # pantalla sin hermana (dos carriles alineados por hora, y la semana con lo real de siete días a la vez: catorce consultas donde hoy hay siete), y hay que decidir una sola vez dónde vive la derivación por categoría y la de la semana sin partir en dos `vida-execution.utils.ts`
area: features/vida
requested: 2026-09-20
updated: 2026-09-20
---

# FEAT-006 — Revisar el día — plan frente a real, la historia del día y el puente a tu plantilla

## 1. The request — feature-analyst

**Summary for whoever's next:** F5 del plan de Vida. `/app/vida/revision` deja de
ser un cascarón y pasa a ser **el día contado**: la historia en prosa, la cifra
grande, plan frente a real bloque a bloque, por categoría, la semana, y **un
solo** puente hacia la plantilla. La primera tajada es **leer un día cerrado**
—historia, cifra, plan frente a real y lo que se salió— con el vocabulario que
ya usa Hoy y **sin escribir nada**. **El API no se toca**: todo se deriva en
cliente de `activityDayPlan(date)` + `activityDayFollowUps(date)`.

**What problem it solves:** hoy el usuario **vive** el día (FEAT-004) y lo
**planea** (FEAT-003), pero al final no tiene dónde ver **cómo le fue** sin
volver a recorrer la agenda hora a hora. Lo que hay es la frase de cierre de
FEAT-004 —una línea dentro de Hoy, pensada para el minuto en que el día se
acaba—, y con ella no se responde ninguna de las preguntas que motivaron el
módulo: *¿en qué se me fue el día? ¿qué parte de mi plantilla aguanta y cuál no?
¿qué tendría que mover para que el plan deje de romperse por el mismo sitio?*. El
problema **no** es «falta una pantalla de estadísticas»: es que **la plantilla no
tiene cómo aprender de la realidad**. Sin revisión, el usuario corrige su semana
tipo de memoria, y de memoria solo se recuerda lo que salió mal — que es
exactamente la vía por la que el sistema anterior acabó midiendo «desperdicio» y
culpando. Por eso la revisión termina en **algo que se puede hacer**: una
pregunta sobre la plantilla, no una nota sobre la persona.

**Who it's for:** el usuario del módulo Vida, **al final del día o al día
siguiente** —y el domingo, para la semana—. No es una pantalla de uso continuo:
se entra un minuto, se lee, y como mucho se rellena algo que faltó o se mueve una
hora en la plantilla. El criterio de la fase es de **lectura en diez segundos**,
no de permanencia.

**User's words:** el pedido original del módulo, del 2026-09-18, es el que
enmarca la fase — y la revisión es literalmente su segunda mitad:

> «Como siempre me soñé el módulo de actividades y follow-ups: es más como una
> plantilla de mi vida, donde planeo día a día lo que voy a hacer y puedo seguir
> la plantilla o registrar lo que se sale, **y al final del día evaluar cómo me
> va. Con el tiempo el sistema entiende y me ayuda mejor a planear.**»

Y la forma exacta que pidió para el puente a la plantilla, citada en el propio
render:

> «**No me está dando hacer ejercicio en las mañanas porque necesito dormir
> más.**»

**No hay una frase nueva del usuario para esta fase**, y queda dicho en vez de
inventado. Lo que hay es el **render aprobado hoy, tal cual**,
`docs/vida/assets/07-vida-revision.html` (se abre en
`http://localhost:5173/docs/vida/assets/07-vida-revision.html`). **Sus cinco
marcos y sus notas al pie son parte de la spec** y no se reabren: A (un día
revisado en el móvil), B (por categoría y los tramos sin registrar), C (la semana
y el puente), D (escritorio, dos carriles alineados por hora) y E (un día sin
nada apuntado). **Los ocho puntos de «Lo que esta pantalla decide» se especifican
tal cual** y están repartidos por los criterios de abajo.

**Lo que manda por encima del render**, porque ya estaba decidido:

- **Nada de culpa.** Ni «desperdicio», ni «fallaste», ni «deberías», ni recordar
  el propósito al fallar (`docs/vida/PLAN.md`, «La regla que se hereda de
  hábitos»; `docs/remodel/06-mi-persona.spec.md`). La identidad se gana, no se
  declara. Esta es la pantalla donde esa regla se puede romper más fácil: es la
  única que mira hacia atrás.
- **Backend intocable.** Todo se deriva en cliente de lo que ya existe
  (`PLAN.md`, decisión 3). Para la semana son **siete consultas de plan y siete
  de sesiones**, con el precedente de `useVidaWeekPlans`.
- **El vocabulario es el de Hoy.** Ninguna etiqueta nueva.

**Out of scope:** (lo que alguien podría dar por incluido y NO lo está)

- **F6 entera.** Adherencia semana a semana con su tendencia, patrones por día de
  la semana («los martes se te caen las tardes»), rachas, comparar una semana con
  la anterior, medias históricas, «sueles tardar 55 min». Aquí hay **una** semana
  y **un** aviso derivado de ella; nada mira más atrás que la ventana de la regla
  del criterio 54.
- **Más de un aviso en el puente**, avisos por día, una bandeja de sugerencias o
  cualquier cosa que se aplique sola. Uno, en forma de pregunta, y se responde o
  se deja.
- **Editar el plan de un día desde la revisión.** Ni quitar un bloque, ni moverlo,
  ni añadir uno, ni cambiarle la hora o la duración. Eso es Hoy (FEAT-003), y la
  revisión enlaza allí. Lo único que la revisión escribe sobre el pasado son
  **sesiones** (lo que de verdad pasó) y las notas del aparato.
- **Cambiar la plantilla más allá de la hora del aviso.** Ni días, ni duración, ni
  quitar un ítem, ni activar o desactivar. Eso es `/app/vida/plantilla`
  (FEAT-005), y el aviso enlaza allí.
- **Meses, años, calendario largo, línea de tiempo.** La unidad es **el día**, y
  como marco, **la semana** que lo contiene.
- **Exportar, imprimir, PDF, compartir, informe por correo.**
- **Diario, ánimo, «cómo te sentiste», energía, etiquetas de humor.** No hay campo
  en el API y no se inventa uno.
- **Metas y presupuestos por categoría** («quiero 5h de Yo a la semana»), objetivos,
  y cualquier **porcentaje único de cumplimiento** que se lea como una nota
  (punto 6 del render).
- **Cualquier cifra de desperdicio.** «Sin registrar» es tiempo del que no hay
  dato, y así se llama siempre.
- **Recordatorios y notificaciones** («revisa tu día»). El día no persigue a nadie.
- **Cambios en el API.** Ninguno: ni campo, ni consulta, ni mutación nueva. Lo
  único que se escribe son las mutaciones que **ya existen**
  (`activityFollowUpAdd`, `activityFollowUpRemove`, `vidaItemUpdate`).
- **`vidaTakenToday` / `vidaMarkTakenToday`.** Siguen sin usarse: «hecho» se
  deriva de la sesión (FEAT-004, D7).
- **Llevar al API las razones de «No se pudo» y los «dejarlo así».** Siguen
  viviendo en `store/vida-device-notes.store.ts`, **solo en este aparato**. La
  revisión los lee y **lo dice en pantalla**; en otro aparato no estarán. Ver la
  decisión abierta al final.
- **Rutas nuevas.** Todo cae en `/app/vida/revision`, que existe desde FEAT-001, con
  el mismo `?d=YYYY-MM-DD` de Hoy. `app-nav.config.ts` sigue siendo la fuente
  única y la píldora «Revisión» ya está.
- **Fundir o tocar `/app/vida/semana`** (FEAT-003). Aquella es para **planear** la
  semana («Armar desde la plantilla»); esta mira **lo real**. Se quedan las dos, y
  ninguna línea de aquella se reescribe aquí.
- **Renombrar «sin dato» en Hoy.** Esta pantalla dice «sin registrar» (render y
  `PLAN.md`); Hoy sigue diciendo «sin dato». Queda anotado como decisión del
  usuario, abajo.
- **Uso sin conexión** y cualquier caché propia de la revisión más allá de la que
  ya da React Query.

**Acceptance criteria:**

*El día revisado: la historia, la cifra y plan frente a real (tajada 1)*

- [ ] 1. `/app/vida/revision` deja de ser un cascarón: enseña **«Revisión»** con la
  fecha del día visto y su estado («Viernes 18 de septiembre · día cerrado»). La
  ruta, la píldora del módulo y el `⌘K` **no cambian**.
- [ ] 2. Arriba, **la tira de días de Hoy** (`VidaDayStrip`), y el día visto viaja
  en **`/app/vida/revision?d=YYYY-MM-DD`**, con el mismo comportamiento que Hoy
  (atrás del navegador incluido). En la tajada 1 el punto de cada día es **el de
  Hoy** (tiene plan / no tiene); el punto de tres estados llega en la tajada 4,
  que es cuando la pantalla ya carga la semana entera.
- [ ] 3. **Al entrar sin `?d=`** se abre el **último día cerrado**: ayer si hoy
  todavía no ha llegado al fin del día de Vida, y hoy si ya lo pasó. Nunca se abre
  un día futuro.
- [ ] 4. Un **día futuro** no se revisa: se lee «este día todavía no ha pasado»,
  con la salida a planearlo en Hoy. **Cero cifras**, ni a cero ni inventadas.
- [ ] 5. **Hoy, aún abierto**, sí se puede mirar: la pantalla lo dice («aún
  abierto»), las cifras se leen **hasta ahora** y ninguna frase habla en pasado
  cerrado («seguiste») de un día que no ha terminado.
- [ ] 6. **La historia del día**, lo primero que se lee: **como mucho tres
  frases**, compuestas con reglas —no con modelos—, en este orden: (a) *seguiste N
  de M bloques*, con un matiz si lo hay; (b) *lo que se salió*, con sus minutos;
  (c) *lo que no se hizo*, y la razón entre comillas si existe. **Cada frase solo
  aparece si hay dato que la sostenga**; con un solo dato, la historia es de una
  frase.
- [ ] 7. La historia **abre siempre por lo que sí salió** y no contiene ni una
  palabra de reproche. El test de vocabulario existente
  (`vida-vocabulary.test.ts`) cubre los archivos nuevos: ni «cancelar», ni
  «eliminar», ni «desperdiciado», ni «fallaste», ni «deberías».
- [ ] 8. La historia habla de **bloques**. Solo la frase de la tarde o la mañana
  puede nombrar una **categoría** («la tarde se te fue ahí»), y **solo** si una
  sola categoría se lleva al menos la mitad de lo registrado en esa mitad del día;
  si no, **no se afirma**.
- [ ] 9. **La cifra grande: «6 / 8 bloques seguidos»**, con la definición escrita y
  probada: cuenta como **seguido** todo bloque del plan que tiene **sesión
  emparejada** (calcado, +N, −N, empezó +N o **movido**); no cuentan «no hecho» ni
  «no se pudo». El emparejamiento es **el mismo** de Hoy
  (`matchSessionsToBlocks`): ni otra regla, ni otro umbral.
- [ ] 10. Al lado, los minutos: **planeado** (la suma del plan del día) y
  **registrado** (la suma de las sesiones del día), más la línea «de lo
  registrado, **1h 50** fuera del plan».
- [ ] 11. **«Sin registrar»** con ese nombre, su cifra y su aclaración literal: «de
  las 16h 30 de tu día · **no hay dato, no se adivina**». Se mide contra **el día
  entero** —del inicio al fin de Vida de los ajustes (FEAT-003)—, no contra los
  ratos entre cosas registradas.
- [ ] 12. Los tramos del día **suman el día entero** (el 100 %) aunque haya
  sesiones solapadas, porque salen de partir el día por bordes y clasificar cada
  trocito una vez — el mismo reparto que `getExecutedBudget` en su forma cerrada.
- [ ] 13. **Plan frente a real**: un renglón por bloque, **en orden de hora**, con
  el icono y el color de su categoría, el nombre, la columna **Planeado** («7:00 ·
  15 min») y la columna **Real** («7:04 · 14 min») con sus etiquetas. Las etiquetas
  son **exactamente las de Hoy**, sin una nueva: *✓ calcado · +N min · −N min ·
  empezó +N · movido · no hecho · no se pudo*.
- [ ] 14. Un bloque **«no se pudo»** cuenta como no hecho, se enseña **sin rojo y
  sin esconderse**, y trae **su razón entre comillas** si la hay; si no la hay, se
  lee **«sin razón»** y nada más.
- [ ] 15. Donde se enseñan razones o «dejarlo así», la pantalla dice **una vez**
  que eso **vive en este aparato** y que en otro no estará. No se disimula.
- [ ] 16. Sección **«Fuera del plan»** con su cuenta y sus minutos («2 · 1h 50») y
  un renglón por sesión sin bloque, con la etiqueta *fuera del plan* y su hora
  real.
- [ ] 17. Un bloque **movido** aparece **una sola vez**, con «movido · 40 min
  tarde» (y en escritorio, su sombra a la hora planeada).
- [ ] 18. Al pie, dos salidas: **«Ver el día en la agenda»** y **«Registrar tiempo
  pasado»**. En la tajada 1 las dos son **enlaces a Hoy de ese día**
  (`/app/vida/hoy?d=`), que ya sabe hacer las dos cosas; registrar **dentro** de la
  revisión llega en la tajada 3. No se pinta ningún botón muerto.
- [ ] 19. **Día con plan y sin un solo registro** (marco E): sin cifra grande, con
  el texto literal —«De este día no quedó nada apuntado», «Tenías **4 bloques**
  planeados y no hay registros. **Puede que lo vivieras sin abrir la app, y
  también es un día**», «Si quieres, se rellena ahora — o se queda así»—, el plan
  en **trazo fantasma** y, abajo, «**Sin registrar 16h 30** · el día entero · no
  hay dato, y no se adivina». Los «Lo hice» por bloque llegan en la tajada 3.
- [ ] 20. **Día sin plan y con sesiones**: sin lista fantasma y **sin «N de M»**; la
  historia dice «este día no tenía plan; registraste 3 cosas y 2h 10», y lo
  registrado se lista con su hora.
- [ ] 21. **Día sin plan y sin sesiones**: una sola frase que lo diga sin reproche
  y la salida a Hoy. Nunca «no hiciste nada».
- [ ] 22. En **escritorio** (marco D): a la izquierda la historia y las cifras, más
  el panel **«Lo que no se hizo»** con su razón; a la derecha, **los dos carriles
  alineados por hora** — el plan quieto en su columna y lo real en la suya, con lo
  **fuera del plan** sin nada enfrente, el **movido** como sombra a su hora
  planeada, y los tramos **sin registrar** ocupando su sitio en el carril real con
  su tamaño. (El botón «Lo hice» del panel llega en la tajada 3.)
- [ ] 23. **Estados**: **cargando** con esqueletos; **error del plan** y **error de
  las sesiones** distinguibles del vacío, cada uno con **«Reintentar»**. Nunca se
  afirma «no quedó nada apuntado» cuando lo que pasó es que **no cargó**.
- [ ] 24. A **375 px** no hay scroll horizontal con un nombre de 60 caracteres y una
  razón de tres líneas, y en **tema oscuro** todo lo nuevo se lee.
- [ ] 25. **Desde Hoy se llega**: cuando el día se cierra —donde hoy aparece la
  frase de cierre de FEAT-004— hay un enlace **«Ver cómo fue el día»** a
  `/app/vida/revision?d=`. Es **lo único** que cambia en Hoy en esta tajada.

*Por categoría y los tramos sin registrar (tajada 2)*

- [ ] 26. Bloque **«Minutos por categoría»**: por cada categoría con dato, **dos
  barras** —**planeado** rayado y **registrado** sólido— con **el color del
  catálogo** de esa categoría, y la cabecera «Casa · 45 min → **2h 53**».
- [ ] 27. Una actividad **sin categoría** tiene **su propia fila** («Sin
  categoría»): sus minutos no se reparten entre las demás ni se esconden.
- [ ] 28. **«Sin registrar» es una fila más**, separada por una línea punteada, con
  su tamaño frente al día entero y la frase literal: «Tiempo del que no hay dato,
  entre las 6:30 y las 23:00. **No se reparte entre categorías ni se adivina**: si
  quieres, se rellena registrando».
- [ ] 29. **Ninguna categoría se presenta como un porcentaje único** ni como una
  nota, y no aparece la palabra «cumplimiento» en ninguna parte.
- [ ] 30. Las notas bajo una categoría salen **de una regla** y solo con dato que
  las sostenga («El desayuno no se pudo: 30 min planeados que no llegaron a
  registro»); si no hay regla que dispare, **no hay nota**.
- [ ] 31. **«Los cuatro tramos más largos sin registrar»**, con su franja («10:32 –
  13:05») y su tamaño («2h 33»), ordenados de mayor a menor, tomando **el mismo
  umbral de Hoy** (`VIDA_NO_DATA_MIN_MINUTES`, 30 min). Los botones de cada tramo
  llegan en la tajada 3.
- [ ] 32. Si **no hay tramos** por encima del umbral, la sección **no se pinta** — no
  se escribe «no hay tramos» ni se rellena con tramos menores.
- [ ] 33. En **escritorio** la categoría **cierra la pantalla**, debajo de los
  carriles: es lo que se mira al final, no al empezar.
- [ ] 34. Lo nuevo tiene sus estados (cargando, error con «Reintentar»), no rompe a
  **375 px** y se lee en **oscuro**.

*Rellenar el día desde la propia revisión (tajada 3)*

- [ ] 35. Cada bloque **no hecho** estrena **«Lo hice»**, que hace **exactamente**
  lo de FEAT-004: registra la sesión con la hora y la duración planeadas, recorta
  a «ahora» si el día es hoy, y **no toca el plan** — comprobado con espía: las
  cuatro mutaciones de `activityDayPlan` siguen sin llamarse.
- [ ] 36. En un **día sin registros**, la lista fantasma del criterio 19 estrena su
  **«Lo hice»** por bloque: es la forma más barata de rellenar un día a
  posteriori.
- [ ] 37. **«Registrar tiempo pasado»** abre **la misma hoja de FEAT-004** (qué · a
  qué hora empezó · cuánto, con las píldoras 15 · 30 · 45 · 1h · libre) **sin salir
  de la revisión**, con el día visto ya puesto.
- [ ] 38. Cada tramo sin registrar estrena **«¿Qué pasó?»** —que abre esa misma
  hoja con **la hora del tramo ya puesta**— y **«Dejarlo así»**, que usa el
  **mismo store del aparato** que Hoy (`store/vida-device-notes.store.ts`): lo
  dejado así **no vuelve a preguntar**, ni aquí ni en Hoy, ni tras recargar.
- [ ] 39. En el **día sin nada apuntado**, las tres salidas del marco E
  —«Registrar tiempo pasado», «¿Qué pasó?» y «Dejarlo así»— se pintan con **el
  mismo peso visual** (misma `className`), y «Dejarlo así» cierra el asunto **del
  día entero**.
- [ ] 40. Tras registrar, marcar o dejar algo así, **la historia, la cifra, la lista,
  las categorías y los tramos se recalculan sin recargar**.
- [ ] 41. **La revisión no edita el plan del día**: en toda la pantalla no hay un
  solo control que quite, mueva, añada o recorte un bloque del plan. (Punto 8 del
  render, comprobable por estructura.)
- [ ] 42. Un **día futuro** no ofrece ninguna de estas salidas; un **día pasado**
  sí — como en Hoy, donde registrar tiempo pasado ya vive en días de atrás.
- [ ] 43. Si una escritura **falla**, se dice, **no se pierde lo elegido** y el
  mensaje describe sin reprochar.
- [ ] 44. **Toda cifra que hable de lo que no salió lleva la salida al lado** (punto
  5 del render): no hay ningún número de «no hecho», «no se pudo» o «sin
  registrar» sin su «Lo hice», su «Registrar tiempo pasado» o su «¿Qué pasó?».

*La semana y el puente a tu plantilla (tajada 4)*

- [ ] 45. Desde la revisión de un día se pasa a **la semana** («Ver por semana») y
  se vuelve, **sin salir de la píldora «Revisión»** y **sin ruta nueva**; el día
  sigue viajando en `?d=`. **`/app/vida/semana` (FEAT-003) no se toca**: aquella es
  para planear.
- [ ] 46. La semana es la que **contiene el día visto**: «Tu semana · 14 – 20 de
  septiembre», con **siete filas**, una por día.
- [ ] 47. Cada fila lleva el día y su número, el titular —**«6 de 8»**, o «Hoy · aún
  abierto», o «Planeado · 3 bloques», o «Sin plan»—, la **barrita del día** con sus
  cuatro tramos (**seguido · de más · fuera del plan · sin registrar**) y los
  minutos **«5h 37 de 4h 30»** (registrado de planeado). Un día sin dato dice
  **«—»**, nunca «0».
- [ ] 48. **Leyenda** de los cuatro colores, con el mismo significado que la barra
  del día de Hoy.
- [ ] 49. Un toque en una fila **abre la revisión de ese día**.
- [ ] 50. **La frase de la semana**, compuesta con reglas y con la misma regla de no
  reproche: «Seguiste **29 de 36** bloques…». Nombra el día **más parecido al
  plan** solo si hay uno que destaque; si no, no lo afirma.
- [ ] 51. Con la semana cargada, **la tira de días estrena el punto de tres
  estados** —seguido · a medias · solo planeado—, con la misma lectura que el
  render.
- [ ] 52. Si **una** de las consultas de un día **falla**, esa fila **lo dice** y no
  se lee como «sin plan» (el hallazgo que quedó abierto en FEAT-003, tajada 5). La
  semana **no** se pinta como si ese día hubiera estado vacío.
- [ ] 53. Abrir la semana cuesta **catorce consultas como mucho** (siete de plan y
  siete de sesiones) y **reutiliza la caché** de Hoy y de la revisión del día: las
  claves son las que ya existen (`vidaKeys`), sin clave nueva por pantalla.
- [ ] 54. **El puente: como mucho un aviso**, al pie de la semana, **en forma de
  pregunta** y con su base dicha: «Leer un rato · 21:30 — **3 de las últimas 4
  noches no llegó a esa hora**. ¿Lo movemos a las **20:30** en tu plantilla?».
- [ ] 55. **La regla que lo genera es la mínima, y es la única**: un ítem de la
  plantilla que **estuvo en el plan al menos 4 de los últimos 14 días** y **no se
  siguió** en al menos **3** de ellos. Si hay varios, gana el de más veces; a
  igualdad, el de más minutos planeados. **Ningún otro patrón entra** (las
  tendencias, la adherencia y los patrones por día son F6).
- [ ] 56. **La hora propuesta se deriva de lo real**: la mediana de las horas de
  inicio de las sesiones de esa actividad en esos días, redondeada a 15 min. **Si
  no hay sesiones de las que derivarla, no hay aviso** — nunca se propone una hora
  inventada.
- [ ] 57. **«Moverlo a las 20:30» edita el ítem de la plantilla** (`vidaItemUpdate`)
  y **nunca** el plan de ningún día, ni pasado ni futuro — comprobado con espía. La
  consecuencia queda dicha **antes** de confirmar: «está los lunes a viernes, se
  mueve en todos».
- [ ] 58. **«Dejarlo como está»** cierra el aviso y **no vuelve a proponer lo mismo
  esa semana** (nota de aparato, como el «dejarlo así»).
- [ ] 59. **Sin base no hay puente**: si no hay plantilla, o no hay días suficientes
  con plan, **no se pinta** el bloque — ni vacío, ni con un texto de relleno.
- [ ] 60. La semana tiene sus estados: **cargando** (siete esqueletos), **error** con
  «Reintentar», **375 px** sin scroll horizontal y **oscuro** legible.

*Solo lo puede cerrar el usuario*

- [ ] 61. **Criterio de la fase** (`PLAN.md`, F5): **la revisión de un día se lee en
  diez segundos y no contiene ninguna palabra de reproche.** Lo cronometra el
  usuario sobre un día suyo de verdad.
- [ ] 62. **El recorrido real, con la API despierta** (Render se duerme a los 15
  min): vivir un día a medias en Hoy → al cerrarse, tocar **«Ver cómo fue el día»**
  → leer la historia, la cifra y plan frente a real → comprobar que las etiquetas
  son **las mismas** que vio durante el día → mirar **por categoría** y los tramos
  sin registrar → **«Lo hice»** en un bloque que se quedó sin hacer y ver cómo
  cambia la cifra **sin recargar** → **«¿Qué pasó?»** en un tramo y registrarlo →
  **«Dejarlo así»** en otro y comprobar que no vuelve a preguntar → abrir **la
  semana**, tocar un día y volver → si aparece **el puente**, moverlo y comprobar
  en `/app/vida/plantilla` que **la plantilla cambió** y en Hoy que **ningún día
  armado se movió**. Todo `/app/*` está detrás del login y **los agentes no
  entran**: queda dicho, no disimulado.
- [ ] 63. **Lo del aparato, en dos navegadores**: las razones de «No se pudo» y los
  «dejarlo así» **no se ven en el segundo**, y la pantalla lo dice antes de que
  sorprenda.

**Slices:** (vertical, cada una usable sola y probable en Vercel sin la siguiente)

| # | What it does | State |
|---|---|---|
| 1 | **El día se lee.** `/app/vida/revision` deja de ser un cascarón: tira de días con `?d=`, **la historia en prosa**, la cifra grande (N de M) con planeado · registrado · fuera del plan y **sin registrar**, **plan frente a real** bloque a bloque con el vocabulario de Hoy, la sección «Fuera del plan», el escritorio en **dos carriles**, los días raros (futuro, en curso, sin registros, sin plan) y los estados. **Solo lectura**, con las dos salidas como enlaces a Hoy. Y Hoy enlaza aquí al cerrarse el día. Ya es útil sola: es la primera vez que el usuario ve su día contado. | in-review |
| 2 | **En qué se repartió el día.** Por categoría, con la paleta del catálogo y dos barras (planeado rayado · registrado sólido), **«Sin registrar» como fila propia** con su frase, y **los cuatro tramos más largos sin registrar** listados con su franja y su tamaño. Sigue siendo lectura: responde «¿en qué se me fue el día?», que es la pregunta que trajo el módulo. | pending |
| 3 | **La revisión rellena el día.** Las salidas, todas prestadas de Hoy: **«Lo hice»** por bloque no hecho y en la lista fantasma, **«Registrar tiempo pasado»** y **«¿Qué pasó?»** con la hoja de FEAT-004 dentro de la revisión, y **«Dejarlo así»** con el store del aparato. Nada de esto toca el plan. Convierte una pantalla que se mira en una que se usa. | pending |
| 4 | **La semana y el puente.** Siete filas con «seguidos de total», la barrita del día y «registrado de planeado», la frase de la semana, el punto de tres estados en la tira, y **un solo aviso** hacia la plantilla en forma de pregunta, que al aceptarse **mueve la hora del ítem** (`vidaItemUpdate`) y nunca el plan. Es lo que cierra el círculo plantilla → día → revisión → plantilla. | pending |

**Por qué este orden:** la 1 es lectura pura sobre **datos y aritmética que ya
existen** (`useVidaDayData` + `vida-execution.utils.ts`), así que se prueba con
arnés y en Vercel sin haber escrito una mutación. La 2 añade una derivación nueva
—agrupar por categoría— sobre exactamente los mismos datos, y por eso no puede
romper nada de la 1. La 3 es la primera que escribe, y escribe **solo con código
ya construido y revisado** en FEAT-004: su riesgo está en el montaje, no en la
regla. La 4 es la única que multiplica por siete las consultas y la única que
toca **otra** entidad (la plantilla), que es lo que más puede salir mal, y por eso
va al final. **Cada tajada se puede probar entera en Vercel** sin la siguiente, y
cortarla en la 2 o en la 3 deja una feature coherente.

**Architect? yes** porque:

1. **Hay una pantalla sin hermana.** Los **dos carriles alineados por hora**
   (plan quieto a la izquierda, lo real a la derecha, con huecos «sin registrar»
   ocupando su sitio) **no existen en el repo**: la agenda de Hoy es **una** lista
   vertical de entradas (`buildDayAgenda` / `buildDayExecution`), no dos carriles
   sincronizados. Decidir si eso es una variante de `buildDayExecution` o una
   proyección nueva se hace **una vez**, no a mitad de tajada.
2. **Hay que decidir dónde vive la derivación, y `vida-execution.utils.ts` ya
   tiene 1.100 líneas.** Esta feature necesita tres cosas que no están: agrupar
   por **categoría** (plan y real a la vez), resumir **un día entero** en cifras y
   prosa, y resumir **siete días**. Si cada tajada elige por su cuenta, acabamos
   con dos sitios que calculan «seguido» y se contradicen — que es exactamente el
   riesgo que FEAT-004 pagó con una devolución.
3. **La semana son catorce consultas donde hoy hay siete.** `useVidaWeekPlans` trae
   los planes; las **sesiones** de siete días no las trae nadie. Cómo se pide, con
   qué clave, qué pasa si una falla (criterio 52) y cómo se reaprovecha la caché
   de Hoy es una decisión de capa de datos, no de pantalla.
4. **El puente escribe sobre la plantilla desde una pantalla que no es la
   plantilla.** `vidaItemUpdate`, las invalidaciones de
   `utils/invalidate-vida-queries.ts` y la convivencia con **FEAT-005, que se está
   construyendo ahora mismo sobre esos mismos hooks**, se coordinan una vez y por
   escrito.

**Lo que ya existe y NO se vuelve a construir** (con su ruta, para que nadie lo
escriba dos veces):

- **El cruce plan frente a real, entero:**
  `src/features/vida/utils/vida-execution.utils.ts` —
  `toSessionSpans`, `matchSessionsToBlocks` (dos pases, con
  `VIDA_MOVED_THRESHOLD_MINUTES` y `VIDA_ON_PLAN_TOLERANCE_MINUTES`),
  `describeBlockExecution` (`on-plan` · `changed` · `moved` · `running`),
  `buildDayExecution`, `getExecutedBudget` (con sus tres formas y el reparto que
  suma el 100 %), `isDayClosed`, `describeMissingBlock` (`upcoming` · `pending` ·
  `not-done`), `findInsteadSession`, `buildNoDataSlices` con
  `VIDA_NO_DATA_MIN_MINUTES`, `collectDayClosing` y `buildDayClosingLine`.
  **El vocabulario de la revisión es este y no otro.**
- **Los datos de un día:** `hooks/useVidaDayData.ts` (plan, sesiones, horario del
  día, `isPending`, los dos errores por separado y `refetch`).
- **Los datos de la semana (mitad):** `hooks/useVidaWeekPlans.ts` con su
  `VidaDayPlanDot` y su `hasError`, y `components/VidaDayStrip/`.
- **El horario del día:** `hooks/useVidaDayHours.ts` y `pages/VidaAjustesPage.tsx`.
- **Lo del aparato:** `store/vida-device-notes.store.ts`
  (`markBlockCouldNot`, `getBlockNote`, `isNoDataDismissed`, la clave
  `xavi.vida.deviceNotes`) — **es el único `localStorage` del módulo** y así se
  queda.
- **Registrar y corregir:** la hoja de FEAT-004 y
  `components/VidaActivityPicker/`, `hooks/useVidaSessionActions`, y las
  mutaciones `activityFollowUpAdd` / `activityFollowUpRemove` ya envueltas con sus
  `onError`.
- **La prosa por reglas, con precedente:** `src/features/habits/utils/habit-panel.utils.ts`
  (la lectura del panel de hábitos) y `buildDayClosingLine`. La historia del día
  se escribe **así**, no con un modelo.
- **El tiempo y los días:** `utils/vida-time.utils.ts` (`formatDurationFromMinutes`,
  `parseTimeToMinutes`, `minutesToTime`) y `utils/vida-date.utils.ts`
  (`VIDA_DAY_LABELS`, `VIDA_DAY_SHORT_LABELS`).
- **La plantilla:** `hooks/useVidaItems.ts` (`useUpdateVidaItemMutation`),
  `graphql/vida-items.graphql.ts` y `types/vida-item.types.ts`. Y lo que FEAT-005
  esté dejando en `utils/vida-template.utils.ts`.
- **La ruta y la píldora:** `routes/vida-paths.ts` (`vidaPaths.revision` ya está),
  `routes/vida.routes.tsx`, `pages/VidaRevisionPage.tsx` (hoy, un `PageHeader`) y
  `src/layouts/AppLayout/app-nav.config.ts`.
- **El test de vocabulario:** `vida-vocabulary.test.ts`, que barre el módulo
  buscando palabras de culpa. Los archivos nuevos entran en su alcance.

**Features con las que toca** (y por eso el orden importa): **FEAT-004** —de ahí
sale todo el vocabulario y toda la aritmética; si algo de aquel cruce cambia,
cambia aquí— y **FEAT-005**, que **se está construyendo ahora mismo** sobre los
hooks de la plantilla que el puente necesita en la tajada 4. **La tajada 4 no
debería empezar con FEAT-005 a medio entregar**: dos constructores sobre
`useVidaItems` se contaminan la línea base.

**Hipótesis marcadas** (mías, no del render; se confirman leyendo el repo, no
preguntando):

- **La categoría viene en el dato que ya se pide.** `ActivityFollowUp` y los ítems
  del plan traen `activity.category { id name color icon }`
  (`types/activity-followup.types.ts`, `types/activity.types.ts`), así que agrupar
  por categoría **no pide ninguna consulta nueva**. Si al construir resulta que
  alguna de las dos consultas no selecciona `category`, es **un campo más en un
  documento que ya existe**, no una feature.
- **Una actividad sin categoría existe** (`categoryId: string | null`), y por eso
  el criterio 27.
- **Los dos carriles se pueden derivar de `buildDayExecution`** sin cambiar su
  forma: el plan ya está en las entradas y lo real en `ExecutionSessionEntry`.
  Si el arquitecto encuentra que no, lo dice y elige; el criterio 22 describe **lo
  que se ve**, no cómo se calcula.

**Decisions that aren't mine:**

El render trae **cinco preguntas** al pie («Para saber si estamos alineados») y
el usuario lo aprobó **tal cual, sin contestarlas**. Ninguna cambia el modelo de
datos, el alcance ni otro repositorio, así que **se resuelven con lo que el
propio render enseña** y quedan escritas como decisiones tomadas. Cada una está a
una línea de cambiarse si al verlo no cuadra.

- **D1 (a) — dónde vive.** *Resuelta: en `/app/vida/revision`, con tira de días*,
  como en el render. La ruta y la píldora **ya existen** desde FEAT-001 y hoy son
  un cascarón; meter la revisión dentro de Hoy dejaría la píldora muerta y
  mezclaría la pantalla de vivir con la de mirar atrás. **Hoy enlaza aquí** al
  cerrarse el día (criterio 25), que es el único momento en que se necesita desde
  allí.
- **D2 (b) — la semana.** *Resuelta: entra en F5*, como marco C, en la tajada 4.
  Sin ella el puente no tiene de dónde salir (su regla mira varios días), y la
  semana **de lo real** no existe en ninguna parte. Lo que se queda en F6 es la
  **tendencia**: comparar semanas, adherencia en el tiempo y patrones por día.
- **D3 (c) — de qué habla la historia.** *Resuelta: de **bloques***, como en el
  render; la **categoría** solo puede aparecer en la frase de la tarde o la mañana
  y **solo si el dato la sostiene** (criterio 8). Hablar de bloques nombra cosas
  que el usuario reconoce («la llamada con el banco»); hablar de categorías suena
  a informe.
- **D4 (d) — el puente.** *Resuelta: vive aquí, con **un solo** aviso*, con la
  regla mínima del criterio 55 y sin ningún otro patrón. Una revisión que no
  propone nada es una pantalla que se mira dos veces y se abandona; y más de un
  aviso convierte la revisión en una lista de correcciones, que es justo lo que
  esta pantalla no puede ser.
- **D5 (e) — «sin registrar».** *Resuelta: se mide contra **el día entero***
  (inicio y fin de Vida de los ajustes), como el render. Es lo mismo que ya hace
  el presupuesto cerrado de Hoy, y medir solo entre cosas registradas escondería
  precisamente la mañana en la que no se abrió la app.
- **D6 — de dónde sale la hora que se propone.** *Mía, y es lectura del render*: de
  **lo real** (mediana de las horas de inicio de esa actividad en esos días,
  redondeada a 15 min), y **sin base, no hay aviso** (criterio 56). La alternativa
  —proponer «media hora antes» y ya— **inventa un dato**, que es lo único que este
  módulo tiene prohibido. Queda dicho por si el usuario prefiere la otra.
- **D7 — cómo se llama el tiempo sin dato.** *Resuelta para esta pantalla*: se
  llama **«sin registrar»**, que es lo que dicen el render y `PLAN.md`. Hoy, desde
  FEAT-004, lo llama **«sin dato»**. Son la misma magnitud con dos nombres, y
  unificarlos **toca criterios ya entregados**: eso va abajo, en manos del usuario.
- **D8 — el punto de la tira.** *Mía, de reparto*: en la tajada 1 la tira usa el
  punto de Hoy (tiene plan / no) y **el punto de tres estados llega en la 4**, con
  la semana. Pintar antes los tres estados obligaría a pedir siete días de
  sesiones en la primera tajada, que es media tajada 4 adelantada.

**Lo que sí queda en manos del usuario** (ninguna bloquea: las dos se pueden
construir tal como están escritas, y responderlas después cuesta una línea):

- **U1 — ¿las razones de «No se pudo» y los «dejarlo así» siguen siendo de este
  aparato?** Hoy viven en `localStorage` (FEAT-004, D7/D8) y **la revisión es la
  pantalla que los enseña**: un usuario que revise desde el móvil lo que explicó
  en el portátil verá «sin razón». *Opciones:* **(a)** se quedan en el aparato —lo
  que esta feature construye— y la pantalla lo dice siempre (criterio 15); **(b)**
  se llevan al API, que **toca el repositorio hermano** (`xavi-platform-node`),
  pide campo y migración, y ya no es esta feature.
- **U2 — ¿«sin registrar» o «sin dato»?** Esta pantalla dirá **«sin registrar»**
  (render y `PLAN.md`) y **Hoy seguirá diciendo «sin dato»**. *Opciones:* **(a)**
  dejarlo así y convivir con dos nombres para lo mismo en dos pantallas
  hermanas; **(b)** renombrar también en Hoy — un cambio pequeño de código que,
  sin embargo, **reescribe criterios ya aceptados de FEAT-004** y sus tests, y por
  eso no lo decido yo.

## 2. The plan — feature-architect

**Resumen para el constructor:** la referencia es **`src/features/vida/pages/VidaHoyPage.tsx`**
(+ `hooks/useVidaDayData.ts` + `utils/vida-execution.utils.ts`): la revisión es
**la misma aritmética de Hoy leída al revés**, y por eso no se calcula nada
nuevo sobre el cruce — se **consume** `buildDayExecution` y se proyecta. Todo lo
nuevo cae dentro de `src/features/vida/`: **dos utils puros nuevos**
(`utils/vida-review.utils.ts` para el día y las categorías,
`utils/vida-week-review.utils.ts` para la semana y el puente), **un hook nuevo**
(`hooks/useVidaWeekFollowUps.ts`, calcado de `useVidaWeekPlans`), los componentes
`VidaReview*` y la reescritura del cascarón `pages/VidaRevisionPage.tsx`. **No se
crea capa de datos**: las dos consultas del día ya existen y sus claves también
(`vidaKeys.dayPlan.byDate`, `vidaKeys.followUps.day`, `vidaKeys.followUps.range`).
**`vida-execution.utils.ts` no se parte ni gana una variante**: el vocabulario y
la definición de «seguido» se importan de ahí, no se reescriben.

### Lo que ya existe (y dónde)

**El cruce plan/real, entero y probado** — `src/features/vida/utils/vida-execution.utils.ts`
(1.158 líneas, 984 de test):

| Qué | Dónde | Qué significa aquí |
|---|---|---|
| `toSessionSpans` | `:114` | Las sesiones del día en minutos desde medianoche. |
| `matchSessionsToBlocks` | `:232` | **La** regla de emparejamiento (dos pases, `VIDA_MOVED_THRESHOLD_MINUTES:80` = 60, `VIDA_ON_PLAN_TOLERANCE_MINUTES:73` = 5). El criterio 9 dice «el mismo de Hoy»: es literalmente esta función, llamada desde `buildDayExecution`. |
| `describeBlockExecution` | `:295` | `BlockExecution` con `startLabel` («empezó +5»), `durationLabel` («+11 min»), `isOnPlan` («✓ calcado»), `rangeLabel` («7:04 – 7:18»), `movedToLabel`. **Las etiquetas del criterio 13 ya están compuestas aquí**: la revisión no escribe ni una. |
| `ExecutionSessionEntry` | `:339` | Lo de fuera del plan y lo movido, con `label` («fuera del plan», «40 min tarde»), `rangeLabel` y `durationLabel`. Cierra los criterios 16 y 17 sin aritmética nueva. |
| `getExecutedBudget` + `LEGEND_ORDER` | `:505`, `:445` | Las tres formas (`planned` · `running` · `closed`). La cerrada reparte el día en **seguido · de más · fuera del plan · sin dato** con `trackMinutes` sobre cursor: **suman el 100 %** aunque haya solapes (criterio 12, ya resuelto). La leyenda da los minutos exactos por tramo. |
| `isDayClosed` | `:455` | `nowMinutes` + `dayEnd` + `isPastDay`. Es lo que contesta «día cerrado» / «aún abierto» de los criterios 1, 3 y 5. |
| `buildDayExecution` | `:713` | Devuelve `byBlockId`, `sessions`, `entries` (plan + sesiones + huecos partidos, en orden de reloj), `budget`, `isDayClosed`, `hasExecution`, `missingByBlockId`, `insteadByBlockId`, `noDataByGapId`. |
| `describeMissingBlock` | `:831` | `upcoming` · `pending` · `not-done`. «No hecho» del criterio 13 sale de aquí. |
| `buildNoDataSlices` + `VIDA_NO_DATA_MIN_MINUTES` | `:949`, `:813` (=30) | Los tramos sin registrar con `rangeLabel`, `durationLabel` y `canAsk`. **Es el umbral del criterio 31**, ya escrito. |
| `plannedSessionMinutes` | `:860` | Los minutos de «Lo hice», recortados a «ahora» (criterio 35). |
| `findInsteadSession` | `:888` | «En su lugar, X». |
| `buildDayClosingLine` / `collectDayClosing` | `:1033` / `:1127` | La prosa por reglas de FEAT-004 y **el recuento que la alimenta**: `plannedCount`, `followedCount` (= `Object.keys(execution.byBlockId).length`), `missing[]` con `couldNot`, `sessionCount`, `offPlanCount/Minutes`, `overMinutes`, `noDataMinutes` — **todo tomado de la leyenda del presupuesto**, no sumado a mano. La historia del criterio 6 parte de este mismo `DayClosingInput`. |

**Los datos, los dos días y la semana:**

- `hooks/useVidaDayData.ts` — las cuatro consultas de un día con `isPlanError`,
  `isFollowUpsError`, `failed[]` y `refetch()`. **Cierra el criterio 23 entero**
  sin tocar nada.
- `hooks/useActivityFollowUps.ts:26` — `useActivityDayFollowUpsQuery(date)`,
  clave `vidaKeys.followUps.day(date)`, `staleTime` 30 s y **apagada en días
  futuros** (`!isFutureDate(date)`): el criterio 4 sale gratis, no llega ni una
  cifra de un día que no ha pasado.
- `hooks/useActivityFollowUps.ts:37` — `useActivityFollowUpsInDatesQuery(from,to)`,
  clave `vidaKeys.followUps.range` (**existe y hoy no la usa ninguna pantalla**),
  `api/activity-followups.api.ts:68`.
- `hooks/useVidaWeekPlans.ts` — siete consultas de plan con **la misma clave y
  la misma `queryFn`** que el día (acierto de caché), y `VidaDayPlanDot` con
  `items`, `isPending` y **`isError` por día**: el hallazgo de FEAT-003 que pide
  el criterio 52 ya está resuelto de este lado.
- `utils/invalidate-vida-queries.ts:23` — `invalidateFollowUpQueries` invalida
  `followUps.day(date)`, `followUps.range(semana en curso)` y `followUps.open()`.
  **Cubre el criterio 40 sin invalidación nueva** (ver el aviso de A5).

**La tira, la ventana y las rutas:**

- `components/VidaDayStrip/VidaDayStrip.tsx:32` — props `days`, `plans`,
  `edgeNote`. **Enlaza a `vidaPaths.hoyForDate(day.date)` (`:61`), fijo**: para
  la revisión hace falta una prop, no un componente nuevo (A3).
- `utils/vida-window.utils.ts` — `getPlanningWindow:53` (**esta semana y la que
  viene**), `clampToPlanningWindow:71`, `buildDayStrip:115`, `DAY_STRIP_LENGTH:28`,
  `DAY_STRIP_LEAD:31`.
- `routes/vida-paths.ts` — `revision` ya está; `hoyForDate` y `semanaForDate`
  son el molde del `?d=`. `routes/vida.routes.tsx:47` ya cablea
  `VidaRevisionPage`, y `app-nav.config.ts:121` ya pinta la píldora.
  **Ninguna ruta nueva en toda la feature.**

**Lo del aparato:** `store/vida-device-notes.store.ts` —
`vidaBlockNoteKey:52`, `vidaNoDataKey:57`, `getBlockNote:62`,
`isNoDataDismissed:71`, `markBlockCouldNot`/`clearBlockNote`/`dismissNoData`,
clave única `xavi.vida.deviceNotes:27`, `partialize` al final. El texto «en este
aparato» ya se dice en `VidaBlockOutcomes.tsx:15,45` y `VidaAgendaNoData.tsx:9,29`.

**Registrar, ya construido:** `components/VidaLogSessionSheet/` (modos
`start` · `log` · `edit`, con `date`, `dayLabel`, `suggestions`,
`defaultStartTime` e **`initial: { startTime, durationMinutes }`** — la prop que
el «¿Qué pasó?» de la revisión necesita, escrita en FEAT-004 pensando en esto),
`components/VidaActivityPicker/`, `utils/vida-session.utils.ts` (`logSessionInput`),
`hooks/useActivityFollowUps.ts` (`useCreateActivityFollowUpMutation`). **«Lo
hice» ya existe entero** en `pages/VidaHoyPage.tsx:366` (`markBlockDone`):
`clearBlockNote` + `logSessionInput` + `plannedSessionMinutes`. Se copia esa
función, no se inventa otra.

**La plantilla (tajada 4):** `hooks/useVidaItems.ts:80` `useUpdateVidaItemMutation`
(`VidaItemUpdateInput` admite `startTime: 'HH:mm'` suelto, sin tocar `days` ni
`durationMinutes`), `invalidateVidaItemQueries:77`, y lo que FEAT-005 deja en
`utils/vida-template.utils.ts` (`templateItemsForDay:126`,
`templateItemTitle:133`, `describeItemDays:287`, `describeItemMeta:295`).

**La prosa por reglas, con dos precedentes:** `buildDayClosingLine:1033` y
`src/features/habits/utils/habit-panel.utils.ts:409` (`composeReading`: frases
condicionadas a que el dato las sostenga, y `null` cuando no).

**El test de vocabulario se cubre solo:** `src/features/vida/vida-vocabulary.test.ts:24`
barre `./**/*.{ts,tsx}` con `import.meta.glob` excluyendo los `.test.`. **Todo
archivo nuevo bajo `src/features/vida/` entra sin tocar el test** (criterio 7).

### Lo que NO existe — dicho explícitamente

- **No hay dos carriles alineados por hora en ninguna parte del repo.** Ni en
  Vida ni en hábitos: la agenda de Hoy es una lista vertical única
  (`execution.entries`), y la semana de FEAT-003 son filas resumen. El marco D
  es nuevo (A2).
- **No hay ninguna agrupación por categoría de minutos planeados/registrados.**
  `vida-catalog.utils.ts` agrupa **actividades** por categoría para el catálogo;
  de minutos no sabe nada.
- **Nadie pide las sesiones de siete días.** `useVidaWeekPlans` trae los planes;
  la mitad real de la semana no existe (A4).
- **No hay ninguna pantalla ni util que mire más de un día de lo real.**
  `useActivityFollowUpsInDatesQuery` existe y **no la llama nadie**.
- **No hay regla derivada de varios días hacia la plantilla.** El puente es
  código nuevo entero (A6).
- **`pages/VidaRevisionPage.tsx` es un `PageHeader` de 5 líneas.** No hay nada
  que rescatar ahí.
- **Nada de esto existe dos veces**: no encontré ninguna derivación duplicada
  del cruce. Se mantiene así **si y solo si** la revisión importa de
  `vida-execution.utils.ts` en vez de recalcular.

### Hipótesis del analista: confirmadas

- **«La categoría viene en el dato que ya se pide.» Confirmada.** Los dos
  documentos seleccionan `activity { … category { id name color icon } }`:
  `graphql/activity-day-plan.graphql.ts:20` y
  `graphql/activity-followups.graphql.ts:23` (y `:77` en el abierto). El tipo es
  `ActivityFollowUpActivityRef` (`types/activity-followup.types.ts:3`).
  **Ninguna consulta ni campo nuevo para la tajada 2.**
- **«Una actividad sin categoría existe.» Confirmada**: `category` es opcional y
  anulable en el mismo tipo → criterio 27, fila propia.
- **«Los dos carriles se pueden derivar de `buildDayExecution` sin cambiarlo.»
  Confirmada**: `execution.entries` ya trae, en orden de reloj, los bloques en su
  hora, las sesiones sueltas, las movidas y **los huecos partidos**;
  `noDataByGapId` les pone nombre y tamaño. Los carriles son **una proyección de
  esa lista en filas**, no otro cálculo (A2).

**Una hipótesis que el analista no marcó y que sí importa, corregida:**
**la ventana de días de Hoy no sirve para la revisión.** `clampToPlanningWindow`
(`vida-window.utils.ts:71`) recorta todo a **esta semana y la que viene**: el
lunes, «ayer» es domingo y **cae fuera** → la revisión abriría el lunes en vez
del domingo, y la semana del criterio 46 no sería alcanzable. Se resuelve en A3,
y es el motivo por el que la tajada 1 toca `vida-window.utils.ts`.

### Implementación de referencia

**`src/features/vida/pages/VidaHoyPage.tsx`** (864 líneas, con
`hooks/useVidaDayData.ts` y `utils/vida-execution.utils.ts`), y **se imita en
este orden**:

1. **Cómo se monta un día**: `clampToPlanningWindow(searchParams.get('d'), today)`
   → `useVidaDayData(date)` → `buildDayAgenda` → `buildDayExecution` →
   se pinta. La revisión hace **exactamente** eso y añade un tercer pase puro
   (`buildDayReview`). Líneas 118–230 de `VidaHoyPage.tsx` son la plantilla.
2. **Cómo se separan los estados**: sin sesión (`isPending` + `fetchStatus:
   'idle'`), cargando con `Skeleton`, `Alert` + «Reintentar» con `failed.join(' ni ')`
   (`:650-658`), y el vacío. Criterio 23, calcado.
3. **Cómo se escribe sin tocar el plan**: `markBlockDone` (`:366`) y la hoja
   (`:340-355`). Tajada 3 entera.

**Por qué esta y no `VidaSemanaPage.tsx`**: aquella es la pantalla más parecida
en **forma** (siete filas), y por eso es la referencia **de la tajada 4** —
`pages/VidaSemanaPage.tsx:95-120` es literalmente el molde de las filas y del
`shiftYmd`/`mondayOf`/`formatWeekRange`, que se **copian de ahí** (no se
importan: son funciones locales de esa página, y moverlas a un util compartido
es otra tarea). Pero la feature entera vive del cruce del día, y eso es Hoy.

**Molde de hoja y de componente:** `components/VidaLogSessionSheet/` (que se
reutiliza tal cual, no se imita) y `components/VidaAgendaBlock/` para la
anatomía de una fila con icono, color de categoría y etiquetas.

### Decisiones de arquitectura

**A1 · La derivación de la revisión vive en `utils/vida-review.utils.ts`, puro, y
**consume** `vida-execution.utils.ts` — no lo amplía ni lo copia.**
`vida-execution.utils.ts` ya tiene 1.158 líneas y describe **un día vivido**; la
revisión describe **cómo se lee ese día**, que es otra cosa. La frontera, escrita
para que no se cruce:

> **De `vida-execution.utils.ts` se importa todo lo que define «qué pasó»**
> (emparejamiento, etiquetas, tramos, presupuesto, `collectDayClosing`).
> **En `vida-review.utils.ts` solo vive «cómo se cuenta»**: las filas de plan
> frente a real, las filas de los carriles, el reparto por categoría, el orden
> de los tramos y las frases. **Si un archivo nuevo necesita decidir si un
> bloque se siguió, está mal escrito**: eso es `Object.keys(execution.byBlockId)`,
> y `collectDayClosing:1127` ya lo hace.

La cifra grande del criterio 9 es, literalmente,
`collectDayClosing(...).followedCount` / `.plannedCount`. No hay una segunda
definición de «seguido» en el repo y esta feature no la estrena.

**La semana y el puente van en un segundo archivo, `utils/vida-week-review.utils.ts`.**
Mismo motivo por el que la revisión no entra en la ejecución: un archivo que
mira siete días no comparte ni un tipo con el que mira uno, y juntarlos repetiría
la historia de las 1.100 líneas. El de la semana **importa** al del día.

**A2 · Los dos carriles son una proyección en filas de `execution.entries`, no un
cálculo nuevo.** `buildReviewLanes(execution)` recorre `entries` y emite
`ReviewLaneRow[]`, una fila por **borde de tiempo**, con:

- `timeLabel` (la hora de la izquierda del render, `formatTimeForDisplay`),
- `plan`: el `AgendaBlock` con su `BlockExecution` o su `BlockMissingStatus`
  (`null` si en esa fila no había plan → el hueco del render),
- `real`: `{ kind: 'matched' | 'off-plan' | 'moved' | 'no-data' | 'none' }` con
  la entrada correspondiente.

Un **movido** produce **dos filas**: la del plan a su hora con `real: none` y
sombra (`movedToLabel`), y la de la sesión a su hora con `plan: null` — que es
exactamente lo que enseña el render a las 19:00 y las 19:40, y por eso el
criterio 17 («aparece una sola vez») se cumple: **una sola tarjeta real**.
`AgendaNowMark` se descarta: la revisión mira hacia atrás.

**La misma estructura sirve para el móvil**: la lista compacta del marco A es
`ReviewLaneRow[]` pintada en un renglón por fila en vez de en dos columnas.
Una sola derivación, dos pinturas — que es lo que evita que el móvil y el
escritorio se contradigan.

**A3 · La revisión tiene su propia ventana de días, en `vida-window.utils.ts`.**
Se añaden ahí (no en un archivo nuevo: es calendario, y ese archivo es el
calendario):

```
REVIEW_LOOKBACK_DAYS = 14
getReviewWindow(today) → { from: <lunes de la semana de today−14>, to: getPlanningWindow(today).to }
clampToReviewWindow(date, today)
buildDayStrip(selectedDate, today, window = getPlanningWindow(today))   ← tercer parámetro, con valor por defecto
```

`from` es el **lunes** de esa semana y no el día 14 exacto para que **cualquier
día que la semana del criterio 46 pueda pintar sea alcanzable**: una fila que se
toca y lleva a otro día sería un enlace muerto. `to` se hereda de la ventana de
planeación porque el criterio 4 exige poder **ver** un día futuro para decir que
todavía no ha pasado. Añadir el tercer parámetro con valor por defecto **no toca
a Hoy ni a la semana** y deja `buildDayStrip` como único constructor de tiras.

`VidaDayStrip` gana **dos props opcionales**: `basePath` (por defecto
`vidaPaths.hoyForDate`, para no tocar Hoy) y `dots` (tajada 4, D8). No se crea un
`VidaReviewDayStrip`: sería la segunda tira del módulo y se desincronizarían.

**A4 · Las sesiones de la semana son siete consultas por día, no un rango.**
`hooks/useVidaWeekFollowUps.ts`, calcado de `useVidaWeekPlans.ts`:
`useQueries` sobre `vidaKeys.followUps.day(date)`, misma `queryFn`
(`followUpsApi.getActivityDayFollowUps`), mismo `staleTime` (30 s), mismo
`enabled` que el hook de un día — **incluido `!isFutureDate(date)`**, o el
domingo futuro de la semana pediría lo que no existe.

**Descartado el rango (`followUps.range`) para la semana**, aunque sea **una**
consulta en vez de siete, por dos razones que son criterios:

- **Criterio 52**: un rango falla **entero**; siete filas no pueden decir cuál no
  cargó. El `isError` por día es la mitad del criterio.
- **Criterio 53**: el rango **no comparte caché** con el día. Abrir la semana y
  entrar en un día volvería a pedir ese día, y escribir en un día no refrescaría
  su fila (`invalidateFollowUpQueries` invalida `followUps.day(date)`).

Con las siete por día, **abrir la semana desde la revisión de un día cuesta 13
consultas nuevas, no 14** (el día visto ya está en caché por las dos vías), y
escribir en él refresca su fila sin invalidación nueva. Criterio 53, cumplido
por construcción.

**A5 · El puente mira 14 días, y eso cuesta 8 consultas más, no 14.** La regla
del criterio 55 necesita **plan y sesiones de los últimos 14 días**; la semana
solo trae 7. El reparto, elegido para no multiplicar por dos:

- **Los planes** de los 7 días que faltan: `useVidaWeekPlans(<los 7 anteriores>)`
  — el mismo hook, otra lista de fechas, misma clave, acierto de caché si el
  usuario ya miró esa semana. **7 consultas.**
- **Las sesiones** de los 14 días: **`useActivityFollowUpsInDatesQuery(from, to)`**
  — **una** consulta, clave `vidaKeys.followUps.range(from,to)` que **ya existe**
  y hoy no usa nadie. **1 consulta.**

Las dos se piden **solo cuando la semana está abierta y la plantilla tiene
ítems** (`enabled`), así que la tajada 1, 2 y 3 no pagan nada.

> **Aviso, y es un conflicto con el criterio 53 tal como está escrito:** con el
> puente pintado, la pantalla de la semana hace **22 consultas** (13 nuevas de la
> semana + 8 del puente), no 14. El criterio 53 y el criterio 55 no pueden ser
> los dos ciertos a la vez: la regla de 14 días no cabe en 14 consultas de 7
> días. **No reescribo criterios**: lo dejo dicho para que lo cierre quien
> corresponda, con las dos salidas medidas — (a) aceptar las 8 del puente, que es
> lo que este plan construye, o (b) recortar la regla a **los 7 días de la semana
> vista** (≥3 días con plan, ≥2 sin seguir), que cabe en las 14 y cambia el
> criterio 55. Si nadie decide, **se construye (a)** y se anota en la tajada 4.
>
> Segundo aviso, menor: `invalidateFollowUpQueries` invalida el rango **de la
> semana en curso** (`getCurrentWeekRange()`), no el rango de 14 días del puente.
> Registrar algo desde la revisión **no recalcula el puente al instante**; se
> recalcula al refrescar la consulta (`staleTime` 60 s) o al volver a entrar. El
> criterio 40 no nombra el puente, así que **no se toca `invalidate-vida-queries.ts`**:
> pasarle `weekRange` desde la revisión sería una invalidación por pantalla.

**A6 · La regla del puente es pura y vive en `utils/vida-week-review.utils.ts`.**
`buildTemplateBridge({ items, days, today })` → `TemplateBridge | null`, donde
`days` es, por día, `{ planItems, followUps }`. Dentro, por cada `VidaItem` con
`startTime`: cuenta los días en que **hubo un bloque de esa actividad en el
plan** (≥4), cuenta en cuántos de esos **no hubo sesión emparejada**
(`matchSessionsToBlocks`, ≥3), y deriva la hora con la **mediana de
`startTime` de las sesiones de esa actividad** en esos días, redondeada a 15 min
(`Math.round(m/15)*15`). Sin sesiones de las que derivarla → `null` (criterio 56).
Desempate: más veces, luego más minutos planeados. Devuelve también `basis`
(«3 de las últimas 4 noches no llegó a esa hora») y `daysLabel`
(`describeItemDays`, de FEAT-005) para la frase de consecuencia del criterio 57.

**Es pura y se prueba con días a mano.** Es la única forma de probar una regla de
14 días sin la API.

**A7 · «Dejarlo como está» del puente entra en el store del aparato que ya
existe, no en una clave nueva.** `vida-device-notes.store.ts` gana
`dismissedBridges: string[]` con `vidaBridgeKey(weekMonday, itemId)` y
`dismissBridge(...)`, dentro del **mismo** `xavi.vida.deviceNotes`: la restricción
del repositorio es «nada nuevo en `localStorage`», y esto no estrena clave. El
`persist` no tiene `version` y el merge por defecto es superficial, así que un
estado guardado sin el campo arranca con `[]` — no hace falta migración.

**A8 · La historia del día (criterio 6) parte de `collectDayClosing`, no de la
pantalla.** `buildReviewStory(input: DayClosingInput & { … })` → `string[]` de
**como mucho tres frases**, cada una condicionada a su dato. No se llama a
`buildDayClosingLine`: aquella devuelve **una** cadena con el orden de FEAT-004
(una línea dentro de Hoy, pensada para el minuto del cierre) y esta pide tres
frases en otro orden. **Lo que se comparte es el `DayClosingInput`**, que es donde
está el recuento, y por eso las dos pantallas no pueden decir cifras distintas
del mismo día.

La frase (b) del criterio 8 —la que puede nombrar una categoría— necesita el
reparto por categoría de **media jornada**, que es de la tajada 2. En la tajada 1
se compone **sin ella** y la matización llega con las categorías; queda escrito
abajo como recorte, no como olvido.

**A9 · La cifra de «sin registrar» sale de la leyenda del presupuesto cerrado,
no de restar.** `legend.find(k => k === 'no-data').minutes`, y el día entero es
`budget.dayMinutes`. Es lo que ya hace `collectDayClosing:1127` y lo que garantiza
el criterio 12 sin una línea de aritmética nueva. **`getExecutedBudget` no se
toca.** Y el nombre en pantalla es **«sin registrar»** (U2, opción a): el
`SEGMENT_LABELS:433` de Hoy sigue diciendo «sin dato» y **no se renombra** —
la revisión pone su propia etiqueta al pintar, que es una cadena de la pantalla,
no del util.

### Dónde va el código nuevo, archivo por archivo

#### Tajada 1 — el día se lee (criterios 1–25)

**Se crea:**

| Archivo | Qué |
|---|---|
| `src/features/vida/utils/vida-review.utils.ts` (+ `.test.ts`) | `ReviewDayStatus = 'future' \| 'open' \| 'closed'`; `resolveReviewDate(param, today, dayHours, nowMinutes)` → el último día cerrado (criterio 3, con `isDayClosed`); `buildDayReview({ execution, agenda, dayHours, date, today, nowMinutes, couldNotItemIds })` → `{ status, figures, rows, offPlan, ghostRows, lanes, hasPlan, hasExecution }`; `buildReviewStory(...)` → `string[]` (≤3, criterios 6, 7, 20, 21); `buildReviewLanes(execution)` (A2). **Puro, `now` inyectado, ni un `new Date()`.** |
| `src/features/vida/components/VidaReviewStory/` (4 archivos) | La tarjeta de la historia: ≤3 párrafos + la fecha y el estado del día. |
| `src/features/vida/components/VidaReviewFigures/` (4 archivos) | La cifra grande «6 / 8 bloques seguidos», planeado · registrado · «de lo registrado, 1h 50 fuera del plan», y la fila «Sin registrar» con su aclaración literal (criterios 9, 10, 11). |
| `src/features/vida/components/VidaReviewRow/` (4 archivos) | Un renglón de plan frente a real: icono y color de categoría, nombre, columna **Planeado**, columna **Real** con las etiquetas de `BlockExecution` / `describeMissingBlock`, la razón entre comillas y la variante fantasma del criterio 19. Molde: `VidaAgendaBlock`. |
| `src/features/vida/components/VidaReviewLanes/` (4 archivos) | El marco D: `ReviewLaneRow[]` en una rejilla de tres columnas (hora · plan · real), con la sombra del movido y los tramos sin registrar ocupando su sitio. Solo escritorio (`@media`), como el render. |
| `src/features/vida/pages/VidaRevisionPage.module.scss` | — |
| `src/features/vida/pages/VidaRevisionPage.test.tsx` | — |

**Se modifica:**

| Archivo | Qué |
|---|---|
| `src/features/vida/pages/VidaRevisionPage.tsx` | **Reescritura del cascarón.** Monta como `VidaHoyPage:118-230`: `clampToReviewWindow` → `useVidaDayData` → `buildDayAgenda` → `buildDayExecution` → `buildDayReview`. Estados, tira, historia, cifras, lista, «Fuera del plan», carriles, y al pie **dos enlaces** a `vidaPaths.hoyForDate(date)` (criterio 18). |
| `src/features/vida/utils/vida-window.utils.ts` (+ `.test.ts`) | `REVIEW_LOOKBACK_DAYS`, `getReviewWindow`, `clampToReviewWindow`, tercer parámetro de `buildDayStrip` (A3). |
| `src/features/vida/routes/vida-paths.ts` | `revisionForDate: (date) => '/app/vida/revision?d=' + date`, junto a `hoyForDate`. **Un solo sitio construye la URL.** |
| `src/features/vida/components/VidaDayStrip/VidaDayStrip.tsx` (+ `.module.scss`) | Prop `basePath?: (date: string) => string` con valor por defecto `vidaPaths.hoyForDate`. Nada más en esta tajada. |
| `src/features/vida/components/VidaDayBudget/VidaDayBudget.tsx` (+ `.test.tsx`) | Prop `reviewTo?: string \| null`: junto a `closingLine` (`:38`, `:183`) se pinta **«Ver cómo fue el día»** cuando la hay. Es **lo único** que cambia en Hoy (criterio 25). |
| `src/features/vida/pages/VidaHoyPage.tsx` | Pasa `reviewTo={vidaPaths.revisionForDate(date)}` cuando `closingLine` no es `null` (`:266`, `:671`). |

**No se toca:** `vida-execution.utils.ts`, `vida-agenda.utils.ts`,
`useVidaDayData.ts`, `routes/vida.routes.tsx`, `app-nav.config.ts`,
`query-keys.ts`, `graphql/*`.

#### Tajada 2 — en qué se repartió el día (criterios 26–34)

**Se crea:**

| Archivo | Qué |
|---|---|
| `src/features/vida/components/VidaReviewCategories/` (4 archivos) | Por categoría, dos barras (planeado **rayado** · registrado **sólido**) con el color del catálogo, cabecera «Casa · 45 min → 2h 53», fila «Sin categoría», **«Sin registrar» como fila separada** con su frase literal, y la nota por regla del criterio 30. |
| `src/features/vida/components/VidaReviewNoDataList/` (4 archivos) | «Los cuatro tramos más largos sin registrar», con franja y tamaño. **No se pinta si la lista está vacía** (criterio 32). |

**Se modifica:**

| Archivo | Qué |
|---|---|
| `src/features/vida/utils/vida-review.utils.ts` (+ `.test.ts`) | `buildCategoryBreakdown({ agenda, execution, budget })` → `CategoryRow[]` (`{ key, name, color, icon, plannedMinutes, registeredMinutes, note }`) con la fila `null` para «Sin categoría» y la de «sin registrar» aparte; `topNoDataSlices(execution, 4)` (ordena `noDataByGapId` por duración, filtra `canAsk`); `describeCategoryNote(row)` (criterio 30, devuelve `null` si ninguna regla dispara). |
| `src/features/vida/pages/VidaRevisionPage.tsx` (+ test, `.module.scss`) | Las dos secciones, **al final** en escritorio (criterio 33). |

**Dónde salen los minutos:** planeado, de `agenda.blocks` (`durationMinutes`);
registrado, de `execution` — **los minutos reales de cada `SessionSpan`**,
incluidos los de fuera del plan, por su `activity.category`. La suma de
registrado **no** se fuerza a cuadrar con `budget`: son magnitudes distintas
(el presupuesto reparte el día sin solapes; las categorías cuentan minutos de
sesión). **Se dice en el código**, o alguien lo «arreglará» mal.

#### Tajada 3 — la revisión rellena el día (criterios 35–44)

**Se crea:** nada. Toda la tajada es **cableado de código ya revisado**.

**Se modifica:**

| Archivo | Qué |
|---|---|
| `src/features/vida/components/VidaReviewRow/` | Botón **«Lo hice»** en los `not-done` y en las filas fantasma (criterios 35, 36). |
| `src/features/vida/components/VidaReviewNoDataList/` | **«¿Qué pasó?»** y **«Dejarlo así»**, mismo peso visual (criterios 38, 39). Molde exacto: `VidaAgendaNoData`. |
| `src/features/vida/pages/VidaRevisionPage.tsx` (+ test) | `useCreateActivityFollowUpMutation` + `logSessionInput` + `plannedSessionMinutes` (copia de `VidaHoyPage:366`), `<VidaLogSessionSheet mode="log" initial={{ startTime }} …>` con `key` por apertura, el store del aparato (`dismissNoData`, `getBlockNote`, `isNoDataDismissed`), y la línea de «esto vive en este aparato» (criterio 15). Las salidas **no se pintan en días futuros** (criterio 42). |
| `src/features/vida/components/VidaReviewFigures/` | Las salidas al lado de cada cifra de lo que no salió (criterio 44). |

**Nada aquí toca el plan**: no se importa ni una mutación de
`useActivityDayPlan` en toda la pantalla — y eso se prueba con espía (criterios
35 y 41).

#### Tajada 4 — la semana y el puente (criterios 45–60)

**No arranca hasta que FEAT-005 esté `delivered`.** El puente escribe con
`useUpdateVidaItemMutation` y lee `vida-template.utils.ts`, los dos archivos que
FEAT-005 está tocando ahora mismo (`utils/vida-template.utils.ts`,
`hooks/useVidaItems.ts:95`, `hooks/useSaveVidaItemForActivity.ts`). Dos
constructores sobre los mismos archivos se contaminan la línea base de lint y
tests, y eso ya está escrito en `ENVIRONMENT.md`. **Las tajadas 1, 2 y 3 no
tocan nada de la plantilla y pueden ir en paralelo.**

**Se crea:**

| Archivo | Qué |
|---|---|
| `src/features/vida/hooks/useVidaWeekFollowUps.ts` (+ `.test.tsx`) | Calco de `useVidaWeekPlans.ts` sobre `vidaKeys.followUps.day` (A4): `byDate` con `{ followUps, isPending, isError }`, `hasError`, `refetch`. |
| `src/features/vida/utils/vida-week-review.utils.ts` (+ `.test.ts`) | `buildWeekReview({ dates, plans, sessions, dayHours, today, nowMinutes })` → `WeekRow[]` (titular, barrita de cuatro tramos desde `getExecutedBudget` cerrado, «5h 37 de 4h 30», `isError`, `—` cuando no hay dato); `buildWeekLine(rows)` (criterio 50); `buildTemplateBridge(...)` (A6); `weekDotFor(row)` → `'followed' \| 'partial' \| 'planned' \| 'none'` (criterio 51). |
| `src/features/vida/components/VidaReviewWeek/` (4 archivos) | Las siete filas, la leyenda de los cuatro colores y la frase de la semana. Molde: `VidaSemanaPage.tsx:95-200`. |
| `src/features/vida/components/VidaReviewBridge/` (4 archivos) | El aviso en forma de pregunta, con su base, **«Moverlo a las HH:mm»** y **«Dejarlo como está»**, y la consecuencia dicha antes de confirmar (criterio 57). |

**Se modifica:**

| Archivo | Qué |
|---|---|
| `src/features/vida/pages/VidaRevisionPage.tsx` (+ test) | Estado local `view: 'day' \| 'week'` («Ver por semana» y volver, **sin ruta nueva**, criterio 45 — como el día elegido de FEAT-005, A6 de aquel dossier); monta `useVidaWeekPlans` + `useVidaWeekFollowUps` con las siete fechas de la semana del día visto; monta el puente con `enabled` (A5). |
| `src/features/vida/components/VidaDayStrip/VidaDayStrip.tsx` (+ `.module.scss`) | Prop `dots?: Record<string, VidaStripDot>` para el punto de tres estados (D8, criterio 51). **Sin ella, la tira sigue exactamente como en Hoy.** |
| `src/features/vida/store/vida-device-notes.store.ts` (+ `.test.ts`) | `dismissedBridges`, `vidaBridgeKey`, `dismissBridge`, `isBridgeDismissed` (A7, criterio 58). |
| `src/features/vida/hooks/useVidaWeekPlans.ts` | **Nada, si se puede.** Se le pasa otra lista de fechas para los 7 días anteriores; si hiciera falta un `enabled` externo para no pedirlos hasta que la semana esté abierta, **ese es el único cambio admitido** (una prop opcional, aditiva). |

### Lo que NO se crea

- **Ninguna consulta, mutación, documento GraphQL ni campo de SDL.** El API no
  se toca en ninguna tajada (`graphql/contracts.test.ts` no cambia).
- **Ninguna clave nueva en `query-keys.ts`** y **ninguna invalidación nueva** en
  `invalidate-vida-queries.ts`. Las tres que hacen falta ya existen.
- **Ninguna ruta nueva** y **ninguna entrada en `app-nav.config.ts`**:
  `/app/vida/revision` existe desde FEAT-001 y la semana es una vista de esa
  misma pantalla.
- **Ninguna segunda tira de días** ni un `VidaReviewDayStrip`: `VidaDayStrip`
  gana dos props opcionales.
- **Ninguna variante nueva de `buildDayAgenda` ni de `buildDayExecution`**, y
  **ninguna regla nueva de emparejamiento, de «seguido» o de «sin registrar»**.
- **Ningún envoltorio de `localStorage`** ni clave nueva: el store del aparato
  gana un campo.
- **Ningún componente de `shared/ui` nuevo** ni ninguna prop nueva en ellos:
  `Card`, `Alert`, `Button`, `Skeleton`, `EmptyState`, `PageHeader`, `AppIcon`,
  `SteppedModal` bastan. **`IconPickerLazy` no aparece en esta feature**; los
  iconos de categoría se pintan con `AppIcon`, como en `VidaAgendaBlock`.
- **Ningún icono importado a pelo de `@fortawesome/free-solid-svg-icons`.**
- **Ninguna hoja de registrar nueva**: `VidaLogSessionSheet` se monta tal cual,
  con `initial`.
- **Ningún renombrado de «sin dato» en Hoy** (U2, opción a).

### Dónde NO va

- **La derivación de la revisión NO entra en `utils/vida-execution.utils.ts`.**
  Ese archivo lo importan `VidaHoyPage`, `VidaAgendaBlock`, `VidaAgendaSession`,
  `VidaAgendaNoData` y `VidaDayBudget`: crecerlo con el reparto por categoría y
  con siete días encarece a todos y acaba en el archivo de 1.500 líneas que nadie
  abre. (A1.)
- **La semana de la revisión NO va en `/app/vida/semana`.** Aquella planea
  (`activityDayPlanSet`, «Armar desde la plantilla») y esta mira lo real;
  fundirlas metería una mutación que reemplaza el día entero en una pantalla de
  lectura. Criterio 45: no se toca ni una línea de `VidaSemanaPage.tsx`, y de ahí
  se **copia** el molde de las filas.
- **La revisión NO va dentro de Hoy** (D1): dejaría la píldora muerta.
- **La tira de la revisión NO usa `clampToPlanningWindow`.** Ese recorte es de
  planear; aquí impediría revisar el domingo un lunes. (A3.)
- **El puente NO escribe en `activityDayPlan`.** Mueve la hora del **ítem de la
  plantilla**, y los días ya armados se quedan donde están (criterio 57).
- **«Dejarlo como está» NO va al API.** U1 se resuelve por la opción (a): el
  aparato, dicho en pantalla.
- **La barrita de los cuatro tramos NO se recalcula**: es `getExecutedBudget` en
  su forma cerrada, la misma que pinta `VidaDayBudget`.

### Tajadas, con sus archivos

**Las cuatro se quedan como las cortó el analista.** Miradas contra el código el
corte aguanta y el orden es el correcto: la 1 es lectura sobre aritmética ya
entregada, la 2 añade una derivación que no puede romper la 1, la 3 solo cablea
código revisado de FEAT-004 y la 4 es la única que multiplica consultas y toca
otra entidad. **Dos recortes, escritos, no silenciados:**

> **El criterio 8 se parte entre la tajada 1 y la 2.** «La historia habla de
> bloques» cierra en la 1. «Solo la frase de la tarde o la mañana puede nombrar
> una categoría, y solo si una se lleva la mitad de lo registrado en esa mitad
> del día» necesita **el reparto por categoría**, que es la tajada 2. En la 1 la
> historia **no nombra ninguna categoría** —que es la mitad segura del criterio:
> si no se sostiene, no se afirma— y la matización se añade en la 2, con su test.

> **El criterio 2 ya dice cómo se parte** (punto de Hoy en la 1, tres estados en
> la 4) y el **18** también (enlaces en la 1, hoja en la 3). No los toco.

| # | Qué hace | Archivos | Criterios que cierra | Estado |
|---|---|---|---|---|
| 1 | **El día se lee.** Tira con `?d=`, historia en prosa, cifra grande con planeado · registrado · fuera del plan · sin registrar, plan frente a real con el vocabulario de Hoy, «Fuera del plan», los dos carriles en escritorio, los días raros y los estados. Solo lectura, con las dos salidas como enlaces a Hoy. Y Hoy enlaza aquí. | **Crea:** `utils/vida-review.utils.ts` (+test) · `components/VidaReviewStory/` · `components/VidaReviewFigures/` · `components/VidaReviewRow/` · `components/VidaReviewLanes/` · `pages/VidaRevisionPage.module.scss` · `pages/VidaRevisionPage.test.tsx`. **Modifica:** `pages/VidaRevisionPage.tsx` · `utils/vida-window.utils.ts` (+test) · `routes/vida-paths.ts` · `components/VidaDayStrip/` · `components/VidaDayBudget/` (+test) · `pages/VidaHoyPage.tsx` | 1–7, 9–25; **8 a medias** (sin categoría) | in-review |
| 2 | **En qué se repartió el día.** Por categoría con la paleta del catálogo y dos barras, «Sin categoría», «Sin registrar» como fila propia, y los cuatro tramos más largos. | **Crea:** `components/VidaReviewCategories/` · `components/VidaReviewNoDataList/`. **Modifica:** `utils/vida-review.utils.ts` (+test) · `pages/VidaRevisionPage.tsx` (+test, `.module.scss`) | 26–34, **la otra mitad del 8** | pending |
| 3 | **La revisión rellena el día.** «Lo hice» por bloque y en la lista fantasma, «Registrar tiempo pasado» y «¿Qué pasó?» con la hoja de FEAT-004 dentro de la revisión, «Dejarlo así» con el store del aparato. | **Modifica:** `components/VidaReviewRow/` · `components/VidaReviewNoDataList/` · `components/VidaReviewFigures/` · `pages/VidaRevisionPage.tsx` (+test). **Crea:** nada. | 35–44 | pending |
| 4 | **La semana y el puente.** Siete filas con «seguidos de total», barrita y minutos, la frase de la semana, el punto de tres estados y **un solo aviso** hacia la plantilla. | **Crea:** `hooks/useVidaWeekFollowUps.ts` (+test) · `utils/vida-week-review.utils.ts` (+test) · `components/VidaReviewWeek/` · `components/VidaReviewBridge/`. **Modifica:** `pages/VidaRevisionPage.tsx` (+test) · `components/VidaDayStrip/` · `store/vida-device-notes.store.ts` (+test) · `hooks/useVidaWeekPlans.ts` (solo si hace falta `enabled`) | 45–60 | pending (**bloqueada hasta que FEAT-005 esté `delivered`**) |

Los criterios **61, 62 y 63** los cierra **el usuario**: están detrás del login y
con la API despierta. **Los agentes no entran con credenciales**, y eso queda
dicho, no disimulado.

### Cómo se verifica cada tajada

- **Siempre:** `pnpm typecheck` limpio, `pnpm lint` no peor que **14 errores / 0
  warnings**, `pnpm test` sin fallos nuevos sobre los **2** de `SearchSelect`, y
  **`pnpm build`** al cerrar (no solo `typecheck`). `graphify update .` después.
- **Tajada 1 — casi todo test puro de `vida-review.utils.ts`:**
  `resolveReviewDate` con `vi.setSystemTime` a **tres** horas (antes del fin del
  día → ayer; después → hoy; y con `?d=` futuro → no se abre, criterios 3 y 4);
  `buildReviewStory` con **las cinco formas** (día completo, a medias, sin plan
  con sesiones, sin nada, hoy abierto) comprobando que **ninguna** contiene
  «desperdici», «perdiste», «fallaste», «deberías» ni un verbo en pasado cerrado
  en el día abierto (criterios 5, 6, 7, 20, 21); `buildReviewLanes` con un
  **movido** (dos filas, **una sola tarjeta real**, criterio 17), con dos
  sesiones solapadas y con un día sin plan. Test de componente para 19 (texto
  literal del marco E y **sin** «Lo hice»: eso es la 3) y 23 (falla solo el plan
  / falla solo lo vivido → dos mensajes distintos, los dos con «Reintentar»,
  y **nunca** «no quedó nada apuntado»). El criterio 9 se prueba **contra
  `collectDayClosing`**: un test que afirma que la cifra grande y la frase de
  cierre de Hoy dan el mismo `followedCount` sobre el mismo día.
- **Tajada 2:** test puro de `buildCategoryBreakdown` (actividad sin categoría
  con fila propia y sus minutos **no repartidos**, criterio 27; «sin registrar»
  fuera del reparto, criterio 28), de `describeCategoryNote` (sin dato que la
  sostenga → `null`, criterio 30) y de `topNoDataSlices` (umbral de 30 y **lista
  vacía → sección no pintada**, criterios 31 y 32). Test de estructura para el
  29: la pantalla no contiene «cumplimiento» ni un `%` de categoría.
- **Tajada 3:** **espía sobre las mutaciones de `activityDayPlan`**: registrar,
  «Lo hice» y «Dejarlo así» **no llaman a ninguna** (criterios 35 y 41). Test de
  hoja con mutación que falla (43: se queda abierta, no pierde lo elegido).
  Store con `localStorage` simulado **y con uno que lanza** (38). Test de que
  tras un «Lo hice» la cifra y la historia cambian **sin recargar** (40), con
  `QueryClient` y la invalidación real.
- **Tajada 4:** test puro de `buildTemplateBridge` con **14 días a mano**: el
  caso que dispara, el que no llega al umbral, el de **sin sesiones de las que
  derivar la hora** (→ `null`, criterio 56), el de empate y el de **sin
  plantilla** (criterio 59). `buildWeekReview` con un día cuya consulta **falla**
  (la fila lo dice y **no** se lee «sin plan», criterio 52) y con un día sin dato
  (**«—»**, nunca «0», criterio 47). `useVidaWeekFollowUps.test.tsx` con
  `QueryClient`: **el día visto es un acierto de caché** y un día futuro **no
  pide nada** (criterio 53). Espía: «Moverlo a las HH:mm» llama a
  `vidaItemUpdate` y **a ninguna mutación de `activityDayPlan`** (criterio 57).
- **Lo visual, con arnés temporal** (`.html` + `.tsx` bajo `src/`, `MemoryRouter`,
  datos sintéticos, **borrado antes de reportar**): **375 px** con un nombre de
  60 caracteres y una razón de tres líneas (criterio 24), **tema oscuro**, y los
  **dos carriles** contra el render
  `http://localhost:5173/docs/vida/assets/07-vida-revision.html` (marco D). Con
  la ventana oculta: `document.getAnimations().forEach(a => a.finish())` y
  `dispatchEvent(new Event('scroll'))` tras `scrollTo`.

### Lo que no pude averiguar

- **No probé ni una llamada real.** Todo sale de leer el repositorio; `/app/*`
  está detrás del login y los agentes no entran. El recorrido del criterio 62 es
  del usuario, con la API despierta.
- **No medí el coste real de las 13 consultas de la semana** contra el API
  dormido de Render. `useVidaWeekPlans` dejó la misma anotación en FEAT-003 y
  nadie la ha cerrado. Si se notara, la salida está escrita allí: pedir el día
  visto y llenar las filas perezosamente, **sin cambiar la forma del hook**.
- **El conflicto entre los criterios 53 y 55 está sin decidir** (A5). Se
  construye la opción (a) —8 consultas más para el puente— salvo que alguien
  diga lo contrario antes de la tajada 4.
- **FEAT-005 está a medias mientras escribo esto** (tajada 1 de 4, con archivos
  sin commitear bajo `src/features/vida/`). Lo que este plan dice de
  `utils/vida-template.utils.ts` (`templateItemsForDay`, `templateItemTitle`,
  `describeItemDays`) es lo que hay **hoy en el árbol de trabajo**, no en HEAD:
  **la tajada 4 lo vuelve a comprobar antes de usarlo**.
- **`ENVIRONMENT.md` no lo toqué** (puede estar en uso por otros agentes), pero
  le falta una línea: la tabla de «Rutas o pantallas» dice
  «`/app/vida/revision` Vida · Revisión (cascarón hasta F5)» y dejará de ser
  cierto al cerrar la tajada 1.

## 3. Construction — feature-builder

### Tajada 1 — el día se lee

**Resumen para quien revise, en tres líneas:**

1. **`/app/vida/revision` dejó de ser un cascarón**: enseña el día contado —la
   historia en prosa, la cifra grande «N de M» con planeado · registrado ·
   fuera del plan y **sin registrar**, plan frente a real bloque a bloque con
   **las etiquetas de Hoy**, «Fuera del plan», los **dos carriles** en
   escritorio, los cuatro días raros y los cuatro estados—, **sin escribir
   nada**: en toda la pantalla no hay un solo `<button>` fuera de «Reintentar».
2. **Ni una consulta, clave, invalidación, ruta, mutación ni `localStorage`
   nuevos**: `useVidaDayData` + `buildDayAgenda` + `buildDayExecution` y un
   cuarto pase puro, `utils/vida-review.utils.ts`, que **consume**
   `vida-execution.utils.ts` sin ampliarlo ni copiarlo (A1). `vida-execution.utils.ts`
   está **sin tocar**.
3. **Lo que más probablemente rompí, por orden:** **(a)** `buildDayStrip` ganó un
   **tercer parámetro** y `VidaDayStrip` una **prop** — los dos con valor por
   defecto, pero los usa **Hoy**, que es la pantalla más viva del módulo: si la
   tira de Hoy llevara a la revisión o cambiara de días, es esto. **(b)**
   `VidaDayBudget` pinta ahora un enlace **dentro** de la frase de cierre
   (`reviewTo`): si la frase de cierre de Hoy se descoloca o se lee raro con
   lector de pantalla, es este cambio. **(c)** `vida-window.utils.ts` refactorizó
   `clampToPlanningWindow` para compartir el recorte con
   `clampToReviewWindow` — el comportamiento debería ser idéntico y hay test
   que lo afirma, pero **de esa función dependen Hoy y la semana**.

**Dónde está.** Se crean `utils/vida-review.utils.ts` (+`.test.ts`),
`components/VidaReviewStory/`, `components/VidaReviewFigures/`,
`components/VidaReviewRow/`, `components/VidaReviewLanes/`,
`pages/VidaRevisionPage.module.scss` y `pages/VidaRevisionPage.test.tsx`. Se
modifican `pages/VidaRevisionPage.tsx` (reescritura del cascarón),
`utils/vida-window.utils.ts` (+test), `routes/vida-paths.ts`,
`components/VidaDayStrip/VidaDayStrip.tsx`,
`components/VidaDayBudget/VidaDayBudget.tsx`, `pages/VidaHoyPage.tsx`, y dos
tests ajenos (`routes/vida.routes.test.tsx`, `pages/VidaHoyPage.test.tsx`).
**Exactamente la tabla del arquitecto**, con dos diferencias dichas abajo.

#### La línea base, corrida entera

| Qué | Antes (ENVIRONMENT.md) | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **exit 0** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0** (el warning que estrené —`dayFollowUps` fuera del `useMemo`— está arreglado, no silenciado) |
| `pnpm test` | 2 fallos de 1305 | **2 fallos de 1367** (+62 tests; los dos siguen siendo `SearchSelect`; 1 archivo rojo de 104) |
| `pnpm build` | 1.007,76 kB · `app-icons` 620,20 · `IconPicker` 4,64 | **exit 0**, chunk inicial **1.030,98 kB** (+23,22), `app-icons` **620,20** e `IconPicker` **4,64** **clavados**, CSS 230,79 kB (+8,65) |

`graphify update .`: **3498 nodos, 4101 aristas**.

**El +23 kB, dicho sin disimulo:** es todo código de pantalla (un util de ~700
líneas con sus tipos, cuatro componentes y una página de ~430). **Ningún icono**
entró en el arranque. **No lo pude mandar a un chunk perezoso** sin estrenar
`lazy()` en `routes/vida.routes.tsx`, que hoy importa **las ocho páginas de
Vida en directo**: hacerlo aquí sería cambiar la convención del router en una
tajada de lectura. Queda como deuda, con la misma dueña que el troceado que ya
arrastra FEAT-005.

#### Criterio por criterio, con la evidencia

| # | Estado | Evidencia |
|---|---|---|
| 1 | **cumplido** | `VidaRevisionPage.test.tsx` «deja de ser un cascarón»: `heading` nivel 1 «Revisión» + subtítulo **«Viernes 18 de septiembre · día cerrado»**. La ruta, `app-nav.config.ts` y el `⌘K` **sin tocar** (el diff no los nombra). |
| 2 | **cumplido** | Test «la tira lleva a **la revisión** de cada día»: los **siete** enlaces casan `^/app/vida/revision\?d=\d{4}-\d{2}-\d{2}$`. Son `<Link>`, así que el «atrás» del navegador sale gratis, como en Hoy. La URL la construye **un solo sitio**, `vidaPaths.revisionForDate`. El punto es el de Hoy (D8). |
| 3 | **cumplido** | `vida-review.utils.test.ts`, `resolveReviewDate`: a las 20:00 abre **ayer**; a las 23:05 y **en el minuto exacto** de las 23:00 abre **hoy**; el 1 de octubre abre el **30 de septiembre** (no inventa el día 0). Y en pantalla: sin `?d=`, la consulta que se pide es la del **viernes 18** con el reloj en el sábado 19 a las 9:24. |
| 4 | **cumplido** | Test «un día **futuro** no se revisa»: «Este día todavía no ha pasado», enlace **«Planearlo en Hoy»** a `/app/vida/hoy?d=2026-09-25`, y **cero cifras** (`figures` es `null` en el util y la región «Las cifras del día» no existe en el DOM). Además `useActivityDayFollowUpsQuery` ya está apagada en días futuros. |
| 5 | **cumplido** | Test «**hoy, aún abierto**»: subtítulo «Sábado 19 de septiembre · aún abierto», la historia abre **«Hasta ahora llevas…»**, **no aparece «Seguiste»** en ninguna parte, y se lee «Las cifras van hasta ahora». En puro: con el día abierto la frase (c) —lo que no se hizo— **no se compone**. |
| 6 | **cumplido** | `buildReviewStory`: **≤3 frases**, en el orden (a) seguiste N de M con su matiz, (b) lo que se salió con sus minutos, (c) lo que no se hizo con la razón entre comillas. Con **un solo dato** sale **una sola frase** («Seguiste el bloque que planeaste.»), probado. |
| 7 | **cumplido** | La historia **siempre abre por lo que sí salió** (la frase (a) es la primera en las cinco variantes). Test que genera **las cinco** y barre `desperdici|perdist|perdid|fallast|deberías|mal\b|vago|excusa|incumpl`: ninguna la contiene. `vida-vocabulary.test.ts` barre el módulo entero con `import.meta.glob`, así que **los archivos nuevos entran sin tocarlo**, y está en verde. |
| 8 | **la mitad que toca** | La historia habla **de bloques**. Test explícito de que **no nombra ninguna categoría** ni dice «la tarde se te fue ahí». La otra mitad es de la tajada 2, como escribió el arquitecto. |
| 9 | **cumplido** | Test que compara la cifra con `collectDayClosing` **sobre el mismo día**: `followedCount` 6 y `plannedCount` 8, iguales a los de la función de FEAT-004. En `vida-review.utils.ts` **no hay ninguna segunda definición de «seguido»** ni ningún umbral. |
| 10 | **cumplido** | Planeado **270 min → «4h 30»**, registrado **337 → «5h 37»**, fuera del plan **110 → «1h 50»**, y la línea «de lo registrado, **1h 50** fuera del plan». Medido en el navegador: los tres en pantalla. |
| 11 | **cumplido** | «Sin registrar 10h 53 · de las **16h 30** de tu día · **no hay dato, no se adivina**», con la cifra tomada de `legend('no-data')` (A9) y el día entero de `budget.dayMinutes` — los dos afirmados contra el presupuesto en el test. |
| 12 | **cumplido** | Test: la leyenda del presupuesto **suma el día entero** sobre el día del render (con dos sesiones y solapes), y `uncoveredMinutes` —lo único aritmético que estrené— da **exactamente** lo mismo que la leyenda sobre un día cerrado. |
| 13 | **cumplido** | Test que lee las ocho etiquetas de una vez: `✓ calcado · +11 min · no se pudo · +18 min · empezó +10 · −8 min · ✓ calcado · empezó +40 · no hecho`. **Todas salen de `describeBlockExecution`**; en los componentes nuevos no se escribe ni una. Ver el aviso **(2)** de abajo: dos casillas del render no se pueden reproducir con los umbrales de Hoy. |
| 14 | **cumplido** | Test de pantalla: con la nota del aparato puesta, el bloque se lee **«no se pudo»** + **«me fui directo a la llamada»** entre comillas; sin nota y con el día cerrado, **«no hecho · sin razón»**. Sin rojo: `.missing` usa `--color-text-secondary`, no el color de peligro (comprobado en el SCSS y en el navegador). |
| 15 | **cumplido** | La línea «Las razones de «no se pudo» se guardan en este aparato: en otro no estarán» se pinta **una vez** y **solo si hay alguna razón en pantalla** — hay test de las dos mitades. |
| 16 | **cumplido** | «Fuera del plan · 1 · 25m» con su renglón y la etiqueta *fuera del plan*; en puro, con el día del render, **2 · 1h 50** y los mismos minutos que la cifra grande (afirmado en el test: `offPlanMinutes === figures.offPlanMinutes`). |
| 17 | **cumplido** | Un movido de verdad (70 min, por encima del umbral de Hoy): **una sola fila**, con `['movido', '70 min tarde']`, y **no** aparece además en «Fuera del plan». En los carriles, **dos filas y una sola tarjeta real**: la sombra a las 19:00 (`plan.isShadow === true`) y la real a las 20:10 con `plan: null`. |
| 18 | **cumplido** | Test: «Ver el día en la agenda» y «Registrar tiempo pasado» son **enlaces** a `/app/vida/hoy?d=2026-09-18`, y `queryByRole('button')` **no encuentra nada** en toda la pantalla. Ningún botón muerto. |
| 19 | **cumplido** | Test del marco E: los **tres textos literales**, la lista «Lo que tenías planeado» en trazo fantasma (`data-ghost`, `real.kind === 'none'` en las cuatro filas), **sin cifra grande**, **sin «Lo hice»** (es la tajada 3) y «sin registrar» = **el día entero** (990 min). |
| 20 | **cumplido** | «Este día no tenía plan; registraste 2 cosas y 1h 40.», **sin lista fantasma** y **sin «N de M»** (`hasCount: false`; la región de cifras no contiene «/ N»). Lo registrado se lista con su hora. |
| 21 | **cumplido** | Una sola frase, sin reproche: «De este día no quedó nada apuntado» + «No llegó a tener plan y tampoco hay registros. Puede que lo vivieras sin abrir la app, y también es un día.», con la salida a Hoy. Test que afirma que **no** dice «no hiciste». |
| 22 | **cumplido con arnés** | En el navegador, a 1280 px: **hora · plan · real**, el plan quieto en su columna, lo **fuera del plan sin nada enfrente**, el movido como **sombra** a las 19:00 y su tarjeta a las 20:10, y los tramos **sin registrar ocupando su sitio con su tamaño** (alto proporcional a los minutos, con suelo y techo). A la izquierda, historia, cifras y **«Lo que no se hizo»** con su razón. Test de pantalla con `matchMedia` forzado: con ancho salen los carriles y **no** la sección suelta de «Fuera del plan». |
| 23 | **cumplido** | Cuatro estados **distintos** y probados: sin sesión («Entra para ver cómo te fue» + «Iniciar sesión»), cargando (esqueletos + «Cargando cómo fue tu día…»), **el plan** caído («No pudimos cargar tu plan de ese día» + Reintentar) y **lo vivido** caído («No pudimos leer lo que viviste ese día» + Reintentar, con el plan enseñado y **sin una sola etiqueta de «no hecho»**). En los cuatro, `queryByText(/no quedó nada apuntado/)` **no encuentra nada**. |
| 24 | **cumplido con arnés** | A **375 px**: `scrollWidth` **375 = clientWidth**, **cero** elementos desbordando, un nombre de **60 caracteres** recortado con puntos suspensivos sin empujar la fila, y una razón de **tres líneas** envuelta dentro de su tarjeta. Contraste medido componiendo el vidrio sobre el lienzo (187 textos): **oscuro 7,70:1 → 16,74:1**, **claro 6,39:1 → 17,61:1**. |
| 25 | **cumplido** | Test **en `VidaHoyPage.test.tsx`**: con el día cerrado y algo registrado aparece el enlace **«Ver cómo fue el día»** a `/app/vida/revision?d=2026-09-18`; con el día en marcha **no se pinta**. Es lo único que cambia en Hoy. |

#### Lo que decidí, y por qué

1. **`uncoveredMinutes` existe, y es la única aritmética nueva.** A9 dice que
   «sin registrar» sale de la leyenda del presupuesto, y así es **en el día
   cerrado**. Pero **ninguna de las tres formas del presupuesto tiene tramo
   «sin dato» en un día abierto**, y el criterio 5 pide leer las cifras «hasta
   ahora». Así que la revisión calcula ahí los minutos que ninguna sesión cubre
   entre el inicio del día y **ahora**, con la misma regla de «cada minuto una
   vez». **El cinturón es un test**: sobre un día cerrado, `uncoveredMinutes`
   da **exactamente** lo que dice la leyenda. Si algún día dejaran de coincidir,
   el fallo sería mío, no de `getExecutedBudget`.
2. **Los minutos de «fuera del plan» son minutos de sesión, no el tramo de la
   leyenda.** El criterio 10 los presenta como **parte de lo registrado** («de
   lo registrado, 1h 50 fuera del plan») y el 16 los repite en la cabecera de
   la sección: si la cifra saliera de la leyenda —que reparte el día sin
   solapes— la pantalla podría decir **dos números distintos de lo mismo**. Está
   escrito en el código y afirmado en un test.
3. **Móvil y escritorio no coexisten en el DOM.** La página elige con
   `useMediaQuery` —el hook que ya existe en `shared/hooks`— entre la lista
   compacta y los carriles, y el panel «Lo que no se hizo» solo se monta en
   escritorio. Es **a propósito**: FEAT-005 dejó anotado que pintar lo mismo dos
   veces obliga a acotar tests y hace que un lector de pantalla recorra el día
   dos veces. El coste, dicho: **un test de los carriles tiene que forzar
   `matchMedia`**, y lo hace.
4. **La historia tiene un matiz, y sale de bloques.** `describeNuance` compone
   «la mañana, calcada» (dos o más bloques seguidos antes de las 14:00, **todos**
   dentro de la tolerancia) y «X, N min más larga de lo que le diste» (el bloque
   cuya duración más se separó, por encima de la tolerancia de Hoy). Las dos
   piden dato; si no lo hay, **la frase va sin matiz**. Es la parte de la
   primera frase del render que se puede sostener sin categorías.
5. **`describeReviewWindowEdge` es función nueva en `vida-window.utils.ts`.**
   `VidaDayStrip` exige `edgeNote` y la de planear («Se planea esta semana y la
   que viene…») sería **falsa** aquí. Dice «Se miran los días ya vividos: desde
   el lunes 31.» El arquitecto no la listó; es una línea, en el archivo que él
   eligió.
6. **Los componentes son de tres archivos, no de cuatro.** `index.ts` + `.tsx` +
   `.module.scss`, como **todos** los componentes del módulo (`VidaAgendaBlock`,
   `VidaAgendaNoData`…), y las afirmaciones de pantalla viven en
   `pages/VidaRevisionPage.test.tsx`, que es el archivo de test que la tabla del
   arquitecto sí pide. Ningún componente del módulo tiene test propio.
7. **`VidaReviewRow` exporta también `VidaReviewOffPlanRow`.** Es la misma
   anatomía con la columna de plan vacía; separarlo en un quinto componente
   habría duplicado el SCSS entero.
8. **No creé `VidaDayBudget.test.tsx`.** La tabla lo pedía, pero **ese archivo no
   existe hoy** y la frase de cierre se prueba **dentro de `VidaHoyPage.test.tsx`**,
   que es donde vive su contexto (día cerrado, sesiones, reloj). El criterio 25
   se afirma ahí, con el `href` completo. Crear un test de componente aislado
   para una prop habría duplicado la fixture del día cerrado.

#### Avisos para quien revise, por orden de riesgo

1. **`buildDayStrip` y `VidaDayStrip` cambiaron de forma, y los usa Hoy.** Los
   dos cambios son **aditivos y con valor por defecto** —tercer parámetro
   `window = getPlanningWindow(today)` y prop `basePath = vidaPaths.hoyForDate`—
   y hay un test que afirma que **sin el tercer parámetro el resultado es
   idéntico** al de antes. Pero si algo va mal en la tira de Hoy, empieza por
   aquí. `clampToPlanningWindow` también se reescribió para delegar en un
   `clampToWindow` privado: mismo comportamiento, mismos tests de siempre en
   verde.
2. **Dos casillas del render aprobado no se pueden reproducir, y seguí al
   código.** El marco A escribe «empezó +5» para un inicio de **+5 min** y
   «movido · 40 min tarde» para un paseo **40 min** tarde. Con las constantes
   que ya existen —`VIDA_ON_PLAN_TOLERANCE_MINUTES = 5` (inclusive) y
   `VIDA_MOVED_THRESHOLD_MINUTES = 60`— eso se lee **«✓ calcado» sin etiqueta de
   inicio** y **«empezó +40»**. El criterio 13 dice «exactamente las de Hoy» y el
   9 dice «el mismo emparejamiento»: **manda el código de FEAT-004**. Queda
   dicho por si el usuario prefiere mover los umbrales — que sería tocar Hoy.
3. **Un test ajeno quedó derogado y reemplazado por algo más fuerte**:
   `vida.routes.test.tsx` afirmaba que `/app/vida/revision` «sigue siendo un
   cascarón». Ahora afirma que **sin sesión enseña la vía para entrar**
   («Entra para ver cómo te fue» + «Iniciar sesión»), que es el criterio 23. Con
   eso **ya no queda ningún cascarón** en esa lista. `AppLayout.test.tsx` y
   `app-nav.config.test.ts` están **sin tocar**: la píldora sigue diciendo
   «Revisión» y el `⌘K` sigue apuntando a `vidaPaths.revision`.
4. **La revisión monta `useVidaDayHours()` por su cuenta**, además del que monta
   `useVidaDayData` por dentro, porque «con qué día se entra» depende del fin
   del día de Vida **antes** de saber qué día es. Es la **misma** consulta de
   ajustes (`settingsKeys.my`), deduplicada por React Query: **no es una
   consulta más**, pero es un hook más montado.
5. **El chunk inicial subió 23,22 kB** (ver arriba). Nada de iconos.

#### Lo que descubrí y no estaba en el plan

- **El render y los umbrales de Hoy no cuadran** (aviso 2). Es lo más
  sustantivo: quien mire la pantalla al lado del render verá dos etiquetas
  distintas en dos filas, y **no es un fallo**.
- **El día abierto se queda sin «sin registrar» en el presupuesto**, y por eso
  existe `uncoveredMinutes`. El plan daba por hecho que la leyenda servía
  siempre.
- **`formatDurationMinutes` escribe «1 h 3 min»** donde el render escribe
  «63 min». Es el formateador que ya usa la agenda de Hoy y no lo cambié: dos
  formateadores para lo mismo sería peor. Se ve en las filas largas.
- **Las sesiones sin categoría se pintan con el icono genérico**
  (`UNCATEGORIZED_GROUP_ICON`), igual que en el catálogo. El render les da
  icono porque todas sus actividades tienen categoría.
- **`docs/vida/assets/08-vida-entiende.html`** apareció sin versionar en el
  árbol (render de otra fase). **No lo toqué.**

#### Lo que no pude comprobar, dicho sin disimular

- **Ni una llamada real al API.** `/app/*` está detrás del login y **los agentes
  no entran con credenciales**: todo lo de arriba sale de tests con las
  consultas simuladas y de un **arnés temporal** (`src/harness-revision.html` +
  `.tsx`) que renderizaba los componentes con datos sintéticos y **está
  borrado**. La revisión nunca se ha visto con un día de verdad.
- **Los 375 px y el tema oscuro se midieron en el arnés**, no dentro de
  `/app/vida/revision`.
- **El criterio 61** (leerse en diez segundos) **es del usuario**, y el **62** y
  el **63** también.

#### El recorrido manual, paso a paso (del usuario, con la API despierta)

Render se duerme a los 15 min y tarda ~1 min en despertar.

1. Entrar en **`/app/vida/hoy`** y vivir un día a medias: empezar y terminar
   algo del plan, registrar algo que no estaba, dejar un bloque sin hacer.
2. Al pasar la hora de fin del día (los ajustes de Vida), comprobar que bajo la
   frase de cierre aparece **«Ver cómo fue el día»**. *(criterio 25)*
3. Tocarlo: tiene que abrir **`/app/vida/revision?d=<ese día>`** con la píldora
   «Revisión» encendida.
4. Leer **la historia** (tres frases como mucho), la **cifra grande** y
   comprobar que **las etiquetas son las mismas** que se vieron durante el día.
   *(criterios 6, 9 y 13)*
5. Comprobar que **«Sin registrar»** dice una cifra que cuadra con el día
   entero del horario de Vida. *(criterio 11)*
6. Bajar al pie y comprobar que **«Ver el día en la agenda»** y **«Registrar
   tiempo pasado»** llevan a **Hoy de ese día**. *(criterio 18)*
7. Volver atrás con el botón del navegador: tiene que volver a Hoy sin perder
   el día. Y moverse por **la tira**: cada día abre **su revisión**, no Hoy.
   *(criterio 2)*
8. Salir de la app, entrar de nuevo en **`/app/vida/revision` sin `?d=`** antes
   del fin del día: tiene que abrirse **ayer**. Después del fin del día: **hoy**.
   *(criterio 3)*
9. Tocar en la tira un día **de mañana**: «Este día todavía no ha pasado», sin
   cifras. *(criterio 4)*
10. Abrir **hoy** desde la tira a media tarde: «aún abierto», «Hasta ahora
    llevas…» y ninguna frase en pasado cerrado. *(criterio 5)*
11. Abrir un día viejo **del que no se registró nada**: el texto del marco E, el
    plan en trazo fantasma y **ningún** «Lo hice» (eso llega en la tajada 3).
    *(criterio 19)*
12. Marcar un bloque como **«No se pudo»** con una razón desde Hoy, volver a la
    revisión y comprobar que la razón sale entre comillas **y** que la pantalla
    avisa de que eso **vive en este aparato**. *(criterios 14 y 15)*
13. En **escritorio**, comprobar los **dos carriles** al lado del render
    `docs/vida/assets/07-vida-revision.html`, marco D. *(criterio 22)*
14. Cronometrar: **¿se lee en diez segundos y sin una palabra de reproche?**
    *(criterio 61, el de la fase)*

## 4. Review — feature-reviewer
