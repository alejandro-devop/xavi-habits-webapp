import { useMemo, useState } from 'react'
import { useNavigate, useParams, type NavigateFunction } from 'react-router'
import {
  useDeleteHabitMutation,
  useHabitFollowUpsInDatesQuery,
  useHabitQuery,
  useHabitWeekViewQuery,
  useUpdateHabitMutation,
} from '@/features/habits/hooks/useHabits'
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
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import styles from './HabitDetailPage.module.scss'

function goBack(navigate: NavigateFunction) {
  if (window.history.length > 1) {
    navigate(-1)
  } else {
    navigate(habitsPaths.list)
  }
}

export function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const { data: habit, isLoading } = useHabitQuery(id)
  const restoreMutation = useUpdateHabitMutation()
  const deleteMutation = useDeleteHabitMutation()
  const [editOpen, setEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('week')

  const thisWeekStart = getMondayOfWeek(getTodayString())
  const [weekStart, setWeekStart] = useState(thisWeekStart)
  const { data: weekView } = useHabitWeekViewQuery(id, weekStart)

  async function handleRestore() {
    if (!habit) return
    const ok = await confirm({
      title: '¿Restaurar este hábito?',
      description: 'Volverá a aparecer en Mis Día y en la lista de hábitos activos.',
      confirmLabel: 'Restaurar',
      cancelLabel: 'Cancelar',
    })
    if (!ok) return
    restoreMutation.mutate({ id: habit.id, status: 'active' })
  }

  async function handleDelete() {
    if (!habit) return
    const ok = await confirm({
      title: '¿Eliminar permanentemente?',
      description:
        'Se borrarán el hábito y todo su historial. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!ok) return
    deleteMutation.mutate(habit.id, {
      onSuccess: () => navigate(habitsPaths.archived),
    })
  }

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
        <Button variant="ghost" onClick={() => goBack(navigate)}>
          Volver a la lista
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" size="sm" onClick={() => goBack(navigate)}>
            ← Volver
          </Button>
          <div className={styles.titleRow}>
            {habit.icon ? <AppIcon name={habit.icon} size="md" className={styles.icon} /> : null}
            <h1 className={styles.title}>{habit.name}</h1>
          </div>
          <div className={styles.badgesRow}>
            <HabitStatusBadge status={habit.status} />
            <HabitTypeBadge habitType={habit.habitType} />
          </div>
          {habit.description && (
            <p className={styles.description}>{habit.description}</p>
          )}
        </div>
        <div className={styles.headerActions}>
          {habit.status === 'archived' ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRestore}
                disabled={restoreMutation.isPending}
              >
                Restaurar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                Eliminar
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
          )}
        </div>
      </header>

      {habit.status === 'archived' && (
        <p className={styles.archivedBanner}>
          Este hábito está archivado y no aparece en Mis Día.
        </p>
      )}

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
