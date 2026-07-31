import { addDaysToString, getMondayOfWeek, getTodayString } from '@/features/habits/utils/habit-type.utils'

export type HabitWeekBarDay = {
  date: string
  label: string
  dayNumber: number
  isToday: boolean
  isInWeek: boolean
  isFuture: boolean
  /** Día de otro mes incluido porque la semana seleccionada lo cruza. */
  isOutsideMonth: boolean
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function getYearMonthFromDate(date: string): { year: number; month: number } {
  const [year, month] = date.split('-').map(Number)
  return { year: year ?? 0, month: month ?? 1 }
}

export function getWeekEnd(weekStart: string): string {
  return addDaysToString(weekStart, 6)
}

export function isFutureWeek(weekStart: string, today: string = getTodayString()): boolean {
  return weekStart > getMondayOfWeek(today)
}

/** Fecha de consulta para Mi Día según la semana seleccionada. */
export function getMyDayFocusDate(weekStart: string, today: string = getTodayString()): string {
  const currentWeekStart = getMondayOfWeek(today)
  if (weekStart === currentWeekStart) return today
  return weekStart
}

function buildDay(
  date: string,
  weekStart: string,
  weekEnd: string,
  today: string,
  isOutsideMonth: boolean,
): HabitWeekBarDay {
  const [y, m, d] = date.split('-').map(Number)
  const day = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1)
  const weekdayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return {
    date,
    label: weekdayLabels[day.getDay()] ?? '',
    dayNumber: d ?? 1,
    isToday: date === today,
    isInWeek: date >= weekStart && date <= weekEnd,
    isFuture: date > today,
    isOutsideMonth,
  }
}

/**
 * Días del mes + días de meses adyacentes que caen en la semana seleccionada
 * (para que en mobile/tablet la semana siempre tenga 7 días visibles).
 */
export function getMonthDaysForWeek(
  year: number,
  month: number,
  weekStart: string,
  today: string = getTodayString(),
): HabitWeekBarDay[] {
  const weekEnd = getWeekEnd(weekStart)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstOfMonth = `${year}-${pad2(month)}-01`
  const lastOfMonth = `${year}-${pad2(month)}-${pad2(daysInMonth)}`

  const leading: HabitWeekBarDay[] = []
  if (weekStart < firstOfMonth) {
    let cursor = weekStart
    while (cursor < firstOfMonth) {
      leading.push(buildDay(cursor, weekStart, weekEnd, today, true))
      cursor = addDaysToString(cursor, 1)
    }
  }

  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1
    const date = `${year}-${pad2(month)}-${pad2(dayNumber)}`
    return buildDay(date, weekStart, weekEnd, today, false)
  })

  const trailing: HabitWeekBarDay[] = []
  if (weekEnd > lastOfMonth) {
    let cursor = addDaysToString(lastOfMonth, 1)
    while (cursor <= weekEnd) {
      trailing.push(buildDay(cursor, weekStart, weekEnd, today, true))
      cursor = addDaysToString(cursor, 1)
    }
  }

  return [...leading, ...monthDays, ...trailing]
}

export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const daysInMonth = new Date(year, month, 0).getDate()
  return {
    from: `${year}-${pad2(month)}-01`,
    to: `${year}-${pad2(month)}-${pad2(daysInMonth)}`,
  }
}

/** Rango de follow-ups: mes completo + desborde de la semana seleccionada. */
export function getFollowUpQueryRange(
  year: number,
  month: number,
  weekStart: string,
): { from: string; to: string } {
  const monthRange = getMonthRange(year, month)
  const weekEnd = getWeekEnd(weekStart)
  return {
    from: weekStart < monthRange.from ? weekStart : monthRange.from,
    to: weekEnd > monthRange.to ? weekEnd : monthRange.to,
  }
}
