import type { HabitType } from '@/features/habits/types/habit.types'
import styles from './HabitCalendarLegend.module.scss'

type Props = {
  habitType: HabitType
}

export function HabitCalendarLegend({ habitType }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.swatch}>
        <span className={`${styles.dot} ${styles['dot--empty']}`} />
        <span className={styles.label}>Sin registro</span>
      </div>
      {(habitType === 'count' || habitType === 'time') && (
        <div className={styles.swatch}>
          <span className={`${styles.dot} ${styles['dot--accomplished-low']}`} />
          <span className={styles.label}>Logrado parcial</span>
        </div>
      )}
      <div className={styles.swatch}>
        <span className={`${styles.dot} ${styles['dot--accomplished-full']}`} />
        <span className={styles.label}>Logrado</span>
      </div>
      <div className={styles.swatch}>
        <span className={`${styles.dot} ${styles['dot--failed']}`} />
        <span className={styles.label}>Fallido</span>
      </div>
      <div className={styles.swatch}>
        <span className={`${styles.dot} ${styles['dot--lifeline']}`} />
        <span className={styles.label}>Salvavidas</span>
      </div>
    </div>
  )
}
