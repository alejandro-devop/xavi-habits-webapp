import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import { ActivityFollowUpCard } from '@/features/activities/components/ActivityFollowUpCard'
import {
  formatFollowUpTimeLabel,
  getTimelineItemHeight,
} from '@/features/activities/utils/activity-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import styles from './ActivityFollowUpTimelineEntry.module.scss'

type ActivityFollowUpTimelineEntryProps = {
  followUp: ActivityFollowUp
  isLast: boolean
  showContinueButton?: boolean
  continueDisabled?: boolean
  onClick: (followUp: ActivityFollowUp) => void
  onContinueAfter?: (followUp: ActivityFollowUp) => void
}

export function ActivityFollowUpTimelineEntry({
  followUp,
  isLast,
  showContinueButton = false,
  continueDisabled = false,
  onClick,
  onContinueAfter,
}: ActivityFollowUpTimelineEntryProps) {
  const { startLabel, endLabel } = formatFollowUpTimeLabel(followUp.startTime, followUp.endTime)
  const categoryColor = followUp.activity?.category?.color ?? 'var(--color-primary)'

  return (
    <li className={styles.entry}>
      <div className={styles.rail}>
        <div className={styles.railInner} aria-hidden>
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
          {showContinueButton && onContinueAfter ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={styles.continueBtn}
              disabled={continueDisabled}
              aria-label={`Registrar actividad desde las ${endLabel}`}
              onClick={() => onContinueAfter(followUp)}
            >
              <AppIcon name="plus" size="sm" decorative />
            </Button>
          ) : null}
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
