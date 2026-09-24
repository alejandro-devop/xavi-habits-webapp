import type { Habit, HabitDayEntry, HabitFollowUp } from '@/features/habits/types/habit.types'
import { formatWeekRange } from '@/features/habits/utils/habit-date-format.utils'
import {
  getFollowUpProgressValue,
  getHabitDailyGoal,
  getHabitDayStatus,
} from '@/features/habits/utils/habit-progress.utils'
import { addDaysToString, getMondayOfWeek } from '@/features/habits/utils/habit-type.utils'

/**
 * Aritmética del panel del hábito. Todo lo de aquí es **puro**: recibe días ya
 * materializados y devuelve datos. Los componentes solo pintan.
 *
 * Convenciones que se heredan del resto de la app y no se reinventan:
 * - El salvavidas cuenta como día cubierto, no como fallo (fase 2).
 * - Un día sin follow-up es «sin registro», no un fallo: se cuenta aparte en
 *   cada resumen para que los gráficos y las tablas puedan distinguirlos.
 * - El porcentaje de cumplimiento es `cubiertos / días del rango`, igual que
 *   `getHabitDayTotals` en `habit-stats.utils.ts`.
 */

export const HABIT_PANEL_RANGES = [30, 90, 365] as const

export type HabitPanelRange = (typeof HABIT_PANEL_RANGES)[number]

export const HABIT_PANEL_RANGE_LABELS: Record<HabitPanelRange, string> = {
  30: '30 d',
  90: '90 d',
  365: '1 año',
}

export const HABIT_PANEL_RANGE_LONG_LABELS: Record<HabitPanelRange, string> = {
  30: '30 días',
  90: '90 días',
  365: 'último año',
}

export const DEFAULT_HABIT_PANEL_RANGE: HabitPanelRange = 90

/** Por debajo de dos semanas de vida no hay tendencia que enseñar. */
export const MIN_DAYS_FOR_TREND = 14

/** Un periodo previo más corto que esto es ruido, no comparación. */
export const MIN_DAYS_FOR_PREVIOUS = 7

/** Diferencia en puntos a partir de la cual las dos cifras se dicen seguidas. */
export const MEANINGFUL_DELTA_POINTS = 3

/**
 * **El umbral de esta pantalla, y vive solo aquí.** Cuántas veces tiene que
 * haber aparecido un día de la semana **con registro** dentro del tramo para
 * poder nombrarlo. Por debajo, el panel calla: dos martes no son un patrón.
 * Se cambia en esta línea y en ninguna otra.
 */
export const MIN_TRACKED_PER_WEEKDAY = 4

/** Y cuántos días tienen que llegar a ese umbral para que comparar signifique algo. */
export const MIN_WEEKDAYS_COMPARABLE = 2

/**
 * Para decir «de largo» hace falta una ventaja de verdad: al menos vez y media
 * los fallos del siguiente **y** dos fallos más. Sin las dos, la frase afirma
 * una distancia que no existe.
 */
const BY_FAR_RATIO = 1.5
const BY_FAR_MARGIN = 2

/** Cuántos días de detalle enseña «Cuánto, frente a tu objetivo». */
export const GOAL_SERIES_DAYS = 21

/** Cuántos episodios de racha caben sin que las etiquetas se pisen. */
export const MAX_STREAK_EPISODES = 12

export const WEEKDAY_SHORT_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

export const WEEKDAY_LONG_LABELS = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
] as const

/** Para la frase del reparto: «Los domingos fallas 3 de 9 veces». */
export const WEEKDAY_PLURAL_LABELS = [
  'los lunes',
  'los martes',
  'los miércoles',
  'los jueves',
  'los viernes',
  'los sábados',
  'los domingos',
] as const

const MS_PER_DAY = 86_400_000

function toUtcNoon(ymd: string): number {
  return Date.parse(`${ymd}T12:00:00Z`)
}

/** Días de `from` a `to`, ambos incluidos. `0` si el rango está invertido. */
export function countDaysInclusive(from: string, to: string): number {
  if (to < from) return 0
  return Math.round((toUtcNoon(to) - toUtcNoon(from)) / MS_PER_DAY) + 1
}

/** Lunes = 0 … domingo = 6, en la misma convención que la rejilla de contribución. */
export function getWeekdayIndex(ymd: string): number {
  const day = new Date(toUtcNoon(ymd)).getUTCDay()
  return day === 0 ? 6 : day - 1
}

export type HabitPanelWindow = {
  from: string
  to: string
  /** Días naturales del tramo, ya recortado. */
  days: number
}

/**
 * El eje nunca empieza antes de que el hábito existiera: `max(startDate, hoy − rango)`.
 * Y nunca termina después de su fecha de fin, si la tiene.
 */
export function resolveRangeWindow(
  range: HabitPanelRange,
  habitStartDate: string | null,
  today: string,
  habitEndDate: string | null = null,
): HabitPanelWindow {
  const to = habitEndDate && habitEndDate < today ? habitEndDate : today
  const naturalFrom = addDaysToString(to, -(range - 1))
  const from = habitStartDate && habitStartDate > naturalFrom ? habitStartDate : naturalFrom
  return { from, to, days: countDaysInclusive(from, to) }
}

/**
 * Tramo previo de igual longitud, también recortado a la vida del hábito.
 * `null` cuando no queda nada antes con lo que comparar.
 */
export function resolvePreviousWindow(
  current: HabitPanelWindow,
  range: HabitPanelRange,
  habitStartDate: string | null,
): HabitPanelWindow | null {
  const to = addDaysToString(current.from, -1)
  if (habitStartDate && to < habitStartDate) return null

  const naturalFrom = addDaysToString(to, -(range - 1))
  const from = habitStartDate && habitStartDate > naturalFrom ? habitStartDate : naturalFrom
  const days = countDaysInclusive(from, to)
  if (days < MIN_DAYS_FOR_PREVIOUS) return null

  return { from, to, days }
}

/** Un día por fecha del tramo, tenga registro o no. */
export function buildDayEntries(
  habit: Habit,
  window: HabitPanelWindow,
  followUpByDate: Map<string, HabitFollowUp>,
): HabitDayEntry[] {
  const entries: HabitDayEntry[] = []
  if (window.days <= 0) return entries

  let cursor = window.from
  while (cursor <= window.to) {
    const followUp = followUpByDate.get(cursor) ?? null
    const visual = getHabitDayStatus(habit, followUp)
    // «A medias» no es un día cubierto: para el recuento vale como sin registro,
    // pero el follow-up se conserva para el gráfico de cantidad.
    entries.push({
      date: cursor,
      status: visual === 'partial' ? 'empty' : visual,
      followUp,
    })
    cursor = addDaysToString(cursor, 1)
  }
  return entries
}

export function isCoveredDay(entry: HabitDayEntry): boolean {
  return entry.status === 'accomplished' || entry.status === 'lifeline'
}

export type RangeSummary = {
  total: number
  /** Logrados + salvavidas. */
  covered: number
  accomplished: number
  lifelines: number
  /** Fallos explícitos. */
  failed: number
  /** Días sin ningún registro: ni logro ni fallo. */
  untracked: number
  /** 0–100 · cubiertos sobre los días del tramo. */
  percent: number
}

function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

export function buildRangeSummary(days: HabitDayEntry[]): RangeSummary {
  const total = days.length
  const accomplished = days.filter((day) => day.status === 'accomplished').length
  const lifelines = days.filter((day) => day.status === 'lifeline').length
  const failed = days.filter((day) => day.status === 'failed').length
  const covered = accomplished + lifelines

  return {
    total,
    covered,
    accomplished,
    lifelines,
    failed,
    untracked: total - covered - failed,
    percent: percentOf(covered, total),
  }
}

export type WeeklyPoint = {
  weekStart: string
  /** `15–21 sep`. */
  label: string
  total: number
  covered: number
  lifelines: number
  failed: number
  untracked: number
  percent: number
  /** Media 0–4 de las dificultades registradas esa semana. */
  avgDifficulty: number | null
}

export function buildWeeklyCompliance(days: HabitDayEntry[]): WeeklyPoint[] {
  const byWeek = new Map<string, HabitDayEntry[]>()
  for (const day of days) {
    const weekStart = getMondayOfWeek(day.date)
    const bucket = byWeek.get(weekStart)
    if (bucket) bucket.push(day)
    else byWeek.set(weekStart, [day])
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([weekStart, weekDays]) => {
      const summary = buildRangeSummary(weekDays)
      const difficulties = weekDays
        .map((day) => day.followUp?.difficulty)
        .filter((value): value is number => typeof value === 'number')

      return {
        weekStart,
        label: formatWeekRange(weekStart),
        total: summary.total,
        covered: summary.covered,
        lifelines: summary.lifelines,
        failed: summary.failed,
        untracked: summary.untracked,
        percent: summary.percent,
        avgDifficulty:
          difficulties.length > 0
            ? difficulties.reduce((acc, value) => acc + value, 0) / difficulties.length
            : null,
      }
    })
}

export type WeekdayStat = {
  /** Lunes = 0 … domingo = 6. */
  weekday: number
  label: string
  longLabel: string
  pluralLabel: string
  total: number
  covered: number
  failed: number
  untracked: number
  percent: number
  /**
   * Días de ese día de la semana **con registro**: cubiertos + fallados. Es el
   * conjunto contra el que se mide el umbral y el que nombra cada frase; los
   * días sin registrar viven aparte, en `untracked`, y no entran en ningún
   * denominador. Aquí hubo una `failRate` que nadie leía: se borró antes de
   * que alguien la confundiera con una tasa sobre `total`.
   */
  tracked: number
}

/** Siempre siete entradas, aunque alguna no tenga ni un día en el tramo. */
export function buildWeekdayBreakdown(days: HabitDayEntry[]): WeekdayStat[] {
  const buckets: HabitDayEntry[][] = [[], [], [], [], [], [], []]
  for (const day of days) {
    buckets[getWeekdayIndex(day.date)].push(day)
  }

  return buckets.map((bucket, weekday) => {
    const summary = buildRangeSummary(bucket)
    return {
      weekday,
      label: WEEKDAY_SHORT_LABELS[weekday],
      longLabel: WEEKDAY_LONG_LABELS[weekday],
      pluralLabel: WEEKDAY_PLURAL_LABELS[weekday],
      total: summary.total,
      covered: summary.covered,
      failed: summary.failed,
      untracked: summary.untracked,
      percent: summary.percent,
      tracked: summary.covered + summary.failed,
    }
  })
}

/**
 * Los días de la semana que se pueden comparar: los que han aparecido con
 * registro al menos `MIN_TRACKED_PER_WEEKDAY` veces en el tramo. Un día sin
 * registrar **no entra en el denominador** de nada.
 */
export function getComparableWeekdays(stats: WeekdayStat[]): WeekdayStat[] {
  return stats.filter((stat) => stat.tracked >= MIN_TRACKED_PER_WEEKDAY)
}

/**
 * El día donde más veces se ha fallado. **Se cuenta por fallos, no por
 * porcentaje de cumplimiento**: el porcentaje esconde el tamaño —«50 %» son
 * cinco de diez o uno de dos— y pintaba igual los dos casos.
 *
 * Devuelve `null`, y entonces el panel calla, en tres situaciones distintas:
 * no hay bastantes días comparables, ningún fallo en el tramo, o empate en la
 * cabeza. **No se desempata en silencio.** El texto de cada caso lo compone
 * `composeWeekdayFailNote`.
 */
export function getMostFailedWeekday(stats: WeekdayStat[]): WeekdayStat | null {
  const comparable = getComparableWeekdays(stats)
  if (comparable.length < MIN_WEEKDAYS_COMPARABLE) return null

  const most = comparable.reduce((top, stat) => (stat.failed > top.failed ? stat : top))
  if (most.failed === 0) return null
  if (comparable.filter((stat) => stat.failed === most.failed).length > 1) return null
  return most
}

/** Si el día señalado lo está «de largo» o solo por delante. */
export function leadsByFar(stats: WeekdayStat[], most: WeekdayStat): boolean {
  const rest = getComparableWeekdays(stats).filter((stat) => stat.weekday !== most.weekday)
  const second = rest.reduce((top, stat) => Math.max(top, stat.failed), 0)
  return most.failed >= second * BY_FAR_RATIO && most.failed - second >= BY_FAR_MARGIN
}

function pluralTimes(count: number): string {
  return count === 1 ? '1 vez' : `${count} veces`
}

/**
 * Lo que se cuenta son **registros**, no apariciones en el calendario: en un
 * tramo de 63 días los martes aparecen nueve veces aunque solo tres estén
 * registrados. Llamarlos «apariciones» decía algo falso justo en la frase que
 * existe para decir la verdad sobre lo que falta.
 */
function pluralRecords(count: number): string {
  return count === 1 ? '1 registro' : `${count} registros`
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * La frase de debajo del reparto por día de la semana. **El umbral se dice en
 * voz alta**: cuando el panel calla, dice con qué cifra se está callando y qué
 * le falta para hablar.
 *
 * Ni veredictos ni consejos: el número delante y el hecho detrás. El verbo es
 * «fallar», que es el que ya usa el resto del módulo y **se lee igual en un
 * hábito a evitar** (allí `isFailed` sigue significando «se falló el hábito»,
 * o sea que se hizo lo que se quería evitar): no hay nada que invertir.
 */
export function composeWeekdayFailNote(
  stats: WeekdayStat[],
  most: WeekdayStat | null,
): string | null {
  if (most) {
    const fact = `${capitalize(most.pluralLabel)} fallas ${most.failed} de ${pluralTimes(most.tracked)}.`
    return leadsByFar(stats, most)
      ? `${fact} Es el día donde más se te cae, de largo.`
      : `${fact} Es el día donde más se te cae.`
  }

  const comparable = getComparableWeekdays(stats)
  const maxTracked = stats.reduce((top, stat) => Math.max(top, stat.tracked), 0)
  if (maxTracked === 0) return null

  if (comparable.length === 0) {
    return `De cada día de la semana hay ${pluralRecords(maxTracked)} o menos en este tramo. Con ${MIN_TRACKED_PER_WEEKDAY} ya se puede comparar: todavía no hay bastante para decir dónde se te cae.`
  }

  if (comparable.length < MIN_WEEKDAYS_COMPARABLE) {
    return `Solo ${comparable[0].pluralLabel} llegan a ${MIN_TRACKED_PER_WEEKDAY} registros en este tramo. Con ${MIN_WEEKDAYS_COMPARABLE} días ya se puede comparar.`
  }

  const top = comparable.reduce((best, stat) => Math.max(best, stat.failed), 0)
  if (top === 0) {
    return 'En este tramo no hay ningún día fallado.'
  }

  const tied = comparable.filter((stat) => stat.failed === top).length
  return `Ningún día destaca en este tramo: ${tied} días empatan a ${top} ${top === 1 ? 'fallo' : 'fallos'}.`
}

export type StreakEpisode = {
  startDate: string
  endDate: string
  length: number
  /** Llega hasta el último día del tramo. */
  isCurrent: boolean
  /** La más larga del tramo. */
  isRecord: boolean
  /** `sep` o `jun–jul` cuando cruza de mes. */
  label: string
}

function monthLabel(ymd: string): string {
  return new Date(toUtcNoon(ymd)).toLocaleDateString('es-ES', {
    month: 'short',
    timeZone: 'UTC',
  })
}

function episodeLabel(startDate: string, endDate: string): string {
  const start = monthLabel(startDate)
  const end = monthLabel(endDate)
  return start === end ? start : `${start}–${end}`
}

/**
 * Cada episodio es una tirada de días cubiertos. Rompe tanto un fallo explícito
 * como un día sin registro: los huecos son las roturas.
 */
export function buildStreakEpisodes(days: HabitDayEntry[]): StreakEpisode[] {
  const episodes: Array<Omit<StreakEpisode, 'isRecord'>> = []
  let start: string | null = null
  let previous: string | null = null

  for (const day of days) {
    if (isCoveredDay(day)) {
      if (start === null) start = day.date
      previous = day.date
      continue
    }
    if (start !== null && previous !== null) {
      episodes.push({
        startDate: start,
        endDate: previous,
        length: countDaysInclusive(start, previous),
        isCurrent: false,
        label: episodeLabel(start, previous),
      })
      start = null
      previous = null
    }
  }

  if (start !== null && previous !== null) {
    episodes.push({
      startDate: start,
      endDate: previous,
      length: countDaysInclusive(start, previous),
      isCurrent: true,
      label: episodeLabel(start, previous),
    })
  }

  const longest = episodes.reduce((max, episode) => Math.max(max, episode.length), 0)
  let recordTaken = false

  return episodes.map((episode) => {
    const isRecord = !recordTaken && episode.length === longest && longest > 0
    if (isRecord) recordTaken = true
    return { ...episode, isRecord }
  })
}

/**
 * Las veces que volviste: cada racha que arranca después de un hueco. La
 * primera racha del tramo no cuenta si empieza el día uno — ahí no volviste de
 * ninguna parte.
 */
export function countComebacks(days: HabitDayEntry[]): {
  total: number
  lastDaysAgo: number | null
} {
  const episodes = buildStreakEpisodes(days)
  const first = days[0]
  const comebacks = episodes.filter(
    (episode) => first === undefined || episode.startDate > first.date,
  )

  const last = comebacks[comebacks.length - 1]
  const lastDay = days[days.length - 1]
  const lastDaysAgo =
    last && lastDay ? Math.max(0, countDaysInclusive(last.startDate, lastDay.date) - 1) : null

  return { total: comebacks.length, lastDaysAgo }
}

/**
 * La frase de arriba del panel: **las dos cifras, sin veredicto**. Devuelve
 * `null` cuando no hay periodo anterior con el que comparar.
 *
 * Aquí vivían tres veredictos del tipo «vas + adjetivo». Murieron a propósito
 * (FEAT-015, tajada 2) y no vuelven por otra puerta: eran una nota de
 * conducta sobre el usuario a partir de una comparación que muchas veces no
 * tiene detrás datos para sostenerse. Las dos cifras son el dato, y el dato
 * se dice entero. `MEANINGFUL_DELTA_POINTS` sigue decidiendo
 * una cosa —si la diferencia merece nombrarse— pero lo que se nombra es la
 * diferencia en puntos, no a quien la produjo.
 *
 * **Dónde se falla ya no se cuenta aquí**: es el reparto por día de la semana
 * y su frase (`composeWeekdayFailNote`), que cuenta fallos y no porcentajes.
 */
export function composeReading(
  current: RangeSummary,
  previous: RangeSummary | null,
): string | null {
  if (!previous || previous.total <= 0 || current.total <= 0) return null

  const delta = current.percent - previous.percent
  const sentence = `Cumpliste el ${current.percent}% de los días de este tramo; en el tramo anterior, el ${previous.percent}%.`
  if (Math.abs(delta) < MEANINGFUL_DELTA_POINTS) return sentence

  const points = Math.abs(delta)
  const direction = delta > 0 ? 'más' : 'menos'
  return `${sentence} Son ${points} ${points === 1 ? 'punto' : 'puntos'} ${direction}.`
}

export type DifficultyPoint = {
  weekStart: string
  label: string
  /** Media 0–4. */
  average: number
  samples: number
}

/** Solo semanas con alguna dificultad registrada: no se inventan ceros. */
export function buildDifficultySeries(days: HabitDayEntry[]): DifficultyPoint[] {
  const samplesByWeek = new Map<string, number>()
  for (const day of days) {
    if (typeof day.followUp?.difficulty !== 'number') continue
    const weekStart = getMondayOfWeek(day.date)
    samplesByWeek.set(weekStart, (samplesByWeek.get(weekStart) ?? 0) + 1)
  }

  const points: DifficultyPoint[] = []
  for (const week of buildWeeklyCompliance(days)) {
    if (week.avgDifficulty === null) continue
    points.push({
      weekStart: week.weekStart,
      label: week.label,
      average: week.avgDifficulty,
      samples: samplesByWeek.get(week.weekStart) ?? 0,
    })
  }
  return points
}

export function hasAnyDifficulty(days: HabitDayEntry[]): boolean {
  return days.some((day) => typeof day.followUp?.difficulty === 'number')
}

export type AverageDifficulty = {
  /** Media 0–4 de las dificultades anotadas en el tramo. */
  average: number
  /** Sobre cuántos días se calcula: los que **tienen** dificultad anotada. */
  daysWithDifficulty: number
}

/**
 * La dificultad media del tramo, **solo** sobre los días con dificultad
 * anotada. Devuelve `null` cuando no hay ninguno: aquí un cero no sería «muy
 * fácil», sería «no lo sé», y este panel no afirma lo que no sabe. Misma regla
 * que ya sigue `buildDifficultySeries`, que no inventa semanas.
 */
export function buildAverageDifficulty(days: HabitDayEntry[]): AverageDifficulty | null {
  const values = days
    .map((day) => day.followUp?.difficulty)
    .filter((value): value is number => typeof value === 'number')

  if (values.length === 0) return null

  return {
    average: values.reduce((acc, value) => acc + value, 0) / values.length,
    daysWithDifficulty: values.length,
  }
}

export type GoalPoint = {
  date: string
  value: number
  /** Llegó al objetivo diario. */
  met: boolean
  /** Hubo registro ese día. */
  tracked: boolean
}

/** «Cuánto, frente a tu objetivo» solo existe con cantidad y objetivo diario. */
export function shouldShowGoalChart(habit: Habit): boolean {
  if (habit.habitType !== 'count' && habit.habitType !== 'time') return false
  return getHabitDailyGoal(habit) > 0
}

export function buildGoalSeries(
  days: HabitDayEntry[],
  habit: Habit,
  maxDays: number = GOAL_SERIES_DAYS,
): GoalPoint[] {
  const goal = getHabitDailyGoal(habit)
  return days.slice(-maxDays).map((day) => {
    const value = day.followUp ? getFollowUpProgressValue(day.followUp, habit.habitType) : 0
    return {
      date: day.date,
      value,
      met: goal > 0 && value >= goal,
      tracked: day.followUp !== null,
    }
  })
}

/** `3` · `2,5` — el separador decimal en español es la coma. */
export function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',')
}

/** `15 sep` — el eje de días y los tooltips no necesitan más. */
export function formatShortDate(ymd: string): string {
  return new Date(toUtcNoon(ymd)).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}
