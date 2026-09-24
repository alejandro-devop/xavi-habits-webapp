import type { Habit } from '@/features/habits/types/habit.types'
import type { AverageDifficulty, RangeSummary } from '@/features/habits/utils/habit-panel.utils'
import { formatAmount, formatShortDate } from '@/features/habits/utils/habit-panel.utils'
import { StatCard } from '@/shared/ui/StatCard'
import styles from './HabitPanel.module.scss'

type Props = {
  habit: Habit
  summary: RangeSummary
  previous: RangeSummary | null
  comebacks: { total: number; lastDaysAgo: number | null }
  /** `30 d` · `90 d` · `del año` — el rótulo corto, el de «Cumplimiento 90 d». */
  rangeLabel: string
  /** Lo que va detrás de «en»: `los últimos 90 días` · `el último año`. */
  rangeScopeLabel: string
  /** `null` cuando no hay ni un día con dificultad anotada: la ficha no sale. */
  avgDifficulty: AverageDifficulty | null
}

/** La escala real del código es 0–4, no 1–5. Manda `habit-difficulty.utils`. */
const MAX_DIFFICULTY = 4

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
 *
 * Dos reglas de este panel, y las dos son de lo que se calla:
 * - «Tu récord» es `habit.maxStreak`, el de **toda la vida del hábito**, y no
 *   dice cuándo ocurrió porque ese dato no existe en el cliente. Si la racha
 *   que llevas **es** el récord, se dice una vez y se dice que es la misma.
 * - El cero de «Salvavidas usados» **sí** se imprime —cero salvavidas es una
 *   noticia buena y cierta—; el de dificultad **no**, porque ahí un cero
 *   significaría «no lo sé».
 */
export function HabitPanelTiles({
  habit,
  summary,
  previous,
  comebacks,
  rangeLabel,
  rangeScopeLabel,
  avgDifficulty,
}: Props) {
  const deltaPoints = previous ? summary.percent - previous.percent : null
  const recordIsCurrentStreak = habit.maxStreak > 0 && habit.streak === habit.maxStreak

  return (
    <div className={styles.tiles}>
      <StatCard label="Racha actual" value={days(habit.streak)} />
      <StatCard
        label="Tu récord"
        value={days(habit.maxStreak)}
        helperText={recordIsCurrentStreak ? 'Es la racha que llevas ahora' : undefined}
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
      <StatCard
        label="Salvavidas usados"
        value={String(summary.lifelines)}
        helperText={`En ${rangeScopeLabel}`}
      />
      {avgDifficulty ? (
        <StatCard
          label="Dificultad media"
          value={`${formatAmount(avgDifficulty.average)} de ${MAX_DIFFICULTY}`}
          helperText={`Media de ${days(avgDifficulty.daysWithDifficulty)} con dificultad`}
        />
      ) : null}
    </div>
  )
}
