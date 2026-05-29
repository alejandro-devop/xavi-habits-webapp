import { useState } from 'react'
import { useNavigate } from 'react-router'
import { RoutineFormModal } from '@/features/weekly-routine/components/RoutineFormModal/RoutineFormModal'
import { RoutineList } from '@/features/weekly-routine/components/RoutineList/RoutineList'
import {
  useCreateWeeklyRoutineMutation,
  useRemoveWeeklyRoutineMutation,
  useSetActiveWeeklyRoutineMutation,
  useUpdateWeeklyRoutineMutation,
  useWeeklyRoutinesQuery,
} from '@/features/weekly-routine/hooks/useWeeklyRoutine'
import { weeklyRoutinePaths } from '@/features/weekly-routine/routes/weekly-routine-paths'
import type {
  WeeklyRoutine,
  WeeklyRoutineEditInput,
  WeeklyRoutineInput,
} from '@/features/weekly-routine/types/weekly-routine.types'
import { Button } from '@/shared/ui/Button'
import { AppIcon } from '@/shared/ui/AppIcon'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import { PaperSurface } from '@/shared/ui/PaperSurface'
import styles from './WeeklyRoutinePage.module.scss'

export function WeeklyRoutinePage() {
  const navigate = useNavigate()

  const { data: routinesData, isLoading } = useWeeklyRoutinesQuery()
  const routines = routinesData?.routines ?? []

  const createRoutine = useCreateWeeklyRoutineMutation()
  const updateRoutine = useUpdateWeeklyRoutineMutation()
  const removeRoutine = useRemoveWeeklyRoutineMutation()
  const setActive = useSetActiveWeeklyRoutineMutation()

  const [routineFormOpen, setRoutineFormOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<WeeklyRoutine | null>(null)

  function openCreate() {
    setEditingRoutine(null)
    setRoutineFormOpen(true)
  }

  function openEdit(routine: WeeklyRoutine) {
    setEditingRoutine(routine)
    setRoutineFormOpen(true)
  }

  function handleSubmit(values: WeeklyRoutineInput | WeeklyRoutineEditInput) {
    if ('id' in values) {
      updateRoutine.mutate(values as WeeklyRoutineEditInput, {
        onSuccess: () => setRoutineFormOpen(false),
      })
    } else {
      createRoutine.mutate(values, {
        onSuccess: () => setRoutineFormOpen(false),
      })
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Rutinas semanales"
        subtitle="Gestiona tus plantillas de semana"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <AppIcon name="plus" size="sm" />
            Nueva rutina
          </Button>
        }
      />

      <div className={styles.content}>
        <PaperSurface withMargin={false} minHeight="300px">
          {isLoading ? (
            <div className={styles.loading}>
              <Skeleton height={80} />
              <Skeleton height={80} />
            </div>
          ) : (
            <RoutineList
              routines={routines}
              onAdd={openCreate}
              onEdit={openEdit}
              onDelete={(id) => removeRoutine.mutate(id)}
              onSetActive={(id) => setActive.mutate(id)}
              onOpen={(id) => navigate(weeklyRoutinePaths.detail(id))}
            />
          )}
        </PaperSurface>
      </div>

      <RoutineFormModal
        open={routineFormOpen}
        editing={editingRoutine}
        onClose={() => setRoutineFormOpen(false)}
        onSubmit={handleSubmit}
        submitting={createRoutine.isPending || updateRoutine.isPending}
      />
    </div>
  )
}
