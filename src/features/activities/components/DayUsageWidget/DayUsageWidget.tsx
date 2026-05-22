import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import {
  formatDayEndLabel,
  formatDurationFromMinutes,
  getDayUsageMetrics,
} from '@/features/activities/utils/activity-day-metrics.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { DataCard } from '@/shared/ui/DataCard'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './DayUsageWidget.module.scss'

export type DayUsageWidgetProps = {
  date: string
  followUps: ActivityFollowUp[]
  freeSlots: TimelineFreeSlot[]
  isLoading?: boolean
  className?: string
}

export function DayUsageWidget({
  date,
  followUps,
  freeSlots,
  isLoading = false,
  className,
}: DayUsageWidgetProps) {
  const metrics = getDayUsageMetrics(date, followUps, freeSlots, { now: new Date() })
  const dayEndLabel = formatDayEndLabel()

  if (isLoading) {
    return (
      <article
        className={[styles.skeletonCard, className].filter(Boolean).join(' ')}
        aria-busy="true"
        aria-label="Cargando aprovechamiento del día"
      >
        <Skeleton width="50%" height={14} />
        <Skeleton width="70%" height={32} />
        <Skeleton height={8} />
        <Skeleton width="80%" height={12} />
      </article>
    )
  }

  const {
    usedMinutes,
    freeMinutes,
    wasteMinutes,
    usedPercentage,
    freePercentage,
    wastePercentage,
  } = metrics

  return (
    <DataCard
      variant="glass"
      className={[styles.root, className].filter(Boolean).join(' ')}
      title="Aprovechamiento del día"
      icon={<AppIcon name="chart-line" size="md" decorative />}
      value={
        <div className={styles.body}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Aprovechado</span>
              <span className={styles.statValue}>{formatDurationFromMinutes(usedMinutes)}</span>
              <span className={styles.statPct}>{usedPercentage}%</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Libre detectado</span>
              <span className={styles.statValue}>{formatDurationFromMinutes(freeMinutes)}</span>
              <span className={styles.statPct}>{freePercentage}%</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Desperdicio</span>
              <span className={styles.statValue}>{formatDurationFromMinutes(wasteMinutes)}</span>
              <span className={styles.statPct}>{wastePercentage}%</span>
            </div>
          </div>

          <div
            className={styles.segmentedBar}
            role="img"
            aria-label={`Aprovechado ${usedPercentage}%, libre ${freePercentage}%, desperdicio ${wastePercentage}%`}
          >
            {usedPercentage > 0 ? (
              <span
                className={styles.segmentUsed}
                style={{ width: `${usedPercentage}%` }}
              />
            ) : null}
            {freePercentage > 0 ? (
              <span
                className={styles.segmentFree}
                style={{ width: `${freePercentage}%` }}
              />
            ) : null}
            {wastePercentage > 0 ? (
              <span
                className={styles.segmentWaste}
                style={{ width: `${wastePercentage}%` }}
              />
            ) : null}
          </div>

          <p className={styles.hint}>
            Libre detectado entre actividades. Desperdicio: tiempo sin registrar desde el cierre del
            día anterior.
          </p>
          <p className={styles.descFoot}>
            Ventana desde las {dayEndLabel} del día anterior · {date}
          </p>
        </div>
      }
    />
  )
}
