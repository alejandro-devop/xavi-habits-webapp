import { useEffect, useState } from 'react'
import { getCurrentLocalTime } from '@/features/activities/utils/activity-time.utils'

export function useCurrentTimeMarker(enabled: boolean) {
  const [timeLabel, setTimeLabel] = useState(getCurrentLocalTime)

  useEffect(() => {
    if (!enabled) return

    const tick = () => setTimeLabel(getCurrentLocalTime())
    tick()
    const intervalId = window.setInterval(tick, 60_000)
    return () => window.clearInterval(intervalId)
  }, [enabled])

  return { timeLabel }
}
