import { useRemainingDayTimer } from '@/features/activities/hooks/useRemainingDayTimer'
import {
  DAY_END_TIME,
  formatDayEndLabel,
} from '@/features/activities/utils/activity-day-metrics.utils'
import { normalizeTimeForDisplay } from '@/features/activities/utils/activity-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './DayRemainingWidget.module.scss'

/** Matches `DAY_START_TIME` in activity-day-metrics.utils.ts */
const DAY_START_TIME = '00:00:00'

function formatDayStartLabel(startTime: string): string {
  const normalized = normalizeTimeForDisplay(startTime)
  const [h, m] = normalized.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return '12:00am'

  const period = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  const minutes = String(m).padStart(2, '0')
  return `${hour12}:${minutes}${period}`
}

type DayRemainingWidgetProps = {
  endTime?: string
  className?: string
}

export function DayRemainingWidget({
  endTime = DAY_END_TIME,
  className,
}: DayRemainingWidgetProps) {
  const { display, elapsedPercentage } = useRemainingDayTimer(endTime)

  const nowLabel = new Date().toLocaleTimeString('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const dayStartLabel = formatDayStartLabel(DAY_START_TIME)
  const nowPosition = `${elapsedPercentage}%`

  return (
    <article
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-label="Tiempo restante del día"
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <AppIcon name="clock" size="sm" decorative className={styles.headerIcon} />
          <span className={styles.headerTitle}>Día de hoy</span>
        </div>
        <time className={styles.remaining} aria-live="polite">
          {display} restante
        </time>
      </div>

      <span className={styles.nowBadge}>ahora — {nowLabel}</span>

      <div className={styles.bar}>
        <span className={styles.track} aria-hidden />
        <span
          className={styles.progress}
          style={{ width: nowPosition }}
          role="progressbar"
          aria-valuenow={elapsedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del día"
        />
        <span className={styles.nowMarker} style={{ left: nowPosition }} aria-hidden />
      </div>

      <div className={styles.labels}>
        <span>{dayStartLabel}</span>
        <span>{formatDayEndLabel(endTime)}</span>
        <span className={styles.nowLabel} style={{ left: nowPosition }}>
          ▲ ahora
        </span>
      </div>
    </article>
  )
}
