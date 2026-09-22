/**
 * **La semana de lo real y el puente a la plantilla** (FEAT-006, tajada 4).
 *
 * Va en un archivo propio, y no dentro de `vida-review.utils.ts`, por lo que
 * escribió el arquitecto en A1: un archivo que mira **siete días** no comparte
 * ni un tipo con el que mira **uno**, y juntarlos repetiría la historia de las
 * 1.100 líneas de `vida-execution.utils.ts`. Este **importa** al del día y al
 * de la ejecución; ninguno de los dos sabe que este existe.
 *
 * Lo que aquí **no hay**, y es deliberado:
 *
 * - **Ninguna regla nueva de emparejamiento ni de «seguido».** Cada día se
 *   arma con `buildDayAgenda` + `buildDayExecution` —los mismos de Hoy y de la
 *   revisión— y la cifra de la fila es, literalmente,
 *   `collectDayClosing(...).followedCount / .plannedCount`.
 * - **Ninguna barra recalculada.** Los cuatro tramos de cada fila son
 *   `execution.budget.segments`, la misma forma cerrada que pinta `VidaDayBudget`.
 * - **Ni un `new Date()`.** El «hoy» y el «ahora» entran por parámetro, que es
 *   lo que permite probar una regla de 14 días sin API ni reloj.
 */

import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { buildDayAgenda } from '@/features/vida/utils/vida-agenda.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import {
  VIDA_DAY_LABELS,
  getVidaDayOfWeek,
  parseYmdToLocalDate,
} from '@/features/vida/utils/vida-date.utils'
import type { ExecutedSegmentKind } from '@/features/vida/utils/vida-execution.utils'
import {
  buildDayExecution,
  collectDayClosing,
  matchSessionsToBlocks,
  toSessionSpans,
} from '@/features/vida/utils/vida-execution.utils'
import { describeItemDays } from '@/features/vida/utils/vida-template.utils'
import {
  formatDurationFromMinutes,
  formatTimeForDisplay,
  minutesToTime,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

/* ── Las siete filas (criterios 46, 47, 48, 52) ─────────────────────────── */

/** En qué estado se lee una fila. `error` **nunca** se lee como «sin plan». */
export type WeekRowStatus = 'error' | 'pending' | 'future' | 'open' | 'closed'

export type WeekRowSegment = {
  kind: ExecutedSegmentKind
  /** Porcentaje del día entero: los cuatro suman 100 en un día cerrado. */
  percent: number
}

/** El punto de tres estados de la tira (criterio 51, D8). */
export type WeekDot = 'followed' | 'partial' | 'planned' | 'none'

export type WeekRow = {
  date: string
  /** «Lun», «Mié»: la abreviatura del render. */
  weekdayLabel: string
  /** Lo que se lee en voz alta: «lunes». */
  longLabel: string
  dayOfMonth: number
  isToday: boolean
  isSelected: boolean
  status: WeekRowStatus
  /** «6 de 8» · «Hoy · aún abierto» · «Planeado · 3 bloques» · «Sin plan». */
  headline: string
  followedCount: number
  plannedCount: number
  /** La barrita del día: seguido · de más · fuera del plan · sin registrar. */
  segments: WeekRowSegment[]
  registeredMinutes: number
  /** «5h 37», o **«—»** cuando de ese día no hay dato (criterio 47). */
  registeredLabel: string
  plannedMinutes: number
  plannedLabel: string
  /** «5h 37 de 4h 30», ya compuesto. */
  minutesLabel: string
  dot: WeekDot
}

export type WeekDayInput = {
  date: string
  planItems: ActivityDayPlanItem[]
  followUps: ActivityFollowUp[]
  isPending?: boolean
  isError?: boolean
}

export type BuildWeekReviewInput = {
  days: WeekDayInput[]
  dayHours: { startTime: string; endTime: string }
  /** `YYYY-MM-DD` de hoy. */
  today: string
  /** Minutos desde medianoche, o `null` si no importa (no es hoy). */
  nowMinutes: number | null
  /** El día que se está revisando: se marca en la lista. */
  selectedDate?: string
}

/** «Lun», «Mar», «Mié»… La abreviatura sale del nombre, no de una segunda tabla. */
function shortWeekdayLabel(date: string): string {
  const label = VIDA_DAY_LABELS[getVidaDayOfWeek(date)]
  const short = label.slice(0, 3)
  return `${short.charAt(0).toUpperCase()}${short.slice(1)}`
}

/**
 * Un día de la semana, contado (criterio 47).
 *
 * El titular tiene **cuatro formas y ningún porcentaje**: la cifra del día
 * cerrado, «Hoy · aún abierto» mientras no se cierre, el plan de un día que
 * todavía no ha pasado, y «Sin plan». La quinta —**«No pudimos cargarlo»**— no
 * es un estado del día sino de la consulta, y por eso se dice aparte: un día
 * que no se pudo leer **no es un día vacío** (criterio 52).
 */
function buildWeekRow(day: WeekDayInput, input: BuildWeekReviewInput): WeekRow {
  const { dayHours, today, nowMinutes, selectedDate } = input
  const date = day.date
  const isToday = date === today
  const isFuture = date > today
  const base = {
    date,
    weekdayLabel: shortWeekdayLabel(date),
    longLabel: VIDA_DAY_LABELS[getVidaDayOfWeek(date)],
    dayOfMonth: parseYmdToLocalDate(date).getDate(),
    isToday,
    isSelected: date === selectedDate,
  }

  if (day.isError) {
    return {
      ...base,
      status: 'error',
      headline: 'No pudimos cargar este día',
      followedCount: 0,
      plannedCount: 0,
      segments: [],
      registeredMinutes: 0,
      registeredLabel: '—',
      plannedMinutes: 0,
      plannedLabel: '—',
      minutesLabel: '—',
      dot: 'none',
    }
  }

  if (day.isPending) {
    return {
      ...base,
      status: 'pending',
      headline: 'Cargando…',
      followedCount: 0,
      plannedCount: 0,
      segments: [],
      registeredMinutes: 0,
      registeredLabel: '—',
      plannedMinutes: 0,
      plannedLabel: '—',
      minutesLabel: '—',
      dot: 'none',
    }
  }

  const dayNowMinutes = isToday ? nowMinutes : null
  const agenda = buildDayAgenda({
    planItems: day.planItems,
    dayStart: dayHours.startTime,
    dayEnd: dayHours.endTime,
    nowMinutes: dayNowMinutes,
  })
  const execution = buildDayExecution({
    agenda,
    followUps: day.followUps,
    date,
    nowMinutes: dayNowMinutes,
    dayEnd: dayHours.endTime,
    isPastDay: date < today,
  })
  const closing = collectDayClosing({ execution, agenda, couldNotItemIds: new Set<string>() })

  const plannedMinutes = agenda.blocks.reduce((total, block) => total + block.durationMinutes, 0)
  const registeredMinutes = toSessionSpans({
    followUps: day.followUps,
    date,
    nowMinutes: dayNowMinutes,
  }).reduce((total, span) => total + span.durationMinutes, 0)
  const hasPlan = agenda.blocks.length > 0
  const hasSessions = execution.hasExecution

  const status: WeekRowStatus = isFuture ? 'future' : execution.isDayClosed ? 'closed' : 'open'

  // **La barra solo se pinta cuando dice algo.** Con el día cerrado son los
  // cuatro tramos de la forma cerrada; con un día que aún no ha pasado, el
  // plan; con el día de hoy a medias, ninguna — el render tampoco la dibuja,
  // porque una barra a mitad de día se lee como un resultado.
  const dayMinutes = Math.max(1, execution.budget.dayMinutes)
  const segments: WeekRowSegment[] =
    status === 'open'
      ? []
      : execution.budget.segments
            .filter((segment) => segment.kind !== 'free' && segment.trackMinutes > 0)
            .map((segment) => ({
              kind: segment.kind,
              percent: (segment.trackMinutes / dayMinutes) * 100,
            }))

  // **«—», nunca «0»** (criterio 47): de un día sin sesiones no se afirma que
  // se registraron cero minutos, se dice que no hay dato.
  const registeredLabel = hasSessions ? formatDurationFromMinutes(registeredMinutes) : '—'
  const plannedLabel = hasPlan ? formatDurationFromMinutes(plannedMinutes) : '—'

  const headline =
    isFuture && hasPlan
      ? `Planeado · ${agenda.blocks.length} ${agenda.blocks.length === 1 ? 'bloque' : 'bloques'}`
      : isFuture
        ? 'Sin plan'
        : status === 'open' && isToday
          ? 'Hoy · aún abierto'
          : hasPlan
            ? `${closing.followedCount} de ${closing.plannedCount}`
            : 'Sin plan'

  const row: WeekRow = {
    ...base,
    status,
    headline,
    followedCount: closing.followedCount,
    plannedCount: closing.plannedCount,
    segments,
    registeredMinutes,
    registeredLabel,
    plannedMinutes,
    plannedLabel,
    minutesLabel: `${registeredLabel} de ${plannedLabel}`,
    dot: 'none',
  }
  return { ...row, dot: weekDotFor(row) }
}

/**
 * **El punto de tres estados de la tira** (criterio 51, D8): seguido · a
 * medias · solo planeado. El cuarto —`none`— no es un estado del día: es «de
 * este día no se sabe nada», y por eso un día caído o en vuelo cae ahí y no en
 * «solo planeado».
 *
 * Un día **sin plan pero con algo registrado** se lee **a medias**: algo pasó,
 * y decir «solo planeado» de un día sin plan sería falso.
 */
export function weekDotFor(row: WeekRow): WeekDot {
  if (row.status === 'error' || row.status === 'pending') return 'none'
  const hasSessions = row.registeredLabel !== '—'
  if (row.plannedCount > 0 && row.followedCount === row.plannedCount) return 'followed'
  if (row.followedCount > 0) return 'partial'
  if (row.plannedCount === 0 && hasSessions) return 'partial'
  if (row.plannedCount > 0) return 'planned'
  return 'none'
}

/** Las siete filas de la semana, en orden de lunes a domingo. */
export function buildWeekReview(input: BuildWeekReviewInput): WeekRow[] {
  return input.days.map((day) => buildWeekRow(day, input))
}

/* ── La frase de la semana (criterio 50) ────────────────────────────────── */

/** Cuánto tiene que despegar un día del segundo para poder nombrarlo. */
const STANDOUT_MARGIN = 0.15
/** Y por debajo de esto no destaca nada, aunque sea el mejor de la semana. */
const STANDOUT_FLOOR = 0.6

/**
 * **La frase de la semana**, compuesta con reglas y con la misma regla de no
 * reproche que la del día: abre por lo que **sí** salió y no contiene ni una
 * palabra de culpa.
 *
 * Nombra el día más parecido al plan **solo si uno destaca**: tiene que llevar
 * al menos el 60 % de sus bloques seguidos y sacarle 15 puntos al segundo. Con
 * la semana pareja —o con un solo día contado— **no se afirma ninguno**, que es
 * lo que pide el criterio 50.
 *
 * Los días **caídos o en vuelo no entran en la cuenta**: sumar un día que no se
 * pudo leer como si tuviera cero bloques seguidos sería afirmar lo que no se
 * sabe (criterio 52).
 */
export function buildWeekLine(rows: WeekRow[]): string[] {
  const counted = rows.filter((row) => row.status === 'closed' && row.plannedCount > 0)
  if (counted.length === 0) return []

  const followed = counted.reduce((total, row) => total + row.followedCount, 0)
  const planned = counted.reduce((total, row) => total + row.plannedCount, 0)
  const sentences: string[] = [
    `Seguiste ${followed} de ${planned} ${planned === 1 ? 'bloque' : 'bloques'} esta semana.`,
  ]

  const ranked = [...counted]
    .map((row) => ({ row, ratio: row.followedCount / row.plannedCount }))
    .sort((a, b) => b.ratio - a.ratio)
  const best = ranked[0]
  const second = ranked[1]
  if (best && best.ratio >= STANDOUT_FLOOR && (!second || best.ratio - second.ratio >= STANDOUT_MARGIN)) {
    const label = best.row.longLabel
    sentences.push(
      `${label.charAt(0).toUpperCase()}${label.slice(1)} fue el día más parecido a tu plan.`,
    )
  }
  return sentences
}

/* ── El puente a la plantilla (criterios 54–59, A6) ─────────────────────── */

/** Cuántos días de los 14 tiene que haber estado en el plan para mirarlo. */
export const BRIDGE_MIN_PLANNED_DAYS = 4
/** Y en cuántos de esos no se siguió para que haya algo que preguntar. */
export const BRIDGE_MIN_MISSED_DAYS = 3
/** La hora que se propone se redondea a cuartos: nadie planea a las 20:37. */
const BRIDGE_TIME_STEP_MINUTES = 15

export type TemplateBridge = {
  /** El `VidaItem` que se movería: **el de la plantilla**, nunca un bloque. */
  itemId: string
  activityId: string
  title: string
  /** El icono de su categoría, con el mismo respaldo que las filas del día. */
  icon: string
  color: string | null
  /** La hora que tiene hoy en la plantilla, «21:30». */
  currentTime: string
  /** La que se propone, derivada de lo real, «20:30» (criterio 56). */
  proposedTime: string
  currentTimeLabel: string
  proposedTimeLabel: string
  /** «3 de las últimas 4 noches no llegó a esa hora» (criterio 54). */
  basis: string
  /** «L M X J V», de FEAT-005. */
  daysLabel: string
  /** «Está los lunes a viernes: se mueve en todos» (criterio 57). */
  consequence: string
  plannedDays: number
  missedDays: number
}

export type BridgeDayInput = {
  date: string
  planItems: ActivityDayPlanItem[]
  followUps: ActivityFollowUp[]
}

export type BuildTemplateBridgeInput = {
  /** La plantilla entera. Sin ítems **no hay puente** (criterio 59). */
  items: VidaItem[]
  /** Los últimos días, cada uno con su plan y sus sesiones. */
  days: BridgeDayInput[]
  dayHours: { startTime: string; endTime: string }
}

/** «mañanas» · «tardes» · «noches», por la hora que tiene puesta el ítem. */
function partOfDayLabel(startTime: string): string {
  const minutes = parseTimeToMinutes(startTime)
  if (minutes < 12 * 60) return 'mañanas'
  if (minutes < 20 * 60) return 'tardes'
  return 'noches'
}

/** La mediana de una lista de minutos, redondeada a cuartos de hora. */
function medianStartMinutes(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 1
      ? sorted[middle]!
      : Math.round((sorted[middle - 1]! + sorted[middle]!) / 2)
  return Math.round(median / BRIDGE_TIME_STEP_MINUTES) * BRIDGE_TIME_STEP_MINUTES
}

type BridgeCandidate = {
  item: VidaItem
  plannedDays: number
  missedDays: number
  plannedMinutes: number
  starts: number[]
}

/**
 * **El puente: como mucho un aviso** (criterios 54–59).
 *
 * La regla es **la mínima y es la única** (criterio 55): un ítem de la
 * plantilla **con hora** que estuvo en el plan al menos
 * `BRIDGE_MIN_PLANNED_DAYS` de los días mirados y **no se siguió** en al menos
 * `BRIDGE_MIN_MISSED_DAYS` de ellos. Ningún otro patrón entra: las tendencias,
 * la adherencia y los patrones por día de la semana son F6.
 *
 * **«No se siguió» es el emparejamiento de siempre**: `matchSessionsToBlocks`,
 * el mismo de Hoy y el mismo de la cifra grande. Aquí no hay un segundo umbral
 * ni una segunda definición.
 *
 * **La hora propuesta sale de lo real** (D6, criterio 56): la mediana de las
 * horas de inicio de las sesiones **de esa actividad** en esos días, redondeada
 * a 15 min. **Sin sesiones de las que derivarla, no hay aviso** — y si la
 * mediana cae en la hora que ya tiene, tampoco: preguntar «¿lo movemos a las
 * 21:30?» por algo que ya está a las 21:30 no es una pregunta.
 *
 * Desempate: **más veces sin seguir**, luego **más minutos planeados**, luego
 * el id, para que dos ejecuciones sobre los mismos datos den el mismo aviso.
 */
export function buildTemplateBridge(input: BuildTemplateBridgeInput): TemplateBridge | null {
  const { items, days, dayHours } = input
  const candidates = new Map<string, BridgeCandidate>()
  const itemsWithTime = items.filter((item) => item.isActive && Boolean(item.startTime))
  if (itemsWithTime.length === 0 || days.length === 0) return null

  for (const day of days) {
    const agenda = buildDayAgenda({
      planItems: day.planItems,
      dayStart: dayHours.startTime,
      dayEnd: dayHours.endTime,
      nowMinutes: null,
    })
    const spans = toSessionSpans({ followUps: day.followUps, date: day.date, nowMinutes: null })
    const { byBlockId } = matchSessionsToBlocks({ blocks: agenda.blocks, spans })

    for (const item of itemsWithTime) {
      const blocks = agenda.blocks.filter((block) => block.item.activityId === item.activityId)
      if (blocks.length === 0) continue
      const candidate = candidates.get(item.id) ?? {
        item,
        plannedDays: 0,
        missedDays: 0,
        plannedMinutes: 0,
        starts: [],
      }
      candidate.plannedDays += 1
      candidate.plannedMinutes += blocks.reduce((total, block) => total + block.durationMinutes, 0)
      const followed = blocks.some((block) => Boolean(byBlockId[block.id]))
      if (!followed) candidate.missedDays += 1
      // La hora de la que se deriva la propuesta sale de **las sesiones de esa
      // actividad en esos días**, las haya emparejado el plan o no: si el
      // usuario lee todas las noches a las 20:30 sin que cuente como seguido,
      // eso es exactamente el dato que la plantilla no tiene.
      for (const span of spans) {
        if (span.session.activityId === item.activityId) candidate.starts.push(span.startMinutes)
      }
      candidates.set(item.id, candidate)
    }
  }

  const eligible = [...candidates.values()].filter(
    (candidate) =>
      candidate.plannedDays >= BRIDGE_MIN_PLANNED_DAYS &&
      candidate.missedDays >= BRIDGE_MIN_MISSED_DAYS,
  )
  if (eligible.length === 0) return null

  eligible.sort(
    (a, b) =>
      b.missedDays - a.missedDays ||
      b.plannedMinutes - a.plannedMinutes ||
      a.item.id.localeCompare(b.item.id),
  )

  for (const candidate of eligible) {
    const currentTime = candidate.item.startTime!
    const median = medianStartMinutes(candidate.starts)
    // **Sin base, no se inventa una hora** (criterio 56): ni «media hora
    // antes», ni la del plan. Si de ese ítem no hay ni una sesión, no hay
    // aviso, y se mira el siguiente candidato.
    if (median === null) continue
    const proposedTime = minutesToTime(median)
    if (proposedTime === currentTime) continue

    const daysLabel = describeItemDays(candidate.item)
    const dayCount = candidate.item.days.length
    return {
      itemId: candidate.item.id,
      activityId: candidate.item.activityId,
      title: candidate.item.activity?.title ?? 'Esta actividad',
      icon: candidate.item.activity?.category?.icon ?? UNCATEGORIZED_GROUP_ICON,
      color: candidate.item.activity?.category?.color ?? null,
      currentTime,
      proposedTime,
      currentTimeLabel: formatTimeForDisplay(currentTime),
      proposedTimeLabel: formatTimeForDisplay(proposedTime),
      basis: `${candidate.missedDays} de las últimas ${candidate.plannedDays} ${partOfDayLabel(currentTime)} no llegó a esa hora`,
      daysLabel,
      consequence:
        dayCount === 1
          ? `En tu plantilla está un día (${daysLabel}): se mueve ahí.`
          : `En tu plantilla está ${dayCount} días (${daysLabel}): se mueve en todos.`,
      plannedDays: candidate.plannedDays,
      missedDays: candidate.missedDays,
    }
  }

  return null
}

/** Lo que la fila de un día le presta a la tira: el punto, por fecha (D8). */
export function weekDotsByDate(rows: WeekRow[]): Record<string, WeekDot> {
  const dots: Record<string, WeekDot> = {}
  for (const row of rows) dots[row.date] = row.dot
  return dots
}
