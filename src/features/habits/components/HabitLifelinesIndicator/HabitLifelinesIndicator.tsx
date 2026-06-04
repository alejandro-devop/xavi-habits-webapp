import styles from './HabitLifelinesIndicator.module.scss'

type Props = {
  used: number
  total: number
}

export function HabitLifelinesIndicator({ used, total }: Props) {
  if (total === 0) return null

  return (
    <div className={styles.root}>
      <span className={styles.icon}>🛡️</span>
      <span className={styles.label}>
        Salvavidas: {used}/{total} esta semana
      </span>
    </div>
  )
}
