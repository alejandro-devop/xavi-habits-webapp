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

  return (
    <div className={styles.root}>
      <p className={styles.date}>{formatDate(today)}</p>
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
