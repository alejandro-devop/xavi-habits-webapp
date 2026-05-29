import { formatDurationFromMinutes } from '@/features/activities/utils/activity-day-metrics.utils'
import type { WeeklyRoutineActivity } from '@/features/weekly-routine/types/weekly-routine.types'
import { formatBlockTime, formatEventTime } from '@/features/weekly-routine/utils/planner.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './ActivityTimelineUpcomingEntry.module.scss'

type Props = {
  event: WeeklyRoutineActivity
  isLast: boolean
  onStart?: (event: WeeklyRoutineActivity) => void
}

export function ActivityTimelineUpcomingEntry({ event, isLast, onStart }: Props) {
  const categoryColor = event.activity?.category?.color ?? 'var(--color-primary)'
  const categoryIcon = event.activity?.category?.icon ?? 'tag'
  const startLabel = formatBlockTime(event.startTime)

  return (
    <li className={styles.entry}>
      <div className={styles.rail}>
        <div className={styles.railInner} aria-hidden>
          <span
            className={styles.bullet}
            style={{
              borderColor: categoryColor,
              background: `color-mix(in srgb, ${categoryColor} 16%, var(--color-surface))`,
            }}
          />
          {!isLast ? <span className={styles.connector} /> : null}
        </div>
        <div className={styles.times}>
          <span className={styles.timeLabel}>{startLabel}</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardInfo}>
          <span className={styles.cardLabel}>Próximo en tu rutina</span>
          <span className={styles.cardTitleRow}>
            <AppIcon name={categoryIcon} size="xs" color={categoryColor} decorative />
            <span className={styles.cardTitle}>{event.activity?.title ?? '—'}</span>
          </span>
          <span className={styles.cardMeta}>
            {formatEventTime(event.startTime, event.durationMinutes)}
            {' · '}
            {formatDurationFromMinutes(event.durationMinutes)}
          </span>
        </div>
        {onStart ? (
          <button
            type="button"
            className={styles.play}
            onClick={() => onStart(event)}
            aria-label={`Iniciar ${event.activity?.title ?? 'actividad planificada'}`}
          >
            <AppIcon name="play" size="sm" />
          </button>
        ) : null}
      </div>
    </li>
  )
}
