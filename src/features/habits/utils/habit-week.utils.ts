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

/**
 * Número de semana ISO-8601 (la semana empieza en lunes y la semana 1 es la
 * que contiene el primer jueves del año). Es el que pinta el cintillo.
 */
export function getIsoWeekNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const target = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1))
  // Mover al jueves de la misma semana ISO.
  const dayOfWeek = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayOfWeek + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const firstDayOfWeek = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayOfWeek + 3)
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / msPerWeek)
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
 * Los 7 días de la semana seleccionada, de lunes a domingo. Es lo que pinta la
 * tira de "Mi Día": ahí el mes entero no aporta nada (vive en el calendario).
 */
export function getWeekDays(
  weekStart: string,
  today: string = getTodayString(),
): HabitWeekBarDay[] {
  const weekEnd = getWeekEnd(weekStart)
  return Array.from({ length: 7 }, (_, index) =>
    buildDay(addDaysToString(weekStart, index), weekStart, weekEnd, today, false),
  )
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

/**
 * Los `count` días que terminan en `endDate` (incluido), en orden cronológico.
 * Es la ventana de la tira de "Mis Hábitos": se pide siempre igual (14 días),
 * sea cual sea el ancho de la pantalla.
 */
export function getRecentDays(
  count: number,
  endDate: string = getTodayString(),
  today: string = getTodayString(),
): HabitWeekBarDay[] {
  const safeCount = Math.max(0, count)
  const start = addDaysToString(endDate, -(safeCount - 1))
  return Array.from({ length: safeCount }, (_, index) =>
    buildDay(addDaysToString(start, index), start, endDate, today, false),
  )
}

/**
 * Recorte **al pintar**, no al consultar: en móvil se ven los últimos 7 días de
 * los 14 cargados. Cambiar el ancho no cambia ningún dato.
 */
export function getVisibleDays(days: HabitWeekBarDay[], visibleCount: number): HabitWeekBarDay[] {
  if (visibleCount >= days.length) return days
  return days.slice(days.length - visibleCount)
}
