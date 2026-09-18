import { useMemo } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import { addDaysToString, getMondayOfWeek, getTodayString } from '@/features/habits/utils/habit-type.utils'
import { formatWeekRange } from '@/features/habits/utils/habit-date-format.utils'
import styles from './HabitWeekSelector.module.scss'

type HabitWeekSelectorProps = {
  weekStart: string
  onWeekChange: (weekStart: string) => void
}

/**
 * Selector de semana en píldora de vidrio: `‹ Esta semana ›`. Fuera de la
 * semana en curso el centro se vuelve un botón que devuelve a hoy.
 */
export function HabitWeekSelector({ weekStart, onWeekChange }: HabitWeekSelectorProps) {
  const currentWeekStart = getMondayOfWeek(getTodayString())
  const isCurrentWeek = weekStart === currentWeekStart
  const weekLabel = useMemo(() => formatWeekRange(weekStart), [weekStart])

  return (
    <div className={styles.root} role="group" aria-label="Semana en foco">
      <button
        type="button"
        className={styles.navBtn}
        onClick={() => onWeekChange(addDaysToString(weekStart, -7))}
        aria-label="Semana anterior"
      >
        <AppIcon name="arrow-left" size="xs" decorative />
      </button>

      {isCurrentWeek ? (
        <span className={styles.label}>Esta semana</span>
      ) : (
        <button
          type="button"
          className={[styles.label, styles.labelBtn].join(' ')}
          onClick={() => onWeekChange(currentWeekStart)}
          aria-label={`Semana del ${weekLabel}. Volver a esta semana`}
        >
          {weekLabel}
        </button>
      )}

      <button
        type="button"
        className={styles.navBtn}
        onClick={() => onWeekChange(addDaysToString(weekStart, 7))}
        aria-label="Semana siguiente"
      >
        <AppIcon name="arrow-right" size="xs" decorative />
      </button>
    </div>
  )
}
