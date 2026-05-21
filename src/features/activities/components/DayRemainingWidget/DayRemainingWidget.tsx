import { useRemainingDayTimer } from '@/features/activities/hooks/useRemainingDayTimer'
import {
  DAY_END_TIME,
  formatDayEndLabel,
} from '@/features/activities/utils/activity-day-metrics.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { DataCard } from '@/shared/ui/DataCard'
import styles from './DayRemainingWidget.module.scss'

type DayRemainingWidgetProps = {
  endTime?: string
  className?: string
}

export function DayRemainingWidget({
  endTime = DAY_END_TIME,
  className,
}: DayRemainingWidgetProps) {
  const { display, elapsedPercentage } = useRemainingDayTimer(endTime)

  return (
    <DataCard
      variant="glass"
      fillHeight
      className={[styles.root, className].filter(Boolean).join(' ')}
      title="Tiempo restante del día"
      icon={<AppIcon name="clock" size="md" decorative />}
      value={
        <div className={styles.body}>
          <div className={styles.main}>
            <span className={styles.counter} aria-live="polite">
              {display}
            </span>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-valuenow={elapsedPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso del día hasta la hora de cierre"
            >
              <span
                className={styles.progressFill}
                style={{ width: `${elapsedPercentage}%` }}
              />
            </div>
            <span className={styles.progressHint}>{elapsedPercentage}% del día transcurrido</span>
          </div>
          <p className={styles.footer}>Finaliza a las {formatDayEndLabel(endTime)}</p>
        </div>
      }
    />
  )
}
