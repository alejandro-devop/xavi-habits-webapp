import type {
  HabitFollowUp,
  HabitFollowUpsDateGroup,
  HabitMyDayEntry,
} from '@/features/habits/types/habit.types'

/**
 * Derivados puros de "Mi Día". Todo se calcula en cliente sobre lo que ya
 * devuelve `habitMyDay`: no hay datos nuevos de API detrás de estas tarjetas.
 */

/** Con un solo hábito una media o un "estrella" no dicen nada. */
export const MIN_ENTRIES_FOR_AGGREGATES = 2

export type HabitDayTotals = {
  total: number
  /** Logrados por mérito propio (el salvavidas se cuenta aparte). */
  accomplished: number
  lifelines: number
  failed: number
  pending: number
  /** 0–100 · (logrados + salvavidas) / total, redondeado. */
  percent: number
}

export type HabitStreakSummary = {
  /** Media de `habit.streak` redondeada. */
  average: number
  /** Cuántos hábitos superan los 10 días seguidos. */
  aboveTen: number
  /** Mejor racha histórica del conjunto: `max(habit.maxStreak)`. */
  best: number
  /** 0–1 · media sobre la mejor racha histórica. */
  ratio: number
}

export type HabitStarSummary = {
  entry: HabitMyDayEntry
  streak: number
  /** Días acumulados dentro del periodo, si el hábito define uno. */
  days: number
  periodDays: number | null
  /** 0–1 · `days / periodDays`. Null cuando el hábito no tiene periodo. */
  periodRatio: number | null
}

export type HabitCategoryTally = {
  categoryId: string
  count: number
}

function isLifeline(entry: HabitMyDayEntry): boolean {
  return entry.followUp?.isLifeline === true
}

export function getHabitDayTotals(entries: HabitMyDayEntry[]): HabitDayTotals {
  const total = entries.length
  const lifelines = entries.filter(isLifeline).length
  const accomplished = entries.filter(
    (entry) => entry.followUp?.isAccomplished === true && !isLifeline(entry),
  ).length
  const failed = entries.filter(
    (entry) => entry.followUp?.isFailed === true && !isLifeline(entry),
  ).length
  const pending = Math.max(0, total - accomplished - lifelines - failed)
  const covered = accomplished + lifelines

  return {
    total,
    accomplished,
    lifelines,
    failed,
    pending,
    percent: total > 0 ? Math.round((covered / total) * 100) : 0,
  }
}

/**
 * Racha media del día. La referencia de la barra es la mejor racha histórica
 * real del conjunto (`maxStreak`), no una meta inventada.
 */
export function getHabitStreakSummary(entries: HabitMyDayEntry[]): HabitStreakSummary | null {
  if (entries.length < MIN_ENTRIES_FOR_AGGREGATES) return null

  const streaks = entries.map((entry) => entry.habit.streak ?? 0)
  const sum = streaks.reduce((acc, streak) => acc + streak, 0)
  const average = Math.round(sum / streaks.length)
  const aboveTen = streaks.filter((streak) => streak > 10).length
  const best = entries.reduce(
    (max, entry) => Math.max(max, entry.habit.maxStreak ?? 0, entry.habit.streak ?? 0),
    0,
  )

  return {
    average,
    aboveTen,
    best,
    ratio: best > 0 ? Math.min(average / best, 1) : 0,
  }
}

/** El hábito con la racha activa más alta. Empate: el primero en el orden dado. */
export function getStarHabit(entries: HabitMyDayEntry[]): HabitStarSummary | null {
  if (entries.length < MIN_ENTRIES_FOR_AGGREGATES) return null

  let best: HabitMyDayEntry | null = null
  for (const entry of entries) {
    if (best === null || (entry.habit.streak ?? 0) > (best.habit.streak ?? 0)) {
      best = entry
    }
  }
  if (best === null) return null

  const periodDays = best.habit.periodDays > 0 ? best.habit.periodDays : null
  const days = best.habit.days ?? 0

  return {
    entry: best,
    streak: best.habit.streak ?? 0,
    days,
    periodDays,
    periodRatio: periodDays !== null ? Math.min(days / periodDays, 1) : null,
  }
}

/** Cuántos hábitos del día caen en cada categoría. Filtro de cliente, sin refetch. */
export function countEntriesByCategory(entries: HabitMyDayEntry[]): Map<string, number> {
  const tally = new Map<string, number>()
  for (const entry of entries) {
    const categoryId = entry.habit.categoryId
    if (categoryId == null) continue
    tally.set(categoryId, (tally.get(categoryId) ?? 0) + 1)
  }
  return tally
}

/** `null` = "Todos". */
export function filterEntriesByCategory(
  entries: HabitMyDayEntry[],
  categoryId: string | null,
): HabitMyDayEntry[] {
  if (categoryId === null) return entries
  return entries.filter((entry) => entry.habit.categoryId === categoryId)
}

/**
 * Índice `habitId → fecha → follow-up` a partir de los grupos por fecha que
 * devuelve `habitFollowUpsInDates`. Lo comparten Mi Día y Mis Hábitos: las dos
 * pantallas pintan tiras de días con la misma fuente.
 */
export function buildFollowUpsByHabit(
  groups: HabitFollowUpsDateGroup[] | undefined,
): Map<string, Map<string, HabitFollowUp>> {
  const byHabit = new Map<string, Map<string, HabitFollowUp>>()
  if (!groups) return byHabit

  for (const group of groups) {
    for (const fu of group.followUps) {
      let byDate = byHabit.get(fu.habitId)
      if (!byDate) {
        byDate = new Map()
        byHabit.set(fu.habitId, byDate)
      }
      byDate.set(fu.date, {
        id: fu.id,
        date: fu.date,
        habitId: fu.habitId,
        isAccomplished: fu.isAccomplished,
        isFailed: fu.isFailed,
        isLifeline: fu.isLifeline,
        difficulty: fu.difficulty,
        count: fu.count,
        time: fu.time,
        notes: fu.notes,
        story: null,
        archived: false,
        // Sin esta línea la hora no llega al panel aunque el servidor la mande.
        timeOfDay: fu.timeOfDay ?? null,
      })
    }
  }
  return byHabit
}
