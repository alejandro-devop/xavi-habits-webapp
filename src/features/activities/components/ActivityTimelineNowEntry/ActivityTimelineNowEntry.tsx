import { useCurrentTimeMarker } from '@/features/activities/hooks/useCurrentTimeMarker'
import styles from './ActivityTimelineNowEntry.module.scss'

type ActivityTimelineNowEntryProps = {
  enabled: boolean
  isLast: boolean
}

export function ActivityTimelineNowEntry({ enabled, isLast }: ActivityTimelineNowEntryProps) {
  const { timeLabel } = useCurrentTimeMarker(enabled)

  if (!enabled) return null

  return (
    <li className={styles.entry} role="status" aria-live="polite">
      <div className={styles.rail} aria-hidden>
        <div className={styles.railInner}>
          <span className={styles.bulletNow} />
          {!isLast ? <span className={styles.connector} /> : null}
        </div>
        <div className={styles.times}>
          <span className={styles.nowLabel}>Ahora</span>
          <span className={styles.timeNow}>{timeLabel}</span>
        </div>
      </div>
      <div className={styles.placeholder} aria-hidden />
    </li>
  )
}
