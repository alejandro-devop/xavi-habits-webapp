import styles from './HabitWeekNav.module.scss'

type Props = {
  weekStart: string
  onPrev: () => void
  onNext: () => void
  disableNext: boolean
}

export function HabitWeekNav({ weekStart, onPrev, onNext, disableNext }: Props) {
  return (
    <div className={styles.root}>
      <button className={styles.navBtn} onClick={onPrev} aria-label="Semana anterior">
        ‹
      </button>
      <span className={styles.label}>{formatWeekRange(weekStart)}</span>
      <button
        className={styles.navBtn}
        onClick={onNext}
        disabled={disableNext}
        aria-label="Semana siguiente"
      >
        ›
      </button>
    </div>
  )
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T12:00:00Z')
  const end = new Date(weekStart + 'T12:00:00Z')
  end.setUTCDate(end.getUTCDate() + 6)

  const startDay = start.getUTCDate()
  const endDay = end.getUTCDate()
  const startMonth = start.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' })
  const endMonth = end.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' })
  const year = end.getUTCFullYear()

  if (startMonth === endMonth) {
    return `${startDay} – ${endDay} ${endMonth} ${year}`
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`
}
