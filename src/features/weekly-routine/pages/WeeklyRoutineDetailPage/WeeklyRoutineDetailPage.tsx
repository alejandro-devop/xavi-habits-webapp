import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { RoutineEventModal } from '@/features/weekly-routine/components/RoutineEventModal/RoutineEventModal'
import { WeeklyPlanner } from '@/features/weekly-routine/components/WeeklyPlanner/WeeklyPlanner'
import {
  useAddWeeklyRoutineActivitiesBatchMutation,
  useAddWeeklyRoutineActivityMutation,
  useRemoveWeeklyRoutineActivityMutation,
  useUpdateWeeklyRoutineActivityMutation,
  useWeeklyRoutineQuery,
} from '@/features/weekly-routine/hooks/useWeeklyRoutine'
import { weeklyRoutinePaths } from '@/features/weekly-routine/routes/weekly-routine-paths'
import type {
  DayOfWeek,
  WeeklyRoutineActivity,
} from '@/features/weekly-routine/types/weekly-routine.types'
import type { RoutineEventFormValues } from '@/features/weekly-routine/components/RoutineEventModal/RoutineEventModal'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import styles from './WeeklyRoutineDetailPage.module.scss'

export function WeeklyRoutineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()

  const { data: routine, isLoading } = useWeeklyRoutineQuery(id)

  const addActivity = useAddWeeklyRoutineActivityMutation()
  const addActivitiesBatch = useAddWeeklyRoutineActivitiesBatchMutation()
  const updateActivity = useUpdateWeeklyRoutineActivityMutation()
  const removeActivity = useRemoveWeeklyRoutineActivityMutation()

  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<WeeklyRoutineActivity | null>(null)
  const [slotDay, setSlotDay] = useState<DayOfWeek | undefined>()
  const [slotTime, setSlotTime] = useState<string | undefined>()

  function handleSlotClick(day: DayOfWeek, time: string) {
    setEditingEvent(null)
    setSlotDay(day)
    setSlotTime(time)
    setEventModalOpen(true)
  }

  function handleEventClick(event: WeeklyRoutineActivity) {
    setEditingEvent(event)
    setSlotDay(undefined)
    setSlotTime(undefined)
    setEventModalOpen(true)
  }

  function handleEventSubmit(values: RoutineEventFormValues) {
    if (!routine) return
    if (editingEvent) {
      updateActivity.mutate(
        {
          id: editingEvent.id,
          dayOfWeek: values.days[0],
          startTime: values.startTime,
          durationMinutes: values.durationMinutes,
          notes: values.notes || null,
        },
        { onSuccess: () => setEventModalOpen(false) },
      )
    } else if (values.days.length > 1) {
      addActivitiesBatch.mutate(
        {
          routineId: routine.id,
          activityId: values.activityId!,
          days: values.days,
          startTime: values.startTime,
          durationMinutes: values.durationMinutes,
          notes: values.notes || null,
        },
        { onSuccess: () => setEventModalOpen(false) },
      )
    } else {
      addActivity.mutate(
        {
          routineId: routine.id,
          activityId: values.activityId!,
          dayOfWeek: values.days[0],
          startTime: values.startTime,
          durationMinutes: values.durationMinutes,
          notes: values.notes || null,
        },
        { onSuccess: () => setEventModalOpen(false) },
      )
    }
  }

  async function handleDeleteEvent() {
    if (!editingEvent) return
    const ok = await confirm({
      title: 'Eliminar evento',
      description: '¿Eliminar este evento de la rutina?',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (ok) {
      setEventModalOpen(false)
      removeActivity.mutate(editingEvent.id)
    }
  }

  return (
    <div className={`${styles.page} fullWidthPage`}>
      <PageHeader
        title={isLoading ? '' : (routine?.name ?? 'Rutina')}
        subtitle={
          routine
            ? `${routine.isActive ? 'Activa · ' : ''}${routine.dayStartTime}–${routine.dayEndTime}`
            : undefined
        }
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(weeklyRoutinePaths.root)}
            aria-label="Volver a rutinas"
          >
            <AppIcon name="arrow-left" size="sm" />
            Rutinas
          </Button>
        }
      />

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <Skeleton height={400} />
          </div>
        ) : routine ? (
          <WeeklyPlanner
            routine={routine}
            onSlotClick={handleSlotClick}
            onEventClick={handleEventClick}
          />
        ) : (
          <div className={styles.notFound}>
            <AppIcon name="calendar-week" size="xl" className={styles.notFoundIcon} />
            <p>Rutina no encontrada.</p>
            <Button variant="ghost" onClick={() => navigate(weeklyRoutinePaths.root)}>
              Volver
            </Button>
          </div>
        )}
      </div>

      {routine && (
        <RoutineEventModal
          open={eventModalOpen}
          routine={routine}
          initialDay={slotDay}
          initialTime={slotTime}
          editing={editingEvent}
          onClose={() => setEventModalOpen(false)}
          onSubmit={handleEventSubmit}
          onDelete={editingEvent ? handleDeleteEvent : undefined}
          submitting={addActivity.isPending || addActivitiesBatch.isPending || updateActivity.isPending}
          deleting={removeActivity.isPending}
        />
      )}
    </div>
  )
}
