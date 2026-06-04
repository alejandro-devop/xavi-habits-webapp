import { useState } from 'react'
import { useParams } from 'react-router'
import { useHabitWeekViewQuery } from '@/features/habits/hooks/useHabits'
import { HabitWeekNav } from '@/features/habits/components/HabitWeekNav'
import { HabitWeekGrid } from '@/features/habits/components/HabitWeekGrid'
import { HabitLifelinesIndicator } from '@/features/habits/components/HabitLifelinesIndicator'
import { Spinner } from '@/shared/ui/Spinner'
import { addDaysToString, getMondayOfWeek, getTodayString } from '@/features/habits/utils/habit-type.utils'
import styles from './HabitWeekViewPage.module.scss'

export function HabitWeekViewPage() {
  const { id } = useParams<{ id: string }>()
  const currentWeekStart = getMondayOfWeek(getTodayString())
  const [weekStart, setWeekStart] = useState(currentWeekStart)

  const { data, isLoading } = useHabitWeekViewQuery(id, weekStart)

  const disableNext = weekStart >= currentWeekStart

  function handlePrev() {
    setWeekStart((prev) => addDaysToString(prev, -7))
  }

  function handleNext() {
    setWeekStart((prev) => addDaysToString(prev, 7))
  }

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner />
      </div>
    )
  }

  if (!data) return null

  const { habit, days, lifelinesRemaining } = data
  const lifelinesUsed = habit.weeklyLifelines - lifelinesRemaining

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        {habit.icon && <span className={styles.icon}>{habit.icon}</span>}
        <h1 className={styles.title}>{habit.name}</h1>
      </header>

      <HabitWeekNav
        weekStart={weekStart}
        onPrev={handlePrev}
        onNext={handleNext}
        disableNext={disableNext}
      />

      <HabitLifelinesIndicator used={lifelinesUsed} total={habit.weeklyLifelines} />

      <HabitWeekGrid days={days} habit={habit} lifelinesRemaining={lifelinesRemaining} />
    </div>
  )
}
