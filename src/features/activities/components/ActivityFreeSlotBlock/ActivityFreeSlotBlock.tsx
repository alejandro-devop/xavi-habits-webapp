import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import {
  COMPACT_TIMELINE_THRESHOLD_MINUTES,
  formatDurationMinutes,
  formatFollowUpTimeLabel,
  getTimelineItemHeight,
} from '@/features/activities/utils/activity-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './ActivityFreeSlotBlock.module.scss'

type ActivityFreeSlotBlockProps = {
  slot: TimelineFreeSlot
  onClick: (slot: TimelineFreeSlot) => void
}

export function ActivityFreeSlotBlock({ slot, onClick }: ActivityFreeSlotBlockProps) {
  const { startLabel, endLabel } = formatFollowUpTimeLabel(slot.startTime, slot.endTime)
  const compact = slot.durationMinutes < COMPACT_TIMELINE_THRESHOLD_MINUTES
  const height = getTimelineItemHeight(slot.durationMinutes)

  return (
    <button
      type="button"
      className={[styles.card, compact ? styles.compact : ''].filter(Boolean).join(' ')}
      style={{ minHeight: height }}
      onClick={() => onClick(slot)}
      aria-label={`Espacio libre de ${startLabel} a ${endLabel}, ${slot.durationMinutes} minutos. Registrar actividad.`}
    >
      <div className={styles.header}>
        <span className={styles.iconWrap} aria-hidden>
          <AppIcon name="plus" size="sm" decorative />
        </span>
        <span className={styles.title}>Espacio libre</span>
      </div>
      <p className={styles.range}>
        {startLabel} → {endLabel} · {formatDurationMinutes(slot.durationMinutes)}
      </p>
      <p className={styles.hint}>Click para registrar actividad</p>
    </button>
  )
}
