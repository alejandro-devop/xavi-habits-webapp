---
id: FEAT-009
title: Los huecos llegan a la plantilla — el tiempo libre entre ítems, y un toque lo llena
status: specified
architect: yes    # la geometría del hueco ya existe dos veces (Hoy y la plantilla) y el final de un ítem de plantilla es derivado y puede no existir: decidir de dónde sale el hueco y cómo se precarga el alta es código compartido, no una tajada
area: features/vida
requested: 2026-09-22
updated: 2026-09-22
---

# FEAT-009 — Los huecos llegan a la plantilla

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

*(pendiente)*

## 3. Construcción — feature-builder

*(pendiente)*

## 4. Revisión — feature-reviewer

*(pendiente)*
