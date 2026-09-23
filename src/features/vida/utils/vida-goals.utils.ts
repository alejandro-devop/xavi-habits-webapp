/**
 * **Los arcos de las metas de Hoy** (FEAT-016, tajada 2).
 *
 * La versión **viva** de lo que `buildCategoryBreakdown`
 * (`vida-review.utils.ts:904-1039`) hace con un día ya cerrado: allí es la foto
 * de Revisión, aquí es el día en marcha —con la sesión abierta contada hasta el
 * minuto actual— y lo que todavía falta.
 *
 * **Aquí ya no se proyecta ninguna hora** (FEAT-019, tajada 5, criterio 589):
 * la hora a la que pararías a este ritmo se calculaba y se enseñaba, y el
 * usuario la quitó. La única hora que queda es la del `'passed'`, que
 * **ocurrió**.
 *
 * Tres cosas se imitan de allí y **solo** tres: leer
 * `session.activity?.category ?? null` y tratar el nulo como su propio cubo, el
 * reparto «tally → formato» (esta función devuelve minutos **y** etiquetas ya
 * compuestas **y** un `share` de 0 a 1; el componente solo pinta) y los
 * formateadores de `vida-time.utils.ts`. Nada del lado del plan
 * (`plannedMinutes`, `missing`, `offPlanCount`) y **ni una vez la palabra
 * «Sin categoría»**: aquí la palabra es **«sin dato»**.
 *
 * **Nada aquí dice «trabajo»**: la meta es un dato que llega dentro de la
 * categoría (`ActivityCategory.goal`). Que hoy se vea un solo arco lo garantiza
 * la base —una sola meta por usuario— y no un tope en la vista.
 *
 * **La medianoche no se arregla aquí**: `minutesToTime` corta en 23:59, así que
 * una hora de parada posterior se lee «23:59». Es un límite conocido del módulo
 * entero (sección 1 del dossier), no de esta función.
 */
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import type { VidaGoal } from '@/features/vida/types/vida-goal.types'
import { VIDA_DAY_ORDER, getVidaDayOfWeek } from '@/features/vida/utils/vida-date.utils'
import type { SessionSpan } from '@/features/vida/utils/vida-execution.utils'
import { toSessionSpans } from '@/features/vida/utils/vida-execution.utils'
import {
  formatDurationFromMinutes,
  formatDurationMinutes,
  formatTimeForDisplay,
  minutesToTime,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

/**
 * **El margen a partir del cual el semáforo está en verde**, en minutos
 * (FEAT-019, criterio 567; decisión D1 del expediente).
 *
 * Una hora de colchón entre lo que falta y el final del día. Es lo que propone
 * el render 20 y el usuario no lo confirmó palabra por palabra: vive aquí, en
 * una constante exportada, **para que cambiarlo sea una línea** y no una
 * excavación por la función.
 */
export const GOAL_FIT_OK_MARGIN_MINUTES = 60

/**
 * **Por debajo de qué parte de la meta el día se considera corto de verdad**
 * (FEAT-019, tajada 5, criterio 585).
 *
 * El rojo pide **dos** cosas, no una: que lo que falta ya no quepa **y** que el
 * día vaya a acabar por debajo de esta fracción de la meta. Existe porque el
 * semáforo miraba solo el reloj que queda por delante y nunca lo que ya llevas
 * hecho: a las 23:05, con el día acabado a las 22:00 y 7 h 09 de 8 h
 * trabajadas, «ya no cabe» es cierto e inútil, y el arco rojo se leía como un
 * veredicto sobre una jornada buena.
 *
 * **El 0,8 es del usuario, palabra por palabra** («creo que completé al menos
 * un 80 % de mi jornada, debería ser naranja o verde (80 % me parece bien)»),
 * no una propuesta del render: no se toca sin volver a preguntárselo.
 */
export const GOAL_FIT_SHORT_DAY_RATIO = 0.8

/**
 * **Con qué días nace una meta**, y contra qué se compara cuando todavía no hay
 * ninguna (FEAT-019, criterio 575).
 *
 * De lunes a viernes: el mismo valor que el `DEFAULT` de `vida_goals.active_days`
 * (migración 070 del API). Está aquí duplicado a propósito y no llega por la
 * red: mientras **no** hay ninguna meta en el catálogo no hay `activeDays` que
 * mirar, y aun así hay que decidir si un sábado se hace la pregunta «¿cuál de
 * estas es tu trabajo?». Si el día de mañana cambia el `DEFAULT` de la columna,
 * cambia esta línea con él.
 */
export const DEFAULT_GOAL_ACTIVE_DAYS: readonly VidaDayOfWeek[] = VIDA_DAY_ORDER.slice(0, 5)

/**
 * **¿Cuenta esta lista de días el día mostrado?**
 *
 * Un sábado para una meta de lunes a viernes no es un día en rojo: la meta
 * **ese día no existe** (criterio 578). Por eso el filtro pasa por quitar la
 * meta del reparto —no hay arco, ni semáforo, ni nodo oculto—, y no por pintar
 * un arco vacío.
 */
function countsOn(activeDays: readonly VidaDayOfWeek[], date: string): boolean {
  return activeDays.includes(getVidaDayOfWeek(date))
}

/** Un arco: una meta, lo que llevas de ella hoy y la hora que sale de ahí. */
export type VidaGoalArc = {
  /** La meta entera, tal como vino del catálogo: nombre, icono, color, minutos. */
  goal: VidaGoal
  /** Las categorías que apuntan a ella, en el orden del catálogo. */
  categoryIds: string[]
  workedMinutes: number
  /** Corta, la del arco: «3h 40». */
  workedLabel: string
  targetMinutes: number
  /** Corta: «8h». */
  targetLabel: string
  /** De 0 a 1, **topado en 1** para el trazo del arco. */
  share: number
  /** Lo que pasa de la meta. 0 si no se pasó. */
  overMinutes: number
  /** «18:40», la hora a la que se cruzó la meta. `null` si no se cruzó. */
  passedAtTime: string | null
  /** La sesión en marcha que cuenta para esta meta, o `null`. */
  runningTitle: string | null
  /** «10:15», la hora a la que arrancó esa sesión. `null` si no hay ninguna. */
  runningSince: string | null
  /**
   * Lo grande de dentro del arco. **Lo que falta para la meta** mientras no se
   * ha cruzado y hay reloj («4h 30», criterio 559): el arco mide horas
   * trabajadas, así que dentro va una cantidad de horas y no una hora del
   * reloj. El usuario tuvo que preguntar cuál de las dos era.
   *
   * Sigue siendo **una hora** en los dos casos en que no falta nada que
   * anunciar: pasada la meta, la hora a la que se cruzó (criterio 562); y en un
   * día que ya terminó sin cruzarla, los minutos registrados (criterio 563).
   */
  arcValue: string
  /**
   * El rótulo de encima, en versales, **partido en las líneas que caben dentro
   * del arco**: `['A ESTE RITMO', 'PARAS A LAS']`.
   *
   * Es una lista y no una frase por una razón medida: dentro del semicírculo
   * (radio interior 81) a la altura del rótulo caben ~147 unidades, y
   * «A ESTE RITMO PARAS A LAS» ocupa ~149 a 9,5 px con `letter-spacing: 0.06em`.
   * En una sola línea el trazo se comía las puntas y el usuario leía un
   * fragmento: no entendía si el número grande era una hora o el tiempo que le
   * faltaba. Partirlo cabe, y deja decir **«a las»**, que es la palabra que
   * convierte «20:25» en una hora del reloj y no en una cuenta atrás.
   *
   * Las entradas de una sola línea son las dos en que el valor **no** es una
   * hora sino una duración: «TE FALTAN» (criterio 559) y la del día pasado sin
   * meta cruzada («REGISTRASTE»).
   */
  arcCaption: string[]
  /**
   * La misma frase, entera y en texto de verdad, para el `<p>` de fuera del
   * SVG — que es **de 1×1 px en los tres estados** (FEAT-019, tajada 5): el
   * SVG es `aria-hidden`, así que esta frase es lo único que un lector de
   * pantalla oye del dibujo, y no puede faltar (criterio 590).
   *
   * **Ya no dice ninguna hora proyectada** (criterio 589): ni «A este ritmo
   * paras a las 17:55», ni «Si arrancas ahora, acabarías a las…». El usuario
   * las quitó las dos —«no lo veo necesario… solo con saber cuánto me quedó
   * faltando es suficiente»— y, sin la hora, la frase repetía la cabecera
   * («7h 09 de 8h») y el interior del arco («TE FALTAN 51m»). Lo que queda en
   * el estado `'missing'` es el interior del arco dicho en texto, para quien
   * no ve el arco.
   *
   * **Sin adjetivos, sin exclamaciones y sin reproche**, también pasada la
   * meta (criterio 493) y también en rojo (criterio 572).
   */
  line: string
  /**
   * **Qué se está diciendo dentro del arco.**
   *
   * `'missing'` es lo que falta (criterio 559). En `'passed'` (la hora a la
   * que se cruzó la meta, criterio 562) y `'logged'` (lo registrado en un día
   * que ya terminó, criterio 563) el arco **no cambia nada** respecto a
   * FEAT-016 — y el 589 los deja igual a propósito: la hora del `'passed'`
   * **ocurrió**, no es una predicción, y sin ella ese arco se queda sin nada
   * que enseñar.
   *
   * Lo usa el componente para la geometría del rótulo y del número, no para
   * decidir si `line` se ve: desde la tajada 5 **no se ve en ninguno**
   * (criterio 564, el hallazgo de la doble lectura de FEAT-016 tajada 3, ahora
   * trivialmente a salvo: un solo nodo y siempre la misma clase).
   */
  variant: 'missing' | 'passed' | 'logged'
  /**
   * **Lo que falta para la meta**, en minutos. `0` si ya se cruzó.
   *
   * Es el mismo número que `arcValue` dice en el estado `'missing'`, sin
   * formatear: el semáforo se calcula con él y así no hay dos restas que
   * puedan dejar de coincidir.
   */
  missingMinutes: number
  /**
   * **El margen, con signo**: `(dayEnd − ahora) − missingMinutes`.
   *
   * Positivo, lo que falta cabe antes de que se acabe el día y aún sobra;
   * negativo, hoy ya no da. `null` fuera de la ventana del semáforo (meta
   * cruzada, día pasado, día sin reloj).
   *
   * **No sale de `budget.remainingMinutes`** aunque sea la misma resta: ese
   * está topado en `max(0, …)` y después de la hora de fin mentiría. Viene de
   * `dayEnd`, el mismo `'HH:mm'` que recibe `getDayBudget` — y es `null`
   * también mientras ese dato no sea real (ver `BuildGoalArcsInput.dayEnd`).
   */
  fitMinutes: number | null
  /**
   * **El semáforo** (criterios 566–569 y 585): `'ok'` verde, `'tight'`
   * naranja, `'over'` rojo. `null` = **sin ningún color** (criterios 571 y
   * 573).
   *
   * Mide si lo que falta **cabe antes de que se acabe el día**, no el
   * porcentaje de la meta. La diferencia no es un detalle: por porcentaje, un
   * lunes a las 9:15 con 15 minutos hechos estaría en rojo, y el arco estaría
   * regañando por ir al ritmo de cualquier lunes en un módulo escrito entero
   * para no juzgar. Por margen, ese mismo lunes es verde (criterio 570).
   *
   * **Pero el margen solo no basta para el rojo** (tajada 5): mira hacia
   * adelante y nunca hacia lo ya hecho, y con el día acabado siempre dice «ya
   * no cabe», que es cierto e inútil. El rojo pide además que el día vaya a
   * acabar corto de verdad — ver `toFitLevel` y `GOAL_FIT_SHORT_DAY_RATIO`.
   *
   * **Es una marca visual y nada más** (criterio 572): ni una palabra cambia
   * en `line` ni en `arcCaption` por llevar color, tampoco en rojo.
   */
  fitLevel: 'ok' | 'tight' | 'over' | null
}

export type VidaGoalArcs = {
  /** Una por meta con al menos una categoría apuntándola, por `orderIndex` y luego nombre. */
  arcs: VidaGoalArc[]
  /** Minutos de hoy de sesiones **sin categoría** (`category === null`). */
  noDataMinutes: number
  /** «2 h 40 min sin dato hoy.» Cadena vacía si no hay ninguno. */
  noDataLabel: string
  /**
   * **Si este día admite la pregunta** «¿Cuál de estas es tu trabajo?»
   * (criterio 580).
   *
   * `false` un día que ninguna meta cuenta: **el mismo dato que esconde el arco
   * esconde la pregunta**, y por eso no pueden divergir. Si la pregunta saliera
   * un sábado, tocar una categoría no haría aparecer ningún arco —lo que el
   * criterio 501 de FEAT-016 promete— y el usuario se quedaría mirando un hueco
   * después de contestar.
   *
   * Sin ninguna meta en el catálogo todavía no hay `activeDays` que mirar: se
   * compara con `DEFAULT_GOAL_ACTIVE_DAYS`, que es con lo que nacerá la meta que
   * cree esa misma pregunta.
   */
  promptAllowed: boolean
}

export type BuildGoalArcsInput = {
  followUps: ActivityFollowUp[]
  /** `YYYY-MM-DD` del día mostrado. */
  date: string
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes: number | null
  /** El catálogo: de aquí salen las metas y el cruce por `category.id`. */
  categories: ActivityCategory[]
  /** Un día ya terminado: se cuenta en pasado y **sin proyección** (D-B). */
  isPastDay: boolean
  /**
   * `'HH:mm'` en que termina el día del usuario. **El mismo dato que recibe
   * `getDayBudget`** (`useVidaDayHours().dayHours.endTime`), y por eso se llama
   * igual: contra él se mide si lo que falta todavía cabe hoy.
   *
   * **`null` mientras el dato no es real todavía**, y entonces no hay
   * semáforo. `useVidaDayHours` devuelve el respaldo de las 23:00 mientras
   * cargan los ajustes, así que un usuario cuyo día acaba a las 18:00 vería el
   * arco **verde y saltando a rojo** un instante después. Un rojo que aparece
   * solo porque una consulta iba a medio camino es exactamente el reproche que
   * el criterio 572 no quiere: mejor sin color hasta que se sepa. El campo
   * sigue siendo obligatorio: lo que no se admite es olvidarlo, no decir «aún
   * no lo sé».
   */
  dayEnd: string | null
}

type GoalTally = {
  goal: VidaGoal
  categoryIds: string[]
  categoryIdSet: Set<string>
  spans: SessionSpan[]
}

/**
 * La categoría de una sesión, con el nulo como su propio caso (criterio 494).
 * Mismo gesto que `categoryKeyOf` en `vida-review.utils.ts`, reducido a lo que
 * aquí hace falta: el `id` y nada más.
 */
function categoryIdOf(span: SessionSpan): string | null {
  return span.session.activity?.category?.id ?? null
}

/**
 * **La hora a la que se cruzó la meta** (criterio 493).
 *
 * No es `ahora − lo que sobra`: los minutos de una meta no son un chorro
 * continuo. Se recorren los tramos **ordenados por hora** —`toSessionSpans` ya
 * los devuelve así— acumulando, y la hora es el punto exacto dentro del tramo
 * en que el acumulado alcanza la meta.
 */
function passedAtOf(spans: SessionSpan[], targetMinutes: number): string | null {
  let accumulated = 0
  for (const span of spans) {
    if (accumulated + span.durationMinutes >= targetMinutes) {
      return minutesToTime(span.startMinutes + (targetMinutes - accumulated))
    }
    accumulated += span.durationMinutes
  }
  return null
}

/**
 * **Los arcos del día mostrado.**
 *
 * Las metas salen del **catálogo**, agrupando `categories.filter(c => c.goal)`
 * por `goal.id`: no hay lista de metas por otro lado y por eso no hace falta
 * ninguna consulta nueva. Una meta sin ninguna categoría apuntándola **no
 * produce arco** — que es justo el estado de la pregunta (tajada 3).
 *
 * Una sesión empezada **antes** de la hora de inicio del día cuenta entera, sin
 * recortar (D-A): las cifras del día ya se comportan así, y recortarla mentiría
 * en lo único que importa aquí.
 */
export function buildGoalArcs({
  followUps,
  date,
  nowMinutes,
  categories,
  isPastDay,
  dayEnd,
}: BuildGoalArcsInput): VidaGoalArcs {
  const tallies = new Map<string, GoalTally>()
  for (const category of categories) {
    const goal = category.goal
    if (!goal) continue
    const existing = tallies.get(goal.id)
    if (existing) {
      existing.categoryIds.push(category.id)
      existing.categoryIdSet.add(category.id)
      continue
    }
    tallies.set(goal.id, {
      goal,
      categoryIds: [category.id],
      categoryIdSet: new Set([category.id]),
      spans: [],
    })
  }

  // **El día no laborable se resuelve aquí y en ningún otro sitio.** Las metas
  // que no cuentan hoy salen del reparto **antes** de sumar nada: así no hay
  // arco, ni semáforo, ni un nodo escondido con ceros (criterios 576 y 578). Lo
  // que se registre ese día se sigue guardando igual —esto no toca ninguna
  // sesión, solo contra qué se suman (criterio 577)—, y cada meta se mide por
  // **sus propios** días (criterio 579).
  const goalsInCatalog = tallies.size
  for (const [goalId, tally] of tallies) {
    if (!countsOn(tally.goal.activeDays, date)) tallies.delete(goalId)
  }
  // Sin ninguna meta en el catálogo la pregunta se rige por los días con los que
  // nacería la meta que ella misma crea; con metas, por si alguna cuenta hoy.
  const promptAllowed =
    goalsInCatalog === 0 ? countsOn(DEFAULT_GOAL_ACTIVE_DAYS, date) : tallies.size > 0

  const spans = toSessionSpans({ followUps, date, nowMinutes })
  let noDataMinutes = 0
  for (const span of spans) {
    const categoryId = categoryIdOf(span)
    if (categoryId === null) {
      // Sin categoría: no suma en ninguna meta y **se confiesa** aparte. Una
      // sesión cuya categoría existe pero no apunta a ninguna meta no entra
      // aquí: de esa ya se sabe que no cuenta (criterio 494).
      noDataMinutes += span.durationMinutes
      continue
    }
    for (const tally of tallies.values()) {
      if (tally.categoryIdSet.has(categoryId)) tally.spans.push(span)
    }
  }

  const arcs = [...tallies.values()]
    .sort(
      (a, b) =>
        a.goal.orderIndex - b.goal.orderIndex || a.goal.name.localeCompare(b.goal.name, 'es'),
    )
    .map((tally) => toArc(tally, { nowMinutes, isPastDay, dayEnd }))

  return {
    arcs,
    noDataMinutes,
    noDataLabel:
      noDataMinutes > 0
        ? `${formatDurationMinutes(noDataMinutes)} sin dato ${isPastDay ? 'ese día' : 'hoy'}.`
        : '',
    promptAllowed,
  }
}

/**
 * **El semáforo: el margen para el verde, el margen *y* el día entero para el
 * rojo** (criterios 567, 568, 569 y 585).
 *
 * - **Verde** si sobra más de una hora de margen. **No cambia en la tajada 5**:
 *   verde en este módulo afirma «todavía da para la meta entera», y a las
 *   23:00 con un 89 % hecho eso sería mentira. El módulo no dice cosas que no
 *   son.
 * - **Naranja** si cabe justo —el cero entra aquí: cabe, aunque sin un minuto
 *   de sobra— **y también si ya no cabe pero el día acaba en el 80 % de la
 *   meta o por encima**.
 * - **Rojo** solo cuando se juntan las dos: ya no cabe **y** el día va a
 *   acabar corto de verdad.
 *
 * `bestPossibleMinutes` es lo mejor a lo que puede acabar el día:
 * `workedMinutes + max(0, dayEnd − ahora)`. El `max(0, …)` es el caso que
 * disparó esta tajada —son las 23:05 y el día acababa a las 22:00—: entonces
 * ya no queda día, y lo mejor posible es exactamente lo que ya se llevaba.
 *
 * `null` entra y sale igual: fuera de la ventana no hay color (criterios 571
 * y 573).
 */
function toFitLevel(
  fitMinutes: number | null,
  day: { bestPossibleMinutes: number; targetMinutes: number },
): VidaGoalArc['fitLevel'] {
  if (fitMinutes === null) return null
  if (fitMinutes > GOAL_FIT_OK_MARGIN_MINUTES) return 'ok'
  if (fitMinutes >= 0) return 'tight'
  // Ya no cabe. ¿Y aun así el día acaba bien? Entonces no es un rojo: es un
  // día que se quedó corto por poco, y decirle «rojo» a una jornada de 7 h 09
  // de 8 h es el reproche que este módulo no hace.
  return day.bestPossibleMinutes < day.targetMinutes * GOAL_FIT_SHORT_DAY_RATIO ? 'over' : 'tight'
}

function toArc(
  tally: GoalTally,
  day: { nowMinutes: number | null; isPastDay: boolean; dayEnd: string | null },
): VidaGoalArc {
  const { goal } = tally
  const targetMinutes = Math.max(1, goal.targetMinutes)
  const workedMinutes = tally.spans.reduce((total, span) => total + span.durationMinutes, 0)
  const overMinutes = Math.max(0, workedMinutes - targetMinutes)
  const passedAtTime = workedMinutes >= targetMinutes ? passedAtOf(tally.spans, targetMinutes) : null
  // **Sin reloj no hay proyección** (D-B): un día que ya terminó no tiene un
  // «ahora» desde el que proyectar.
  //
  // Hasta la tajada 5 esto producía además `stopAtTime` —la hora a la que
  // pararías a este ritmo—, y la puerta de abajo se escribía `stopAtTime ===
  // null`. El usuario quitó esa hora de la pantalla («no lo veo necesario…
  // solo con saber cuánto me quedó faltando es suficiente», criterio 589), así
  // que **ya no se calcula ninguna**: la puerta vuelve a ser `canProject`, que
  // es lo que siempre significó, y `stopAtTime` sale del tipo por muerto — no
  // lo leía nadie fuera de esta función.
  const canProject = day.nowMinutes !== null && !day.isPastDay

  const running = tally.spans.find((span) => span.isRunning) ?? null
  const workedLabel = formatDurationFromMinutes(workedMinutes)
  const targetLabel = formatDurationFromMinutes(targetMinutes)
  const workedSentence = formatDurationMinutes(workedMinutes)

  // El dato, sin un adjetivo. Pasada la meta se dice la hora a la que se pasó y
  // se acabó la frase: ni «llevas demasiado», ni un «!», ni un color de alarma
  // (criterio 493). La regla del módulo: **nada de culpa**.
  // La frase va en el formato largo de corrido —«9 h 10 min»— y el rótulo de
  // dentro del arco en el corto —«8H»—: dentro de una misma frase no se mezclan
  // los dos formateadores del módulo.
  const passedSentence =
    passedAtTime !== null
      ? ` Pasaste las ${formatDurationMinutes(targetMinutes)} a las ${formatTimeForDisplay(passedAtTime)}.`
      : ''

  // Lo que falta, que es lo que el arco mide. `targetMinutes > workedMinutes`
  // está garantizado en las dos ramas que lo usan: las de la meta sin cruzar.
  const missingMinutes = Math.max(0, targetMinutes - workedMinutes)
  const missingLabel = formatDurationFromMinutes(missingMinutes)

  // **El margen del semáforo**: lo que queda de día menos lo que falta de
  // meta. Con signo a propósito —`budget.remainingMinutes` está topado en 0 y
  // después de la hora de fin diría que aún cabe—, y solo donde hay un «ahora»
  // desde el que proyectar: `canProject` es la misma puerta que ya decide si
  // hay hora de parada, así que el color no puede aparecer donde no hay
  // proyección (criterios 571 y 573).
  //
  // La medianoche sigue sin arreglarse aquí: un día que termina a las 00:00 se
  // lee como el minuto cero, igual que en `getDayBudget`. Es el límite conocido
  // del módulo, no de esta resta.
  const hasFitWindow = canProject && day.dayEnd !== null
  const fitCandidate = hasFitWindow
    ? parseTimeToMinutes(day.dayEnd!) - day.nowMinutes! - missingMinutes
    : null

  // **Lo mejor a lo que puede acabar el día**: lo que ya llevas más todo el día
  // que queda por delante (criterio 585). El `max(0, …)` no es defensivo: es el
  // caso del que nació esta tajada —son las 23:05 y el día acababa a las
  // 22:00—, donde no queda nada de día y lo mejor posible es lo ya hecho.
  const minutesLeftOfDay = hasFitWindow
    ? Math.max(0, parseTimeToMinutes(day.dayEnd!) - day.nowMinutes!)
    : 0
  const bestPossibleMinutes = workedMinutes + minutesLeftOfDay

  let arcValue: string
  let arcCaption: string[]
  let line: string
  let variant: VidaGoalArc['variant']
  // `null` mientras no se demuestre lo contrario: el color es la excepción —el
  // tramo anterior a cruzar la meta, hoy—, no lo que trae el arco por defecto.
  let fitMinutes: number | null = null
  if (day.isPastDay || !canProject) {
    arcValue = passedAtTime !== null ? formatTimeForDisplay(passedAtTime) : workedLabel
    arcCaption =
      passedAtTime !== null ? [`Pasaste las ${targetLabel}`, 'a las'] : ['Registraste']
    line =
      workedMinutes > 0
        ? `Registraste ${workedSentence} de ${goal.name}.${passedSentence}`
        : `No hay nada registrado de ${goal.name} ese día.`
    variant = passedAtTime !== null ? 'passed' : 'logged'
  } else if (passedAtTime !== null) {
    arcValue = formatTimeForDisplay(passedAtTime)
    arcCaption = [`Pasaste las ${targetLabel}`, 'a las']
    line = `Llevas ${workedSentence}.${passedSentence}`
    variant = 'passed'
  } else {
    // **Dentro del arco va lo que falta, no la hora** (criterio 559). El arco
    // mide horas trabajadas de una jornada: meter dentro una hora del reloj
    // eran dos cosas distintas en el mismo sitio, y el usuario tuvo que
    // preguntar cuál era. Con cero trabajado lo que falta es la jornada
    // entera, y se dice igual (criterio 561): no hay un estado de texto
    // distinto para el día que todavía no ha empezado.
    //
    // **Y la hora proyectada ya no se dice en ninguna parte** (criterio 589,
    // tajada 5). Aquí vivían las dos formas que el usuario quitó —«A este
    // ritmo paras a las H» y «Si arrancas ahora, acabarías a las H»—, y con
    // ellas las dos ramas que se diferenciaban solo en eso. Lo que queda es el
    // interior del arco dicho en texto real, porque el SVG es `aria-hidden` y
    // alguien tiene que decírselo a un lector de pantalla (criterio 590). No
    // se ve: a la vista lo dicen el arco y la cabecera.
    arcValue = missingLabel
    arcCaption = ['Te faltan']
    line = `Te faltan ${formatDurationMinutes(missingMinutes)} de ${goal.name}.`
    variant = 'missing'
    fitMinutes = fitCandidate
  }

  return {
    goal,
    categoryIds: tally.categoryIds,
    workedMinutes,
    workedLabel,
    targetMinutes,
    targetLabel,
    share: Math.min(1, Math.max(0, workedMinutes / targetMinutes)),
    overMinutes,
    passedAtTime,
    runningTitle: running?.title ?? null,
    runningSince: running ? formatTimeForDisplay(minutesToTime(running.startMinutes)) : null,
    arcValue,
    arcCaption,
    line,
    variant,
    missingMinutes,
    fitMinutes,
    fitLevel: toFitLevel(fitMinutes, { bestPossibleMinutes, targetMinutes }),
  }
}
