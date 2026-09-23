/**
 * **Los arcos de las metas de Hoy** (FEAT-016, tajada 2).
 *
 * La versión **viva** de lo que `buildCategoryBreakdown`
 * (`vida-review.utils.ts:904-1039`) hace con un día ya cerrado: allí es la foto
 * de Revisión, aquí es el día en marcha —con la sesión abierta contada hasta el
 * minuto actual— y una hora a la que parar.
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
import type { VidaGoal } from '@/features/vida/types/vida-goal.types'
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
  /** «15:25». `null` sin reloj (día pasado) — entonces no hay proyección. */
  stopAtTime: string | null
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
   * SVG. **Sin adjetivos, sin exclamaciones y sin reproche**, también pasada la
   * meta (criterio 493).
   */
  line: string
  /**
   * **Qué se está diciendo dentro del arco**, y de paso quién enseña `line`.
   *
   * `'missing'` es lo que falta (criterio 559) y **el único estado en que la
   * frase de la hora se ve de verdad** debajo del arco (criterio 560): ahí
   * dentro ya no hay ninguna hora, así que la de parada tiene que aparecer en
   * algún sitio. En `'passed'` (la hora a la que se cruzó la meta, criterio
   * 562) y `'logged'` (lo registrado en un día que ya terminó, criterio 563) el
   * arco **no cambia nada** respecto a FEAT-016 y la frase se queda donde
   * estaba, en el `<p>` de solo lectores de pantalla.
   *
   * Se lee **una sola vez** en los tres casos: el SVG es decorativo
   * (`aria-hidden`) y `line` vive en un único `<p>` al que solo le cambia la
   * clase (criterio 564, el hallazgo de la doble lectura de FEAT-016 tajada 3).
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
   * **El semáforo** (criterios 566–569): `'ok'` verde, `'tight'` naranja,
   * `'over'` rojo. `null` = **sin ningún color** (criterios 571 y 573).
   *
   * Mide si lo que falta **cabe antes de que se acabe el día**, no el
   * porcentaje de la meta. La diferencia no es un detalle: por porcentaje, un
   * lunes a las 9:15 con 15 minutos hechos estaría en rojo, y el arco estaría
   * regañando por ir al ritmo de cualquier lunes en un módulo escrito entero
   * para no juzgar. Por margen, ese mismo lunes es verde (criterio 570).
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
  }
}

/**
 * **El semáforo, a partir del margen** (criterios 567, 568 y 569).
 *
 * Verde si sobra más de una hora, naranja si cabe justo —el cero entra en el
 * naranja: cabe, aunque sin un minuto de sobra—, rojo si el margen es
 * negativo. `null` entra y sale igual: fuera de la ventana no hay color
 * (criterios 571 y 573).
 */
function toFitLevel(fitMinutes: number | null): VidaGoalArc['fitLevel'] {
  if (fitMinutes === null) return null
  if (fitMinutes > GOAL_FIT_OK_MARGIN_MINUTES) return 'ok'
  if (fitMinutes >= 0) return 'tight'
  return 'over'
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
  // Sin reloj no hay proyección: un día que ya terminó no tiene un «ahora»
  // desde el que proyectar (D-B).
  const canProject = day.nowMinutes !== null && !day.isPastDay
  const stopAtTime = canProject
    ? minutesToTime(day.nowMinutes! + Math.max(0, targetMinutes - workedMinutes))
    : null

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
  const fitCandidate =
    canProject && day.dayEnd !== null
      ? parseTimeToMinutes(day.dayEnd) - day.nowMinutes! - missingMinutes
      : null

  let arcValue: string
  let arcCaption: string[]
  let line: string
  let variant: VidaGoalArc['variant']
  // `null` mientras no se demuestre lo contrario: el color es la excepción —el
  // tramo anterior a cruzar la meta, hoy—, no lo que trae el arco por defecto.
  let fitMinutes: number | null = null
  if (day.isPastDay || stopAtTime === null) {
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
  } else if (workedMinutes === 0) {
    // Con cero trabajado lo que falta es la jornada entera (criterio 561). La
    // fórmula de la hora sigue siendo exacta, solo que en condicional (D-C), y
    // por eso `line` no cambia: si arrancas ahora y no paras, esa es la hora.
    arcValue = missingLabel
    arcCaption = ['Te faltan']
    line = `Si arrancas ahora, acabarías a las ${formatTimeForDisplay(stopAtTime)}.`
    variant = 'missing'
    fitMinutes = fitCandidate
  } else {
    // **Dentro del arco va lo que falta, no la hora** (criterio 559). El arco
    // mide horas trabajadas de una jornada: meter dentro una hora del reloj
    // eran dos cosas distintas en el mismo sitio, y el usuario tuvo que
    // preguntar cuál era. La hora no se pierde —sigue en `line`, que a partir
    // de aquí se ve de verdad (criterio 560)—, deja de ser lo primero que ves.
    arcValue = missingLabel
    arcCaption = ['Te faltan']
    line = `Llevas ${workedSentence}. A este ritmo paras a las ${formatTimeForDisplay(stopAtTime)}.`
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
    stopAtTime,
    passedAtTime,
    runningTitle: running?.title ?? null,
    runningSince: running ? formatTimeForDisplay(minutesToTime(running.startMinutes)) : null,
    arcValue,
    arcCaption,
    line,
    variant,
    missingMinutes,
    fitMinutes,
    fitLevel: toFitLevel(fitMinutes),
  }
}
