import type { DayOfWeek, WeeklyRoutineActivity } from '../types/weekly-routine.types'
import { timeToMinutes } from './planner.utils'

const DAYS_BY_JS_INDEX: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export function getDayOfWeekForDate(date: string): DayOfWeek {
  const d = new Date(`${date}T12:00:00`)
  return DAYS_BY_JS_INDEX[d.getDay()]!
}

/** Día de la semana en zona local (evita desfases de `toISOString()` / UTC). */
export function getCurrentDayOfWeek(): DayOfWeek {
  return DAYS_BY_JS_INDEX[new Date().getDay()]!
}

export function findCurrentRoutineActivity(
  activities: WeeklyRoutineActivity[],
  nowMinutes: number,
): WeeklyRoutineActivity | null {
  return (
    activities.find((activity) => {
      const start = timeToMinutes(activity.startTime)
      const end = start + activity.durationMinutes
      return nowMinutes >= start && nowMinutes < end
    }) ?? null
  )
}

export function findUpcomingRoutineActivity(
  activities: WeeklyRoutineActivity[],
  nowMinutes: number,
): WeeklyRoutineActivity | null {
  return (
    [...activities]
      .filter((activity) => timeToMinutes(activity.startTime) > nowMinutes)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] ?? null
  )
}

export type RoutineNowStatus =
  | { kind: 'in_progress'; activity: WeeklyRoutineActivity }
  | { kind: 'upcoming'; activity: WeeklyRoutineActivity }
  | { kind: 'done' }

/** Bloque que debería estar en curso ahora, el próximo pendiente, o rutina terminada. */
export function getRoutineNowStatus(
  activities: WeeklyRoutineActivity[],
  nowMinutes: number,
): RoutineNowStatus | null {
  if (activities.length === 0) return null

  const current = findCurrentRoutineActivity(activities, nowMinutes)
  if (current) return { kind: 'in_progress', activity: current }

  const upcoming = findUpcomingRoutineActivity(activities, nowMinutes)
  if (upcoming) return { kind: 'upcoming', activity: upcoming }

  return { kind: 'done' }
}

export interface RoutineActivityWindow {
  visible: WeeklyRoutineActivity[]
  hasMoreBefore: boolean
  hasMoreAfter: boolean
}

/** Índice del bloque en curso, el próximo futuro, o el último si ya pasó todo el día. */
export function findRoutineActivityPivotIndex(
  activities: WeeklyRoutineActivity[],
  nowMinutes: number,
): number {
  if (activities.length === 0) return 0

  const currentIdx = activities.findIndex((activity) => {
    const start = timeToMinutes(activity.startTime)
    const end = start + activity.durationMinutes
    return nowMinutes >= start && nowMinutes < end
  })
  if (currentIdx >= 0) return currentIdx

  const upcomingIdx = activities.findIndex(
    (activity) => timeToMinutes(activity.startTime) > nowMinutes,
  )
  if (upcomingIdx >= 0) return upcomingIdx

  return activities.length - 1
}

/** Ventana de actividades alrededor de la hora actual (p. ej. 2 antes + 2 después). */
export function getRoutineActivityWindow(
  activities: WeeklyRoutineActivity[],
  nowMinutes: number,
  before = 2,
  after = 2,
): RoutineActivityWindow {
  if (activities.length === 0) {
    return { visible: [], hasMoreBefore: false, hasMoreAfter: false }
  }

  const pivot = findRoutineActivityPivotIndex(activities, nowMinutes)
  const start = Math.max(0, pivot - before)
  const end = Math.min(activities.length, pivot + after + 1)

  return {
    visible: activities.slice(start, end),
    hasMoreBefore: start > 0,
    hasMoreAfter: end < activities.length,
  }
}
