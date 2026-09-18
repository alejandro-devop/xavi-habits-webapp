import styles from './HabitPeriodProgress.module.scss'

type Props = {
  /**
   * Días acumulados dentro del periodo (`habit.days`). No es la racha ni un
   * recuento de la tira visible: la barra habla del periodo, y punto.
   */
  value: number
  periodDays: number
  /** Los hábitos de evitar van en violeta; los de mantener, en mint. */
  tone?: 'keep' | 'avoid'
  /**
   * Texto a la izquierda bajo la barra. Cuando se pasa, la barra y las cifras
   * se apilan (la tarjeta de "Mis Hábitos"); si no, quedan en una sola línea.
   */
  caption?: string
}

export function HabitPeriodProgress({ value, periodDays, tone = 'keep', caption }: Props) {
  if (periodDays === 0) return null

  const percent = Math.min(Math.max(value, 0) / periodDays, 1) * 100

  const bar = (
    <div className={styles.bar}>
      <div
        className={[styles.fill, tone === 'avoid' ? styles.fillAvoid : ''].filter(Boolean).join(' ')}
        style={{ width: `${percent}%` }}
      />
    </div>
  )

  if (caption) {
    return (
      <div className={styles.stacked}>
        {bar}
        <div className={styles.stackedLabels}>
          <span className={styles.caption}>{caption}</span>
          <span className={styles.value}>
            {value} / {periodDays}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {bar}
      <span className={styles.label}>
        {value}/{periodDays} días
      </span>
    </div>
  )
}
