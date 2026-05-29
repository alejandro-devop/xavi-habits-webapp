import { formatDurationFromMinutes } from '@/features/activities/utils/activity-day-metrics.utils'
import { CategoryPieChart } from '@/features/weekly-routine/components/CategoryPieChart/CategoryPieChart'
import {
  DAY_LABELS_FULL,
  getCategoryTimeFromRoutineActivities,
} from '@/features/weekly-routine/utils/planner.utils'
import type {
  DayOfWeek,
  WeeklyRoutineActivity,
} from '@/features/weekly-routine/types/weekly-routine.types'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import styles from './DayCategoryTimeModal.module.scss'

type Props = {
  open: boolean
  day: DayOfWeek | null
  activities: WeeklyRoutineActivity[]
  onClose: () => void
}

export function DayCategoryTimeModal({ open, day, activities, onClose }: Props) {
  const { entries, totalMinutes } = getCategoryTimeFromRoutineActivities(activities)
  const dayLabel = day ? DAY_LABELS_FULL[day] : ''

  return (
    <Modal
      open={open && day !== null}
      onClose={onClose}
      title={day ? `Tiempo por categoría — ${dayLabel}` : 'Tiempo por categoría'}
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className={styles.body}>
        <p className={styles.total}>
          <span className={styles.totalLabel}>Total planificado</span>
          <span className={styles.totalValue}>{formatDurationFromMinutes(totalMinutes)}</span>
        </p>

        {entries.length > 0 ? (
          <>
            <CategoryPieChart entries={entries} totalMinutes={totalMinutes} />
            <ul className={styles.list}>
              {entries.map((entry) => {
                const pct =
                  totalMinutes > 0 ? Math.round((entry.minutes / totalMinutes) * 100) : 0
                return (
                  <li key={entry.id} className={styles.row}>
                    <span className={styles.swatch} style={{ background: entry.color }} aria-hidden />
                    <AppIcon
                      name={entry.icon ?? 'tag'}
                      size="sm"
                      color={entry.color}
                      decorative
                      className={styles.rowIcon}
                    />
                    <span className={styles.rowName}>{entry.name}</span>
                    <span className={styles.rowDuration}>
                      {formatDurationFromMinutes(entry.minutes)}
                    </span>
                    <span className={styles.rowPct}>{pct}%</span>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className={styles.empty}>No hay eventos planificados este día.</p>
        )}
      </div>
    </Modal>
  )
}
