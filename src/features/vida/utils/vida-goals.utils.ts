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
} from '@/features/vida/utils/vida-time.utils'

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
  /** Lo grande de dentro del arco: una hora, o los minutos en un día pasado. */
  arcValue: string
  /** El rótulo de encima, en versales: «A ESTE RITMO PARAS». */
  arcCaption: string
  /**
   * La misma frase, entera y en texto de verdad, para el `<p>` de fuera del
   * SVG. **Sin adjetivos, sin exclamaciones y sin reproche**, también pasada la
   * meta (criterio 493).
   */
  line: string
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
    .map((tally) => toArc(tally, { nowMinutes, isPastDay }))

  return {
    arcs,
    noDataMinutes,
    noDataLabel:
      noDataMinutes > 0
        ? `${formatDurationMinutes(noDataMinutes)} sin dato ${isPastDay ? 'ese día' : 'hoy'}.`
        : '',
  }
}

function toArc(tally: GoalTally, day: { nowMinutes: number | null; isPastDay: boolean }): VidaGoalArc {
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

  let arcValue: string
  let arcCaption: string
  let line: string
  if (day.isPastDay || stopAtTime === null) {
    arcValue = passedAtTime !== null ? formatTimeForDisplay(passedAtTime) : workedLabel
    arcCaption = passedAtTime !== null ? `Pasaste las ${targetLabel} a las` : 'Registraste'
    line =
      workedMinutes > 0
        ? `Registraste ${workedSentence} de ${goal.name}.${passedSentence}`
        : `No hay nada registrado de ${goal.name} ese día.`
  } else if (passedAtTime !== null) {
    arcValue = formatTimeForDisplay(passedAtTime)
    arcCaption = `Pasaste las ${targetLabel} a las`
    line = `Llevas ${workedSentence}.${passedSentence}`
  } else if (workedMinutes === 0) {
    // Con cero trabajado la fórmula sigue siendo exacta, solo que en
    // condicional: si arrancas ahora y no paras, esa es la hora (D-C).
    arcValue = formatTimeForDisplay(stopAtTime)
    arcCaption = 'Si arrancas ahora'
    line = `Si arrancas ahora, acabarías a las ${formatTimeForDisplay(stopAtTime)}.`
  } else {
    arcValue = formatTimeForDisplay(stopAtTime)
    arcCaption = 'A este ritmo paras a las'
    line = `Llevas ${workedSentence}. A este ritmo paras a las ${formatTimeForDisplay(stopAtTime)}.`
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
  }
}
