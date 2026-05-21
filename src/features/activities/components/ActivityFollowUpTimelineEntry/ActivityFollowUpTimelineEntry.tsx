import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import { ActivityFollowUpCard } from '@/features/activities/components/ActivityFollowUpCard'
import {
  formatFollowUpTimeLabel,
  getTimelineItemHeight,
} from '@/features/activities/utils/activity-time.utils'
import styles from './ActivityFollowUpTimelineEntry.module.scss'

type ActivityFollowUpTimelineEntryProps = {
  followUp: ActivityFollowUp
  isLast: boolean
  onClick: (followUp: ActivityFollowUp) => void
}

export function ActivityFollowUpTimelineEntry({
  followUp,
  isLast,
  onClick,
}: ActivityFollowUpTimelineEntryProps) {
  const { startLabel, endLabel } = formatFollowUpTimeLabel(followUp.startTime, followUp.endTime)
  const categoryColor = followUp.activity?.category?.color ?? 'var(--color-primary)'

  return (
    <li className={styles.entry}>
      <div className={styles.rail} aria-hidden>
        <div className={styles.railInner}>
          <span
            className={styles.bullet}
            style={{
              borderColor: categoryColor,
              background: `color-mix(in srgb, ${categoryColor} 20%, var(--color-surface))`,
            }}
          />
          {!isLast ? <span className={styles.connector} /> : null}
        </div>
        <div className={styles.times}>
          <span className={styles.timeStart}>{startLabel}</span>
          <span className={styles.timeEnd}>{endLabel}</span>
        </div>
      </div>

      <div
        className={styles.cardWrap}
        style={{ minHeight: getTimelineItemHeight(followUp.durationMinutes) }}
      >
        <ActivityFollowUpCard followUp={followUp} onClick={onClick} variant="timeline" />
      </div>
    </li>
  )
}
