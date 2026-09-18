import type { Habit } from '@/features/habits/types/habit.types'
import type { RangeSummary } from '@/features/habits/utils/habit-panel.utils'
import { formatShortDate } from '@/features/habits/utils/habit-panel.utils'
import { StatCard } from '@/shared/ui/StatCard'
import styles from './HabitPanel.module.scss'

type Props = {
  habit: Habit
  summary: RangeSummary
  previous: RangeSummary | null
  comebacks: { total: number; lastDaysAgo: number | null }
  rangeLabel: string
}

function days(count: number): string {
  return count === 1 ? '1 día' : `${count} días`
}

function comebackHelper(comebacks: Props['comebacks']): string {
  if (comebacks.total === 0) return 'Todavía no has tenido que volver'
  if (comebacks.lastDaysAgo === null) return 'En este rango'
  if (comebacks.lastDaysAgo === 0) return 'La última, hoy'
  return `La última, hace ${days(comebacks.lastDaysAgo)}`
}

/**
 * La fila de fichas. Sustituye a la vieja banda de estadísticas de la pantalla
 * de detalle: los mismos números más el movimiento frente al periodo anterior.
 */
export function HabitPanelTiles({ habit, summary, previous, comebacks, rangeLabel }: Props) {
  const deltaPoints = previous ? summary.percent - previous.percent : null

  return (
    <div className={styles.tiles}>
      <StatCard
        label="Racha actual"
        value={days(habit.streak)}
        helperText={`Tu récord son ${days(habit.maxStreak)}`}
      />
      <StatCard
        label={`Cumplimiento ${rangeLabel}`}
        value={`${summary.percent}%`}
        helperText={`${summary.covered} de ${days(summary.total)}`}
        delta={
          deltaPoints === null
            ? undefined
            : {
                value: `${deltaPoints >= 0 ? '▲' : '▼'} ${Math.abs(deltaPoints)} pts vs. periodo anterior`,
                positive: deltaPoints >= 0,
              }
        }
      />
      <StatCard
        label="Días totales"
        value={String(habit.days)}
        helperText={habit.startDate ? `Desde el ${formatShortDate(habit.startDate)}` : undefined}
      />
      <StatCard
        label="Veces que volviste"
        value={String(comebacks.total)}
        helperText={comebackHelper(comebacks)}
      />
    </div>
  )
}
