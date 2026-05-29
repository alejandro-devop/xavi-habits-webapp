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
