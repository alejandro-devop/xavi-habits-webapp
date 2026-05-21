import { ActivityFreeSlotBlock } from '@/features/activities/components/ActivityFreeSlotBlock'
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import { formatFollowUpTimeLabel } from '@/features/activities/utils/activity-time.utils'
import styles from './ActivityFreeSlotTimelineEntry.module.scss'

type ActivityFreeSlotTimelineEntryProps = {
  slot: TimelineFreeSlot
  isLast: boolean
  onClick: (slot: TimelineFreeSlot) => void
}

export function ActivityFreeSlotTimelineEntry({
  slot,
  isLast,
  onClick,
}: ActivityFreeSlotTimelineEntryProps) {
  const { startLabel, endLabel } = formatFollowUpTimeLabel(slot.startTime, slot.endTime)

  return (
    <li className={styles.entry}>
      <div className={styles.rail} aria-hidden>
        <div className={styles.railInner}>
          <span className={styles.bullet} />
          {!isLast ? <span className={styles.connector} /> : null}
        </div>
        <div className={styles.times}>
          <span className={styles.timeStart}>{startLabel}</span>
          <span className={styles.timeEnd}>{endLabel}</span>
        </div>
      </div>

      <div className={styles.cardWrap}>
        <ActivityFreeSlotBlock slot={slot} onClick={onClick} />
      </div>
    </li>
  )
}
