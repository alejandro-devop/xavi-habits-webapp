import styles from './HabitPeriodProgress.module.scss'

type Props = {
  streak: number
  periodDays: number
}

export function HabitPeriodProgress({ streak, periodDays }: Props) {
  if (periodDays === 0) return null

  const percent = Math.min(streak / periodDays, 1) * 100

  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <span className={styles.label}>
        {streak}/{periodDays} días
      </span>
    </div>
  )
}
