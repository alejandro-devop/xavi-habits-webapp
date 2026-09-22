---
id: FEAT-009
title: Los huecos llegan a la plantilla — el tiempo libre entre ítems, y un toque lo llena
status: building
architect: yes    # la geometría del hueco ya existe dos veces (Hoy y la plantilla) y el final de un ítem de plantilla es derivado y puede no existir: decidir de dónde sale el hueco y cómo se precarga el alta es código compartido, no una tajada
area: features/vida
requested: 2026-09-22
updated: 2026-09-22
---

# FEAT-009 — Los huecos llegan a la plantilla

> **D1 resuelta por el usuario el 2026-09-22: FEAT-008 va primero.** Se construye
> «horas y minutos» y después los huecos, para que la precarga nazca ya contra los dos
> campos y no haya que rehacerla. El traspaso queda como lo escribió el analista:
> FEAT-009 entrega **minutos enteros + `HH:mm`**, FEAT-008 los reparte, y **su hora de
> fin tiene que ser el final del hueco**. No se fusionan: cada una se entrega sola.

> **D2 resuelta: render APROBADO el 2026-09-22** («así lo tenía en mi cabeza»).
> `docs/vida/assets/10-vida-huecos-plantilla.html` —marco A a 375 px con las tres formas
> del hueco (normal y pulsable, fino de menos de 15 min que se ve pero no se pulsa, y la
> línea del ítem sin duración que dice que no se sabe dónde acaba) y el panel «Añadir a mi
> Vida» con hora y duración precargadas del hueco entero—. **La tajada 1 puede arrancar**
> en cuanto FEAT-008 entregue (D1: FEAT-008 va primero).

## 1. La petición — feature-analyst

**Resumen para quien venga detrás:** en `/app/vida/plantilla`, entre un ítem y
el siguiente (y en los bordes del día), una fila que dice el tiempo libre que
hay; pulsarla abre «Añadir a mi Vida» con **la hora de inicio y la duración del
hueco ya puestas**, editables antes de guardar. La primera tajada **solo pinta**
los huecos —incluido el caso del ítem sin duración, que no produce hueco sino
una línea que dice que no se sabe—; la segunda es el toque que precarga.

**Qué problema resuelve:** la plantilla es *una agenda* (decisión 13 del plan de
Vida), pero se lee como una lista: se ve lo que hay puesto y **no se ve dónde
cabe lo que falta**. Para meter algo a las 8:40 hoy hay que mirar la tarjeta de
arriba, sumar su duración de cabeza, mirar la de abajo, restar, y entonces
escribir la hora a mano en el panel de añadir. El hueco hace visible la cuenta
que el usuario está haciendo de memoria, y el toque la ahorra entera.

**Para quién:** para el usuario armando o retocando su semana tipo, que es
cuando tiene delante un día medio lleno y quiere saber qué le queda. Es la misma
guía que Hoy le da al planear el día, pero un nivel más arriba: aquí lo que se
arregla se arregla para todas las semanas.

**Palabras del usuario:** «en el listado de actividades en una plantilla me
gustaría ver bloques con el tiempo libre entre ellas y al presionar en el bloque
se auto selecciona la hora y duración del bloque, ya luego el usuario puede
editarla».

### Cuánto de Hoy sirve aquí, y cuánto no

Esto es lo que pesa en esta feature: **casi todo existe ya en `/app/vida/hoy`**
(FEAT-003), y aun así no se puede copiar, porque Hoy es **un día concreto** con
bloques que tienen `startTime` **y `endTime`**, y la plantilla es **una semana
tipo** con ítems que tienen hora y una duración **opcional**. El final de un
ítem de plantilla es **derivado, y puede no existir**. Ahí está la dificultad
entera.

**Sirve tal cual, y no se toca ni se copia:**

- `MIN_GAP_MINUTES` (= 15), `formatTimeForDisplay`, `minutesToTime`,
  `formatDurationFromMinutes`, `parseTimeToMinutes` —
  `src/features/vida/utils/vida-time.utils.ts:84,122`. El umbral y los
  formateadores del módulo son estos y no hay un segundo.
- **La plantilla ya recorre su día con cursor y ya calcula sus tramos libres**:
  `buildTemplateDay` (`src/features/vida/utils/vida-template.utils.ts:175`)
  emite `segments` con `kind: 'free'` (`:218-242`) y un `freeMinutes`
  (`:252`) para la barra de «Tu día». Lo único que a esos tramos les falta es
  **hora de inicio y de fin**: hoy un `TemplateSegment` (`:83`) solo lleva
  `trackMinutes`, porque solo servía para el ancho de la barra. El hueco de
  esta feature **es ese tramo con sus horas**, no una cuenta nueva.
- **`VidaTemplateAddPanel`** (`src/features/vida/components/VidaTemplateAddPanel/VidaTemplateAddPanel.tsx`)
  ya es el destino correcto del toque: tiene estado de `days` (`:78`),
  `startTime` (`:79`) y `durationMinutes` (`:80`), el catálogo buscable, y
  guarda por `useSaveVidaItemForActivity` con `targetItem: null` (`:130`). Le
  faltan **valores iniciales** y que `pick()` (`:107`) deje de vaciarlos.

**No sirve, y por qué (esto es lo que evita construirlo dos veces):**

- **`buildDayAgenda` y `AgendaGap`**
  (`src/features/vida/utils/vida-agenda.utils.ts:53,152`): trabajan sobre
  `ActivityDayPlanItem`, que **tiene `endTime`**. Aquí no lo hay. Adaptarlos
  obligaría a fabricar un `endTime` falso para los ítems sin duración, que es
  exactamente lo que esta feature no puede hacer.
- **`isPast`, `nowMinutes` y `withNowMark`** (`:222,239`): una semana tipo **no
  tiene presente**. Ni se parte el hueco por «ahora», ni hay huecos pasados, ni
  se pinta la marca. Todo ese trozo de Hoy se queda en Hoy.
- **`suggestionsForGap` / `GapSuggestions`** (`:429,489`) y las fichas de
  `VidaAgendaGap`: en Hoy el hueco ofrece **lo que la plantilla propone para ese
  día**. En la plantilla eso sería ofrecer la plantilla dentro de la plantilla.
  Fuera, y no vuelve más adelante.
- **`VidaAgendaGap.tsx` como componente**: es un `<li>` con la canaleta de la
  agenda de Hoy, su tarjeta, sus fichas, su `dayLabel` y su `showTemplateHint`.
  Pasarle media docena de props vacías para apagarle la mitad sale más caro que
  la fila que hace falta aquí. **La fila de la plantilla se parece a su forma
  fina** (`VidaAgendaGap.tsx:79-92`: una línea con su rango y su tamaño) más un
  botón. Que el arquitecto decida si eso es un componente propio pequeño o una
  variante compartida; **lo que no puede pasar es que haya una segunda función
  que calcule huecos en el módulo**.

**Fuera de alcance:** (esto es lo que alguien podría dar por incluido y NO lo está)

- **La cuadrícula de la semana** (`VidaWeekGrid`) y **el cajón de los sin hora**
  (`VidaTemplateNoTimeDrawer`) no cambian: ni una fila de hueco en ninguno.
- **`/app/vida/hoy` no cambia ni una línea.** Nada de lo que se haga aquí toca
  su agenda, sus huecos ni sus fichas.
- **Los campos de duración son de FEAT-008** («horas y minutos», y la hora de
  fin a la vista). Aquí no se re-especifica ni uno; esta feature entrega un
  número de minutos y una hora `HH:mm`, y se para ahí.
- **Las fichas de sugerencia dentro del hueco** (lo que sí tiene Hoy). El hueco
  de la plantilla no ofrece actividades: solo precarga hora y duración.
- **«Sueles tardar»** de FEAT-007 en el panel de añadir. Ver la decisión D3.
- **Mover un ítem que ya existe a un hueco** (arrastrar, o «llévate esto al
  hueco de las 15:00). Sin arrastrar en la v1, decisión 5 del plan.
- **Resolver o bloquear solapes.** FEAT-005 decidió que la plantilla los
  permite; los resuelve «Armar» en Hoy.
- **La barra y las cifras de `VidaTemplateDaySummary`** (`freeMinutes`, «Tu día ·
  5:00 → 22:00») se quedan **exactamente como están**. Esta feature lee esa
  ventana; no la recalcula ni la cambia.
- **Crear una actividad nueva** desde el hueco: eso es del catálogo. Desde el
  hueco se elige una que ya existe.
- **Los bordes del día en ajustes** (`vidaDayStartTime` / `vidaDayEndTime`) y
  **cualquier cosa de backend**.

**Criterios de aceptación:**

> **Desde qué número numero, y que puede moverse:** FEAT-007 dejó el módulo en
> el **106** y FEAT-008 ocupa del **107 al 134**. Numero desde el **140**,
> dejando 135–139 de holgura por si FEAT-008 crece al construirse. Si al final
> se solapan, **renumera esta feature quien la planifique**, no FEAT-008: lo que
> importa es que ningún número se repita dentro del módulo Vida.

*Tajada 1 — los huecos se ven*

- [ ] 140. Entre dos ítems **con hora** del día visible, cuando el final del
      primero (su hora + su duración) es **anterior** al inicio del siguiente, se
      pinta una fila de hueco **entre sus dos tarjetas**, dentro de la misma
      lista `ol` de la agenda, con hora de inicio, hora de fin y tamaño:
      «Libre 8:40 → 9:00 · 20m». Las horas salen de `formatTimeForDisplay` y el
      tamaño de `formatDurationFromMinutes`; **no se escribe un segundo
      formateador**.
- [ ] 141. **Los bordes del día sí llevan hueco**, igual que en Hoy: con «Tu día
      · 5:00 → 22:00» y un único ítem de 8:00 a 9:00, la lista enseña
      **exactamente dos** huecos, 5:00 → 8:00 y 9:00 → 22:00. Si un ítem cae
      fuera del horario, la ventana la manda `buildTemplateDay` (que ya la
      estira) y el hueco se ajusta a ella; **no se inventa un borde propio**.
- [ ] 142. **La lista cuadra con la barra**: en un día en el que todos los ítems
      con hora tienen duración, la suma de los minutos de los huecos pintados es
      **exactamente** el `freeMinutes` que ya enseña «Tu día». (En un día con
      algún ítem sin duración manda el criterio 145 y la diferencia es
      justamente lo que ese criterio no afirma.)
- [ ] 143. Un hueco de **menos de 15 minutos** —`MIN_GAP_MINUTES`, la constante
      que ya usa Hoy; **no se crea una segunda**— se pinta igual, en su forma
      fina: una sola línea «Libre 8:55 → 9:00 · 5m», **sin nada que pulsar**.
      No desaparece: si desapareciera, la barra diría que hay libre donde la
      lista no enseña nada.
- [ ] 144. **Solapes:** si un ítem empieza antes de que acabe el anterior, entre
      los dos **no se pinta ningún hueco** (ni de cero minutos, ni negativo) y
      **no se dice nada del solape** —la plantilla los permite a propósito—. El
      hueco siguiente arranca en el final **más tardío** de los dos, no en el del
      último de la lista. Comprobable: con 8:00–10:00 y 9:00–9:30 el mismo día,
      cero filas de hueco entre ellos y el siguiente hueco empieza a las **10:00**.
- [ ] 145. **Un ítem sin duración no produce un hueco que mienta.** Cuando un
      ítem con hora no tiene duración (`null`, `0` o negativo), entre él y el
      siguiente —o el fin del día— **no se pinta hueco**: en su lugar va una
      línea que dice la verdad, del tipo «No sabemos cuánto dura *Working at
      lululemon*, así que no podemos decir qué queda libre hasta las 9:00», y
      **nada de esa línea es pulsable como hueco**. No se inventa una duración,
      no se asume cero, y no se toma la de otro día ni la del catálogo.
- [ ] 146. Si el ítem sin duración es **el último con hora del día**, esa línea
      habla del fin del día: «…hasta las 22:00». Con **dos seguidos sin
      duración**, sale **una línea por cada uno** y **ningún hueco entre ellos**.
- [ ] 147. **Ni una consulta nueva**: pintar los huecos se deriva de los
      `VidaItem` que la pantalla ya tiene. Entrar en la plantilla hace **el mismo
      número de llamadas al API que antes** (comprobable con espías).
- [ ] 148. **Solo en la vista de día.** `VidaWeekGrid` y
      `VidaTemplateNoTimeDrawer` no pintan ninguna fila de hueco y su diff está
      vacío o es trivial.
- [ ] 149. Un día **sin ningún ítem con hora** no pinta huecos: sigue siendo el
      estado vacío de siempre. **No** se pinta «Libre 5:00 → 22:00» en un día
      vacío.
- [x] 150. **Móvil, el alto y el dedo.** *(Reescrito el 2026-09-22, en la
      tajada 2, por decisión del usuario: el revisor y la sesión coincidieron en
      que la redacción vieja —«menos de la mitad que una tarjeta»— era una regla
      de **densidad visual**, escrita cuando esta fila era **texto**. Desde la
      tajada 2 la fila es **el atajo principal para llenar el día**, y una regla
      de densidad no puede gobernar un control: fallar el toque abre la hoja del
      ítem de arriba y cuesta dos pasos y una corrección, justo lo que prohíbe
      «La premisa que manda sobre todo lo demás» de `docs/vida/PLAN.md`.)*
      A 375 px, una fila de hueco ocupa **una sola línea de texto**, el hueco
      **pulsable** mide **44 px o más de alto** —la medida que el módulo ya fijó
      en esta misma pantalla con los campos de FEAT-008— y **no pasa de dos
      tercios** del alto de una tarjeta de ítem del mismo día (medido con
      `getBoundingClientRect`). El hueco **fino** y la **línea del ítem sin
      duración**, que no se pulsan, quedan como estaban. Con seis ítems y sus
      huecos no hay scroll horizontal.

- [ ] 151. **Texto largo**: la fila de hueco **no imprime ningún nombre de
      actividad**, así que un nombre de 60 caracteres no la cambia. La línea del
      criterio 145, que sí nombra el ítem, **envuelve** con 60 caracteres y no
      desborda a 375 px.
- [ ] 152. El hueco **se distingue de una tarjeta de ítem sin depender del
      color** (su texto empieza por «Libre») y su texto se lee en claro y en
      oscuro con contraste ≥ 4,5:1.

*Tajada 2 — el toque precarga la hora y la duración*

- [ ] 153. Pulsar un hueco de **15 minutos o más** abre **«Añadir a mi Vida»** —
      `VidaTemplateAddPanel`, dentro de `VidaTemplateAddSheet` en móvil; en
      escritorio el panel del lateral, que ya está a la vista— con **el día
      visible marcado**, **la hora de inicio del hueco** en «A qué hora» y **la
      duración del hueco** en «Cuánto». **No** abre la hoja del ítem
      (`VidaActivitySheet`): en la plantilla añadir es **elegir una actividad del
      catálogo**, y eso es lo que hace este panel.
- [ ] 154. **La precarga sobrevive a elegir la actividad.** Hoy `pick()`
      (`VidaTemplateAddPanel.tsx:107`) vacía `startTime` y `durationMinutes` al
      elegir; después de esta tajada, elegir una actividad **conserva** la hora y
      la duración venidas del hueco. Abriendo el panel por el «+» flotante, sigue
      vaciándolas como siempre.
- [ ] 155. **La duración precargada es la del hueco entero**, sin tope y sin
      redondeo: un hueco de 8:40 a 9:00 precarga **20** minutos; uno de 5:00 a
      8:00 precarga **180**. Es una propuesta: se ve antes de guardar y se puede
      cambiar.
- [ ] 156. **Pulsar un hueco no guarda nada.** Con espía sobre
      `useSaveVidaItemForActivity`: pulsar tres huecos seguidos y cerrar el panel
      da **cero** mutaciones.
- [ ] 157. Guardar desde un hueco usa **la puerta de siempre**
      (`useSaveVidaItemForActivity` con `targetItem: null`) y el cuerpo que viaja
      es **idéntico** al de escribir esa hora y esa duración a mano: **ni un
      campo nuevo** (comprobable con `toEqual` sobre el cuerpo).
- [ ] 158. **La lista se recoloca sola, sin recargar**: guardando 20 min a las
      8:40 en el hueco 8:40 → 9:00, ese hueco desaparece y el ítem queda en su
      sitio. Guardando **20 min** en un hueco 8:40 → 9:40, queda un hueco
      **9:00 → 9:40**. Guardando algo **más largo** que el hueco, se guarda igual
      y a partir de ahí manda el criterio 144.
- [ ] 159. **Escritorio (1280 px):** pulsar un hueco **no abre ninguna hoja
      encima** —el panel ya está en el lateral—: se rellenan sus campos, **el
      foco va al buscador de actividades** del panel, y el panel dice de qué
      hueco viene («para las 8:40 · 20m libres»). La página no da saltos.
- [ ] 160. Pulsar **otro** hueco con el panel ya abierto **sustituye** la hora y
      la duración por las del hueco nuevo —pulsar un hueco es decir «lo quiero
      aquí»— y **no toca** la actividad ya elegida ni los días marcados.
- [ ] 161. **Lo que no se pulsa no se pulsa**: el hueco fino (<15 min) y la línea
      del criterio 145 no son `button`, no tienen `role="button"` y no responden
      a `Enter`.
- [ ] 162. **Teclado y lector**: cada hueco pulsable es un `<button>` alcanzable
      con `Tab` en el orden del día, con un `aria-label` que dice hora y tamaño
      («Poner algo a las 8:40, 20 minutos libres»).

*Tajada 3 — el ítem sin duración deja de tapar el hueco*

- [ ] 163. La línea del criterio 145 trae **una sola salida**, «Ponerle
      duración», que abre **la hoja de ese ítem** —la que ya existe, la misma de
      FEAT-005— con «Cuánto» a la vista y con el foco puesto ahí. No abre un
      segundo sitio donde poner duración.
- [ ] 164. Al guardar la duración y volver a la lista, **el hueco que antes no se
      podía afirmar aparece** en su sitio, sin recargar, y la línea de «no
      sabemos» desaparece.
- [ ] 165. Si el usuario **cierra sin guardar**, la línea sigue ahí y no se ha
      cambiado nada del ítem.

*Transversales*

- [ ] 166. **Ni una palabra de reproche** en nada de lo nuevo: no aparecen
      «vacío», «desperdicio», «perdido», «sin aprovechar», «deberías». Un rato
      sin nada es **libre**.
- [ ] 167. **No se duplica nada**: el diff **no copia** `vida-agenda.utils.ts`,
      no copia `VidaAgendaGap`, y **no añade ninguna función nueva que convierta
      minutos en texto ni minutos en `HH:mm`**. La geometría del hueco de la
      plantilla sale de **un solo sitio** (por defecto, `buildTemplateDay`, que
      ya la recorre).
- [ ] 168. **Nada de backend**: ni un documento GraphQL, ni clave de caché, ni
      invalidación, ni ruta, ni clave de `localStorage` nuevas.
- [ ] 169. **Línea base no peor**: typecheck limpio, lint 14/0, los mismos 2
      fallos preexistentes de `SearchSelect`, `pnpm build` exit 0.
- [ ] 170. **El encaje con FEAT-008** (solo comprobable si FEAT-008 ya está
      entregada): la duración que precarga el hueco se lee en los campos de horas
      y minutos **ya repartida** —un hueco de 90 min deja «1» y «30», nunca «90»
      en el campo de minutos— y la **hora de fin** que enseña FEAT-008 coincide
      **exactamente** con el fin del hueco mientras no se toque nada. FEAT-009
      entrega **minutos enteros y un `HH:mm`**; no escribe ninguna etiqueta de
      duración en esos campos.
- [ ] 171. **Solo lo puede cerrar el usuario**: `/app/vida/plantilla` está detrás
      del login. La vista real a 375 px, en claro y en oscuro, el toque en un
      hueco con la mano y el guardado contra el API de verdad son suyos.

**Tajadas:**

| # | Qué hace | Estado |
|---|---|---|
| 1 | **Los huecos se ven.** Entre ítems, antes del primero y después del último, con su rango y su tamaño; los de menos de 15 min en línea fina; los solapes sin hueco; y el ítem sin duración con su línea que no miente. Nada se pulsa todavía. Ya sirve: la plantilla se lee como agenda y se ve dónde queda sitio. | aceptada |
| 2 | **El toque precarga.** Pulsar un hueco abre «Añadir a mi Vida» con la hora y la duración del hueco puestas, se elige actividad y se guarda. Es lo que pidió el usuario, entero. | aceptada |
| 3 | **El ítem sin duración deja de tapar el hueco.** Su línea ofrece «Ponerle duración», que abre la hoja del ítem; al guardarla aparece el hueco que faltaba. Cierra el caso de la captura. | pendiente |

**¿Arquitecto? Sí**, porque hay que decidir **de dónde sale el hueco** cuando la
misma geometría ya existe dos veces —`buildDayAgenda` (`vida-agenda.utils.ts:152`)
y `buildTemplateDay` (`vida-template.utils.ts:175`)— y porque la precarga es un
**contrato entre tres sitios** (la fila del hueco, `VidaTemplateAddPanel` y los
campos que FEAT-008 está reescribiendo ahí mismo). Elegir mal deja el módulo con
dos funciones que calculan lo mismo con reglas distintas, que es justo lo que el
protocolo quiere evitar. Mi hipótesis, **marcada como hipótesis y no como
diseño**: extender `TemplateSegment` (`vida-template.utils.ts:83`) con las horas
que ya se conocen en el bucle, más una marca de «final desconocido» para el
criterio 145. El arquitecto puede tirarla.

**Decisiones que no son mías:**

- **D1 — el orden con FEAT-008. Mi recomendación: FEAT-008 primero.** Las dos
  tocan el mismo sitio (la creación/edición de un ítem de la plantilla), y
  **FEAT-008 es dueña de los campos de duración**. Si va primero: FEAT-009
  precarga contra los campos definitivos y su criterio 170 se comprueba de una
  vez; además la «hora de fin» de FEAT-008 (su criterio 120, que llega
  explícitamente al panel «Añadir a mi Vida») es lo que hace **verificable a
  ojo** que el hueco precargó bien —la hora de fin que se lee tiene que ser el
  final del hueco—. Si va después: FEAT-009 precarga un campo único de minutos
  que FEAT-008 va a sustituir, y el traspaso se construye dos veces.
  **No son una sola feature**, y lo digo con su razón: FEAT-008 es útil sin un
  solo hueco (mejora todo el escribir tiempo del módulo, en cinco pantallas) y
  FEAT-009 es útil con el campo único de minutos (precargaría «20»). Cada una se
  entrega sola; fusionarlas haría una feature con siete tajadas.
  **El traspaso, escrito:** FEAT-009 → FEAT-008 pasa **un entero de minutos y un
  `HH:mm`**, nada más. FEAT-008 → FEAT-009 se compromete a que esos campos
  **acepten valores iniciales** y a que la hora de fin salga de ellos.
- **D2 — ¿hace falta render aprobado? Mi opinión: sí, y es barata.** No es una
  pantalla nueva —la regla 6 del plan habla de pantallas—, pero **un bloque entre
  cada par de ítems cambia el ritmo vertical de toda la lista en móvil**, que es
  precisamente lo que un render decide y lo que un constructor no debería estar
  inventando. Pido **un solo render, del marco A** (el día en móvil a 375 px) con
  las tres formas en la misma pantalla: un hueco normal pulsable, un hueco fino,
  y **el ítem sin duración con su línea** —el caso de la captura—. No hace falta
  render del escritorio ni de la semana: el panel lateral ya está aprobado en
  `assets/06-vida-plantilla.html` (marco C) y aquí solo se rellena.
  **Con la regla como está escrita, esto no se construye hasta que ese render se
  apruebe.** Si el usuario decide que no hace falta, que lo diga y la tajada 1
  arranca.
- **D3 — «Sueles tardar» (FEAT-007) aquí: decidido por mí, no aplica, y es
  reversible en una línea.** La duración precargada es **la del hueco**, y no la
  sustituye en silencio la duración habitual de la actividad que se elija. Razón:
  el tamaño del hueco es un hecho **del día** y el «sueles tardar» es un hecho
  **de la actividad**; pisarle al usuario lo que acaba de señalar con el dedo es
  justo lo que FEAT-007 decidió no hacer en ninguna pantalla (ningún aviso cambia
  nada por su cuenta). Lo que **sí** encaja más adelante, y queda fuera de esta
  feature: enseñar en el panel el `VidaPatternAdvice` que FEAT-007 ya pinta bajo
  «Cuánto» en la hoja del ítem, como línea informativa junto al campo. Es añadir
  un componente que ya existe; no requiere decidir nada nuevo.
- **D4 — el hueco de menos de 15 minutos: decidido por mí, y aviso de que es
  discutible.** Se pinta (para que la lista cuadre con la barra) pero **no se
  pulsa**, reutilizando el umbral `MIN_GAP_MINUTES` de Hoy en vez de estrenar
  otro. El contraargumento es real y del propio módulo: «lavarme los dientes»
  cabe en un hueco de 10 minutos. Si el usuario quiere que también esos se
  pulsen, es cambiar una condición y el criterio 143. No lo bloqueo.
- **D5 — el problema tras la solución: preguntado a medias.** El usuario pidió
  una solución concreta y la he escrito tal cual. El problema que leo detrás —«no
  veo dónde cabe lo que falta»— es mi lectura, no sus palabras; sus palabras
  están arriba enteras. No se le preguntó por él para no gastar turnos: si la
  lectura está torcida, lo que sobra o falta se ve en los criterios 140–145.

## 2. El plan — feature-architect

**Resumen para el constructor:** la geometría del hueco **ya se recorre entera**
en el bucle de `buildTemplateDay` (`vida-template.utils.ts:216-249`), que hasta
sus horas conoce —las mete en el `id` del tramo, `free-8:40-9:00`— y las tira;
el trabajo es **emitir una fila más en ese mismo bucle**, no escribir una
segunda función. La implementación de referencia es
`src/features/vida/components/VidaTemplateItemCard/VidaTemplateItemCard.tsx`:
es el `<li>` vecino en la misma `ol`, con la canaleta de la hora y el contrato
de «sin la prop de acción soy lectura pura, con ella soy un `<button>`», que es
exactamente lo que separa las tres formas del render. **No crees** ni una
función de huecos, ni un umbral, ni un formateador: `MIN_GAP_MINUTES`,
`formatTimeForDisplay` y `formatDurationFromMinutes` ya existen y son los del
módulo.

### Lo que ya existe (verificado abriendo los archivos, no el grafo)

**La geometría, ya escrita y correcta** —
`src/features/vida/utils/vida-template.utils.ts`:

- `buildTemplateDay` (`:175`) ordena los ítems con hora (`:183-187`), calcula
  `startMinutes` / `endMinutes` / `durationMinutes` (`:192-200`) y **estira la
  ventana** cuando algo cae fuera del horario (`:204-212`) — de ahí salen
  `windowStart` y `windowEnd`, que son **los bordes del día** del criterio 141.
  No hay ningún borde que inventar.
- `pushGap(from, to)` (`:216-224`) **ya tiene las dos horas**: las escribe en el
  `id` (`free-${minutesToTime(from)}-${minutesToTime(to)}`) y luego se queda solo
  con `trackMinutes`. El `if (to <= from) return` de `:217` **es el criterio 144
  ya implementado**, y el `cursor = Math.max(cursor, entry.endMinutes)` de `:245`
  es «el hueco siguiente arranca en el final más tardío».
- Un ítem **sin duración** tiene hoy `endMinutes === startMinutes` (`:197`) y
  `trackMinutes === 0` (`:241`), así que no empuja tramo `planned` y **el hueco
  que le sigue se emite tal cual**: eso es exactamente la mentira que prohíbe el
  criterio 145. Es el único sitio donde hay que decidir algo.
- `TemplateSegment` (`:83-87`) solo lleva `id`, `kind` y `trackMinutes`. Los
  tramos `free` son los del criterio 142: `freeMinutes` (`:258`) se calcula como
  `dayMinutes − plannedMinutes`, **no** desde los tramos, así que tocar la lista
  de filas no puede mover la barra.

**El umbral y los formateadores** — `src/features/vida/utils/vida-time.utils.ts`
(la sección 1 los cita en `:84,122`; los reales son estos):

- `MIN_GAP_MINUTES = 15` en **`:167`**. `formatDurationFromMinutes` en **`:84`**
  («20m», «3h», «7h 15»). `formatTimeForDisplay` en **`:155`** («8:40», sin cero
  delante). `minutesToTime` y `parseTimeToMinutes` ya se importan en
  `vida-template.utils.ts`.
- Ojo con el render: pinta «3 h» y «7 h 15» y `formatDurationFromMinutes`
  devuelve «3h» y «7h 15». **Manda el criterio 140** (ese formateador y no un
  segundo); la diferencia es un espacio y no se toca el formateador por ella.

**La forma visual, para copiar de un sitio concreto:**

- `VidaTemplateItemCard.tsx:96` — `<li className={styles.row}>`, y su
  `.module.scss:6-30` tiene la canaleta (`.gutter`, `flex: 0 0 2.75rem`,
  alineada a la derecha) y `.time`. La fila de hueco **tiene que usar esas
  mismas medidas** o las horas dejan de estar en columna.
- `VidaPlantillaPage.module.scss:39` — `.agenda` es un `flex column` con
  `gap: .45rem` y `list-style: none`. Las filas nuevas entran ahí sin tocar el
  contenedor.
- `VidaAgendaGap.tsx:79-92` — **la forma fina ya está escrita** (canaleta +
  `<p>Libre {rango} · {tamaño}</p>`, sin nada pulsable). Se **imita el JSX**, no
  se importa el componente (la sección 1 ya razonó por qué).

**La puerta de la precarga, confirmada en el código de FEAT-008 (`c789d0a`):**

- `VidaDurationPills` guarda un borrador `{hours, minutes}` y el último valor
  emitido, y **se re-reparte en render cuando `value` llega distinto de lo
  emitido**. El revisor lo probó por los dos lados (dossier de FEAT-008, sección
  4, «La regla de sincronización del borrador»). Traducción para esta feature:
  **basta con que `durationMinutes` cambie en el padre**; los dos campos se
  reparten solos y el criterio 170 (90 → «1» y «30») sale gratis.
- El padre es `VidaTemplateAddPanel.tsx:80` (`setDurationMinutes`) y `:79`
  (`setStartTime`), cableados en `:294-317`. La hoja del ítem usa
  `patchTemplate` (`VidaActivitySheet.tsx:208`, campos en `:576` y `:602`) —
  **esa no la toca esta feature salvo en la tajada 3, y solo para el foco**.
- **`pick()` (`:107-113`) vacía `setStartTime('')` y `setDurationMinutes(null)`**
  además de `setDays([day])`. Es el hallazgo que rompe la feature entera y está
  resuelto abajo, en la tajada 2.

**Lo que existe y NO se toca (y una duplicación que ya estaba ahí):**

- `vida-agenda.utils.ts` — `buildDayAgenda` (`:152`), `AgendaGap` con su
  `isSliver` (`:221`), `formatGapRange` (`:330`). **`formatGapRange` no sirve**:
  pide un `AgendaGap` y además escribe «10:30 – 13:00» con raya, no con flecha.
  El rango se compone en el JSX como en `VidaAgendaGap.tsx:82-90`; componer dos
  llamadas a `formatTimeForDisplay` **no es un formateador nuevo** (criterio 167).
- **La geometría del hueco está en el módulo tres veces, no dos** (la sección 1
  contaba dos): además de `buildDayAgenda` y `buildTemplateDay` está
  `vida-execution.utils.ts:694`, que vuelve a calcular `isSliver` para el día
  contado. Y **hay un segundo umbral de 15 minutos**: `MIN_PLACEMENT_MINUTES` en
  `vida-gap-form.utils.ts:34`, gemelo de `MIN_GAP_MINUTES`. **Ninguna de las dos
  cosas es de esta feature** —las dos son de Hoy— pero quedan anotadas: si
  alguien cambia el 15, hoy hay que cambiarlo en dos sitios. No lo arregles
  aquí; sería un cambio en `/app/vida/hoy`, que está fuera de alcance.
- `vida-gap-form.utils.ts` entero (`GapWindow`, `buildStartTimeOptions`,
  `validatePlacement`, `toDayPlanTimes`) y `VidaPlaceInGapSheet`: **son de Hoy**
  y trabajan sobre `AgendaGap`. La plantilla no valida colocaciones ni topa la
  duración (criterio 155: sin tope y sin redondeo). No se importan.
- `VidaTemplateDaySummary.tsx` (barra y cifras), `VidaWeekGrid`,
  `VidaTemplateNoTimeDrawer`: **diff vacío** (criterios 148 y el «fuera de
  alcance» de la sección 1).
- `src/features/vida/vida-vocabulary.test.ts` recorre los archivos del módulo
  por glob: el criterio 166 lo cubre solo, **sin añadir nada**, en cuanto los
  archivos nuevos vivan bajo `src/features/vida/`.

**Lo que no existe en ninguna parte:** una fila de hueco para la plantilla, una
línea de «no sabemos cuánto dura», y cualquier forma de precargar hora y
duración en `VidaTemplateAddPanel` (hoy solo se escriben a mano). Eso es lo
nuevo, y no hay medio hecho de ello.

### Implementación de referencia

**`src/features/vida/components/VidaTemplateItemCard/VidaTemplateItemCard.tsx`**
(+ su `.module.scss` y su `index.ts`).

Por qué esa y no `VidaAgendaGap`: es **el vecino en la misma lista** —mismo
`<li>`, misma canaleta, mismo módulo de estilos, mismo barril— así que copiarla
mantiene la columna de horas alineada sin inventar medidas; y porque su
contrato de props es literalmente el que separa las tres formas del render:
*«sin `onOpen` sigue siendo un `<article>` de solo lectura; con `onOpen` el
cuerpo se pinta como un `<button>` —no un `div` con `onClick`— para que llegue
el teclado gratis»* (`:87-97`). Aplicado aquí: **sin `onPlace` la fila es
texto** (hueco fino y línea de «no sabemos», criterio 161), **con `onPlace` es
un `<button>`** (criterio 162). De `VidaAgendaGap.tsx:79-92` se copia solo el
JSX de la línea fina y su vocabulario («Libre …»).

### Dónde va el código nuevo

**La decisión que pedía el dossier: el derivado vive dentro de
`buildTemplateDay`, en el mismo bucle.** No en una función nueva que vuelva a
recorrer el día, y no en la página.

`src/features/vida/utils/vida-template.utils.ts` — **modificar**:

1. `:83-87`, `TemplateSegment`: añadir `startMinutes` y `endMinutes` (ya se
   conocen en las dos inserciones, `:219-223` y `:242-246`). Es aditivo; quien
   lee `trackMinutes` no se entera.
2. Justo después, **tipos nuevos exportados**:
   `TemplateRow = TemplateItemRow | TemplateGapRow | TemplateUnknownRow`, con
   `kind: 'item' | 'gap' | 'unknown'`; `gap` lleva `startMinutes`, `endMinutes`,
   `minutes` e `isSliver` (`minutes < MIN_GAP_MINUTES`, importado, **no
   redefinido**); `unknown` lleva `item`, `untilMinutes` y `isDayEnd`.
3. `TemplateDay` (`:89-105`): campo nuevo `rows: TemplateRow[]`, documentado
   como «la misma geometría que `segments`, con las horas y con la regla del
   criterio 145; `segments` y `freeMinutes` no cambian».
4. El bucle `:238-249`: `pushGap` empuja **además** la fila, y el bucle empuja
   la fila del ítem. La regla, entera:
   - `placed.length === 0` → `rows` queda **vacío** (criterio 149; hoy `pushGap`
     final pintaría un hueco de todo el día).
   - Tras empujar la fila del ítem: si su `durationMinutes` es `null` o `<= 0`,
     se recuerda como `pendingUnknown` y **no se emite hueco** hasta el
     siguiente corte.
   - En cada corte (el `startMinutes` del siguiente ítem, o `windowEnd`): si hay
     `pendingUnknown`, se emite una fila `unknown` con `untilMinutes` = ese corte
     e `isDayEnd` = si el corte es `windowEnd` (criterios 145 y 146), y se
     limpia; si no, y el corte es mayor que el cursor, fila `gap`.
   - `segments` **se sigue empujando igual en los dos casos**: la barra no se
     mueve y el criterio 142 se cumple exactamente en los días sin ítems sin
     duración.
   - **Borde no cubierto por ningún criterio, decídelo y déjalo en un test:**
     ítem sin duración cuyo corte siguiente es **anterior o igual** a su propia
     hora (dos ítems a la misma hora). Recomendación: emitir la línea igual con
     `untilMinutes = Math.max(corte, item.startMinutes)`; nunca un hueco.
5. `src/features/vida/utils/vida-template.utils.test.ts` — un `describe` nuevo
   **al final** (el archivo ya prueba `buildTemplateDay` en `:93` y la suma de
   `segments` en `:130,143,155`; no se toca nada de arriba): criterios 140, 141,
   142 (suma de filas `gap` === `day.freeMinutes`), 143, 144, 145, 146, 149.

`src/features/vida/components/VidaTemplateGapRow/` — **crear** (`.tsx`,
`.module.scss`, `index.ts`, molde exacto de `VidaTemplateItemCard/`):

**Un solo componente para las tres formas**, `VidaTemplateGapRow({ row, onPlace,
onSetDuration })`, con tres ramas dentro del mismo archivo y el mismo
`.module.scss` —igual que `VidaAgendaGap` resuelve fina y normal en un archivo—:

- `row.kind === 'gap'` y `!row.isSliver` y hay `onPlace` → `<li>` + canaleta con
  la hora + `<button>` con «Libre 8:40 → 9:00 · 20m» y el «+» del render, con
  `aria-label` «Poner algo a las 8:40, 20 minutos libres» (criterio 162).
- `row.kind === 'gap'` y `row.isSliver` (o sin `onPlace`) → la línea fina,
  copiada de `VidaAgendaGap.tsx:79-92`: un `<p>`, cero elementos pulsables
  (criterios 143 y 161).
- `row.kind === 'unknown'` → la línea gris del render (`assets/…:162-165`):
  «No sabemos cuánto dura **X**, así que no podemos decir qué queda libre hasta
  las 14:00» (o «…hasta el final del día», según `isDayEnd`). Sin `onSetDuration`
  no lleva salida (tajada 1); con ella lleva «Ponerle duración» (tajada 3).
  **Es lo único que imprime un nombre de actividad**, y por eso es lo único que
  tiene que envolver con 60 caracteres (criterio 151).

`src/features/vida/pages/VidaPlantillaPage.tsx` — **modificar**:

- `:410-421`: la `ol` pasa a mapear `templateDay.rows` en vez de
  `templateDay.timed`; `kind === 'item'` sigue pintando `VidaTemplateItemCard`
  con las mismas props; los otros dos, `VidaTemplateGapRow`. La condición de
  `:411` (`templateDay.timed.length > 0`) **se queda**: es el criterio 149.
- `:3-12`: un `import` más.
- `src/features/vida/pages/VidaPlantillaPage.test.tsx` — `describe` nuevo al
  final del bloque de la agenda (`:207`), sin tocar los de arriba.

**Tajada 2 — el contrato de la precarga, con líneas:**

`VidaTemplateAddPanel.tsx`:

- Props nuevas, **aditivas** (`:35-44`): `gapPrefill?: { token: number;
  startTime: string; durationMinutes: number; label: string } | null`. El
  `token` es lo que distingue «otro hueco con los mismos valores» de «nada nuevo»
  (criterio 160); lo lleva la página.
- Sincronización **en render, no en `useEffect`**, con el mismo patrón que
  FEAT-008 dejó probado en `VidaDurationPills` (un `useState` con el último token
  aplicado; escribir una `ref` en render da **dos errores de lint nuevos** en
  este repo — medido en FEAT-008, no lo repitas): al cambiar el token,
  `setStartTime(prefill.startTime)` y `setDurationMinutes(prefill.durationMinutes)`
  y **nada más** —ni `picked`, ni `days`— (criterio 160).
- **`pick()` (`:107-113`)**: `setStartTime('')` y `setDurationMinutes(null)` pasan
  a ejecutarse **solo si no hay `gapPrefill` activo**. Con el «+» flotante
  `gapPrefill` es `null` y sigue vaciando como siempre (criterio 154, las dos
  mitades). `setDays([day])` y `setDaysError(null)` no cambian.
- Tras guardar (`:142-146`, `onSuccess`) se avisa a la página para que suelte el
  prefill: si no, el siguiente `pick()` seguiría conservando horas viejas.
- La línea del render «Viene del hueco que pulsaste» / «para las 8:40 · 20m
  libres» (criterio 159): un `<p>` bajo `styles.head` (**`:245-253`**), pintado
  solo con `gapPrefill`. Vale para el escritorio y para la hoja de móvil: una
  sola implementación.
- El foco al buscador (criterio 159): `ref` en el `Input type="search"` del
  final (**`:341-347`**), enfocado al aplicar un token nuevo cuando no hay
  actividad elegida. **Sin `scrollIntoView`** — el criterio pide que la página no
  dé saltos.
- `VidaTemplateAddSheet.tsx` **no se toca**: ya hace `{...panel}` (`:22,33`).

`VidaPlantillaPage.tsx`:

- Estado `gapPrefill` junto a `addOpen` (`:90-130`), un `token` que sube en cada
  toque; el `onPlace` de la fila lo fija y, **en móvil**, abre la hoja
  (`setAddOpen(true)`, como el FAB de `:455`). En escritorio no abre nada: el
  panel del aside (`:446`) ya está a la vista.
- Se pasa `gapPrefill` a los **dos** montajes del panel (`:446` y `:462`).

`VidaTemplateGapRow.tsx`: se empieza a pasar `onPlace` (el componente ya lo
admite desde la tajada 1; en la tajada 1 nadie lo pasa y la fila es texto).

**El panel no tiene archivo de test propio**: su cobertura vive en
`VidaPlantillaPage.test.tsx:634` («Añadir a mi Vida», criterios 29-34 y 40). Los
criterios 153-162 van ahí, en un `describe` nuevo; los espías de
`useSaveVidaItemForActivity` (criterios 156 y 157) ya tienen molde en ese mismo
archivo.

**Tajada 3 — la salida de la línea que no sabe:**

- `VidaActivitySheet.tsx`: prop **aditiva** `focusDuration?: boolean` (junto a
  `lockActivity`, `:80-90`), que al abrir lleva el foco al campo «Cuánto»
  (`:595-605`) y lo deja a la vista. La hoja **ya se monta con `key` por
  apertura** (`VidaPlantillaPage.tsx:474-479`), así que basta con un efecto de
  montaje; no hace falta resincronizar nada. **No se toca `VidaDurationPills`**.
- `VidaPlantillaPage.tsx:143-147`: `openSheet(item, { focusDuration })`, y el
  valor viaja a la hoja en `:481-494`. La línea `unknown` recibe
  `onSetDuration={(item) => openSheet(item, { focusDuration: true })}`.
- Criterio 164 (al guardar la duración aparece el hueco, sin recargar): sale
  solo — la lista se deriva de `items`, que la mutación ya invalida. **Hay que
  probarlo**, no darlo por hecho.

### Lo que NO hay que crear

- **Ninguna función que calcule huecos.** Ni `buildTemplateGaps`, ni
  `buildTemplateRows` aparte, ni un `useMemo` en la página. Una sola pasada, la
  que ya existe (criterio 167).
- **Ningún umbral nuevo** (`MIN_GAP_MINUTES` se importa) ni **ningún formateador
  nuevo** (criterios 143 y 167).
- **Ningún componente de hueco de Hoy reutilizado ni copiado**: `VidaAgendaGap`
  se mira, se imita la línea fina, no se importa.
- **Nada en la capa de datos**: ni documento GraphQL, ni hook, ni clave de caché,
  ni `localStorage`. La lista se deriva de los `VidaItem` que la pantalla ya
  tiene (criterios 147 y 168).
- **Ni una línea de hora de fin.** El «→ Acaba a las 11:30» que dibuja el render
  es de **FEAT-008 tajada 2, que no está construida** (su tajada 1 sí, en
  `c789d0a`). Si FEAT-008 entrega su tajada 2 antes, esa línea aparece sola.
- **Ningún cambio en la barra de `VidaTemplateDaySummary`**, en `VidaWeekGrid` ni
  en `VidaTemplateNoTimeDrawer`.

### Dónde NO va (medido y descartado)

- **En una función nueva que vuelva a recorrer el día.** Es lo más cómodo de
  escribir y es exactamente el fallo que el protocolo quiere evitar: dos reglas
  de cursor que se separan en el primer solape. Y el criterio 142 dejaría de ser
  una propiedad y pasaría a ser una coincidencia.
- **En la página, derivando las filas de `segments`.** No se puede reconstruir el
  orden: los tramos `planned` con `trackMinutes === 0` **no se empujan**
  (`:241`), así que un ítem sin duración o pisado desaparece de `segments` y la
  lista quedaría descolocada.
- **Cambiando el `kind` del tramo a `'unknown'` en `segments`.** Movería la barra
  (`TemplateSegment` alimenta `VidaTemplateDaySummary`), que está explícitamente
  fuera de alcance. Por eso `rows` y `segments` **divergen a propósito** justo
  en el caso 145, y el criterio 142 ya lo dice.
- **Adaptar `AgendaGap` con un `endTime` opcional.** Obliga a fabricar un final
  falso para el ítem sin duración, que es lo único que esta feature no puede
  hacer. Ya razonado en la sección 1; lo confirmo tras leer `buildDayAgenda`
  (`:163-165`: hace `parseTimeToMinutes(item.endTime)` sin salida para `null`).
- **Tres componentes, uno por forma.** Triplica la canaleta y hace que las horas
  se desalineen al primer retoque de CSS.
- **Pasarle a `VidaAgendaGap` media docena de props apagadas.** Sale más caro que
  la fila nueva y ensucia Hoy, que no cambia ni una línea.
- **Remontar el panel con una `key` al pulsar un hueco** para forzar la
  precarga. Es lo más corto y **rompe el criterio 160**: borraría la actividad ya
  elegida y los días marcados.
- **Pasar la precarga por la URL, por contexto o por `localStorage`.** Props; es
  el mismo árbol y la página ya es dueña de los dos montajes del panel.
- **Arreglar aquí la duplicación de `MIN_PLACEMENT_MINUTES`** o el tercer
  `isSliver` de `vida-execution.utils.ts`. Son de Hoy, que está fuera de alcance.
  Anotado arriba para quien toque ese módulo.

### Lo que esto le deja dicho a FEAT-012 (la noche)

**Sí, el derivado tendrá que saber de ella, y el punto exacto ya está
localizado.** Las filas nacen entre `windowStart` y `windowEnd`
(`vida-template.utils.ts:204-212`), que salen de `dayStart` / `dayEnd`. Si la
noche se pinta como franjas **fuera de la lista** y no toca esa ventana, esta
feature no se entera y el último hueco seguirá llegando a las 22:00 — con una
noche que empieza a las 23:00 quedaría una hora sin nadie que la cuente. Si la
noche **mueve el borde del día**, entra por `dayStart`/`dayEnd` en `:314-319` y
las filas la siguen **sin tocar el derivado**. La pregunta que FEAT-012 tiene que
contestar es solo esa: *¿quién es el dueño del borde del día?* No la contesto
aquí.

### Tajadas, con archivos

| # | Qué hace | Archivos | Criterios que cierra | Estado |
|---|---|---|---|---|
| 1 | **Los huecos se ven.** Las tres formas pintadas, nada pulsable todavía. | **M** `utils/vida-template.utils.ts` (`:83-87` tipo, tipos nuevos tras `:87`, `:89-105` campo `rows`, bucle `:216-249`) · **M** `utils/vida-template.utils.test.ts` (describe al final) · **C** `components/VidaTemplateGapRow/{VidaTemplateGapRow.tsx,.module.scss,index.ts}` · **M** `pages/VidaPlantillaPage.tsx:410-421` (+ import) · **M** `pages/VidaPlantillaPage.test.tsx` (describe tras `:207`) | 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 166, 167, 168, 169 | aceptada |
| 2 | **El toque precarga.** Pulsar un hueco abre «Añadir a mi Vida» con hora y duración puestas y sobrevive a elegir actividad. | **M** `components/VidaTemplateAddPanel/VidaTemplateAddPanel.tsx` (props `:35-44`, sync en render, `pick()` `:107-113`, `onSuccess` `:142-146`, línea del hueco tras `:253`, `ref` del buscador `:341-347`) · **M** `components/VidaTemplateGapRow/VidaTemplateGapRow.tsx` (rama `<button>`) · **M** `pages/VidaPlantillaPage.tsx` (estado + `:446` y `:462`) · **M** `pages/VidaPlantillaPage.test.tsx` (describe tras `:634`) | 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 166, 167, 168, 169, **170** | aceptada |
| 3 | **El ítem sin duración deja de tapar el hueco.** Su línea ofrece «Ponerle duración» y abre la hoja del ítem con «Cuánto» enfocado. | **M** `components/VidaActivitySheet/VidaActivitySheet.tsx` (prop `focusDuration` junto a `:80-90`, foco en `:595-605`) · **M** `components/VidaTemplateGapRow/VidaTemplateGapRow.tsx` (salida de la línea `unknown`) · **M** `pages/VidaPlantillaPage.tsx:143-147` y `:481-494` · **M** `pages/VidaPlantillaPage.test.tsx` | 163, 164, 165, 166, 167, 168, 169 | pendiente |
| — | El recorrido real a 375 px, en claro y en oscuro, contra el API de verdad. | — | **171** (lo cierra el usuario) | pendiente |

**Las tajadas no se recortaron**: las tres son verticales y el orden que traía
la sección 1 es el único que funciona —la tajada 2 necesita una fila que pulsar y
la 3 necesita una línea a la que colgarle la salida—. Dos precisiones sobre el
reparto de criterios, que sí cambian respecto a cómo estaban escritos:

- **El criterio 161** («lo que no se pulsa no se pulsa») está escrito en la
  tajada 2, pero la tajada 1 ya lo deja cierto por construcción: sin `onPlace` no
  hay `<button>`. En la tajada 2 solo hay que **no romperlo**.
- **El criterio 170** (el encaje con los campos de horas y minutos) **ya es
  comprobable**: FEAT-008 tajada 1 está en `main`. Su mitad de la hora de fin
  **no**: esa línea es de FEAT-008 tajada 2, que no está construida. Compruébalo
  con el reparto (90 → «1» y «30») y **deja dicho en tu entrega que la hora de
  fin queda pendiente de FEAT-008 tajada 2**.

### Riesgos que dejo señalados

1. **El render extra de `VidaDurationPills`** que avisó FEAT-008: con la
   precarga, el borrador se re-reparte de verdad por primera vez en producción.
   Es el primer sitio donde mirar si algo salta al pulsar un hueco.
2. **`TemplateDay` gana un campo** y lo consumen `VidaTemplateDaySummary.tsx:16`
   y la cuadrícula de la semana vía `buildTemplateWeekGrid` (`:886`). Es aditivo
   —ninguno construye un `TemplateDay` a mano— pero si algún test hace `toEqual`
   sobre el objeto entero, fallará: los que miré (`:130,143,155`) suman
   `segments`, no comparan el día completo.
3. **Los solapes con un ítem sin duración a la vez** son el cruce de los
   criterios 144 y 145 y no hay ningún caso escrito que los combine. Escribe el
   test aunque no haya criterio.

## 3. Construcción — feature-builder

### Tajada 1 — los huecos se ven

**Resumen para el revisor:** entre ítem e ítem —y en los bordes del día— la
plantilla pinta ahora una fila «Libre 8:40 → 9:00 · 20m», los restos de menos
de 15 min en línea fina y, donde un ítem no dice cuánto dura, una línea que lo
dice en vez de un hueco que miente; todo sale de **una fila más en el bucle que
ya existía** (`buildTemplateDay`), y **nada se pulsa todavía**. Los archivos
tocados son cuatro y uno nuevo. **Lo que más probablemente he roto: la lista de
la agenda ya no es «una tarjeta por ítem»** —ahora hay `<li>` que no son ítems—,
y eso ya reventó dos tests que contaban `listitem` (los acoté, no los debilité:
`VidaPlantillaPage.test.tsx`); cualquier otro sitio que cuente filas de esa `ol`
—o que mida su alto a 375 px— es donde hay que mirar. El segundo sitio es
`TemplateSegment`, que ha ganado `startMinutes`/`endMinutes`: es aditivo, pero
lo lee la barra de `VidaTemplateDaySummary`.

**Qué se construyó:**

- **`src/features/vida/utils/vida-template.utils.ts`** — la geometría, en el
  mismo bucle y de una sola pasada:
  - `TemplateSegment` (`:84-92`) gana `startMinutes` y `endMinutes` (aditivo;
    nadie construye un `TemplateSegment` a mano).
  - Tipos nuevos exportados (`:94-132`): `TemplateRow = TemplateItemRow |
    TemplateGapRow | TemplateUnknownRow`. El hueco lleva sus dos horas, sus
    minutos y `isSliver` (`minutes < MIN_GAP_MINUTES`, **importado** de
    `vida-time.utils.ts:167`); la línea de «no sabemos» lleva `item`,
    `untilMinutes` e `isDayEnd`. Cada fila lleva además un `id` —añadido mío,
    no del plan— para que la página no tenga que fabricar `key`s.
  - `TemplateDay.rows` (`:149-154`), documentado: misma geometría que
    `segments`, **que no cambia**, y por eso el criterio 142 es una propiedad.
  - El bucle (`:271-346`): `pushGap` sigue igual y ahora hay un `pushRowsUntil`
    que decide en cada corte —la hora del ítem siguiente o `windowEnd`— entre
    línea de «no sabemos», nada (solape) o hueco. `placed.length === 0` deja
    `rows` vacío (criterio 149).
- **`src/features/vida/components/VidaTemplateGapRow/`** (nuevo: `.tsx`,
  `.module.scss`, `index.ts`) — las tres formas en un componente, molde de
  `VidaTemplateItemCard/`: misma `.row`, misma canaleta de `2.75rem`, mismo
  barril. `onPlace` y `onSetDuration` **existen ya en el contrato y nadie las
  pasa**: por eso en esta tajada no hay ni un `button` nuevo en la lista.
- **`src/features/vida/pages/VidaPlantillaPage.tsx`** — la `ol` mapea
  `templateDay.rows` en vez de `templateDay.timed`; la condición
  `templateDay.timed.length > 0` se queda (criterio 149) y las props de la
  tarjeta no cambian. Un `import` más, ninguna consulta ni hook nuevos.
- **Tests:** `utils/vida-template.utils.test.ts`, un `describe` nuevo al final
  (13 casos, criterios 140-146 y 149 + los dos bordes sin criterio);
  `pages/VidaPlantillaPage.test.tsx`, un `describe` nuevo tras el de la agenda
  (9 casos) y **dos tests de arriba acotados**, no borrados (ver riesgos).

**Por qué así, y lo que descarté:**

- **Tres desvíos del plan, los tres dichos aquí:**
  1. **La canaleta del hueco va vacía.** El plan decía «canaleta con la hora»;
     el render aprobado (`10-vida-huecos-plantilla.html:117,152`) **no** repite
     la hora ahí —ya va dentro de la frase, «Libre 5:00 → 8:00»— y pintarla
     sería decir «8:40» dos veces en la misma línea. La canaleta existe igual,
     con la misma medida, para que la columna de horas de los ítems no se mueva.
  2. **Un hueco normal sin `onPlace` no se degrada a línea fina.** El plan lo
     sugería entre paréntesis; con eso, en esta tajada **todos** los huecos se
     verían finos y el render aprobado no se vería hasta la tajada 2. Lo que
     separa fino de normal es el umbral (criterio 143); lo que separa pulsable
     de no pulsable es `onPlace` (el «+» solo se pinta con ella).
  3. **`TemplateRow` lleva `id`.** Un campo más, para las `key`s de React.
- **El borde que el arquitecto dejó abierto (dos ítems a la misma hora, el
  primero sin duración):** se emite **la línea igual**, con
  `untilMinutes = Math.max(corte, su propia hora)`, y **nunca** un hueco. Es
  la recomendación del plan, y el `Math.max` es cinturón: con el orden por hora
  el corte nunca cae antes, pero si algún día cayera, la frase no retrocedería.
  Test: «borde: dos ítems a la misma hora y el primero sin duración».
- **El cruce 144 × 145 (solape con un ítem sin duración dentro):** la línea se
  emite igual en el primer corte que viene detrás, **aunque el cursor ya vaya
  por delante de ese corte**. Descarté callarla cuando el solape ya cubre el
  tramo: sería una segunda regla («cállate si además hay solape») para ahorrar
  una línea, y seguiría siendo verdad que no se sabe dónde acaba ese ítem. Lo
  que **no** pasa en ningún caso es que se pinte un hueco por él. Test: «borde:
  solape con un ítem sin duración dentro».
- **No creé** ni función de huecos, ni umbral, ni formateador: el rango se
  compone con dos `formatTimeForDisplay` y el tamaño con
  `formatDurationFromMinutes`, como manda el criterio 140. `formatGapRange` no
  se importa (pide un `AgendaGap` y escribe raya). `VidaAgendaGap` no se
  importa: se imitó el JSX de su línea fina y su `.module.scss:163-171`.

**Verificación** (la línea base entera, antes y después):

```
pnpm typecheck  → limpio (sin salida)
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)   ← igual que la base
pnpm test       → Tests 2 failed | 1609 passed (1611)      ← los 2 de SearchSelect
                  Test Files 1 failed | 109 passed (110)      de siempre; +22 tests
pnpm build      → ✓ built in 5.86s — index 1.096,35 kB (base 1.093,96) + app-icons
                  620,20 kB + IconPicker 4,64 kB
```

El paquete sube **2,39 kB**: es el componente nuevo y sus estilos. No hay ningún
import nuevo de terceros.

**Criterios que cierra, uno a uno:**

| # | Estado | Evidencia |
|---|---|---|
| 140 | cumplido | `VidaPlantillaPage.test.tsx` «entre ítem e ítem…»: la lista contiene literalmente `Libre 8:40 → 9:00 · 20m`, compuesto con `formatTimeForDisplay` ×2 y `formatDurationFromMinutes`. Ningún formateador nuevo en el diff. |
| 141 | cumplido | Test «los bordes del día también llevan hueco»: con un único ítem 8:00–9:00 salen **exactamente dos**, `Libre 6:30 → 8:00 · 1h 30` y `Libre 9:00 → 23:00 · 14h` (el día del test es 06:30–23:00). Y en utils, «con un ítem fuera del horario la ventana manda»: un ítem a las 5:00 estira `windowStart` y el hueco lo sigue. |
| 142 | cumplido | Test de utils «la suma de los huecos pintados es exactamente `freeMinutes`»: `painted === day.freeMinutes` y `plannedMinutes + painted === 990`. Es una propiedad: las filas `gap` y los tramos `free` salen del mismo corte. |
| 143 | cumplido | Tests «un resto de menos de 15 min…» (utils, `isSliver: true`) y «el de menos de 15 min se ve, y no hay nada que pulsar»: `Libre 8:55 → 9:00 · 5m` está en la lista y los únicos botones de la `ol` siguen siendo `Abrir Bañarme` y `Abrir Desayunar`. `MIN_GAP_MINUTES` importado, no redefinido. |
| 144 | cumplido | Tests «en un solape no hay hueco…» (utils y página): con 8:00–10:00 y 9:00–9:30 las filas son `gap, item, item, gap` y el siguiente hueco empieza **a las 10:00**. Ni una palabra del solape en pantalla. |
| 145 | cumplido | Test «un ítem sin duración pone una línea que dice la verdad»: el texto literal es «No sabemos cuánto dura Working at lululemon, así que no podemos decir qué queda libre hasta las 14:00.» y **no** existe `Libre 10:00 …`. La línea no es `button` ni tiene `role`. |
| 146 | cumplido | Tests «si es el último…» (habla del **final del día**) y, en utils, «dos seguidos sin duración»: `gap, item, unknown, item, unknown`, una línea por cada uno y ningún hueco entre ellos. |
| 147 | cumplido | Por construcción y por diff: `VidaPlantillaPage.tsx` no gana ningún hook ni documento GraphQL —el único import nuevo es el componente—, y `rows` se deriva de los `VidaItem` que la pantalla ya tenía. El `describe` de la página monta la pantalla entera con los mismos mocks de consulta de antes. |
| 148 | cumplido | Test «solo en la vista de día»: dentro de la región «Tu semana entera» y dentro del cajón «Sin hora» no hay ni un `Libre …` ni una línea de «No sabemos». `VidaWeekGrid` y `VidaTemplateNoTimeDrawer` tienen **diff vacío**. |
| 149 | cumplido | Test de página «un día sin ítems con hora…»: no existe la `ol` de la agenda y no hay ningún `Libre `. En utils, `build([]).rows` y el día solo-sin-hora dan `[]`. |
| 150 | **pendiente de prueba manual** | El alto real a 375 px **no lo pude medir**: ver «lo que no pude comprobar». Lo que sí está: la fila de hueco es **una sola línea** por construcción (`white-space: nowrap` + `text-overflow: ellipsis` en `.label`, `padding .4rem`), y la `ol` no cambia de contenedor. |
| 151 | cumplido a medias | La fila de hueco **no imprime ningún nombre de actividad** (se ve en el JSX: solo horas y tamaño), así que un nombre de 60 caracteres no la toca. **La línea de «no sabemos» sí lo imprime**, y su envoltura a 375 px (`overflow-wrap: anywhere`, sin `nowrap`) queda **pendiente de mirarla renderizada**. |
| 152 | cumplido a medias | Sin depender del color: el texto **empieza por «Libre»** y el trazo es discontinuo. Contraste calculado sobre los tokens de Aura (`_theme-variables.scss:155-169,235-249`), texto sobre el fondo de la página: claro **7,88:1** (hueco), **7,35:1** (fino), **6,73:1** (la línea gris); oscuro **11,14:1**, **8,86:1**, **8,08:1**. Todos ≥ 4,5:1. **Medido sobre `--color-bg` plano**: el fondo real lleva el degradado de la aurora, así que la confirmación con el ojo es del usuario. |
| 166 | cumplido | Test «ni una palabra de reproche»: el texto de la agenda contiene «Libre» y no contiene «vacío», «desperdicio», «perdido», «sin aprovechar» ni «deberías». Además `vida-vocabulary.test.ts` recorre por glob los archivos nuevos, que viven bajo `src/features/vida/`. |
| 167 | cumplido | El diff no copia `vida-agenda.utils.ts` ni `VidaAgendaGap`, y **no añade ninguna función** que convierta minutos en texto ni en `HH:mm`: `grep` sobre el diff, cero `function format*`. La geometría sale de un solo sitio, `buildTemplateDay`. |
| 168 | cumplido | Diff sin `graphql`, sin `localStorage`, sin claves de caché, sin rutas. |
| 169 | cumplido | Ver «Verificación»: typecheck limpio, lint 14/0, los mismos 2 fallos de `SearchSelect`, build exit 0. |

**Lo que no pude comprobar, y por qué:** **no conseguí abrir el navegador.** El
panel estaba ocupado por una pestaña de otra sesión (`tab-8`, un documento
`data:` de «Vida — registrar en el hueco») y **esta sesión no tiene la
herramienta `tabs_close`**: `preview_start` y `navigate` respondieron «Tab cap
reached» las tres veces que lo intenté, con la web del usuario **arriba** en el
5173. No arranqué ningún servidor. Dejé escrito y **borrado** el arnés que tenía
preparado (`harness-gap.html` + `src/harness-gap.tsx`, fuera del árbol ya:
`git status` no los enseña). Queda pendiente de mirar con el ojo, a 375 px y en
los dos temas:

1. `/app/vida/plantilla`, un día con 6 ítems, uno de ellos sin duración y otro
   que deje un resto de 5 min. Medir con `getBoundingClientRect` que la fila de
   hueco mide **menos de la mitad** que una tarjeta (criterio 150) y que
   `document.documentElement.scrollWidth === 375` (sin scroll horizontal).
2. Un ítem con un nombre de 60 caracteres sin duración: que su línea **envuelva**
   y no desborde (criterio 151).
3. Los dos temas, para el contraste del criterio 152 sobre el fondo de verdad.

**Riesgos:**

1. **La agenda ya no es «una tarjeta por ítem».** Dos tests contaban
   `getAllByRole('listitem')` y fallaron: «una tarjeta por ítem, ordenada por
   hora ascendente» y «la pantalla se dibuja de la consulta» (criterio 24). Los
   **acoté, no los debilité**: un ayudante `itemRowsOf()` quita las filas que
   empiezan por «Libre » o «No sabemos », y las afirmaciones de orden y de
   cuenta siguen siendo las mismas. Está comentado en el propio test, con el
   mismo formato que usó la tajada 4 de FEAT-005 para un caso igual.
2. **`TemplateSegment` gana dos campos.** Aditivo, pero lo consume la barra
   (`VidaTemplateDaySummary.tsx:72`) y `buildTemplateWeekGrid`. Ningún test hace
   `toEqual` del objeto entero (los que suman `trackMinutes` siguen verdes).
3. **El alto de la lista a 375 px.** Es el riesgo real de esta tajada: una
   agenda de seis ítems pasa a tener hasta once filas. Está sin medir (arriba).
4. **FEAT-012 (la noche)** no queda cerrada: las filas nacen entre `windowStart`
   y `windowEnd` y no inventan borde propio, así que mover el borde del día
   sigue siendo suficiente. No toqué nada de eso.
5. **La hora de fin del render («→ Acaba a las 11:30») no está**, a propósito:
   es de FEAT-008 tajada 2, que no está construida.

**Lo que vi de paso y no toqué** (fuera de alcance, anotado para quien pase):
`MIN_PLACEMENT_MINUTES` (`vida-gap-form.utils.ts:34`) sigue siendo el gemelo de
`MIN_GAP_MINUTES`, y el tercer `isSliver` sigue en `vida-execution.utils.ts:694`.
Los dos son de Hoy.

**Estado del árbol:** **sin commitear**. Modificados
`src/features/vida/utils/vida-template.utils.ts`,
`src/features/vida/utils/vida-template.utils.test.ts`,
`src/features/vida/pages/VidaPlantillaPage.tsx`,
`src/features/vida/pages/VidaPlantillaPage.test.tsx`; nuevo
`src/features/vida/components/VidaTemplateGapRow/` (tres archivos). Más este
dossier y `BOARD.md`. El grafo se actualizó con `graphify update .`.

### Tajada 2 — el toque precarga

**Resumen para el revisor:** el hueco de 15 min o más es ahora un `<button>` y,
al pulsarlo, «Añadir a mi Vida» se abre —la hoja en móvil, el panel del aside en
escritorio— con **la hora y la duración del hueco entero ya puestas**, que
**sobreviven a elegir la actividad**; la precarga entra por `setStartTime` /
`setDurationMinutes` y los dos campos de FEAT-008 se reparten solos (90 → «1» y
«30»). Tocados: el panel, la página, la fila del hueco (un «+» más pequeño y la
frase del final del día) y el test de la página. **Lo que más probablemente he
roto: el `pick()` del panel ya no vacía siempre la hora y la duración** —solo
cuando no hay `gapPrefill`—, así que cualquier camino que llegue al panel con un
prefill vivo y espere empezar en blanco se comporta distinto; y **la fila del
hueco creció al volverse botón** (34,8 px, por encima de la mitad de una
tarjeta), lo que me obligó a encoger el «+» a 1rem para no romper el criterio
150 que el revisor ya había medido. Ahí es donde hay que mirar.

**Qué se construyó:**

- **`components/VidaTemplateAddPanel/VidaTemplateAddPanel.tsx`** — la puerta de
  la precarga, toda aditiva:
  - Tipo nuevo exportado `VidaTemplateGapPrefill` (`:36-53`): `token`,
    `startTime`, `durationMinutes` y `label`. Se reexporta en el barril
    (`index.ts`, una línea `export type`).
  - Prop `gapPrefill` (`:64-68`), con defecto `null`: **sin ella el panel es el
    de antes**, y por eso `VidaTemplateAddSheet` no se ha tocado (ya hace
    `{...panel}`).
  - **Sincronización en render, con `useState`** (`:109-128`): al cambiar el
    `token` se escriben **solo** `startTime` y `durationMinutes`; ni `picked`,
    ni `days`, ni `search` (criterio 160). No hay ninguna `ref` escrita en
    render: FEAT-008 ya midió que eso sube el lint de 14 a 16.
  - **`pick()` (`:164-177`)**: el vaciado de hora y duración queda condicionado
    a que **no haya** `gapPrefill`. Es el fallo que el plan señalaba y la mitad
    del criterio 154; la otra mitad —el «+» flotante sigue vaciando— la sostiene
    la página, que suelta el prefill al abrir por ahí.
  - El foco al buscador (`useEffect` sobre el token aplicado, `:135-138`) y la
    línea «Viene del hueco que pulsaste · **para las 8:40 · 20m libres**» bajo
    `styles.head`, con su `.fromGap` en el `.module.scss` (criterio 159).
- **`pages/VidaPlantillaPage.tsx`** — quien tiene las filas y los dos montajes:
  - Estado `gapPrefill` y `placeInGap(row)`, que compone el `HH:mm` con
    `minutesToTime` y el rótulo con `formatTimeForDisplay` +
    `formatDurationFromMinutes` —**los formateadores del módulo, ninguno
    nuevo**— y sube el `token` en cada toque.
  - **`useMediaQuery('(min-width: 60rem)')`**, el mismo corte que ya manda en el
    `.module.scss:186`: en móvil se abre la hoja; **en escritorio no se abre
    nada** (criterio 159).
  - `onPlace` llega **solo** a las filas `gap` que no son finas; el fino y la
    línea de «no sabemos» siguen sin recibirla (criterio 161).
  - El prefill se suelta al **guardar** (`onSaved` en los dos montajes), al
    **cerrar la hoja**, al pulsar el **«+» flotante** (`openAdd`) y al **cambiar
    de día**: su hora era de otro día.
- **`components/VidaTemplateGapRow/`** — dos cambios pequeños:
  - `.plus` pasa de `1.25rem` a `1rem` (ver «por qué así»).
  - **El encargo del usuario**: la línea del ítem sin duración que cierra el día
    dice ahora **la hora** («…hasta las 23:00») y no «el final del día».
    `untilMinutes` ya era `windowEnd` en ese caso, así que **hay una sola frase**
    y `isDayEnd` deja de usarse en el componente (sigue en el tipo).
- **Tests** (`pages/VidaPlantillaPage.test.tsx`): un `describe` nuevo con **10
  casos** tras el de «Añadir a mi Vida»; un **espía de consultas** (`queryHooks`)
  añadido a los mocks que ya había; el test del criterio 146 actualizado a la
  hora; y el del criterio 143 acotado —el hueco fino se afirma ahora por lo que
  **es** (`<p>`, sin botón, ningún rótulo que hable de las 8:55) en vez de por
  «los únicos botones de la lista son las tarjetas», que dejó de ser cierto el
  día en que los huecos se volvieron botones. No se borró ninguna afirmación:
  se sustituyó una lista cerrada por tres comprobaciones más estrechas.

**Por qué así, y lo que descarté:**

- **Tres desvíos del plan, los tres dichos aquí:**
  1. **El aviso de «suelta el prefill» viaja por `onSaved`, no por una prop
     nueva.** El plan pedía avisar a la página tras guardar; `onSaved` ya existía
     y ya lo consumía la hoja. Una prop más para lo mismo habría sido una
     segunda puerta.
  2. **El «+» de la fila encoge a 1rem.** Al volverse `<button>`, la fila pasó de
     32,8 px a **34,8 px** —medido en el navegador— y la mitad de una tarjeta es
     33,35: el criterio **150**, que el revisor había dado por cumplido por medio
     píxel, se rompía. Lo único más alto que el texto era el círculo del «+»; con
     1rem la fila queda en **30,8 px**. El área de toque no es el círculo, es la
     fila entera (289 × 30,8 px a 375 px), pero **es una fila baja para un dedo**
     y eso lo tiene que juzgar el usuario en un teléfono de verdad.
  3. **La página decide móvil/escritorio con `useMediaQuery`.** El plan decía «en
     móvil abre la hoja» sin decir quién lo sabe. Lo sabe el mismo `60rem` del
     CSS, con el hook que ya existe en `shared/hooks`. Descarté pasar la decisión
     al CSS (dos filas, una por tamaño) porque duplicaría la lista.
- **El criterio 153, dicho con precisión:** el panel se abre **con el hueco
  puesto**, pero los campos «A qué hora» y «Cuánto» **no existen hasta elegir la
  actividad** —el panel enseña primero el catálogo, y así era desde FEAT-005—.
  Es exactamente lo que el plan resolvió al condicionar `pick()`: se pulsa el
  hueco y *después* se elige, y al elegir los campos aparecen **ya rellenos**.
  Lo que el render dibuja junto (el buscador y los campos a la vez) **no es el
  panel de hoy**, y cambiarlo sería rehacer «Añadir a mi Vida», que no es esta
  tajada. Lo dejo dicho porque es la única lectura del 153 que el código sostiene.
- **La hora de fin («→ Acaba a las 11:30») NO está escrita**, a propósito: es de
  FEAT-008 tajada 2. `grep -rn "Acaba a las" src/` sigue devolviendo **cero**.
- **Ni una consulta, ni un formateador, ni un umbral nuevos.** El `label` se
  compone con los dos formateadores del módulo; la geometría sigue saliendo de
  `buildTemplateDay`.

**Verificación** (la línea base entera, al terminar):

```
pnpm typecheck  → limpio (sin salida)
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)      ← igual que la base
pnpm test       → Tests 2 failed | 1620 passed (1622)         ← los 2 de SearchSelect
                  Test Files 1 failed | 109 passed (110)         de siempre; +11 tests
pnpm build      → ✓ built in 3.01s — index 1.097,09 kB (base 1.096,35; +0,74)
                  + app-icons 620,20 kB (sin tocar) + IconPicker 4,64 kB
```

**En el navegador** (arnés temporal, ya borrado): a **375 px**, en **claro y en
oscuro**, con seis ítems —uno sin duración y con nombre largo— y sus filas:

| Qué | Medido |
|---|---|
| Fila de hueco **pulsable** | **30,8 px** (tarjeta de ítem 66,7 → menos de la mitad), una sola línea, botón de 289,4 × 30,8 |
| Fila fina (5 min) | 24,5 px, `<p>`, **sin botón** |
| Línea de «no sabemos» | 67 px, envuelve con nombre largo, sin botón |
| Ancho | `scrollWidth === clientWidth === 375`, **0 nodos** desbordados |
| Contraste (claro) | hueco **7,16** · fino 6,96 · «no sabemos» 6,10 · «Viene del hueco» **6,53** |
| Contraste (oscuro) | hueco **13,78** · fino 9,94 · «no sabemos» 9,94 · «Viene del hueco» **13,77** |

**Criterios que cierra, uno a uno:**

| # | Estado | Evidencia |
|---|---|---|
| 153 | cumplido, **con la precisión de arriba** | Test «pulsarlo abre “Añadir a mi Vida” y **no la hoja del ítem**»: aparece el segundo montaje del panel (la hoja), con «Viene del hueco que pulsaste · para las 8:40 · 20m libres», y `patternsEnabled.some(Boolean) === false` —la hoja del ítem no se ha montado—. Los campos salen al elegir la actividad, ya rellenos (test siguiente). |
| 154 | cumplido, **las dos mitades** | Test «elegir la actividad conserva…»: tras pulsar el hueco y elegir, «A qué hora» vale `08:40`. Test «por el “+” flotante se sigue vaciando»: por el FAB, tras elegir, «A qué hora» está vacío y no hay campos de duración abiertos. |
| 155 | cumplido | 8:40 → 9:00 precarga **20** (test 154) y 6:30 → 8:00 precarga **90**, sin tope ni redondeo. Editable: son los mismos campos de siempre. |
| 156 | cumplido | Test «pulsar tres huecos y cerrar…»: `createItem.mutate`, `updateItem.mutate` y `deleteItem.mutate` **sin llamar**. |
| 157 | cumplido | Test «guardar desde el hueco manda el mismo cuerpo»: `toEqual({ activityId, days: ['friday'], startTime: '08:40', durationMinutes: 20 })` — **ni un campo nuevo**, y sigue siendo `create` (la puerta de `useSaveVidaItemForActivity` con `targetItem: null`). |
| 158 | **cumplido por derivación, no por mutación** | Test «la lista se recoloca sola…»: con el ítem nuevo de 20 min dentro, el hueco de 8:40 desaparece y queda `Libre 9:00 → 9:40 · 40m`. La lista sale de `items`, que la mutación ya invalida (criterio 24, probado desde FEAT-005); **el ciclo completo contra el API es del usuario**. |
| 159 | cumplido | Test de escritorio (`matchMedia` forzado, molde de `VidaRevisionPage.test.tsx:649`): **un solo** montaje del panel, `queryByRole('dialog')` nulo, la línea del hueco visible y `document.activeElement` **es** el buscador de actividades. Sin `scrollIntoView` en el diff: la página no da saltos. |
| 160 | cumplido | Test «otro hueco sustituye…»: con «Leer» ya elegida y el lunes marcado a mano, pulsar el hueco de 6:30 deja la hora en `06:30` y los campos en «1»/«30», **y** «Leer» sigue elegida y lunes y viernes siguen marcados. |
| 161 | cumplido, **no roto** | Tests del fino (`<p>`, `closest('button')` nulo, ningún rótulo que hable de su hora) y de la línea de «no sabemos» (`<p>`, sin `role`, sin botón), **ahora que los huecos normales sí son botones**. |
| 162 | cumplido | Los rótulos de la lista incluyen «Poner algo a las 6:30, **1 h 30 min** libres» y «Poner algo a las 8:40, **20 min** libres». Es un `<button>` de verdad, en el orden del día. **Matiz**: el criterio escribe «20 minutos» y el módulo escribe «20 min» (`formatDurationMinutes`, el formateador de siempre); no se ha escrito un segundo formateador para cuadrar una palabra. |
| 170 | **cumplido en su mitad de los dos campos** | Test «un hueco de 90 min se lee “1” y “30”»: los campos de FEAT-008 se reparten solos al llegar `durationMinutes` distinto de lo emitido. **La hora de fin queda pendiente de FEAT-008 tajada 2**, que no está construida: esta tajada no escribe ninguna etiqueta de duración ni ninguna hora de fin. |
| 147 | cumplido, **ahora con espías** (lo que pidió el revisor) | Test «pulsar tres huecos y cerrar…»: el conjunto de hooks de consulta montados es **idéntico** antes y después de pulsar (`queryHooks`), `patternsEnabled` sigue sin encenderse y **ningún export de `vida-items.api` ha sido llamado**. |
| 166 | cumplido | Lo nuevo dice «Libre», «Poner algo a las…» y «Viene del hueco que pulsaste»; el test de reproche del bloque de huecos sigue verde y `vida-vocabulary.test.ts` recorre por glob los archivos tocados. |
| 167, 168 | cumplidos | Ni función de huecos, ni umbral, ni formateador nuevos; el diff no tiene `graphql`, ni `localStorage`, ni claves de caché, ni rutas. |
| 169 | cumplido | Ver «Verificación»: typecheck limpio, lint 14/0, los mismos 2 fallos de `SearchSelect`, build exit 0. |
| 146 | **cambiado a petición del usuario** | «…hasta **las 23:00**» en vez de «…hasta el final del día», con su test actualizado. El criterio ya escribía el ejemplo con la hora. |
| 171 | pendiente del usuario | `/app/vida/plantilla` está detrás del login: el toque con la mano, el guardado contra el API y el fondo con el degradado son suyos. |

**Riesgos:**

1. **`pick()` ya no vacía siempre.** Es el cambio con más alcance del diff: si
   alguna vez llega un `gapPrefill` que nadie suelta, elegir una actividad
   arrastrará una hora vieja. Los cuatro sitios que lo sueltan —guardar, cerrar
   la hoja, el «+» flotante y cambiar de día— son los que conozco; si aparece un
   quinto camino al panel, hay que soltarlo ahí también.
2. **La fila de hueco es baja para un dedo** (30,8 px de alto, aunque de 289 px
   de ancho). Es el precio de que el criterio 150 exija «menos de la mitad que
   una tarjeta». Si el usuario lo encuentra difícil de acertar, **el criterio 150
   y el tamaño del toque están en tensión** y eso es una decisión suya, no mía.
3. **Los dos montajes del panel reciben el mismo `gapPrefill`.** En jsdom los dos
   existen a la vez; en el navegador, el del aside está oculto por CSS debajo de
   60rem y el de la hoja no se monta hasta abrirla (`SteppedModal` solo pinta
   `children` con `open`). Si algún día la hoja se dejara montada cerrada, habría
   **dos paneles precargados** y el foco iría al último.
4. **El foco al buscador también salta en móvil**, donde puede levantar el
   teclado del teléfono nada más abrir la hoja. El criterio 159 solo lo pide en
   escritorio; mantuve **una sola implementación** para no partir el panel en
   dos. Pendiente de verlo en un teléfono de verdad.
5. **El test del criterio 143 cambió de forma** (de «los únicos botones son las
   tarjetas» a tres afirmaciones sobre el fino). Es más estrecho que antes en lo
   que afirma del resto de la lista: si mañana apareciera un botón de más en la
   `ol`, ese test ya no lo cazaría.

**Lo que vi de paso y no toqué:** `MIN_PLACEMENT_MINUTES`
(`vida-gap-form.utils.ts:34`) y el tercer `isSliver` de
`vida-execution.utils.ts:694` siguen ahí, como los dejó la tajada 1. Y el
`ENVIRONMENT.md` vuelve a quedarse corto (hoy **1622** tests y **1.097,09 kB**):
**no lo he tocado**.

**Intendencia:** el 5173 del usuario **estaba apagado** cuando empecé (la sonda:
«web (dev, del usuario) APAGADO»). Arranqué uno con
`preview_start {name: "xavi-habits-web"}`, que cogió el **puerto 5173**, y le
serví el arnés. **No he podido pararlo: esta sesión no tiene la herramienta
`preview_stop`.** Queda corriendo; si el usuario quiere el suyo, este hay que
bajarlo antes. El arnés (`harness-gap2.html` + `src/harness-gap2.tsx`) está
**borrado**: `git status` no lo lista.

**Estado del árbol:** **sin commitear**. Modificados
`src/features/vida/components/VidaTemplateAddPanel/VidaTemplateAddPanel.tsx`,
`.../VidaTemplateAddPanel.module.scss`, `.../VidaTemplateAddPanel/index.ts`,
`src/features/vida/components/VidaTemplateGapRow/VidaTemplateGapRow.tsx`,
`.../VidaTemplateGapRow.module.scss`,
`src/features/vida/pages/VidaPlantillaPage.tsx` y
`src/features/vida/pages/VidaPlantillaPage.test.tsx`. Más este dossier y
`BOARD.md`. El grafo se actualizó con `graphify update .`, y por eso
`graphify-out/` sale modificado; **nada de lo que haya en el árbol fuera de esa
lista es mío** (hay otra sesión trabajando en este repositorio).

## 4. Revisión — feature-reviewer

### Tajada 1 — Los huecos se ven

**Veredicto: `accepted`** — los trece criterios de la tajada (140–152) y el
transversal 169 se cumplen. **He abierto el navegador y cerrado la deuda visual
que el constructor no pudo cubrir**: el criterio **150 está medido** —una fila
de hueco mide **32,8 px** frente a los **66,7 px** de una tarjeta de ítem, menos
de la mitad—, y el **151** y el **152** los he visto y medido a 375 px en claro y
en oscuro. El criterio 142 lo he comprobado como se me pidió, sumando filas
contra `freeMinutes` en **ocho días distintos**, y es una propiedad, no una
coincidencia. Queda un hallazgo de redacción sobre el criterio 146 y un margen
de medio píxel en el 150 que conviene saber.

**Criterios, uno por uno** (contra la sección 1)

| # | Estado | Evidencia que he comprobado yo |
|---|---|---|
| 140 | **cumplido** | La fila se compone con `formatTimeForDisplay` ×2 y `formatDurationFromMinutes`; **en el diff no hay ningún formateador nuevo**. Visto en pantalla: «Libre 8:40 → 9:00 · 20m», entre las dos tarjetas y dentro de la misma `ol`. |
| 141 | **cumplido** | Con seis ítems vi los dos bordes: «Libre 6:30 → 8:00 · 1h 30» y «Libre 18:30 → 23:00 · 4h 30». En mi propio test, un ítem a las 5:00 estira la ventana y el hueco la sigue, sin borde inventado. |
| 142 | **cumplido, y verificado en ocho días** | Test temporal mío (borrado): en ocho configuraciones —un ítem, dos, casi pegados, con solape, pegados a los bordes, con un resto de 5 min, con un ítem fuera del horario, con tres ítems— **la suma de los minutos de las filas de hueco es exactamente `freeMinutes`**, y además los `segments` siguen sumando `dayMinutes`. Es propiedad del único cursor que recorre el día: `pushGap` y `pushRowsUntil` reciben **el mismo par** `(cursor, corte)`. |
| 143 | **cumplido** | El umbral es `MIN_GAP_MINUTES` importado de `vida-time.utils.ts:167`; **no hay una segunda constante en el diff**. Visto: «Libre 11:25 → 11:30 · 5m» en línea fina (24,5 px), sin caja y **sin nada que pulsar** (`onPlace` no llega en esta tajada). |
| 144 | **cumplido** | Mi test: con 8:00–10:00 y 9:00–9:30, **cero** filas de hueco entre ellos y el siguiente hueco arranca en **10:00** —el fin más tardío—, con los rangos exactos `[[390,480],[600,660],[690,1380]]`. Ni una palabra del solape. |
| 145 | **cumplido** | Mi test: con un ítem sin duración las filas son `gap, item, unknown, item, gap` y **la diferencia con `freeMinutes` es exactamente los 60 min del tramo del que no se afirma nada**. La barra **no se mueve**. Nada de esa línea es pulsable. |
| 146 | **cumplido en lo que pide, con un hallazgo de redacción** | Con el ítem sin duración como último con hora, la línea habla del fin del día y **no hay hueco tras él** (mi test del cruce con solape: `isDayEnd: true`, `untilMinutes` = 23:00). Con dos seguidos, una línea por cada uno y ningún hueco entre ellos. **Pero la frase dice «hasta el final del día», no «hasta las 23:00»** — ver hallazgo 1. |
| 147 | **cumplido** | El diff de la página es **un `import` y el `map`**: ni un hook, ni una consulta, ni un `useQuery` nuevos. No hay test de espías para esto —el criterio dice «comprobable», y lo he comprobado sobre el diff, que es más directo—. |
| 148 | **cumplido** | `VidaWeekGrid` y `VidaTemplateNoTimeDrawer` **no aparecen en `git status`**: diff vacío. Y hay test de que ni la semana entera ni el cajón pintan filas. |
| 149 | **cumplido** | `rows` es `[]` sin ítems con hora —lo comprobé con dos casos: sin ítems y con uno sin hora—, y la condición `timed.length > 0` de la página no se ha tocado. |
| 150 | **cumplido, medido por mí** | A 375 px, con seis ítems y sus huecos: fila de hueco **32,8 px** (fina, 24,5) frente a tarjeta de ítem **66,7 px** → **menos de la mitad**, y **una sola línea de texto**. `scrollWidth === clientWidth === 375` y **0 nodos** desbordados. Ver el hallazgo 2 sobre el margen. |
| 151 | **cumplido, visto** | La fila de hueco **no imprime ningún nombre**: solo horas y tamaño. La línea del criterio 145, con un nombre de **60 caracteres**, **envuelve** en tres líneas dentro de su caja, sin desbordar (altura 67 px, 0 nodos fuera). |
| 152 | **cumplido, medido sobre el fondo real** | El texto **empieza por «Libre»** —se distingue sin color— y el trazo es discontinuo. Contrastes compuestos capa a capa sobre el fondo de verdad (no sobre `--color-bg` plano): **claro** 15,63 (hueco) · 6,96 (fino) · 6,10 (la línea de «no sabemos»); **oscuro** 19,29 · 9,94 · 9,94. Todos muy por encima de 4,5:1. |
| 169 | **cumplido, línea base corrida entera por mí** | Ver abajo. |
| 170, 171 | **pendientes** | El 170 es de la tajada 2 (nada que precargar todavía); el 171, del usuario. |

**La barra no se ha movido**

`segments` sigue saliendo de `pushGap` y de la misma aritmética de
`trackMinutes`: lo único que cambia es que cada tramo **añade** `startMinutes` y
`endMinutes`. Comprobé que ningún test existente comparaba `segments` de forma
exhaustiva —si lo hiciera con `toEqual`, las claves nuevas lo habrían roto— y
que `freeMinutes` y la suma de tramos siguen cuadrando con `dayMinutes` en los
ocho días que probé. **Ni un valor cambia para ningún día.**

**Los dos bordes sin criterio: ¿dice algo falso?**

- **Dos ítems a la misma hora, el primero sin duración.** `untilMinutes =
  max(corte, su propia hora)` deja la frase en su propia hora: «…no podemos
  decir qué queda libre hasta las 9:00» para un ítem que empieza a las 9:00.
  **No es falso** —de un tramo de cero minutos no se afirma nada—, pero es una
  frase vacía. Como el `Math.max` es cinturón contra un orden que hoy no puede
  darse, lo doy por bueno; queda anotado.
- **Solape × sin duración.** Con 8:00–10:00 y un ítem a las 9:00 sin duración,
  las filas son `gap, item, item, unknown` y **no aparece ningún hueco** entre
  el solape y el fin del día, aunque la barra sí lo siga enseñando. Lo verifiqué
  con mi propio test. **Tampoco dice nada falso**: es cierto que no se sabe
  dónde acaba ese ítem y, por tanto, que no se puede afirmar qué queda libre
  después. Es la lectura conservadora, y es la coherente con el criterio 145.

**Las tres desviaciones, juzgadas**

1. **La canaleta vacía en la fila de hueco: correcta.** Abrí el render
   (`10-vida-huecos-plantilla.html`) y, en efecto, la hora no se repite ahí: ya
   va dentro de «Libre 8:40 → 9:00». La canaleta se mantiene con su medida, y en
   pantalla **la columna de horas de los ítems no se mueve** —lo vi—.
2. **Un hueco normal sin `onPlace` no degrada a línea fina: correcta, y era la
   única salida sensata.** Con la degradación, en esta tajada **todos** los
   huecos se verían finos y el visual aprobado no existiría hasta la tajada 2,
   que es justo lo que una tajada vertical no puede permitirse. Lo que separa
   fino de normal sigue siendo el umbral (143); lo que separa pulsable de no
   pulsable es `onPlace`, y en esta tajada no llega de nadie.
3. **`TemplateRow` con `id`: correcta y trivial.** Es la `key` de React; el id
   del hueco se compone con las mismas horas que el `segment` hermano.

**Los dos tests acotados: no relajan nada**

Los dos contaban `listitem` para afirmar **los nombres y su orden**. Ahora
filtran las filas que empiezan por «Libre » o «No sabemos » y hacen **la misma
afirmación** sobre las tarjetas: misma lista, mismo orden, mismo `toEqual`. No
se ha borrado ni una aserción —`--numstat` da 142 añadidas y **6** borradas, y
las seis son las dos expresiones sustituidas—.

**Ni una constante ni un formateador de más**

`MIN_GAP_MINUTES` se importa de `vida-time.utils.ts:167`; en el diff no hay otro
umbral. `MIN_PLACEMENT_MINUTES` y el tercer `isSliver` de
`vida-execution.utils.ts` **no se han tocado** —siguen siendo deuda de Hoy, y
fuera de esta tajada—. Y **no está escrito el «→ Acaba a las 11:30»** del
render: `grep -rn "Acaba a las" src/` no devuelve nada, así que la tajada 2 de
FEAT-008 sigue sin invadirse.

**En el navegador, por mí** (la deuda que venía de la tajada)

El 5173 del usuario estaba arriba y **el panel tenía sitio**: monté un arnés con
los **componentes reales** y las filas que devuelve `buildTemplateDay` de verdad
—seis ítems, un resto de 5 minutos y un ítem sin duración con un nombre de 60
caracteres—, dentro de la `ol` real de la plantilla; lo serví desde ese 5173
—**no arranqué ningún servidor**— y lo **borré**: `git status` no lo lista.
Todo lo medido está en la tabla de arriba.

**Línea base, corrida entera por mí**

| Qué | `ENVIRONMENT.md` | Constructor | **Medido ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos |
| `pnpm test` | 2 de 1589 | 2 de 1611 | **2 fallidos de 1611**, 109 archivos de 110 en verde |
| `pnpm build` | 1.093,96 kB | 1.096,35 kB | **exit 0**, `index` **1.096,35 kB** (+2,39), `app-icons` **620,20 kB sin tocar** |

**Hallazgos — se anotan, no devuelven la tajada**

1. **El criterio 146 pide la hora y la línea dice «el final del día».** El
   criterio escribe el ejemplo con el número —«…hasta las 22:00»— y lo que se
   pinta es «…hasta el final del día». Lo que el criterio **exige** —que la
   línea hable del fin del día— se cumple, y por eso no devuelvo; pero el módulo
   dice los números en todas partes y el render usa la hora en el caso de en
   medio («hasta las 14:00»). **Es una palabra**: que lo decida el usuario.
2. **El criterio 150 se cumple por medio píxel.** 32,8 px frente a 33,35 (la
   mitad de 66,7). Es cierto hoy; cualquier retoque de `padding` en la fila lo
   rompe sin que nadie se entere, porque no hay test de alto —no puede haberlo
   fuera del navegador—. Queda dicho para quien toque esos estilos.
3. **Los dos tests acotados filtran por el texto** («Libre », «No sabemos »).
   Si esas frases cambian, el filtro deja de filtrar; el fallo saldría en voz
   alta, pero el acoplamiento entre un test de FEAT-005 y una frase de FEAT-009
   conviene saberlo.
4. **El criterio 147 no tiene test de espías.** Lo he verificado sobre el diff
   —la página no gana ni un hook— y me vale, pero si la tajada 2 monta algo,
   ese test sí hará falta.
5. **`ENVIRONMENT.md` vuelve a quedarse corto** (hoy **1611** tests y
   **1.096,35 kB**). **No lo he tocado** — es la regla.

**Lo que no he podido revisar:** `/app/vida/plantilla` con sesión —criterio
**171**—: la vista real con sus datos, el tacto en un teléfono de verdad y el
fondo con el degradado de la aurora. Lo de arriba está medido sobre los
componentes y las hojas de estilo reales, pero fuera de la aplicación con
sesión.

### Tajada 2 — El toque precarga la hora y la duración

**Veredicto: `accepted`** — los nueve criterios de la tajada (153–161), más el
162, el 147 con espías, el 170 y el 169, se cumplen y los he verificado yo.
**Pero la acepto con una recomendación que va primero porque pesa más que
cualquier detalle de los que siguen: el criterio 150 hay que reescribirlo, y el
hueco pulsable tiene que medir 44 px.** Lo que hoy se entrega —**30,8 px**,
medidos por mí— cumple el criterio **como está escrito** y es, al mismo tiempo,
un defecto de uso bajo la premisa que el usuario acaba de fijar. No devuelvo la
tajada porque el constructor no puede cumplir las dos cosas a la vez: el
criterio viejo le prohíbe justamente lo que la premisa nueva le pide.

**El juicio que se me pidió: el dedo gana, y por qué**

La premisa nueva (`docs/vida/PLAN.md`, «La premisa que manda sobre todo lo demás»)
dice que **registrar no puede costar más que hacer** y que cada paso de más «no
es una molestia: es una razón para que el producto deje de funcionar». Con eso
encima de la mesa:

1. **El criterio 150 se escribió para un texto, no para un botón.** Lo redactó
   el analista cuando la fila era **lectura** —«que no compita con las tarjetas»
   es una regla de densidad visual— y yo lo medí en la tajada 1 con la fila
   siendo un párrafo: 32,8 px contra 33,35, y ya entonces escribí que el margen
   era de medio píxel y frágil. En la tajada 2 esa misma fila pasa a ser **el
   atajo principal para llenar el día**. Una regla de densidad no puede seguir
   gobernando un control.
2. **El propio módulo ya fijó el número.** FEAT-008 dejó los campos de horas y
   minutos en **44 px** y ahí nadie discutió. Un botón de 30,8 px en la misma
   pantalla es incoherente con lo que este repositorio ya considera «tocable».
3. **La consecuencia de fallar el toque es exactamente lo que la premisa
   prohíbe:** si al ir a poner algo en el hueco se abre la hoja del ítem de
   arriba —tarjetas de 66,7 px a 2 mm— el usuario paga dos pasos y una
   corrección. Y si eso pasa un par de veces, deja de usar el atajo, que es
   tanto como no tener la feature.
4. **Lo que se pierde es poco y se recupera.** Subir el hueco a 44 px deja la
   tarjeta de ítem (66,7) todavía claramente por encima: el hueco seguiría
   siendo **dos tercios** de una tarjeta, de **una sola línea de texto** y
   visualmente más liviano —que es lo que el criterio quería—, sin scroll
   horizontal (el ancho no cambia).

**Mi recomendación, con número, para que el analista la escriba:** el criterio
150 pasa a decir que la fila de hueco **es de una sola línea de texto y no tiene
scroll horizontal a 375 px**, que **el hueco pulsable mide al menos 44 px de
alto** y que **la fila de hueco no pasa de dos tercios (≈66 %) del alto de una
tarjeta de ítem**. El hueco fino y la línea de «no sabemos» —que **no** se
pulsan— se quedan como están (24,5 y 67 px). Mientras eso no se escriba, **el
hueco no debería entregarse a 30,8 px**: es una línea de `padding` y es lo
primero que haría en la tajada 3.

Si el usuario prefiere que mande el 150 tal cual, la razón sería la densidad —la
lista con seis huecos se alarga—; me parece peor, porque la lista ya hace scroll
vertical de todas formas y lo que se protege ahí es una estética, mientras que
lo que se pierde es el atajo.

**Criterios, uno por uno** (contra la sección 1)

| # | Estado | Evidencia que he comprobado yo |
|---|---|---|
| 153 | **cumplido, con el matiz que él declara** | Pulsar un hueco abre «Añadir a mi Vida» —**no** `VidaActivitySheet`— con el día marcado, la hora y la duración dentro. El matiz: ver abajo. |
| 154 | **cumplido, las dos mitades** | `pick()` solo vacía `startTime`/`durationMinutes` **si no hay `gapPrefill`**; el «+» flotante y el atajo del día vacío pasan por `openAdd()`, que lo suelta antes. Dos tests, uno por mitad. |
| 155 | **cumplido** | La duración es `row.minutes`, el hueco **entero**, sin tope ni redondeo: 20 min para 8:40→9:00 y 90 para 6:30→8:00, comprobado en los tests con los campos ya repartidos. |
| 156 | **cumplido** | Test: tres huecos pulsados y el panel cerrado → `createItem`, `updateItem` y `deleteItem` **sin llamadas**. |
| 157 | **cumplido** | Test con `toEqual` sobre el cuerpo: es el mismo que escribiendo la hora y la duración a mano, **sin un campo nuevo**. |
| 158 | **cumplido** | Test: guardando 20 min en un hueco de 60 desaparece «Libre 8:40 → 9:00 · 20m» y queda «Libre 9:00 → 9:40 · 40m». Sale de `rows`, que se recalcula solo. |
| 159 | **cumplido** | En escritorio no se abre hoja (`!isDesktop` manda el `setAddOpen`), el foco va al buscador —`useEffect` sobre `appliedToken`, y con actividad ya elegida no hace nada, que es lo que pide el 160— y el panel dice «Viene del hueco que pulsaste · para las 8:40 · 20m libres». |
| 160 | **cumplido** | El `token` sube en cada toque, así que dos huecos iguales se aplican los dos; en el `if` de render **solo** se tocan `startTime` y `durationMinutes`: ni `picked` ni `days`. Test propio del caso. |
| 161 | **cumplido, verificado en pantalla** | El fino y la línea de «no sabemos» **no reciben `onPlace`** (la página se lo pasa solo a `gap && !isSliver`): en mi arnés, de las once filas solo **cuatro** son `button`, y el fino sigue siendo un `<p>`. |
| 162 | **cumplido** | El rótulo dice qué se hace, no «botón»: «Poner algo a las 6:30, 1 h 30 min libres». Enfocable con teclado (comprobado en el navegador). |
| 147 | **cumplido, ahora con espías** | Test: pulsar tres huecos no estrena ninguna consulta (`[...new Set(queryHooks)]` idéntico) y la ventana de patrones sigue apagada. |
| 170 | **cumplido, la puerta de FEAT-008 viva** | Un hueco de 90 min deja «1» y «30» en los dos campos, y uno de 20, «0» y «20». Es la regla de sincronización del borrador que revisé en FEAT-008 funcionando desde otra pantalla. |
| 150 | **cumplido como está escrito, y por eso hay que reescribirlo** | Medido por mí: botón de hueco **30,8 × 297,4 px** frente a tarjeta de **66,7 px** (la mitad son 33,35). Ver el juicio de arriba. |
| 169 | **cumplido, línea base corrida entera por mí** | Ver abajo. |
| 171 | **pendiente del usuario** | Lo de siempre. |

**El matiz del criterio 153: aceptable, y además es lo correcto**

El panel abre enseñando **el catálogo**, así que «A qué hora» y «Cuánto» no
están a la vista hasta elegir la actividad, mientras el render los dibuja
juntos. Lo he pensado con la premisa delante y **no lo considero un
incumplimiento**: el criterio pide que el panel se abra **con el día marcado, la
hora y la duración puestas**, y lo están —el test lee los campos con sus valores
en cuanto se elige—; lo que cambia es **cuándo se ven**, no si están. Y sobre
todo: en la plantilla añadir **es** elegir del catálogo, así que enseñar primero
el catálogo es el paso que el usuario ya iba a dar. Si el panel abriera con los
campos delante, la persona tendría que **bajar a buscar la actividad** de todas
formas: sería un paso más, no menos. Lo que sí cerraría la brecha con el render
—y lo anoto como sugerencia, no como pega— es que la frase «Viene del hueco que
pulsaste · para las 8:40 · 20m libres», que **sí** se ve desde el primer
momento, es hoy lo único que confirma que el toque hizo algo: está bien
colocada y es suficiente.

**Lo demás que se me pidió con lupa**

- **La hora de fin no está escrita:** `grep -rn "Acaba a las" src/` → **cero**.
  FEAT-008 tajada 2 sigue sin invadirse.
- **Mi encargo de la tajada 1, cerrado:** la línea del ítem sin duración que
  cierra el día ahora dice **la hora**. Leído en pantalla: «No sabemos cuánto
  dura *Working at lululemon*, así que no podemos decir qué queda libre **hasta
  las 23:00**.» Una sola frase para los dos casos, que es mejor que dos.
- **El `token` en `useState` y no en `useRef`:** es el mismo patrón que validé
  en FEAT-008 —ajustar estado cuando cambia una prop, **en render**, sin
  `useEffect` y sin tick de más— y mantiene el lint en 14. Correcto.
- **La plantilla no se ha roto:** el «+» flotante y el atajo del día vacío pasan
  por `openAdd()` y **siguen vaciando**; el panel del aside y la hoja de móvil
  son **la misma implementación** con una prop más, aditiva y con defecto
  `null`; cambiar de día **suelta** el prefill (su hora era de otro día) y
  guardar también. Los tests de FEAT-005 siguen enteros: el diff del test de la
  página **no borra ni una afirmación**.

**En el navegador, por mí**

El 5173 lo dejó arriba el constructor y lo usé —**no arranqué ni paré nada**—.
Arnés propio con los componentes reales y las filas de `buildTemplateDay`, con
`onPlace` en los huecos de 15 min o más; borrado después (`git status` no lo
lista). Lo medido: las cuatro filas pulsables son `button` de **30,8 × 297,4
px**, las tarjetas **66,7**, el fino **24,5** (y **no** es botón), la línea de
«no sabemos» **67**; `scrollWidth === clientWidth === 375`; el botón toma foco y
su rótulo accesible es el correcto; el «+» mide 16 px.

**Línea base, corrida entera por mí**

| Qué | `ENVIRONMENT.md` | Constructor | **Medido ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos |
| `pnpm test` | 2 de 1611 | 2 de 1622 | **2 fallidos de 1622**, 109 archivos de 110 en verde |
| `pnpm build` | 1.096,35 kB | 1.097,09 kB | **exit 0**, `index` **1.097,09 kB** (+0,74), `app-icons` **620,20 kB sin tocar** |

**Hallazgos — se anotan, no devuelven la tajada**

1. **El tamaño de toque: 30,8 px.** Es el hallazgo número uno de esta feature y
   está arriba con su recomendación (**44 px** y el criterio 150 reescrito). Lo
   declaró el propio constructor, y hace bien en declararlo.
2. **El foco al buscador solo ocurre si el buscador está montado.** Es lo que
   pide el 160 —pulsar otro hueco no devuelve al catálogo—, pero significa que,
   con una actividad ya elegida, **pulsar un hueco no mueve el foco a ninguna
   parte**: los campos cambian de valor sin que un lector de pantalla se entere.
   Un `aria-live` en la frase «Viene del hueco que pulsaste» lo arreglaría.
3. **`gapPrefill` se suelta al cambiar de día, al guardar y al cerrar la hoja**,
   pero **no** al elegir otra actividad estando ya precargado (es lo correcto
   por el 154), ni al editar la hora a mano: si el usuario cambia la hora y
   luego pulsa **el mismo** hueco otra vez, el `token` hace que se vuelva a
   aplicar —correcto y querido, queda dicho por si sorprende—.
4. **`ENVIRONMENT.md` vuelve a quedarse corto** (hoy **1622** tests y
   **1.097,09 kB**). **No lo he tocado** — es la regla.

**Lo que no he podido revisar:** el recorrido con sesión —criterio **171**— y,
sobre todo, **el dedo de verdad sobre un hueco de 30,8 px**, que es justo lo que
esta revisión no puede cerrar y lo que más me importa de ella.
