---
id: FEAT-009
title: Los huecos llegan a la plantilla — el tiempo libre entre ítems, y un toque lo llena
status: planned
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
- [ ] 150. **Móvil, el alto**: a 375 px una fila de hueco ocupa **una sola línea
      de texto** y mide **menos de la mitad** que una tarjeta de ítem del mismo
      día (medido con `getBoundingClientRect`), y con seis ítems y sus huecos la
      página no tiene scroll horizontal (`scrollWidth === clientWidth === 375`).
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
| 1 | **Los huecos se ven.** Entre ítems, antes del primero y después del último, con su rango y su tamaño; los de menos de 15 min en línea fina; los solapes sin hueco; y el ítem sin duración con su línea que no miente. Nada se pulsa todavía. Ya sirve: la plantilla se lee como agenda y se ve dónde queda sitio. | pendiente |
| 2 | **El toque precarga.** Pulsar un hueco abre «Añadir a mi Vida» con la hora y la duración del hueco puestas, se elige actividad y se guarda. Es lo que pidió el usuario, entero. | pendiente |
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
| 1 | **Los huecos se ven.** Las tres formas pintadas, nada pulsable todavía. | **M** `utils/vida-template.utils.ts` (`:83-87` tipo, tipos nuevos tras `:87`, `:89-105` campo `rows`, bucle `:216-249`) · **M** `utils/vida-template.utils.test.ts` (describe al final) · **C** `components/VidaTemplateGapRow/{VidaTemplateGapRow.tsx,.module.scss,index.ts}` · **M** `pages/VidaPlantillaPage.tsx:410-421` (+ import) · **M** `pages/VidaPlantillaPage.test.tsx` (describe tras `:207`) | 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 166, 167, 168, 169 | pendiente |
| 2 | **El toque precarga.** Pulsar un hueco abre «Añadir a mi Vida» con hora y duración puestas y sobrevive a elegir actividad. | **M** `components/VidaTemplateAddPanel/VidaTemplateAddPanel.tsx` (props `:35-44`, sync en render, `pick()` `:107-113`, `onSuccess` `:142-146`, línea del hueco tras `:253`, `ref` del buscador `:341-347`) · **M** `components/VidaTemplateGapRow/VidaTemplateGapRow.tsx` (rama `<button>`) · **M** `pages/VidaPlantillaPage.tsx` (estado + `:446` y `:462`) · **M** `pages/VidaPlantillaPage.test.tsx` (describe tras `:634`) | 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 166, 167, 168, 169, **170** | pendiente |
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

*(pendiente)*

## 4. Revisión — feature-reviewer

*(pendiente)*
