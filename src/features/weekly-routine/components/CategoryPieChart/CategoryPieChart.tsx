import { formatDurationFromMinutes } from '@/features/activities/utils/activity-day-metrics.utils'
import { buildCategoryPieGradient } from '@/features/weekly-routine/utils/planner.utils'
import type { RoutineCategoryTimeEntry } from '@/features/weekly-routine/utils/planner.utils'
import styles from './CategoryPieChart.module.scss'

type Props = {
  entries: RoutineCategoryTimeEntry[]
  totalMinutes: number
}

export function CategoryPieChart({ entries, totalMinutes }: Props) {
  if (totalMinutes <= 0 || entries.length === 0) return null

  const gradient = buildCategoryPieGradient(entries, totalMinutes)
  const ariaLabel = entries
    .map((entry) => {
      const pct = Math.round((entry.minutes / totalMinutes) * 100)
      return `${entry.name}: ${pct}%`
    })
    .join(', ')

  return (
    <figure className={styles.figure} aria-label={ariaLabel}>
      <div className={styles.pie} style={{ background: gradient }} role="img">
        <div className={styles.hole}>
          <span className={styles.holeValue}>{formatDurationFromMinutes(totalMinutes)}</span>
        </div>
      </div>
    </figure>
  )
}
