import type { DayOfWeek } from '@/features/weekly-routine/types/weekly-routine.types'
import { ALL_DAYS, DAY_LABELS } from '@/features/weekly-routine/utils/planner.utils'
import styles from './DayPickerToggle.module.scss'

type Props = {
  selected: DayOfWeek[]
  onChange: (days: DayOfWeek[]) => void
}

export function DayPickerToggle({ selected, onChange }: Props) {
  function toggle(day: DayOfWeek) {
    if (selected.includes(day)) {
      if (selected.length === 1) return
      onChange(selected.filter((d) => d !== day))
    } else {
      onChange([...selected, day])
    }
  }

  return (
    <div className={styles.container}>
      {ALL_DAYS.map((day) => (
        <button
          key={day}
          type="button"
          className={`${styles.chip} ${selected.includes(day) ? styles.selected : ''}`}
          onClick={() => toggle(day)}
          aria-pressed={selected.includes(day)}
        >
          {DAY_LABELS[day]}
        </button>
      ))}
    </div>
  )
}
