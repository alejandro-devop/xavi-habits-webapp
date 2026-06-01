import styles from './NotebookFilters.module.scss'

export type DateRange = 'today' | 'week' | 'month'

type Props = {
  dateRange: DateRange | null
  showCompleted: boolean
  onDateRangeChange: (range: DateRange | null) => void
  onShowCompletedChange: (show: boolean) => void
}

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Solo hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
]

export function NotebookFilters({
  dateRange,
  showCompleted,
  onDateRangeChange,
  onShowCompletedChange,
}: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.chips}>
        <button
          type="button"
          className={[styles.chip, dateRange === null ? styles.chipActive : ''].join(' ')}
          onClick={() => onDateRangeChange(null)}
        >
          Todas
        </button>
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={[styles.chip, dateRange === opt.value ? styles.chipActive : ''].join(' ')}
            onClick={() => onDateRangeChange(dateRange === opt.value ? null : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className={styles.toggle}>
        <span className={styles.toggleLabel}>Completadas</span>
        <button
          type="button"
          role="switch"
          aria-checked={showCompleted}
          className={[styles.switch, showCompleted ? styles.switchOn : ''].join(' ')}
          onClick={() => onShowCompletedChange(!showCompleted)}
        >
          <span className={styles.thumb} />
        </button>
      </label>
    </div>
  )
}
