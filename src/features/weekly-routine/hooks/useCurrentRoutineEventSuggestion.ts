import { useEffect, useState } from 'react'
import { getCurrentLocalTime } from '@/features/activities/utils/activity-time.utils'
import { useActiveWeeklyRoutineQuery } from './useWeeklyRoutine'
import type { DayOfWeek, WeeklyRoutineActivity } from '../types/weekly-routine.types'
import { timeToMinutes } from '../utils/planner.utils'

function getTodayDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]!
}

export function useCurrentRoutineEventSuggestion(): WeeklyRoutineActivity | null {
  const { data: routine } = useActiveWeeklyRoutineQuery()
  const [now, setNow] = useState(getCurrentLocalTime)

  useEffect(() => {
    const id = window.setInterval(() => setNow(getCurrentLocalTime()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  if (!routine?.schedule) return null

  const todayDow = getTodayDayOfWeek()
  const todaySchedule = routine.schedule.find((s) => s.dayOfWeek === todayDow)
  if (!todaySchedule) return null

  const nowMin = timeToMinutes(now)

  return (
    todaySchedule.activities.find((a) => {
      const start = timeToMinutes(a.startTime)
      const end = start + a.durationMinutes
      return nowMin >= start && nowMin < end
    }) ?? null
  )
}
