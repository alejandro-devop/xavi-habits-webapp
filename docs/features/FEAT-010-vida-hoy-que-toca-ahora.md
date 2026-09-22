---
id: FEAT-010
title: Hoy — qué toca ahora: una tarjeta arriba con el play delante y «Otra cosa» al lado
status: specified
architect: yes    # arritmética nueva (elegir «lo que toca» con sus umbrales y su desempate) sobre una pantalla que otra feature toca a la vez
area: features/vida
requested: 2026-09-22
updated: 2026-09-22
---

# FEAT-010 — Hoy — qué toca ahora: una tarjeta arriba con el play delante y «Otra cosa» al lado

## 1. The request — feature-analyst

**Summary for whoever's next:** arriba de la lista de Hoy, **una sola tarjeta que
cambia de cara** —toca algo · se pasó la hora · en marcha · no toca nada— con el
play delante y «Otra cosa» siempre al lado; la lista de abajo **no se toca**. La
primera tajada son **las caras 1 y 4**: la app dice qué toca y lo empiezas de un
toque, y cuando no toca nada dice cuánto tienes libre.

**What problem it solves:** para empezar algo, hoy hay que **bajar a buscar el
bloque** en la agenda y pulsar su «▶ Empezar» pequeño. El problema no es que
falte un botón —hay dos, y funcionan—: es que **la pantalla que sabe qué toca no
lo dice**, así que el usuario hace de índice de su propio plan justo en el
momento en que menos ganas tiene de leer una lista. Y hay un segundo problema,
que es el que hizo cambiar de opinión sobre un diseño ya aprobado: **cuando se
pasa la hora, la pantalla no ayuda a decidir**. El dato que hace falta a las 9:25
no es «esto era a las 9:00», es **«si lo empiezas ahora acabas a las 9:55»** —y
la salida de «ya lo hice» tiene que estar escrita, no escondida.

**Who it's for:** el usuario del módulo Vida, **mientras vive el día** y en la
pantalla que más abre (`/app/vida/hoy`, solo en **hoy**). Concretamente en los
cuatro momentos que ya nombra el render: cuando está a punto de tocar algo,
cuando la hora ya pasó, cuando está en marcha, y cuando está en un hueco.

**User's words:**

> «en la vista de "hoy" donde ya ejecuto mi vida, como me lo imagino (y sé que ya
> había aprobado el diseño, pero ya usándolo cambié de opinión) me imagino la app
> sugiriéndome iniciar la actividad que corresponde según la plantilla con un
> botón de play, o un botón para iniciar libre la acción»

Y sobre el render, al aprobarlo: **«esooo así lo tenía en mi cabeza»**.

**El render es la fuente de verdad y no se re-discute:**
`docs/vida/assets/11-vida-hoy-empezar.html`, **aprobado el 2026-09-22**
(`http://localhost:5173/docs/vida/assets/11-vida-hoy-empezar.html`). Sus cuatro
marcos y **las cuatro notas del pie** («un solo sitio que cambia de cara» ·
«"Otra cosa" nunca desaparece» · «la lista de abajo no se toca» · «ninguna
palabra de reproche») son parte de la spec. Esto sale de **usar la app**, así que
manda sobre cualquier lectura anterior de la misma pantalla.

**Out of scope:** (lo que alguien podría dar por incluido y NO lo está)

- **Pausar y reanudar una sesión.** El render dibuja «Pausar» en la cara 3 y
  **no se puede construir con verdad**: el API no lo modela (una sesión es
  `startTime` + `durationMinutes`) y FEAT-004 lo dejó fuera explícitamente. Es
  **D1**, con salida por defecto y sin bloquear.
- **Notificaciones, alarmas, sonidos, vibración o recordatorios** cuando llega la
  hora de un bloque. La tarjeta **cambia de cara y se calla**; nada interrumpe
  (FEAT-004, criterio 9). Tampoco notificaciones del navegador ni permisos.
- **Tocar la lista de abajo.** Ni se quitan sus «▶ Empezar» (FEAT-004, criterio
  1), ni se reordena, ni se pliega, ni se resalta el bloque propuesto de otra
  forma. **Lo de arriba te ahorra buscarlo, no te lo quita.**
- **Cambiar el plan.** Empezar a las 9:25 un bloque de las 9:00 **no reescribe
  el plan**: no mueve el bloque, no lo borra, no lo crea. Lo real va encima
  (FEAT-004, criterio 37).
- **Sugerir desde la plantilla lo que no está en el plan del día.** La cara 4
  **no rellena el hueco con una idea**: eso ya lo ofrece el hueco de FEAT-003
  (fichas de plantilla), y ahí se queda.
- **Registrar en el hueco que ya pasó**: es **FEAT-011**, dueña de las filas de
  hueco. Aquí la cara 4 **habla** del hueco actual y no lo pinta.
- **Avisos con historial** («sueles tardar 55 min», «los martes empiezas a las
  9:30»). Son de **FEAT-007** y viven **pegados al bloque**, dentro de la lista.
  La tarjeta no los repite.
- **Una lista de «lo que viene».** Se propone **una cosa**, nunca dos, y no hay
  «siguiente: …» debajo.
- **Días que no son hoy.** Ni pasado ni futuro: criterio 180.
- **Poder cerrar u ocultar la tarjeta**, y recordar que la cerraste. No hay
  ajuste, ni «no me lo enseñes más», ni `localStorage` nuevo.
- **Crear una actividad desde aquí.** «Otra cosa» abre la hoja que ya existe; si
  la actividad no está, se enlaza a `/app/vida/actividades` (FEAT-004, criterio
  34).
- **Backend, rutas nuevas, consultas nuevas.** Nada de esto. Cero documentos
  GraphQL nuevos.
- **Deshacer general.** Lo que se pueda deshacer es lo que ya se podía (la sesión
  empezada por error, FEAT-004 criterio 14; el «Lo hice», criterio 41).

**Acceptance criteria:** *(la numeración del módulo la dejó FEAT-009 en el 171;
FEAT-008 ocupa 107–134 y FEAT-009 140–171, así que **esta feature empieza en el
180** y deja hueco.)*

*Dónde y cuándo existe la tarjeta, y la cara 1 (tajada 1)*

- [ ] 180. **Solo en hoy, y solo dentro del día.** La tarjeta se pinta cuando
  `isToday` **y** `nowMinutes !== null` **y** el reloj cae dentro de
  `[vidaDayStartTime, vidaDayEndTime)`. En un día **pasado** o **futuro** no se
  pinta **ningún nodo** de la tarjeta —ni vacía, ni oculta por CSS— y la pantalla
  queda exactamente como está hoy. Antes de que empiece el día o después de que
  se cierre, tampoco (ahí manda la frase de cierre de FEAT-004, criterio 51).
- [ ] 181. **Su sitio:** entre el presupuesto (`VidaDayBudget`) y la lista de la
  agenda (`<ol>` de `VidaHoyPage.tsx:627`), en móvil y en escritorio. La lista
  **no cambia**: un test afirma que, con la tarjeta en pantalla, el «▶ Empezar»
  de `VidaAgendaBlock` (`VidaAgendaBlock.tsx:440`) **sigue presente y
  funcionando**, y que «Empezar algo» sigue en `VidaDayActions`
  (`VidaHoyPage.tsx:892`).
- [ ] 182. **El umbral de «está a punto»:** un bloque es «lo que toca» cuando el
  reloj cae en `[startMinutes − VIDA_LEAD_AHEAD_MINUTES, endMinutes)`, con
  **`VIDA_LEAD_AHEAD_MINUTES = 10`**, constante con nombre y en un solo sitio. A
  11 min no se ofrece; a 10, sí; a 0, sí; en `endMinutes` exacto deja de ser cara
  1 y pasa a cara 2. *(Diez minutos porque el render enseña 8:58 para un bloque
  de las 9:00: la ventana tiene que coger el rato en que estás rematando lo
  anterior, y ser lo bastante corta para que no sea «todo el día». Además el
  reloj de la pantalla tiquea **cada 60 s**, así que diez minutos son diez tics:
  el umbral se nota, no parpadea.)*
- [ ] 183. **La cara 1 se lee** «Ahora toca», la actividad con su icono y color de
  categoría, «H:MM → H:MM · N min», el play **«Empezar»** y **«Otra cosa»** al
  lado. Todos los números salen del bloque; ninguno se redondea ni se adorna. La
  duración se escribe con `formatDurationFromMinutes` (el mismo de toda Vida, y
  el que FEAT-008 está tocando): «1 h 20», no «80 min» por su cuenta.
- [ ] 184. **Dos bloques a la misma hora, o uno solapando a otro:** entre los
  candidatos gana el de **`startMinutes` menor**; empate → el de **menos
  duración** (acaba antes y libera al otro); empate → **el orden que ya da
  `buildDayAgenda`**. **Nunca se pintan dos.** Es una función **pura**, con test
  de los tres casos.
- [ ] 185. **Prioridad entre caras**, en este orden y sin excepciones:
  **en marcha > toca algo > se pasó la hora > no toca nada**. Un bloque en su
  hora manda sobre uno cuya hora ya pasó.
- [ ] 186. **No se propone lo ya resuelto:** un bloque con ejecución asignada
  (`execution.byBlockId[id]`, cualquiera de `on-plan · changed · moved ·
  running`) o con una salida dada («Lo hice», «Hice otra cosa», «No se pudo») **no
  es candidato**, ni en la cara 1 ni en la 2.
- [ ] 187. **«Otra cosa» nunca desaparece** de las caras 1 y 2, con su propio
  peso visual (secundario, pero siempre a la vista, nunca en un menú). Llama a
  **`openLogSheet({ mode: 'start' })`**, exactamente la misma hoja que
  `VidaDayActions`: **no hay una segunda hoja de «qué»** (FEAT-004, criterio 38).
- [ ] 188. **El play empieza de verdad, por la vía que ya existe:**
  `useStartActivityFollowUpMutation` → `activityFollowUpStart`, con `startTime` =
  **la hora del reloj** (FEAT-004, criterio 17) y `date` = la fecha local. La
  pantalla pasa a la cara 3 **sin recargar**, con las invalidaciones que ya hay
  (`invalidateFollowUpQueries`). Dos toques **no crean dos sesiones** (FEAT-004,
  criterio 13): mientras la mutación vuela quedan inhabilitados **el play de la
  tarjeta y el «▶ Empezar» de ese bloque en la lista**.
- [ ] 189. **Si no se puede empezar, no se pinta un botón que no va a
  funcionar:** con `canStart === false` (`VidaHoyPage.tsx:157` — sin sesión de
  usuario, o con la pregunta de la sesión abierta de otro día pendiente, FEAT-004
  criterios 16 y 54), la tarjeta **no ofrece play**, dice en una línea qué falta y
  lleva a la pregunta. Sin spinner eterno (FEAT-004, criterio 64).

*La cara 4 — no toca nada (tajada 1)*

- [ ] 190. **Sin candidato, cara 4:** «Ahora no toca nada», «Tienes libre hasta
  las **H:MM**, cuando entra **<bloque>**. Son **N h N**», y **un solo** botón,
  «Empezar algo» (el mismo `openLogSheet({ mode: 'start' })`). **No se inventa
  ninguna sugerencia** para rellenar el hueco.
- [ ] 191. **Sus números salen del hueco que ya calcula la agenda:** el
  `AgendaGap` que contiene el reloj —el que `buildDayAgenda` ya parte con la
  marca de «ahora»— y su `nextBlockTitle`. Si ese hueco lo cierra el fin del día
  (`nextBlockTitle === null`), **se dice así** y **no se nombra un bloque que no
  existe**.
- [ ] 192. **Día sin plan, o con plan pero sin ningún bloque por delante:** cara
  4, con el tiempo libre hasta el fin del día y su play. Ni cara 1, ni cara 2, ni
  una palabra que suene a que falta algo; el «aún no hay plan» que ya existe se
  queda donde está y **la tarjeta no lo repite**.

*La cara 2 — se pasó la hora (tajada 2)*

- [ ] 193. **Cara 2** cuando el reloj pasó de `endMinutes` de un bloque sin
  resolver y estamos dentro de la ventana del criterio 194: el titular es
  **«Estaba para las H:MM»**. En esta cara **no aparecen** «vas tarde», «llegas
  tarde», «te lo saltaste», «pendiente», «no hecho», «aún no» ni «todavía».
- [ ] 194. **Hasta cuándo se ofrece:** desde su `endMinutes` y hasta lo que
  ocurra **antes**: (a) que el **siguiente bloque entre en su ventana de cara 1**
  (`start − VIDA_LEAD_AHEAD_MINUTES`), o (b) **`VIDA_LEAD_LATE_WINDOW_MINUTES =
  120`** minutos desde ese `endMinutes`. Pasado eso **deja de proponerse arriba**
  y el bloque **sigue en la lista con sus tres salidas** (FEAT-004, criterio 40):
  no se pierde, solo deja de estar delante. *(Dos horas porque es lo que aguanta
  siendo verdad «si lo empiezas ahora, acabas a las…»: proponer el desayuno a las
  13:00 es ruido, y lo que toque a esa hora vale más. Y lo siguiente siempre
  manda, porque es lo único que aún se puede hacer a su hora.)*
- [ ] 195. **La cuenta que hace falta:** «acabarías a las **H:MM**» = la hora del
  reloj **+ la duración planeada**, literal, recalculada en cada tic. Si esa hora
  cae **después del inicio del siguiente bloque**, la tarjeta lo dice como dato
  («se te juntaría con Daily meeting»), **sin opinar y sin impedir nada**: se
  enseña lo que es cierto.
- [ ] 196. **El play dice «Empezar ahora»** y guarda **la hora del reloj**, no la
  planeada (FEAT-004, criterio 17): empezarlo a las 9:25 registra 9:25, y el plan
  se queda quieto en las 9:00.
- [ ] 197. **La tercera salida está escrita, no escondida:** «Si ya desayunaste,
  **dilo y listo**: "Lo hice"», con **«Lo hice» como control real en la tarjeta**,
  que llama a **la misma función que ya usan Hoy y Revisión** (`logSessionInput` +
  `plannedSessionMinutes`, FEAT-004 criterio 41) — **no una segunda aritmética**.
  Tras usarlo el bloque pasa a hecho **sin recargar** y la tarjeta pasa a la cara
  que toque.

*La cara 3 — en marcha (tajada 3)*

- [ ] 198. **Con una sesión viva de hoy, el sugeridor se calla:** el mismo sitio
  pasa a ser el cronómetro — «En marcha», la actividad, «Empezaste a las H:MM ·
  de N min», el reloj grande y **«Terminar»**. **No se sugiere nada más** mientras
  dura.
- [ ] 199. **El cronómetro es el que ya existe**: `useElapsedTimer` de FEAT-004
  (cuenta desde `startTime` con `Date.now()`, no acumulando tics). Recargar **no
  lo reinicia**, avanza **al menos una vez por segundo** y al desmontarse **no
  deja ningún intervalo vivo** (criterios 3 y 4). **No se escribe un segundo
  cronómetro.**
- [ ] 200. **«Te quedan N min de lo que pusiste»**, y **cuando se pasa no dice
  «te quedan −5»**: pasa a lo que ya dice FEAT-004 criterio 9 («llevas 52 min ·
  planeado 45»), sin alarma, sin color de alarma, sin modal y sin sonido.
- [ ] 201. **«Terminar» es la misma acción de un toque** de FEAT-004 criterio 5,
  con su toast y su «añadir una nota». **No hay una segunda forma de cerrar** una
  sesión, ni un segundo modal de cierre.
- [ ] 202. Una sesión **fuera del plan** (sin bloque que le corresponda) también
  pinta la cara 3, con su nombre y sin inventarle una hora planeada. Una sesión
  **de otro día** **no** la pinta: ahí manda la pregunta de FEAT-004 (criterios
  16 y 54).
- [ ] 203. **La barra fija de sesión no se toca**: sigue en todas las pantallas
  del módulo, Hoy incluida (FEAT-004, criterio 7). Queda dicho que en Hoy se ven
  las dos cosas a la vez (**D2**).

*Transversales — las cierra cada tajada en la cara que pinte*

- [ ] 204. **Cuesta cero:** la tarjeta se deriva en un `useMemo` **puro** de
  (agenda, ejecución, sesión abierta, `nowMinutes`) y el reloj es
  **`useVidaNowMinute(isToday)`, que ya está montado** (`VidaHoyPage.tsx:145`,
  tic de 60 s). **Cero consultas nuevas y cero temporizadores nuevos**, salvo el
  cronómetro de la cara 3 (criterio 199). Un test con espías afirma que abrir Hoy
  con la tarjeta cuesta **las mismas consultas** que sin ella.
- [ ] 205. **El foco no salta:** cambiar de cara **no desmonta y remonta** la
  tarjeta ni mueve el foco; si el foco está en el play y la cara cambia, se queda
  donde estaba o en el botón equivalente, **nunca en `body`**. La tarjeta tampoco
  roba el foco al montarse ni hace `scrollIntoView` (el desplazamiento a «Ahora»
  de FEAT-003 sigue siendo el único de la pantalla).
- [ ] 206. **Nombre accesible de verdad:** el play se anuncia **«Empezar
  Desayunar»** (cara 1), **«Empezar Desayunar ahora»** (cara 2) y **«Empezar
  algo»** (cara 4); «Otra cosa» se anuncia **«Empezar otra cosa»**. El «▶» es
  decorativo (`aria-hidden`). **Ninguno se queda en «Empezar» a secas** ni en el
  triángulo.
- [ ] 207. **Cómo se anuncia el cambio, sin dar la lata:** la tarjeta es una
  región con nombre («Qué toca ahora») y **solo la línea del titular** vive en
  `aria-live="polite"`; se anuncia **cuando cambia la cara o la actividad
  propuesta**, no en cada tic ni al volver a la pestaña. Nunca `assertive` ni
  `role="alert"` (la misma regla que se aplicó en FEAT-007). **El cronómetro
  queda fuera de la región viva**: no se anuncia cada segundo.
- [ ] 208. **Cargando:** con el plan o lo vivido en vuelo, la tarjeta **no afirma
  nada** —ni «ahora toca», ni «no toca nada»—: esqueleto o nada (FEAT-004,
  criterio 57).
- [ ] 209. **Error:** si falla `activityDayFollowUps` y el plan sí carga, la
  tarjeta **no propone** (no sabe qué está hecho) y **no dice «no toca nada»**:
  dice que falta lo vivido y deja solo «Empezar algo» (FEAT-004, criterio 58). Si
  falla el plan, no hay tarjeta.
- [ ] 210. **Ni una palabra de reproche en las cuatro caras, y la cara 2 es la
  prueba:** un test barre el texto del DOM de las cuatro y afirma que no aparecen
  «tarde», «te saltaste», «perdiste», «fallaste», «deberías», «desperdicio»,
  «vacío» ni «todavía no has» (FEAT-004, criterio 59). «Estaba para las 9:00» es
  un dato; «vas tarde» sería una opinión sobre él.
- [ ] 211. **Todo lo que enseña es cierto:** la hora de fin, los minutos libres,
  el nombre del siguiente bloque y la duración salen del **mismo
  `buildDayAgenda`** que pinta la lista. Un test compara el texto de la tarjeta
  con el de la lista y afirma que **dicen los mismos minutos y el mismo nombre**.
- [ ] 212. **375 px:** las cuatro caras sin scroll horizontal; play y «Otra cosa»
  caben en una fila sin desbordar; la tarjeta **no tapa la marca de «Ahora»** ni
  obliga a desplazarse para ver el primer bloque de la lista.
- [ ] 213. **Texto largo:** un nombre de ~60 caracteres no rompe ninguna cara, no
  produce scroll horizontal y no empuja el play fuera de la tarjeta; se recorta
  con ellipsis y el nombre completo sigue disponible para quien lo necesite.
- [ ] 214. **Oscuro:** los cuatro trazos (mint, ámbar, violeta, neutro) se
  distinguen **entre sí** y del fondo, y el violeta de la cara 3 **no se confunde**
  ni con la marca de «ahora» ni con el **violeta punteado** de los avisos de
  FEAT-007. **La tarjeta nunca usa trazo punteado violeta.**
- [ ] 215. **Convive con FEAT-007:** su aviso sigue **pegado al bloque, dentro de
  la lista**, y la tarjeta **no lo duplica** ni cuenta para su máximo de dos. Con
  el bloque propuesto trayendo aviso se ven las dos cosas y **ninguna tapa a la
  otra**.
- [ ] 216. **Frontera con FEAT-011:** la cara 4 **habla** del hueco actual y **no
  lo pinta**: no lo hace pulsable, no ofrece registrar y no cambia ni una fila de
  hueco. Las filas de hueco —incluidas las de los huecos pasados— son de
  FEAT-011. **Ninguna de las dos depende de la otra** para construirse.
- [ ] 217. **Línea base no empeorada** (`docs/features/ENVIRONMENT.md`):
  `pnpm typecheck` limpio, `pnpm lint` no peor que 14 errores / 0 warnings,
  `pnpm test` sin fallos nuevos sobre los 2 preexistentes, `pnpm build` exit 0 y
  el chunk inicial sin crecer por iconos. **Ningún documento GraphQL nuevo**; si
  alguno se tocara, entra en `src/features/vida/graphql/contracts.test.ts`.
- [ ] 218. **Criterio de fase, y lo comprueba el usuario** (con la API despierta;
  Render tarda ~1 min): un día real de principio a fin —a las 8:58 la tarjeta
  propone el desayuno y un toque lo empieza · el mismo sitio pasa a ser el
  cronómetro y «Terminar» lo cierra · enseguida propone lo siguiente · una hora
  que se pasa se lee **sin una palabra de bronca** y «Lo hice» la cierra · un
  hueco dice cuánto queda libre y «Empezar algo» arranca lo que sea— **sin haber
  bajado a buscar un bloque en la lista ni una sola vez**.

**Slices:** (vertical, cada una usable sola)

| # | What it does | State |
|---|---|---|
| 1 | **La tarjeta existe y sugiere: caras 1 y 4.** Solo en hoy y dentro del día, entre el presupuesto y la lista. Cuando un bloque está a punto (10 min) o en su hora: «Ahora toca», play que empieza de verdad por la vía de FEAT-004, y «Otra cosa» al lado. Cuando no toca nada: cuánto tienes libre y hasta cuándo, con el play suelto. La lista no se toca. **Ya es útil sola:** se deja de buscar el bloque en la lista, que es literalmente lo que pidió. Criterios 180–192 y los transversales 204–217 en lo que apliquen. | pending |
| 2 | **Se pasó la hora: la cara 2.** «Estaba para las 9:00», la cuenta de a qué hora acabarías si empiezas ahora, «Empezar ahora» guardando la hora del reloj, y la tercera salida escrita: «Lo hice», con la función que ya existe. Criterios 193–197 + 210 sobre esta cara. | pending |
| 3 | **En marcha: la cara 3.** El sugeridor se calla y el mismo sitio es el cronómetro, con lo que queda de lo que pusiste y «Terminar» de un toque; el de FEAT-004, no uno nuevo. Criterios 198–203. | pending |

**Por qué este orden:** la 1 es la que resuelve el pedido literal y **no depende
de nada nuevo** (el play ya existe, el hueco ya está calculado); la 2 añade la
única aritmética que no está escrita («acabarías a las…») sobre una tarjeta que
ya vive; la 3 es **la que menos cambia la vida del usuario** —con una sesión viva
ya tiene la barra fija de FEAT-004 con su cronómetro y su «Terminar»—, así que va
la última y, si hubiera que parar, es la que menos duele dejar a medias.

**Architect? yes** porque, aunque la tarjeta se apoya entera en cosas que ya
existen, hay **tres decisiones que no deben tomarse a mitad de tajada**:

1. **Elegir «lo que toca» es aritmética nueva y con desempate** (criterios 182,
   184, 185, 194). Tiene que ser **pura y probada**, y hay que decidir de una vez
   si crece dentro de `utils/vida-agenda.utils.ts` —donde ya viven
   `buildDayAgenda`, `findNextBlockId` y `suggestionsForGap`— o en un hermano
   (`vida-lead.utils.ts`). Es exactamente el punto 3 del arquitecto de FEAT-004,
   y allí se decidió una vez y salió bien.
2. **Dos features tocan Hoy a la vez** (esta y **FEAT-011**), y una tercera
   —**FEAT-008**— está en construcción sobre `vida-time.utils.ts` y
   `VidaDurationPills`, de donde sale el formato de las duraciones que la tarjeta
   escribe. Quién toca qué archivo y en qué orden no lo decide un constructor con
   la rama a medias.
3. **Hay dos cronómetros en pantalla a la vez** (la barra fija de FEAT-004 y la
   cara 3) y **dos entradas a la misma mutación** (el play y el «▶ Empezar» del
   bloque). Que no se dupliquen ni se contradigan es una decisión de dónde vive el
   estado, no de estilo.

**Lo que ya existe y NO se vuelve a construir** (con su ruta, verificado):

- **Empezar un bloque:** `VidaAgendaBlock.tsx:440` («▶ Empezar», solo en hoy,
  FEAT-004 criterios 1 y 2) y `useStartActivityFollowUpMutation` →
  `activityFollowUpStart`.
- **Empezar algo suelto:** `VidaDayActions` desde `VidaHoyPage.tsx:892`, con
  `openLogSheet({ mode: 'start' })` (`VidaHoyPage.tsx:402`) y la hoja de «qué» de
  FEAT-004 (criterio 38). **«Otra cosa» es esto mismo.**
- **La marca de «ahora» y el hueco partido:** `buildDayAgenda`
  (`utils/vida-agenda.utils.ts:152`), con `AgendaGap` trayendo ya `isPast`,
  `durationMinutes` y **`nextBlockTitle`** (`:53-75`) — que es literalmente el
  texto de la cara 4.
- **El siguiente bloque:** `findNextBlockId(blocks, nowMinutes)`
  (`utils/vida-agenda.utils.ts:565`), ya usado en `VidaHoyPage.tsx:246`.
- **Qué bloque está resuelto:** `execution.byBlockId` y
  `BlockExecutionStatus = 'running' | 'on-plan' | 'changed' | 'moved'`
  (`utils/vida-execution.utils.ts:251`).
- **El reloj de la pantalla:** `useVidaNowMinute(isToday)`
  (`VidaHoyPage.tsx:145`), tic de 60 s, **ya montado**.
- **El cronómetro, «Terminar», «Lo hice» y las tres salidas:** FEAT-004, entregada
  — `useElapsedTimer`, la barra de sesión (criterio 7), el cierre de un toque
  (criterio 5), `logSessionInput` + `plannedSessionMinutes` (criterio 41).
- **El formato de duraciones:** `formatDurationFromMinutes`
  (`utils/vida-time.utils.ts`). **Ojo: FEAT-008 lo está tocando ahora mismo.**

**Qué criterios de FEAT-004 toca esta feature, y cómo no se rompen:**

| Criterio de FEAT-004 | Qué le hace esta feature | Cómo no se rompe |
|---|---|---|
| **1** («▶ Empezar» en cada bloque de hoy) | Nada: se queda | Criterio 181: test que afirma que sigue ahí y funciona |
| **2, 17** (start con la hora del reloj) | Le añade **una segunda entrada** | Criterios 188 y 196: la misma mutación, la misma hora; no hay una segunda escritura |
| **13** (dos toques ≠ dos sesiones) | Amplía la superficie del problema | Criterio 188: se inhabilitan **los dos** botones del mismo bloque mientras vuela |
| **3, 4, 9** (cronómetro y pasarse del tiempo) | Lo **repinta** en la tarjeta | Criterios 199 y 200: **el mismo** `useElapsedTimer`, y al pasarse dice lo del criterio 9 |
| **5** («Terminar» de un toque) | Lo repite en la tarjeta | Criterio 201: la misma acción, el mismo toast; no hay un segundo cierre |
| **7** (barra de sesión en todo el módulo) | Convive con ella en Hoy | Criterio 203 + **D2**: la barra **no se toca**; quitarla en Hoy reescribiría el criterio 7 y por eso es del usuario |
| **15** (empezar con otra en marcha cierra la anterior) | La tarjeta puede disparar ese camino desde «Otra cosa» | **D1**: si el segundo botón de la cara 3 es «Otra cosa», es exactamente el camino del criterio 15, ya construido y ya explicado al usuario |
| **16, 54** (sesión abierta de otro día) | Podría proponer con la pregunta pendiente | Criterio 189: con `canStart === false` **no hay play** |
| **39, 40** (pendiente y las tres salidas) | La cara 2 **adelanta** dos de ellas | Criterio 194: la tarjeta deja de proponer a las 2 h, pero **las tres salidas siguen en el bloque**; la tarjeta no las quita de la lista |
| **41** («Lo hice») | Lo repite en la cara 2 | Criterio 197: **la misma función**, no una copia de la aritmética |
| **57, 58** (cargando y error no afirman) | Añade un sitio donde se podría afirmar de más | Criterios 208 y 209 |
| **59** (lenguaje sin reproche) | La cara 2 es el sitio de más riesgo del módulo | Criterio 210, con barrido de texto en las cuatro caras |
| **60, 61** (375 px y texto largo) | Un componente más | Criterios 212 y 213 |

**Cómo conviven FEAT-010 y FEAT-011** (las dos tocan Hoy, y se analizan a la vez):

- **La frontera:** FEAT-010 es dueña de **la tarjeta de arriba**; FEAT-011 es
  dueña de **las filas de hueco de la lista**. Ni un archivo de UI compartido.
- La **cara 4 habla del hueco actual** (cuánto queda y hasta cuándo) y **no lo
  pinta ni lo hace pulsable** (criterio 216). FEAT-011 se ocupa del hueco que **ya
  pasó**, que es otra cosa y está en otro sitio de la pantalla.
- El punto donde se rozan, dicho para que nadie lo descubra construyendo:
  `buildDayAgenda` **parte en dos el hueco que contiene el reloj**. La mitad de
  **antes** de «ahora» (`isPast: true`) es de **FEAT-011**; la de **después** es
  de la que habla la cara 4. Las dos leen el mismo `AgendaGap` y **ninguna lo
  modifica**.
- **Ninguna depende de la otra.** Se pueden construir en cualquier orden, y a la
  vez si el usuario quiere, con una condición: **no las construye el mismo
  constructor en la misma rama**, porque las dos entran en `VidaHoyPage.tsx` y la
  línea base de lint y tests se contamina (decisión 3 de «Cómo se ejecuta» del
  plan de Vida).
- **Con FEAT-008**, que está en `building`: la tarjeta **no toca**
  `vida-time.utils.ts` ni `VidaDurationPills`; solo **consume**
  `formatDurationFromMinutes`. Si FEAT-008 cambia cómo se escribe «1 h 20», la
  tarjeta hereda el cambio y no hay dos formatos.

**Hipótesis marcadas, técnicas, para que el arquitecto las confirme o las tire**
(no son del usuario y no se las devuelvo):

- **`VIDA_LEAD_AHEAD_MINUTES = 10`** y **`VIDA_LEAD_LATE_WINDOW_MINUTES = 120`**,
  constantes con nombre y en un solo sitio, junto a las de FEAT-004
  (`VIDA_ON_PLAN_TOLERANCE_MINUTES`, `VIDA_MOVED_THRESHOLD_MINUTES`) si es que
  ahí es donde viven los umbrales del módulo.
- El selector vive en un `utils` **puro** con su test; la tarjeta es un
  componente **tonto** que recibe el resultado.
- La tarjeta se monta en `VidaHoyPage.tsx` **entre `VidaDayBudget` y el `<ol>` de
  la agenda**, y no dentro de ninguno de los dos.
- El estado «mutación en vuelo» del arranque tiene que ser **el mismo** que ya
  mira `VidaAgendaBlock` para inhabilitar su botón (criterio 188); si hoy es
  local del bloque, hay que subirlo, y eso es una decisión de arquitecto.

**Decisions that aren't mine:**

- **D1 — Qué va en el segundo botón de la cara 3.** El render dibuja **«Pausar»**
  y **pausar no se puede construir con verdad**: el API no lo modela (FEAT-004 lo
  dejó fuera por escrito) y fingirlo en cliente sería enseñar algo que no es
  cierto. Las salidas:
  **(a) «Otra cosa»** — coherente con la nota del propio render («"Otra cosa"
  nunca desaparece»); empieza otra cosa y, como ya hace FEAT-004 (criterio 15),
  **cierra la anterior a esa hora y lo dice**. **Cero código nuevo.**
  **(b) Solo «Terminar»**, sin segundo botón: más limpio, pero con una sesión
  viva la única salida rápida es cerrarla.
  **(c) Construir pausar de verdad**: toca el API, y el plan de Vida dice «nada de
  backend».
  **Por defecto se construye (a)**, y **no bloquea**: cambiarlo después es una
  línea. Si el usuario quería pausar de verdad, esto es una feature aparte.
- **D2 — Dos cronómetros a la vez en Hoy.** Con la cara 3 en pantalla se ven **la
  tarjeta y la barra fija de sesión** de FEAT-004 (criterio 7, que nombra Hoy
  explícitamente).
  **(a) Se quedan las dos** — por defecto: quitarla reescribiría un criterio ya
  entregado, y la barra es la que sobrevive al desplazamiento cuando bajas por la
  lista.
  **(b) La barra se oculta solo en Hoy** mientras la tarjeta está visible en cara
  3 — se ve más limpio, cuesta una línea, y hay que **reescribir el criterio 7 de
  FEAT-004** para que siga siendo cierto.
  **No bloquea**: se construye (a) y se decide viéndolo.
