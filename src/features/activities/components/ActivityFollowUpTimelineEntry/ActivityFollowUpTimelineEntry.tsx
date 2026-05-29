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
  showQuickActions?: boolean
  quickActionsDisabled?: boolean
  onClick: (followUp: ActivityFollowUp) => void
  onContinueAfter?: (followUp: ActivityFollowUp) => void
  onStartFrom?: (followUp: ActivityFollowUp) => void
}

export function ActivityFollowUpTimelineEntry({
  followUp,
  isLast,
  showQuickActions = false,
  quickActionsDisabled = false,
  onClick,
  onContinueAfter,
  onStartFrom,
}: ActivityFollowUpTimelineEntryProps) {
  if (followUp.isOpen || followUp.durationMinutes === null || !followUp.endTime) {
    return null
  }

  const durationMinutes = followUp.durationMinutes
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
          {showQuickActions ? (
            <div className={styles.quickActions}>
              {onStartFrom ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={styles.quickActionBtn}
                  disabled={quickActionsDisabled}
                  aria-label={`Iniciar actividad desde las ${endLabel}`}
                  onClick={() => onStartFrom(followUp)}
                >
                  <AppIcon name="play" size="sm" decorative />
                </Button>
              ) : null}
              {onContinueAfter ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={styles.quickActionBtn}
                  disabled={quickActionsDisabled}
                  aria-label={`Registrar actividad desde las ${endLabel}`}
                  onClick={() => onContinueAfter(followUp)}
                >
                  <AppIcon name="plus" size="sm" decorative />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={styles.cardWrap}
        style={{ minHeight: getTimelineItemHeight(durationMinutes) }}
      >
        <ActivityFollowUpCard followUp={followUp} onClick={onClick} variant="timeline" />
      </div>
    </li>
  )
}
