import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import {
  formatHoursFromMinutes,
  getCategoryTimeFromFollowUps,
} from '@/features/activities/utils/activity-category-metrics.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { DataCard } from '@/shared/ui/DataCard'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './CategoryTimeWidget.module.scss'

export type CategoryTimeWidgetProps = {
  date: string
  followUps: ActivityFollowUp[]
  isLoading?: boolean
  className?: string
}

export function CategoryTimeWidget({
  date,
  followUps,
  isLoading = false,
  className,
}: CategoryTimeWidgetProps) {
  const { entries, totalMinutes } = getCategoryTimeFromFollowUps(followUps)
  const totalHoursLabel = formatHoursFromMinutes(totalMinutes)
  const hasEntries = entries.length > 0

  if (isLoading) {
    return (
      <article
        className={[styles.skeletonCard, className].filter(Boolean).join(' ')}
        aria-busy="true"
        aria-label="Cargando tiempo por categoría"
      >
        <Skeleton width="55%" height={14} />
        <Skeleton width="40%" height={28} />
        <Skeleton height={8} />
        <Skeleton width="90%" height={12} />
        <Skeleton width="75%" height={12} />
      </article>
    )
  }

  return (
    <DataCard
      variant="glass"
      fillHeight
      className={[styles.root, className].filter(Boolean).join(' ')}
      title="Tiempo por categoría"
      icon={<AppIcon name="chart-pie" size="md" decorative />}
      value={
        <div className={styles.body}>
          <p className={styles.total}>
            <span className={styles.totalLabel}>Total registrado</span>
            <span className={styles.totalValue}>{totalHoursLabel}</span>
          </p>

          {hasEntries ? (
            <>
              <div
                className={styles.segmentedBar}
                role="img"
                aria-label={entries
                  .map((e) => `${e.name} ${formatHoursFromMinutes(e.minutes)}`)
                  .join(', ')}
              >
                {entries.map((entry) =>
                  entry.percentage > 0 ? (
                    <span
                      key={entry.id}
                      className={styles.segment}
                      style={{
                        width: `${entry.percentage}%`,
                        background: entry.color,
                      }}
                    />
                  ) : null,
                )}
              </div>

              <ul className={styles.list}>
                {entries.map((entry) => (
                  <li key={entry.id} className={styles.row}>
                    <span
                      className={styles.swatch}
                      style={{ background: entry.color }}
                      aria-hidden
                    />
                    <AppIcon
                      name={entry.icon ?? 'list-check'}
                      size="sm"
                      decorative
                      className={styles.rowIcon}
                    />
                    <span className={styles.rowName}>{entry.name}</span>
                    <span className={styles.rowHours}>
                      {formatHoursFromMinutes(entry.minutes)}
                    </span>
                    <span className={styles.rowPct}>{entry.percentage}%</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.empty}>Sin registros este día</p>
          )}

          <p className={styles.foot}>{date}</p>
        </div>
      }
    />
  )
}
