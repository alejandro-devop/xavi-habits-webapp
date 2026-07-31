import { addDaysToString, getMondayOfWeek, getTodayString } from '@/features/habits/utils/habit-type.utils'

export type HabitWeekBarDay = {
  date: string
  label: string
  dayNumber: number
  isToday: boolean
  isInWeek: boolean
  isFuture: boolean
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

export function getMonthDaysForWeek(
  year: number,
  month: number,
  weekStart: string,
  today: string = getTodayString(),
): HabitWeekBarDay[] {
  const weekEnd = getWeekEnd(weekStart)
  const weekdayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const daysInMonth = new Date(year, month, 0).getDate()

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1
    const date = `${year}-${pad2(month)}-${pad2(dayNumber)}`
    const day = new Date(year, month - 1, dayNumber)
    return {
      date,
      label: weekdayLabels[day.getDay()] ?? '',
      dayNumber,
      isToday: date === today,
      isInWeek: date >= weekStart && date <= weekEnd,
      isFuture: date > today,
    }
  })
}

export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const daysInMonth = new Date(year, month, 0).getDate()
  return {
    from: `${year}-${pad2(month)}-01`,
    to: `${year}-${pad2(month)}-${pad2(daysInMonth)}`,
  }
}
