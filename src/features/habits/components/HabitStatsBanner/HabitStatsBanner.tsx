import type { Habit } from '@/features/habits/types/habit.types'
import { StatCard } from '@/shared/ui/StatCard'
import styles from './HabitStatsBanner.module.scss'

type Props = {
  habit: Habit
}

export function HabitStatsBanner({ habit }: Props) {
  const progress =
    habit.periodDays > 0 ? Math.round((habit.streak / habit.periodDays) * 100) : null

  return (
    <div className={styles.grid}>
      <StatCard label="Racha actual" value={`${habit.streak} días`} />
      <StatCard label="Racha máxima" value={`${habit.maxStreak} días`} />
      <StatCard label="Reinicios" value={String(habit.restartCount)} />
      {progress != null ? (
        <StatCard label="Progreso" value={`${progress}%`} />
      ) : (
        <StatCard label="Días totales" value={String(habit.days)} />
      )}
    </div>
  )
}
