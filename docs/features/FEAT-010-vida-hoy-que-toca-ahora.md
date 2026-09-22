---
id: FEAT-010
title: Lo que viene — dentro de la línea, debajo de lo que estás haciendo, y arranca de un clic
status: specified
architect: yes    # vive dentro de la lista de la agenda y se mueve con la sesión en marcha, y retira dos superficies de FEAT-003 derogando criterios entregados
area: features/vida
requested: 2026-09-22
updated: 2026-09-22   # reescrito entero: render nuevo aprobado (14) y una decisión nueva del usuario
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
| 1 | **«Lo que viene», dentro de la línea, con la promesa escrita y un clic.** Debajo de lo que está pasando (o en la línea de AHORA), la siguiente cosa de la plantilla con «suele durarte N», **la frase de verdad siempre**, «▶ Empezar ahora» de un solo toque, y las salidas pequeñas debajo. **Ya es útil sola, y es la feature entera en su caso normal:** el usuario pulsa. Criterios 180, 183, 184, 186, 187, 188, 189, 196, 203–217, 370–376, 378, 379. | pending |
| 2 | **Los dos bordes: se pasó la hora, y ya no queda nada.** El rótulo «· se pasó de la hora» con «Ya la hice» escrita, la mitad «ya llegó» de la regla de elección, y el momento en que la plantilla se acabó: cuánto te queda de día y «Empezar algo». Criterios 192, 193, 197, 375 (segunda mitad), 377. | pending |
| 3 | **Retirar las fichas del hueco y el panel «Tu plantilla de \<día\>».** Con sus derogaciones escritas (FEAT-003 18, 19, 23 y la mitad del 48; FEAT-007 la mitad del 91), «+ otra cosa» y «Armar mañana» intactos, y los cuatro caminos comprobados uno a uno. Criterios 380–385. | pending |

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
