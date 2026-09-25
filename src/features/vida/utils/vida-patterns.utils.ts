/**
 * **Los patrones por actividad y la sugerencia contestable** (FEAT-007,
 * tajada 2).
 *
 * Archivo propio, y no dentro de `vida-adherence.utils.ts`, por lo que se
 * escribió en A1 y se repitió en el plan de esta fase: **se parten por lo que
 * miran**. Aquel mira el calendario —semanas y días de la semana—; este mira
 * **la actividad**: a qué hora sueles empezarla, cuánto suele llevarte y qué
 * día se sale del patrón.
 *
 * Aquí nace **el modelo de «sugerencia con respuesta guardada»**, y nace **una
 * sola vez** porque lo consumen tres pantallas: «Lo que se repite» (esta
 * tajada), Hoy (tajada 3) y la hoja de la plantilla (tajada 4). Por eso una
 * sugerencia trae **los dos parches separados** —`templatePatch` para el
 * `vidaItemUpdate` y `dayPatch` para el bloque de un día— y **la pantalla no
 * inventa ninguno**.
 *
 * Lo que aquí **no hay**, y es deliberado:
 *
 * - **Ninguna regla nueva de «seguido»** (criterio 70): cada día se arma con
 *   `buildDayAgenda` + `toSessionSpans` + `matchSessionsToBlocks`, los mismos
 *   de Hoy, de la revisión y del puente de FEAT-006.
 * - **Ni un `new Date()`**: el «hoy» entra por parámetro. Sin eso la regla de
 *   las cuatro semanas (criterio 83) no se puede probar en sus tres momentos.
 * - **Ningún número por debajo del umbral**: una actividad con dos apariciones
 *   dice «llevas 2 de 4» y espera. No se enseña un promedio de dos datos
 *   disfrazado de costumbre.
 * - **Ninguna tarjeta con una sola salida**: o hay pregunta con dos salidas, o
 *   se dice en voz alta que no hay nada que proponer (criterios 77 y 78).
 * - **Ninguna importación de React ni del store.** Las respuestas guardadas
 *   entran como datos; quién las lee del aparato es `useVidaPatterns`.
 */

import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import { buildDayAgenda } from '@/features/vida/utils/vida-agenda.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
  getVidaDayOfWeek,
  parseYmdToLocalDate,
  pluralDayLabel,
  shiftYmd,
} from '@/features/vida/utils/vida-date.utils'
import { matchSessionsToBlocks, toSessionSpans } from '@/features/vida/utils/vida-execution.utils'
import { describeItemDays } from '@/features/vida/utils/vida-template.utils'
import {
  formatDurationFromMinutes,
  formatTimeForDisplay,
  minutesToTime,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

/* ── Los umbrales, todos dichos en pantalla ─────────────────────────────── */

/** Una actividad habla a partir de cuatro apariciones en el plan (criterio 75). */
export const PATTERN_MIN_OCCURRENCES = 4
/** Por debajo de esto el patrón **está bien** y no se propone nada (77). */
export const PATTERN_TOLERANCE_MINUTES = 10
/** «Dejarlo» calla la pregunta cuatro semanas (D1, criterio 83). */
export const PATTERN_ANSWER_WEEKS = 4
/** Un día suelto necesita dos datos antes de poder señalarlo como distinto. */
export const PATTERN_MIN_DAY_SAMPLES = 2
/** Y salirse así de la cuenta para que la salida sea **quitar ese día** (81). */
export const PATTERN_DAY_OUTLIER_MINUTES = 30

const DAYS_IN_WEEK = 7
/** Las duraciones se proponen en múltiplos de cinco minutos. */
const DURATION_STEP = 5
/** Las horas, en cuartos: es lo que hace el puente de FEAT-006. */
const TIME_STEP = 15

/* ── La sugerencia: un tipo, tres formas ────────────────────────────────── */

export type VidaPatternSuggestionKind = 'duration' | 'start-time' | 'drop-day'

/** Lo que manda el `vidaItemUpdate`: **solo el campo que cambia** (79, 81). */
export type VidaPatternTemplatePatch =
  | { durationMinutes: number }
  | { startTime: string }
  | { days: VidaDayOfWeek[] }

/** Lo que mandará el `activityDayPlanItemEdit` de Hoy (tajada 3, D2). */
export type VidaPatternDayPatch = { startTime: string } | { durationMinutes: number }

export type VidaPatternSuggestion = {
  /** `kind|itemId` (+ `|dayOfWeek`). **El número no entra**: ver nota abajo. */
  id: string
  kind: VidaPatternSuggestionKind
  /** El ítem **de la plantilla**, nunca el id de un bloque de un día. */
  itemId: string
  activityId: string
  title: string
  icon: string
  color: string | null
  /** El desfase con signo del que habla. Es lo que la regla de D1 compara. */
  offsetMinutes: number
  /** Solo en `drop-day`. */
  dayOfWeek: VidaDayOfWeek | null
  /** «45 min planeados · 1h 10 reales»: de dónde sale la pregunta. */
  basis: string
  /** La pregunta entera, ya escrita. */
  ask: string
  /** Lo que pasa **antes** de tocar nada (criterio 80). */
  consequence: string
  /** «Ponerlo en 1h 10»: el número va **dentro** del botón (criterio 78). */
  affirmativeLabel: string
  /** La segunda salida, siempre escrita. */
  dismissLabel: string
  templatePatch: VidaPatternTemplatePatch
  /** `null` en `drop-day`: un día armado no se «des-planea» desde un aviso. */
  dayPatch: VidaPatternDayPatch | null
}

/** Lo que se guardó de una respuesta. Va en el store del aparato. */
export type VidaPatternAnswer = {
  /** `YYYY-MM-DD` del día en que se contestó. */
  answeredOn: string
  /** El desfase del que hablaba **entonces**. */
  offsetMinutes: number
  dayOfWeek: VidaDayOfWeek | null
}

/**
 * **La identidad de una pregunta** (punto 2 del plan).
 *
 * El número **no** entra: «tu paseo se mueve» tiene que poder pasar de +25 a
 * +70 sin dejar de ser la misma pregunta, porque si no la respuesta no
 * significaría nada y la regla de los 10 minutos del criterio 83 no tendría
 * de qué hablar.
 */
export function vidaPatternSuggestionId(
  kind: VidaPatternSuggestionKind,
  itemId: string,
  dayOfWeek: VidaDayOfWeek | null = null,
): string {
  return dayOfWeek ? `${kind}|${itemId}|${dayOfWeek}` : `${kind}|${itemId}`
}

/** La fecha en la que una respuesta deja de callar (criterios 83 y 99). */
export function suggestionReturnDate(answer: VidaPatternAnswer): string {
  return shiftYmd(answer.answeredOn, PATTERN_ANSWER_WEEKS * DAYS_IN_WEEK)
}

/**
 * **La regla de D1, en un solo sitio** (criterio 83).
 *
 * Una sugerencia contestada con «Dejarlo» calla **si y solo si** se cumplen las
 * tres: todavía no ha llegado su fecha de vuelta, el desfase no se ha movido
 * `PATTERN_TOLERANCE_MINUTES` o más, y habla del mismo día. Cualquiera de las
 * tres que falle y la pregunta vuelve — con su número nuevo, que es una
 * pregunta nueva sobre el mismo asunto.
 *
 * **Y el cruce con el puente de FEAT-006** (punto 5 del plan): el puente mira
 * 14 días y estas sugerencias 42, pero los dos proponen mover la hora del mismo
 * `VidaItem`. Si el puente de esta semana ya recibió su «Dejarlo como está»,
 * la sugerencia de hora de ese ítem **no se vuelve a preguntar aquí**: es la
 * misma pregunta, contestada una vez. No se toca `buildTemplateBridge` ni su
 * regla; lo que se hace es **no repetirla**.
 */
export function isSuggestionSilenced(input: {
  suggestion: VidaPatternSuggestion
  answer: VidaPatternAnswer | null
  /** `YYYY-MM-DD`. Aquí no se lee el reloj. */
  today: string
  /** Ítems cuyo puente se dejó como estaba **esta semana**. */
  dismissedBridgeItemIds?: string[]
}): boolean {
  const { suggestion, answer, today, dismissedBridgeItemIds = [] } = input

  if (
    suggestion.kind === 'start-time' &&
    dismissedBridgeItemIds.includes(suggestion.itemId)
  ) {
    return true
  }

  if (!answer) return false
  if (today >= suggestionReturnDate(answer)) return false
  if (Math.abs(suggestion.offsetMinutes - answer.offsetMinutes) >= PATTERN_TOLERANCE_MINUTES) {
    return false
  }
  if (suggestion.dayOfWeek !== answer.dayOfWeek) return false
  return true
}

/** «19 de octubre»: la fecha de vuelta, en palabras. */
export function formatPatternDate(date: string): string {
  const parsed = parseYmdToLocalDate(date)
  return `${parsed.getDate()} de ${parsed.toLocaleDateString('es', { month: 'long' })}`
}

/**
 * **La fecha de vuelta, a la vista desde el momento en que se contesta**
 * (D1 y criterio 99). Es lo que hace que esto no sea insistencia: cuando la
 * pregunta vuelva, ya se sabía el día.
 */
export function answerNoteFor(answer: VidaPatternAnswer): string {
  return `Lo dejaste el ${formatPatternDate(answer.answeredOn)}. Vuelve el ${formatPatternDate(
    suggestionReturnDate(answer),
  )} si el patrón sigue igual.`
}

/**
 * **La misma pregunta, contestada en el puente** (FEAT-006, criterio 58).
 *
 * «Dejarlo como está» en «La semana» se guarda con **el lunes en la clave** y
 * vuelve la semana siguiente. Se dice aquí para que esa respuesta **también se
 * vea** en «Contestadas» (criterio 99): una respuesta que calla una pregunta y
 * no aparece en ninguna lista es una respuesta invisible.
 */
export function bridgeAnswerNoteFor(weekMonday: string): string {
  return `Lo dejaste como estaba en la semana del ${formatPatternDate(weekMonday)}. Vuelve el ${formatPatternDate(
    shiftYmd(weekMonday, DAYS_IN_WEEK),
  )} si el patrón sigue igual.`
}

/**
 * **La excepción de D1, también en la dirección puente → patrón.**
 *
 * `isSuggestionSilenced` calla la sugerencia de hora cuando el puente se dejó
 * como estaba. La simétrica —el puente callado porque ya se contestó aquí—
 * tiene que respetar **las mismas tres condiciones**, o la pregunta volvería
 * en una pantalla y no en la otra: se calla solo dentro de las cuatro semanas,
 * solo si el desfase no se ha movido `PATTERN_TOLERANCE_MINUTES` o más, y solo
 * si la respuesta no hablaba de un día concreto.
 *
 * El desfase del puente es **lo que propone mover** (`propuesta − actual`); el
 * de la sugerencia es la mediana real menos la plantilla. No son el mismo
 * número al minuto —uno va redondeado al cuarto—, pero hablan de lo mismo, y
 * la comparación es con un margen de diez minutos.
 */
export function isBridgeSilencedByAnswer(input: {
  answer: VidaPatternAnswer | null
  /** Minutos con signo que el puente propone mover. */
  offsetMinutes: number
  today: string
}): boolean {
  const { answer, offsetMinutes, today } = input
  if (!answer) return false
  if (today >= suggestionReturnDate(answer)) return false
  if (Math.abs(offsetMinutes - answer.offsetMinutes) >= PATTERN_TOLERANCE_MINUTES) return false
  return answer.dayOfWeek === null
}

/* ── La tarjeta ─────────────────────────────────────────────────────────── */

/** Una casilla de la mini-fila L M X J V S D. */
export type PatternWeekdayCell = {
  day: VidaDayOfWeek
  shortLabel: string
  /** «+22», «−50», «0» o **«·»** cuando ese día no está o no hay dato (76). */
  offsetLabel: string
  /** Lo que se lee en voz alta: «martes, 70 minutos más tarde». */
  srLabel: string
  hasData: boolean
  /** 0–1: cuánto se aparta, para el tono violeta de la casilla. */
  weight: number
}

/** «Sueles empezar · 9:06 · +6 min». Las tres piezas, ya escritas. */
export type PatternLine = {
  label: string
  valueLabel: string
  offsetLabel: string
  /** `true` cuando el desfase está dentro de tolerancia: se lee en apagado. */
  isSettled: boolean
}

export type VidaActivityPattern = {
  itemId: string
  activityId: string
  title: string
  icon: string
  color: string | null
  /** «En tu plantilla: L X V · 9:00 · 45 min». */
  templateLabel: string
  /** Veces que estuvo en el plan de un día cerrado de la ventana. */
  occurrences: number
  followedCount: number
  /** «se siguió 13 de 15 veces». Siempre fracción (criterio 74). */
  followedLabel: string
  /** **Siempre**, también sin una sola sesión: ahí dice «sin dato». */
  startLine: PatternLine
  durationLine: PatternLine
  /** «Los martes · 9:40 · +70 min», solo cuando un día se sale de la cuenta. */
  dayLine: PatternLine | null
  /**
   * **La duración que sueles tardar**, redondeada a cinco minutos (criterio
   * 91). `null` con menos de `PATTERN_MIN_OCCURRENCES` **datos registrados**:
   * la mediana de dos tardes no es una costumbre, y los chips del hueco
   * ofrecen entonces la que pusiste, sin etiqueta.
   *
   * Ojo, no es lo mismo que `occurrences`: una actividad puede estar ocho
   * veces en el plan y tener dos sesiones registradas.
   */
  usualDurationMinutes: number | null
  /** Cuántas sesiones sostienen esa mediana. Se dice, no se esconde. */
  usualDurationSamples: number
  weekdayCells: PatternWeekdayCell[]
  /** Qué mide la mini-fila: sin esto, las casillas no se entienden. */
  miniRowNote: string
  /** El pie entero: lo que mide la mini-fila y la fracción de seguidas. */
  footnote: string
  suggestion: VidaPatternSuggestion | null
  /**
   * «Esto pasa como lo planeaste. Aquí no hay nada que proponer.» (77).
   *
   * **Solo con datos**: la frase habla de un patrón dentro de tolerancia, y
   * sin una sola sesión no hay patrón del que decir que va bien. Ese caso
   * tiene su propia línea en `closingLabel`.
   */
  settledLabel: string | null
  /**
   * El final honrado de los caminos que **no** tienen pregunta ni patrón que
   * confirmar: sin ninguna vez registrada, un día que se sale y no se puede
   * proponer quitarlo, o un ítem sin hora en la plantilla.
   *
   * Existe porque **ninguna tarjeta puede terminar muda**: o pregunta, o dice
   * que va bien, o dice por qué no dice nada.
   */
  closingLabel: string | null
  /** Por qué esta tarjeta no pregunta nada aunque haya desfase (85). */
  mutedReason: string | null
}

/** Una actividad que todavía no llega al umbral: dice cuánto lleva (75). */
export type VidaPatternWaiting = {
  itemId: string
  title: string
  icon: string
  color: string | null
  occurrences: number
  /** «llevas 2 de 4». */
  label: string
}

export type PatternDayInput = {
  date: string
  planItems: ActivityDayPlanItem[]
  followUps: ActivityFollowUp[]
  /** En vuelo: **no es un día sin plan**, así que no cuenta ni a favor ni en contra. */
  isPending?: boolean
  /** Su consulta falló: tampoco. */
  isError?: boolean
}

export type BuildActivityPatternsInput = {
  days: PatternDayInput[]
  items: VidaItem[]
  dayHours: { startTime: string; endTime: string }
  /** `YYYY-MM-DD` de hoy: los días que no han cerrado no cuentan. */
  today: string
}

export type VidaActivityPatterns = {
  patterns: VidaActivityPattern[]
  waiting: VidaPatternWaiting[]
  /** Cuántas tarjetas traen pregunta: «3 con algo que proponer». */
  withSuggestion: number
}

/* ── Aritmética mínima, y dicha ─────────────────────────────────────────── */

/** La mediana, o `null` sin datos. Nada más: la cuenta de «seguido» no es de aquí. */
function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle] ?? null
  const low = sorted[middle - 1]
  const high = sorted[middle]
  if (low === undefined || high === undefined) return null
  return Math.round((low + high) / 2)
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

/** «+25 min», «−12 min». El signo va delante: es un desfase, no una nota. */
function offsetLabel(minutes: number): string {
  const rounded = Math.round(minutes)
  if (rounded === 0) return '0 min'
  return rounded > 0 ? `+${rounded} min` : `−${Math.abs(rounded)} min`
}

/** «+22», «−50»: la casilla de la mini-fila, sin unidad, que no cabe. */
function cellLabel(minutes: number): string {
  const rounded = Math.round(minutes)
  if (rounded === 0) return '0'
  return rounded > 0 ? `+${rounded}` : `−${Math.abs(rounded)}`
}

function laterOrEarlier(minutes: number): string {
  return minutes > 0 ? 'más tarde' : 'más pronto'
}

type Occurrence = {
  date: string
  weekday: VidaDayOfWeek
  plannedStart: number
  plannedDuration: number
  realStart: number | null
  realDuration: number | null
}

type Accumulator = {
  item: VidaItem
  occurrences: Occurrence[]
}

/**
 * **Los patrones de la ventana, actividad por actividad.**
 *
 * Solo entran los días **cerrados** —ni hoy, ni el futuro, ni los que no se
 * pudieron leer—, que es la misma regla que usa la adherencia: contar como «no
 * seguido» un día del que no se sabe nada sería afirmar lo que no se sabe.
 *
 * El emparejamiento es el de siempre. Lo único que este archivo añade es
 * **la mediana** de las horas y de las duraciones reales, y la comparación con
 * lo que dice la plantilla.
 */
export function buildActivityPatterns(
  input: BuildActivityPatternsInput,
): VidaActivityPatterns {
  const { items, days, dayHours, today } = input
  const accumulators = new Map<string, Accumulator>()

  for (const day of days) {
    if (day.isPending || day.isError) continue
    // Un día que no ha cerrado no tiene nada que decir todavía.
    if (day.date >= today) continue

    const agenda = buildDayAgenda({
      planItems: day.planItems,
      dayStart: dayHours.startTime,
      dayEnd: dayHours.endTime,
      nowMinutes: null,
    })
    const spans = toSessionSpans({ followUps: day.followUps, date: day.date, nowMinutes: null })
    const { byBlockId } = matchSessionsToBlocks({ blocks: agenda.blocks, spans })
    const weekday = getVidaDayOfWeek(day.date)

    for (const item of items) {
      const blocks = agenda.blocks.filter((block) => block.item.activityId === item.activityId)
      if (blocks.length === 0) continue
      const accumulator = accumulators.get(item.id) ?? { item, occurrences: [] }
      // El primer bloque emparejado manda: dos bloques de la misma actividad en
      // un día son legales en el API y aquí cuentan como **una** aparición.
      const matched = blocks.map((block) => byBlockId[block.id]).find(Boolean) ?? null
      const reference = blocks[0]
      if (!reference) continue
      accumulator.occurrences.push({
        date: day.date,
        weekday,
        // La referencia es **la plantilla** cuando la hay: es lo que la
        // sugerencia propone cambiar. Si el ítem no tiene hora o duración, lo
        // que se planeó ese día es lo único con lo que comparar.
        plannedStart: item.startTime ? parseTimeToMinutes(item.startTime) : reference.startMinutes,
        plannedDuration: item.durationMinutes ?? reference.durationMinutes,
        realStart: matched ? matched.startMinutes : null,
        realDuration: matched ? matched.durationMinutes : null,
      })
      accumulators.set(item.id, accumulator)
    }
  }

  const patterns: VidaActivityPattern[] = []
  const waiting: VidaPatternWaiting[] = []

  for (const accumulator of accumulators.values()) {
    const { item, occurrences } = accumulator
    const title = item.activity?.title ?? 'Esta actividad'
    const icon = item.activity?.category?.icon ?? UNCATEGORIZED_GROUP_ICON
    const color = item.activity?.category?.color ?? null

    if (occurrences.length < PATTERN_MIN_OCCURRENCES) {
      waiting.push({
        itemId: item.id,
        title,
        icon,
        color,
        occurrences: occurrences.length,
        label: `llevas ${occurrences.length} de ${PATTERN_MIN_OCCURRENCES}`,
      })
      continue
    }

    patterns.push(buildPattern({ item, occurrences, title, icon, color }))
  }

  // Desempate estable: primero las que traen pregunta, luego las que más veces
  // se planearon, y al final el id. Dos ejecuciones sobre los mismos datos dan
  // siempre la misma lista.
  patterns.sort(
    (a, b) =>
      Number(Boolean(b.suggestion)) - Number(Boolean(a.suggestion)) ||
      b.occurrences - a.occurrences ||
      a.itemId.localeCompare(b.itemId),
  )
  waiting.sort((a, b) => b.occurrences - a.occurrences || a.itemId.localeCompare(b.itemId))

  return {
    patterns,
    waiting,
    withSuggestion: patterns.filter((pattern) => pattern.suggestion).length,
  }
}

type PatternDraft = {
  item: VidaItem
  occurrences: Occurrence[]
  title: string
  icon: string
  color: string | null
}

/** Lo que se sabe de un día de la semana dentro de la ventana. */
type WeekdayStat = {
  day: VidaDayOfWeek
  samples: number
  startOffset: number | null
  durationOffset: number | null
}

function buildWeekdayStats(occurrences: Occurrence[]): Map<VidaDayOfWeek, WeekdayStat> {
  const stats = new Map<VidaDayOfWeek, WeekdayStat>()
  for (const day of VIDA_DAY_ORDER) {
    const own = occurrences.filter((occurrence) => occurrence.weekday === day)
    const starts = own
      .filter((occurrence) => occurrence.realStart !== null)
      .map((occurrence) => (occurrence.realStart ?? 0) - occurrence.plannedStart)
    const durations = own
      .filter((occurrence) => occurrence.realDuration !== null)
      .map((occurrence) => (occurrence.realDuration ?? 0) - occurrence.plannedDuration)
    stats.set(day, {
      day,
      samples: starts.length,
      startOffset: median(starts),
      durationOffset: median(durations),
    })
  }
  return stats
}

/**
 * **Cuando el patrón es de un solo día** (criterio 81).
 *
 * Un día se puede señalar cuando tiene al menos dos datos, se sale
 * `PATTERN_DAY_OUTLIER_MINUTES` o más, y **es el único**: el resto de días con
 * datos van dentro de tolerancia. Si el desfase lo tienen todos, la pregunta es
 * mover la hora, no quitar un día.
 */
function findOutlierDay(stats: Map<VidaDayOfWeek, WeekdayStat>): WeekdayStat | null {
  const withData = [...stats.values()].filter((stat) => stat.samples > 0)
  const outliers = withData.filter(
    (stat) =>
      stat.samples >= PATTERN_MIN_DAY_SAMPLES &&
      Math.abs(stat.startOffset ?? 0) >= PATTERN_DAY_OUTLIER_MINUTES,
  )
  if (outliers.length !== 1) return null
  const outlier = outliers[0]
  if (!outlier) return null
  const rest = withData.filter((stat) => stat.day !== outlier.day)
  if (rest.length === 0) return null
  const restIsCalm = rest.every(
    (stat) => Math.abs(stat.startOffset ?? 0) < PATTERN_TOLERANCE_MINUTES,
  )
  return restIsCalm ? outlier : null
}

function buildPattern(draft: PatternDraft): VidaActivityPattern {
  const { item, occurrences, title, icon, color } = draft
  const followedCount = occurrences.filter((occurrence) => occurrence.realStart !== null).length
  const followedLabel = `se siguió ${followedCount} de ${occurrences.length} veces`

  const plannedStart = occurrences[0]?.plannedStart ?? 0
  const plannedDuration = occurrences[0]?.plannedDuration ?? 0

  const realStarts = occurrences
    .filter((occurrence) => occurrence.realStart !== null)
    .map((occurrence) => occurrence.realStart ?? 0)
  const realDurations = occurrences
    .filter((occurrence) => occurrence.realDuration !== null)
    .map((occurrence) => occurrence.realDuration ?? 0)

  const startMedian = median(realStarts)
  const durationMedian = median(realDurations)
  const startOffset = startMedian === null ? null : startMedian - plannedStart
  const durationOffset = durationMedian === null ? null : durationMedian - plannedDuration

  const stats = buildWeekdayStats(occurrences)
  const outlier = startMedian === null ? null : findOutlierDay(stats)

  const templateDuration = item.durationMinutes ?? plannedDuration
  const templateStartLabel = item.startTime
    ? formatTimeForDisplay(item.startTime)
    : formatTimeForDisplay(minutesToTime(plannedStart))
  const templateLabel = `${describeItemDays(item)} · ${templateStartLabel} · ${formatDurationFromMinutes(templateDuration)}`

  // **«Sin dato» no es «sin desfase».** Las dos líneas se pintan **siempre**
  // —el criterio 74 dice que todas las tarjetas dicen lo mismo en el mismo
  // orden— y cuando no hay ni una sesión lo dicen con la palabra que el módulo
  // ya usa para el pasado que no se sabe: **sin dato** (nunca «0», que sería
  // afirmar que empezó a su hora).
  const startLine: PatternLine =
    startMedian === null
      ? { label: 'Sueles empezar', valueLabel: '—', offsetLabel: 'sin dato', isSettled: false }
      : {
          label: 'Sueles empezar',
          valueLabel: formatTimeForDisplay(minutesToTime(startMedian)),
          offsetLabel:
            Math.abs(startOffset ?? 0) < PATTERN_TOLERANCE_MINUTES
              ? 'a su hora'
              : offsetLabel(startOffset ?? 0),
          isSettled: Math.abs(startOffset ?? 0) < PATTERN_TOLERANCE_MINUTES,
        }

  const durationLine: PatternLine =
    durationMedian === null
      ? { label: 'Suele llevarte', valueLabel: '—', offsetLabel: 'sin dato', isSettled: false }
      : {
          label: 'Suele llevarte',
          valueLabel: formatDurationFromMinutes(durationMedian),
          offsetLabel:
            Math.abs(durationOffset ?? 0) < PATTERN_TOLERANCE_MINUTES
              ? 'como lo diste'
              : offsetLabel(durationOffset ?? 0),
          isSettled: Math.abs(durationOffset ?? 0) < PATTERN_TOLERANCE_MINUTES,
        }

  const dayLine: PatternLine | null =
    outlier && outlier.startOffset !== null
      ? {
          label: `Los ${pluralDayLabel(VIDA_DAY_LABELS[outlier.day])}`,
          valueLabel: formatTimeForDisplay(minutesToTime(plannedStart + outlier.startOffset)),
          offsetLabel: offsetLabel(outlier.startOffset),
          isSettled: false,
        }
      : null

  // La mini-fila enseña **la dimensión de la que habla la tarjeta**: si lo que
  // se desborda es la duración, los minutos de más; si es la hora, lo tarde que
  // empieza. Enseñar las dos a la vez en una casilla de 30 px no se lee.
  const focus: 'duration' | 'start-time' =
    !outlier &&
    Math.abs(durationOffset ?? 0) >= PATTERN_TOLERANCE_MINUTES &&
    Math.abs(durationOffset ?? 0) >= Math.abs(startOffset ?? 0)
      ? 'duration'
      : 'start-time'

  const weekdayCells = VIDA_DAY_ORDER.map((day) => {
    const stat = stats.get(day)
    const value = focus === 'duration' ? (stat?.durationOffset ?? null) : (stat?.startOffset ?? null)
    const hasData = Boolean(stat && stat.samples > 0 && value !== null)
    if (!hasData || value === null) {
      return {
        day,
        shortLabel: VIDA_DAY_SHORT_LABELS[day],
        offsetLabel: '·',
        srLabel: `${VIDA_DAY_LABELS[day]}, sin dato`,
        hasData: false,
        weight: 0,
      }
    }
    const rounded = Math.round(value)
    const srSuffix =
      rounded === 0
        ? 'calcado'
        : focus === 'duration'
          ? `${Math.abs(rounded)} minutos ${rounded > 0 ? 'de más' : 'de menos'}`
          : `${Math.abs(rounded)} minutos ${laterOrEarlier(rounded)}`
    return {
      day,
      shortLabel: VIDA_DAY_SHORT_LABELS[day],
      offsetLabel: cellLabel(rounded),
      srLabel: `${VIDA_DAY_LABELS[day]}, ${srSuffix}`,
      hasData: true,
      weight: Math.min(1, Math.abs(rounded) / 60),
    }
  })

  const miniRowNote =
    focus === 'duration'
      ? `Minutos frente a los ${formatDurationFromMinutes(templateDuration)} planeados`
      : `Minutos frente a las ${templateStartLabel} planeadas`

  const suggestion = buildSuggestion({
    item,
    title,
    icon,
    color,
    plannedStart,
    templateDuration,
    templateStartLabel,
    startMedian,
    durationMedian,
    startOffset,
    durationOffset,
    outlier,
  })

  // **Sin dato no es «va clavado».** `startOffset` y `durationOffset` son
  // `null` cuando no hay ni una sesión: un `?? 0` los convertiría en «desfase
  // cero» y la tarjeta afirmaría que eso pasa como se planeó, debajo de un «se
  // siguió 0 de 5 veces». Para decir que un patrón va bien hace falta **haber
  // visto el patrón**.
  const hasAnyData = startMedian !== null || durationMedian !== null
  const isSettled =
    !suggestion &&
    hasAnyData &&
    (startOffset === null || Math.abs(startOffset) < PATTERN_TOLERANCE_MINUTES) &&
    (durationOffset === null || Math.abs(durationOffset) < PATTERN_TOLERANCE_MINUTES)

  const mutedReason = mutedReasonFor(item)
  const closingLabel =
    suggestion || isSettled || mutedReason
      ? null
      : closingLabelFor({ item, occurrences: occurrences.length, hasAnyData, outlier })

  return {
    itemId: item.id,
    activityId: item.activityId,
    title,
    icon,
    color,
    templateLabel: `En tu plantilla: ${templateLabel}`,
    occurrences: occurrences.length,
    followedCount,
    followedLabel,
    startLine,
    durationLine,
    dayLine,
    // **La costumbre que los chips del hueco ofrecen sin que nadie la pida**
    // (criterio 91). Sale de la misma mediana que la línea «Suele llevarte»:
    // no hay una segunda cuenta de «lo que sueles tardar».
    usualDurationMinutes:
      durationMedian === null || realDurations.length < PATTERN_MIN_OCCURRENCES
        ? null
        : Math.max(DURATION_STEP, roundTo(durationMedian, DURATION_STEP)),
    usualDurationSamples: realDurations.length,
    weekdayCells,
    miniRowNote,
    footnote: `${miniRowNote} · ${followedLabel}`,
    // Un ítem desactivado, o de una actividad archivada, **no propone nada**:
    // cambiar la plantilla de algo que ya no sale en Hoy no le sirve a nadie
    // (criterio 85). La tarjeta sigue, porque el dato es suyo.
    suggestion: mutedReason ? null : suggestion,
    settledLabel: isSettled
      ? 'Esto pasa como lo planeaste. Aquí no hay nada que proponer.'
      : null,
    closingLabel,
    mutedReason,
  }
}

/**
 * **El final de una tarjeta que no pregunta y tampoco puede decir que va
 * bien.** Ninguna rama termina muda: o hay pregunta, o hay confirmación, o se
 * dice **por qué no se dice nada**. Y siempre sin reproche: «sin dato» es el
 * pasado del que no se sabe, no un suspenso.
 */
function closingLabelFor(input: {
  item: VidaItem
  occurrences: number
  hasAnyData: boolean
  outlier: WeekdayStat | null
}): string {
  const { item, occurrences, hasAnyData, outlier } = input

  // (1) Planeada varias veces y **nunca registrada**: es el caso más común que
  // le queda al módulo, y lo único honrado es decirlo.
  if (!hasAnyData) {
    return `De estas ${occurrences} veces no hay ninguna registrada: sin dato no se puede decir cómo te sale.`
  }

  // (2) Un día se sale de la cuenta pero quitarlo dejaría la plantilla en un
  // solo día: no se propone quitarlo, y **tampoco** mover la hora de todos,
  // porque la mediana la arrastra ese mismo día (criterio 81).
  if (outlier && item.days.includes(outlier.day)) {
    const plural = pluralDayLabel(VIDA_DAY_LABELS[outlier.day])
    return `Los ${plural} van por su cuenta, y en tu plantilla solo hay ${item.days.length} días: quitar uno la dejaría en uno solo, así que aquí no se propone nada.`
  }

  // (3) Sin hora en la plantilla no hay hora que mover, y la duración va bien.
  if (!item.startTime) {
    return 'Este ítem no tiene hora en tu plantilla, así que de la hora no se propone nada.'
  }

  // (4) El resto: hay dato, hay algo que se mueve, y aun así la propuesta
  // caería en lo que ya tienes. Se dice y se deja estar.
  return 'Lo que sale de estas semanas es lo que ya tienes puesto: aquí no hay nada que proponer.'
}

/** Por qué esta tarjeta no pregunta nada, dicho en una línea (criterio 85). */
function mutedReasonFor(item: VidaItem): string | null {
  if (!item.isActive) {
    return 'Está desactivada en tu plantilla: se guarda el dato y no se propone nada.'
  }
  if (item.activity?.status === 'cancelled') {
    return 'Esta actividad está archivada: se guarda el dato y no se propone nada.'
  }
  return null
}

type SuggestionDraft = {
  item: VidaItem
  title: string
  icon: string
  color: string | null
  plannedStart: number
  templateDuration: number
  templateStartLabel: string
  startMedian: number | null
  durationMedian: number | null
  startOffset: number | null
  durationOffset: number | null
  outlier: WeekdayStat | null
}

/**
 * **Como mucho una pregunta por tarjeta, y siempre con dos salidas.**
 *
 * El orden es el del render: primero el día que se sale de la cuenta —porque
 * mover la hora de todos por un martes sería cambiar lo que va bien—, luego lo
 * que más se aparta entre la duración y la hora.
 *
 * **Sin base no se inventa el número** (la regla que hereda del puente): sin
 * sesiones no hay mediana, y sin mediana no hay pregunta. Y si la propuesta
 * cae en lo que ya tiene, tampoco: preguntar «¿lo ponemos en 45 min?» por algo
 * que ya está en 45 min no es una pregunta.
 */
function buildSuggestion(draft: SuggestionDraft): VidaPatternSuggestion | null {
  const {
    item,
    title,
    icon,
    color,
    plannedStart,
    templateDuration,
    templateStartLabel,
    startMedian,
    durationMedian,
    startOffset,
    durationOffset,
    outlier,
  } = draft

  const daysLabel = describeItemDays(item)
  const base = { itemId: item.id, activityId: item.activityId, title, icon, color }

  // (1) Un solo día se sale: la plantilla tiene **una hora por ítem**, así que
  // la única salida honrada es quitar ese día (criterio 81 y punto 11 del
  // render). Y si al quitarlo se quedara sin días, no se ofrece.
  if (outlier && outlier.startOffset !== null && item.days.includes(outlier.day)) {
    const remaining = VIDA_DAY_ORDER.filter(
      (day) => item.days.includes(day) && day !== outlier.day,
    )
    // **«Si solo quedara un día, no se ofrece»** (criterio 81). Y en ese caso
    // tampoco se propone mover la hora de todos: la mediana está arrastrada
    // por ese mismo día, así que el número no diría la verdad. Se enseña el
    // dato —la tarjeta lleva su línea «Los martes…»— y no se pregunta nada.
    if (remaining.length < 2) return null
    const dayName = VIDA_DAY_LABELS[outlier.day]
    const plural = pluralDayLabel(dayName)
    const realLabel = formatTimeForDisplay(minutesToTime(plannedStart + outlier.startOffset))
    return {
      ...base,
      id: vidaPatternSuggestionId('drop-day', item.id, outlier.day),
      kind: 'drop-day',
      offsetMinutes: Math.round(outlier.startOffset),
      dayOfWeek: outlier.day,
      basis: `los ${plural} sueles empezar a las ${realLabel}, y el resto va calcado`,
      ask: `Los ${plural}, ¿lo quitamos de la plantilla? Tu día empieza más tarde ese día.`,
      consequence: `Se queda en ${remaining.map((day) => VIDA_DAY_SHORT_LABELS[day]).join(' ')}: los ${plural} deja de salir en Hoy. Los días que ya tienes armados se quedan como están.`,
      affirmativeLabel: `Quitar el ${dayName}`,
      dismissLabel: 'Dejarlo',
      templatePatch: { days: remaining },
      dayPatch: null,
    }
  }

  const durationGap = Math.abs(durationOffset ?? 0)
  const startGap = Math.abs(startOffset ?? 0)

  // (2) La duración, cuando es lo que más se aparta.
  if (
    durationMedian !== null &&
    durationOffset !== null &&
    durationGap >= PATTERN_TOLERANCE_MINUTES &&
    durationGap >= startGap
  ) {
    const proposed = Math.max(DURATION_STEP, roundTo(durationMedian, DURATION_STEP))
    if (proposed === templateDuration) return null
    const proposedLabel = formatDurationFromMinutes(proposed)
    return {
      ...base,
      id: vidaPatternSuggestionId('duration', item.id),
      kind: 'duration',
      offsetMinutes: Math.round(durationOffset),
      dayOfWeek: null,
      basis: `${formatDurationFromMinutes(templateDuration)} planeados · ${formatDurationFromMinutes(durationMedian)} reales`,
      ask: `¿Le damos ${proposedLabel} en tu plantilla?`,
      consequence: consequenceFor(item, daysLabel, 'se cambia'),
      affirmativeLabel: `Ponerlo en ${proposedLabel}`,
      dismissLabel: 'Dejarlo',
      templatePatch: { durationMinutes: proposed },
      dayPatch: { durationMinutes: proposed },
    }
  }

  // (3) La hora. Si el ítem no tiene hora en la plantilla no hay nada que
  // mover: se dice el dato y ya está.
  if (
    item.startTime &&
    startMedian !== null &&
    startOffset !== null &&
    startGap >= PATTERN_TOLERANCE_MINUTES
  ) {
    const proposedTime = minutesToTime(roundTo(startMedian, TIME_STEP))
    if (proposedTime === item.startTime) return null
    const proposedLabel = formatTimeForDisplay(proposedTime)
    return {
      ...base,
      id: vidaPatternSuggestionId('start-time', item.id),
      kind: 'start-time',
      offsetMinutes: Math.round(startOffset),
      dayOfWeek: null,
      basis: `${templateStartLabel} planeado · ${formatTimeForDisplay(minutesToTime(startMedian))} real`,
      ask: `La hora que de verdad te sale son las ${proposedLabel}. ¿La movemos?`,
      consequence: consequenceFor(item, daysLabel, 'se mueve'),
      affirmativeLabel: `Moverlo a las ${proposedLabel}`,
      dismissLabel: 'Dejarlo',
      templatePatch: { startTime: proposedTime },
      dayPatch: { startTime: proposedTime },
    }
  }

  return null
}

/**
 * **La consecuencia, escrita antes de tocar nada** (criterio 80, y el mismo
 * texto que el puente de FEAT-006): en cuántos días está el ítem y que se
 * nombran, más la línea de que los días ya armados no se mueven.
 */
function consequenceFor(item: VidaItem, daysLabel: string, verb: string): string {
  const dayCount = item.days.length
  const where =
    dayCount === 1
      ? `En tu plantilla está un día (${daysLabel}): ${verb} ahí.`
      : `En tu plantilla está ${dayCount} días (${daysLabel}): ${verb} en todos.`
  return `${where} Los días que ya tienes armados se quedan como están.`
}

/* ── Los avisos pegados al bloque, en Hoy (FEAT-007, tajada 3) ──────────── */

/**
 * **La misma costumbre, pero por actividad** (FEAT-011, criterio 238).
 *
 * Tuvo una hermana, `usualDurationsByItemId`, que iba por **ítem de
 * plantilla**: era lo que necesitaban las fichas del hueco, y se retiró con
 * ellas (FEAT-010, criterio 381, que deroga la mitad del criterio 91). Ésta
 * quedó porque al **registrar** no hay ítem: hay una actividad elegida en el
 * buscador, que puede ni estar en la plantilla de ese día. El salto sale gratis
 * porque `VidaActivityPattern` ya lleva `activityId` al lado de `itemId`.
 *
 * Con la misma actividad en **dos ítems** de plantilla gana la mediana que más
 * datos tiene (`usualDurationSamples`), y con empate la primera: mezclar dos
 * medianas inventaría un número que no midió nadie.
 *
 * Devuelve **solo** las que tienen dato de verdad —el `null`
 * de `usualDurationMinutes` ya trae dentro la regla de los cuatro datos—, así
 * que la clave que falta es la señal de «aquí no se dice nada» (criterio 240).
 */
export function usualDurationsByActivityId(
  patterns: Pick<
    VidaActivityPattern,
    'activityId' | 'usualDurationMinutes' | 'usualDurationSamples'
  >[],
): Record<string, number> {
  const lookup: Record<string, number> = {}
  const samples: Record<string, number> = {}
  for (const pattern of patterns) {
    if (pattern.usualDurationMinutes === null) continue
    const seen = samples[pattern.activityId]
    if (seen !== undefined && seen >= pattern.usualDurationSamples) continue
    lookup[pattern.activityId] = pattern.usualDurationMinutes
    samples[pattern.activityId] = pattern.usualDurationSamples
  }
  return lookup
}

/** Un bloque del plan **de ese día**, con el sitio que tiene para moverse. */
export type BlockHintCandidate = {
  /** El id del bloque del `activityDayPlan`, **no** el del ítem de plantilla. */
  blockId: string
  activityId: string
  startMinutes: number
  durationMinutes: number
  /** Lo libre de alrededor, de `getBlockEditWindow`: dónde cabe el cambio. */
  windowStartMinutes: number
  windowEndMinutes: number
  /**
   * Ya terminó, o ya tiene sesión. Un aviso sobre un rato que ya pasó no es
   * «al planear»: es llegar tarde.
   */
  isDone: boolean
}

export type VidaBlockHint = {
  /** `sugerencia|bloque`: dos bloques de la misma actividad no comparten aviso. */
  id: string
  blockId: string
  suggestion: VidaPatternSuggestion
  /** «De tus últimas semanas». */
  header: string
  /** «1 de 2» (criterio 87). */
  counterLabel: string
  /** «Organizar la casa te suele llevar 25 min más». */
  basis: string
  /** «¿lo dejamos en 1h 10?». */
  ask: string
  /** «Sí, 1h 10»: el número va dentro (criterio 87). */
  affirmativeLabel: string
  /** «Así está bien». La segunda salida, siempre escrita. */
  dismissLabel: string
  /** **Antes de tocar nada**: «Solo para hoy…» (criterio 89, D2). */
  scopeNote: string
  /** Lo que manda el `activityDayPlanItemEdit`. Nunca la plantilla. */
  dayPatch: VidaPatternDayPatch
}

export type PickBlockHintsInput = {
  /**
   * Las tarjetas **ya filtradas por la regla de D1** (`useVidaPatterns`): una
   * contestada llega con `suggestion: null` y aquí no vuelve a decidirse nada.
   * Se piden las tarjetas y no las sugerencias sueltas porque el orden del
   * criterio 88 es **por número de repeticiones**, y ese número vive en la
   * tarjeta.
   */
  patterns: Pick<VidaActivityPattern, 'occurrences' | 'suggestion'>[]
  blocks: BlockHintCandidate[]
  /** «Dos avisos como mucho por día» (criterio 88). */
  limit?: number
  /** Cómo se dice la fecha del día que se está armando: «solo para hoy». */
  scopeLabel?: string
}

/** «solo para hoy» / «solo para el domingo»: lo que cambia y hasta dónde. */
const DEFAULT_SCOPE_LABEL = 'solo para hoy'

/**
 * **Los dos avisos del día, elegidos aquí y no en la página** (criterio 88).
 *
 * La regla entera, en un sitio probable:
 *
 * 1. Solo sugerencias con `dayPatch`: «quitar el martes» cambia la plantilla y
 *    en Hoy no tiene traducción — un día armado **no se des-planea** desde un
 *    aviso, que es lo que dice el propio tipo desde la tajada 2.
 * 2. **Desfase de más de diez minutos**, en estricto (el criterio dice «más
 *    de 10 min»; la tarjeta de Revisión entra desde diez, así que una de
 *    exactamente diez se ve allí y no aquí).
 * 3. El bloque tiene que **existir en el plan de ese día**, no haber terminado
 *    y **no tener ya el número que se propone**: preguntar «¿lo dejamos en 1h
 *    10?» a un bloque que ya dura 1h 10 no es una pregunta. Eso es también lo
 *    que hace desaparecer el aviso en cuanto se acepta.
 * 4. Y el cambio tiene que **caber** en lo libre de alrededor: un aviso que al
 *    aceptarlo choca con el bloque siguiente sería una salida que no lleva a
 *    ninguna parte. Si no cabe, no se pinta aquí; sigue en «Lo que se repite».
 * 5. **Dos como mucho**, nunca dos del mismo bloque ni dos de la misma
 *    sugerencia, ordenados por veces repetidas y, a igualdad, por desfase.
 *    Empate resuelto por el id: dos ejecuciones dan la misma lista.
 */
export function pickBlockHints(input: PickBlockHintsInput): VidaBlockHint[] {
  const { patterns, blocks, limit = 2, scopeLabel = DEFAULT_SCOPE_LABEL } = input

  const ranked = patterns
    .filter((pattern) => pattern.suggestion?.dayPatch)
    .filter(
      (pattern) =>
        Math.abs(pattern.suggestion?.offsetMinutes ?? 0) > PATTERN_TOLERANCE_MINUTES,
    )
    .sort(
      (a, b) =>
        b.occurrences - a.occurrences ||
        Math.abs(b.suggestion?.offsetMinutes ?? 0) - Math.abs(a.suggestion?.offsetMinutes ?? 0) ||
        (a.suggestion?.id ?? '').localeCompare(b.suggestion?.id ?? ''),
    )

  const hints: VidaBlockHint[] = []
  const usedBlockIds = new Set<string>()

  for (const pattern of ranked) {
    if (hints.length >= limit) break
    const suggestion = pattern.suggestion
    const dayPatch = suggestion?.dayPatch
    if (!suggestion || !dayPatch) continue

    const block = blocks.find(
      (candidate) =>
        candidate.activityId === suggestion.activityId &&
        !candidate.isDone &&
        !usedBlockIds.has(candidate.blockId) &&
        appliesTo(candidate, dayPatch),
    )
    if (!block) continue

    usedBlockIds.add(block.blockId)
    hints.push({
      id: `${suggestion.id}|${block.blockId}`,
      blockId: block.blockId,
      suggestion,
      header: 'De tus últimas semanas',
      counterLabel: '',
      basis: hintBasis(suggestion),
      ask: hintAsk(dayPatch),
      affirmativeLabel: `Sí, ${patchValueLabel(dayPatch)}`,
      dismissLabel: 'Así está bien',
      scopeNote: `Esto cambia ${scopeLabel}: tu plantilla se queda como está.`,
      dayPatch,
    })
  }

  // La cuenta se escribe al final, cuando ya se sabe cuántos hay: «1 de 2».
  return hints.map((hint, index) => ({
    ...hint,
    counterLabel: `${index + 1} de ${hints.length}`,
  }))
}

/** ¿Este bloque puede recibir el cambio, y le cambia algo? */
function appliesTo(block: BlockHintCandidate, patch: VidaPatternDayPatch): boolean {
  if ('durationMinutes' in patch) {
    if (patch.durationMinutes === block.durationMinutes) return false
    return block.startMinutes + patch.durationMinutes <= block.windowEndMinutes
  }
  const startMinutes = parseTimeToMinutes(patch.startTime)
  if (startMinutes === block.startMinutes) return false
  return (
    startMinutes >= block.windowStartMinutes &&
    startMinutes + block.durationMinutes <= block.windowEndMinutes
  )
}

/**
 * De dónde sale el aviso, en la voz del render: «te suele llevar 25 min más».
 * Nunca «te pasaste»: es un dato, no una nota de conducta.
 */
function hintBasis(suggestion: VidaPatternSuggestion): string {
  // **Minutos**, y no «1h 10»: el desfase se dice en la misma unidad en la que
  // se mide, que es lo que hace `offsetLabel` en la tarjeta de Revisión.
  const minutes = `${Math.abs(Math.round(suggestion.offsetMinutes))} min`
  if (suggestion.kind === 'duration') {
    return suggestion.offsetMinutes > 0
      ? `${suggestion.title} te suele llevar ${minutes} más`
      : `${suggestion.title} te suele llevar ${minutes} menos`
  }
  return `${suggestion.title} sueles empezarlo ${minutes} ${laterOrEarlier(suggestion.offsetMinutes)}`
}

function hintAsk(patch: VidaPatternDayPatch): string {
  return 'durationMinutes' in patch
    ? `¿lo dejamos en ${patchValueLabel(patch)}?`
    : `¿lo ponemos a las ${patchValueLabel(patch)}?`
}

function patchValueLabel(patch: VidaPatternDayPatch): string {
  return 'durationMinutes' in patch
    ? formatDurationFromMinutes(patch.durationMinutes)
    : formatTimeForDisplay(patch.startTime)
}

/* ── El dato donde se edita: la hoja de la plantilla (tajada 4) ──────────── */

/**
 * **Lo que la hoja del ítem enseña debajo de cada campo** (criterios 95–97, y
 * el marco D del render aprobado).
 *
 * Un derivado más, y **puro**: la hoja no monta consultas, no compone frases y
 * no decide nada. Recibe esto ya escrito desde `VidaPlantillaPage`, que es
 * quien tiene la ventana montada.
 *
 * Tres cosas que se deciden aquí y no en la vista:
 *
 * 1. **La línea de «Cuánto» aparece también cuando va bien.** Si solo saliera
 *    al desviarse, el aviso se convertiría en una señal de alarma — que es
 *    exactamente lo que el render prohíbe en su nota del marco D.
 * 2. **Sin una sola sesión no hay línea.** `null` y la hoja queda **la de
 *    FEAT-005, sin una línea de más ni un hueco reservado** (criterio 97).
 * 3. **El día del que habla el aviso viaja aparte** (`flaggedDay`) para que la
 *    fila de días lo marque. **Marcado no es tocado**: mientras no se pulse la
 *    salida, la hoja guarda exactamente el mismo cuerpo (criterio 96).
 */
export type VidaSheetAdvice = {
  /** «De tus últimas semanas»: de dónde sale, antes que el dato. */
  header: string
  /** Lo que dicen las semanas del campo «A qué hora». `null` si no hay dato. */
  timeText: string | null
  /** Solo `start-time` o `drop-day`: lo que se puede hacer con la hora. */
  timeSuggestion: VidaPatternSuggestion | null
  /** El día que va marcado en la fila de días (criterio 96). */
  flaggedDay: VidaDayOfWeek | null
  /** Bajo «Cuánto»: confirma cuando va bien, propone cuando no (criterio 95). */
  durationText: string | null
  durationSuggestion: VidaPatternSuggestion | null
}

export function buildTemplateSheetAdvice(pattern: VidaActivityPattern): VidaSheetAdvice | null {
  const hasStart = pattern.startLine.valueLabel !== '—'
  const hasDuration = pattern.durationLine.valueLabel !== '—'
  // Sin una sola sesión no hay nada que contar: la hoja se queda como estaba.
  if (!hasStart && !hasDuration) return null

  const suggestion = pattern.suggestion
  const timeSuggestion =
    suggestion && (suggestion.kind === 'start-time' || suggestion.kind === 'drop-day')
      ? suggestion
      : null
  const durationSuggestion = suggestion && suggestion.kind === 'duration' ? suggestion : null

  let timeText: string | null = null
  if (hasStart) {
    const base = `Sueles empezar a las ${pattern.startLine.valueLabel}`
    if (pattern.dayLine) {
      // El día que se sale se nombra **con su número**, que es lo que sostiene
      // la única salida posible: quitar ese día (frontera aceptada de F4).
      timeText = `${base}. ${pattern.dayLine.label}, a las ${pattern.dayLine.valueLabel} (${pattern.dayLine.offsetLabel}).`
    } else if (pattern.startLine.isSettled) {
      timeText = `${base}. Esta hora va bien.`
    } else {
      timeText = `${base} (${pattern.startLine.offsetLabel}).`
    }
  }

  let durationText: string | null = null
  if (hasDuration) {
    durationText = pattern.durationLine.isSettled
      ? `Suele llevarte ${pattern.durationLine.valueLabel}. Esta duración va bien.`
      : `Suele llevarte ${pattern.durationLine.valueLabel} (${pattern.durationLine.offsetLabel}).`
  }

  return {
    header: 'De tus últimas semanas',
    timeText,
    timeSuggestion,
    flaggedDay: timeSuggestion?.dayOfWeek ?? null,
    durationText,
    durationSuggestion,
  }
}
