import { useEffect, useState } from 'react'
import {
  formatElapsedCompact,
  formatElapsedHHMMSS,
} from '@/features/activities/utils/activity-time.utils'

type ElapsedFormat = 'hhmmss' | 'compact'

export function useElapsedTimer(
  startedAtIso: string | null | undefined,
  format: ElapsedFormat = 'hhmmss',
): string {
  const empty = format === 'compact' ? '0m' : '00:00:00'
  const [display, setDisplay] = useState(empty)

  useEffect(() => {
    if (!startedAtIso) {
      setDisplay(empty)
      return
    }

    const formatter = format === 'compact' ? formatElapsedCompact : formatElapsedHHMMSS

    const tick = () => {
      const elapsedMs = Date.now() - new Date(startedAtIso).getTime()
      setDisplay(formatter(elapsedMs))
    }

    tick()
    const intervalId = window.setInterval(tick, format === 'compact' ? 60_000 : 1000)
    return () => window.clearInterval(intervalId)
  }, [startedAtIso, format, empty])

  return display
}
