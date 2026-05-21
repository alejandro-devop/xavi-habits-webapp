import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import { ActivityFollowUpCard } from '@/features/activities/components/ActivityFollowUpCard'
import { HOUR_BLOCK_HEIGHT } from '@/features/activities/utils/activity-time.utils'
import styles from './ActivityHourBlock.module.scss'

type ActivityHourBlockProps = {
  hour: number
  followUps: ActivityFollowUp[]
  onFollowUpClick: (followUp: ActivityFollowUp) => void
}

export function ActivityHourBlock({ hour, followUps, onFollowUpClick }: ActivityHourBlockProps) {
  const label = `${String(hour).padStart(2, '0')}:00`

  return (
    <div className={styles.block} style={{ minHeight: `${HOUR_BLOCK_HEIGHT}px` }}>
      <div className={styles.hourLabel} aria-hidden>
        {label}
      </div>
      <div className={styles.content}>
        {followUps.length > 0 ? (
          <div className={styles.cards}>
            {followUps.map((followUp) => (
              <ActivityFollowUpCard
                key={followUp.id}
                followUp={followUp}
                onClick={onFollowUpClick}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptySlot} aria-hidden />
        )}
      </div>
    </div>
  )
}
