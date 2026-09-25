---
id: FEAT-010
title: Lo que viene — dentro de la línea, debajo de lo que estás haciendo, y arranca de un clic
status: delivered
architect: yes    # vive dentro de la lista de la agenda y se mueve con la sesión en marcha, y retira dos superficies de FEAT-003 derogando criterios entregados
area: features/vida
requested: 2026-09-22
updated: 2026-09-25   # tajada 3 **aceptada** (revisor): 380–385 con evidencia, CSS 282,61 → 280,11 kB verificado por selectores, cero código vivo de lo retirado. **Las tres tajadas aceptadas: feature `delivered`.** 212/213/214 y 218 los cierra el usuario
# histórico: 2026-09-25 — tajada 3 **in-review** (constructor): retiradas las fichas del hueco y el panel del lateral
# histórico: 2026-09-23 — tajada 2 **aceptada** (192, 193, 197, 377 y la segunda mitad del 209). Las tajadas 1 y 2 aceptadas; la 3 sin empezar. 218 lo cierra el usuario
---

# FEAT-010 — Lo que viene — dentro de la línea, debajo de lo que estás haciendo, y arranca de un clic

## 1. The request — feature-analyst

**Summary for whoever's next:** justo **debajo de lo que está pasando, dentro de
la línea de la agenda**, va una tarjeta que dice **qué toca después según tu
plantilla** y lo arranca **de un clic**, con la promesa escrita al lado: *arranca
cuando pulses, no a la hora de la ficha, y se registra lo que dure de verdad*.
La primera tajada es **esa tarjeta en el caso normal**; la tercera **retira las
dos superficies que esto deja sin sentido** (las fichas del hueco y el panel «Tu
plantilla de \<día\>»).

> ### Aviso de reescritura — 2026-09-22
>
> **Este dossier se reescribió entero el mismo día en que se escribió.** No es
> una corrección de estilo: el usuario **usó la app de verdad** y cambió el
> encuadre. Manda el render **`docs/vida/assets/14-vida-lo-que-viene.html`**
> («**Va tal cual**», aprobado el 2026-09-22).
> **`11-vida-hoy-empezar.html` queda superado** — no se borra, pero ya no es
> fuente de verdad de nada. Lo que muere, y por qué, está en la tabla
> **«Lo que queda derogado de la primera versión»**, más abajo. **La numeración
> vieja (180–218) se conserva** para que nadie lea un criterio muerto creyéndolo
> vivo: los que mueren están tachados y con su sustituto al lado. **Lo nuevo
> empieza en el 370** (FEAT-011 ocupa 220+, FEAT-013 ocupa 330–361).

**What problem it solves:** el problema **no era** que costara encontrar el botón
de empezar, como decía la primera versión de este dossier. Es más incómodo y más
caro: **el usuario no pulsaba los botones que ya existen**, y no por no verlos,
sino **por miedo a que le registraran horas que no iba a pasar**. Una ficha que
pone «4 h» se lee como una **reserva**, no como una estimación; y si pulsar puede
apuntarte cuatro horas de algo que igual dejas en veinte minutos, no pulsas. El
resultado es el peor posible para este módulo: **la pantalla que vive de tener
datos es la que asusta a la hora de generarlos**.

Así que esta feature hace dos cosas, y la segunda pesa tanto como la primera:

1. **Pone lo que viene donde el ojo ya está mirando** — dentro de la línea, justo
   debajo de lo que está pasando— en vez de obligar a buscar el bloque en la
   lista o a cruzar la pantalla hasta un panel.
2. **Escribe la promesa en la pantalla**: *arranca cuando pulses, no a la hora de
   la ficha; se registra lo que dure de verdad*. **Siempre**, no solo cuando el
   número asusta.

Y lo hace **con un clic**: `docs/vida/PLAN.md`, sección **«La premisa que manda
sobre todo lo demás»** — *registrar lo que haces no puede costar más que
hacerlo*; *una intención del usuario, una acción*.

**Who it's for:** el usuario del módulo Vida, **mientras vive el día**, en
`/app/vida/hoy` y **solo en hoy**. En los cuatro momentos del render: mientras
hace algo, justo al cambiar de actividad, cuando la hora de algo ya pasó, y
cuando ya no le queda nada en la plantilla.

**User's words:** el pedido original, que sigue siendo cierto en el fondo:

> «en la vista de "hoy" donde ya ejecuto mi vida, como me lo imagino (y sé que ya
> había aprobado el diseño, pero ya usándolo cambié de opinión) me imagino la app
> sugiriéndome iniciar la actividad que corresponde según la plantilla con un
> botón de play, o un botón para iniciar libre la acción»

Y lo que reencuadró la feature, ya usándola: **lo que le gusta es que la
actividad en curso ocupa su sitio real en la línea, reservando el tiempo mientras
pasa** — de ahí que lo que viene tenga que ir **ahí**, y no en una tarjeta arriba
del todo.

Sobre las dos superficies que se retiran:

> «**no me resultan útiles, para mí no es intuitivo qué hacen, o buscarle otra
> propuesta o quitarlas**»

y, al explicarle qué hacían:

> «**no me sirve cómo funciona ahora... porque invade... esto se reemplaza con lo
> de "que viene"**»

**Out of scope:** (lo que alguien podría dar por incluido y NO lo está)

- **Convertir la tarjeta en el cronómetro.** Lo que está en marcha **ya tiene su
  sitio en la línea** —es justo lo que al usuario le gusta— y la barra fija de
  sesión (FEAT-004, criterio 7) sigue donde está. La tarjeta va **debajo**, no
  encima ni en lugar de.
- **Pausar y reanudar.** El render nuevo **ya no dibuja «Pausar»**; el API sigue
  sin modelarlo. Se acabó la discusión (ver D1 muerta).
- **Notificaciones, alarmas, sonidos, vibración o recordatorios.** La tarjeta
  cambia y se calla. Nada interrumpe (FEAT-004, criterio 9).
- **Cambiar el plan.** Arrancar a las 13:40 algo previsto a las 13:00 **no
  reescribe el plan**: el bloque se queda en su hora y lo real se pinta encima
  (FEAT-004, criterio 37).
- **Re-especificar el cierre de la sesión anterior.** Pulsar con algo en marcha
  lo cierra **a esa misma hora**, y eso **ya está construido y en `main`**: es la
  **D1 de FEAT-013** (`7cbf7c2`), sobre FEAT-004 criterio 15. Aquí solo se
  **dice** antes de pulsar.
- **Decidir a qué hora empezó algo que ya empezó.** Es **FEAT-013**, en
  construcción. La tarjeta arranca **ahora**; quien necesite decir «empecé a las
  8:07» lo hace por donde FEAT-013 lo pone.
- **Registrar en el hueco que ya pasó.** Es **FEAT-011** (tajada 1 ya en `main`,
  `231887a`), dueña de las filas de hueco.
- **Sustituir «Armar desde la plantilla»**, ni la vista de semana, ni «Armar
  mañana». Planear por delante **sigue existiendo** y esta feature tiene que
  dejarlo intacto (criterio 384).
- **Una lista de lo que viene.** Se propone **una cosa**. Lo demás vive detrás de
  «Ver las otras N».
- **Días que no son hoy.** Ni pasado ni futuro (criterio 180).
- **Poder ocultar la tarjeta** o recordar que la ocultaste. Ni ajuste, ni
  `localStorage` nuevo.
- **Crear una actividad desde aquí.** Si no está en el catálogo, se enlaza a
  `/app/vida/actividades`, como siempre (FEAT-004, criterio 34).
- **Backend, rutas nuevas, consultas nuevas, documentos GraphQL nuevos.**

**Lo que queda derogado de la primera versión de este dossier** (render 11 → 14):

| Criterio | Qué decía | Qué pasa | Por qué |
|---|---|---|---|
| ~~181~~ | La tarjeta va **arriba**, entre el presupuesto y la lista | **Muere** → **370** | El render 14 la mete **dentro de la línea**, debajo de lo que pasa. Es el cambio que nace de lo que el usuario dijo que le gusta. |
| ~~182~~ | Umbral **`VIDA_LEAD_AHEAD_MINUTES = 10`** para «está a punto» | **Muere** → **375** | El render 14 no pregunta «¿está a punto?»: la tarjeta **está siempre**. A las 11:05 propone lo de las 11:30. Un umbral que ya no responde a nada. |
| ~~185~~ | Prioridad **en marcha > toca algo > …** | **Muere** → **370** | Las caras dejaron de excluirse: con algo en marcha **se ven las dos cosas**, la sesión en su fila y la tarjeta debajo. |
| ~~194~~ | Ventana de **120 min** para un bloque cuya hora pasó | **Muere** → **375** | La regla nueva no necesita un segundo número mágico: se propone **el más reciente cuya hora ya llegó**. |
| ~~195~~ | «**acabarías a las H:MM**» | **Muere** → **373** | Es justo lo contrario de la promesa: pintar una hora de fin **vuelve a hacer que parezca una reserva**. El render 14 dice lo opuesto: «no se registran 4 horas; si la dejas a las 15:00, se guardan **1 h 20**». |
| ~~198~~ ~~199~~ ~~200~~ ~~201~~ ~~202~~ | La tarjeta se convierte en el **cronómetro** («En marcha», reloj, «Terminar») | **Mueren** | La sesión viva **ya ocupa su sitio real en la línea**, y esa es la parte que al usuario le gusta. La tarjeta no la sustituye: se pone **debajo**. Con ellas muere **la tajada 3 de la primera versión**. |
| ~~D1~~ | Qué poner donde el render 11 dibujaba «**Pausar**» | **Muere** | El render 14 **no lo dibuja**. No hay nada que explicar. |
| ~~D2~~ | Dos cronómetros en Hoy (tarjeta + barra de sesión) | **Muere** | La tarjeta ya no tiene cronómetro. |
| 183, 187, 190, 191, 192, 193, 197, 214, 218 | — | **Se reescriben** en su sitio, con la redacción del render 14 | |
| 180, 184, 186, 188, 189, 196, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 215, 216, 217 | — | **Siguen vivos tal cual** | No dependían del sitio ni de las caras. |

**Acceptance criteria:**

*Vivos de la primera versión, sin cambios*

- [ ] 180. **Solo en hoy, y solo dentro del día.** Se pinta cuando `isToday` **y**
  `nowMinutes !== null` **y** el reloj cae dentro de
  `[vidaDayStartTime, vidaDayEndTime)`. En un día **pasado** o **futuro** no se
  pinta **ningún nodo** —ni vacío, ni oculto por CSS— y la pantalla queda como
  está. Antes de que empiece el día o después de que se cierre, tampoco.
- [ ] 184. **Desempate entre candidatos a la misma hora**, o con uno solapando a
  otro: gana el de **inicio menor**; empate → el de **menos duración** (acaba
  antes y libera al otro); empate → **el orden que ya da `buildDayAgenda`**.
  **Nunca se pintan dos.** Función **pura**, con test de los tres casos.
- [ ] 186. **No se propone lo ya resuelto:** un bloque con ejecución asignada
  (`execution.byBlockId[id]`: `on-plan · changed · moved · running`) o con una
  salida dada («Lo hice», «Hice otra cosa», «No se pudo») **no es candidato**.
- [ ] 188. **Empieza de verdad, por la vía que ya existe:**
  `useStartActivityFollowUpMutation` → `activityFollowUpStart`, con `startTime` =
  **la hora del reloj** (FEAT-004, criterio 17) y `date` = la fecha local. La
  pantalla se actualiza **sin recargar** con `invalidateFollowUpQueries`. Dos
  toques **no crean dos sesiones** (FEAT-004, criterio 13): mientras la mutación
  vuela quedan inhabilitados **el botón de la tarjeta y el «▶ Empezar» de ese
  bloque en la lista**.
- [ ] 189. **Si no se puede empezar, no se pinta un botón que no va a funcionar:**
  con `canStart === false` (`VidaHoyPage.tsx:157` — sin sesión de usuario, o con
  la pregunta de la sesión abierta de otro día pendiente, FEAT-004 criterios 16 y
  54), la tarjeta **no ofrece el botón**, dice en una línea qué falta y lleva a la
  pregunta. Sin spinner eterno (FEAT-004, criterio 64).
- [ ] 196. **La hora que se guarda es la del reloj**, no la planeada (FEAT-004,
  criterio 17): pulsar a las 13:40 algo de las 13:00 registra **13:40**, y el plan
  se queda quieto en las 13:00.
- [ ] 203. **La barra fija de sesión no se toca**: sigue en todas las pantallas
  del módulo, Hoy incluida (FEAT-004, criterio 7).
- [ ] 204. **Cuesta cero:** la tarjeta se deriva en un `useMemo` **puro** de
  (agenda, ejecución, sesión abierta, plantilla del día, `nowMinutes`) y el reloj
  es **`useVidaNowMinute(isToday)`, que ya está montado** (`VidaHoyPage.tsx:145`,
  tic de 60 s). **Cero consultas nuevas y cero temporizadores nuevos.** Un test
  con espías afirma que abrir Hoy cuesta **las mismas consultas** que sin ella.
- [ ] 205. **El foco no salta:** cambiar de contenido **no desmonta y remonta** la
  tarjeta ni mueve el foco; si el foco está en el botón y la tarjeta cambia, se
  queda donde estaba o en el botón equivalente, **nunca en `body`**. Tampoco roba
  el foco al montarse ni hace `scrollIntoView` (el desplazamiento a «Ahora» de
  FEAT-003 sigue siendo el único de la pantalla). **Vale también cuando la
  tarjeta cambia de sitio** (criterio 379).
- [ ] 206. **Nombre accesible de verdad:** el botón se anuncia **«Empezar Daily
  meeting ahora»**, no «Empezar ahora» a secas ni el triángulo (`aria-hidden`).
  «Empezar otra cosa», «Ya la hice» y «Ver las otras 3» se anuncian con su texto
  completo.
- [ ] 207. **Cómo se anuncia el cambio, sin dar la lata:** la tarjeta es una
  región con nombre («Lo que viene») y **solo la línea del titular** vive en
  `aria-live="polite"`; se anuncia **cuando cambia la actividad propuesta**, no en
  cada tic de reloj ni al volver a la pestaña. Nunca `assertive` ni `role="alert"`
  (la misma regla de FEAT-007).
- [ ] 208. **Cargando:** con el plan, la plantilla o lo vivido en vuelo, la
  tarjeta **no afirma nada** —ni propone, ni dice que no queda nada—: esqueleto o
  nada (FEAT-004, criterio 57).
- [ ] 209. **Error:** si falla `activityDayFollowUps` y el plan sí carga, la
  tarjeta **no propone** (no sabe qué está hecho) y **no dice «ya no queda
  nada»**: dice que falta lo vivido y deja «Empezar algo» (FEAT-004, criterio 58).
  Si falla el plan, no hay tarjeta.
- [ ] 210. **Ni una palabra de reproche**, y un test lo barre sobre el DOM en los
  cuatro momentos: no aparecen «tarde», «te saltaste», «perdiste», «fallaste»,
  «deberías», «desperdicio», «vacío» ni «todavía no has». **«Se pasó de la hora»
  sí**: lo escribe el render, es un dato, y no es una opinión sobre él.
- [ ] 211. **Todo lo que enseña es cierto**, y aquí es **la mitad de la feature**:
  la hora, el nombre y los minutos salen del mismo `buildDayAgenda` y de la misma
  plantilla que pinta la lista. Un test compara el texto de la tarjeta con el de
  la lista y afirma que **dicen lo mismo**.
- [ ] 212. **375 px:** sin scroll horizontal; el botón, la frase de verdad y la
  línea de salidas caben **dentro de la canaleta de la agenda** (la lista tiene
  sangrado por la regleta de horas) sin desbordar.
- [ ] 213. **Texto largo:** un nombre de ~60 caracteres no la rompe, no produce
  scroll horizontal y no empuja el botón fuera; se recorta con ellipsis y el
  nombre completo sigue disponible.
- [ ] 215. **Convive con FEAT-007:** su aviso sigue **pegado al bloque, dentro de
  la lista**, y la tarjeta **no lo duplica** ni cuenta para su máximo de dos. Con
  el bloque propuesto trayendo aviso se ven las dos cosas y **ninguna tapa a la
  otra**.
- [ ] 216. **Frontera con FEAT-011:** la tarjeta **no pinta ninguna fila de
  hueco**, no las hace pulsables y no cambia lo que FEAT-011 ya puso en `main`
  (`231887a`). Su texto de «ya no queda nada» **habla** del rato que queda de día;
  **no lo convierte en un sitio donde registrar**. Ninguna de las dos depende de
  la otra.
- [ ] 217. **Línea base no empeorada** (`docs/features/ENVIRONMENT.md`):
  `pnpm typecheck` limpio, `pnpm lint` no peor que 14/0, `pnpm test` sin fallos
  nuevos sobre los 2 preexistentes, `pnpm build` exit 0 y el chunk inicial sin
  crecer por iconos. **Ningún documento GraphQL nuevo.**

*Reescritos con el render 14*

- [ ] 183. **Lo que se lee**, palabra por palabra del render: el rótulo **«Lo que
  viene»**, la actividad con su icono y su color, y debajo **«En tu plantilla, a
  las 11:30 · suele durarte 30 min»**. El botón dice **«▶ Empezar ahora»**.
- [ ] 187. **«Empezar otra cosa» sigue existiendo siempre**, pero **como texto
  pequeño debajo** (criterio 376), no como botón al lado. Llama a
  **`openLogSheet({ mode: 'start' })`**, la misma hoja de siempre: **no hay una
  segunda hoja de «qué»** (FEAT-004, criterio 38).
- [ ] 193. Cuando la hora del ítem propuesto **ya pasó**, el rótulo es **«Lo que
  viene · se pasó de la hora»** y **nada más cambia**: mismo sitio, mismo botón,
  misma frase de verdad. No hay color de alarma, ni ámbar de aviso, ni segunda
  tarjeta.
- [ ] 197. **«Ya la hice» está escrita**, no escondida en un menú, y **solo
  aparece cuando la hora ya pasó**. Llama a **la misma función que ya usan Hoy y
  Revisión** (`logSessionInput` + `plannedSessionMinutes`, FEAT-004 criterio 41),
  **no a una segunda aritmética**. Tras usarla, el bloque pasa a hecho **sin
  recargar** y la tarjeta pasa a proponer lo siguiente.
- [ ] 214. **Oscuro y trazo:** la tarjeta se distingue de una fila normal de la
  agenda (trazo **mint**, punto **punteado** en la regleta), **no se confunde con
  la línea de AHORA** (violeta sólido) **ni con el aviso punteado violeta de
  FEAT-007**, y en oscuro todos sus textos se leen. **Nunca usa trazo punteado
  violeta.**
- [ ] 218. **Criterio de fase, y lo comprueba el usuario** (con la API despierta):
  un día real —con algo en marcha, la tarjeta dice qué viene después y un clic lo
  arranca cerrando lo anterior a esa hora · algo cuya hora pasó se ofrece igual,
  sin bronca, y «Ya la hice» lo cierra · cuando ya no queda nada, dice cuánto le
  queda de día— **y, lo que de verdad cierra la feature: el usuario pulsa el
  botón sin miedo a que le registre horas que no va a pasar, porque la pantalla
  se lo dice.**

*Lo nuevo: dónde vive y qué promete (tajada 1)*

- [ ] 370. **Su sitio, y siempre el mismo:** **dentro de la línea de la agenda**
  (la lista de `execution.entries`, `VidaHoyPage.tsx:627`), **justo debajo de lo
  que está pasando**. Con una **sesión en marcha**, inmediatamente **después de su
  fila**; **sin nada en marcha**, **en la línea de AHORA**, inmediatamente
  después. **Nunca arriba del todo**, nunca fuera de la lista. Con la tarjeta en
  pantalla, la fila de la sesión viva **sigue ocupando su sitio real y su tiempo
  en la línea**: eso es lo que al usuario le gusta y no se toca.
- [ ] 371. **La hora de la izquierda es la de la plantilla, en gris**, en la misma
  regleta que las demás filas, y el texto dice que es **dónde debería caer**, no
  dónde va a caer («En tu plantilla, a las 11:30»). Cuando no hay hora que
  enseñar (criterio 377), esa casilla va **vacía**, no con un «—» ni con la hora
  actual.
- [ ] 372. **La duración se llama «suele durarte N»**, nunca «N» a secas ni «30
  min» como etiqueta suelta. Cuando **FEAT-007 tiene costumbre** de esa actividad
  (`useVidaPatterns`, **ya montado en Hoy** para los avisos de bloque,
  `VidaHoyPage.tsx:327`) y difiere de la plantilla, **manda la costumbre** y sigue
  siendo literal; si no hay costumbre, el número es el de la plantilla y **las
  palabras no cambian**, porque es lo que tu plantilla dice que sueles hacer.
  **Cero consultas nuevas por esto** (criterio 204).
- [ ] 373. **La frase de verdad, y va SIEMPRE** —no solo cuando el número
  asusta—, pegada al botón y antes de las salidas: **«Arranca cuando pulses, no a
  las 11:30. Y los 30 min son lo que suele durarte: se registra lo que dure de
  verdad.»** Un test afirma que **aparece en los cuatro momentos que ofrecen el
  botón**, con 30 min y con 4 h. **Y no se pinta ninguna hora de fin estimada**:
  ni «acabarías a las…», ni una barra que reserve el tramo. *(Éste es el criterio
  que existe porque el usuario no pulsaba: si vuelve a leerse como una reserva, la
  feature no sirve.)*
- [ ] 374. **Un clic y ya:** el botón principal **arranca la sesión en un solo
  toque**. **Sin hoja, sin elegir, sin confirmar, sin paso intermedio.** Un test
  afirma que entre el clic y `activityFollowUpStart` **no se abre ningún diálogo
  ni ninguna hoja**.
- [ ] 375. **Qué se propone**, sin ningún umbral nuevo: de los ítems del plan de
  hoy **sin resolver** (criterio 186), se propone **el más reciente cuya hora ya
  llegó** (`startMinutes <= ahora`); si **ninguna ha llegado**, **el siguiente por
  hora**. Los demás **siguen en la lista**, cada uno con lo suyo. *(Con esto, a
  las 11:05 se propone lo de las 11:30; a las 13:40 se propone lo de las 13:00 y
  no lo de las 18:00; y a las 20:00, con las 13:00 y las 18:00 sin hacer, se
  propone **las 18:00** — lo más reciente, no lo más viejo, y sin necesidad de una
  ventana de caducidad.)* Función **pura**, con test de esos tres casos.
- [ ] 376. **Las salidas alternativas van debajo, en pequeño, sin competir con el
  botón**: **«Ver las otras N»** cuando quedan más ítems sin resolver (con **N
  real**, y si no quedan, **no se escribe**), **«Empezar otra cosa»** siempre, y
  **«Ya la hice»** solo cuando la hora ya pasó (criterio 197). Ninguna tiene el
  peso visual del botón y **ninguna vive en un menú**.
- [ ] 378. **Al pulsar con algo en marcha, se dice antes de pulsar:** la frase de
  verdad incluye **«Al hacerlo, "Daily meeting" se dará por terminada a esa
  hora»**, con el nombre real de lo que está corriendo. El cierre en sí **ya está
  construido y no se re-especifica**: es la **D1 de FEAT-013** (`7cbf7c2`) sobre
  FEAT-004 criterio 15. Un test afirma que la tarjeta **no manda ninguna mutación
  de cierre por su cuenta**.
- [ ] 379. **La tarjeta se mueve sola**, sin que el usuario haga nada: al arrancar
  algo, pasa a ir **debajo de la sesión nueva** y a proponer **lo siguiente de la
  plantilla**; al terminar, vuelve a la línea de AHORA. El movimiento **no
  desmonta y remonta** (criterio 205) y **no desplaza la pantalla** bajo el dedo
  de quien estaba leyendo otra cosa.

*Lo nuevo: cuando ya no queda nada (tajada 2)*

- [ ] 377. **Ya no queda nada en la plantilla:** el mismo sitio, la misma forma,
  en trazo **apagado y punteado**, dice lo cierto —**«Ya no queda nada en tu
  plantilla»**, **«Tu martes se acaba a las 22:00. Te quedan 3 h 8»**— y deja
  **«▶ Empezar algo»** (el mismo `openLogSheet({ mode: 'start' })`). **No se
  inventa ninguna sugerencia para rellenar**, ni se propone algo ya hecho, ni se
  queda mudo. La hora de fin sale de `vidaDayEndTime` y los minutos, de la misma
  cuenta del presupuesto: un test afirma que **coinciden con lo que dice la barra
  de arriba**.
- [ ] 192. **Día sin plan, o con plan y nada por delante:** exactamente el
  criterio 377, y **nada más**: ni cara de «toca algo», ni una palabra que suene a
  que falta algo. El «aún no hay plan» que ya existe se queda donde está y **la
  tarjeta no lo repite**.

*Lo nuevo: retirar las dos superficies que esto deja sin sentido (tajada 3)*

> El usuario dijo que no le resultan útiles, que **no es intuitivo qué hacen** y
> que **esto se reemplaza con lo de «que viene»**. Y se entiende por qué confunden,
> verificado en código: **son dos superficies parecidas con comportamientos
> distintos**. La ficha del hueco (`VidaAgendaGap`, `placeSuggestion` en
> `VidaHoyPage.tsx:417`) mete la cosa en el plan **al principio de ese hueco**; el
> «Ponerla» del panel lateral (`VidaTemplateAside.tsx:151`) busca **el primer
> hueco del día donde quepa**. **Ninguna dice cuál es cuál**, y **las dos escriben
> el plan al primer toque, sin confirmación**.

- [ ] 380. **Se retiran las dos a la vez, y en la última tajada** —no antes—:
  hasta que «Lo que viene» esté en pantalla y sirva, **quitarlas dejaría un
  agujero**. *(Van juntas porque comparten el mismo `suggestionsForGap` y porque
  dos retiradas separadas son dos rondas de tests sobre los mismos archivos.)*
- [ ] 381. **Las fichas de sugerencia del hueco desaparecen** de `VidaAgendaGap`:
  ni las hasta 3 visibles, ni su duración, ni el «+N más». **Queda derogado el
  criterio 18 de FEAT-003 en su parte de fichas** (ya lo estaba en parte por el
  criterio 91 de FEAT-007), **el criterio 19 entero** (la sugerencia «sin
  duración») y **el criterio 23 entero** (el toque que creaba el bloque al
  principio del hueco). **Y con ellos muere la mitad del criterio 91 de FEAT-007**
  —los chips del hueco que ofrecían «la duración que sueles tardar»—, cuya parte
  útil **se muda al criterio 372**.
- [ ] 382. **`«+ otra cosa»` NO desaparece.** Sigue abriendo la hoja **«Poner algo
  a las HH:MM»** con el subtítulo del hueco (FEAT-003, criterios 24 y 25): es el
  camino **explícito y confirmable** para planear en un hueco, y es justo lo que
  las fichas no eran. El hueco **sigue diciendo su tamaño y su franja**.
- [ ] 383. **El panel «Tu plantilla de \<día\>» del lateral de escritorio
  desaparece entero**, con su botón «Ponerla». **Queda derogado el criterio 48 de
  FEAT-003 en esa mitad.** **La otra mitad sobrevive**: el bloque **«Mañana ·
  Armar mañana desde la plantilla»** se queda donde está. *(La lista no se deja
  «en solo lectura»: una lista que ya no hace nada es exactamente lo que el
  usuario llamó «invade».)*
- [ ] 384. **Nada se queda sin camino**, y un test lo afirma sitio por sitio:
  **(a)** poner algo en un hueco → **«+ otra cosa»** (criterio 382); **(b)** armar
  el día desde la plantilla → **«Armar desde la plantilla»** de `VidaDayActions` y
  la vista de semana, **sin tocar**; **(c)** planear mañana → **«Armar mañana»**
  del lateral (criterio 383) y la semana; **(d)** ver qué dice tu plantilla →
  `/app/vida/plantilla` (FEAT-005) y, para lo que toca ahora, **la tarjeta
  misma**. **Ninguno de los cuatro se toca en esta feature.**
- [ ] 385. **Se retira el código muerto, no se deja a medias**, y **no se borra de
  más**: `suggestionsForGap`, `MAX_GAP_SUGGESTIONS`, `findFirstFittingGap` y
  `GapSuggestion(s)` (`utils/vida-agenda.utils.ts`) **solo se borran si no queda
  ningún otro consumidor** —`fitsInGap` lo usan también las píldoras de duración—,
  y se comprueba antes de tocarlos. Los tests que afirmaban el comportamiento
  derogado **se reemplazan por tests que afirman lo nuevo**, no se borran a secas,
  y cada uno nombra el criterio que lo deroga (es como se hizo en FEAT-006).

**Slices:** (vertical, cada una usable sola)

| # | What it does | State |
|---|---|---|
| 1 | **«Lo que viene», dentro de la línea, con la promesa escrita y un clic.** Debajo de lo que está pasando (o en la línea de AHORA), la siguiente cosa de la plantilla con «suele durarte N», **la frase de verdad siempre**, «▶ Empezar ahora» de un solo toque, y las salidas pequeñas debajo. **Ya es útil sola, y es la feature entera en su caso normal:** el usuario pulsa. Criterios 180, 183, 184, 186, 187, 188, 189, 196, 203–217, 370–376, 378, 379. | aceptada |
| 2 | **Los dos bordes: se pasó la hora, y ya no queda nada.** El rótulo «· se pasó de la hora» con «Ya la hice» escrita, la mitad «ya llegó» de la regla de elección, y el momento en que la plantilla se acabó: cuánto te queda de día y «Empezar algo». Criterios 192, 193, 197, 375 (segunda mitad), 377. | aceptada |
| 3 | **Retirar las fichas del hueco y el panel «Tu plantilla de \<día\>».** Con sus derogaciones escritas (FEAT-003 18, 19, 23 y la mitad del 48; FEAT-007 la mitad del 91), «+ otra cosa» y «Armar mañana» intactos, y los cuatro caminos comprobados uno a uno. Criterios 380–385. | aceptada |

**Por qué este orden:** la 1 resuelve **lo que frenaba al usuario** y no depende
de nada nuevo (el arranque, el cierre de lo anterior y la costumbre ya están en
`main`); la 2 son dos bordes que sin la 1 no existen; **la 3 va la última por una
razón dura: no se quita un camino antes de que el que lo sustituye esté en
pantalla y funcione.**

**Architect? yes**, y por razones distintas a las de la primera versión:

1. **La tarjeta vive dentro de la lista de la agenda y se mueve con la sesión en
   marcha** (criterios 370 y 379). Eso es un cambio en el bucle que pinta
   `execution.entries` (`VidaHoyPage.tsx:627`), no un componente colgado al lado,
   y **hay dos features más entrando en ese mismo archivo** (FEAT-011 y FEAT-013,
   las dos en `building`). Quién toca qué y en qué orden no lo improvisa un
   constructor.
2. **La tajada 3 deroga criterios de features ya entregadas** (FEAT-003 18, 19,
   23, mitad del 48; FEAT-007 mitad del 91) y borra utilidades compartidas. Hay
   que decidir **una vez** qué se borra y qué se queda (criterio 385), con los
   consumidores contados.
3. **La regla de elección** (criterio 375) y **de dónde sale «suele durarte»**
   (criterio 372, cruzando plantilla y `useVidaPatterns` sin una consulta más) son
   aritmética pura que merece su sitio y su test: dentro de
   `utils/vida-agenda.utils.ts` —donde ya viven `buildDayAgenda`,
   `findNextBlockId` y `suggestionsForGap`— o en un hermano. Es la misma decisión
   que el arquitecto de FEAT-004 tomó una vez y salió bien.

**Lo que ya existe y NO se vuelve a construir** (verificado, con su ruta):

- **Arrancar:** `useStartActivityFollowUpMutation` → `activityFollowUpStart`, y el
  «▶ Empezar» del bloque en `VidaAgendaBlock.tsx:440` (FEAT-004, criterios 1 y 2).
- **Cerrar lo anterior a esa misma hora:** **ya en `main`**, D1 de **FEAT-013**
  (`7cbf7c2`) sobre FEAT-004 criterio 15. **No se re-especifica.**
- **Empezar otra cosa:** `openLogSheet({ mode: 'start' })`
  (`VidaHoyPage.tsx:402`, `VidaDayActions` en `:892`) y la hoja de «qué» de
  FEAT-004 (criterio 38).
- **«Ya la hice»:** `logSessionInput` + `plannedSessionMinutes` (FEAT-004,
  criterio 41), ya compartidos por Hoy y Revisión.
- **La línea, la marca de AHORA y el hueco partido:** `buildDayAgenda`
  (`utils/vida-agenda.utils.ts:152`), con `AgendaGap` trayendo `isPast`,
  `durationMinutes` y `nextBlockTitle` (`:53-75`), y `findNextBlockId` (`:565`).
- **Qué bloque está resuelto:** `execution.byBlockId` y `BlockExecutionStatus`
  (`utils/vida-execution.utils.ts:251`).
- **La costumbre:** `useVidaPatterns`, **ya montado en Hoy** (`VidaHoyPage.tsx:327`).
- **El reloj de la pantalla:** `useVidaNowMinute(isToday)` (`:145`), tic de 60 s.
- **El formato de duraciones:** `formatDurationFromMinutes`
  (`utils/vida-time.utils.ts`), con **FEAT-008 ya entregada** (`fb72e43`): la
  tarjeta **consume**, no toca.
- **Lo que se retira:** `placeSuggestion` (`VidaHoyPage.tsx:417`),
  `VidaTemplateAside.tsx:151`, y las fichas de `VidaAgendaGap`.

**Qué criterios de FEAT-004 toca esta feature, y cómo no se rompen**

| Criterio de FEAT-004 | Qué le hace | Cómo no se rompe |
|---|---|---|
| **1** («▶ Empezar» en cada bloque de hoy) | Nada: se queda | Un test afirma que sigue presente y funcionando con la tarjeta en pantalla |
| **2, 17** (start con la hora del reloj) | Una **segunda entrada** a la misma mutación | Criterios 188 y 196: misma vía, misma hora, ninguna escritura nueva |
| **13** (dos toques ≠ dos sesiones) | Amplía la superficie | Criterio 188: se inhabilitan **los dos** botones del mismo bloque |
| **15** (empezar con otra en marcha la cierra) | La dispara desde la tarjeta | Criterio 378: **solo se dice**; el cierre es de FEAT-013, ya construido |
| **7** (barra de sesión en todo el módulo) | Nada | Criterio 203: la tarjeta **ya no tiene cronómetro**, así que no compite |
| **16, 54** (sesión abierta de otro día) | Podría proponer con la pregunta pendiente | Criterio 189: sin `canStart`, **no hay botón** |
| **39, 40** (pendiente y las tres salidas) | Adelanta una de ellas | Criterio 197: «Ya la hice» es la **misma función**; las tres salidas **siguen en el bloque**, la tarjeta no las quita |
| **41** («Lo hice») | La repite | Criterio 197: la misma función, no una copia de la aritmética |
| **57, 58** (cargando y error no afirman) | Un sitio más donde afirmar de más | Criterios 208 y 209 |
| **59** (lenguaje sin reproche) | Un texto más, y delicado | Criterio 210 |
| **60, 61** (375 px y texto largo) | Un componente más, **dentro de la canaleta** | Criterios 212 y 213 |
| **9** (pasarse del tiempo sin interrumpir) | Nada | La tarjeta no habla de la sesión en marcha: solo va debajo |

**Cómo conviven las cuatro features que tocan Hoy ahora mismo:**

- **FEAT-011** (tajada 1 en `main`, `231887a`) es dueña de **las filas de hueco**;
  **FEAT-010, de la tarjeta de «lo que viene»**. La frontera **no cambia**
  (criterio 216). El hueco **pasado** se pulsa para registrar y eso es suyo; la
  tarjeta no lo toca.
- **FEAT-013** (`building`) pone la hora de arranque en la **hoja**; la tarjeta
  arranca **ahora** y **se apoya en su D1** para el cierre de lo anterior
  (criterio 378). No se pisan: una escribe en la hoja, la otra no la abre.
- **FEAT-008** (entregada, `fb72e43`) y **FEAT-009** (entregada, `b52f9e7`): la
  tarjeta **solo consume** `formatDurationFromMinutes` y la plantilla con sus
  huecos. **No toca `vida-time.utils.ts` ni `VidaDurationPills`.**
- **Condición dura**, del plan de Vida («Cómo se ejecuta», punto 3): **estas
  features no las construye el mismo constructor en la misma rama**, porque todas
  entran en `VidaHoyPage.tsx` y la línea base de lint y tests se contamina.

**Hipótesis marcadas, técnicas, para que el arquitecto las confirme o las tire:**

- La tarjeta es **una entrada más** del bucle de `execution.entries`
  (un `kind` propio, o un nodo insertado tras la fila de la sesión / tras la marca
  de AHORA). Lo que **no** es: un componente montado fuera del `<ol>`.
- El selector (criterio 375) y el «suele durarte» (criterio 372) viven en un
  `utils` **puro** con test; la tarjeta es un componente **tonto**.
- El estado «mutación en vuelo» del arranque tiene que ser **el mismo** que ya
  mira `VidaAgendaBlock` (criterio 188); si hoy es local del bloque, hay que
  subirlo.
- **Ningún umbral nuevo**: si alguien siente la necesidad de una constante de
  minutos, es señal de que la regla del criterio 375 se está reinterpretando.

**Decisions that aren't mine:**

- **D1 — qué abre «Ver las otras N».** El render lo escribe pero no lo dibuja.
  **(a)** Despliega ahí mismo, dentro de la línea, lo que queda de la plantilla,
  cada uno con su botón. **(b)** Lleva a `/app/vida/plantilla`. **(c) Abre la hoja
  de «Empezar algo» que ya existe** (`openLogSheet({ mode: 'start' })`), que **ya
  pone primero la plantilla de ese día** (FEAT-004, criterio 30) — **cero UI
  nueva**.
  **Por defecto se construye (c)**, y **no bloquea**: es un clic a algo que ya
  existe y ya ordena la plantilla primero. Queda dicho que **(a) es lo que la
  redacción del render sugiere más literalmente**, y que si el usuario lo prefiere
  se decide antes de la tajada 1, porque cambia el tamaño de la tarjeta.
- ~~**D2**~~ y ~~**D1** de la primera versión~~ (el «Pausar» del render viejo y
  los dos cronómetros en Hoy): **muertas**. El render 14 no dibuja «Pausar» y la
  tarjeta ya no es un cronómetro.
- **Resuelta por el usuario, no es decisión de nadie más:** las fichas del hueco y
  el panel «Tu plantilla de \<día\>» **se quitan** —«no me sirve cómo funciona
  ahora... esto se reemplaza con lo de "que viene"»—. Lo único que decidí yo es
  **cuándo** (la última tajada, no antes) y **que no se quiten sin dejar los
  cuatro caminos abiertos** (criterios 380 y 384).

## 2. The plan — feature-architect

**Summary for the builder:** la tarjeta es **un `<li>` hermano dentro del mismo
`<ol>` de la agenda**, con la forma de `VidaBlockHint`
(`components/VidaBlockHint/VidaBlockHint.tsx:44-79` + su `.module.scss`) — que
es el precedente exacto de «un nodo que cuelga de otra fila sin tocarla—; toda
la aritmética (a quién proponer, dónde insertarse, qué texto) va en un archivo
puro nuevo, `utils/vida-up-next.utils.ts`, hermano de `vida-execution.utils.ts`
y de `vida-gap-window.utils.ts`. **No se crea**: ni hook, ni consulta, ni
temporizador, ni `kind` nuevo en `buildDayExecution`, ni una segunda hoja, ni
`usualDurationsByActivityId` si FEAT-011 tajada 3 ya la dejó puesta.

### Lo que ya existe (verificado en `main`, `30a0d40`)

| Lo que hace falta | Dónde está ya | Qué se hace con ello |
|---|---|---|
| El bucle donde va la tarjeta | `VidaHoyPage.tsx:642-795` (`agendaList`, `execution.entries.map` en `:647`) | Se convierte en `flatMap` e inserta un nodo. Nada más |
| Un nodo que cuelga de otra fila, dentro del `<ol>` | `VidaBlockHint.tsx` (`<li class=row>` + `<span class=gutter>` + `<section class=card>`), montado en `VidaHoyPage.tsx:733-740` | **Es la implementación de referencia** |
| La canaleta con la hora a la izquierda | `VidaAgendaGap.tsx:157-161` (`<span class=gutter><time class=time>`) | Se copia para el criterio 371 (hora de plantilla en gris); `VidaBlockHint` la deja vacía, que es el caso del criterio 377 |
| Arrancar ahora | `useVidaSessionActions.start(activityId, startTime?)` (`hooks/useVidaSessionActions.ts:124`), ya instanciado en `VidaHoyPage.tsx:148` | Se llama `sessionActions.start(activityId)` **sin hora**: el reloj es el de la mutación (criterios 188 y 196) |
| Cerrar lo anterior a esa misma hora | **Dentro** de ese mismo `start` (D1 de FEAT-013, `7cbf7c2`) | No se toca. La tarjeta solo lo **dice** (criterio 378) |
| «dos toques ≠ dos sesiones», compartido | `sessionActions.isBusy` (`useVidaSessionActions.ts:96-110`, `useRef` + estado), ya pasado al bloque en `VidaHoyPage.tsx:717` como `isSessionBusy` | **La hipótesis del analista («si hoy es local del bloque, hay que subirlo») es falsa: ya es de página.** Se pasa la misma variable a la tarjeta y el criterio 188 queda cerrado sin mover nada |
| Si no se puede empezar | `canStart` (`VidaHoyPage.tsx:157`) | Puerta del criterio 189 |
| «Empezar otra cosa» / «Empezar algo» | `openLogSheet({ mode: 'start' })` (`VidaHoyPage.tsx:406-410`, usado en `:919`) | Se llama igual. **Sin hoja nueva** |
| «Ya la hice» | `markBlockDone(block)` (`VidaHoyPage.tsx:474-483`: `logSessionInput` + `plannedSessionMinutes`) | Se llama **esa misma función**, no una copia (criterio 197) |
| Qué bloque está resuelto | `execution.byBlockId`, `execution.insteadByBlockId` (`vida-execution.utils.ts:648-672`) y `getBlockNote(blockNotes, date, item.id)` (`VidaHoyPage.tsx:722-724`) | Las **tres** fuentes del criterio 186 |
| Quién está en marcha | `execution.byBlockId[id].isRunning` (`vida-execution.utils.ts:255`) y `ExecutionSessionEntry` con `span.isRunning` (`:339-357`, `toSessionSpans` en `:114`) | Son los **dos** anclajes del criterio 370 (ver abajo) |
| La costumbre | `useVidaPatterns` ya montado (`VidaHoyPage.tsx:327`) y `VidaActivityPattern` con `itemId` **y** `activityId` (`vida-patterns.utils.ts:273-274`) y `usualDurationMinutes` (`:302`) | Criterio 372, **sin consulta nueva** |
| El reloj | `useVidaNowMinute(isToday)` (`VidaHoyPage.tsx:145`) | Criterio 204 |
| Duraciones escritas | `formatDurationFromMinutes` (`utils/vida-time.utils.ts:120`) | Se consume |
| El fin del día y los minutos que quedan | `dayHours.endTime` y `getDayBudget` (`vida-agenda.utils.ts:304`), ya en `VidaHoyPage.tsx:210` como `budget` | Criterio 377: **los mismos números que la barra**, no una cuenta nueva |

**Nada de esto existe hoy, y eso también es información:** no hay ningún
componente, util ni prueba que proponga «lo siguiente del plan». `findNextBlockId`
(`vida-agenda.utils.ts:565`) **no sirve** y no se reutiliza: responde «el primer
bloque que aún no ha empezado» para pintar «en N min», ignora si está resuelto e
ignora lo que ya pasó — justo los dos casos del criterio 375.

**Y hay algo que ya existe dos veces, que es la razón de la tajada 3:** colocar
algo de la plantilla en el día se hace desde `placeSuggestion`
(`VidaHoyPage.tsx:417-448`, al principio del hueco tocado) **y** desde
`PlaceInFirstGapButton` (`VidaTemplateAside.tsx:165-240`, primer hueco del día
donde quepa). Dos superficies, dos reglas, ninguna lo dice.

### Implementación de referencia

**`src/features/vida/components/VidaBlockHint/VidaBlockHint.tsx`** (+ su
`VidaBlockHint.module.scss`), y su montaje en `VidaHoyPage.tsx:733-740`.

Por qué ésa y no otra: es **el único nodo del proyecto que ya hace la misma
figura** — un `<li>` hermano dentro del `<ol>` de la agenda, con la canaleta
vacía o con hora, que cuelga de otra fila sin tocar el componente del que cuelga
(`VidaAgendaBlock` está entregado desde FEAT-004 y ahí sigue sin tocarse). Su
`.module.scss:6-29` trae ya resueltos la canaleta de `2.75rem`, el trazo
punteado por `color-mix` sobre un token (nunca un literal, que es lo que rompe el
tema oscuro del criterio 214) y el `min-width: 0` que hace verdadero el criterio
213. Se copia entero y se le cambia el token: `--aura-ring-to` (violeta) **no**,
porque el criterio 214 prohíbe confundirse con el aviso de FEAT-007; el mint de
la marca es el que usan `VidaDayBudget.module.scss:91` y
`VidaReviewBridge.module.scss:1`.

Para la canaleta **con hora en gris** (criterio 371), el trozo a copiar es
`VidaAgendaGap.tsx:157-161`.

### Dónde vive la regla: `utils/vida-up-next.utils.ts` (nuevo)

Archivo **nuevo**, puro, sin React, hermano de `vida-execution.utils.ts` y de
`vida-gap-window.utils.ts` (el que FEAT-011 acaba de estrenar). **No va dentro
de `vida-agenda.utils.ts`**: ese archivo no sabe nada de sesiones **por
diseño** —está escrito en la cabecera de `vida-execution.utils.ts:1-10`— y la
regla del criterio 375 necesita saber qué está resuelto.

Cuatro funciones, y ninguna constante de minutos (criterio 375 y la hipótesis
del analista: *si aparece un umbral, la regla se está reinterpretando*):

1. `collectResolvedBlockIds({ blocks, byBlockId, insteadByBlockId, couldNotItemIds })
   → Set<string>` — las **tres** fuentes del criterio 186 en un sitio.
2. `pickUpNextBlock({ blocks, resolvedBlockIds, nowMinutes }) → AgendaBlock | null`
   — la regla, escrita tal cual la dice el analista y sin números:
   ```
   abiertos   = blocks sin resolver
   llegados   = abiertos con startMinutes <= nowMinutes
   candidatos = llegados.length ? llegados con startMinutes === max(llegados.startMinutes)
                                : abiertos con startMinutes === min(abiertos.startMinutes)
   return candidatos ordenados por (startMinutes asc, durationMinutes asc, índice en blocks)[0]
   ```
   El `max`/`min` es lo que hace el criterio 375 (el más reciente que ya llegó;
   si ninguno, el siguiente) y el desempate de tres pasos es el criterio 184
   literal. **Nunca devuelve dos.**
3. `findUpNextAnchorId({ entries, byBlockId }) → string | null` — el criterio
   370, y aquí está el detalle que no es obvio: **hay dos formas de «lo que está
   pasando»**. Si la sesión viva está *movida* o *fuera del plan*, la fila real
   es un `ExecutionSessionEntry` (`vida-execution.utils.ts:339`); si está pegada
   a su bloque, la fila real es el propio bloque. El orden es:
   `entries.find(e => e.kind === 'session' && e.span.isRunning)?.id`
   → si no, `entries.find(e => e.kind === 'block' && byBlockId[e.id]?.isRunning)?.id`
   → si no, `entries.find(e => e.kind === 'now')?.id` (que vale `'now'`)
   → si no, `null` (y entonces **no hay tarjeta**, que es lo que pide el
   criterio 180 cuando el reloj cae fuera del día).
   Un bloque en marcha **no lleva aviso de FEAT-007** debajo (`pickBlockHints`
   lo descarta con `isDone`, `VidaHoyPage.tsx:344-348`), así que no hay disputa
   de orden entre la tarjeta y el aviso.
4. `buildUpNext({ block, usualMinutes, runningTitle, nowMinutes, dayEndTime, remainingMinutes, canStart, templateHasNothing })
   → UpNext | null` — **todos los textos ya escritos**, para que el componente
   sea tonto: `variant: 'proposal' | 'empty'`, `gutterLabel` (`'11:30'` o `''`,
   criterio 371), `title`, `icon`, `color`, `metaLine`
   («En tu plantilla, a las 11:30 · suele durarte 30 min», criterios 183 y 372),
   `truthLine` (criterio 373, **siempre**, con la coletilla del criterio 378
   cuando `runningTitle` no es `null`), `isOverdue` (criterio 193),
   `regionLabel`, `buttonLabel` y `buttonSrLabel` («Empezar Daily meeting
   ahora», criterio 206), `exits: { othersCount, showDidIt }` (criterio 376).
   **Ninguna hora de fin, en ninguna rama** (criterio 373).

Test hermano `utils/vida-up-next.utils.test.ts`, con los tres casos del criterio
375 (11:05→11:30 · 13:40→13:00 y no las 18:00 · 20:00 con 13:00 y 18:00 abiertas
→ 18:00), los tres del 184, los cuatro anclajes del 370 y el barrido de palabras
del criterio 210 sobre los textos que devuelve (más barato aquí que sobre el DOM,
y el del DOM se queda igual en la página). El molde de tests es
`utils/vida-agenda.utils.test.ts`.

**«Suele durarte» (criterio 372).** El bloque del plan es un
`ActivityDayPlanItem` y **no guarda de qué ítem de plantilla salió** (verificado:
`types/activity-day-plan.types.ts:15-29`), así que el cruce es por `activityId`.
FEAT-011 **ya dejó planeada** esa función con su firma en su sección 2
(`usualDurationsByActivityId`, hermana de `usualDurationsByItemId` en
`vida-patterns.utils.ts:970-981`, desempatando por `usualDurationSamples`,
`:302`). **Orden de llegada**: si la tajada 3 de FEAT-011 ya está en `main`, se
**consume** y no se escribe nada; si no, se crea **ahí mismo y con esa misma
firma**, y FEAT-011 la consume. Lo que no puede pasar es que existan dos.
Comprobación de una línea antes de escribirla:
`git grep -n "usualDurationsByActivityId" -- src`.

### Dónde va el código nuevo, archivo a archivo

**Se crean**

| Archivo | Qué lleva |
|---|---|
| `src/features/vida/utils/vida-up-next.utils.ts` | Las cuatro funciones de arriba |
| `src/features/vida/utils/vida-up-next.utils.test.ts` | Sus casos |
| `src/features/vida/components/VidaUpNextCard/VidaUpNextCard.tsx` | El `<li>` tonto: copia de `VidaBlockHint.tsx:44-79` |
| `src/features/vida/components/VidaUpNextCard/VidaUpNextCard.module.scss` | Copia de `VidaBlockHint.module.scss` con el token mint y la canaleta con hora |
| `src/features/vida/components/VidaUpNextCard/index.ts` | `export { VidaUpNextCard } from './VidaUpNextCard'` |

**Se modifican** (`VidaHoyPage.tsx`, líneas de `main` `30a0d40`)

| Línea | Qué se hace |
|---|---|
| `:8` | Un `import` más, al lado del de `VidaBlockHint` |
| tras `:321` | `const usualByActivityId = useMemo(() => usualDurationsByActivityId(patterns.patterns), [patterns.patterns])`. **Un `useMemo` hermano, debajo; no se reescribe el de `:319-321`** — ése es el que toca la tajada 3 de FEAT-011 |
| tras `:260` | `const upNext = useMemo(...)`: `collectResolvedBlockIds` + `pickUpNextBlock` + `findUpNextAnchorId` + `buildUpNext`. Depende de `agenda`, `execution`, `blockNotes`, `nowMinutes`, `openSession.session`, `usualByActivityId`, `canStart`, `executionKnown`, `isToday`. **Puro: cero consultas** (criterio 204) |
| `:647` | `execution.entries.map(` → `execution.entries.flatMap(`, y el cuerpo actual se extrae a `renderEntry(entry)` **sin tocar su contenido**. El retorno pasa a ser `entry.id === upNext?.anchorId ? [renderEntry(entry), upNextCard] : [renderEntry(entry)]` |
| tras `:795` | `const upNextCard = upNext ? <VidaUpNextCard key="up-next" … /> : null`, declarado **antes** de `agendaList` |

**El detalle que decide el criterio 379 y no se puede improvisar:** el
`flatMap` es lo que deja la tarjeta como **hijo directo del `<ol>`** con la
`key` constante `"up-next"`. Así React la **mueve** cuando cambia de sitio en vez
de desmontarla y remontarla. Si se mete dentro del `<Fragment key={entry.id}>`
de `:679` —que es donde vive el aviso de FEAT-007— cambiar de ancla **cambia de
padre**, y eso sí es desmontar: el foco se va a `body` y el criterio 205 se cae.
No hay forma de verlo en una revisión rápida; por eso está escrito aquí.

**Qué NO cambia en el bucle:** la fila del bloque propuesto **se queda en la
lista, en su hora y con su «▶ Empezar»**. La tarjeta no la sustituye ni la
esconde — es lo que exige el criterio 211 (el test compara el texto de las dos)
y lo que mantiene vivo el criterio 1 de FEAT-004. La tarjeta es **una segunda
entrada al mismo gesto**, no una mudanza.

**Tests de página:** `src/features/vida/pages/VidaHoyPage.test.tsx` (es donde
están los cuatro estados, el espía de consultas del criterio 204 y el barrido de
lenguaje del criterio 210).

### Qué NO se crea

- **Un `kind` nuevo en `buildDayExecution`.** Es la hipótesis que hay que tirar.
  `entries` alimenta `getExecutedBudget`, `buildNoDataSlices`
  (`vida-execution.utils.ts:807`) y, desde FEAT-011 tajada 2,
  `vida-gap-window.utils.ts`; una entrada fantasma con `trackMinutes` metería
  ancho en la barra y tramos «sin dato» falsos. **La regla es pura y va en su
  util; la inserción es cosa del render.**
- **Un hook, una consulta o un temporizador.** `useVidaPatterns` (`:327`) y
  `useVidaNowMinute` (`:145`) ya están montados.
- **Una hoja nueva**, ni una confirmación: el botón llama a `start` y punto
  (criterio 374). «Empezar otra cosa» reusa `openLogSheet({ mode: 'start' })`.
- **Una segunda aritmética de «Ya la hice»**: se llama `markBlockDone`
  (`VidaHoyPage.tsx:474`).
- **`usualDurationsByActivityId`**, si FEAT-011 tajada 3 ya la dejó.
- **Nada en `localStorage`**, ningún documento GraphQL, ningún icono nuevo.

### Dónde NO va (medido, para que nadie lo reconsidere)

- **Fuera del `<ol>`, arriba de la lista.** Es el render 11, derogado por el
  criterio 370.
- **Dentro de `VidaAgendaBlock`.** Entregado y revisado desde FEAT-004; la
  tarjeta no es parte de un bloque y el precedente de colgar sin tocar
  (`VidaBlockHint`, `VidaAgendaNoData`) ya está establecido.
- **En `vida-agenda.utils.ts`.** Esa capa no sabe de sesiones por diseño.
- **Reusando `findNextBlockId`** (`vida-agenda.utils.ts:565`): ignora lo
  resuelto y lo que ya pasó; reusarlo reintroduce exactamente el caso que el
  criterio 375 arregla.
- **Ordenando la tarjeta por su hora** dentro de la lista. El render 14, momento
  3, la pinta **después de AHORA (13:40) con «13:00» en la canaleta**: la
  posición es estructural y la hora de la izquierda es un dato, no una clave de
  orden.
- **Desplegar «Ver las otras N» en la línea** (opción (a) de la D1): ver abajo.

### D1 — qué abre «Ver las otras N»: **(c), y se puede construir**

Verificado en código: `openLogSheet({ mode: 'start' })` monta
`VidaLogSessionSheet` (`VidaHoyPage.tsx:959-985`), que pasa las `suggestions` del
día a `VidaActivityPicker` (`VidaLogSessionSheet.tsx:335-340`), y el picker
**pone primero la plantilla de ese día** (`VidaActivityPicker.tsx:65-66` y
`:96-143`) **sin excluir nada**, porque la hoja no le pasa `excludeActivityIds`
(sí lo hace `VidaPlaceInGapSheet`). Así que (c) es **cero UI nueva** y cumple la
premisa del plan (una intención, una acción: un toque abre la lista ya ordenada).

**La costura, dicha en voz alta:** la hoja enseña **la plantilla del día**, y la
`N` del rótulo cuenta **los bloques del plan sin resolver**. En un día armado
desde la plantilla son los mismos; en un día tocado a mano pueden no coincidir
(un bloque puesto a mano no está en la plantilla). Es un desajuste de rótulo, no
de camino: nadie se queda sin poder empezar nada. Si al usuario le molesta, (a)
sigue abierta y solo cambia el tamaño de la tarjeta.

### Las tajadas, con archivos

**Un recorte sobre la sección 1, con su razón** (es lo único que contradigo): la
sección 1 partía el criterio 375 en dos, dejando la mitad «ya llegó» para la
tajada 2. **Eso no se puede entregar:** con solo la mitad «el siguiente por
hora», un día con algo sin resolver a las 13:00 propondría **lo de las 18:00** a
las 13:40 — que es justo el caso que el criterio 375 escribe como incorrecto, y
es el día normal del usuario. Así que **el criterio 375 entero, con sus tres
casos y los del 184, entra en la tajada 1**; la tajada 2 se queda con lo que de
verdad es borde de pantalla: el rótulo «· se pasó de la hora», «Ya la hice» y la
cara de «ya no queda nada». Las tres siguen siendo verticales y el orden de la
sección 1 no cambia.

Con ese recorte, **el criterio 209 queda partido**: su primera mitad (no
proponer, no decir «ya no queda nada») la cumple la tajada 1 **no pintando
tarjeta**; la segunda («deja "Empezar algo"») necesita la cara del criterio 377
y se cierra en la tajada 2. Queda anotado, no reescrito.

| # | What it does | Files | Criteria it closes | State |
|---|---|---|---|---|
| 1 | **«Lo que viene» dentro de la línea, con la promesa y un clic.** La regla entera, el anclaje, la tarjeta y el arranque de un toque. Sin candidatos, no se pinta nada (eso es la tajada 2). | **crea** `utils/vida-up-next.utils.ts` + `.test.ts` · **crea** `components/VidaUpNextCard/{VidaUpNextCard.tsx,.module.scss,index.ts}` · `VidaHoyPage.tsx:8` (import), tras `:260` (el `useMemo`), tras `:321` (`usualByActivityId`), `:647` (`map`→`flatMap` + `renderEntry`), antes de `:642` (`upNextCard`) · `vida-patterns.utils.ts` tras `:981` + su test **solo si FEAT-011 t3 no ha llegado** · `VidaHoyPage.test.tsx` | 180, 183, 184, 186, 187, 188, 189, 196, 203, 204, 205, 206, 207, 208, 210, 211, 212, 213, 214, 215, 216, 217, 370, 371, 372, 373, 374, **375 entero**, 376, 378, 379 · 209 su primera mitad | aceptada |
| 2 | **Los dos bordes: se pasó la hora, y ya no queda nada.** El rótulo, «Ya la hice» y la cara apagada con lo que queda de día. | `utils/vida-up-next.utils.ts` (`variant: 'empty'`, `isOverdue`, `showDidIt`) + su test · `VidaUpNextCard.tsx` y su `.module.scss` (trazo apagado y punteado) · `VidaHoyPage.tsx` (pasar `budget`/`dayHours.endTime` y enganchar `markBlockDone` en `:474`) · `VidaHoyPage.test.tsx` (los números coinciden con `VidaDayBudget`) | 192, 193, 197, 377 · 209 su segunda mitad · 218 (el usuario) | aceptada |
| 3 | **Retirar las fichas del hueco y el panel «Tu plantilla de \<día\>».** Con los cuatro caminos comprobados uno a uno. | ver el plan de retirada | 380, 381, 382, 383, 384, 385 | in-review |

### El plan de retirada de la tajada 3, archivo a archivo

**Antes de tocar nada**, y es lo que el criterio 385 pide por escrito:

```
git grep -n "suggestionsForGap\|MAX_GAP_SUGGESTIONS\|findFirstFittingGap\|GapSuggestion\|fitsInGap\|usualDurationsByItemId" -- src
```

Contado hoy sobre `main` (`30a0d40`), consumidor a consumidor:

| Símbolo (`utils/vida-agenda.utils.ts`) | Quién lo usa hoy | Qué queda después |
|---|---|---|
| `suggestionsForGap` (`:489`) | `VidaHoyPage.tsx:764` y su test | **Sin consumidor → se borra** |
| `MAX_GAP_SUGGESTIONS` (`:34`) | solo `suggestionsForGap` | **Se borra** |
| `GapSuggestion` / `GapSuggestions` (`:417`, `:429`) | `VidaAgendaGap.tsx:4,20` y `VidaHoyPage.tsx:35,97` (`NO_SUGGESTIONS`) | **Se borran los tres sitios** |
| `findFirstFittingGap` (`:472`) | **solo** `VidaTemplateAside.tsx:17,184` | **Se borra** |
| `fitsInGap` (`:455`) | **solo** `suggestionsForGap` y `findFirstFittingGap` (+ su test) | **La premisa del criterio 385 es falsa: `VidaDurationPills` no lo usa** (verificado en todo `src`). Se queda **sin consumidor**: se borra con sus dos tests, salvo que FEAT-011 t3 lo haya enganchado — la orden `git grep` de arriba lo dice en un segundo |
| `usualDurationsByItemId` (`vida-patterns.utils.ts:970`) | solo `VidaHoyPage.tsx:319-321` → `suggestionsForGap` | **Sin consumidor → se borra con sus dos tests** (`vida-patterns.utils.test.ts:804,819`). Su mitad útil ya vive en `usualDurationsByActivityId` (criterio 372) |
| `fitsInGap`/`findFirstFittingGap` y FEAT-014 | FEAT-014 no los nombra: usa `VidaAgendaGap.tsx:106` y `validatePlacement` | No bloquea |

**Archivo a archivo:**

1. `components/VidaAgendaGap/VidaAgendaGap.tsx`
   - Se borra la rama de fichas, **`:168-250`** (`suggestions.visible.length > 0`:
     los chips, el «+N más» y la nota de «sueles tardar»).
   - Se borra la prop `suggestions: GapSuggestions` (`:19-20`), la prop
     `onPlaceSuggestion` (`:27-36`), `canPlace` (`:96`) y los `import` de
     `GapSuggestions`, `VidaSuggestion`, `AppIcon` y `UNCATEGORIZED_GROUP_ICON`
     si quedan huérfanos (`:2-13`).
   - **Se conserva**: la cabecera del hueco con su franja y su tamaño
     (`:158-167`), la rama `sliver`/`isPast` (`:106-152`, de FEAT-011) y
     **«+ otra cosa»** (`:275-294`), que pasa a ser la única salida de la rama
     futura (criterio 382).
   - La rama de plantilla vacía (`:251-274`) usaba `suggestions.templateCount`:
     se sustituye por una prop nueva `templateCount?: number` que la página ya
     tiene calculada en `VidaHoyPage.tsx:625`. Así el «tu plantilla no trae
     nada» + «Ver tus actividades» no se pierde por el camino.
   - `.module.scss`: mueren `.chips`, `.chip`, `.chipName`, `.chipTime`,
     `.note`; se quedan `.row`, `.gutter`, `.time`, `.card`, `.head`, `.free`,
     `.size`, `.logButton`.
2. `components/VidaTemplateAside/` — **desaparece la carpeta**. Antes, **mover**
   `VidaTomorrowBlock` (`VidaTemplateAside.tsx:243-326`, que solo necesita
   `viewedDate`) y sus reglas de `.module.scss` a
   `components/VidaTomorrowAside/` (`.tsx`, `.module.scss`, `index.ts`). Mueren
   con el archivo: `PlaceInFirstGapButton` (`:165-240`), la lista de plantilla
   (`:98-144`), el `useAddDayPlanItemMutation` del lateral (`:92`) y el
   `<h2>Tu plantilla de {dayLabel}</h2>` (`:96`).
3. `pages/VidaHoyPage.tsx`
   - `:15` import de `VidaTemplateAside` → `VidaTomorrowAside`.
   - `:931-939`: el `<VidaTemplateAside …>` pasa a `<VidaTomorrowAside date={date} />`
     (sin `suggestions`, `planItems`, `agenda`, `dayLabel`).
   - `:417-448` **se borra `placeSuggestion` entero**, y con él la única llamada
     a `openSheet({ kind: 'place', preselected })` desde una ficha. **Ojo, lo que
     NO se borra:** `openSheet` y `SheetState.kind === 'place'` siguen vivos,
     porque «+ otra cosa» los usa (`:776-780`), y `addMutation` (`:400`) lo usa
     la hoja. Si se borra `addMutation` se rompe «+ otra cosa».
   - `:762-775` la prop `suggestions={…}` del hueco → `templateCount={templateCount}`;
     `:775` `onPlaceSuggestion` fuera; `:97` `NO_SUGGESTIONS` fuera;
     `:35,42,54` los `import` correspondientes; `:319-321` el `useMemo` de
     `usualDurations` fuera (el hermano `usualByActivityId` **se queda**).
   - `isPlacing` (`:791`) se queda solo si la rama futura conserva algún control
     con estado en vuelo; si no, fuera.
4. `utils/vida-agenda.utils.ts` y `utils/vida-patterns.utils.ts` — los borrados
   de la tabla de arriba.
5. **Tests**: `utils/vida-agenda.utils.test.ts:442-640` (todo el `describe` de
   `suggestionsForGap`) y `:428-440` (`fitsInGap`) **no se borran a secas**: se
   sustituyen por un test que afirma lo nuevo —el hueco futuro enseña su franja,
   su tamaño y **solo** «+ otra cosa»— nombrando el criterio que lo deroga
   («FEAT-003 18/19/23, derogados por FEAT-010 criterio 381»), como se hizo en
   FEAT-006. Igual con `vida-patterns.utils.test.ts:804,819` (FEAT-007 criterio
   91, mitad derogada por el criterio 381; la útil vive en el 372).
6. **Los cuatro caminos del criterio 384, verificados en código antes de
   empezar** — los cuatro **sobreviven**, ninguno se toca:
   **(a)** «+ otra cosa» → `VidaAgendaGap.tsx:275-294` → `onOpenSheet`
   (`VidaHoyPage.tsx:776-780`) → `VidaPlaceInGapSheet` con el subtítulo del
   hueco. **(b)** «Armar desde la plantilla» → `VidaHoyPage.tsx:889-910`
   (`useBuildDayFromTemplate`), más `VidaSemanaPage`. **(c)** «Armar mañana» →
   `VidaTomorrowBlock`, que se **mueve** y no se borra. **(d)**
   `/app/vida/plantilla` → `vida-paths.ts`, intacta. Un test por camino en
   `VidaHoyPage.test.tsx`.

### El orden de entrada, con tres features en el mismo archivo

Condición dura del plan de Vida: **no las construye el mismo constructor en la
misma rama**. Con eso dado, el orden es:

1. **FEAT-011 tajada 2** (hoy `in-review`, **sin commitear**) cierra primero.
   Toca `vida-execution.utils.ts:648-672,757-769,790` y `VidaHoyPage.tsx`:
   empezar FEAT-010 encima de un árbol sucio contamina la línea base de lint y
   tests de las dos.
2. **FEAT-010 tajadas 1 y 2.** Solo **añaden** en `VidaHoyPage.tsx` (un import,
   dos `useMemo`, el `flatMap` del `:647`) y **no tocan** `VidaAgendaGap.tsx`,
   `VidaAgendaBlock.tsx` ni `VidaLogSessionSheet.tsx`. Pueden ir en paralelo con
   **FEAT-013 tajadas 2 y 3**, que viven en `VidaAgendaBlock.tsx:203` y en la
   barra de sesión. Única costura con FEAT-011 t3: el `useMemo` de `:319-321`
   — por eso el de FEAT-010 va **debajo**, no encima.
3. **FEAT-011 tajada 3 antes de FEAT-010 tajada 3.** Obligatorio: 011-3 edita
   `VidaAgendaGap.tsx:108-232` y estrena `usualDurationsByActivityId`; 010-3
   borra `:168-250` y `usualDurationsByItemId`. Al revés, 011-3 se encuentra un
   archivo que ya no tiene sus líneas y se replanifica entero.
4. **FEAT-010 tajada 3, la última de todas** (criterio 380: no se quita un
   camino antes de que el que lo sustituye esté en pantalla y funcione).

### Lo que no pude comprobar

- **Nada se vio en pantalla**: todo `/app/*` está detrás del login y los agentes
  no entran (`ENVIRONMENT.md`). Los criterios 212 (375 px), 213 (texto largo),
  214 (oscuro) y 218 los cierra el usuario a mano; el constructor los deja como
  pasos escritos.
- El árbol de trabajo tiene **FEAT-011 tajada 2 sin commitear**: todo lo de
  arriba está leído sobre `main` (`30a0d40`). Las líneas de `VidaHoyPage.tsx`,
  `VidaLogSessionSheet.tsx` y `vida-execution.utils.ts` **se habrán movido** para
  cuando se construya: se localizan por el texto citado, no por el número.

## 3. Construction — feature-builder

### Tajada 1 — «Lo que viene», dentro de la línea, con la promesa y un clic

**Resumen para el revisor:**

1. Dentro del `<ol>` de la agenda de Hoy, **justo debajo de lo que está pasando**
   (o de la línea de AHORA), sale una tarjeta mint que dice qué toca luego según
   el plan, con «suele durarte N», la frase de verdad **siempre**, y un
   «▶ Empezar ahora» que **arranca en un solo toque**.
2. Vive en `utils/vida-up-next.utils.ts` (puro, 20 tests) +
   `components/VidaUpNextCard/` + cuatro añadidos en `VidaHoyPage.tsx`.
3. **Lo que más probablemente rompí:** el `map` del bucle de la agenda pasó a
   `flatMap` y su cuerpo se **extrajo tal cual** a `renderEntry(entry)`. Es un
   corta y pega de 148 líneas: si algo de la agenda se pinta raro —una fila
   perdida, una `key` duplicada, el `ref` de «Ahora»—, **mirad ahí primero**. Y
   lo segundo: **el nombre de lo propuesto se lee ahora dos veces en pantalla a
   propósito** (criterio 211), lo que rompió 10 tests de `VidaHoyPage.test.tsx`
   que hacían `getByText('Bañarme')`; los arreglé con un ayudante `planRow()`,
   no cambiando la pantalla.

**Lo que se construyó**

| Archivo | Qué lleva |
|---|---|
| `src/features/vida/utils/vida-up-next.utils.ts` **(nuevo)** | Las cuatro funciones del plan: `collectResolvedBlockIds` (las tres fuentes del 186), `pickUpNextBlock` (la regla del 375 entera + el desempate del 184), `findUpNextAnchorId` (los cuatro anclajes del 370) y `buildUpNext` (todos los textos escritos). **Sin una sola constante de minutos.** |
| `src/features/vida/utils/vida-up-next.utils.test.ts` **(nuevo)** | 20 casos: los tres del 375, los tres del 184, los cuatro anclajes del 370, los textos del 183/371/372/373/376/378, el 189 y el barrido de lenguaje del 210. |
| `src/features/vida/components/VidaUpNextCard/{VidaUpNextCard.tsx,.module.scss,index.ts}` **(nuevo)** | El `<li>` tonto, copiado de `VidaBlockHint`: canaleta de `2.75rem` con la hora en gris, trazo **mint** por `color-mix` sobre `--aura-ring-from` y punto **punteado**. |
| `src/features/vida/pages/VidaHoyPage.tsx` | Dos `import`, el `useMemo` de `upNext` (debajo del de `usualDurationsByActivity`, como pedía el plan), `const upNextCard`, y el bucle de la agenda: `map` → `flatMap` con `renderEntry(entry)` extraído **sin tocar su contenido**. |
| `src/features/vida/pages/VidaHoyPage.test.tsx` | 14 casos nuevos, el ayudante `planRow()` y contadores de consultas (`queryCalls`) para el criterio 204. |

**Por qué así, y qué descarté**

- **Tres desvíos del plan, los tres dichos en voz alta:**
  1. **`formatDurationMinutes` en vez de `formatDurationFromMinutes`.** El plan
     nombraba la segunda, que escribe «30m» y «4h». El render aprobado escribe
     «30 min» y «4 h», que es lo que dice el criterio 183 literalmente — y es
     además **la misma función que usa la fila del bloque**, que es lo que hace
     verdadero el criterio 211. Mandó el render.
  2. **El artículo de la frase de verdad se elige por el número**: «los 30 min»,
     «las 4 h». El criterio 373 cita la frase con 30 min; «los 4 h» no se lee en
     castellano y el criterio 373 exige la misma frase **con 4 h**.
  3. **`usualDurationsByActivityId` no se creó**: FEAT-011 tajada 3 ya la dejó en
     `main` y **ya estaba instanciada** en `VidaHoyPage.tsx` como
     `usualDurationsByActivity`. Se consume esa, como mandaba el plan.
- **La duración planeada no viaja a la sesión, y hay un test que lo afirma con
  una igualdad exacta**: `expect(startSession.mock.calls[0]).toEqual(['a-b1'])`.
  Un argumento, el `activityId`. Ni los 45 min del plan, ni las 8:00 de la ficha.
  El camino fácil aquí era pasar `start(activityId, startTime)` —la firma lo
  admite, la usa la hoja— y habría registrado la hora de la plantilla en vez de
  la del reloj; por eso el test compara el array entero y no solo el primer
  argumento.
- **Lo que no se creó**, como pedía el plan: ni `kind` nuevo en
  `buildDayExecution`, ni hook, ni consulta, ni temporizador, ni hoja nueva, ni
  documento GraphQL, ni icono. «Ver las otras N» y «Empezar otra cosa» llaman las
  dos a `openLogSheet({ mode: 'start' })` (D1, opción (c)): cero UI nueva.
- **El literal `#04261c`** es el único color escrito a mano, y está comentado en
  el `.scss`: es la tinta **sobre** el botón mint, que es mint en los dos temas.
  Lo que rompería el contraste ahí sería el blanco (2,5:1 medido sobre `#10b981`).

**Verificación**

| Qué | Resultado |
|---|---|
| `pnpm typecheck` | limpio |
| `pnpm lint` | **14 errores / 0 warnings** — la línea base exacta. (Tuve uno de más, `NO_COULD_NOT` sin usar en el test nuevo; borrado.) |
| `pnpm test` (línea base al empezar) | `Tests 2 failed | 1744 passed (1746)` — los dos de `SearchSelect`. `IconPicker` no apareció. |
| `pnpm test` (al terminar) | `Tests 2 failed | 1778 passed (1780)` — **los mismos dos**. +34 tests (20 del util, 14 de la página). |
| `pnpm vitest run VidaHoyPage.test.tsx` | `138 passed (138)` |
| `pnpm build` | exit 0. Chunk inicial **1.111,79 kB** (línea base 1.106,50) → **+5,29 kB**, que son el util y el componente. `app-icons` **620,20 kB, sin mover**: no entró ningún icono nuevo al arranque. |
| `graphify update .` | hecho (4037 nodos) |

**Criterios que cierra, uno a uno**

- **180** ✔ Cuatro puertas en el `useMemo`: `isToday`, `nowMinutes !== null`, el
  reloj dentro de `[dayStart, dayEnd)` y un ancla. Sin todas, `upNext` es `null`
  y **no se pinta ningún nodo**. Test: en `?d=2026-09-17` no hay región.
- **183, 371, 372, 373** ✔ Test de página que compara los textos literales:
  «Lo que viene», «En tu plantilla, a las 8:00 · suele durarte 45 min», la frase
  de verdad entera, la hora en el `<time>` de la canaleta y **ninguna hora de
  fin**. La costumbre manda sobre la plantilla: test del util.
- **184, 375** ✔ Los seis casos, en el test del util (11:05→11:30 · 13:40→13:00
  y no 18:00 · 20:00→18:00 · inicio menor · menos duración · orden de la agenda).
- **186** ✔ Las tres fuentes en `collectResolvedBlockIds`, con test del util y
  test de página (con Bañarme registrado, propone «Leer un rato»).
- **187** ✔ «Empezar otra cosa» llama a `openLogSheet({ mode: 'start' })`, la
  misma hoja. Test: abre `role="dialog"`.
- **188** ✔ `isSessionBusy={sessionActions.isBusy}` — **la misma variable** que
  ya frena el «▶ Empezar» del bloque, que ya era de página. Test: un clic, una
  llamada.
- **189** ✔ Con `isFromAnotherDay`, no hay botón y sale la línea que lleva a la
  barra. Test de página.
- **196** ✔ `start(activityId)` **sin hora**: la pone la mutación. Test de la
  igualdad exacta del array de argumentos.
- **203** ✔ No se tocó nada de la barra fija (`AppLayout`).
- **204** ✔ Test con contadores: **las mismas consultas** con tarjeta y sin ella
  (`expect(queryCalls).toEqual(sinTarjeta)`). Cero hooks nuevos.
- **205, 207, 379** ✔ `key="up-next"` constante e **hija directa del `<ol>`**:
  React la mueve, no la remonta. Test: con el foco en el botón, un tic de 60 s lo
  deja donde estaba, nunca en `body`. `aria-live="polite"` solo en el titular,
  sin `role="alert"`.
- **206** ✔ `aria-label="Empezar Bañarme ahora"`; el triángulo va `aria-hidden`.
- **208 y 209 (primera mitad)** ✔ Con lo vivido en vuelo o caído, no hay tarjeta:
  no afirma nada. Test de página con los dos estados.
- **210** ✔ Barrido de las ocho palabras sobre el DOM de la tarjeta y sobre los
  textos del util.
- **211** ✔ Test que compara fila y tarjeta: mismo nombre, misma duración, misma
  hora. **El bloque se queda en la lista con su «▶ Empezar».**
- **215** ✔ La tarjeta entra por `flatMap` en el `<ol>`, **fuera** del
  `<Fragment>` donde vive el aviso de FEAT-007; `pickBlockHints` no se tocó y un
  bloque en marcha no lleva aviso, así que no hay disputa de orden.
- **216** ✔ Test: la tarjeta no dice «Libre» ni ofrece «Registrar lo que hice».
  `VidaAgendaGap.tsx` **no se tocó**.
- **217** ✔ Tabla de arriba.
- **370** ✔ Test de posición: la tarjeta es hija directa del `<ol>` y su hermana
  anterior es la línea de AHORA sin nada en marcha, y la fila de la sesión viva
  con algo en marcha.
- **374** ✔ Test: entre el clic y `activityFollowUpStart` **no se abre ningún
  diálogo ni ninguna hoja**.
- **376** ✔ «Ver las otras 2» (N real, y no se escribe con 0), «Empezar otra
  cosa» siempre, ninguna en un menú. «Ya la hice» **no** se escribe todavía: es
  la tajada 2 (criterios 193 y 197), tal como las repartió la tabla del plan.
- **378** ✔ La coletilla con el nombre real. Test: además afirma que la tarjeta
  **no manda ninguna mutación de cierre por su cuenta**.

**Pendientes de prueba a mano** (todo `/app/*` está detrás del login y los
agentes no entran — `ENVIRONMENT.md`; el arquitecto ya lo anticipó):

- **212 (375 px)**: abrir Hoy en un móvil de 375 px con algo en marcha. Que no
  haya scroll horizontal y que el botón, la frase de verdad y la línea de salidas
  quepan dentro de la canaleta de la agenda.
- **213 (texto largo)**: poner en el plan una actividad con ~60 caracteres de
  nombre y comprobar que se recorta con puntos suspensivos sin empujar nada.
- **214 (oscuro y trazo)**: mirarla en tema oscuro y comprobar de un vistazo que
  no se confunde con la línea de AHORA (violeta sólido) ni con el aviso punteado
  violeta de FEAT-007, y que todos sus textos se leen.
- **218**: es criterio de fase y lo cierra el usuario con la API despierta.
- **193, 197, 377, 192 y la segunda mitad del 209**: son la **tajada 2**, no
  están construidos.

**Riesgos**

- **El `flatMap` y `renderEntry`.** El riesgo real de esta tajada. Los 138 tests
  de la página pasan, que es la mejor red que hay, pero es un movimiento de 148
  líneas.
- **El nombre duplicado en pantalla.** Es correcto por el criterio 211, pero
  cualquier test futuro que busque un nombre a secas en Hoy se encontrará dos.
  Por eso el ayudante `planRow()` está documentado en el propio fichero.
- **`queryCalls` en los mocks del test.** Toqué cinco factorías de `vi.mock`
  para contar llamadas. Si algún test futuro cuenta consultas, ahí está el
  contador.

**Lo que encontré y no estaba en el plan** (no lo toqué, criterio de alcance):

- **`--color-on-primary` no existe** en `_theme-variables.scss`. Lo busqué para
  la tinta del botón mint y no está; se resolvió con el literal comentado.
- **`AgendaBlock` no guarda de qué ítem de plantilla salió**, como decía el
  plan, pero además **`couldNotItemIds` va por `item.id`** y no por `block.id`:
  hoy coinciden, y `collectResolvedBlockIds` no depende de que coincidan.
- **El árbol tiene dos ficheros sin seguir que no son míos**:
  `docs/features/FEAT-016-vida-barra-de-trabajo.md` y
  `docs/vida/assets/15-vida-barra-de-trabajo.html`. Ni los leí ni los toqué.

**Estado del árbol:** sin commitear.

### Tajada 1 (vuelta de la devolución) — el foco al mudarse, el anuncio de lo que cambia y el nombre entero

**Resumen para el revisor:** los dos motivos de la devolución están arreglados en
**el mismo componente** (`VidaUpNextCard.tsx`): la tarjeta ahora **se acuerda de
qué llevaba el foco y se lo devuelve cuando cambia de ancla**, y el
`aria-live="polite"` se ha mudado del rótulo constante **al titular**, que es lo
único que cambia cuando cambia lo propuesto; de paso, el `title` del criterio 213.
No se tocó `vida-up-next.utils.ts`, ni `VidaHoyPage.tsx`, ni el `.scss`, ni el
`flatMap` de 148 líneas que ya diste por bueno.
**Lo que más probablemente he roto:** la devolución del foco. Vive en un
`useLayoutEffect` que dispara **en cada cambio de `anchorId`**; si algún día el
ancla cambia sin que la tarjeta se mueva, o si el usuario deja el foco en `body`
justo antes de una mudanza, la tarjeta **se lleva el foco al botón** sin que nadie
se lo pida. Está acotado con tres guardas y explicado abajo, pero es el sitio
donde mirar. El segundo sitio: el rótulo «Lo que viene» **ya no es región viva**,
así que si alguien contaba con que se anunciara al aparecer la tarjeta, ya no.

**Qué se construyó**

- `src/features/vida/components/VidaUpNextCard/VidaUpNextCard.tsx` — tres cambios:
  1. **El foco sobrevive a la mudanza (205 / 379).** `focusedRef` recuerda el
     último elemento enfocado **dentro** del `<li>` (`onFocus`, que es
     `focusin` y burbujea) y lo olvida cuando el foco **se va a otro elemento**
     (`onBlur`/`focusout` con `relatedTarget` fuera de la tarjeta). Un
     `useLayoutEffect` con dependencia `[upNext.anchorId]` compara el ancla
     anterior con la nueva y, **solo si cambió**, devuelve el foco. Tres guardas
     para no robarlo: se exige que haya memoria (`focusedRef`), que el nodo siga
     conectado, y que **nadie más** tenga el foco (se permite `body`, `null` o el
     propio destino; cualquier otro elemento gana).
  2. **La región viva es el titular (207).** `aria-live="polite"` sale del `<p>`
     del rótulo —cuyo texto es siempre la constante `'Lo que viene'`— y pasa al
     `<p className={styles.name}>`. Sigue habiendo **una sola** región viva,
     sigue siendo `polite` y no hay `role="alert"`. El nombre de la región
     (`aria-label="Lo que viene"` del `<section>`) no se toca.
  3. **El nombre entero disponible (213).** `title={upNext.title}` en esa misma
     línea, que es la que recorta con `ellipsis`.
- `src/features/vida/pages/VidaHoyPage.test.tsx` — **tres pruebas nuevas** y una
  ampliada:
  - «al cambiar de ancla la tarjeta se mueve y el foco vuelve al botón, nunca a
    `body`»: enfoca «Empezar Bañarme ahora», **provoca la mudanza** (sesión
    abierta + `advanceTimersByTime(60_000)`, con lo que el ancla pasa de AHORA a
    la fila de la sesión), y afirma que el `<li>` es **el mismo nodo** en otro
    sitio, que el hermano anterior cambió a «Leer un rato», que
    `document.activeElement` es el botón y no `body`, y —con un espía sobre
    `boton.focus`— que **la devolución ocurrió de verdad**. Sin el arreglo,
    `focus()` no se llama nunca y la prueba cae aunque jsdom conserve el foco.
  - «lo que vive en `aria-live` es lo que cambia, no el rótulo»: cambia lo
    propuesto **sin tocar el reloj** (`markBlockCouldNot` sobre `b1`) y afirma
    que el nodo vivo es el mismo y su texto pasó de «Bañarme» a «Leer un rato»,
    que hay **una** región viva y que no dice «Lo que viene». Devuelve el store
    de aparato a cero al final (no se limpia solo entre pruebas; ése fue el
    único susto de la tanda).
  - «el nombre recortado sigue disponible entero»: `title` en la línea del nombre.
  - La prueba del reloj ya existente suma ahora `expect(volverAEnfocar).not.toHaveBeenCalled()`:
    **un tic no mueve nada y no toca el foco**.

**Por qué así, y qué descarté**

El revisor daba dos vías. **Descarté «dejar la tarjeta siempre en el mismo sitio
del array y mover lo demás»**: eso obliga a reordenar las filas de la agenda por
`flatMap` o por CSS `order`, cambia el orden del DOM que lee un lector de
pantalla y toca el bucle que acabas de verificar línea a línea. La devolución del
foco cabe **entera dentro del componente**, no toca la página y no mueve ni una
línea del `flatMap`.

La forma del arreglo **está medida, no deducida** (Chromium del panel):

- Mover un `<li>` que contiene al botón enfocado deja
  `document.activeElement === document.body` **y no dispara ningún evento de
  foco** (`blur`/`focusout`: lista vacía). Por eso la memoria de `focusedRef`
  sobrevive a la mudanza sin necesitar trucos.
- **Volver a enfocar en el mismo tic funciona** (`restored: true`), y por eso el
  efecto es `useLayoutEffect` —antes de que el navegador pinte— y no `useEffect`.
- **Enfocar lo que ya está enfocado no dispara nada** (`refocusSameElementEvents: []`),
  así que la llamada es inocua cuando el foco no se perdió (jsdom).
- **Deshabilitar el botón enfocado no mueve el foco** en este Chromium
  (`focusOnBtn: true`): el `isSessionBusy` del criterio 188 no abre un segundo
  agujero, y por eso el efecto no necesita reintentos.

Una decisión pequeña que conviene ver: el `focusout` con `relatedTarget` vacío
**no** borra la memoria. En el navegador real ese evento no llega a existir, pero
**jsdom sí lo emite al mover el nodo**; borrar ahí haría imposible la devolución
en la prueba y no aportaría nada en producción.

**Verificación**

| Qué | Resultado |
|---|---|
| `pnpm typecheck` | limpio (sin salida) |
| `pnpm lint` | `✖ 14 problems (14 errors, 0 warnings)` — la línea base exacta |
| `pnpm test` | `Tests  2 failed \| 1781 passed (1783)`, los dos de `SearchSelect`. `IconPicker` no apareció. Eran 1780 y ahora 1783: **las tres pruebas nuevas** |
| `pnpm test src/features/vida/pages/VidaHoyPage.test.tsx` | `141 passed (141)` |
| `pnpm build` | exit 0 · inicial **1.112,20 kB** (venía de 1.111,79: +0,41 kB, el efecto y los dos manejadores) · `app-icons` **620,20 kB sin mover** · `IconPicker` 4,64 kB |

**En el navegador de verdad, con un arnés temporal** (`harness-upnext.html` +
`src/harness-upnext.tsx`, **borrados los dos antes de reportar**): el componente
real dentro de un `<ol>` con dos filas y el mismo `flatMap` de la página; se
enfoca el botón y se pulsa «Empezar ahora», que cambia el ancla. Medido:

```
before: { prevRow: 'row-now', btnLabel: 'Empezar Bañarme ahora',
          liveText: 'Bañarme', liveAttr: 'polite',
          kickerText: 'Lo que viene', kickerHasLive: false }
focusedBefore: true
after:  { prevRow: 'row-sesion', sameLiNode: true, sameButtonNode: true,
          liveText: 'Leer un rato', liveSameNode: true, liveTitle: 'Leer un rato',
          liveCount: 1,
          activeIsBody: false, activeIsButton: true,
          activeLabel: 'Empezar Leer un rato ahora' }
```

Es decir, en Chromium: la tarjeta **se movió** (de `row-now` a `row-sesion`) sin
remontarse (`sameLiNode`, `sameButtonNode`), el foco **no acabó en `body`** sino
en el botón equivalente, y **la región viva cambió de texto sin cambiar de nodo**,
que es justo lo que hace hablar a un lector de pantalla.

**Criterios que cierra**

- **205** ✔ entero, incluida la segunda mitad. Medido arriba en Chromium
  (`activeIsBody: false`, `activeIsButton: true`) y protegido por la prueba que
  **provoca la mudanza**, no el tic. La otra mitad sigue como estaba: no roba el
  foco al montarse (la memoria arranca vacía) y no hace `scrollIntoView`.
- **207** ✔ entero: una sola región `polite`, en **el titular**, cuyo texto pasa
  de «Bañarme» a «Leer un rato» cuando cambia lo propuesto, y que **no cambia con
  el reloj**. Sin `assertive` ni `role="alert"`.
- **213** — su mitad de código: el nombre completo queda disponible en `title`,
  que es lo que faltaba. **La mitad visual (que un nombre de ~60 caracteres no
  rompa la tarjeta ni produzca scroll horizontal) sigue pendiente de prueba a
  mano**: no la reclamo.
- **217** ✔ reproducida la línea base exacta (tabla de arriba).

**Pendientes de prueba a mano, sin cambio respecto a tu revisión:** 212 (375 px),
213 (la mitad visual), 214 (oscuro y trazo) y 218. `/app/vida/hoy` está detrás del
login y los agentes no entran con credenciales. Pasos, en orden: abrir
`/app/vida/hoy` con la plantilla del día cargada; (1) a 375 px, comprobar que no
hay scroll horizontal; (2) poner en la plantilla una actividad de ~60 caracteres
y comprobar que se recorta con puntos suspensivos, que **el ratón ve el nombre
entero al posarse encima** (el `title` nuevo) y que el botón no se sale; (3) en
tema oscuro, comprobar que el trazo de la tarjeta es mint y el punto punteado, sin
confundirse con la línea violeta de AHORA ni con el aviso de FEAT-007; (4) con
un lector de pantalla, pulsar «Empezar ahora» y comprobar que **se oye el nombre
nuevo** y que el foco sigue en el botón.

**Riesgos**

- **La devolución del foco es lo nuevo y lo delicado.** Se dispara con el cambio
  de `anchorId`; hoy eso solo pasa cuando algo arranca o termina, que son gestos
  del usuario. El caso incómodo es: foco en el botón → clic en un hueco sin nada
  (el foco se va a `body` **con** `relatedTarget` vacío, así que la memoria no se
  borra) → si en ese momento cambiara el ancla, la tarjeta se llevaría el foco.
  Para llegar ahí hay que cambiar de ancla **sin tocar ningún control**, porque
  tocar cualquiera borra la memoria.
- **El rótulo ya no es región viva.** Si en la tajada 2 el rótulo pasa a decir
  «Lo que viene · se pasó de la hora», ese cambio **no se anunciará** — y creo que
  está bien así (lo dispara el reloj, y el 207 pide justo que el reloj no hable),
  pero que conste escrito para quien construya la tajada 2.
- **`markBlockCouldNot` en una prueba ensucia el store de aparato.** Lo devuelvo a
  cero dentro de la prueba; si alguien añade otra con notas de aparato, mismo
  cuidado.

**Lo que encontré y no toqué:** nada nuevo fuera de lo ya anotado. No amplié el
alcance: la tajada 2 (192, 193, 197, 377) no se construyó y `vida-up-next.utils.ts`
sigue con `showDidIt: false`.

**Estado del árbol:** sin commitear.

### Tajada 2 — los dos bordes: se pasó la hora, y ya no queda nada

**Resumen para quien revisa:**

1. La tarjeta ya tiene sus **dos bordes**: cuando la hora del ítem propuesto ya
   pasó, el rótulo lo dice («Lo que viene · se pasó de la hora») y aparece **«Ya
   la hice»** entre las salidas; cuando no hay nada que proponer, la misma
   tarjeta se apaga y dice **cuánto te queda de día**, con «▶ Empezar algo».
2. Está en `vida-up-next.utils.ts` (`UpNextEmpty` + `buildUpNextEmpty`, y
   `kicker`/`showDidIt` en `buildUpNext`), en `VidaUpNextCard.tsx` + su
   `.module.scss`, y en `VidaHoyPage.tsx` (el `useMemo` y el montaje).
3. **Lo que más probablemente he roto:** el `UpNext` pasó de ser un objeto a ser
   una **unión discriminada**, así que cualquier sitio que diera por hecho que
   hay `title`/`blockId` deja de compilar —hoy solo lo monta `VidaHoyPage`, y
   `pnpm typecheck` está limpio— y, sobre todo, **hay una pantalla más donde
   antes no había ninguna**: en el día de hoy, con el plan resuelto o vacío,
   ahora siempre hay una tarjeta. Si algo contaba `listitem`s o daba por hecho
   «sin propuesta, sin nodo», ahí es donde se cae. El segundo sitio a mirar es
   el rótulo: **tres pruebas de la tajada 1 esperaban «Lo que viene» a secas** y
   las he cambiado (el día de las pruebas propone algo de las 8:00 a las 9:24,
   o sea, siempre pasado de hora).

**Qué se construyó:**

- `src/features/vida/utils/vida-up-next.utils.ts`
  - `UpNext` pasa a ser `UpNextProposal | UpNextEmpty`. `buildUpNext` devuelve
    `UpNextProposal`; **nada de su aritmética cambia**.
  - `kicker` dice «Lo que viene · se pasó de la hora» cuando `isOverdue`
    (criterio 193), y `exits.showDidIt` pasa a ser `isOverdue` (criterio 197).
  - **Nuevo** `buildUpNextEmpty({ anchorId, reason, dayLabel, dayEndTime,
    remainingMinutes, canStart, blockedNote })`, con dos razones:
    `template-done` («Ya no queda nada en tu plantilla» + «Tu martes se acaba a
    las 22:00. Te quedan 3h 8.») y `execution-unknown` (criterio 209: el rótulo
    **no** afirma que no queda nada, dice que falta lo vivido).
- `src/features/vida/utils/vida-up-next.utils.test.ts` — siete casos nuevos; el
  que decía «la tajada 2 lo escribe» pasa a afirmar lo que ahora se escribe.
- `src/features/vida/components/VidaUpNextCard/VidaUpNextCard.tsx` — retorno
  temprano para `variant: 'empty'` (mismo `<li>`, misma canaleta —**vacía**—,
  mismo `aria-label` de región) y la salida «Ya la hice» en la misma línea de
  las otras dos. `onStartSomethingElse`, `onSeeOthers` y el nuevo `onDidIt` son
  opcionales: la cara apagada no los necesita.
- `…/VidaUpNextCard.module.scss` — `.row[data-variant='empty']` (trazo
  **punteado** sobre `--color-border`, fondo sin tinte mint, rótulo y punto en
  gris), `.empty` y `.playQuiet` (el botón en hueco del render).
- `src/features/vida/pages/VidaHoyPage.tsx` — el `useMemo` deja de devolver
  `null` en dos ramas: sin saber lo vivido devuelve la cara `execution-unknown`,
  y sin candidato la cara `template-done`, alimentada con **`dayHours.endTime` y
  `budget.remainingMinutes`, los mismos que ya pinta `VidaDayBudget`**. El
  montaje añade `onDidIt`, que llama a **`markBlockDone(block)`** —la función
  que ya existía— buscando el bloque por `id` en `agenda.blocks`.
- `src/features/vida/pages/VidaHoyPage.test.tsx` — nueve casos nuevos y cinco
  tocados (ver «riesgos»).

**Por qué así, y qué descarté:**

- **Unión discriminada y no un objeto con campos opcionales.** Con campos
  opcionales, el componente tendría que adivinar en qué cara está y el día que
  alguien pinte `metaLine` en la cara apagada nadie se entera. Con la unión, el
  compilador lo impide.
- **Retorno temprano en el componente en vez de envolver el cuerpo en un
  ternario.** Es lo que deja **el diff de la tajada 1 intacto** y, medido en el
  navegador y en el test, React conserva el mismo `<section>` al pasar de
  proponer a no proponer: no hay remonte y el criterio 205 sigue en pie.
- **Los números de la cara apagada entran ya calculados.** Rehacer la resta en
  el util habría sido más «puro», pero el criterio manda que digan lo mismo que
  la barra: se consume `budget.remainingMinutes` y se escribe con
  `formatDurationFromMinutes`, el mismo formateador.
- **`showDidIt` no mira `canStart`.** «Ya la hice» es un registro, no un
  arranque: la fila del bloque la ofrece con `executionKnown && canLogPast`, que
  en el día de hoy y con la tarjeta pintada ya se cumple. Atarla a `canStart`
  la habría escondido justo cuando hay una sesión de otro día sin cerrar.
- **Dos desviaciones del render 14, dichas en voz alta:**
  1. El render escribe «Te quedan **3 h 8**» y la tarjeta escribe «**3h 8**»,
     porque es **literalmente lo que la barra de arriba imprime**
     (`formatDurationFromMinutes`). Entre parecerse al render y cuadrar con el
     número que está tres dedos más arriba, mandó el contexto de la tajada.
  2. El render pone «Ya la hice · Empezar otra cosa»; la tarjeta pone «Ver las
     otras N · Ya la hice · Empezar otra cosa». La `N` ya estaba de la tajada 1
     y el criterio 376 la nombra primero.

**Verificación:**

```
pnpm typecheck            → limpio
pnpm lint                 → 14 errores / 0 warnings   (línea base: 14/0)
pnpm test                 → 2 fallos de 1965          (línea base: 2 de 1951; +14 casos míos, los 2 fallos son los de SearchSelect)
npx vitest run src/features/vida/utils/vida-up-next.utils.test.ts → 26 passed
npx vitest run src/features/vida/pages/VidaHoyPage.test.tsx       → 205 passed
pnpm build                → exit 0 · chunk inicial 1.133,58 kB (base 1.131,64) · CSS 275,91 kB (base 275,17)
```

El CSS **sube**, que es lo que tiene que pasar al añadir reglas. Comprobado
además como pide `ENVIRONMENT.md`, comparando **la lista de selectores**
compilada con `sass --style=compressed` sobre `HEAD` y sobre el árbol:
perdidos **ninguno**; nuevos cinco (`.row[data-variant=empty] .card`,
`… .kicker`, `… .tick`, `.empty`, `.playQuiet`).

**En el navegador** (arnés temporal con `MemoryRouter`, ya borrado: no queda
ningún `.html` ni `.tsx` de prueba en el árbol), midiendo el DOM en dos anchos
dentro de un `iframe` del ancho exacto —el panel emula 568 px, así que medir la
pestaña a pelo habría mentido—:

| | 375 px | 760 px |
|---|---|---|
| `scrollWidth` del documento | 375 (sin scroll horizontal) | 760 |
| `li` de la tarjeta | 343 ancho, `scrollWidth` 343 | 728 / 728 |
| Las tres salidas | **en la misma fila** (80 + 52 + 103 px) | misma fila |
| Nombre de ~60 caracteres | recortado con ellipsis, sin desbordar | igual |
| Cara apagada | 142 px de alto, botón a ancho completo | 122 px |

**En oscuro** (`[data-theme='dark']`, medido con `getComputedStyle`): la cara
apagada usa `--color-border` **punteado** —nunca el punteado violeta de
FEAT-007— y sus textos salen en `rgb(168,179,199)` sobre la superficie oscura;
el «▶ Empezar algo» va en hueco con tinta mint clara. Se lee.

**Criterios que cierra:**

- **193** ✔ Con «Bañarme» de las 8:00 a las 9:24, el rótulo dice «Lo que viene ·
  se pasó de la hora» y **nada más cambia**: el test compara botón, `truthLine`,
  `metaLine` y canaleta contra la misma tarjeta a su hora, y son idénticos. Sin
  color de alarma (el trazo sigue siendo el mint de siempre), sin exclamaciones
  y sin segunda tarjeta.
- **197** ✔ «Ya la hice» está **escrita**, en la línea de salidas y fuera de
  todo menú, y **solo cuando la hora ya pasó** (hay un caso que lo comprueba
  antes de la hora). Al pulsarla, `createFollowUpMutation.mutate` recibe
  exactamente `{activityId:'a-b1', date:'2026-09-18', startTime:'08:00',
  durationMinutes:45, notes:null}` —**lo mismo, literal, que el «Lo hice» del
  bloque** en el caso del criterio 41— y no arranca ninguna sesión ni abre
  ninguna hoja.
- **377** ✔ Mismo sitio (hija directa del `<ol>`, justo tras la línea de AHORA),
  misma forma, trazo apagado y punteado, canaleta **vacía** (`<time>` ausente).
  Dice «Ya no queda nada en tu plantilla» y «Tu viernes se acaba a las 23:00. Te
  quedan 13h 36.», y **un test afirma que la barra de arriba dice «te quedan 13h
  36 hasta las 23:00»** en la misma pantalla. No propone nada ya hecho ni
  inventa sugerencias («Poner lavadora», que está en las sugerencias del día, no
  aparece).
- **192** ✔ Con el plan vacío se ve **exactamente** esa cara. El «Aún no hay plan
  para hoy.» sigue donde estaba y **la tarjeta no lo repite**; barrido de las
  ocho palabras de reproche sobre su DOM, en verde.
- **209 (segunda mitad)** ✔ Con `activityDayFollowUps` caído, la tarjeta no
  propone («Bañarme» no aparece), **no dice «no queda nada»** y deja «Empezar
  algo», que abre la hoja de siempre. La primera mitad sigue cumpliéndose.
- **204** ✔ Se mantiene: el espía de consultas da los mismos números con la cara
  apagada y con la propuesta (el caso se reescribió, porque en un día de hoy ya
  no existe «sin tarjeta»).
- **210** ✔ Barrido sobre los textos del util y sobre el DOM de la cara apagada.
  «Se pasó de la hora» sí, que es lo que el render escribe.

**Pendiente de prueba manual (el usuario, con la API despierta):**

- **218** (criterio de fase). `/app/vida/hoy` está detrás del login y ahí no
  entro. Pasos: (1) un día con algo de la plantilla cuya hora ya pasó → la
  tarjeta debe ofrecerlo igual, con «· se pasó de la hora» y sin bronca; (2)
  pulsar **«Ya la hice»** → el bloque pasa a hecho **sin recargar** y la tarjeta
  pasa a proponer lo siguiente; (3) resolver todo lo del día → la tarjeta se
  apaga y dice cuánto queda hasta el fin de tu día, **el mismo número que la
  barra**; (4) con el día ya cerrado la barra deja de decir «te quedan» y la
  tarjeta dice solo «Tu \<día\> se acaba a las \<hora\>.».
- **214**, su mitad de oscuro **sobre la pantalla real**: aquí está medido en el
  arnés, no en `/app/vida/hoy`.

**Riesgos — qué puede haber roto esto:**

1. **Hay tarjeta donde antes no había nada.** En el día de hoy, con lo vivido
   caído o con el plan resuelto/vacío, ahora siempre se pinta un `<li>` más en
   el `<ol>` de la agenda. Cualquier prueba o medida que contara filas se mueve.
2. **Cinco casos de la tajada 1 tocados**, todos por consecuencia directa: el
   rótulo (183), las salidas (376), el de 208/209 —partido en dos, porque el
   caído ahora **sí** pinta—, el de 204 y el del criterio 180. **El test
   intocable del arranque de un toque no se ha tocado**: sigue comparando el
   array entero (`expect(startSession.mock.calls[0]).toEqual(['a-b1'])`).
3. **El caso del criterio 180 estaba verde por la razón equivocada** y lo he
   arreglado: usaba `window.history.pushState`, que el `MemoryRouter` de
   `renderWithProviders` **no mira**, así que en realidad miraba *hoy con el
   plan vacío*. Ahora usa `routerProps.initialEntries` y comprueba que la
   cabecera dice «Jueves 17» antes de afirmar que no hay tarjeta. Es el tipo de
   trampa que `ENVIRONMENT.md` ya documenta para los mocks: **había otras 20
   llamadas con `initialEntries` en el mismo archivo y esta era la única con
   `pushState`**.
4. **Un cambio cosmético que no es mío**: `prettier` colapsó tres líneas de
   `findUpNextAnchorId` en una al formatear el archivo. No cambia nada.
5. Lo que **no** he tocado y podía tentar: `markBlockDone`, `getDayBudget`,
   `VidaDayBudget`, el arco de FEAT-019 y el vidrio de FEAT-020. Nada del
   presupuesto ni del arco entra en este diff.

**Lo que descubrí y no estaba en el plan:**

- El criterio 209 pedía «deja "Empezar algo"» para el caso de lo vivido caído, y
  el plan lo mandaba a la cara del 377 — pero **esa cara afirma que no queda
  nada**, que es justo lo que el 209 prohíbe. De ahí el campo `reason`: la misma
  forma, dos textos. Lo resolví con el criterio del arquitecto por ser menor; si
  la redacción («No pudimos cargar lo que llevas hecho hoy, así que no te
  proponemos nada.») no gusta, es una línea.
- El plan preveía `buildUpNext(… templateHasNothing)`; construí **una función
  aparte** (`buildUpNextEmpty`) porque la firma de `buildUpNext` exige un
  `block` que en esa rama no existe.

**Estado del árbol:** sin commitear.


### Tajada 3 — retirar las fichas del hueco y el panel «Tu plantilla de \<día\>»

**Summary for the reviewer:**
1. **Qué se construyó:** el hueco de delante perdió sus fichas de plantilla y se
   quedó con su franja, su tamaño y **«+ otra cosa»**; el lateral de escritorio
   perdió la lista «Tu plantilla de \<día\>» con su «Ponerla» y se quedó **solo
   con «Mañana»**, mudado a `components/VidaTomorrowAside/`.
2. **Dónde:** `VidaAgendaGap` (+ su `.module.scss` y su test), `VidaHoyPage`
   (+ su test), `vida-agenda.utils.ts`, `vida-patterns.utils.ts` y sus tests;
   **carpeta borrada:** `components/VidaTemplateAside/`.
3. **Lo que más probablemente rompí:** la rama de **plantilla vacía** del hueco.
   Antes su número venía dentro de `GapSuggestions` (`templateCount`, calculado
   **contra las sugerencias de ese día**); ahora llega suelto desde la página,
   donde `templateCount = buildableTemplate.length` —**que es otra cuenta**: la
   de «Armar desde la plantilla», que filtra por *armable*, no por *activa*. En
   los casos probados dan lo mismo, pero si alguna vez difieren, el hueco diría
   «tu plantilla no trae nada» con plantilla o al revés. Mirad ahí primero.
   Segundo sitio: el lateral **entero desaparece** cuando `VidaTomorrowAside`
   devuelve `null` (último domingo de la ventana, o mirando mañana) — antes
   quedaba el panel con la lista. Es consecuencia buscada del 383, pero es un
   cambio de layout que nadie escribió.

**Antes de borrar nada: el censo de consumidores** (criterio 385). El plan de la
sección 2 se contó sobre `30a0d40` y `main` ha avanzado hasta `6ff8b2e`
(FEAT-011 a 024). Repetido el `git grep` del plan sobre el árbol de hoy, símbolo
a símbolo:

| Símbolo | Consumidores **hoy** (`6ff8b2e`) | ¿Cambió desde `30a0d40`? | Qué se hizo |
|---|---|---|---|
| `suggestionsForGap` (`vida-agenda.utils.ts`) | `VidaHoyPage.tsx:1276` · `vida-agenda.utils.test.ts` (13 usos) · una **mención en comentario** en `vida-start-suggestions.utils.ts:73` | No | **Borrada.** El comentario se reescribió |
| `MAX_GAP_SUGGESTIONS` | solo `suggestionsForGap` | No | **Borrada** |
| `GapSuggestion` / `GapSuggestions` | `VidaAgendaGap.tsx:4,21` · `VidaAgendaGap.test.tsx:5,33` · `VidaHoyPage.tsx:47,127` (`NO_SUGGESTIONS`) | No | **Borrados los tres sitios** |
| `SuggestionsForGapInput` | solo `suggestionsForGap` | — (el plan no lo listaba) | **Borrado** |
| `findFirstFittingGap` | **solo** `VidaTemplateAside.tsx:17,184` · una mención en el comentario de `isSliver` (`vida-agenda.utils.ts:76`) | No | **Borrada.** El comentario se corrigió |
| `fitsInGap` | **solo** `suggestionsForGap` y `findFirstFittingGap`, + su test (`:428-440`) | No: **FEAT-011 t3 no lo enganchó**, y `VidaDurationPills` sigue sin usarlo — la premisa del criterio 385 sigue siendo falsa, como ya avisó el arquitecto | **Borrada** con su test |
| `usualDurationsByItemId` (`vida-patterns.utils.ts`) | `VidaHoyPage.tsx:600` → `suggestionsForGap` · `vida-patterns.utils.test.ts:805,820` | No | **Borrada** |
| `usualDurationsByActivityId` | `VidaHoyPage.tsx:608` → `VidaLogSessionSheet` y la tarjeta de «Lo que viene» | **Sí, ganó consumidores** (FEAT-011 t3 y FEAT-010 t1) | **Se queda viva**, intacta |
| `VidaTemplateAside` | `VidaHoyPage.tsx:19,1613` · su `index.ts` · **tres menciones en comentarios**: `query-cache-guards.hydration.test.tsx:85`, `useVidaDayWindow.ts:63`, `vida-execution.utils.ts:6` | No gana consumidores nuevos de código | **Carpeta borrada**; los tres comentarios, corregidos |
| `VidaTomorrowBlock` | solo dentro de `VidaTemplateAside.tsx:145,243` | No | **Movido** a `VidaTomorrowAside`, **antes** de borrar la carpeta |
| `placeSuggestion` / `onPlaceSuggestion` | `VidaHoyPage.tsx:851,1287` · `VidaAgendaGap.tsx` · 2 usos en `VidaAgendaGap.test.tsx` | No | **Borrados** |
| `isPlacing` + `addMutation` de la página | `VidaHoyPage.tsx:804,871,1303` | **Sí, para bien**: `useAddDayPlanItemMutation` **ya no se le pasa a la hoja** — `VidaPlaceInGapSheet` tiene la suya. El aviso del plan («si se borra `addMutation` se rompe “+ otra cosa”») **ya no aplica** | **Borrados de la página**; el hook sigue vivo en la hoja |
| `VidaSuggestion` (tipo) | 14 archivos: picker, hojas, `useVidaDayData`, `vida-start-suggestions`… | Sí, muchos | **No se toca** |
| `templateCount` (nombre) | `VidaHoyPage.tsx:1082` · `VidaSemanaPage.tsx:132,353` | — | Reutilizado como **prop nueva** del hueco |

**Ningún símbolo ganó un consumidor nuevo que obligara a dejarlo vivo.** El único
que lo ganó, `usualDurationsByActivityId`, no estaba en la lista de borrado.

**What was built:**

- **`components/VidaAgendaGap/VidaAgendaGap.tsx`** — fuera la rama de fichas
  (chips, «+N más» y la nota «de tu plantilla de \<día\>, lo que cabe aquí»),
  fuera las props `suggestions`, `onPlaceSuggestion` e `isPlacing`, fuera
  `canPlace` y los `import` de `CSSProperties`, `VidaSuggestion`,
  `GapSuggestions`, `AppIcon` y `UNCATEGORIZED_GROUP_ICON`. **Entra
  `templateCount?: number`**, que sostiene la rama de plantilla vacía («tu
  plantilla no trae nada» + «Ver tus actividades»). **Se conservan** la cabecera
  con franja y tamaño, la rama `sliver`/`isPast` de FEAT-011 y **«+ otra cosa»**.
- **`…/VidaAgendaGap.module.scss`** — mueren `.chipName`, `.chipTime` y
  `button.chip:disabled`.
- **`components/VidaTomorrowAside/`** (nueva: `.tsx`, `.module.scss`, `index.ts`)
  — `VidaTomorrowBlock` movido tal cual, ahora como el `<aside>` del lateral.
- **`components/VidaTemplateAside/`** — **borrada entera** (`git rm`), con
  `PlaceInFirstGapButton`, la lista de plantilla, su `useAddDayPlanItemMutation`
  y el `<h2>Tu plantilla de {dayLabel}</h2>`.
- **`pages/VidaHoyPage.tsx`** — `placeSuggestion` borrada entera, `NO_SUGGESTIONS`
  fuera, el `useMemo` de `usualDurations` (por ítem) fuera, `addMutation` fuera,
  el hueco recibe `templateCount`, y el lateral pasa a
  `<VidaTomorrowAside viewedDate={date} />`. **No se tocan** `openSheet`,
  `SheetState.kind === 'place'` ni la hoja: «+ otra cosa» sigue por ahí.
- **`utils/vida-agenda.utils.ts`** — fuera `MAX_GAP_SUGGESTIONS`, `GapSuggestion`,
  `GapSuggestions`, `SuggestionsForGapInput`, `fitsInGap`, `findFirstFittingGap`
  y `suggestionsForGap` (143 líneas).
- **`utils/vida-patterns.utils.ts`** — fuera `usualDurationsByItemId`.
- **Tests** — ninguno se borró a secas; cada uno nombra el criterio que lo deroga
  (como en FEAT-006): `vida-agenda.utils.test.ts` (los dos `describe` sustituidos
  por una nota que dice dónde vive ahora lo nuevo), `vida-patterns.utils.test.ts`
  (los dos casos del 91 siguen, por `usualDurationsByActivityId`),
  `VidaAgendaGap.test.tsx` (+5 casos: 381 y 382) y `VidaHoyPage.test.tsx`
  (4 casos reescritos y un `describe` nuevo con **los cuatro caminos del 384**).
- **Comentarios corregidos** en cuatro archivos que nombraban lo retirado.

**Why this way, y en qué me separo del plan:**

1. **`.chips`, `.chip`, `.chipMore` y `.note` NO mueren**, aunque el plan de la
   sección 2 los daba por muertos. Es un error del plan, no una decisión mía:
   «+ otra cosa» **es** un `.chip .chipMore` dentro de un `<ul class=chips>`, y
   la rama de plantilla vacía usa `.note`. Borrarlos habría cambiado el aspecto
   del hueco justo donde el criterio 382 dice que no cambia. Mueren exactamente
   los tres selectores que se quedaron sin nadie: `.chipName`, `.chipTime` y
   `button.chip:disabled` (nada queda deshabilitado tras irse `isPlacing`).
2. **El `.tomorrow` del lateral se convierte en el `.root` del componente nuevo**
   y sus dos reglas se renombran a `.heading` y `.note`. Se le quitó el
   `border-top`: ya no hay nada encima de lo que separarse. La tipografía se
   conserva **exacta** (0,8125 rem, `capitalize`) para que «Mañana» se vea igual
   que antes. El `<h3>` pasa a `<h2>`: ahora es el título del panel, el sitio que
   ocupaba `<h2>Tu plantilla de \<día\>`.
3. **`isPlacing` fuera del todo**, no «solo si queda algo con estado en vuelo»:
   al irse `placeSuggestion`, `addMutation` se quedó sin escritura y «+ otra
   cosa» no escribe nada —lo hace la hoja, con su propia mutación—, así que
   deshabilitarlo era mentir sobre un estado que no existe.
4. **Lo nuevo del hueco se prueba en `VidaAgendaGap.test.tsx`, no en
   `vida-agenda.utils.test.ts`.** El plan pedía sustituir ahí los `describe`
   derogados, pero ya no queda aritmética que afirmar: lo que el hueco hace ahora
   solo se ve al pintarlo. En el archivo de utilidades queda **la nota escrita**
   de qué se fue, por qué y dónde vive su sustituto.

**Verification** (`docs/features/ENVIRONMENT.md`; ningún servicio levantado ni
parado por mí — el 5173 del usuario estaba arriba y se usó solo como pestaña):

| Qué | Línea base | Ahora | Lectura |
|---|---|---|---|
| `pnpm typecheck` | limpio | **limpio** | = |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0** | = |
| `pnpm test` | 2 fallos de 2304 | **2 fallos de 2294** (`SearchSelect` ×2, preexistentes) | −10 tests, **todos por irse con su módulo**. El flaky de `IconPicker` no salió |
| `pnpm build` | chunk 1.160,84 kB · CSS 282,61 kB | **1.154,54 kB · CSS 280,11 kB** | −6,30 kB y **−2,50 kB a propósito** |

**La bajada del CSS, demostrada como manda `ENVIRONMENT.md`** (no por el tamaño:
por la lista de selectores). Compilado **todo** el SCSS de `HEAD` y del árbol con
`sass --style=compressed` y comparados los selectores:

```
comm -23 head-sel.txt tree-sel.txt     # lo que desapareció
button.chip:disabled      .chipName      .chipTime
.noRoom                   .noRoomNote    .place
.place:disabled           .place:focus-visible:not(:disabled)
.place:hover:not(:disabled)
.tomorrow                 .tomorrowHeading   .tomorrowNote

comm -13 head-sel.txt tree-sel.txt     # lo que apareció
(vacío)
```

**Doce selectores, y son exactamente los doce que borré**: tres de las fichas del
hueco, seis del «Ponerla» del panel y tres del bloque «Mañana» que se renombraron
a `.root` / `.heading` / `.note` (nombres que ya existían en otros módulos, por
eso no salen como nuevos). **Ninguna regla ajena se perdió: no hay comentario sin
cerrar.** El mismo diff por archivo lo confirma: `VidaAgendaGap.module.scss`
pierde 3 selectores y ninguno más.

*Salvedad honesta del método:* 16 `.module.scss` **no compilan sueltos** con
`sass` (usan `@use` con alias que solo resuelve Vite) y quedan fuera de la
comparación, **los mismos 16 en `HEAD` y en el árbol**. Comprobado con `cmp` que
los 16 son **byte a byte idénticos** entre `HEAD` y el árbol: no pueden haber
movido la cifra. Ninguno es de Vida.

**En pantalla** (arnés temporal en la raíz + `src/`, con `MemoryRouter` y datos
sintéticos; **borrado antes de reportar**, `git status` no lo lista):

- **375 px** (en `iframe`, no en la pestaña, que emula 568): documento **375 px
  exactos**, **0 nodos desbordados**. El hueco de 10:30–13:00 se lee
  `10:30 | Libre 10:30 – 13:00 | 2h 30 | + otra cosa | Registrar` — franja,
  tamaño, la salida de planear y la de contar de FEAT-011, y nada más.
- **Plantilla vacía:** `… | Todavía no tienes nada en tu plantilla para los
  viernes. | Ver tus actividades | + otra cosa` — la rama **no se perdió**.
- **Hueco pasado:** `8:45 | Libre 8:45 – 9:24 | 39m | Registrar lo que hice` —
  la rama de FEAT-011 intacta.
- **760 px:** 0 desbordados (el ancho que `ENVIRONMENT.md` avisa que falla solo).
- **Oscuro** (`[data-theme='dark']`): todos los textos del hueco medidos,
  **mínimo 7,35:1** (hora, franja, tamaño, «+ otra cosa», «Registrar», «Ver tus
  actividades»; «Registrar lo que hice» del pasado, 17,33:1).

**Criteria it closes:**

- **380 — las dos a la vez, y solo ahora.** Las dos retiradas van en este mismo
  cambio, con las tajadas 1 y 2 ya en `main` (`384526a`): «Lo que viene» está en
  pantalla antes de que se quite nada. ✔
- **381 — las fichas desaparecen.** `VidaAgendaGap.test.tsx`: «ninguna ficha de
  plantilla, ni “+N más”, ni “sueles tardar”» (un solo control en el hueco);
  `VidaHoyPage.test.tsx`: «el hueco no ofrece fichas: ni la que cabe ni la que no
  trae duración» y «el hueco ya no ofrece “sueles tardar” en un chip».
  Derogaciones anotadas en **FEAT-003 sección 4** (18 parcial, 19, 23) y en
  **FEAT-007 sección 4** (mitad del 91). ✔
- **382 — «+ otra cosa» no desaparece.** `VidaAgendaGap.test.tsx`: abre la hoja
  con el hueco, y el hueco sigue diciendo franja y tamaño.
  `VidaHoyPage.test.tsx` criterio 24 (intacto): «Poner algo a las 10:30» con
  «Hueco de 2h 30 · hasta las 13:00 “Cocinar y almorzar”». La rama de plantilla
  vacía viaja por `templateCount`, con dos casos. ✔
- **383 — el panel desaparece entero, y «Mañana» se queda.**
  `VidaHoyPage.test.tsx`: no hay `complementary` «Tu plantilla de viernes», ni
  «en el plan», ni «Ponerla», ni «en el primer hueco donde cabe»; sí hay
  `complementary` «Mañana, sábado» con «Armar mañana desde la plantilla».
  Derogación anotada en FEAT-003 sección 4 (mitad del 48). ✔
- **384 — nada se queda sin camino, un test por camino.** `describe` nuevo «los
  cuatro caminos siguen abiertos» en `VidaHoyPage.test.tsx`: **(a)** «+ otra
  cosa» con el subtítulo del hueco · **(b)** «Armar desde la plantilla» + el
  enlace a la semana · **(c)** «Armar mañana desde la plantilla» en el lateral ·
  **(d)** `vidaPaths.plantilla === '/app/vida/plantilla'` y sigue listada en
  `appModules` (la píldora del módulo). Ninguno de los cuatro se tocó. ✔
- **385 — código muerto retirado entero, y no de más.** La tabla de consumidores
  de arriba, hecha **sobre el árbol de hoy antes de borrar**; los siete símbolos
  sin consumidor borrados; `usualDurationsByActivityId` y `fitsInGap`
  comprobados uno a uno; la carpeta borrada **después** de mover
  `VidaTomorrowBlock`; ningún test borrado a secas y cada sustituto nombra su
  criterio. ✔

**Queda para el usuario** (no se puede cerrar desde aquí: todo `/app/*` está
detrás del login y los agentes no entran):

1. Abrir `/app/vida/hoy` con sesión y un hueco por delante: comprobar que el
   hueco **solo** ofrece «+ otra cosa» (y «Registrar»), que «+ otra cosa» abre la
   hoja con la hora y el subtítulo correctos, y que **se puede poner algo hasta
   el final** sin tropiezo.
2. Mirar el lateral de escritorio: solo «Mañana, \<día\>», y que **«Armar mañana
   desde la plantilla» arma mañana de verdad**.
3. Un día **sin nada en la plantilla**: el primer hueco tiene que decir «Todavía
   no tienes nada en tu plantilla para los \<días\>» con «Ver tus actividades».
   *(Es el punto del riesgo 3 de arriba: la cuenta cambió de origen.)*
4. Un día **pasado** y un día **futuro**: el pasado sigue ofreciendo «Registrar
   lo que hice» y no trae lateral; el futuro no ofrece registrar.
5. Y lo de fondo, que es la razón de la tajada: **que no se eche de menos nada**
   de lo que se quitó.

**Risks:**

- El `templateCount` de la página es `buildableTemplate.length` y el de antes
  salía de las sugerencias activas del día. Dos cuentas parecidas, no idénticas.
- El lateral entero puede desaparecer donde antes quedaba media caja
  (`VidaTomorrowAside` devuelve `null`).
- `.chips` sobrevive con **un solo hijo**: si alguien asumía que era una lista de
  varias píldoras, el `flex-wrap` ya no hace nada.
- Cuatro archivos ajenos tocados **solo en comentarios** (`useVidaDayWindow.ts`,
  `vida-execution.utils.ts`, `vida-start-suggestions.utils.ts` y
  `query-cache-guards.hydration.test.tsx`): cero cambio de comportamiento, pero
  ensucian el diff.

**Lo que vi de paso y no toqué** (fuera de alcance):

- `VidaTomorrowAside` no tiene **suite propia** —`VidaTemplateAside` tampoco la
  tenía—: se prueba solo a través de `VidaHoyPage.test.tsx`. Es deuda heredada,
  no estrenada aquí.
- 16 `.module.scss` no compilan sueltos con `sass`, lo que **debilita la
  comprobación que el propio `ENVIRONMENT.md` manda hacer**. Se puede arreglar
  pasándole a `sass` el alias `@`; no es de esta tajada, pero merece una línea en
  ese archivo o un script en `package.json`.
- `useVidaDayHours` sigue documentado como «lo llaman siete sitios»: con el panel
  fuera puede que ya no sean siete. No lo conté.

**Tree state:** sin commitear. `git rm` dejó **en el índice** el borrado de
`components/VidaTemplateAside/`; todo lo demás está en el árbol de trabajo.
`components/VidaTomorrowAside/` aparece como no rastreada. Arnés borrado.
`graphify update .` corrido al terminar.

## 4. Review — feature-reviewer

### Tajada 1 — «Lo que viene», dentro de la línea, con la promesa y un clic

**Veredicto: `returned`** — dos criterios de accesibilidad marcados con ✔ no se
cumplen en su mitad operativa: el **205** («nunca en `body`», y **vale también
cuando la tarjeta cambia de sitio**) y el **207** («se anuncia **cuando cambia la
actividad propuesta**»). Los dos caen justo sobre **el gesto principal de la
feature** —pulsar «Empezar ahora»—, que es cuando la tarjeta se mueve y cuando
cambia lo propuesto. Todo lo demás está bien, y lo que más se temía —que la
duración del plan llegara a la mutación— **no pasa por ningún camino**.

**Criterios, uno a uno**

*Cumplidos, con evidencia propia*

- **180** ✔ Cuatro puertas en el `useMemo` (`isToday`, `nowMinutes !== null`,
  `[dayStart, dayEnd)`, ancla) y ninguna rama pinta nodo vacío: `upNext === null`
  → `upNextCard === null` → el `flatMap` devuelve `[renderEntry(entry)]`.
- **183, 371, 372, 373** ✔ Leídos en `buildUpNext` y contrastados con el render
  14: «Lo que viene», «En tu plantilla, a las 8:00 · suele durarte 45 min», la
  frase de verdad entera y **ninguna hora de fin en ninguna rama**. La costumbre
  manda sobre la plantilla (`usualMinutes ?? block.durationMinutes`).
- **184, 375** ✔ `pickUpNextBlock` es puro y **sin una sola constante de
  minutos**: `arrived = startMinutes <= ahora` → `Math.max`, si no `Math.min`, y
  el desempate en tres pasos (inicio, duración, orden de `buildDayAgenda`).
- **186** ✔ Las tres fuentes en `collectResolvedBlockIds`, y `couldNotItemIds`
  por `item.id`, que es como se guarda la nota.
- **187** ✔ `onStartSomethingElse` → `openLogSheet({ mode: 'start' })`. Sin
  segunda hoja.
- **188** ✔ `isSessionBusy={sessionActions.isBusy}`: **la misma** variable que
  frena el «▶ Empezar» del bloque, y el `busyRef` de `useVidaSessionActions`
  cierra la puerta en el mismo tic.
- **189** ✔ Con `canStart === false` no se pinta botón: se pinta `blockedNote`.
- **196 y lo que el usuario puso por encima de todo** ✔ **Verificado a mano por
  la cadena entera**, no solo por el test: la tarjeta llama
  `sessionActions.start(upNext.activityId)` con **un argumento**; `start` hace
  `startSessionInput(activityId, now, undefined)` → `startTime` = reloj
  (`vida-session.utils.ts:151-163`); y el cierre de lo que estuviera en marcha es
  `closeSessionInput(session, startedAt)` con `startedAt = sessionStartInstant(input.date, input.startTime) ?? now`
  — **el mismo reloj**. Ni `durationMinutes` del plan ni `startMinutes` de la
  ficha tienen un camino hasta la mutación, **tampoco por la rama de la sesión
  que se da por terminada**. El test de igualdad exacta del array
  (`toEqual(['a-b1'])`) es la red correcta.
- **203** ✔ No se tocó `AppLayout` ni `VidaModuleLayout`.
- **204** ✔ Contadores en cinco factorías de `vi.mock` y `expect(queryCalls).toEqual(sinTarjeta)`.
  Cero hooks nuevos en el `useMemo`.
- **206** ✔ `aria-label="Empezar Bañarme ahora"`, triángulo `aria-hidden`.
- **208 y 209 (primera mitad)** ✔ Con `isPending`/`isError` de lo vivido no hay
  tarjeta.
- **210** ✔ Barrido de las ocho palabras. Ninguna aparece en los textos del util.
- **211** ✔ Mismo `formatDurationMinutes` y misma `buildDayAgenda` que la fila; el
  bloque **se queda en la lista con su «▶ Empezar»**.
- **215** ✔ La tarjeta entra en el `<ol>` **fuera** del `<Fragment>` del bloque;
  `pickBlockHints` no se tocó.
- **216** ✔ `VidaAgendaGap.tsx` sin tocar; la tarjeta no pinta fila de hueco.
- **217** ✔ Reproducido entero por el revisor: `typecheck` limpio · `lint`
  **14/0 exacto** · `test` **2 fallos de 1780**, los dos de `SearchSelect`
  (`IconPicker` no apareció) · `build` exit 0, chunk inicial **1.111,79 kB** y
  `app-icons` **620,20 kB sin mover**. Ningún documento GraphQL nuevo.
- **370** ✔ Hija directa del `<ol>`, detrás de la fila del ancla. Y el ancla se
  elige bien: sesión suelta en marcha → su fila; bloque en marcha → el bloque;
  nada en marcha → la marca de AHORA (`id: 'now'`, `vida-agenda.utils.ts:101`).
- **374** ✔ Un `onClick` → `start`. Sin hoja, sin confirmación.
- **376** ✔ `othersCount = openCount - 1`, y con 0 no se escribe.
- **378** ✔ La coletilla sale del **ancla**, no de la sesión abierta a secas, y la
  tarjeta no manda ninguna mutación de cierre.

*No cumplidos*

- **205** ✘ **en su segunda mitad, que está en negrita en el criterio**: «Vale
  también cuando la tarjeta cambia de sitio (criterio 379)». La tarjeta es un
  `<li>` con `key="up-next"` dentro del mismo `<ol>`: React **la mueve** (no la
  remonta, eso es correcto), pero **mover un nodo del DOM que contiene al
  elemento enfocado manda el foco a `body`**. Medido por el revisor en el
  Chromium del panel, no deducido:
  `ol.insertBefore(li, null)` con el `<button>` de dentro enfocado →
  `document.activeElement === document.body` (`afterMove: false`,
  `activeIsBody: true`). Y el movimiento **no es un caso raro**: ocurre en el
  gesto principal, al pulsar «Empezar ahora» y pasar el ancla de AHORA a la fila
  de la sesión nueva. El test que hay solo cubre el **tic de reloj**, donde la
  tarjeta **no se mueve**, así que no toca el clause que falla.
- **207** ✘ **en su segunda mitad**: «se anuncia **cuando cambia la actividad
  propuesta**». El `aria-live="polite"` está en el `<p className={styles.kicker}>`,
  cuyo contenido en esta tajada es **siempre** la constante `UP_NEXT_KICKER`
  (`'Lo que viene'`). Una región `aria-live` cuyo texto nunca cambia **no anuncia
  nada**: cuando la actividad propuesta pasa de «Bañarme» a «Leer un rato», el
  lector de pantalla se queda mudo. El nombre de la región ya es «Lo que viene»
  (criterio 207, primera mitad), así que «la línea del titular» no puede ser esa
  misma constante. El test solo comprueba que el atributo existe y vale `polite`,
  no que se anuncie algo.

*Siguen pendientes de prueba a mano —el usuario, con la API despierta—*

- **212** (375 px), **213** (texto largo), **214** (oscuro y trazo) y **218** (el
  criterio de fase). `/app/vida/hoy` redirige a `/auth/login` y los agentes no
  entran con credenciales (`ENVIRONMENT.md`). El `.scss` está escrito a favor
  (`min-width: 0` en `.row/.body/.card`, `text-overflow: ellipsis` en `.name`,
  `overflow-wrap: anywhere` en meta, frase de verdad y salidas; el mint sale de
  `--aura-ring-from` por `color-mix`, nunca punteado violeta), pero **eso es una
  lectura, no una medida**: quedan pendientes.
- **192, 193, 197, 209 (segunda mitad), 377** son la tajada 2 y no se reclaman.
- **380–385** son la tajada 3, excluida a propósito.

**Qué se rompió cerca, y cómo lo busqué**

1. **El movimiento de 148 líneas (`map` → `flatMap` + `renderEntry`), que es lo
   que el constructor señaló primero.** No lo leí a ojo: comparé los conjuntos de
   líneas del diff sin espacios
   (`git diff -U0 | grep '^-'` frente a `grep '^+'`, normalizados y ordenados).
   **Solo tres líneas borradas no reaparecen idénticas**: el `execution.entries.map((entry) => {`,
   su `})}` de cierre y el `import type { NoDataSlice }` (que ahora trae también
   `ExecutionEntry`). **Todo lo demás reaparece carácter por carácter**, y en el
   mismo orden. Es un movimiento, no un refactor.
   - **Claves de React:** las mismas de antes (`"now"`, `entry.id` en la sesión,
     `<Fragment key={entry.id}>`), ahora dentro de un array plano donde se suma
     `key="up-next"`. Sin duplicados.
   - **Orden:** `flatMap` conserva el orden de `execution.entries`; la tarjeta
     entra **detrás** del ancla.
   - **Casos que devolvían `null`:** no había ninguno. Las tres salidas del
     cuerpo devuelven elemento.
   - **El `ref` de «Ahora»:** sigue en el `<li>` de `kind === 'now'`, intacto, y
     el test de `scrollIntoView` pasa.
2. **Los 10 tests que se arreglaron con `planRow()`.** Comprobado que **no
   aflojan**: `planRow` descarta la fila cuyo `<li>` contiene
   `[aria-label="Lo que viene"]` y **lanza** si no queda ninguna otra, así que si
   la fila del plan desapareciera el test seguiría fallando (y si el nombre
   desapareciera del todo, `getAllByText` falla antes). Lo único que se pierde
   es la queja de `getByText` ante **duplicados**: con dos filas de plan iguales,
   `planRow` se queda con la primera en vez de fallar. Es un hallazgo, no un
   motivo de devolución.
3. **Quién más usa lo que se tocó.** `graphify explain "VidaHoyPage"` y
   `graphify explain "findNextBlockId"`: la página solo la consume el router, y
   `findNextBlockId` sigue con su único llamador (no se reusó, como mandaba el
   plan). Los dos ficheros nuevos no tienen más consumidores que la página.
   `usualDurationsByActivityId`, `pickBlockHints`, `suggestionsForGap` y
   `VidaAgendaGap` aparecen en el diff **solo como contexto sin tocar**.
4. **Lo que vive al lado en la misma pantalla:** el aviso de FEAT-007 (dentro del
   `<Fragment>` del bloque, la tarjeta va fuera), el hueco de FEAT-011 (sin
   tocar) y la barra fija de sesión (`AppLayout`, sin tocar). Los 138 tests de
   `VidaHoyPage.test.tsx` pasan y la suite entera está en la línea base exacta.

**Estados que nadie construye**

- **Sin datos** ✔ cubierto por diseño: sin candidato no hay tarjeta (la cara de
  «ya no queda nada» es la tajada 2, y está dicho).
- **Cargando** ✔ criterio 208, con test.
- **Error** ✔ primera mitad del 209, con test.
- **Sin permisos** ✔ criterio 189 (`canStart === false`), con test.
- **Texto largo** — pendiente de medir (criterio 213). El CSS está escrito a
  favor. **Un hallazgo propio:** `.name` recorta con `ellipsis` y
  `white-space: nowrap`, pero **el nombre completo no queda disponible en ningún
  sitio** —ni `title`, ni `aria-label` en esa línea—, y el criterio 213 pide
  literalmente que «el nombre completo sigue disponible». El `aria-label` del
  botón sí lo lleva entero, lo que salva al lector de pantalla pero no al ratón.
- **Móvil** — pendiente de medir (criterio 212).

**¿Duplica algo que ya existía?** No, contrastado contra la sección 2: no se creó
`kind` nuevo en `buildDayExecution`, ni hook, ni consulta, ni temporizador, ni
hoja, ni documento GraphQL, ni icono; `usualDurationsByActivityId` se **reusó**
(la de FEAT-011 tajada 3, ya en `main`) en vez de crearse; `findNextBlockId`
**no** se reusó, que es lo que el plan pedía; y la regla vive en su util propio y
no en `vida-agenda.utils.ts`, que no sabe de sesiones. El desvío de
`formatDurationMinutes` sobre `formatDurationFromMinutes` está bien elegido: es
lo que hace verdadero el criterio 211.

**Hallazgos que no devuelven la tajada**

- **La frase de verdad diverge del render 14 en su momento 2.** El render, con
  algo en marcha, escribe la versión **corta** («Arranca cuando pulses. Al
  hacerlo, «Daily meeting» se dará por terminada a esa hora.»); la
  implementación escribe **siempre la larga** y le pega la coletilla. **Manda el
  criterio 373** («va SIEMPRE… en los cuatro momentos»), así que la
  implementación es la correcta; queda anotado porque el render aprobado dice
  otra cosa y alguien lo mirará.
- **Las salidas.** El render las separa con « · » y la implementación usa dos
  botones con `gap`. Preferencia de estilo.
- **`planRow()` tolera duplicados** (arriba).
- **El nombre largo no queda disponible al ratón** (arriba).

**Para el constructor, lo que hay que arreglar para volver a revisión**

1. **Criterio 205/379:** que el foco sobreviva al movimiento de la tarjeta.
   Cualquiera de las dos vías sirve, y las dos son pequeñas: devolver el foco al
   botón equivalente después de que cambie el ancla, o dejar la tarjeta siempre
   en el mismo sitio del array y mover lo demás. **Con un test que la mueva de
   ancla** (de AHORA a la fila de la sesión) y afirme que `document.activeElement`
   no es `body` — el test de hoy solo avanza el reloj, que no mueve nada.
2. **Criterio 207:** que lo que vive en `aria-live="polite"` sea la línea que
   **cambia** cuando cambia la actividad propuesta, no la constante «Lo que
   viene». Con un test que cambie lo propuesto y afirme que el texto del nodo
   `aria-live` cambió.

### Tajada 1 — segunda revisión, tras el arreglo

**Veredicto: `accepted`.** Los dos motivos de la devolución están cerrados, el
hallazgo del 213 también, y **el arreglo no tocó nada de lo que ya estaba
verificado**. Lo comprobé, no me lo creí.

**Los dos motivos, uno a uno**

- **205 ✔ (la segunda mitad, la que faltaba).** El mecanismo es correcto y su
  premisa la volví a medir yo en el Chromium del panel, porque de ella depende
  todo: al mover un `<li>` con `ol.insertBefore`, con un botón de dentro
  enfocado, `document.activeElement` pasa a `body` **y no se dispara ningún
  evento de foco** (`events: []`). Es decir: el movimiento es **mudo**, la
  memoria de `focusedRef` sigue en pie y volver a enfocar funciona
  (`afterRestore: true`). Enfocar lo que ya está enfocado tampoco dispara nada,
  así que la restauración no se muerde la cola.
  Las **tres guardas bastan**, caso por caso:
  - *El usuario ya movió el foco a otra cosa* — si se fue a un elemento real,
    `focusout` trae `relatedTarget` y la memoria se borra: no hay a quién
    devolver nada. Si el foco lo tiene otro elemento en el momento del efecto,
    la tercera guarda (`active !== body && active !== target`) corta. **No hay
    robo.**
  - *El ancla no cambió* — `previousAnchor === upNext.anchorId` sale antes; un
    tic de reloj no toca el foco, y el test lo afirma con un espía sobre
    `focus`.
  - *La tarjeta perdió el botón* (`canStart` a `false`) — `isConnected` corta y
    no se enfoca un nodo desgajado.
- **207 ✔.** El `aria-live="polite"` está ahora en el `<p>` del **titular**, que
  es lo que cambia. Comprobado en el DOM del test que **hay exactamente una**
  región viva dentro de la tarjeta (`querySelectorAll('[aria-live]')` con
  longitud 1), que su texto es «Bañarme» y **no** «Lo que viene», y que no hay
  ningún `role="alert"`. El rótulo se quedó sin `aria-live`, que es lo correcto:
  una región viva de texto constante no anuncia nada.
- **213 ✔ en su mitad comprobable:** `title={upNext.title}` en la línea que
  recorta. La mitad visual (que el recorte ocurra y no empuje nada a 375 px)
  sigue siendo prueba a mano.

**Que los tests fallen sin el arreglo, no solo con él**

- *El del movimiento*: no se apoya en el `activeElement` de jsdom —que podría
  dar verde por su cuenta—, sino en un **espía sobre `boton.focus`** con
  `expect(volverAEnfocar).toHaveBeenCalled()`. Sin la restauración no hay
  llamada y el test cae. Además afirma que es **el mismo nodo `<li>`** y que su
  hermano anterior cambió: si alguien «arreglara» esto reordenando y remontando,
  también caería.
- *El del anuncio*: `expect(vivo.textContent).not.toContain('Lo que viene')` más
  `toHaveLength(1)`. Con el `aria-live` en el rótulo —como estaba— falla por las
  dos.
- *El del `title`*: falla sin el atributo.
- *El del reloj*: su asercion nueva (`not.toHaveBeenCalled()`) es la red contra
  pasarse de restaurar.

**Qué pudo romper el arreglo, y cómo lo miré**

- **Lo ya verificado está intacto, comprobado y no dicho de palabra:** repetí la
  comparación de conjuntos de líneas del diff de `VidaHoyPage.tsx` y sale
  **idéntica a la de la primera revisión** (mismo conjunto borrado, mismo
  conjunto añadido; las únicas tres líneas que no reaparecen siguen siendo el
  `map(`, su `})}` y el `import type`). El `flatMap` y las 148 líneas de
  `renderEntry` **no se tocaron**. Las fechas del árbol lo confirman:
  `VidaHoyPage.tsx` y `vida-up-next.utils.ts` son anteriores al arreglo; solo
  cambiaron `VidaUpNextCard.tsx` y `VidaHoyPage.test.tsx`.
- **Superficie del cambio:** dos `useRef`, un `useLayoutEffect` y dos manejadores
  en el `<li>` de un componente que **nadie más usa** (solo `VidaHoyPage`), más
  un atributo `title` y el traslado de `aria-live`. No hay API nueva, ni props
  nuevas, ni nada que llegue a la mutación: el botón sigue llamando
  `start(activityId)` con **un** argumento.
- **El arnés está borrado y no quedó referenciado:** no existen
  `harness-upnext.html` ni `src/harness-upnext.tsx`, y un barrido por `harness`
  en `.ts/.tsx/.html/.json` fuera de `node_modules` no devuelve nada.

**Línea base, reproducida entera por el revisor**

`typecheck` limpio · `lint` **14 errores / 0 warnings** · `test` **2 fallos de
1783**, los dos de `SearchSelect` (`IconPicker` no apareció) · `build` exit 0,
chunk inicial **1.112,20 kB** y `app-icons` **620,20 kB sin mover**. Coincide
con lo declarado, al kilobyte.

**Las dos cosas que el constructor anotó**

- **El almacén de notas del aparato sucio entre tests: bien visto, a medio
  resolver.** Limpiar al final del `it` funciona **si el test pasa**; si una
  asercion cae antes, el `setState` no llega a correr y los tests siguientes
  heredan un día con bloques «no se pudo», que es exactamente el fallo en
  cascada que esconde la causa. **Recomendación (no bloquea):** que el reinicio
  viva en el `beforeEach` del fichero, al lado de `queryCalls = {}`, y que los
  dos `it` dejen de limpiar a mano.
- **El rótulo ya no se anuncia: de acuerdo, y queda escrito para la tajada 2.**
  El criterio 207 pide que el reloj **calle**, y «· se pasó de la hora» lo
  dispararía el reloj. La regla para la tajada 2 es: **una sola región viva en
  la tarjeta, y es la del titular**; el rótulo no se vuelve a poner vivo, y la
  cara del criterio 377 —que no tiene titular de actividad— simplemente no
  tiene ninguna.

**Hallazgos nuevos, ninguno bloqueante**

- **La restauración puede desplazar la pantalla.** `target.focus()` va sin
  `preventScroll`, así que si el usuario dejó la tarjeta fuera de vista, la
  vuelta del foco la trae a la vista. El caso es estrecho (hace falta que el
  foco se haya ido a `body` sin `relatedTarget` —clic en zona no enfocable— y
  que justo después cambie el ancla), pero el criterio 379 dice «no desplaza la
  pantalla bajo el dedo de quien estaba leyendo otra cosa». **Un carácter lo
  cierra:** `target.focus({ preventScroll: true })`.
- **Si el ancla cambiara con el botón todavía deshabilitado, el foco se
  quedaría en `body` y no hay reintento.** Medido en Chromium: deshabilitar el
  botón enfocado **no** mueve `activeElement` (sigue en el botón, y por eso la
  memoria no se pierde), pero tras la mudanza `focus()` sobre un botón
  deshabilitado no hace nada. En la app real no debería ocurrir:
  `invalidateFollowUpQueries` **solo invalida** (no escribe en la caché), así
  que el ancla cambia cuando vuelve el refetch, bastante después de que
  `unlock()` libere `isBusy`. Queda anotado por si algún día se mete una
  escritura optimista.

**Lo que sigue para el usuario, y es lo único que queda de esta tajada**

- **212 (375 px)**, **214 (oscuro y trazo)**, **la mitad visual del 213** y
  **218 (el criterio de fase)**: `/app/vida/hoy` está detrás del login y los
  agentes no entran con credenciales (`ENVIRONMENT.md`). Los pasos están abajo.

### Tajada 2 — los dos bordes: se pasó la hora, y ya no queda nada

**Veredicto: aceptada.** Los cinco criterios de la tajada se cumplen con
evidencia propia, la línea base no empeora, el test intocable del arranque de un
toque está **byte a byte igual**, y no encontré ninguna regresión en lo que se
entregó esta semana. Queda el 218 para el usuario, como estaba previsto.

**Criterios, uno a uno** (contra la sección 1, no contra el resumen):

- **193** ✔ El rótulo pasa a «Lo que viene · se pasó de la hora» y **nada más
  cambia**: leí el `.module.scss` entero y **no hay ninguna regla que dependa de
  `isOverdue`** —no existe un `[data-overdue]`—, así que no puede haber color de
  alarma ni ámbar; medido en el navegador, el trazo sigue siendo el mint de la
  propuesta. Sin exclamaciones y sin segunda tarjeta (un solo `<li>` en el DOM).
  Juzgando las palabras, no solo su existencia: «se pasó de la hora» es el
  sujeto correcto —la hora, no la persona—, no lleva adjetivo ni adverbio de
  juicio, y el resto de la tarjeta (botón, frase de verdad, meta) es idéntico
  carácter a carácter al caso a su hora. Pasa.
- **197** ✔ «Ya la hice» está escrita en la línea de salidas, fuera de todo menú,
  y solo con `exits.showDidIt = isOverdue`. Y **es la misma función**: el
  `onDidIt` de la página llama a `markBlockDone(block)`
  (`VidaHoyPage.tsx:767`), que es literalmente la del «Lo hice» del bloque
  (`logSessionInput` + `plannedSessionMinutes`). No hay una segunda aritmética;
  lo verifiqué leyendo la función, no el test.
- **377** ✔ Mismo `<li>`, misma región (`aria-label` «Lo que viene»), canaleta
  **vacía** (medido: `li.querySelector('time') === null`), trazo **punteado y
  neutro** (`getComputedStyle` sobre la tarjeta real: `dashed
  rgba(28,28,30,0.12)` — nunca el punteado violeta de FEAT-007) y «▶ Empezar
  algo» que abre `openLogSheet({ mode: 'start' })`. No inventa sugerencias.
  **Y los números:** no «coinciden por test», **coinciden por construcción**.
  La tarjeta recibe `budget.remainingMinutes` y `dayHours.endTime`, que son
  exactamente los dos valores que `VidaDayBudget` imprime
  (`VidaDayBudget.tsx:102-108`), y los escribe con los mismos formateadores
  (`formatDurationFromMinutes`, `formatTimeForDisplay`). No hay una segunda
  resta en ningún sitio: cualquier momento del día da el mismo número en las dos
  líneas porque es **el mismo número**.
- **192** ✔ Con el plan vacío, `pickUpNextBlock` devuelve `null` y se pinta
  exactamente la cara del 377, sin una cara intermedia y sin repetir el «Aún no
  hay plan para hoy.».
- **209 (segunda mitad)** ✔ Con `activityDayFollowUps` caído no propone y **no
  dice que no queda nada**: el `reason: 'execution-unknown'` cambia el texto a
  «No pudimos cargar lo que llevas hecho hoy, así que no te proponemos nada.» y
  deja «Empezar algo», que es literalmente lo que pide el criterio.
- **218** — **pendiente del usuario**, y sigue pendiente: `/app/vida/hoy` está
  tras el login y ahí no entro. No lo apruebo por simpatía.

**Sobre el campo `reason` que el constructor se inventó:** la distinción es
**real, no complejidad de más**. El criterio 377 manda afirmar «ya no queda nada
en tu plantilla» y el 209 **prohíbe exactamente esa afirmación** cuando no se
sabe qué se ha hecho. Sin un discriminador, una de las dos se incumple: no hay
tercera opción. Los dos textos dicen la verdad en su rama. La única aspereza es
que en la rama `execution-unknown` el rótulo sigue siendo «Lo que viene» encima
de un texto que dice que no se propone nada; es raro de leer, pero es preferible
a mentir, y el criterio no pide otra cosa. Se queda como hallazgo de redacción,
no como defecto.

**Las dos desviaciones del render 14: las dos aceptadas.**

1. **«3h 8» en vez de «3 h 8».** Aceptada, y además creo que es la única
   respuesta correcta: el propio criterio 377 exige que el número **coincida con
   el de la barra de arriba**, y la barra usa `formatDurationFromMinutes`.
   Elegir la tipografía del render habría significado un segundo formateador y
   dos maneras de escribir el mismo minuto a tres dedos de distancia. Entre
   parecerse al render y decir lo mismo que la línea de encima, manda lo
   segundo.
2. **El orden «Ver las otras N · Ya la hice · Empezar otra cosa».** Aceptada,
   con una matización que el constructor no hizo: **no coincide con la
   enumeración del criterio 376** (que nombra «Ver las otras N», «Empezar otra
   cosa» y «Ya la hice», en ese orden) y **sí** con el render («Ya la hice ·
   Empezar otra cosa»). Ninguna de las dos fuentes dice «en este orden», así que
   no hay incumplimiento; seguir al render aprobado es la elección defendible.
   Queda escrito para que nadie lo lea como un descuido.

**El arranque de un toque — comprobado, no creído.** El test intocable
(`VidaHoyPage.test.tsx:2511`, «un solo toque arranca, y la duración planeada no
viaja») **no aparece en el diff**: filtré todas las líneas `-` del
`git diff` del archivo y ninguna toca `startSession.mock.calls[0]`; el único
cambio cercano está 15 líneas antes, en el caso del rótulo. La aserción sigue
comparando el **array entero**: `expect(startSession.mock.calls[0]).toEqual(['a-b1'])`.
Y «Ya la hice» **no le ha robado ni sitio ni toques al botón**: medido en el
navegador con un `iframe` del ancho exacto (el panel emula 568 px y medir la
pestaña a pelo miente), el «▶ Empezar ahora» mide **295 px de ancho y arranca en
y=86** con «Ya la hice» en pantalla, igual que sin ella; las tres salidas viven
en una línea aparte 130 px más abajo, en 18 px de alto. El botón sigue siendo un
solo toque y no lo comparte con nadie.

**Anchos, medidos** (`iframe` de ancho exacto sobre el 5173 del usuario, arnés
temporal borrado antes de reportar — el árbol vuelve a tener solo los 8 archivos
del constructor):

| | 375 px | 760 px |
|---|---|---|
| `documentElement.scrollWidth` | **375** (sin scroll horizontal) | **760** |
| `li` de la tarjeta | 375 / `scrollWidth` 375 | 760 / 760 |
| «▶ Empezar ahora» | 295 px, y=86 | 680 px, y=86 |
| Las tres salidas | misma fila (x 84 · 177 · 241, fin en 344) | misma fila |
| Nombre de ~60 caracteres | no cambia la altura del `li` (248 px): se recorta | igual |
| Cara apagada | 122 px de alto, botón a ancho completo | — |

**Qué busqué alrededor, y cómo:**

- `graphify explain "VidaUpNextCard"` y `graphify explain "buildUpNext"`: grado
  2 y 4, sin más consumidores que su barril. Confirmado abriendo los archivos:
  **`VidaUpNextCard` y `vida-up-next.utils` solo los monta `VidaHoyPage`**, así
  que el cambio de `UpNext` a unión discriminada no puede romper a nadie más.
- **`markBlockDone`**: dos llamadas, la del bloque (`:1040`) y la nueva
  (`:1179`); `VidaRevisionPage` solo lo cita en comentarios. No se duplicó
  aritmética.
- **Lo que el constructor marcó como «lo que más probablemente he roto»** —«hay
  tarjeta donde antes no había nada»—: **la suite completa está verde en la
  línea base** (2 fallos de 1965, los dos `SearchSelect` preexistentes; la base
  era 2 de 1951, y los 14 de más son suyos). Ningún caso que contara filas se
  cayó.
- **FEAT-019 y FEAT-020, lo de esta semana:** ni el arco, ni el semáforo, ni el
  vidrio entran en el diff (8 archivos, todos de «Lo que viene»), y sus casos
  pasan en la corrida completa. **Bajo el arco no ha vuelto ninguna frase con
  hora:** `VidaGoalArc.module.scss` **sigue sin la regla `.line`** (la que se
  quitó en la tajada 5 de FEAT-019) y el arco se pinta **fuera del `<ol>` de la
  agenda** (`VidaGoalArcRow` en `:1285`; la lista es `agendaList`, `:1193`, y
  se monta en `:1382`). La tarjeta nueva es **hija del `<ol>`** y cuelga del
  ancla —sesión viva o marca de AHORA—, así que no puede aterrizar debajo del
  arco.
- **CSS, por lista de selectores y no por tamaño**, como manda
  `ENVIRONMENT.md`: compilé con `sass --style=compressed` el
  `VidaUpNextCard.module.scss` de `HEAD` y el del árbol (es el **único** `.scss`
  del diff). **Perdidos: ninguno.** Nuevos: cinco
  (`.empty`, `.playQuiet`, `.row[data-variant=empty] .card`, `… .kicker`,
  `… .tick`). No hay ningún comentario abierto.
- **Línea base:** `pnpm lint` → **14 errores / 0 warnings**; `pnpm test` → **2
  fallos de 1965**; `pnpm build` → exit 0, chunk inicial **1.133,58 kB** (base
  1.131,64: +1,94 kB de código propio, **nada de iconos**) y CSS **275,91 kB**
  (sube, que es lo que tiene que pasar al añadir reglas).

**El test verde por la razón equivocada: el arreglo es correcto, y no hay más.**
El caso del criterio 180 ahora elige el día con
`routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] }`, además pone
`viewedDate = '2026-09-17'` y `plansByDate['2026-09-17'] = PLAN` —o sea, el día
pasado **tiene plan**, que es lo que hace el caso significativo— y **afirma
primero que la cabecera dice «Jueves 17»** antes de comprobar que no hay
tarjeta. Es exactamente el arreglo que hacía falta. **Busqué el mismo vicio en
el resto:** `grep -rn "pushState"` sobre **todos** los `.test.ts(x)` de `src/`
devuelve **solo las dos líneas de comentario** del arreglo; no queda ni una
llamada. Las otras 26 elecciones de día del archivo usan `initialEntries`.

**Estados que nadie construye:**

- **Sin datos** ✔ es justo esta tajada (el 377/192).
- **Cargando** ✔ el criterio 208 sigue: con lo vivido en vuelo, **ningún nodo**
  (y hay caso propio, separado del de error).
- **Error** ✔ el 209, con su rama `execution-unknown`.
- **Sin permisos** ✔ con `canStart === false` la cara apagada **no pinta el
  botón**: enseña el `blockedNote` y lleva a la barra. Hallazgo menor: el
  criterio 377 dice «deja «▶ Empezar algo»» sin condición, y aquí no lo deja;
  manda el 189, que es la regla explícita y más fuerte. No lo devuelvo por esto,
  pero queda dicho.
- **Texto largo** ✔ medido: un nombre de ~60 caracteres no cambia la altura ni
  produce scroll.
- **Móvil (375 px)** ✔ medido arriba.

**Hallazgos que no devuelven la tajada:**

1. **Rama muerta.** En `buildUpNextEmpty`, el caso
   `remainingMinutes === null || <= 0` («Tu viernes se acaba a las 23:00.», sin
   «Te quedan») **es inalcanzable**: la tarjeta solo se construye con
   `nowMinutes < dayEndMinutes`, así que `remainingMinutes` siempre es > 0. En
   consecuencia, **el paso (4) de las pruebas manuales del constructor describe
   una pantalla que no puede existir**: con el día ya cerrado no hay tarjeta, ni
   apagada ni de ninguna clase. Es defensa barata, no un defecto; pero el paso
   manual hay que corregirlo o el usuario buscará algo que no está.
2. **La cifra se dice dos veces.** «te quedan 13h 36 hasta las 23:00» en la
   barra y «Tu viernes se acaba a las 23:00. Te quedan 13h 36.» en la tarjeta,
   en la misma pantalla. Lo exige el criterio 377, así que no es incumplimiento;
   vale la pena que el usuario lo vea una vez en la pantalla real y decida.
3. **Orden de las salidas** (arriba), y **rótulo «Lo que viene» sobre un texto
   que no propone nada** en la rama `execution-unknown`.
4. **`ENVIRONMENT.md`** —que no toco— está al día en todo lo que usé, salvo una
   cosa que el constructor descubrió y que se paga cada vez: **el panel del
   navegador emula 568 px, así que medir anchos en la pestaña a pelo miente; hay
   que meter la pantalla en un `iframe` del ancho exacto**, y ojo con que un
   contenedor `flex` encoge el `iframe` e ignora su atributo `width` (me pasó y
   costó una medición). Eso merece una línea en «Trampas de este repositorio».

**¿Duplica algo que ya existía?** No. Contra la sección 2: «Ya la hice» reusa
`markBlockDone`, no una copia; «Empezar algo» reusa `openLogSheet({ mode:
'start' })`, no una segunda hoja; los números de la cara apagada **consumen**
`getDayBudget` y `formatDurationFromMinutes` en vez de rehacer la resta; y no
hay ningún documento GraphQL nuevo ni consulta nueva (el caso del criterio 204
compara los dos caminos del mismo `useMemo` y da los mismos espías). Lo único
nuevo de verdad es `buildUpNextEmpty`, y el plan preveía una firma que no era
construible.

**Qué queda para prueba manual (el usuario, con sesión y la API despierta):**

1. Abre `/app/vida/hoy` en un día con algo de la plantilla **cuya hora ya pasó**.
   La tarjeta debe proponerlo igual, con «Lo que viene · se pasó de la hora» y
   sin ninguna bronca.
2. Pulsa **«Ya la hice»**. El bloque pasa a hecho **sin recargar** y la tarjeta
   pasa a proponer lo siguiente.
3. Resuelve todo lo que te quede del día. La tarjeta se apaga y dice cuánto te
   queda hasta el fin de tu día: **comprueba que es el mismo número que la barra
   de arriba**.
4. Mírala en **oscuro** sobre la pantalla real (aquí está medido en un arnés, no
   en `/app/vida/hoy`).
5. Y lo que de verdad cierra la feature (**218**): con la hora pasada delante,
   **¿pulsas sin miedo a que te registre horas que no vas a pasar?**

### Tajada 3 — retirar las fichas del hueco y el panel «Tu plantilla de \<día\>»

**Veredicto: aceptada.** Con ella la feature queda **`delivered`**.

**Criteria, one by one** (contra la sección 1, no contra el resumen del
constructor):

- **380 — las dos a la vez, y en la última tajada.** ✔ Las dos retiradas viajan
  en el mismo árbol; las tajadas 1 y 2 están aceptadas y en `main`, así que «Lo
  que viene» ya estaba en pantalla antes de quitar nada.
- **381 — las fichas desaparecen.** ✔ `VidaAgendaGap.tsx` no tiene rama de
  fichas: el hueco futuro pinta cabecera + (nota de plantilla vacía) + una sola
  píldora. Afirmado por tres casos nuevos en `VidaAgendaGap.test.tsx`
  (`getAllByRole('button')).toHaveLength(1)`, sin `/más$/`, sin
  `/sueles tardar/`, sin `/lo que cabe aquí/`) y por dos reescritos en
  `VidaHoyPage.test.tsx`. Derogaciones anotadas donde tocaba (ver abajo).
- **382 — «+ otra cosa» no desaparece.** ✔ Comprobado en el código
  (`VidaAgendaGap.tsx`: `<ul class=chips><li><button class="chip chipMore">+ otra
  cosa`), en test (`onOpenSheet` recibe el hueco; el hueco sigue diciendo franja
  y tamaño) y **en pantalla medida por mí** (abajo). La rama «tu plantilla no
  trae nada» + «Ver tus actividades» **sigue viva por `templateCount`**: la vi
  renderizada con `templateCount={0}` y ausente con `templateCount={3}`.
- **383 — el panel desaparece entero y «Mañana» se queda.** ✔ La carpeta
  `VidaTemplateAside/` está borrada en el índice; `VidaTomorrowAside` es un
  **movimiento fiel**: `diff` del cuerpo viejo (`6ff8b2e:VidaTemplateAside.tsx:243-326`)
  contra el nuevo → **solo** cambian el nombre de la función, `section`→`aside`,
  `h3`→`h2` y tres clases renombradas. La llamada a `build({ date: tomorrow,
  templateItems: template, … })` es idéntica.
- **384 — los cuatro caminos, cada uno con su test.** ✔ con matices, abiertos
  uno a uno en `VidaHoyPage.test.tsx:2177-2218`:
  **(a)** *afirma el camino*: pulsa «Poner otra cosa a las 10:30» y comprueba que
  la hoja abre con «Poner algo a las 10:30» y el subtítulo del hueco.
  **(b)** afirma la **presencia** del botón «Armar desde la plantilla» y el
  `href` del puente a la semana; no pulsa.
  **(c)** afirma la presencia de «Armar mañana desde la plantilla» (y en
  `:1056-1064`, dentro del `complementary`); no pulsa.
  **(d)** afirma `vidaPaths.plantilla === '/app/vida/plantilla'` y que sigue en
  `appModules`; no renderiza la pantalla.
  Los cuatro caminos **existen y ninguno se tocó** —que es lo que el criterio
  pide—, pero (b), (c) y (d) son de presencia, no de comportamiento. Va como
  hallazgo, no como devolución: (b) escribe por `useBuildDayFromTemplate`, que no
  se modificó, y (c) es código movido sin cambios.
- **385 — código muerto retirado, y no de más.** ✔ Censo repetido por mí sobre el
  árbol: `git grep` de `suggestionsForGap|MAX_GAP_SUGGESTIONS|findFirstFittingGap|GapSuggestion|fitsInGap|usualDurationsByItemId|SuggestionsForGapInput|NO_SUGGESTIONS|placeSuggestion|onPlaceSuggestion|isPlacing|VidaTemplateAside`
  excluyendo `docs/` y `graphify-out/` → **10 apariciones, las diez dentro de
  comentarios** que explican la retirada. **Cero código vivo.**
  `usualDurationsByActivityId` sigue viva y **sin tocar** (el `git diff` de
  `vida-patterns.utils.ts` solo borra la hermana y reescribe el comentario de
  cabecera; el cuerpo de la función no cambia) y conserva sus consumidores
  (`VidaHoyPage:592`, `VidaLogSessionSheet`, cuatro casos de test).
  Ningún test borrado a secas: **−15** en `vida-agenda.utils.test.ts` (los 2 de
  `fitsInGap`, los 9 de `suggestionsForGap` y los 4 del `describe` de las fichas
  del 91) **+5** en `VidaAgendaGap.test.tsx` = **−10**, exactamente los −10 de la
  corrida; `VidaHoyPage.test.tsx` cambia 12 por 12. Cada sustituto nombra su
  criterio y el archivo de utilidades queda con la nota de dónde vive lo nuevo.

**Las tres desviaciones del plan, juzgadas con el código delante:**

1. **Conservar `.chips`, `.chip`, `.chipMore` y `.note` es correcto.** Verificado
   en `VidaAgendaGap.tsx`: «+ otra cosa» **es** `<ul class=chips><li><button
   class="chip chipMore">`, y la rama de plantilla vacía **es** `<p class=note>`.
   El plan los daba por muertos y el plan se equivocaba.
2. **Sacar `addMutation` e `isPlacing` de la página es correcto.** `VidaHoyPage`
   nunca le pasó una mutación a `VidaPlaceInGapSheet`: la hoja tiene la suya
   (`VidaPlaceInGapSheet.tsx:96` y `:153`). El camino de punta a punta está
   cubierto: la página abre la hoja desde «+ otra cosa» (`VidaHoyPage.test.tsx:778-787`)
   y la hoja guarda con `addMutation.mutate` afirmado en su propia suite
   (criterio 23/25, y el criterio 29 para el fallo). Nada quedó sin escribir.
3. **El riesgo que él mismo señaló: `templateCount` cambió de cuenta. Medido, y
   no puede hacer desaparecer la rama.**
   - Antes: `suggestions.filter(s => s.item.isActive !== false).length`
     (`6ff8b2e:vida-agenda.utils.ts`, dentro de `suggestionsForGap`).
   - Ahora: `usableTemplateItems(...)`, que filtra `isActive !== false`
     **y además** `activity?.status !== 'cancelled'` (`vida-build-day.utils.ts:63-67`).
   - **Los dos ignoran el plan del día**: lo ya puesto hoy no entraba en la
     cuenta vieja (era `suggestions`, no `candidates`), así que **ese caso no
     difiere**. Tampoco «otro día»: las dos salen de las `suggestions` de la
     fecha mirada.
   - **La única divergencia real** son los ítems cuya actividad está
     **archivada** (`status: 'cancelled'`), que el API sí devuelve dentro de las
     sugerencias (`vida-items.graphql.ts:14-19`). La cuenta nueva es siempre
     **subconjunto** de la vieja ⇒ si la vieja era 0, la nueva también: **la
     rama no puede desaparecer cuando debía aparecer.** Solo puede aparecer de
     más, en un día cuyos ítems de plantilla apunten **todos** a actividades
     archivadas; y ahí la frase es imprecisa pero la salida que ofrece —«Ver tus
     actividades»— es justo el sitio donde se arregla. Además ahora **cuadra con
     la cabecera** de la misma pantalla (`VidaHoyPage.tsx:1496`), que ya usaba
     esta cuenta y antes podía contradecir al hueco. **Hallazgo, no devolución.**

**What broke nearby** (cómo busqué, no solo qué encontré):

- **`graphify explain "VidaTemplateAside"` → «No node matching»**: el
  constructor corrió `graphify update .` al terminar, así que el grafo ya
  refleja el árbol **sin** el componente y no sirve para «¿quién dependía de
  esto?». Lo dejo escrito porque es el caso que `PROTOCOL.md` avisa al revés.
  La pregunta se contestó sobre `6ff8b2e`, que sí es el estado previo:
  `git grep -n "VidaTemplateAside" 6ff8b2e -- src` → **un solo importador de
  código** (`VidaHoyPage.tsx:19,1613`), su propio `index.ts`, y tres menciones
  en comentarios. `VidaTomorrowBlock` en `6ff8b2e` → solo dentro de
  `VidaTemplateAside.tsx`. Nadie más quedó colgando.
- **Lo que vivía al lado en el hueco**: la rama `sliver`/`isPast` de FEAT-011
  («Registrar lo que hice») y la segunda salida de FEAT-014 siguen en el
  archivo y las vi renderizadas (`8:45 | Libre 8:45 – 9:24 | 39m | Registrar lo
  que hice`). Sus suites pasan enteras.
- **Los cuatro archivos ajenos tocados** (`useVidaDayWindow.ts`,
  `vida-execution.utils.ts`, `vida-start-suggestions.utils.ts`,
  `query-cache-guards.hydration.test.tsx`): revisados en el `git grep` de
  arriba, **solo comentarios**; sus tests pasan.
- **La bajada del CSS, rehecha por mí** como manda `ENVIRONMENT.md`. Compilé
  **todo** el `.scss` de `6ff8b2e` (`git archive`) y del árbol con
  `sass --style=compressed`, extraje los selectores y los comparé:
  `comm -23` → **exactamente 12**: `button.chip:disabled`, `.chipName`,
  `.chipTime`, `.noRoom`, `.noRoomNote`, `.place`, `.place:disabled`,
  `.place:focus-visible:not(:disabled)`, `.place:hover:not(:disabled)`,
  `.tomorrow`, `.tomorrowHeading`, `.tomorrowNote`. `comm -13` → **vacío**.
  **Coincide con lo que el constructor declaró, símbolo a símbolo.** Los **16**
  `.module.scss` que no compilan sueltos son **la misma lista** en los dos lados
  y `cmp` los da **byte a byte idénticos**: no movieron la cifra. Ninguna regla
  ajena se perdió, no hay comentario sin cerrar.

**Línea base, corrida entera por mí:**

| Qué | Línea base | Medido ahora | Lectura |
|---|---|---|---|
| `pnpm typecheck` | limpio | **limpio** | = |
| `pnpm lint` | 14 / 0 | **14 errores / 0 warnings** | = |
| `pnpm test` | 2 fallos de 2304 | **2 fallos de 2294** (`SearchSelect` ×2, preexistentes) | −10, y los −10 están contados uno a uno arriba |
| `pnpm build` | 1.160,84 kB · CSS 282,61 kB | **1.154,54 kB · CSS 280,11 kB** | −6,30 kB y −2,50 kB, la bajada del CSS demostrada por selectores |

**States left unbuilt** (medidos por mí, con un arnés temporal en la raíz + `src/`
servido por el 5173 del usuario, en `iframe` del ancho exacto porque la pestaña
emula 568; **arnés borrado**, `git status` no lo lista):

- **Mobile 375 px:** `documentElement.scrollWidth` = **375**, **0 nodos
  desbordados**. **760 px:** 760 y 0 desbordados (el ancho que
  `ENVIRONMENT.md` avisa que falla solo). ✔ criterio 212.
- **Sin datos / plantilla vacía:** `templateCount={0}` → `10:30 | Libre 10:30 –
  13:00 | 2h 30 | Todavía no tienes nada en tu plantilla para los viernes. |
  Ver tus actividades | + otra cosa`. Con `templateCount={3}` la nota no está y
  queda `… | 2h 30 | + otra cosa`. ✔
- **Pasado:** `8:45 | Libre 8:45 – 9:24 | 39m | Registrar lo que hice`. ✔
- **Oscuro:** sin desbordes y con los textos legibles, pero **no doy por
  verificada la cifra de contraste**: mi arnés no pinta la superficie real de la
  app, así que el fondo efectivo no es el de `/app/vida/hoy` y los números que
  saqué (9,9–13,7:1 en oscuro; y un 2,76:1 en «Ver tus actividades» que el
  desglose por capas demuestra que es artefacto del arnés) no son concluyentes
  en ninguno de los dos temas. Lo que **sí** es firme: el `.module.scss` cambia
  **solo restando** (`.chipName`, `.chipTime`, `button.chip:disabled`); las
  reglas `.note`, `.chips`, `.chip` y `.chipMore` no se tocan, así que el tema
  oscuro de lo que sobrevive es **el mismo que ya estaba aceptado**. Criterio
  214 sigue siendo del usuario.
- **Cargando / error / sin permisos:** no aplican a esta tajada —es una
  retirada; el hueco no pide nada al servidor—. En `VidaTomorrowAside` el estado
  «cargando» sí existe y se conservó tal cual («Mirando cómo viene mañana…»).
- **Texto largo:** no medido aquí. Los dos textos del hueco (franja y tamaño) son
  generados, no de usuario; el único texto de usuario que llegaba al hueco venía
  **en las fichas que se han retirado**. Riesgo menor que antes, no mayor.

**Does it duplicate something that existed?** No. Contra la sección 2: no se creó
ninguna utilidad —solo se borraron siete símbolos y se **movió** un bloque—;
`VidaTomorrowAside` es `VidaTomorrowBlock` con otro nombre, comprobado con
`diff`; `templateCount` reutiliza el `buildableTemplate` que la página ya
calculaba (`VidaHoyPage.tsx:1028-1029`), sin una segunda cuenta; y
`usualDurationsByActivityId` absorbe a su hermana en vez de duplicarla.

**Derogaciones, revisadas una a una:** en `FEAT-003` y `FEAT-007` el `git diff`
es **solo adiciones al final del archivo**. Ningún criterio de arriba se
reescribió: los dos bloques son un apéndice fechado que dice qué criterio queda
derogado, en qué mitad, y apunta a FEAT-010. Correcto.

**Hallazgos** (no devuelven la tajada; quedan escritos):

1. `templateCount` puede encender la rama «tu plantilla no trae nada» en un día
   cuyos ítems apunten **todos** a actividades archivadas. Nunca al revés.
2. Los caminos (b), (c) y (d) del 384 se prueban por **presencia**, no pulsando.
   Nadie pulsa «Armar mañana desde la plantilla» en ninguna suite —tampoco antes
   de esta tajada—: `VidaTomorrowAside` sigue sin suite propia, deuda heredada.
3. La comprobación de CSS que `ENVIRONMENT.md` manda hacer está **coja en 16
   archivos** por el alias `@`. Se arregla pasándole el `--load-path` a `sass` o
   con un script en `package.json`. No es de esta tajada, pero el mapa debería
   decirlo (no toco `ENVIRONMENT.md`).
4. El lateral **entero** puede quedar en nada cuando `VidaTomorrowAside`
   devuelve `null` (último domingo de la ventana, o mirando mañana). Es
   consecuencia buscada del 383, pero es un cambio de hueco en el escritorio que
   conviene que el usuario mire.

**Verdict: accepted** — los seis criterios (380–385) se cumplen con evidencia,
la línea base no empeora en ninguna de las cuatro puertas, la bajada del CSS es
legítima y verificada por mi propia lista de selectores, el censo de símbolos
da **cero** código vivo fuera de comentarios, y no encontré ninguna regresión
en lo que vivía alrededor. Las tres desviaciones del plan están bien razonadas
y las comprobé con el código delante. Lo que no pude cerrar —375 px sobre la
pantalla real, oscuro con la superficie real, y el recorrido con sesión— es el
límite estructural del repositorio (`/app/*` está tras login y los agentes no
entran), y va abajo como pasos del usuario.

**For the user** — con esta tajada la feature queda **entregada**:

Hoy, cuando abres el día, la pantalla ya no te empuja desde dos sitios a la vez.
Antes, cada rato libre te llenaba la línea con fichas de tu plantilla que al
tocarlas **escribían el plan al primer toque y sin preguntar**, y el lateral te
repetía la lista entera del día con un botón «Ponerla» que colocaba con otra
regla distinta que nadie te contaba. Eso es lo que nos dijiste que no entendías
y que te invadía, y es lo que se ha ido. Lo que queda en cada hueco es lo que de
verdad necesitas saber: **a qué hora empieza, hasta cuándo va y cuánto te cabe**,
con una sola salida clara, «+ otra cosa», que abre la hoja de siempre donde tú
eliges qué, cuánto y cuándo, y confirmas. Y si ese día tu plantilla no trae nada,
el hueco te lo dice y te lleva a tus actividades.

No has perdido ningún camino. Armar el día entero desde la plantilla sigue donde
estaba, la vista de semana también, y el lateral del escritorio se queda **solo
con «Mañana»**, que es el gesto de la noche: dejar mañana montado en dos toques
sin cambiar de pantalla. Lo que las fichas intentaban hacer —decirte qué toca
ahora— lo hace desde hace dos tajadas la tarjeta de **«Lo que viene»**, dentro de
la línea y justo debajo de lo que estás haciendo, con «suele durarte N» y un
botón de empezar. Una sola voz en vez de tres.

**Cinco pasos para recorrerlo a mano** (todo esto vive tras tu sesión, así que
solo lo puedes cerrar tú):

1. Abre **Hoy** con un rato libre por delante: el hueco tiene que enseñar su
   franja y su tamaño, y ofrecer **«+ otra cosa»** (más «Registrar» si el rato ya
   pasó) y **nada más**. Ninguna ficha de tu plantilla.
2. Pulsa **«+ otra cosa»**: tiene que abrir «Poner algo a las HH:MM» con el
   subtítulo del hueco. Elige qué, cuánto y cuándo, y **guarda**: el bloque tiene
   que aparecer en la línea.
3. Mira el **lateral del escritorio**: solo «Mañana, \<día\>». Pulsa **«Armar
   mañana desde la plantilla»** y comprueba que mañana queda armado de verdad.
   *(Ojo: el lateral no se pinta si ya estás mirando mañana ni el último día de
   la ventana.)*
4. Entra en un día **cuya plantilla esté vacía**: el primer hueco tiene que
   decir «Todavía no tienes nada en tu plantilla para los \<días\>» con «Ver tus
   actividades». Y si tienes ítems de plantilla apuntando a actividades
   **archivadas**, mira qué dice ahí: es el único punto donde la cuenta cambió.
5. Y lo de fondo, que es la razón de la tajada: **usa el día un rato y fíjate en
   si echas de menos algo** de lo que se ha quitado. Si algo te falta, dilo: se
   puede devolver por otro camino.
