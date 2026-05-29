import { useEffect, useState } from 'react'
import { getCurrentLocalTime, isToday } from '@/features/activities/utils/activity-time.utils'
import { useActiveWeeklyRoutineQuery } from './useWeeklyRoutine'
import type { WeeklyRoutineActivity } from '../types/weekly-routine.types'
import {
  findUpcomingRoutineActivity,
  getDayOfWeekForDate,
} from '../utils/routine-suggestion.utils'
import { timeToMinutes } from '../utils/planner.utils'

export function useUpcomingRoutineEventSuggestion(date: string): WeeklyRoutineActivity | null {
  const { data: routine } = useActiveWeeklyRoutineQuery()
  const [now, setNow] = useState(getCurrentLocalTime)

  useEffect(() => {
    if (!isToday(date)) return
    const id = window.setInterval(() => setNow(getCurrentLocalTime()), 60_000)
    return () => window.clearInterval(id)
  }, [date])

  if (!isToday(date) || !routine?.schedule) return null

  const dayOfWeek = getDayOfWeekForDate(date)
  const todaySchedule = routine.schedule.find((s) => s.dayOfWeek === dayOfWeek)
  if (!todaySchedule?.activities.length) return null

  return findUpcomingRoutineActivity(todaySchedule.activities, timeToMinutes(now))
}
