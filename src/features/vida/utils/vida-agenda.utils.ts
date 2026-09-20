/**
 * La geometría del día: bloques, huecos, presupuesto y la línea de guía.
 *
 * Todo lo de aquí es **puro**: entran números y cadenas `HH:mm`, salen números
 * y cadenas. Ni React, ni `new Date()` escondido (el «ahora» se inyecta como
 * minutos desde medianoche), ni una llamada al API. Es lo que permite cerrar
 * los criterios 13, 14, 15, 17, 18 y 19 con tests sin pintar nada.
 *
 * Se reescribe —no se copia— `getFreeSlotsBetweenFollowUps` de
 * `git show 79bece0:src/features/activities/utils/activity-time.utils.ts:339`:
 * aquélla solo daba huecos *entre* registros (`if (length < 2) return []`) y
 * aquí hacen falta también el de antes del primer bloque y el de después del
 * último, y los bordes son el horario de los ajustes, no `00:00`–`24:00`
 * (criterio 17). Se conserva la idea del cursor y del `id` derivado de las horas.
 *
 * Lo que **no** vuelve de aquel archivo: alturas en píxeles proporcionales a
 * minutos (sería una cuadrícula de horas, descartada por la decisión 5 del plan
 * de Vida) y `wasteMinutes` / `wastePercentage` de `activity-day-metrics.utils`
 * («desperdicio», prohibido por el criterio 56). En F2 la leyenda tiene dos
 * tramos: **planeado** y **libre**.
 */

import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import {
  MIN_GAP_MINUTES,
  formatDurationFromMinutes,
  formatTimeForDisplay,
  minutesToTime,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

/** Cuántas fichas de plantilla se ven en un hueco antes de resumir (criterio 18). */
export const MAX_GAP_SUGGESTIONS = 3

export type AgendaBlock = {
  kind: 'block'
  id: string
  item: ActivityDayPlanItem
  startMinutes: number
  endMinutes: number
  /** `endTime` − `startTime`: lo que se lee en la tarjeta (criterio 16). */
  durationMinutes: number
  /**
   * Lo que este bloque aporta **a la barra**: su duración menos lo que ya
   * cubría un bloque anterior. Con el plan normal es igual a `durationMinutes`;
   * con dos bloques pisados —que el API acepta aunque la web no los cree (D4)—
   * es lo que evita que los anchos sumen más del 100 % (criterio 13).
   */
  trackMinutes: number
}

export type AgendaGap = {
  kind: 'gap'
  id: string
  startMinutes: number
  endMinutes: number
  durationMinutes: number
  /** En un hueco es siempre igual a `durationMinutes`: los huecos no se pisan. */
  trackMinutes: number
  /**
   * Más corto que `MIN_GAP_MINUTES`. **No desaparece**: se pinta como una línea
   * fina con sus minutos, porque si no la leyenda (criterio 14) dejaría de
   * cuadrar con lo que se ve. Lo que no hace es ofrecer fichas.
   */
  isSliver: boolean
  /**
   * El tramo ya pasó (termina antes de «ahora» o justo en él). Sigue contando
   * para la leyenda —es tiempo del día— pero **no ofrece fichas**: colocar algo
   * en un rato que ya pasó no tiene sentido.
   */
  isPast: boolean
  /** El bloque que lo cierra; `null` cuando lo cierra el fin del día. */
  nextBlockTitle: string | null
}

/**
 * «Ahora», como una entrada más de la lista.
 *
 * Es una marca sin duración: no cuenta para la leyenda ni ocupa ancho en la
 * barra. Existe para que el criterio 20 tenga **un ancla real** en el sitio del
 * reloj, en vez de depender de que quede algo por empezar.
 */
export type AgendaNowMark = {
  kind: 'now'
  id: 'now'
  startMinutes: number
  endMinutes: number
  durationMinutes: 0
  trackMinutes: 0
}

export type AgendaEntry = AgendaBlock | AgendaGap | AgendaNowMark

export type DayAgenda = {
  /** Bloques, huecos y la marca de «ahora», intercalados en orden de reloj. */
  entries: AgendaEntry[]
  blocks: AgendaBlock[]
  gaps: AgendaGap[]
  /** `true` si la marca de «ahora» está en `entries`. */
  hasNowMark: boolean
  /** Los bordes de la barra, en minutos desde medianoche. */
  windowStart: number
  windowEnd: number
}

export type BuildDayAgendaInput = {
  planItems: ActivityDayPlanItem[]
  /** `HH:mm` del inicio del día (ajustes o respaldo). */
  dayStart: string
  /** `HH:mm` del fin del día. */
  dayEnd: string
  /**
   * Minutos desde medianoche, o `null` si el día mostrado no es hoy. Cuando cae
   * **dentro del horario del día**, la agenda parte el hueco que lo contiene y
   * mete la marca de «ahora» en medio.
   */
  nowMinutes?: number | null
}

/**
 * El día repartido: los bloques ordenados por hora, lo libre entre ellos y,
 * cuando el día es hoy, la marca de «ahora» dentro del tramo que la contiene.
 *
 * La ventana de la barra **se estira** si algún bloque cae fuera del horario de
 * los ajustes (alguien planeó a las 5:30 con el día empezando a las 6:30): un
 * bloque que no se pinta es un bloque perdido, y además la leyenda dejaría de
 * sumar. En el caso normal la ventana es exactamente el horario de los ajustes,
 * que es lo que pide el criterio 13.
 *
 * **La marca de «ahora» existe siempre que `dayStart ≤ ahora ≤ dayEnd`** — no
 * solo cuando queda algo por empezar. Fuera de esa franja no hay marca: antes de
 * que el día empiece y después de que se cierre no hay nada que anclar, y el
 * criterio 20 habla de «la hora actual **dentro** del día». Era el defecto por
 * el que el revisor devolvió esta tajada: a las 20:00 de un día con el último
 * bloque a las 14:00, y en el día sin plan entero, no se pintaba ninguna.
 *
 * Dónde cae exactamente:
 *
 * - **Dentro de un hueco:** el hueco se parte en dos —lo que ya pasó y lo que
 *   queda— con la marca en medio. La suma no cambia (criterio 14) y de paso la
 *   mitad de después es la que ofrece fichas, así que un hueco empezado deja de
 *   ofrecer más de lo que le queda.
 * - **Dentro de un bloque:** la marca va **justo debajo** del bloque, como en el
 *   render. Un bloque no se parte: enseñar medio bloque sería contar lo que está
 *   pasando, y eso es F3.
 *
 * D4 dice que no hay solapes, pero el API no los valida: si llegan dos bloques
 * pisados, el cursor no retrocede (no aparece un hueco negativo) y el segundo
 * aporta a la barra solo lo que no pisaba el primero.
 */
export function buildDayAgenda({
  planItems,
  dayStart,
  dayEnd,
  nowMinutes = null,
}: BuildDayAgendaInput): DayAgenda {
  const sorted = planItems
    .map((item) => {
      const startMinutes = parseTimeToMinutes(item.startTime)
      const endMinutes = parseTimeToMinutes(item.endTime)
      return { item, startMinutes, endMinutes }
    })
    .sort((a, b) => a.startMinutes - b.startMinutes || a.item.orderIndex - b.item.orderIndex)

  const dayStartMinutes = parseTimeToMinutes(dayStart)
  const dayEndMinutes = parseTimeToMinutes(dayEnd)
  const windowStart = sorted.reduce((min, block) => Math.min(min, block.startMinutes), dayStartMinutes)
  const windowEnd = sorted.reduce((max, block) => Math.max(max, block.endMinutes), dayEndMinutes)

  const plain: (AgendaBlock | AgendaGap)[] = []
  let cursor = windowStart

  function pushGap(from: number, to: number, nextBlockTitle: string | null) {
    if (to <= from) return
    plain.push(makeGap(from, to, nextBlockTitle, nowMinutes))
  }

  for (const { item, startMinutes, endMinutes } of sorted) {
    pushGap(cursor, startMinutes, item.activity?.title ?? null)
    plain.push({
      kind: 'block',
      id: item.id,
      item,
      startMinutes,
      endMinutes,
      durationMinutes: Math.max(0, endMinutes - startMinutes),
      trackMinutes: Math.max(0, endMinutes - Math.max(startMinutes, cursor)),
    })
    cursor = Math.max(cursor, endMinutes)
  }
  pushGap(cursor, windowEnd, null)

  const insideDay =
    nowMinutes !== null && nowMinutes >= dayStartMinutes && nowMinutes <= dayEndMinutes
  const entries: AgendaEntry[] = insideDay ? withNowMark(plain, nowMinutes!) : plain

  return {
    entries,
    blocks: entries.filter((entry): entry is AgendaBlock => entry.kind === 'block'),
    gaps: entries.filter((entry): entry is AgendaGap => entry.kind === 'gap'),
    hasNowMark: insideDay,
    windowStart,
    windowEnd,
  }
}

function makeGap(
  from: number,
  to: number,
  nextBlockTitle: string | null,
  nowMinutes: number | null,
): AgendaGap {
  return {
    kind: 'gap',
    id: `gap-${minutesToTime(from)}-${minutesToTime(to)}`,
    startMinutes: from,
    endMinutes: to,
    durationMinutes: to - from,
    trackMinutes: to - from,
    isSliver: to - from < MIN_GAP_MINUTES,
    isPast: nowMinutes !== null && to <= nowMinutes,
    nextBlockTitle,
  }
}

function nowMark(nowMinutes: number): AgendaNowMark {
  return {
    kind: 'now',
    id: 'now',
    startMinutes: nowMinutes,
    endMinutes: nowMinutes,
    durationMinutes: 0,
    trackMinutes: 0,
  }
}

/** Mete la marca en el sitio del reloj, partiendo el hueco que la contenga. */
function withNowMark(plain: (AgendaBlock | AgendaGap)[], nowMinutes: number): AgendaEntry[] {
  const result: AgendaEntry[] = []
  let placed = false

  for (const entry of plain) {
    if (!placed && nowMinutes <= entry.startMinutes) {
      result.push(nowMark(nowMinutes))
      placed = true
    }
    if (
      !placed &&
      entry.kind === 'gap' &&
      nowMinutes > entry.startMinutes &&
      nowMinutes < entry.endMinutes
    ) {
      result.push(
        makeGap(entry.startMinutes, nowMinutes, entry.nextBlockTitle, nowMinutes),
        nowMark(nowMinutes),
        makeGap(nowMinutes, entry.endMinutes, entry.nextBlockTitle, nowMinutes),
      )
      placed = true
      continue
    }
    result.push(entry)
    // Dentro de un bloque: la marca va justo debajo, sin partirlo.
    if (!placed && nowMinutes <= entry.endMinutes) {
      result.push(nowMark(nowMinutes))
      placed = true
    }
  }

  // Después de todo lo que hay (el día acaba en un bloque que ya terminó).
  if (!placed) result.push(nowMark(nowMinutes))
  return result
}

export type DayBudget = {
  /** Lo que mide el día entero, en minutos. Es el 100% de la barra. */
  dayMinutes: number
  plannedMinutes: number
  freeMinutes: number
  plannedPercent: number
  freePercent: number
  /** Dónde cae «ahora» en la barra, 0–100. `null` si no es hoy o cae fuera. */
  nowPercent: number | null
  /** De ahora al fin del día. `null` cuando no es hoy; 0 cuando ya terminó. */
  remainingMinutes: number | null
}

export type GetDayBudgetInput = {
  agenda: DayAgenda
  /** `HH:mm` del fin del día: es hasta donde cuenta «te quedan» (criterio 12). */
  dayEnd: string
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes: number | null
}

/**
 * Los números del presupuesto. `plannedMinutes` y `freeMinutes` salen de la
 * **misma** lista que pinta la agenda —no de una cuenta paralela—, que es lo que
 * garantiza el criterio 14: la leyenda no puede contradecir lo que se ve.
 *
 * `remainingMinutes` es `0` cuando el día ya se cerró; quien lo pinte no debe
 * escribir «te quedan 0m» (hallazgo 5 del revisor), sino el resumen del día.
 */
export function getDayBudget({ agenda, dayEnd, nowMinutes }: GetDayBudgetInput): DayBudget {
  const dayMinutes = Math.max(0, agenda.windowEnd - agenda.windowStart)
  // `trackMinutes` y no `durationMinutes`: con dos bloques pisados —que el API
  // acepta aunque la web no los cree (D4)— sumar las duraciones contaba el
  // solape dos veces y la barra rebasaba el 100 %. Es el hallazgo 2 del
  // revisor, medido por él en 106,06 %.
  const plannedMinutes = agenda.blocks.reduce((total, block) => total + block.trackMinutes, 0)
  const freeMinutes = agenda.gaps.reduce((total, gap) => total + gap.trackMinutes, 0)
  const toPercent = (minutes: number) => (dayMinutes === 0 ? 0 : (minutes / dayMinutes) * 100)

  const insideWindow =
    nowMinutes !== null && nowMinutes >= agenda.windowStart && nowMinutes <= agenda.windowEnd

  return {
    dayMinutes,
    plannedMinutes,
    freeMinutes,
    plannedPercent: toPercent(plannedMinutes),
    freePercent: toPercent(freeMinutes),
    nowPercent: insideWindow ? toPercent(nowMinutes! - agenda.windowStart) : null,
    remainingMinutes:
      nowMinutes === null ? null : Math.max(0, parseTimeToMinutes(dayEnd) - nowMinutes),
  }
}

/** «10:30 – 13:00»: las horas de un hueco, como las escribe el render. */
export function formatGapRange(gap: AgendaGap): string {
  return `${formatTimeForDisplay(minutesToTime(gap.startMinutes))} – ${formatTimeForDisplay(minutesToTime(gap.endMinutes))}`
}

/**
 * El hueco más grande que todavía se puede usar. Con «ahora» dado, el que ya
 * empezó cuenta solo por lo que le queda: decir «tienes libre de 8:00 a 10:00»
 * a las 9:30 sería mentira.
 */
export function findLargestGap(gaps: AgendaGap[], nowMinutes: number | null): AgendaGap | null {
  let best: AgendaGap | null = null
  for (const gap of gaps) {
    if (nowMinutes !== null && gap.endMinutes <= nowMinutes) continue
    const startMinutes = nowMinutes === null ? gap.startMinutes : Math.max(gap.startMinutes, nowMinutes)
    const durationMinutes = gap.endMinutes - startMinutes
    if (durationMinutes < MIN_GAP_MINUTES) continue
    const clipped: AgendaGap =
      startMinutes === gap.startMinutes
        ? gap
        : { ...gap, startMinutes, durationMinutes, isSliver: durationMinutes < MIN_GAP_MINUTES }
    if (!best || clipped.durationMinutes > best.durationMinutes) best = clipped
  }
  return best
}

export type GuidanceInput = {
  agenda: DayAgenda
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes: number | null
  dayStart: string
  dayEnd: string
}

/**
 * La línea de guía (criterio 15): se **compone con reglas** y nombra números
 * reales. Nunca reprocha nada —ni «desperdiciaste», ni «vacío» como reproche—:
 * un tramo sin nada es **libre** (criterio 56).
 *
 * Cuatro formas distintas, como pide el criterio: día sin plan, día ya
 * terminado, día lleno y el caso normal.
 */
export function buildGuidanceLine({ agenda, nowMinutes, dayStart, dayEnd }: GuidanceInput): string {
  const dayEndMinutes = parseTimeToMinutes(dayEnd)
  const dayLabel = `${formatTimeForDisplay(dayStart)} a ${formatTimeForDisplay(dayEnd)}`

  if (nowMinutes !== null && nowMinutes >= dayEndMinutes) {
    return `Tu día se cerró a las ${formatTimeForDisplay(dayEnd)}. Mañana vuelve a empezar de ${dayLabel}.`
  }

  if (agenda.blocks.length === 0) {
    const free = formatDurationFromMinutes(
      nowMinutes === null ? agenda.windowEnd - agenda.windowStart : dayEndMinutes - nowMinutes,
    )
    return nowMinutes === null
      ? `Este día está entero por delante: ${free} libres de ${dayLabel}.`
      : `Todavía no hay plan para hoy: ${free} libres por delante, hasta las ${formatTimeForDisplay(dayEnd)}.`
  }

  const remainingBlocks =
    nowMinutes === null
      ? agenda.blocks
      : agenda.blocks.filter((block) => block.endMinutes > nowMinutes)
  // `trackMinutes`, como la leyenda: con dos bloques pisados, sumar duraciones
  // haría que la guía dijera «4h» donde la leyenda dice «planeado 3h».
  const remainingMinutes = remainingBlocks.reduce((total, block) => total + block.trackMinutes, 0)
  const blocksLabel = `${remainingBlocks.length} ${remainingBlocks.length === 1 ? 'bloque' : 'bloques'} · ${formatDurationFromMinutes(remainingMinutes)}`
  const head =
    nowMinutes === null
      ? `Tienes puestos ${blocksLabel}.`
      : remainingBlocks.length === 0
        ? 'Del plan ya no te queda nada por delante.'
        : `Del plan te quedan ${blocksLabel}.`

  const largest = findLargestGap(agenda.gaps, nowMinutes)
  if (!largest) {
    // Sin hueco **por delante** no es lo mismo que sin hueco **en todo el día**:
    // a las 22:59 de un día con la tarde libre, decir «el día está completo»
    // sería falso. Se distinguen las dos frases.
    const hadAnyGap = findLargestGap(agenda.gaps, null) !== null
    return hadAnyGap
      ? `${head} Ya no queda hueco por delante: el día se cierra a las ${formatTimeForDisplay(dayEnd)}.`
      : `${head} No queda ningún hueco suelto: el día está completo.`
  }

  return `${head} Tu hueco más grande va de ${formatGapRange(largest)} · ${formatDurationFromMinutes(largest.durationMinutes)}.`
}

export type GapSuggestion = {
  suggestion: VidaSuggestion
  /** La duración **de su ítem de plantilla** (D1). `null` si el ítem no la tiene. */
  durationMinutes: number | null
}

export type GapSuggestions = {
  visible: GapSuggestion[]
  /** Las que caben y no se pintan por el tope de tres. */
  hiddenCount: number
  /** Cuántas cosas trae la plantilla ese día, en total, estén o no en el plan. */
  templateCount: number
}

export type SuggestionsForGapInput = {
  suggestions: VidaSuggestion[]
  gap: AgendaGap
  planItems: ActivityDayPlanItem[]
  limit?: number
}

/** Cabe si tiene duración y no se pasa del hueco. */
export function fitsInGap(gap: AgendaGap, minutes: number | null): boolean {
  if (minutes === null || minutes <= 0) return false
  return minutes <= gap.durationMinutes
}

/**
 * El **primer hueco del día donde cabe** algo de esa duración (criterio 48).
 *
 * Se saltan los tramos que ya pasaron —colocar algo en un rato que ya pasó no
 * tiene sentido— y los `sliver`, que no llegan al mínimo. El hueco que contiene
 * al reloj ya viene partido por `buildDayAgenda`, así que la mitad que queda
 * empieza **en ahora**: un hueco empezado ofrece desde ahora, igual que en la
 * tajada 3.
 *
 * Devuelve `null` cuando no cabe en ninguno; quien llama apaga el botón y dice
 * por qué, en vez de ofrecer algo que no se puede hacer.
 */
export function findFirstFittingGap(gaps: AgendaGap[], minutes: number | null): AgendaGap | null {
  return (
    gaps.find((gap) => !gap.isPast && !gap.isSliver && fitsInGap(gap, minutes)) ?? null
  )
}

/**
 * Lo que la plantilla puede ofrecer en un hueco (criterios 18 y 19).
 *
 * **La exclusión se calcula contra el plan del día, nunca contra `takenToday`.**
 * `takenToday` es el «ya lo tomé hoy» de F1, sale de otra tabla y en un día
 * futuro es siempre `false`: no dice si la actividad está en el plan.
 * Confundirlos es el error caro de esta feature, y está anotado en la sección 2.
 *
 * Las que **no tienen duración** no se filtran por tamaño ni se les inventa una:
 * van al final y quien las pinte dice «sin duración».
 */
export function suggestionsForGap({
  suggestions,
  gap,
  planItems,
  limit = MAX_GAP_SUGGESTIONS,
}: SuggestionsForGapInput): GapSuggestions {
  // Un tramo que ya pasó no ofrece nada. Con la marca de «ahora» partiendo el
  // hueco, el que queda por delante ya tiene el tamaño correcto: es lo que
  // cierra el hallazgo 3 del revisor —un hueco empezado ofrecía por su tamaño
  // entero— y lo que evita, en la tajada 3, colocar un bloque en el pasado.
  if (gap.isPast) {
    return {
      visible: [],
      hiddenCount: 0,
      templateCount: suggestions.filter((suggestion) => suggestion.item.isActive !== false).length,
    }
  }

  const plannedActivityIds = new Set(planItems.map((item) => item.activityId))
  const candidates = suggestions
    .filter((suggestion) => suggestion.item.isActive !== false)
    .filter((suggestion) => !plannedActivityIds.has(suggestion.item.activityId))

  const startsInsideGap = (suggestion: VidaSuggestion) => {
    const startTime = suggestion.item.startTime
    if (!startTime) return false
    const minutes = parseTimeToMinutes(startTime)
    return minutes >= gap.startMinutes && minutes < gap.endMinutes
  }

  const withDuration = candidates
    .filter((suggestion) => fitsInGap(gap, suggestion.item.durationMinutes))
    .sort((a, b) => {
      // Lo que la plantilla pone justo a esta hora, primero: es lo que el
      // usuario ya había decidido para este rato.
      const inside = Number(startsInsideGap(b)) - Number(startsInsideGap(a))
      if (inside !== 0) return inside
      return a.item.orderIndex - b.item.orderIndex
    })
    .map((suggestion) => ({ suggestion, durationMinutes: suggestion.item.durationMinutes }))

  const withoutDuration = candidates
    .filter((suggestion) => suggestion.item.durationMinutes === null)
    .sort((a, b) => a.item.orderIndex - b.item.orderIndex)
    .map((suggestion) => ({ suggestion, durationMinutes: null }))

  const ordered = [...withDuration, ...withoutDuration]

  return {
    visible: ordered.slice(0, limit),
    hiddenCount: Math.max(0, ordered.length - limit),
    templateCount: suggestions.filter((suggestion) => suggestion.item.isActive !== false).length,
  }
}

/**
 * «en N min» del primer bloque que aún no ha empezado (criterio 16). `null`
 * para todos los demás y cuando el día mostrado no es hoy.
 */
export function findNextBlockId(blocks: AgendaBlock[], nowMinutes: number | null): string | null {
  if (nowMinutes === null) return null
  const next = blocks.find((block) => block.startMinutes > nowMinutes)
  return next?.id ?? null
}
