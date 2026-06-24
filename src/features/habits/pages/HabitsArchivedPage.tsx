import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { useHabitsQuery } from '@/features/habits/hooks/useHabits'
import { ArchivedHabitCard } from '@/features/habits/components/ArchivedHabitCard'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import styles from './HabitsArchivedPage.module.scss'

export function HabitsArchivedPage() {
  const { data, isLoading } = useHabitsQuery({ status: 'archived' })
  const habits = data?.habits ?? []

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Hábitos archivados</h1>
          <p className={styles.subtitle}>
            Hábitos ocultos de las vistas activas. Puedes restaurarlos o eliminarlos permanentemente.
          </p>
        </div>
        <Button variant="ghost" to={habitsPaths.list}>
          ← Activos
        </Button>
      </header>

      {habits.length === 0 ? (
        <EmptyState
          title="Sin hábitos archivados"
          description="Los hábitos que archives aparecerán aquí."
          action={
            <Button variant="ghost" to={habitsPaths.list}>
              Ver hábitos activos
            </Button>
          }
        />
      ) : (
        <ul className={styles.list}>
          {habits.map((habit) => (
            <li key={habit.id}>
              <ArchivedHabitCard habit={habit} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
