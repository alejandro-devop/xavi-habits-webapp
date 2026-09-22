---
id: FEAT-011
title: Registrar en el hueco — el rato libre que ya pasó se pulsa y cuentas qué hiciste
status: specified
architect: yes    # concepto nuevo: la ventana **real** del hueco (bordes de lo vivido, no de lo planeado), que hoy no existe en ningún sitio
area: features/vida
requested: 2026-09-22
updated: 2026-09-22
---

# FEAT-011 — Registrar en el hueco — el rato libre que ya pasó se pulsa y cuentas qué hiciste

## 1. The request — feature-analyst

**Summary for whoever's next:** en Hoy, un hueco que **ya pasó** deja de ser una
línea muerta y ofrece **«Registrar lo que hice»**: abre la hoja de registro ya
anclada a ese hueco, con la duración **editable** y **validada por arriba y por
abajo** contra los bordes reales, y al guardar **el hueco se encoge** y sigue
ahí. La primera tajada es exactamente eso contra los bordes **planeados**, que
es lo que ya se sabe calcular: con ella sola una mañana se reconstruye a trozos.

**What problem it solves:** el usuario tiene ratos del día sobre los que el
sistema no sabe nada, y hoy **no hay por dónde contarlos desde donde se ven**.
La pantalla ya le enseña «Libre 9:30 → 11:30 · 2 h», pero ese renglón no hace
nada: para decir qué hizo ahí tiene que subir a «Registrar tiempo pasado», que
abre **media hora antes de ahora** y le obliga a **volver a teclear** la hora que
la pantalla ya está enseñando. Y el problema de fondo no es la hora: es que
**tener dos horas libres no dice nada de lo que hizo** —lo que hizo duró quince
minutos—, así que registrar «el hueco» entero sería mentira, y registrar a mano
arriesga escribir algo que **se pisa con lo de al lado**, que es una segunda
mentira que nadie descubre hasta la revisión. Falta el gesto que va del sitio
donde se ve el rato libre a contarlo, **con la aritmética hecha**.

**Who it's for:** el usuario del módulo Vida, **a media tarde o al final del
día**, rellenando lo que no registró mientras ocurría —y también al día
siguiente, sobre un día de la tira—. Es el mismo momento que ya tiene «¿Qué
pasó?» (FEAT-004, criterio 48) pero desde el otro lado: no lo pregunta el
sistema, lo decide él al ver el hueco.

**User's words:** (verbatim, 2026-09-22)

> «en esa misma lista de "hoy" también quiero ver los bloques libres que haya
> entre actividades, al presionar puedo registrar qué hice (puedo editar la
> duración porque podría tener 1 hora libre pero lo que hice solo me tomó 15
> mins); el sistema debe validar que la actividad que yo ponga no exceda esa
> duración del tiempo libre ni que se cruce por encima o por debajo».

**Render aprobado y fuente de verdad:** `docs/vida/assets/12-vida-hoy-registrar-en-hueco.html`
(2026-09-22). Cuatro marcos: el hueco con sus dos caras · la hoja «¿Qué
hiciste?» con la duración real · la validación que apaga Guardar · el hueco
encogido tras guardar. Sus cuatro notas de cierre son parte de la spec. Se abre
en `http://localhost:5173/docs/vida/assets/12-vida-hoy-registrar-en-hueco.html`.

**Lo que el usuario no sabía cuando lo pidió, y hay que decirlo antes de que
nadie construya de más:** la mitad de esto ya está en el repo.

- **Los huecos ya existen y ya se pulsan** — `VidaAgendaGap`
  (`src/features/vida/components/VidaAgendaGap/VidaAgendaGap.tsx`), con sus
  fichas de plantilla y su «+ otra cosa» (FEAT-003, criterios 19, 23 y 24). Pero
  **solo hacia delante**: `onPlaceSuggestion` / `onOpenSheet` **planean**.
- **Un hueco que ya pasó hoy no ofrece nada.** `VidaAgendaGap.tsx:79` — con
  `gap.isPast` (o `isSliver`) el componente se sale por arriba y pinta **una
  línea de texto sin un solo control**. Esta feature es **exactamente esa rama**.
- **La validación de que algo quepa ya existe** —
  `utils/vida-gap-form.utils.ts:201` `validatePlacement`, con su frase literal
  «Desde las HH:MM caben N. Elige menos tiempo o empieza antes.» (:220), sus
  píldoras que se apagan (`durationPillsForWindow`, :189) y **lo que queda
  alrededor** (`getPlacementLeftovers`, :234), que es la frase «Quedan 1 h 45
  libres en este hueco» del render ya calculada.
- **Que el hueco se encoja al guardar ya funciona.** `buildDayExecution`
  (`utils/vida-execution.utils.ts:713`) **parte el hueco** alrededor de cada
  sesión fuera del plan (`sliceGap`, :686, y el bucle de :758–768): registrar 15
  min dentro de un hueco de 2 h deja un hueco de 1 h 45 **sin escribir una línea
  nueva**. El marco 4 del render sale gratis.
- **La hoja de registro ya existe**, con las tres puertas de FEAT-004:
  `components/VidaLogSessionSheet/VidaLogSessionSheet.tsx` (`mode: 'start' |
  'log' | 'edit'`), y **ya admite hora y duración puestas desde fuera**
  (`initial?: { startTime, durationMinutes }`, :49) porque el «¿Qué pasó?» de
  FEAT-004 las pone. Hoy la abre `openLogSheet({ mode: 'log' })` desde
  `VidaHoyPage.tsx:893`.

**Entonces, ¿qué es nuevo de verdad?** Tres cosas, y solo tres:

1. **La oferta del hueco pasado** (la rama que hoy se sale por `isPast`) y el
   orden de la oferta en el hueco futuro.
2. **La ventana real.** Todo lo que sabe medir el repo mide **el plan**:
   `buildDayAgenda` (`vida-agenda.utils.ts:152`) recibe **solo `planItems`**, y
   `gapToWindow` (`vida-gap-form.utils.ts:50`) copia los bordes del hueco tal
   cual. Si «Desayunar» estaba de 9:00 a 9:30 y **acabó a las 9:28**, el hueco
   sigue empezando a las 9:30 y **nadie en el repo sabe que hay dos minutos
   más**; al revés, si acabó a las 9:40, el hueco dice 9:30 y **dejaría escribir
   encima de algo que existió**. Eso es lo delicado de la feature y lo que
   justifica al arquitecto.
3. **La duración por defecto**, que no es la del hueco ni la de la plantilla,
   sino **la que sueles tardar** (FEAT-007).

**La pregunta que contesto yo, porque era la más cara: ¿hoja nueva o la de
siempre?** **La de siempre.** Esto es `VidaLogSessionSheet` en `mode: 'log'`
**anclada a un hueco**, no una segunda hoja: el «qué» es el mismo
`VidaActivityPicker`, el «cuánto» son las mismas píldoras, el guardado es el
mismo `activityFollowUpAdd` y el criterio **38 de FEAT-004** («la hoja de "qué"
se escribe una vez, no hay dos buscadores de actividad») lo prohíbe
explícitamente. Lo que la hoja **gana** es un anclaje opcional: un hueco, que
cuando viene cambia el título a «¿Qué hiciste?», pone el subtítulo «Martes · en
el hueco de 9:30 a 11:30», arranca en el principio del hueco, **valida** y
**apaga Guardar**. Sin ese anclaje la hoja es **idéntica a la de hoy**: el
«Registrar tiempo pasado» de arriba (FEAT-004, criterio 56) **no cambia de
comportamiento**, sigue arrancando media hora antes de ahora y sin validar.
Consecuencia práctica: **casi todo está hecho**, y por eso esta feature son tres
tajadas cortas y no cinco.

**Out of scope:** (lo que alguien puede dar por incluido y NO lo está)

- **Planear en un hueco que ya pasó.** No se añade «Poner X aquí» hacia atrás, ni
  se toca `activityDayPlanItemAdd` desde un hueco pasado. El render lo dice: en
  el pasado solo se cuenta.
- **Tocar el plan de ninguna manera.** Registrar en el hueco **no crea, no mueve
  y no quita** un bloque (FEAT-004, criterio 37). Lo registrado entra **fuera del
  plan**, y eso es lo correcto, no una carencia.
- **Empezar algo desde el hueco.** «▶ Empezar» y «Empezar algo» son de FEAT-004 y
  de la tarjeta de FEAT-010. Aquí solo se registra tiempo que ya pasó.
- **Cambiar «Registrar tiempo pasado» de la cabecera.** Sigue donde está, con su
  hora de siempre. Esta feature **no lo sustituye ni lo mueve**; si el usuario
  acaba no usándolo, eso se decide viéndolo, no ahora.
- **Corregir o quitar lo que ya se registró desde el hueco.** Eso existe y vive
  donde ya vivía: `mode: 'edit'` sobre la tarjeta de la sesión (FEAT-004,
  criterio 35). El hueco no gana un tercer sitio para editar.
- **Crear una actividad que no está en el catálogo.** Como en FEAT-004 (criterio
  34): se elige del catálogo no archivado y, si no existe, se enlaza a
  `/app/vida/actividades`. **No se registra texto libre.**
- **Registrar varias cosas de una vez** («hice esto, luego esto»). Una por
  apertura; el hueco se encoge y se vuelve a pulsar, que es lo que dice el
  marco 4.
- **Mover la validación a la hoja de arriba, a la revisión o a la plantilla.** La
  ventana real es de este hueco y de esta hoja. FEAT-009 (huecos en la plantilla)
  **no la usa**: allí no hay nada real que medir.
- **Solapes con sesiones ya registradas del mismo tramo.** Lo que valida esta
  feature son **los bordes del hueco**; que dos sesiones registradas se pisen
  entre sí **ya se permite hoy** (FEAT-006 lo cuenta: minutos de sesión contra
  minutos de reloj) y esta feature **no lo prohíbe ni lo arregla**. Lo que sí
  hace es que dentro de **este** hueco no quepa algo que se sale de él.
- **Avisar al guardar.** No hay «lo guardamos y luego te decimos»: si no cabe, no
  se guarda. Y tampoco hay deshacer propio: se corrige donde se corrige.
- **Backend.** Ni un documento GraphQL nuevo, ni un campo, ni una mutación. Todo
  sale de `activityFollowUpAdd` y de lo que ya se consulta del día.
- **Una ruta, una pantalla o una píldora nuevas.** Todo cae dentro de
  `/app/vida/hoy`.
- **La tarjeta «Qué toca ahora».** Es de **FEAT-010**, incluida su cara «no toca
  nada» aunque **hable** del hueco actual. Ver «Frontera con FEAT-010».

**Acceptance criteria:** (la numeración del módulo sigue: FEAT-008 ocupa 107–134,
FEAT-009 140–171, FEAT-010 arranca en 180. **Esta feature empieza en el 220.**)

*El hueco que ya pasó ofrece contar (tajada 1)*

- [ ] 220. En Hoy, un hueco **que ya pasó** (`gap.isPast`) y que **no es sliver**
  deja de pintarse como una línea muerta: trae **una** salida, **«Registrar lo
  que hice»**, y ninguna de planear. Es la rama de `VidaAgendaGap.tsx:79`, que
  hoy se sale antes de pintar controles.
- [ ] 221. Un hueco **más corto que `MIN_GAP_MINUTES`** (15 min, `isSliver`)
  **sigue exactamente como hoy**: su línea con sus minutos y **sin salida**.
  Decidido así (ver D3); no se prohíbe registrar ahí —«Registrar tiempo pasado»
  de la cabecera sigue sirviendo—, simplemente no se ofrece en el renglón.
- [ ] 222. Pulsar «Registrar lo que hice» abre **`VidaLogSessionSheet` en
  `mode: 'log'`** —la misma de FEAT-004, no una segunda hoja— con el título
  **«¿Qué hiciste?»** y el subtítulo **«Martes · en el hueco de 9:30 a 11:30»**,
  con el nombre del día y las horas **del hueco pulsado**.
- [ ] 223. La hoja abre con el inicio puesto en **el principio del hueco** (9:30
  en el render), no en «media hora antes de ahora». Ese campo **se puede
  cambiar** y al cambiarlo se revalida.
- [ ] 224. La duración **se puede editar** y **no arranca en el hueco entero**:
  con un hueco de 2 h la hoja no propone 2 h. En la tajada 1 arranca en lo que
  dure la actividad elegida según la plantilla (lo que ya hace
  `chooseActivity`, `VidaLogSessionSheet.tsx:124`); en la tajada 3 pasa a ser
  **lo que sueles tardar** (criterio 238).
- [ ] 225. **Se valida por arriba y por abajo**, con las palabras que ya existen
  (`validatePlacement`): un inicio fuera del hueco y una duración que se pasa del
  final dicen, cada uno, **cuánto cabe y las dos salidas** («Desde las 10:45
  caben 45 min: a las 11:30 entra Daily meeting. Ponle menos tiempo o empieza
  antes.»). El aviso **nombra el bloque del otro lado** cuando hay uno.
- [ ] 226. **Guardar se apaga mientras no cabe** (`disabled` real, no un botón
  que falla al pulsarlo) y vuelve a encenderse al corregir. **Nunca se guarda
  algo imposible para avisar después.**
- [ ] 227. Mientras cabe, una línea dice **a la vez lo que ocupas y lo que
  queda**: «De 9:30 a **9:45**. Quedan **1 h 45** libres en este hueco.» Los dos
  números salen de lo mismo que ya calcula `getPlacementLeftovers`; si además
  sobra rato **antes** de lo que se pone, también se dice.
- [ ] 228. Las **píldoras de duración** del hueco ofrecen solo lo que cabe desde
  la hora elegida (`durationPillsForWindow`) y hay una **«Todo el hueco»** que
  pone la duración exacta que queda hasta el borde.
- [ ] 229. Guardar manda **`activityFollowUpAdd`** con la fecha del día mostrado,
  la hora elegida y los minutos elegidos, y **no manda ninguna mutación de
  `activityDayPlan`**. Lo registrado aparece en la agenda **en su hora** y
  marcado **«fuera del plan»**, con la palabra literal (FEAT-004, criterio 22).
- [ ] 230. Tras guardar, **el hueco se encoge y no desaparece**: un hueco de 9:30
  a 11:30 con 15 min registrados al principio queda como «Libre 9:45 → 11:30 ·
  1 h 45», **sigue ofreciendo «Registrar lo que hice»**, y se puede registrar
  otra cosa ahí. Dos registros seguidos en el mismo hueco dejan **dos** sesiones
  y el resto libre correcto (es `buildDayExecution` + `sliceGap`: verificar que
  se cumple, no reescribirlo).
- [ ] 231. Si la mutación **falla**, la hoja **no se cierra ni pierde lo
  elegido**, el fallo se lee dentro, y en la agenda **no queda una sesión
  fantasma** ni un hueco encogido de mentira.
- [ ] 232. Registrar en el hueco **funciona igual en un día pasado** de la tira
  (FEAT-004, D10 y criterios 32 y 46): allí **todos** los huecos son pasados y
  todos ofrecen contar, y **no aparece ni un control de plan**. En un **día
  futuro** no se ofrece nada: no hay pasado que contar.

*La ventana real: contra lo vivido, no contra lo planeado (tajada 2)*

- [ ] 233. Los bordes contra los que se valida son **los reales**: si el bloque
  de antes estaba planeado hasta las 9:30 pero su sesión **acabó a las 9:28**, se
  puede empezar a las 9:28; si **acabó a las 9:40**, empezar a las 9:35 **no
  cabe** y el aviso lo dice nombrando ese bloque. Igual por el otro lado con el
  bloque que cierra el hueco. Es aritmética nueva: hoy `gapToWindow`
  (`vida-gap-form.utils.ts:50`) copia los bordes **del plan**.
- [ ] 234. **Lo que ve el usuario del hueco y lo que valida la hoja dicen lo
  mismo.** No puede ocurrir que el renglón diga «Libre 9:30 → 11:30» y la hoja
  acepte desde las 9:28 sin explicarlo: o el renglón lleva los bordes reales, o
  la hoja dice por qué se mueve. Un criterio, una sola verdad en pantalla.
- [ ] 235. **La sesión abierta es un vecino más.** Registrar algo pasado con un
  cronómetro corriendo **no la cierra, no la acorta y no la toca** —D4 de
  FEAT-004 (cerrar la anterior) es de **empezar**, no de registrar—, y si el
  tramo elegido **se pisa con lo que la sesión abierta lleva ocupado**, no cabe y
  se dice con su nombre. Comprobado con espías: **cero**
  `activityFollowUpEdit` y **cero** `activityFollowUpRemove` sobre la sesión
  abierta al registrar en un hueco.
- [ ] 236. **El camino de planear no cambia de comportamiento.** `VidaPlaceInGapSheet`
  y las fichas del hueco futuro siguen validando contra el **plan**, con los
  mismos mensajes y los mismos límites que hoy: los tests de FEAT-003 sobre
  `vida-gap-form.utils` **no cambian de resultado** (si alguno se toca, se dice
  cuál y por qué).
- [ ] 237. La ventana real es **una función pura con su test**, con casos de:
  vecino que acabó antes, vecino que acabó después, vecino sin sesión (manda el
  plan), hueco que cierra el fin del día (sin vecino), y sesión abierta dentro
  del hueco.

*La otra cara del hueco y la duración de siempre (tajada 3)*

- [ ] 238. La duración por defecto de lo que se registra es **la que sueles
  tardar en esa actividad** (FEAT-007: `usualDurationsByItemId`, consumida hoy
  por `suggestionsForGap` vía `usualDurations`). **Aviso para quien construya:
  ese mapa va por id de ítem de plantilla, no por actividad** (`vida-agenda.utils.ts:530`),
  así que hay que resolver el salto actividad → ítem de ese día.
- [ ] 239. **Cuando no hay ese dato** —menos de cuatro apariciones, o una
  actividad que no está en la plantilla de ese día— **no se inventa**: se cae, en
  este orden, a **la duración de la plantilla** si la hay y, si tampoco, a
  **`DEFAULT_BLOCK_MINUTES`**, recortada siempre a lo que quepa en el hueco.
  Nunca al hueco entero.
- [ ] 240. **La duración propuesta no se presenta como un dato que no es.** Solo
  se dice «sueles tardar N» cuando **viene de verdad** de la costumbre (la misma
  regla del criterio 92 de FEAT-007: sin datos, ni etiqueta ni hueco reservado).
- [ ] 241. Un hueco **por delante de ahora** mantiene **«Poner algo» como oferta
  principal** —las fichas de plantilla y «+ otra cosa» de FEAT-003, sin cambios—
  y gana **«Registrar»** como **segunda** salida, con menos peso visual. El hueco
  que **contiene** a «ahora» ya lo parte `buildDayAgenda`, así que cada mitad
  ofrece lo suyo sin ningún cálculo nuevo.
- [ ] 242. En la mitad de delante, la hoja abierta desde «Registrar» **no
  propone registrar el futuro**: la duración que ofrece no pasa de «ahora», y el
  inicio tampoco.

*Los estados que nadie pide y siempre hacen falta*

- [ ] 243. **Cargando:** mientras el plan o lo vivido del día están en vuelo, el
  hueco **no afirma su tamaño ni ofrece registrar** (registrar contra una ventana
  a medio cargar es escribir a ciegas). Esqueleto, como en Hoy.
- [ ] 244. **Si falla lo vivido** (`activityDayFollowUps`) y el plan sí carga: se
  dice que falta lo vivido (FEAT-004, criterio 58) y **la salida del hueco no se
  ofrece**, porque la ventana real no se puede conocer. No se ofrece contra el
  plan a escondidas.
- [ ] 245. **Día sin plan:** sin bloques hay **un** hueco grande; el que ya pasó
  ofrece registrar igual, y el texto de «aún no hay plan» **no se lee como
  reproche** (FEAT-004, criterio 53).
- [ ] 246. **Ni una palabra de reproche**, y se comprueba sobre el texto de la
  pantalla: el tiempo del hueco **no** se llama «perdido», «desperdiciado»,
  «vacío» ni «en blanco»; **no se pregunta por qué no hiciste nada**; no hay
  cifra de cuánto hueco llevas sin contar. «Libre» y «sin dato» siguen siendo las
  palabras (FEAT-004, criterios 47 y 59).
- [ ] 247. **Texto largo:** un nombre de actividad de ~60 caracteres y un nombre
  de bloque vecino de ~60 caracteres **no rompen** ni el renglón del hueco, ni el
  subtítulo de la hoja, ni el aviso de validación, y no producen scroll
  horizontal.
- [ ] 248. **Móvil a 375 px:** `scrollWidth === clientWidth === 375` con la hoja
  abierta y el aviso puesto; la salida del hueco cabe en el renglón sin
  desbordar; y **el aviso de validación se lee sin tapar los campos** —va debajo
  del campo del que habla y **Guardar apagado sigue a la vista** sin scroll, o si
  hay scroll, el aviso y el campo se ven a la vez—.
- [ ] 249. **Tema oscuro:** el hueco pasado (gris) y el futuro (verde) se
  distinguen entre sí y del fondo, y el aviso de validación se lee.
- [ ] 250. **Línea base no empeorada** (`docs/features/ENVIRONMENT.md`):
  `pnpm typecheck` limpio, `pnpm lint` no peor, `pnpm test` sin fallos nuevos
  sobre los preexistentes, y se cierra con `pnpm build`.
- [ ] 251. **Solo lo cierra el usuario, con la API despierta:** reconstruir **una
  mañana a trozos** —registrar 15 min al principio de un hueco de 2 h, ver el
  hueco encogido, registrar otra cosa dentro de lo que queda, intentar una
  tercera que no cabe y ver Guardar apagado—, y comprobar que lo registrado sale
  «fuera del plan» y que **la revisión del día lo cuenta**.

**Slices:** (vertical, cada una usable sola)

| # | What it does | State |
|---|---|---|
| 1 | **El hueco pasado se pulsa y cuentas qué hiciste, validado contra el hueco.** La rama `isPast` de `VidaAgendaGap` estrena «Registrar lo que hice»; abre `VidaLogSessionSheet` en `mode: 'log'` anclada al hueco (título «¿Qué hiciste?», inicio en el principio del hueco, duración editable), con `validatePlacement` + `durationPillsForWindow` + `getPlacementLeftovers` **tal como están**, Guardar apagado cuando no cabe, y el hueco encogiéndose al guardar (ya lo hace `buildDayExecution`). Criterios 220–232. **Ya es útil sola:** una mañana entera se reconstruye a trozos desde donde se ve. | pending |
| 2 | **La ventana real.** Los bordes dejan de ser los del plan y pasan a ser los de lo vivido: «Desayunar acabó a las 9:28» mueve el límite a las 9:28, y un vecino que se alargó lo mueve al revés; la sesión abierta cuenta como vecino y **no se toca**. Función pura con su test, y el camino de **planear** sin cambiar de comportamiento. Criterios 233–237. | pending |
| 3 | **La otra cara del hueco y la duración de siempre.** El hueco de delante gana «Registrar» como segunda salida (con «Poner algo» mandando), y la duración por defecto pasa a ser la que sueles tardar, con su caída ordenada cuando no hay dato. Criterios 238–242. | pending |

**Por qué este orden:** la 1 es la mitad del render y **no necesita aritmética
nueva** —todo lo que valida y todo lo que encoge el hueco ya está escrito—, así
que entrega valor con el riesgo más bajo. La 2 es corrección, no alcance:
mejora lo que la 1 ya hace y es donde está el único trozo delicado, así que va
sola y con test propio. La 3 es alcance y pulido, y es la única que **cruza con
FEAT-007** y con FEAT-010; si algo hay que recortar por tiempo, se recorta de
aquí sin que lo entregado deje de ser cierto.

**Architect? yes** porque **la ventana real es un concepto que no existe**: todo
lo que hoy mide huecos mide el plan (`buildDayAgenda` recibe solo `planItems`,
`vida-agenda.utils.ts:152`; `gapToWindow` copia esos bordes,
`vida-gap-form.utils.ts:50`) y hacer que **la misma** utilidad valide a veces
contra el plan y a veces contra lo real toca un archivo que **comparte con el
camino de planear** de FEAT-003. Dónde vive ese cálculo —un tercer `utils`, un
campo más en `AgendaGap`, o un `GapWindow` que se construye en `vida-execution`
y se le pasa a la hoja— se decide **una vez**, no a mitad de tajada, y de esa
decisión depende que el criterio 236 (planear no cambia) siga siendo cierto.

**Lo demás cuelga de cosas que ya existen, con su ruta** (para que nadie escriba
dos veces lo que está escrito):

- `src/features/vida/components/VidaAgendaGap/VidaAgendaGap.tsx` — **la rama de
  la línea 79** (`gap.isSliver || gap.isPast`) es el sitio exacto de la feature.
- `src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx` —
  `mode: 'log'`, `initial: { startTime, durationMinutes }` (:49), el guardado por
  `useCreateActivityFollowUpMutation` (:100) y el cierre en el `onSuccess`
  local (**no se escribe una segunda hoja**).
- `src/features/vida/components/VidaActivityPicker/` — el «qué». No hay un
  segundo buscador (FEAT-004, criterio 38).
- `src/features/vida/utils/vida-gap-form.utils.ts` — `gapToWindow` (:50),
  `durationPillsForWindow` (:189), `validatePlacement` (:201),
  `getPlacementLeftovers` (:234) y sus frases.
- `src/features/vida/utils/vida-execution.utils.ts` — `buildDayExecution` (:713)
  y `sliceGap` (:686): **el hueco ya se encoge**, no se construye otra vez.
- `src/features/vida/pages/VidaHoyPage.tsx` — `openLogSheet` (:402), el montaje
  de la hoja (:931) y `onPlaceSuggestion` (:756).
- `src/features/vida/components/VidaDurationPills/` — las píldoras. **Aviso: las
  está tocando FEAT-008 ahora mismo** (ver «Con qué otras features choca»).
- `src/features/vida/utils/vida-patterns.utils.ts` — `usualDurationsByItemId`,
  ya consumida por `suggestionsForGap` (`vida-agenda.utils.ts:494, 530, 544`).

**Frontera con FEAT-010 («Qué toca ahora»), que se analiza en paralelo:**

- **FEAT-010 es dueña de la tarjeta de arriba**, con el play y sus cuatro caras.
  **FEAT-011 es dueña de las filas de hueco de la lista.** Ningún componente se
  comparte: la tarjeta no pinta un `VidaAgendaGap` y el hueco no pinta un play.
- La cara **«no toca nada»** de FEAT-010 **habla** del hueco actual («tienes
  libre hasta las 11:30») pero **no lo pinta y no ofrece registrar en él**: si
  alguna vez ofrece algo, será **la misma acción** que abre este hueco, no una
  segunda.
- **Ninguna depende de la otra para construirse** y **pueden ir en cualquier
  orden**; lo que sí comparten es **la pantalla y el eje vertical**, así que
  quien vaya segunda comprueba los 375 px **con las dos puestas** (la tarjeta
  arriba no puede dejar el primer hueco fuera de vista).
- **Una sola regla común, y es de las dos:** lo que la tarjeta diga del rato
  libre y lo que diga el renglón del hueco **tienen que ser el mismo número**. Si
  la tajada 2 de aquí mueve los bordes a lo real, FEAT-010 lee **los mismos
  bordes**, no los suyos.

**Con qué otras features choca (y el orden que eso impone):**

- **FEAT-008 (horas y minutos) está `building` y toca `VidaDurationPills`,
  `vida-time.utils` y `VidaActivitySheet` ahora mismo.** El marco 2 del render
  dibuja la duración **en dos cajas, «0 horas» y «15 min»**, que es justo lo que
  entrega FEAT-008. **Esta feature se construye después de FEAT-008**, o su
  tajada 1 se hará con el campo viejo y habrá que volver.
- **FEAT-007** pone la duración habitual (tajada 3, criterios 238–240).
- **FEAT-009** (huecos en la plantilla) **no se toca**: allí no hay nada real que
  medir, y la ventana real **no baja a la plantilla**.
- **FEAT-004**: esta feature **usa** sus criterios 22 (fuera del plan), 31 y 38
  (la hoja), 32 y 46 (registrar en días pasados), 37 (no tocar el plan), 47 y 59
  (las palabras). **No deroga ninguno.** Los dos que quedan cerca y **no se
  rompen**: el **56** —«Registrar tiempo pasado» de la cabecera sigue igual,
  abriendo media hora antes de ahora y sin ventana— y el **48** —el «¿Qué pasó?»
  de un tramo sin dato sigue existiendo con sus dos salidas; **son dos puertas a
  la misma hoja**, no dos hojas, y si al usarlo resulta que sobra una, eso se
  decide viéndolo, no aquí—.

**Decisions that aren't mine:** *(ninguna bloquea; las cuatro van decididas por
mí con su razón y todas se cambian en una línea si el usuario prefiere lo
contrario)*

- **D1 — ¿Hoja nueva o la de siempre? — la decido yo: la de siempre.**
  `VidaLogSessionSheet` en `mode: 'log'` con un anclaje opcional al hueco. La
  alternativa (una hoja propia de «registrar en el hueco») daría más libertad de
  diseño y **rompería el criterio 38 de FEAT-004**, duplicaría el buscador y
  dejaría dos sitios donde arreglar el mismo fallo. Consecuencia aceptada: la
  hoja crece en condicionales, y por eso el criterio 222 exige que **sin anclaje
  se comporte exactamente como hoy**.
- **D2 — ¿Del catálogo o texto libre? — la decido yo: solo del catálogo**, como
  FEAT-004 (criterio 34), con la vía a `/app/vida/actividades` si no existe. Texto
  libre daría una actividad que no se puede contar en ninguna cifra del módulo
  —ni adherencia, ni patrones, ni reparto por categoría—, es decir, un dato que
  se ve y no sirve. **Del usuario si quiere lo contrario**, pero entonces hace
  falta decidir dónde vive ese nombre, y eso es otra feature.
- **D3 — ¿Un hueco de menos de 15 min se puede registrar? — la decido yo: no se
  ofrece ahí, y no se prohíbe.** El renglón sliver sigue como hoy (criterio 221);
  quien quiera contar esos 10 minutos tiene «Registrar tiempo pasado». Razón: el
  sliver existe **para que cuadre la leyenda** (FEAT-003, criterio 14), no como
  sitio; y ofrecer una salida en cada raja de 5 minutos llena la agenda de
  botones que nadie pulsa. **Es una línea cambiarlo.**
- **D4 — ¿Y si hay una sesión corriendo? — la decido yo: no se toca.** Registrar
  pasado **no cierra** la sesión abierta (criterio 235): cerrarla es lo que hace
  **empezar** algo (FEAT-004, D4), y aquí no se empieza nada. Lo que sí hace es
  **contar como vecino**: lo que el cronómetro lleva ocupado no se puede pisar.
- **D5 — ¿Días pasados? — resuelta por lo ya decidido: sí**, cualquier día de la
  tira, por D10 de FEAT-004. No hace falta preguntar de nuevo: registrar en el
  pasado ya está permitido y **esto es el mismo registro desde otro botón**.

**Hipótesis marcadas (técnicas, del arquitecto, no del usuario):**

- Los bordes reales salen de lo que **ya se consulta** del día
  (`activityDayFollowUps`), sin una consulta nueva: el vecino de antes es el
  `span` real del bloque anterior si lo tiene, y si no, su hora planeada.
- Un bloque **«movido»** (FEAT-004, criterio 23) deja sombra en su hora y su
  sesión donde ocurrió: para la ventana real manda **dónde ocurrió**, no la
  sombra.
- «Todo el hueco» (criterio 228) es una píldora más de la fila, no un control
  aparte.
- El salto **actividad → ítem de plantilla** para la duración habitual
  (criterio 238) probablemente ya lo resuelve el mismo mapa de sugerencias del
  día; si no, es una búsqueda por `activityId` sobre la plantilla de ese día.

## 2. The plan — feature-architect

*(pendiente)*

## 3. Construction — feature-builder

*(pendiente)*

## 4. Review — feature-reviewer

*(pendiente)*
