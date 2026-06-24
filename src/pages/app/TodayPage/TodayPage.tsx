import { HabitsWidget } from '@/features/habits/components/HabitsWidget'
import { TodosWidget } from '@/features/todos/components/TodosWidget'
import { ActivitiesWidget } from '@/features/activities/components/ActivitiesWidget'
import { QuickActions } from '@/features/home/components/QuickActions'
import { RoutineTodayWidget } from '@/features/home/components/RoutineTodayWidget'
import styles from './TodayPage.module.scss'

function getTodayLabel(): string {
  const raw = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function TodayPage() {
  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Hoy</h1>
        <p className={styles.date}>{getTodayLabel()}</p>
      </header>

      <QuickActions />

      <div className={styles.bento}>
        <div className={styles.areaHabits}>
          <HabitsWidget />
        </div>
        <div className={styles.areaRoutine}>
          <RoutineTodayWidget />
        </div>
        <div className={styles.areaTodos}>
          <TodosWidget />
        </div>
        <div className={styles.areaActivities}>
          <ActivitiesWidget />
        </div>
      </div>
    </section>
  )
}
