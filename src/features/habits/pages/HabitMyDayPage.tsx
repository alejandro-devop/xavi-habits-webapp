import { useHabitMyDayQuery } from '@/features/habits/hooks/useHabits'
import { HabitDayCard } from '@/features/habits/components/HabitDayCard'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import styles from './HabitMyDayPage.module.scss'

export function HabitMyDayPage() {
  const today = new Date().toISOString().split('T')[0]
  const { data, isLoading } = useHabitMyDayQuery(today)

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Sin hábitos activos"
        description="Crea un hábito para empezar a registrar tu progreso diario."
      />
    )
  }

  const total = data.length
  const accomplished = data.filter((e) => e.followUp?.isAccomplished || e.followUp?.isLifeline).length
  const failed = data.filter((e) => e.followUp?.isFailed).length
  const pending = total - accomplished - failed

  const pctAccomplished = total > 0 ? (accomplished / total) * 100 : 0
  const pctFailed = total > 0 ? (failed / total) * 100 : 0
  const pctPending = total > 0 ? (pending / total) * 100 : 0

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <h1 className={styles.date}>{formatDate(today)}</h1>

        <div className={styles.summaryBar}>
          <div className={styles.barTrack}>
            <div className={styles.barAccomplished} style={{ width: `${pctAccomplished}%` }} />
            <div className={styles.barFailed} style={{ width: `${pctFailed}%` }} />
            <div className={styles.barPending} style={{ width: `${pctPending}%` }} />
          </div>
          <div className={styles.barLegend}>
            <span className={styles.legendAccomplished}>
              {accomplished} logrado{accomplished !== 1 ? 's' : ''}
            </span>
            <span className={styles.legendFailed}>
              {failed} fallado{failed !== 1 ? 's' : ''}
            </span>
            <span className={styles.legendPending}>
              {pending} pendiente{pending !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      <ul className={styles.list}>
        {data.map((entry) => (
          <li key={entry.habit.id}>
            <HabitDayCard entry={entry} date={today} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
