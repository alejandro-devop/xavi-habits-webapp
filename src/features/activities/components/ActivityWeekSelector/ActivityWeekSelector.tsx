import type { WeekDay } from '@/features/activities/types/activity-followup.types'
import styles from './ActivityWeekSelector.module.scss'

type ActivityWeekSelectorProps = {
  days: WeekDay[]
  onSelect: (date: string) => void
}

export function ActivityWeekSelector({ days, onSelect }: ActivityWeekSelectorProps) {
  return (
    <div className={styles.root} role="group" aria-label="Semana actual">
      {days.map((day) => (
        <button
          key={day.date}
          type="button"
          className={[
            styles.day,
            day.isSelected ? styles.selected : '',
            day.isToday ? styles.today : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={day.isFuture}
          aria-disabled={day.isFuture}
          aria-pressed={day.isSelected}
          aria-current={day.isToday ? 'date' : undefined}
          onClick={() => onSelect(day.date)}
        >
          <span className={styles.label}>{day.label}</span>
          <span className={styles.number}>{day.dayNumber}</span>
        </button>
      ))}
    </div>
  )
}
