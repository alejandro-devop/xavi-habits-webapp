import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useHabitFollowUpsInDatesQuery, useHabitQuery, useHabitWeekViewQuery } from '@/features/habits/hooks/useHabits'
import { HabitStatsBanner } from '@/features/habits/components/HabitStatsBanner'
import { HabitStatusBadge } from '@/features/habits/components/HabitStatusBadge'
import { HabitTypeBadge } from '@/features/habits/components/HabitTypeBadge'
import { HabitWeekGrid } from '@/features/habits/components/HabitWeekGrid'
import { HabitWeekNav } from '@/features/habits/components/HabitWeekNav'
import { HabitContributionGrid } from '@/features/habits/components/HabitContributionGrid'
import { HabitFormModal } from '@/features/habits/components/HabitFormModal'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { addDaysToString, getMondayOfWeek, getTodayString } from '@/features/habits/utils/habit-type.utils'
import type { Habit, HabitFollowUp } from '@/features/habits/types/habit.types'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { Tabs } from '@/shared/ui/Tabs'
import styles from './HabitDetailPage.module.scss'

export function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: habit, isLoading } = useHabitQuery(id)
  const [editOpen, setEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('week')

  const thisWeekStart = getMondayOfWeek(getTodayString())
  const [weekStart, setWeekStart] = useState(thisWeekStart)
  const { data: weekView } = useHabitWeekViewQuery(id, weekStart)

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner />
      </div>
    )
  }

  if (!habit) {
    return (
      <div className={styles.center}>
        <p>Hábito no encontrado.</p>
        <Button variant="ghost" onClick={() => navigate(habitsPaths.list)}>
          Volver a la lista
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(habitsPaths.list)}
          >
            ← Volver
          </Button>
          <div className={styles.titleRow}>
            {habit.icon && <AppIcon name={habit.icon} size="md" className={styles.icon} />}
            <h1 className={styles.title}>{habit.name}</h1>
            <HabitStatusBadge status={habit.status} />
            <HabitTypeBadge habitType={habit.habitType} />
          </div>
          {habit.description && (
            <p className={styles.description}>{habit.description}</p>
          )}
        </div>
        <Button size="sm" onClick={() => setEditOpen(true)}>
          Editar
        </Button>
      </header>

      <HabitStatsBanner habit={habit} />

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="week">Esta semana</Tabs.Tab>
          <Tabs.Tab value="history">Historial completo</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="week">
          <div className={styles.weekPanel}>
            <HabitWeekNav
              weekStart={weekStart}
              onPrev={() => setWeekStart((w) => addDaysToString(w, -7))}
              onNext={() => setWeekStart((w) => addDaysToString(w, 7))}
              disableNext={weekStart >= thisWeekStart}
            />
            {weekView ? (
              <HabitWeekGrid
                days={weekView.days}
                habit={habit}
                lifelinesRemaining={weekView.lifelinesRemaining}
              />
            ) : (
              <div className={styles.center}>
                <Spinner />
              </div>
            )}
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="history">
          {habit.startDate ? (
            <div className={styles.historyPanel}>
              <HabitHistoryTab habit={habit} />
            </div>
          ) : (
            <p className={styles.noDate}>Este hábito no tiene fecha de inicio.</p>
          )}
        </Tabs.Panel>
      </Tabs>

      <HabitFormModal
        mode="edit"
        habit={habit}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  )
}

function HabitHistoryTab({ habit }: { habit: Habit }) {
  const endDate = habit.endDate ?? getTodayString()
  const { data: followUpsData, isLoading } = useHabitFollowUpsInDatesQuery(habit.startDate!, endDate)

  const followUpByDate = useMemo(() => {
    const map = new Map<string, HabitFollowUp>()
    if (!followUpsData) return map
    for (const group of followUpsData) {
      const fu = group.followUps.find((f) => f.habitId === habit.id)
      if (fu) map.set(group.date, fu as HabitFollowUp)
    }
    return map
  }, [followUpsData, habit.id])

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner />
      </div>
    )
  }

  return (
    <HabitContributionGrid
      startDate={habit.startDate!}
      endDate={endDate}
      followUpByDate={followUpByDate}
      habit={habit}
    />
  )
}
