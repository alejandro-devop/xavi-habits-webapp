import { useMemo } from 'react'
import { useParams } from 'react-router'
import { HabitMonthView } from '@/features/habits/components/HabitMonthView'
import { useHabitFollowUpsInDatesQuery, useHabitQuery } from '@/features/habits/hooks/useHabits'
import type { HabitFollowUp } from '@/features/habits/types/habit.types'
import { getTodayString } from '@/features/habits/utils/habit-type.utils'
import styles from './HabitCalendarPage.module.scss'

export function HabitCalendarPage() {
  const { id } = useParams<{ id: string }>()
  const { data: habit, isLoading: habitLoading } = useHabitQuery(id)

  const today = getTodayString()
  const startDate = habit?.startDate ?? null
  const rangeEnd = habit?.endDate && habit.endDate < today ? habit.endDate : today

  const { data: dateGroups, isLoading: followUpsLoading } = useHabitFollowUpsInDatesQuery(
    startDate ?? today,
    rangeEnd,
  )

  const followUpByDate = useMemo<Map<string, HabitFollowUp>>(() => {
    const map = new Map<string, HabitFollowUp>()
    if (!dateGroups || !id) return map
    for (const group of dateGroups) {
      const fu = group.followUps.find((f) => f.habitId === id)
      if (fu) map.set(group.date, fu as HabitFollowUp)
    }
    return map
  }, [dateGroups, id])

  if (habitLoading || followUpsLoading) {
    return (
      <div className={styles.center}>
        <span>Cargando…</span>
      </div>
    )
  }

  if (!habit) {
    return (
      <div className={styles.center}>
        <span>Hábito no encontrado.</span>
      </div>
    )
  }

  if (!startDate) {
    return (
      <div className={styles.center}>
        <span>Este hábito no tiene fecha de inicio.</span>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{habit.name}</h2>
      <HabitMonthView habit={habit} followUpByDate={followUpByDate} today={today} />
    </div>
  )
}
