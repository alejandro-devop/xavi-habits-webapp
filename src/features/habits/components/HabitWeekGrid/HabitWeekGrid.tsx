import { HabitDayCell } from '@/features/habits/components/HabitDayCell'
import type { Habit, HabitDayEntry } from '@/features/habits/types/habit.types'
import styles from './HabitWeekGrid.module.scss'

type Props = {
  days: HabitDayEntry[]
  habit: Habit
  lifelinesRemaining: number
}

export function HabitWeekGrid({ days, habit, lifelinesRemaining }: Props) {
  return (
    <div className={styles.grid}>
      {days.map((entry) => (
        <HabitDayCell
          key={entry.date}
          entry={entry}
          habit={habit}
          lifelinesRemaining={lifelinesRemaining}
        />
      ))}
    </div>
  )
}
