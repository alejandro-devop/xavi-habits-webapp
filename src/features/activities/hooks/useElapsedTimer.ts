import { useEffect, useState } from 'react'
import { formatElapsedHHMMSS } from '@/features/activities/utils/activity-time.utils'

export function useElapsedTimer(startedAtIso: string | null | undefined): string {
  const [display, setDisplay] = useState('00:00:00')

  useEffect(() => {
    if (!startedAtIso) {
      setDisplay('00:00:00')
      return
    }

    const tick = () => {
      const elapsedMs = Date.now() - new Date(startedAtIso).getTime()
      setDisplay(formatElapsedHHMMSS(elapsedMs))
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [startedAtIso])

  return display
}
