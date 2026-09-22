---
id: FEAT-011
title: Registrar en el hueco — el rato libre que ya pasó se pulsa y cuentas qué hiciste
status: building
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
| 2 | **La ventana real.** Los bordes dejan de ser los del plan y pasan a ser los de lo vivido: «Desayunar acabó a las 9:28» mueve el límite a las 9:28, y un vecino que se alargó lo mueve al revés; la sesión abierta cuenta como vecino y **no se toca**. Función pura con su test, y el camino de **planear** sin cambiar de comportamiento. Criterios 233–237. | aceptada |
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

**Summary for the builder:** el molde es **`VidaPlaceInGapSheet.tsx`** (ya recibe
un `gapWindow: GapWindow` y hace exactamente validar → apagar Guardar → decir lo
que queda); la hoja de registro **gana la misma prop** y el renglón del hueco
gana **una salida** copiada de `VidaTemplateGapRow` (FEAT-009). La **ventana
real** es un archivo nuevo y pequeño, `utils/vida-gap-window.utils.ts`, que
`buildDayExecution` rellena **dentro del bucle que ya parte los huecos**:
`vida-gap-form.utils.ts` **no se toca ni una línea**, y por eso el criterio 236
es verdadero por construcción. **No escribas**: validación, píldoras, encogido
del hueco, buscador de actividad ni mutación — las cinco están hechas.

### Lo que ya existe (y no se vuelve a escribir)

| Lo que hace falta | Dónde está ya | Estado |
|---|---|---|
| Validar hora+duración contra una ventana | `utils/vida-gap-form.utils.ts:201` `validatePlacement` | **Vivo**, lo usa `VidaPlaceInGapSheet.tsx:122` y `:141` |
| Apagar Guardar de verdad | `VidaPlaceInGapSheet.tsx:123` (`canSubmit`) y `:165` (`disabled`) | **Vivo** |
| «Quedan 1 h 45 libres…» | `vida-gap-form.utils.ts:251` `describeLeftovers` (usa `getPlacementLeftovers`, :234) | **Vivo**, `VidaPlaceInGapSheet.tsx:292` |
| Apagar las píldoras que no caben | prop `maxMinutes` de `VidaDurationPills.tsx:47`, alimentada por `getMaxDurationForStartTime` (`vida-gap-form.utils.ts:116`) | **Vivo**, `VidaPlaceInGapSheet.tsx:116` |
| El subtítulo «…hasta las 11:30 «Daily meeting»» | `vida-gap-form.utils.ts:275` `describeWindow` | **Vivo**, `VidaPlaceInGapSheet.tsx:181` |
| La hoja con «qué · desde cuándo · cuánto» y su `activityFollowUpAdd` | `components/VidaLogSessionSheet/VidaLogSessionSheet.tsx` (`mode: 'log'`), `initial` en `:50`, `logSessionInput` en `:177` | **Vivo**, y ya la abren tres sitios (`VidaHoyPage.tsx:493`, `:504`, `:893`) |
| Que el hueco se encoja al guardar | `utils/vida-execution.utils.ts:686` `sliceGap` + bucle `:758-768` | **Vivo. Solo hay que verificarlo** (criterio 230) |
| El renglón del hueco | `components/VidaAgendaGap/VidaAgendaGap.tsx`, rama muerta en **`:79`** | **Vivo**; la rama `isPast` no pinta ni un control |
| Un renglón de hueco **pulsable** de 44 px | `components/VidaTemplateGapRow/VidaTemplateGapRow.tsx:106-125` + `.module.scss:41-58` | **Vivo** (FEAT-009). **Es el molde del renglón** |
| La duración habitual | `utils/vida-patterns.utils.ts:970` `usualDurationsByItemId`, ya cableada en `VidaHoyPage.tsx:319-321` | **Viva, pero por `itemId`** (ver «el salto») |

**Dos avisos de lo que encontré por el camino:**

1. **`durationPillsForWindow` (`vida-gap-form.utils.ts:189`) no la usa nadie en
   producción** — solo su test (`vida-gap-form.utils.test.ts:94-105`). El camino
   vivo para «solo lo que cabe» es la prop `maxMinutes` de `VidaDurationPills`.
   Son **dos formas de decir lo mismo** y ya están las dos escritas: el criterio
   228 la nombra, pero **usa `maxMinutes`**, que es lo que hace el molde, y deja
   `durationPillsForWindow` donde está. No cablees las dos.
2. **El nombre `vida-window.utils.ts` YA ESTÁ COGIDO** y no tiene nada que ver:
   es la ventana de **calendario** (qué días se pueden mirar y planear,
   `getPlanningWindow`, `buildDayStrip`). Por eso el archivo nuevo se llama
   **`vida-gap-window.utils.ts`**. Confundirlos es el error barato de esta
   feature.

### Reference implementation

**`src/features/vida/components/VidaPlaceInGapSheet/VidaPlaceInGapSheet.tsx`.**
No porque esté mejor escrita, sino porque es **la misma figura**: una hoja
`SteppedModal ds="aura" mobileSheet` que recibe una ventana, preselecciona la
duración recortada a lo que cabe, valida en cada render, apaga el botón y pinta
la frase de lo que queda. Las seis líneas que hay que copiar, en orden:

- `:104-109` — el `startTime` arranca en `minutesToTime(gapWindow.startMinutes)`.
- `:116` — `const maxMinutes = getMaxDurationForStartTime(startTime, gapWindow)`.
- `:122-123` — `validation` + `canSubmit`.
- `:124-133` — `chooseActivity`: la duración de la plantilla **solo** se
  preselecciona si `templateMinutes <= maxMinutes` («sería una píldora encendida
  y apagada a la vez»). Es el molde literal del criterio 239.
- `:158-168` — el footer con `disabled={!canSubmit}`.
- `:286-300` — la frase de lo que queda y el `role="alert"` del aviso.
- `:322` — `preselectedDuration(...)`: el helper que recorta la duración
  propuesta a la ventana. **Es el que hay que imitar en la tajada 3.**

Para **el renglón**, el molde es `VidaTemplateGapRow.tsx:106-125`: la fila es un
`<button>` de verdad solo cuando llega la prop de acción, con `aria-label` que
dice **qué** se hace y **a qué hora**, y sin prop se queda en `<p>`. Y su
`.module.scss:41-58` fija **`min-height: 2.75rem` (44 px)** con la razón
escrita: **aplica el mismo número aquí**, no el `2rem` del `.chip` de
`VidaAgendaGap.module.scss:95`.

### La ventana real: dónde vive y por qué ahí

**La decisión que desbloquea todo:** `GapWindow`
(`vida-gap-form.utils.ts:43-48`) **es un tipo estructural suelto** — ninguna de
las funciones de validación conoce `AgendaGap`, todas reciben un `GapWindow`.
`gapToWindow` (:50) es **un constructor entre varios**, no el único camino:
`getBlockEditWindow` (:74) ya construye una ventana distinta para editar un
bloque. Entonces **la ventana real es un tercer constructor**, no una
modificación de los dos que hay.

Consecuencia directa: **`vida-gap-form.utils.ts` no se modifica**, y con él no
se mueven `VidaPlaceInGapSheet`, las fichas del hueco futuro ni los tests de
FEAT-003. **El criterio 236 se cumple porque no hay nada que pueda romperlo**,
no porque se compruebe después.

**Archivo nuevo:** `src/features/vida/utils/vida-gap-window.utils.ts`
(+ `vida-gap-window.utils.test.ts`, criterio 237). Contenido, exacto:

```
export type RealGapWindow = GapWindow & {
  previousBlockTitle: string | null   // GapWindow solo nombra al de después
  startedEarly / endedLate …          // qué borde se movió y cuánto
}
export type GapNeighbour = {
  title: string | null
  plannedMinutes: number        // fin del de antes / inicio del de después
  realMinutes: number | null    // fin/inicio de SU sesión; null si no tuvo
  isRunning: boolean
}
buildGapRealWindow({ gap, before, after, nowMinutes, clampToNow })  → RealGapWindow
describeGapWindowShift(space)            → string | null   // criterio 234
describePlacementBlocker(input, space)   → string | null   // criterios 225 y 233
```

Tres cosas que no son negociables en ese archivo:

1. **No importa nada de `vida-execution.utils.ts`, ni siquiera tipos.**
   Los vecinos entran como `GapNeighbour`, que es forma plana. Así no hay ciclo
   (execution → gap-window → execution) y el test son cinco objetos literales.
2. **`RealGapWindow` extiende `GapWindow`**, así que es asignable a todo lo que
   ya existe: `validatePlacement`, `describeLeftovers`, `describeWindow` y
   `maxMinutes` lo tragan **sin tocarlos**.
3. **`describePlacementBlocker` envuelve, no sustituye.** Llama a
   `validatePlacement(...)` y **añade** la cláusula que nombra al vecino («…a las
   11:30 entra Daily meeting», «…Desayunar acabó a las 9:40»). Meter esa cláusula
   *dentro* de `validatePlacement` cambiaría el texto del camino de planear y
   rompería el criterio 236: **no se hace**.

**Quién lo llama:** `buildDayExecution` (`vida-execution.utils.ts:713`), **dentro
del bucle que ya parte los huecos** (`:757-769`), reutilizando el `cursor` y
`spanByBlockId` que ya tiene ahí. Es literalmente lo que hizo FEAT-009 al emitir
sus filas dentro del bucle que ya existía. Sale un campo nuevo en `DayExecution`
(`:648-672`, y el `return` de `:790`):

```
/** La ventana **real** de cada hueco, por el id del hueco ya partido. */
realWindowByGapId: Record<string, RealGapWindow>
```

**Ojo con la clave:** `sliceGap` reescribe el `id` (`gap-HH:mm-HH:mm`, `:688`).
La entrada del mapa se pone **junto a cada `entries.push()` de hueco**, con el id
del trozo que se acaba de empujar; si no, los trozos de un hueco con sesiones
dentro se quedan sin ventana. Y el vecino de la izquierda de un trozo de cola
**es una sesión ya registrada**, cuyo borde real es exacto: eso sale gratis y es
justo lo que pide el criterio 235 (la sesión abierta es un vecino más; se lee,
no se toca).

**Qué NO se hace, y por qué se midió:**

- **No se mueven `gap.startMinutes` / `gap.endMinutes`.** Tentador y caro: el
  presupuesto y la leyenda (`getExecutedBudget`, `:505`; `getDayBudget`,
  `vida-agenda.utils.ts:304`) reparten el día y los anchos de la barra desde la
  agenda, y dos minutos movidos en un hueco descuadran el criterio 14 de
  FEAT-003. La ventana **acompaña** al hueco; no lo redefine.
- **No se toca `buildDayAgenda` ni su firma.** Recibe solo `planItems` **a
  propósito**: es el mismo constructor que usa la plantilla, donde no hay nada
  real que medir (criterio 135). Meterle sesiones lo convertiría en dos
  funciones con un `if`.
- **No se añade un campo a `AgendaGap`.** Tendría que viajar `null` por toda la
  plantilla y por el camino de planear, y el `?? plan` acabaría escrito en cinco
  sitios.
- **Criterio 234, resuelto así:** el renglón **sigue diciendo las horas del
  plan** (para que la leyenda cuadre) y **la hoja dice por qué se mueve**, con
  `describeGapWindowShift` debajo del subtítulo: «Desayunar acabó a las 9:28, así
  que aquí empieza antes». El criterio ofrece las dos salidas y ésta es la que no
  toca la barra. Si el usuario prefiere lo contrario, es **un sitio**: las dos
  caras leen el mismo `realWindowByGapId`.

### El salto de la duración habitual (criterio 238)

**No hace falta buscar en la plantilla.** `VidaActivityPattern` ya lleva
`itemId` **y `activityId`** juntos (`vida-patterns.utils.ts:274-275`, rellenos en
`:726-727`), y `VidaHoyPage.tsx:306-321` ya tiene `patterns.patterns` a mano. El
salto es **un hermano** de `usualDurationsByItemId`, en el mismo archivo y justo
debajo (`vida-patterns.utils.ts:970-981`):

```
/** La misma costumbre, pero por **actividad** (FEAT-011, criterio 238). */
export function usualDurationsByActivityId(
  patterns: Pick<VidaActivityPattern, 'activityId' | 'usualDurationMinutes' | 'usualDurationSamples'>[],
): Record<string, number>
```

Con la actividad en dos ítems de plantilla, gana **la de más
`usualDurationSamples`** (el campo ya existe, `:302`), y con empate, la primera:
la alternativa —mezclar dos medianas— inventaría un número que no midió nadie.
`usualDurationsByItemId` **no se toca**: las fichas del hueco futuro siguen
exactamente igual y el criterio 92 de FEAT-007 sigue siendo verdadero por el
mismo `= {}` de siempre. El criterio 240 sale solo: si la clave no está, no hay
etiqueta.

### Convivencia con lo que está en vuelo

- **FEAT-008 (tajadas 2 y 3, sin commitear).** Todo lo que mete en la hoja es
  **aditivo y ortogonal** a esto: dos props en `<VidaDurationPills>`
  (`freeInput`, `describedById`) y un `<VidaEndTimeLine>` debajo, en la misma
  `<section>` de «Cuánto duró». Tu precarga **no choca**: entra por
  `initial.durationMinutes` (estado inicial, `VidaLogSessionSheet.tsx:118-120`) y
  tu única añadidura ahí es `maxMinutes={…}` en ese mismo `<VidaDurationPills>`.
  **Las tres props conviven en el mismo tag.** El `<VidaEndTimeLine>` ya dice la
  hora de fin, así que la frase del criterio 227 **no la repite**: di solo lo que
  queda («Quedan 1 h 45 libres en este hueco»), que es `describeLeftovers`.
  **Números de línea:** los de este plan son los de `main`; con FEAT-008 dentro,
  todo lo posterior a la línea 5 de la hoja se corre **+1**, y lo posterior a
  `:327`, **+11**.
- **FEAT-013 tajada 1 (`7cbf7c2`, ya en `main`).** Metió `startTimeTouched` y
  `displayedStartTime` (`:214-221`) **solo para `mode === 'start'`**: en `'log'`
  el campo es el de siempre y `displayedStartTime === startTime`. Tu revalidación
  cuelga del `onChange` que ya está en `:302-306`; no añadas un segundo estado de
  «tocado».
- **FEAT-014 / «lo que viene» (render a medias, `14-vida-lo-que-viene.html`).**
  La salida del hueco es **una prop del renglón** (`onLogPast`), no un ítem de la
  lista de fichas: se pinta en su propio nodo, hermano de `<ul className={styles.chips}>`.
  Si mañana las fichas de sugerencia del hueco futuro desaparecen, **esta feature
  no se entera**. No cuelgues nada de `suggestions.visible`.

### Dónde va el código nuevo, archivo por archivo

**Se crean (2 archivos + 1 test):**

- `src/features/vida/utils/vida-gap-window.utils.ts` — la ventana real (tajada 2).
- `src/features/vida/utils/vida-gap-window.utils.test.ts` — los cinco casos del
  criterio 237.
- *(nada más. No hay componente nuevo, ni hoja nueva, ni ruta, ni hook.)*

**Se modifican, con su línea (numeración de `main`):**

| Archivo | Línea | Qué |
|---|---|---|
| `components/VidaAgendaGap/VidaAgendaGap.tsx` | `:17-42` | dos props: `onLogPast?: (gap: AgendaGap) => void` y, en la tajada 3, nada más (la misma prop sirve en las dos caras) |
| ” | **`:79-92`** | la rama muerta se parte en dos: `isSliver` → **exactamente como hoy** (criterio 221); `isPast && onLogPast` → caja con «Libre 9:30 → 11:30 · 2 h» y **un** `<button>` «Registrar lo que hice». Sin `onLogPast`, igual que hoy |
| ” | `:108-232` (tajada 3) | el mismo botón, **después** de las fichas y con menos peso (criterio 241) |
| `components/VidaAgendaGap/VidaAgendaGap.module.scss` | tras `:95` | `.logButton`, copiado de `VidaTemplateGapRow.module.scss:41-58`, **`min-height: 2.75rem`** |
| `components/VidaLogSessionSheet/VidaLogSessionSheet.tsx` | `:50` | prop nueva `gapWindow?: GapWindow \| null` |
| ” | `:133-141` | `chooseActivity`: recortar `templateMinutes` a `maxMinutes` (molde `VidaPlaceInGapSheet.tsx:124-133`) |
| ” | tras `:128` | `const maxMinutes`, `const validation`, `const canSubmit` (molde `:116-123`) |
| ” | `:222-234` | con `gapWindow` y `mode === 'log'`: título **«¿Qué hiciste?»** y descripción **«Martes · en el hueco de 9:30 a 11:30»** (+ `describeGapWindowShift` en la tajada 2). Sin `gapWindow`, **las de hoy sin tocar** (criterio 222 y FEAT-004/56) |
| ” | `:246` | `disabled={… \|\| (gapWindow ? !validation.valid : false)}` (criterio 226) |
| ” | `:327` | `maxMinutes={gapWindow ? maxMinutes : undefined}` en `<VidaDurationPills>` (criterio 228) |
| ” | `:371-381` | la línea de lo que queda: `describeLeftovers(...)` cuando hay `gapWindow` (criterio 227) |
| ” | `:171-186` | `handleLog`: antes de `validateLogPast`, si hay `gapWindow`, `describePlacementBlocker` → `setFormError` y salir. **La mutación no cambia** (criterio 229) |
| `components/VidaDurationPills/VidaDurationPills.tsx` | `:35-56` + la fila | prop aditiva `fillMinutes?: number \| null` → la píldora **«Todo el hueco»** (criterio 228), apagada por defecto, con la misma disciplina que `freeInput` (`:48-55`). **Cuidado: FEAT-008 tiene este archivo abierto** |
| `pages/VidaHoyPage.tsx` | `:1005-1011` | `LogSheetState`: campo opcional `gapWindow?: GapWindow` en la variante `'start' \| 'log'` |
| ” | tras `:504` | `logInGap(gap)`: `openLogSheet({ mode: 'log', gapWindow: …, initial: { startTime: minutesToTime(window.startMinutes), durationMinutes: … } })` — gemelo de `askAboutNoData` |
| ” | `:736-763` | `onLogPast={canLogPast && executionKnown ? logInGap : undefined}` en `<VidaAgendaGap>` (cierra 232, 243 y 244 de una vez) |
| ” | `:931-950` | pasar `gapWindow={logSheet.mode !== 'edit' ? (logSheet.gapWindow ?? null) : null}` |
| ” | `:319-321` (tajada 3) | `usualDurationsByActivityId(patterns.patterns)` en un `useMemo` hermano |
| `utils/vida-execution.utils.ts` | `:648-672` y el `return` de `:790` | campo `realWindowByGapId` en `DayExecution` |
| ” | **`:757-769`** | rellenar el mapa **dentro del bucle**, junto a cada `entries.push()` de hueco |
| `utils/vida-patterns.utils.ts` | tras `:981` | `usualDurationsByActivityId` (tajada 3) |
| `utils/vida-patterns.utils.test.ts` | — | sus casos (tajada 3) |
| `pages/VidaHoyPage.test.tsx` | — | el recorrido de pantalla, como hizo FEAT-009 en `VidaPlantillaPage.test.tsx` |
| `components/VidaLogSessionSheet/VidaLogSessionSheet.test.tsx` | — | anclada al hueco: Guardar apagado, píldoras recortadas, título |
| `utils/vida-execution.utils.test.ts` | — | criterio 230 (dos registros seguidos en el mismo hueco) y el mapa |

**Ni una línea en:** `utils/vida-gap-form.utils.ts`, `utils/vida-agenda.utils.ts`
(`buildDayAgenda`, `suggestionsForGap`), `components/VidaPlaceInGapSheet/`,
`components/VidaTemplateGapRow/`, `utils/vida-window.utils.ts`, y **nada de
GraphQL**. Si algo de esa lista se abre, es señal de que el plan se torció.

### Dónde NO va (descartado, para que nadie lo reconsidere)

- **Una hoja nueva «registrar en el hueco»** — lo prohíbe el criterio 38 de
  FEAT-004 y lo decidió D1. Además duplicaría `VidaActivityPicker`.
- **Un `mode: 'log-gap'` en la hoja** — serían cuatro modos para una prop
  opcional. El anclaje es **un dato**, no una puerta.
- **La ventana real dentro de `vida-gap-form.utils.ts`** (aunque sea el archivo
  «natural»): es el archivo que comparte con el camino de planear, y cualquier
  toque pone el criterio 236 en manos de la revisión en vez de en la estructura.
- **La ventana real dentro de `vida-window.utils.ts`** — ese archivo es el
  calendario de días; no tiene nada que ver y el nombre engaña.
- **Calcularla en el componente o en la página** — se necesita en dos sitios (el
  renglón y la hoja) y el criterio 234 exige que sean el mismo número.
- **Tocar `activityFollowUpEdit` / `Remove` sobre la sesión abierta** — criterio
  235 y D4: se lee como vecino, no se cierra.
- **Bajar la ventana real a la plantilla** (FEAT-009) — allí no hay nada real.

### Las tajadas, con sus archivos

Las tres **se quedan como las cortó el analista**: la 1 usa `gapToWindow(gap)` y
la 2 **solo cambia la fuente de la misma prop** por
`execution.realWindowByGapId[gap.id]`. No hay retrabajo entre ellas y cada una se
prueba sola.

| # | Qué hace | Archivos | Criterios | Estado |
|---|---|---|---|---|
| 1 | **El hueco pasado se pulsa y cuentas qué hiciste**, validado contra los bordes del **plan**. | `VidaAgendaGap.tsx:79-92` + `.module.scss` (44 px) · `VidaLogSessionSheet.tsx:50,128,133,222,246,327,371,171` · `VidaDurationPills.tsx` («Todo el hueco») · `VidaHoyPage.tsx:1005,504,736,931` · tests en `VidaHoyPage.test.tsx` y `VidaLogSessionSheet.test.tsx` · **verificar** `vida-execution.utils.test.ts` (230) | 220–232, y de paso 243, 244, 246–249 (la puerta es `canLogPast && executionKnown`) | aceptada |
| 2 | **La ventana real.** | **crea** `utils/vida-gap-window.utils.ts` + `.test.ts` · `vida-execution.utils.ts:648-672, 757-769, 790` · `VidaHoyPage.tsx` (pasar `realWindowByGapId[...] ?? gapToWindow(gap)`) · `VidaLogSessionSheet.tsx:222-234` (la frase de por qué se mueve) y `handleLog` (`describePlacementBlocker`) | 233–237 | aceptada |
| 3 | **La otra cara del hueco y la duración de siempre.** | `vida-patterns.utils.ts:981` + su test · `VidaHoyPage.tsx:319-321` y `logInGap` · `VidaAgendaGap.tsx:108-232` (el «Registrar» secundario) · `buildGapRealWindow({ clampToNow: true })` para el criterio 242 | 238–242 | pending |

250 y 251 se cierran **en cada tajada**, no al final: `pnpm typecheck` + `pnpm
lint` + `pnpm test` + `pnpm build` contra la línea base de
`docs/features/ENVIRONMENT.md`, y el recorrido a mano lo hace el usuario (todo
`/app/*` está detrás del login y **los agentes no entran**).

**Lo que no pude comprobar:** nada de `/app/vida/hoy` con datos reales —el login
es un límite estructural del proyecto—, así que los criterios 247–249 (texto
largo, 375 px, oscuro) se comprueban con un arnés temporal o en los tests de
pantalla, y el 251 solo lo cierra el usuario con la API despierta.

## 3. Construction — feature-builder

### Tajada 1

**Resumen para quien revise:**
1. En Hoy, un hueco **que ya pasó** trae ahora «Registrar lo que hice» y abre la
   hoja de siempre (`mode: 'log'`) **anclada al hueco**: empieza en el principio
   del hueco, las píldoras se recortan a lo que cabe y **Guardar se apaga**
   mientras no quepa. La ventana son los bordes del **plan** (`gapToWindow`), tal
   como pedía la tajada.
2. Está en `VidaAgendaGap` (rama nueva), `VidaLogSessionSheet` (prop
   `gapWindow`), `VidaDurationPills` (píldora «Todo el hueco») y `VidaHoyPage`
   (`logInGap`). `vida-gap-form.utils.ts` **no se tocó** (criterio 236).
3. **Lo que es más probable que haya roto:** el renglón del hueco pasado ya no
   es un `<p>` suelto, es una `<section>` con `aria-label="Libre de …"` y el
   texto partido en dos nodos. **Dos aserciones de `VidaHoyPage.test.tsx`
   dejaron de pasar por eso y las cambié** (líneas 451 y 491 de `main`). Si algo
   más leía «Libre 6:30 – 9:24 · 2h 54» de un tirón, se entera aquí. Segundo
   sospechoso: `VidaDurationPills` lo comparten tres pantallas y le toqué el
   cálculo de `isFree`.

**Qué se construyó, archivo por archivo:**

- `src/features/vida/components/VidaAgendaGap/VidaAgendaGap.tsx` — la rama
  muerta se partió en tres: `isSliver` (o pasado sin quien escuche) sigue
  **exactamente igual** que hoy; `isPast` con `onLogPast` pinta la caja con sus
  horas, su tamaño y **un** `<button>` «Registrar lo que hice»; el hueco futuro
  no se tocó. Props nuevas: `onLogPast` e `isPastDay` (ver «por qué así»).
- `…/VidaAgendaGap.module.scss` — `.card[data-past='true']` (gris, el color es
  lo que separa las dos caras) y `.logButton` con **`min-height: 2.75rem`**,
  copiado de `VidaTemplateGapRow.module.scss:41-58`. Medido en el navegador: 44
  px exactos.
- `src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx` —
  prop **`gapWindow?: GapWindow | null`** y, con ella, la figura de
  `VidaPlaceInGapSheet`: `getMaxDurationForStartTime` → `validatePlacement` en
  cada render → `disabled` del footer → `describeLeftovers` en la línea de lo que
  queda; `chooseActivity` no preselecciona una duración de plantilla que no
  quepa; `handleLog` valida el hueco **antes** de `validateLogPast` y la
  mutación no cambia; título «¿Qué hiciste?» y subtítulo «Martes · en el hueco
  de 9:30 a 11:30». **Sin `gapWindow` la hoja es literalmente la de ayer.**
- `src/features/vida/components/VidaDurationPills/VidaDurationPills.tsx` — prop
  aditiva `fillMinutes` → píldora **«Todo el hueco»**, apagada por defecto.
- `…/VidaDurationPills.module.scss` — `.pillFill` (sin el ancho mínimo de las
  fijas: es una palabra, no un número).
- `src/features/vida/pages/VidaHoyPage.tsx` — `logInGap(gap)` (gemelo de
  `askAboutNoData`), `gapWindow` en `LogSheetState` y en la hoja, y la puerta
  `onLogPast={canLogPast && executionKnown ? logInGap : undefined}`.
- Tests: **8** casos nuevos en `VidaLogSessionSheet.test.tsx`, **10** en
  `VidaHoyPage.test.tsx` y **1** en `vida-execution.utils.test.ts` (criterio
  230, que era de verificar, no de escribir: `sliceGap` ya lo hacía).

**Por qué así, y qué se descartó:**

- **`isPastDay` es una desviación del plan y hay que mirarla.** El plan decía
  «rama `isPast && onLogPast`», pero **`gap.isPast` es `false` en un día de la
  tira**: sale de comparar con el reloj y `useVidaNowMinute(isToday)` devuelve
  `null` fuera de hoy, así que ningún hueco de un día pasado viene marcado. Con
  solo `gap.isPast`, el criterio 232 era falso (lo cazó el test). Alternativas
  descartadas: tocar `buildDayAgenda` (el plan lo prohíbe) y clonar el `gap` con
  `isPast: true` desde la página (mentir sobre el dato para acertar en la
  pintura). La página, que es quien sabe que el día ya pasó, lo dice con una
  prop.
- **`durationPillsForWindow` y `getPlacementLeftovers` no se cablearon**: se usó
  el camino vivo (`maxMinutes` de `VidaDurationPills` y `describeLeftovers`),
  como manda el plan. Siguen sin usarse en producción.
- **La previsualización se esconde cuando no cabe.** Es el molde
  (`VidaPlaceInGapSheet:286` pide `validation.valid`): decir «se apunta encima
  de tu día» de algo que Guardar está negando son dos frases contrarias en la
  misma pantalla.
- **La frase del criterio 227 va repartida**, como pidió el arquitecto: la hora
  de fin la dice `VidaEndTimeLine` (FEAT-008) y lo que queda,
  `describeLeftovers`. En pantalla se lee «Acaba a las 9:50» y «Queda libre 1h 40
  antes de Daily meeting». **No** es la frase literal del render («De 9:30 a
  9:45. Quedan 1 h 45 libres en este hueco»): dice los dos números, con otras
  palabras y sin repetir nada.

**Verificación** (línea base de `docs/features/ENVIRONMENT.md`, 2026-09-22):

| Qué | Base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos |
| `pnpm test` | 2 fallos de 1673 | **2 fallos de 1692** (los mismos `SearchSelect` ×2; +19 son los casos nuevos) |
| `pnpm build` | chunk inicial 1.100,58 kB | **1.102,43 kB** (+1,85 kB: es el código nuevo, no hay import nuevo) |

**En el navegador** (arnés temporal `harness-feat011.html` + `src/harness-feat011.tsx`,
**ya borrados**; `/app/*` está detrás del login y los agentes no entran):

- A **375 px**: `scrollWidth === clientWidth === 375` con el hueco pintado y con
  la hoja abierta **y el aviso puesto**. El botón del hueco mide **44,0 px** de
  alto medidos sobre el DOM. *(La captura sale a doble tamaño: `devicePixelRatio`
  es 2 en este arnés; el DOM sí mide 375, medido a mano.)*
- Con el aviso puesto, `Registrar` tiene `disabled === true`, `cursor:
  not-allowed`, el aviso queda en `bottom: 690` y el botón en `top: 739`: **se
  ven los dos a la vez**, sin scroll (criterio 248).
- **Oscuro**: hueco pasado gris (`rgba(168,179,199,.08)` sobre borde al 45 %)
  frente al futuro verde (mint al 5 %/35 %); el botón se invierte solo
  (`#eef2ff` sobre `#0b1220`, ~16:1) y el aviso se lee (criterio 249).
- Texto largo: con un bloque vecino de 60 caracteres («Daily meeting con el
  equipo de plataforma y diseño») ni el renglón ni el subtítulo ni el aviso
  producen scroll horizontal (criterio 247).

**Criterios, uno a uno:**

- **220 ✅** — el hueco pasado trae «Registrar lo que hice» y **un solo** botón
  (`getAllByRole('button')` dentro del hueco → 1). Visto en el navegador.
- **221 ✅** — el sliver sigue siendo la línea de siempre, sin `aria-label` de
  caja y sin controles (test dedicado + visto: «Libre 9:37 – 9:47 · 10m»).
- **222 ✅** — misma hoja, `mode: 'log'`, título «¿Qué hiciste?», subtítulo
  «Martes · en el hueco de 9:30 a 11:30». **Un solo buscador** (comprobado).
- **223 ✅** — abre en el principio del hueco (`08:45` en el test de pantalla,
  no `08:54`), y cambiar la hora revalida (test del criterio 225).
- **224 ✅** — arranca en la duración de la plantilla (20 min) y nunca en el
  hueco entero; sin actividad elegida, la duración va vacía.
- **225 ⚠️ parcial** — valida **por arriba y por abajo** con las palabras que ya
  existen, pero **no nombra todavía el bloque del otro lado**: esa cláusula es
  `describePlacementBlocker`, que vive en el archivo de la **tajada 2**. Hoy se
  lee «Desde las 9:30 caben 2 h. Elige menos tiempo o empieza antes.» y no «…a
  las 11:30 entra Daily meeting». Lo dejo dicho, no reescrito.
- **226 ✅** — `disabled` real, verificado en el DOM y en dos tests; vuelve a
  encenderse al corregir.
- **227 ✅ con matiz** — se dicen los dos números, repartidos entre
  `VidaEndTimeLine` («Acaba a las 9:50») y `describeLeftovers` («Queda libre 1h
  40 antes de Daily meeting»); lo que sobra **antes** también se dice, porque es
  la misma función de siempre. No es la frase literal del render (ver arriba).
- **228 ✅** — `maxMinutes` apaga 45 y 1h en un hueco de 40 min y lo dice («Aquí
  caben 40 min.»); «Todo el hueco» pone los minutos exactos que quedan. **Se
  pinta solo cuando ese número no es ya una píldora fija**, para que no haya dos
  controles encendidos diciendo lo mismo.
- **229 ✅** — `activityFollowUpAdd` con fecha, hora y minutos elegidos; el test
  de pantalla comprueba que **ninguna** de las tres mutaciones de
  `activityDayPlan` se llama.
- **230 ✅ (verificado, no reescrito)** — test nuevo en
  `vida-execution.utils.test.ts`: dos registros dentro del mismo hueco dejan
  `session · gap · session · gap`, los trozos suman 120 − 15 − 20, ninguno es
  sliver y el de cola conserva su `nextBlockTitle`. En pantalla, cada trozo
  vuelve a ofrecer «Registrar lo que hice» por la misma rama.
- **231 ✅** — no se tocó el camino de fallo: sigue el `onSuccess` local y el
  `Alert`. Cubierto por los tests que ya existían (criterio 36).
- **232 ✅** — día pasado: los dos huecos ofrecen contar y no hay **ni un**
  control de plan; día futuro: nada (dos tests).
- **243 ✅** — con el día en vuelo la página devuelve el esqueleto antes de
  llegar a los huecos; test que lo fija.
- **244 ✅** — con `activityDayFollowUps` caído (`executionKnown === false`) el
  hueco **no ofrece registrar** y sigue diciendo sus minutos.
- **245 ✅ (de paso)** — día sin plan: el hueco pasado grande ofrece contar; el
  texto de «aún no hay plan» no se tocó.
- **246 ✅** — test sobre el texto de la pantalla: ni «perdido», ni
  «desperdiciado», ni «vacío», ni «en blanco», ni «por qué no». Las palabras
  siguen siendo «Libre» y «Registrar lo que hice».
- **247 ✅** — medido con nombres de 60 caracteres (ver arriba).
- **248 ✅** — medido a 375 px con el aviso puesto (ver arriba).
- **249 ✅** — medido en oscuro (ver arriba).
- **250 ✅** — tabla de arriba. El chunk crece 1,85 kB; es código nuevo, sin
  dependencias nuevas.
- **251 ⏳ solo el usuario** — reconstruir una mañana a trozos con la API
  despierta. Pasos: entrar en `/app/vida/hoy`, pulsar «Registrar lo que hice» en
  un hueco de la mañana, elegir algo y 15 min, guardar; ver la sesión «fuera del
  plan» en su hora y el hueco **encogido** con su botón; repetir dentro de lo que
  queda; intentar una tercera que no quepa y ver **Guardar apagado**; comprobar
  en `/app/vida/revision` que lo registrado se cuenta.

**Lo que encontré y no toqué (fuera de alcance):**

- `gap.isPast` **no describe lo que su nombre dice** en un día que no es hoy;
  hoy se compensa desde la página. Si la tajada 2 necesita la misma distinción
  en `buildDayExecution`, ahí hay una decisión que merece dos líneas de plan.
- `durationPillsForWindow` y `getPlacementLeftovers` siguen sin uso en
  producción (ya lo dijo el arquitecto). No las borro: no es mi tajada.
- El `Button` en `disabled` dentro de la hoja baja a `opacity: .55` y **en
  oscuro se distingue poco** de su estado normal. Es del sistema de diseño,
  igual que el `variant="danger"` que ya está apuntado en `ENVIRONMENT.md`.

**Estado del árbol:** sin commitear. Arnés borrado (`harness-feat011.html` y
`src/harness-feat011.tsx` no existen). `graphify update .` ejecutado.

### Tajada 2 — La ventana real

**Resumen para quien revise:**
1. La hoja del hueco ya no valida contra el plan: valida contra **lo vivido**.
   Si «Bañarme» acabó a las 8:50 aunque estuviera planeado hasta las 8:45, el
   hueco de 8:45 a 9:24 se registra **desde las 8:50**, la hoja dice por qué se
   mueve y el aviso de que no cabe **nombra al vecino**.
2. Está en un archivo nuevo (`utils/vida-gap-window.utils.ts`, puro, con su
   test), en el mapa `realWindowByGapId` que `buildDayExecution` rellena **dentro
   del bucle que ya parte los huecos**, y en tres líneas de `VidaHoyPage` y
   `VidaLogSessionSheet`. **`vida-gap-form.utils.ts` no se tocó** (criterio 236,
   `git diff` de ese archivo vacío).
3. **Lo que es más probable que haya roto:** `buildDayExecution` ahora recorre
   `agenda.entries` **dos veces** (una para saber qué bloque hay a cada lado de
   cada hueco) y empuja los huecos por una función nueva. El orden de
   `entries` no cambió —lo fijan los tests de FEAT-004— pero cualquier consumidor
   de `execution.entries` se entera aquí primero. Segundo sospechoso: el aviso
   de la hoja ahora sale de `describePlacementBlocker`, así que **cualquier test
   que compare el texto del aviso palabra por palabra** en el camino de
   registrar ve una frase **más larga** (la de siempre + la cláusula del
   vecino).

**Qué se construyó, archivo por archivo:**

- **`src/features/vida/utils/vida-gap-window.utils.ts`** (nuevo) — `GapNeighbour`,
  `RealGapWindow`, `buildGapRealWindow`, `describeGapWindowShift` y
  `describePlacementBlocker`. Puro, sin importar nada de `vida-execution.utils.ts`
  (los vecinos entran en forma plana: no hay ciclo). `RealGapWindow` **extiende**
  `GapWindow`, así que `validatePlacement`, `describeLeftovers`, `describeWindow`
  y `getMaxDurationForStartTime` lo tragan sin tocarlos: es el **tercer
  constructor** de ventana que dejó dicho el arquitecto.
- **`…/vida-gap-window.utils.test.ts`** (nuevo) — 17 casos: los cinco del
  criterio 237 (vecino que acabó antes · que acabó después · sin sesión · sin
  vecino, fin del día · sesión abierta), los bordes que se cruzan, `clampToNow`,
  las dos frases y la comprobación de que el aviso **empieza por las palabras
  exactas** de `validatePlacement`.
- **`utils/vida-execution.utils.ts`** — campo `realWindowByGapId` en
  `DayExecution` y su relleno **dentro del bucle**, junto a cada `push` de hueco
  (la clave es la del trozo, que `sliceGap` reescribe). Dos ayudantes locales:
  `blockNeighbour` (un bloque del plan, con el borde de **su** sesión) y
  `sessionNeighbour` (una sesión ya registrada, incluida la abierta). Y un pase
  previo que apunta qué bloque hay a cada lado de cada hueco del plan.
- **`utils/vida-execution.utils.test.ts`** — 5 casos nuevos: el vecino que acabó
  antes, el que se alargó, la sesión abierta como vecina del trozo de delante, el
  trozo de cola con la sesión registrada a la izquierda, y el hueco partido por
  «ahora» que **no** hereda la hora de un bloque que no toca.
- **`components/VidaLogSessionSheet/VidaLogSessionSheet.tsx`** — el aviso sale
  ahora de `describePlacementBlocker` (en pantalla y en `handleLog`), y debajo
  del subtítulo se pinta `describeGapWindowShift` cuando los bordes no son los
  del plan. `validatePlacement` sigue ahí **solo** para el `valid` que apaga
  Guardar: mismo camino, misma decisión.
- **`…/VidaLogSessionSheet.module.scss`** — `.shift`, tono secundario (es una
  explicación, no un aviso: nunca el rojo del error).
- **`pages/VidaHoyPage.tsx`** — `logInGap` lee
  `execution.realWindowByGapId[gap.id] ?? gapToWindow(gap)`. **Una línea**, como
  decía el plan; el `??` es red para un hueco que no venga del mapa (la puerta
  `executionKnown` hace que en pantalla no ocurra).
- **`pages/VidaHoyPage.test.tsx`** — 4 casos de pantalla: 233 (la hoja abre en
  8:50, no en 8:45), 234 (el renglón sigue diciendo 8:45 – 9:24 **y** la hoja
  explica por qué), 225 (el aviso nombra a «Bañarme» y Guardar se apaga) y 235
  (con un cronómetro corriendo, el trozo de delante se registra y **no** se
  llaman `updateFollowUp` ni `deleteFollowUp`).

**Por qué así, y qué se descartó:**

- **Dos añadidos al diseño del arquitecto, los dos por bugs que salieron al
  probar, y los dos conviene mirarlos:**
  1. **Solo manda el borde real del vecino que está PEGADO al hueco**
     (`plannedMinutes === el borde del hueco`). `buildDayAgenda` parte el hueco
     en «ahora», y el trozo de después tiene detrás un bloque que acabó **dos
     horas antes**: sin esta comprobación, la ventana de ese trozo se abría hacia
     atrás por encima de todo lo que había en medio. Lo cazó un test.
     `plannedMinutes` de `GapNeighbour` está justo para esto.
  2. **`nextTouchesEnd` / `previousTouchesStart`.** El hueco de 8:45 a 9:24
     (cerrado por «ahora») lleva `nextBlockTitle: 'Leer un rato'`, que **empieza
     a las 10:00**. La cláusula «A las 9:24 entra Leer un rato» habría sido un
     dato falso; con el vecino despegado, el aviso **se calla** en vez de
     inventarse un reloj. `describeLeftovers` sigue usando `nextBlockTitle`
     porque su frase («antes de Leer un rato») no afirma ninguna hora.
- **El borde real de un bloque `moved` no cuenta.** Su sesión se pinta donde
  ocurrió y **ya parte** el hueco que le toque; tomarla además como borde del
  hueco de su hora la contaría dos veces.
- **La ventana vacía no se da la vuelta.** Si un vecino se comió el hueco
  entero, `endMinutes` se queda en `startMinutes`: `getMaxDurationForStartTime`
  devuelve 0 y la validación de siempre dice que ahí no cabe nada. Negativos,
  ninguno.
- **El criterio 234, por la rama que eligió el arquitecto:** el renglón **no se
  toca** (la barra y la leyenda reparten el día desde `gap.startMinutes`) y la
  hoja lo explica. Está escrito en el comentario de `realWindowByGapId` para que
  nadie lo deshaga sin leer por qué.
- **`clampToNow` se implementó y se probó, pero nadie lo usa todavía**: es del
  criterio 242 (tajada 3). Son tres líneas y un test; dejarlo para luego obligaba
  a volver a abrir el archivo.
- **No se cablearon `durationPillsForWindow` ni `getPlacementLeftovers`**, como
  manda el plan. Siguen sin uso en producción.

**Verificación** (línea base de `docs/features/ENVIRONMENT.md`, 2026-09-22):

| Qué | Base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos |
| `pnpm test` | 2 fallos de 1692 | **2 fallos de 1718** (los mismos `SearchSelect` ×2; +26 son los casos nuevos) |
| `pnpm build` | chunk inicial 1.102,43 kB | **1.105,14 kB** (+2,71 kB: el archivo nuevo y las dos frases; sin dependencias nuevas) |

**En el navegador** (arnés temporal `harness-feat011-t2.html` +
`src/harness-feat011-t2.tsx`, **ya borrados**; `/app/*` está detrás del login y
los agentes no entran):

- **Intendencia:** el 5173 **no respondía** (probe: «APAGADO, nadie escucha»,
  `curl` rc 7 en 5173 y 5174), así que arranqué el de `.claude/launch.json`, que
  cogió el 5173 libre. **No tengo `preview_stop` entre mis herramientas: queda
  arriba y lo digo aquí.** Lo que se vio es un arnés con datos sintéticos, no la
  app con sesión.
- A **375 px** y en **oscuro**: `scrollWidth === clientWidth === 375` con la hoja
  abierta y el aviso puesto, con nombres de vecino de **47 y 47 caracteres**.
  *(La captura sale a media escala —`devicePixelRatio` 2—; las medidas son sobre
  el DOM.)*
- Subtítulo: «Viernes · en el hueco de **9:40 a 11:25**» (la ventana real) y
  debajo «Desayunar con calma y ordenar la cocina entera acabó a las 9:40, así
  que aquí empieza más tarde. Daily meeting con el equipo de plataforma y diseño
  empezó a las 11:25, así que aquí acaba antes.»
- Con la hora puesta a las 9:35: el aviso dice «Esa hora se sale de este rato
  libre. Aquí cabe algo entre las 9:40 y las 11:25. Desayunar con calma y ordenar
  la cocina entera acabó a las 9:40.», `Registrar` sale `disabled`, el aviso
  acaba en `bottom: 709` y el botón empieza en `top: 756`: **se ven los dos a la
  vez** en 812 px, sin scroll (criterio 248).
- **Contraste en oscuro** (criterio 249): la frase de por qué se mueve,
  `rgb(168,179,199)` sobre `rgb(22,30,47)` → **7,9:1**; el aviso,
  `rgb(255,180,171)` sobre el mismo fondo → **9,8:1**.

**Criterios, uno a uno:**

- **233 ✅** — «Bañarme» acaba a las 8:50 y la hoja abre en 8:50 con la ventana
  8:50 → 9:24 (test de pantalla + dos tests de `buildDayExecution`: acabó antes
  → 9:28, se alargó → 9:40). Y por el otro lado, el vecino de la derecha que
  empezó antes cierra la ventana (test de unidad, ventana 9:40 → 11:25 visto en
  el navegador).
- **234 ✅** — el renglón sigue diciendo «Libre de 8:45 – 9:24» (aserción en el
  mismo test) y la hoja dice «Bañarme acabó a las 8:50, así que aquí empieza más
  tarde». Una sola verdad: **las dos caras leen el mismo `realWindowByGapId`**.
  La barra y su leyenda no se movieron ni un minuto.
- **225 ✅ (lo que quedó parcial en la tajada 1)** — el aviso nombra al bloque
  del otro lado por arriba («A las 9:00 entra Llamada con el banco.») y por abajo
  («Bañarme acabó a las 8:50.»), y sigue diciendo **primero** lo de siempre.
  Cuando el vecino no está pegado al borde, se calla (ver «por qué así»).
- **235 ✅** — la sesión abierta entra como un vecino más: parte el hueco, cierra
  el borde del trozo de delante y **no se toca**. Test de pantalla con espías:
  un `createFollowUp` y **cero** `updateFollowUp` / `deleteFollowUp`. En el test
  de unidad, la sesión abierta sale del cálculo con `durationMinutes: null` e
  `isOpen: true`, como entró.
- **236 ✅** — `git diff --stat src/features/vida/utils/vida-gap-form.utils.ts`
  **vacío**, y su test pasa sin tocar una línea. `VidaPlaceInGapSheet` y las
  fichas del hueco futuro no aparecen en el diff. El camino de planear sigue
  diciendo exactamente lo que decía.
- **237 ✅** — `vida-gap-window.utils.test.ts`, 17 casos, con los cinco que pide
  el criterio nombrados uno a uno.
- **250 ✅** — tabla de arriba. Chunk +2,71 kB, sin dependencias nuevas.
- **251 ⏳ solo el usuario** — con la API despierta, en `/app/vida/hoy`: dejar
  que un bloque acabe fuera de su hora (registrar «Bañarme» de 8:00 a 8:50
  cuando el plan decía hasta 8:45), pulsar «Registrar lo que hice» en el hueco
  siguiente y comprobar que **la hoja abre en 8:50**, que explica por qué, y que
  intentar las 8:45 apaga Guardar nombrando «Bañarme».

**Lo que encontré y no toqué (fuera de alcance):**

- **`gap.nextBlockTitle` no siempre nombra a quien empieza en `endMinutes`.** En
  un hueco partido por «ahora» nombra al bloque de más allá. Aquí se resolvió con
  `nextTouchesEnd`, pero el dato sigue siendo ambiguo para cualquier consumidor
  nuevo; quien toque `buildDayAgenda` algún día haría bien en separarlo.
- El hallazgo de la tajada 1 sobre `gap.isPast` en un día de la tira **sigue
  igual**: esta tajada no lo necesitó (el mapa se rellena mire quien mire el día).
- El `Button` en `disabled` dentro de la hoja sigue bajando solo a `opacity: .55`
  y en oscuro se distingue poco: ya estaba apuntado en la tajada 1.

**Estado del árbol:** sin commitear. Arnés borrado
(`harness-feat011-t2.html` y `src/harness-feat011-t2.tsx` no existen).
`graphify update .` ejecutado. **El dev server del 5173 lo arranqué yo y sigue
arriba** (no tengo con qué pararlo).

## 4. Review — feature-reviewer

### Tajada 1 — El hueco pasado se pulsa y cuentas qué hiciste

**Veredicto: `accepted`** — los criterios 220–224, 226 y 228–232 se cumplen y los
he verificado yo, **incluido el caso que pedías montar: un día de atrás de la
tira ofrece registrar en sus huecos y guarda de verdad**. El **225** queda
parcial por una razón que he comprobado y que es buena —aunque no exactamente la
que él da—, y el **227** dice los dos números repartidos en vez de en una frase:
lo juzgo abajo. La desviación del `isPastDay` **es la salida correcta**.

**La desviación del `isPastDay`: es la salida correcta, y por qué**

El problema es real y lo confirmé leyendo el dato: `gap.isPast` sale de comparar
el hueco con `nowMinutes`, y `useVidaNowMinute(isToday)` devuelve **`null`**
fuera de hoy, así que en un día de la tira **ningún** hueco viene marcado. Con
la rama tal como la describía el plan, el criterio 232 era falso. Las tres
salidas posibles:

1. **Tocar `buildDayAgenda`** para que sepa que el día entero pasó: es una
   función pura, entregada, que alimenta la agenda, el presupuesto, la leyenda y
   el cruce con las sesiones. Cambiar ahí el significado de `isPast` por una
   pantalla es el tipo de cambio que se paga en sitios que nadie vuelve a mirar.
2. **Clonar el `gap` mintiendo en el dato**: sería falsear la estructura que
   luego leen otros; el peor de los tres.
3. **Decirlo desde quien lo sabe** —la página— con una prop. Es lo que ha hecho.

**Y no deja dos verdades que puedan discrepar**, que era tu pregunta: los dos
términos son **complementarios, no competidores**. `gap.isPast` responde «¿este
hueco quedó detrás del reloj **dentro de hoy**?» y `isPastDay` responde «¿el día
que miro es anterior a hoy?». El componente los une con un **`||`**, que es
monótono: en un día pasado el segundo es `true` y el primero irrelevante; en hoy
manda el primero; en un día futuro los dos son `false`. No hay combinación en la
que se contradigan. Lo único que queda —y lo anoto— es que **un consumidor nuevo
que lea `gap.isPast` a secas en un día pasado seguirá leyendo `false`**: eso ya
pasaba antes de esta tajada, pero ahora hay dos sitios donde mirar. La deuda
honrada, para cuando alguien toque la agenda, es que `buildDayAgenda` reciba el
«este día ya pasó» —o un `nowMinutes` de fin de día— y entonces esta prop
sobraría.

**Y lo comprobé donde importa.** Test temporal mío (borrado) sobre la página, en
el día **2026-09-17** de la tira: el hueco de 6:30 a 9:00 ofrece «Registrar lo
que hiciste…», la hoja abre anclada —«¿Qué hiciste?», «…en el hueco de 6:30 a
9:00», inicio **06:30**—, la duración **no** es el hueco entero, y al guardar
sale **un** `activityFollowUpAdd` con
`{ date: '2026-09-17', startTime: '06:30', durationMinutes: 30 }` y **cero**
mutaciones del plan (`add`, `edit`, `set` y `remove`, las cuatro espiadas).

**Criterios, uno por uno**

| # | Estado | Evidencia que he comprobado yo |
|---|---|---|
| 220 | **cumplido** | El hueco pasado trae **una** salida y ninguna de planear: en mi arnés, la fila tiene exactamente **un** `button`, con `aria-label` «Registrar lo que hiciste entre las 9:30 y las 11:30». |
| 221 | **cumplido** | El resto de 10 min se pinta «Libre 8:45 – 8:55 · 10m» y su fila tiene **cero** botones. Visto y medido. |
| 222 | **cumplido** | Abre `VidaLogSessionSheet` —la misma— con «¿Qué hiciste?» y «Martes · en el hueco de…». Es un **dato** (`gapWindow`), no un cuarto modo: sin él la hoja es la de siempre. |
| 223 | **cumplido** | El inicio viene en el principio del hueco (`06:30` en mi caso, `08:45` en el suyo) y se puede cambiar: al cambiarlo revalida —lo probé moviéndolo fuera del hueco—. |
| 224 | **cumplido** | La duración **no** arranca en el hueco entero: con un hueco de 2h 30 los campos no quedan en «2»/«30» (aserción mía). Sale de `chooseActivity` con la duración de la plantilla, y **solo si cabe**. |
| 225 | **parcial, y aceptable** | Ver abajo. |
| 226 | **cumplido, espiado por los dos lados** | Por arriba, su test: la píldora «45» deshabilitada y «Registrar» deshabilitado. **Por abajo, el mío**: con la hora puesta antes del hueco, «Registrar» sale `disabled`, el aviso dice «se sale de este rato libre» **sin pulsar nada**, y al pulsarlo igualmente `createFollowUp` **no se llama**. |
| 227 | **parcial de forma, no de fondo** | Ver abajo. |
| 228 | **cumplido** | `maxMinutes` y `fillMinutes` van a `VidaDurationPills`: solo se ofrecen las que caben desde la hora elegida y hay «Todo el hueco». |
| 229 | **cumplido** | Mi test: un `activityFollowUpAdd` con la fecha del día mostrado y **cero** mutaciones de plan. |
| 230 | **cumplido** | Sale de `buildDayExecution` + `sliceGap`, que no se han tocado; su test lo afirma sobre la agenda después de guardar. |
| 231 | **cumplido** | El camino de error de la hoja es el de FEAT-004, intacto: `handleLog` no cierra si la mutación falla. |
| 232 | **cumplido, verificado por mí** | Arriba. Y el día futuro no ofrece nada (`canLogPast` es `isToday || isPast`). |
| 236 | **cumplido** | **`vida-gap-form.utils.ts` no aparece en el diff**: `git diff --stat` de ese archivo está vacío. El camino de planear no cambia ni una palabra. |

**El 225: por qué es aceptable, y la corrección a su razón**

`validatePlacement` dice **cuánto cabe** y **las dos salidas** —«Desde las 10:45
caben 45 min. Elige menos tiempo o empieza antes.»— pero **no nombra el bloque
del otro lado**, que el criterio pide. Lo doy por aceptable en esta tajada,
**pero no por la razón que él escribe**: el nombre **sí está disponible ya**
—`gapToWindow` copia `nextBlockTitle`, y `describeLeftovers` lo usa («antes de
Daily meeting»)—. Lo que de verdad lo impide es otra cosa, y es mejor razón:
**meter esa cláusula dentro de `validatePlacement` cambiaría el mensaje del
camino de planear**, que el criterio 236 congela expresamente. Decirlo sin tocar
aquello obliga a una frase nueva al lado —`describePlacementBlocker`—, que es lo
que la tajada 2 trae. Así que: **parcial con buen motivo**, y la razón correcta
conviene que quede escrita, porque la que hay invita a pensar que falta el dato
cuando lo que falta es el sitio donde decirlo.

**El 227: los dos números están, pero repartidos**

El render pide «De 9:30 a **9:45**. Quedan **1 h 45** libres en este hueco.».
Lo que hay: la hora de fin la dice `VidaEndTimeLine` bajo «Cuánto duró» —«→
Acaba a las 9:45», que llegó con FEAT-008— y lo que queda lo dice
`describeLeftovers` en la línea de previsualización. **No se ha perdido ningún
dato** y repetir la hora de fin sería contar dos veces lo mismo, así que la
decisión es defendible. Lo que sí se pierde es **la unidad de la frase**: el
render los ataba en una sola oración, a un golpe de vista, y ahora están a dos
alturas distintas de la hoja con dos redacciones. No lo devuelvo —el criterio
pide que se digan «a la vez» las dos cosas, y se dicen, en la misma pantalla y
sin pulsar nada— pero si el usuario echa de menos la frase del render, unirlas
es trabajo de copy, no de arquitectura. Queda como hallazgo.

**La hoja es cruce de tres features: comprobado que no se rompe**

`VidaLogSessionSheet` lleva encima el campo de hora de FEAT-013 y los dos campos
más la línea de fin de FEAT-008, las dos entregadas. Lo nuevo entra **como un
dato opcional** (`gapWindow`), y todo lo anclado cuelga de
`anchor = mode === 'log' ? gapWindow : null`:

- **«Empezar algo» no se entera**: `anchor` es `null` en `mode: 'start'` por
  construcción, así que ni título, ni subtítulo, ni validación de hueco, ni
  `maxMinutes` cambian ahí.
- **«Registrar tiempo pasado» de la cabecera tampoco**: se abre sin `gapWindow`,
  así que conserva su título y su frase («Algo que ya hiciste el …»).
- Su archivo de test suma **120 líneas y borra 0**: ninguna afirmación de
  FEAT-004, FEAT-008 ni FEAT-013 se ha tocado.

**Las dos aserciones viejas que cambió: no relajan nada**

Eran dos lecturas de un tirón —`getByText('Libre 10:30 – 11:30 · 1h')` y
`getByText('Libre 6:30 – 9:24 · 2h 54')`— que ya no existen porque el renglón
pasado dejó de ser un único `<p>`. Las nuevas leen **las dos partes dentro de la
fila** (`Libre 10:30 – 11:30` + `1h`) **y además** afirman que no hay ningún
botón de planear. Es más, no menos.

**Estados, medidos por mí a 375 px y en oscuro**

**Las cifras son del DOM, no de la imagen** —la captura a doble tamaño nos ha
aparecido hoy en varios arneses; en este salió bien, y aun así lo que reporto
está medido—:

- El botón «Registrar lo que hice» mide **44,0 × 147,9 px** en los dos casos:
  cumple el tamaño de toque que este módulo fijó en FEAT-008 y que reescribimos
  en el criterio 150 de FEAT-009. **Esto es lo que había que hacer**, y aquí se
  ha hecho desde el principio.
- `scrollWidth === clientWidth === 375` y **0 nodos desbordados**.
- En oscuro el botón **invierte** (texto oscuro sobre claro): **16,74:1**; «Libre
  9:30 – 11:30» **9,93:1** y la línea del resto fino **9,94:1**. Muy por encima
  de 4,5:1 — y sin el problema del `ghost` que encontré en FEAT-009.

**Línea base, corrida entera por mí**

| Qué | `ENVIRONMENT.md` | Constructor | **Medido ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos |
| `pnpm test` | 2 de 1673 | 2 de 1692 | **2 fallidos de 1692**, 110 archivos de 111 en verde |
| `pnpm build` | 1.100,58 kB | 1.102,43 kB | **exit 0**, `index` **1.102,43 kB** (+1,85), `app-icons` **620,20 kB sin tocar** |

**Hallazgos — se anotan, no devuelven la tajada**

1. **«Pasado» se decide en dos sitios** (`gap.isPast` y la prop `isPastDay`).
   No pueden discrepar tal como se combinan, pero la deuda honrada es que el
   dato lo sepa `buildDayAgenda`.
2. **La razón declarada para aplazar el 225 no es la correcta** (el nombre del
   vecino ya está en la ventana; lo que falta es dónde decirlo sin tocar el
   mensaje de planear). La conclusión sí lo es.
3. **El 227 dice los dos números en dos sitios**, no en la frase del render.
4. **`ENVIRONMENT.md` vuelve a quedarse corto** (hoy **1692** tests y
   **1.102,43 kB**). **No lo he tocado.**

**Lo que no he podido revisar:** el recorrido con sesión —pulsar el hueco de
ayer con el dedo, registrar, y ver el resto encogerse—, y los criterios que esta
tajada deja para el usuario. Y recuerdo, porque manda sobre esta feature, la
premisa del plan: **esto convierte un renglón muerto en un gesto de dos toques**,
que es exactamente la dirección correcta; lo que queda por ver con datos reales
es si la duración que propone acierta lo suficiente como para no tener que
tocarla casi nunca (eso lo trae la tajada 3).

### Tajada 2 — La ventana real: contra lo vivido, no contra lo planeado

**Veredicto: `accepted`** — los criterios 233–237 se cumplen y el 225 queda
cerrado (era el parcial que dejé anotado en la tajada 1). **Reproduje el
hallazgo (a) yo mismo** y confirmo que el arreglo lo tapa; el (b) me parece la
decisión correcta y explico por qué. Lo entregado no se toca: los tres archivos
que el criterio 236 protege **no aparecen en el diff**, y la barra y su leyenda
no se mueven ni un minuto.

**El hallazgo (a), reproducido: la ventana se abría hacia atrás**

Es el que valía la revisión, así que lo monté con mis propios casos (test
temporal sobre el `utils`, borrado). El escenario: `buildDayAgenda` parte el
hueco en «ahora», y **el trozo de después tiene detrás un bloque que acabó
horas antes**. Con los vecinos crudos, la ventana habría empezado en el borde
real de ese bloque —las **7:50**— y se habría comido lo que hay en medio.

Con el código de esta tajada:

```
buildGapRealWindow({ gap: 10:00 → 11:00, before: {plan 8:00, real 7:50} })
  → startMinutes 10:00 · previousTouchesStart false · previousBlockTitle null
```

El guardián es la comprobación de adyacencia —`before.plannedMinutes ===
plannedStartMinutes`—, y está en **la función pura**, no en la pantalla, que es
donde tenía que estar. Comprobé además que el aviso de «no cabe» en ese caso
**no nombra a nadie**: dice solo «Esa hora se sale de este rato libre. Aquí cabe
algo entre las 10:00 y las 11:00.». Sin la adyacencia, esto habría dejado
escribir una sesión encima de otra: es exactamente el tipo de fallo que un test
de pantalla no ve y uno de aritmética sí.

Y comprobé lo demás de la función con mis casos: vecino pegado que acabó antes
(9:28 → empieza antes, con su frase), vecino que acabó después (9:40 → «desde
las 9:35 no cabe», nombrando a Desayunar), vecino de la derecha que nombra la
hora a la que entra, **vecino sin sesión** (manda el plan y no se dice nada),
**sesión abierta como vecino** («lleva ocupado hasta las 10:00», en presente),
la ventana que **nunca se da la vuelta**, y una ventana del plan sin los campos
de más, que no rompe nada.

**El hallazgo (b): callarse es lo correcto**

`gap.nextBlockTitle` no siempre nombra a quien empieza en `endMinutes` —en el
hueco cerrado por «ahora» nombra al bloque de más allá—, así que la cláusula
«a las 11:00 entra Daily meeting» sería **falsa**: Daily meeting empieza a las
13:00. Entre decir una hora inventada y no decir nada, **no decir nada es lo
correcto**, y es además lo que manda la regla del módulo (nada que no se sepa).

¿Se pierde información que el usuario necesite? **Poca, y no la que decide**: el
aviso sigue diciendo **cuánto cabe y desde cuándo**, que es lo que permite
corregir; y quién cierra el hueco se sigue leyendo en la línea de lo que queda
(«queda libre 1 h antes de Daily meeting»), que es cierta aunque el vecino no
esté pegado. Lo apruebo tal cual. Si algún día se quiere la frase también ahí,
el dato que falta es **a qué hora empieza de verdad el siguiente**, no el
nombre.

**Criterios, uno por uno**

| # | Estado | Evidencia que he comprobado yo |
|---|---|---|
| 233 | **cumplido** | La ventana sale de `realWindowByGapId`, calculada junto a cada hueco **ya partido** (la clave que estrena `sliceGap`, que era la trampa). **Visto en el navegador**: con «Bañarme» planeado hasta las 8:45 y su sesión acabada a las 8:50, la hoja abre en **8:50** y el subtítulo dice «en el hueco de **8:50** a 9:24». |
| 234 | **cumplido, y por la rama correcta** | El renglón sigue diciendo las horas **del plan** —`entries` empuja los mismos huecos de siempre; `realWindowByGapId` es un mapa **al lado**, aditivo— así que `getDayBudget`/`getExecutedBudget` reparten la barra igual y la leyenda del criterio 14 no se mueve. Y la hoja explica la diferencia: leí en pantalla «**Bañarme acabó a las 8:50, así que aquí empieza más tarde.**». Una sola verdad, dicha donde se puede decir. |
| 225 | **cumplido** (era parcial en la tajada 1) | `describePlacementBlocker` **envuelve** a `validatePlacement` y añade la cláusula: «Desde las 10:45 caben 45 min. Elige menos tiempo o empieza antes. **A las 11:30 entra Daily meeting.**» Verificado con mi caso, palabra por palabra. Por abajo nombra al de la izquierda («Bañarme acabó a las 8:50.»). |
| 235 | **cumplido** | La sesión abierta entra como un vecino más (`sessionNeighbour`, `isRunning`), cierra el borde y **no se toca**: el test de la página afirma **cero** `activityFollowUpEdit` y **cero** `activityFollowUpRemove` al registrar, con un cronómetro corriendo. En mi caso puro, su frase va en presente («lleva ocupado hasta las…»), que es lo honrado. |
| 236 | **cumplido, comprobado con `git diff --stat`** | `vida-gap-form.utils.ts`, `VidaPlaceInGapSheet/` y `VidaTemplateGapRow/` **no aparecen en el diff**. Y es cierto **por construcción**: `RealGapWindow` extiende el `GapWindow` estructural, así que `validatePlacement` y compañía se la tragan sin cambiar; la cláusula nueva vive en una función que las envuelve. |
| 237 | **cumplido** | `vida-gap-window.utils.ts` es pura, no importa nada de `vida-execution.utils.ts` (ni tipos: los vecinos entran en forma plana, sin ciclo) y trae su propio archivo de test. Los casos que el criterio pide están, y los he vuelto a escribir yo por fuera. |

**Que la hoja siga entera para los otros dos caminos**

`VidaLogSessionSheet` es cruce de FEAT-004, FEAT-008 y FEAT-013. Lo nuevo entra
por el mismo sitio que la tajada 1 —`anchor = mode === 'log' ? gapWindow : null`—
y las dos funciones nuevas devuelven `null` con una ventana del plan, que
comprobé explícitamente. Así: **«Empezar algo» no se entera** (su `anchor` es
`null` por construcción) y **«Registrar tiempo pasado» de la cabecera tampoco**
(se abre sin ventana). Su archivo de test no pierde ni una afirmación.

**Lo que no se puede guardar, no se guarda**

Por arriba y por abajo, con las mutaciones espiadas: los tests de la página
afirman `Registrar` **deshabilitado** y `createFollowUp` **sin llamadas** cuando
lo elegido se pisa con el vecino real —el de la izquierda y el de la derecha— y,
además, el aviso se lee **sin pulsar nada**. Lo mío por el lado puro:
`describePlacementBlocker` devuelve mensaje —y por tanto la hoja apaga Guardar—
en todos los casos de solape que probé.

**Estados, medidos por mí** (y lo digo igual de claro que él: **las cifras son
del DOM**, aunque esta vez la hoja se dejó ver): a 375 px, `scrollWidth ===
clientWidth === 375` y **0 nodos desbordados** en claro y en oscuro; la línea
que explica el desplazamiento llega a **7,88:1** en oscuro.

**Línea base, corrida entera por mí**

| Qué | `ENVIRONMENT.md` | Constructor | **Medido ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos |
| `pnpm test` | 2 de 1692 | 2 de 1718 | **2 fallidos de 1718**, 111 archivos de 112 en verde |
| `pnpm build` | 1.102,43 kB | 1.105,14 kB | **exit 0**, `index` **1.105,14 kB** (+2,71), `app-icons` **620,20 kB sin tocar** |

**Hallazgos — se anotan, no devuelven la tajada**

1. **La ventana degenerada dice la misma hora dos veces.** Cuando un vecino se
   come el hueco entero, la ventana queda vacía y el aviso sale «Aquí cabe algo
   entre las 11:40 y las 11:40.» Bloquea bien —que es lo que importa— pero la
   frase es rara; con ventana vacía cabría decir algo del tipo «aquí ya no queda
   rato libre».
2. **El «pasado» sigue decidiéndose en dos sitios** (hallazgo de la tajada 1, no
   resuelto aquí ni le tocaba).
3. **`ENVIRONMENT.md` vuelve a quedarse corto** (hoy **1718** tests y
   **1.105,14 kB**). **No lo he tocado.**

**Intendencia:** el dev server que el constructor arrancó desde
`.claude/launch.json` **sigue vivo en el 5173** y es el que he usado; yo tampoco
tengo `preview_stop`, así que **queda vivo** para quien venga. No he arrancado
ninguno.

**Lo que no he podido revisar:** el recorrido con sesión —registrar en el hueco
de ayer con el dedo y ver que el borde real es el que manda—, y el criterio 251.
