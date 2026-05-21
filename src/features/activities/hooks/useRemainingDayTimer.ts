import { useEffect, useState } from 'react'
import {
  DAY_END_TIME,
  formatDurationFromMs,
  getDayElapsedPercentage,
  getRemainingDayMs,
} from '@/features/activities/utils/activity-day-metrics.utils'
import { getCurrentLocalDate } from '@/features/activities/utils/activity-time.utils'

export function useRemainingDayTimer(endTime: string = DAY_END_TIME): {
  display: string
  elapsedPercentage: number
} {
  const [state, setState] = useState({ display: '00:00:00', elapsedPercentage: 0 })

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const today = getCurrentLocalDate()
      const remainingMs = getRemainingDayMs(now, today, endTime)
      setState({
        display: formatDurationFromMs(remainingMs),
        elapsedPercentage: getDayElapsedPercentage(now, today, endTime),
      })
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [endTime])

  return state
}
