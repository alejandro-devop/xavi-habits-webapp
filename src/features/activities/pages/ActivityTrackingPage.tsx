import { useMemo, useState } from 'react'
import { ActivityDayTimeline } from '@/features/activities/components/ActivityDayTimeline'
import { ActivityTrackingEmptyState } from '@/features/activities/components/ActivityTrackingEmptyState'
import { ActivityWeekSelector } from '@/features/activities/components/ActivityWeekSelector'
import { EditFollowUpModal } from '@/features/activities/components/EditFollowUpModal'
import { FinishActivityModal } from '@/features/activities/components/FinishActivityModal'
import { RunningActivityTimer } from '@/features/activities/components/RunningActivityTimer'
import { LogPastActivityModal } from '@/features/activities/components/LogPastActivityModal'
import { StartActivityModal } from '@/features/activities/components/StartActivityModal'
import {
  useActivityDayFollowUpsQuery,
  useActivityFollowUpsInDatesQuery,
  useCreateActivityFollowUpMutation,
  useDeleteActivityFollowUpMutation,
  useUpdateActivityFollowUpMutation,
} from '@/features/activities/hooks/useActivityFollowUps'
import { useActivitiesQuery } from '@/features/activities/hooks/useActivities'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import type {
  ActivityFollowUpInput,
  FinishActivityFormValues,
  StartActivityFormValues,
} from '@/features/activities/types/activity-followup.types'
import {
  activityToRunningSession,
  finishFormFromSession,
  startFormToStartedAtIso,
} from '@/features/activities/utils/activity-followup-form'
import {
  getCurrentLocalDate,
  getCurrentWeekRange,
  getWeekDaysForDate,
  isFutureDate,
} from '@/features/activities/utils/activity-time.utils'
import {
  selectRunningSession,
  useActivityTrackingStore,
} from '@/features/activities/store/activity-tracking.store'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './ActivityTrackingPage.module.scss'

export function ActivityTrackingPage() {
  const today = getCurrentLocalDate()
  const [selectedDate, setSelectedDate] = useState(today)
  const weekRange = getCurrentWeekRange()

  const session = useActivityTrackingStore(selectRunningSession)
  const startSession = useActivityTrackingStore((s) => s.startSession)
  const clearSession = useActivityTrackingStore((s) => s.clearSession)

  const [startModalOpen, setStartModalOpen] = useState(false)
  const [logPastModalOpen, setLogPastModalOpen] = useState(false)
  const [finishModalOpen, setFinishModalOpen] = useState(false)
  const [finishFormValues, setFinishFormValues] = useState<FinishActivityFormValues | null>(null)
  const [editFollowUp, setEditFollowUp] = useState<ActivityFollowUp | null>(null)

  const { confirm } = useConfirmDialog()

  const weekDays = useMemo(
    () => getWeekDaysForDate(new Date(), selectedDate),
    [selectedDate],
  )

  const { data: followUps = [], isLoading, isError, error, refetch } =
    useActivityDayFollowUpsQuery(selectedDate)

  useActivityFollowUpsInDatesQuery(weekRange.from, weekRange.to)

  const { data: activitiesData } = useActivitiesQuery({ limit: 100, page: 1 })
  const activities = activitiesData?.activities ?? []

  const createMutation = useCreateActivityFollowUpMutation()
  const updateMutation = useUpdateActivityFollowUpMutation()
  const deleteMutation = useDeleteActivityFollowUpMutation()

  const handleSelectDay = (date: string) => {
    if (isFutureDate(date)) return
    setSelectedDate(date)
  }

  const handleStart = (values: StartActivityFormValues) => {
    const activity = activities.find((a) => a.id === values.activityId)
    if (!activity) return

    startSession(
      activityToRunningSession(
        activity,
        values.notes,
        startFormToStartedAtIso(selectedDate, values),
      ),
    )
    setStartModalOpen(false)
  }

  const handleLogPastSave = (input: ActivityFollowUpInput) => {
    createMutation.mutate(input, {
      onSuccess: () => setLogPastModalOpen(false),
    })
  }

  const handleOpenStart = () => {
    if (session) return
    setStartModalOpen(true)
  }

  const handleCancelSession = async () => {
    const confirmed = await confirm({
      title: 'Cancelar actividad en curso',
      description: 'No se guardará ningún registro de tiempo.',
      confirmLabel: 'Cancelar actividad',
      variant: 'danger',
    })
    if (confirmed) clearSession()
  }

  const handleOpenFinish = () => {
    if (!session) return
    setFinishFormValues(finishFormFromSession(session, selectedDate))
    setFinishModalOpen(true)
  }

  const handleFinishSave = (input: ActivityFollowUpInput) => {
    createMutation.mutate(input, {
      onSuccess: () => {
        clearSession()
        setFinishModalOpen(false)
      },
    })
  }

  const handleDeleteFollowUp = async (followUp: ActivityFollowUp) => {
    const confirmed = await confirm({
      title: 'Eliminar registro',
      description: '¿Eliminar este bloque de tiempo? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    deleteMutation.mutate(
      { id: followUp.id, date: followUp.date, activityId: followUp.activityId },
      { onSuccess: () => setEditFollowUp(null) },
    )
  }

  const hasFollowUps = followUps.length > 0
  const showEmpty = !isLoading && !isError && !hasFollowUps

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Seguimiento de tiempo</h2>
          <p className={styles.subtitle}>Semana actual · timeline diaria</p>
        </div>
      </header>

      <ActivityWeekSelector days={weekDays} onSelect={handleSelectDay} />

      {session ? (
        <RunningActivityTimer
          session={session}
          onFinish={handleOpenFinish}
          onCancel={handleCancelSession}
          loading={createMutation.isPending}
        />
      ) : null}

      <div className={styles.toolbar}>
        <Button
          variant="primary"
          onClick={handleOpenStart}
          disabled={Boolean(session)}
          aria-label="Iniciar nueva actividad"
        >
          <AppIcon name="plus" size="sm" decorative />
          Iniciar nueva actividad
        </Button>
        <Button
          variant="secondary"
          onClick={() => setLogPastModalOpen(true)}
          disabled={Boolean(session)}
          aria-label="Registrar tiempo pasado"
        >
          <AppIcon name="clock" size="sm" decorative />
          Registrar tiempo pasado
        </Button>
      </div>

      {isError ? (
        <Alert variant="danger" title="No se pudo cargar la timeline">
          {error instanceof Error ? error.message : 'Error desconocido'}
          <Button variant="ghost" onClick={() => refetch()}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className={styles.skeleton}>
          <Skeleton height="3rem" />
          <Skeleton height="12rem" />
          <Skeleton height="12rem" />
        </div>
      ) : null}

      {showEmpty ? (
        <ActivityTrackingEmptyState
          onStart={handleOpenStart}
          onLogPast={() => setLogPastModalOpen(true)}
          hasRunningSession={Boolean(session)}
        />
      ) : null}

      {!isLoading && !isError && hasFollowUps ? (
        <ActivityDayTimeline followUps={followUps} onFollowUpClick={setEditFollowUp} />
      ) : null}

      <StartActivityModal
        open={startModalOpen}
        sessionDate={selectedDate}
        activities={activities}
        onClose={() => setStartModalOpen(false)}
        onStart={handleStart}
      />

      <LogPastActivityModal
        open={logPastModalOpen}
        defaultDate={selectedDate}
        activities={activities}
        loading={createMutation.isPending}
        onClose={() => setLogPastModalOpen(false)}
        onSave={handleLogPastSave}
      />

      {session && finishFormValues ? (
        <FinishActivityModal
          open={finishModalOpen}
          initialValues={finishFormValues}
          activities={activities}
          loading={createMutation.isPending}
          onClose={() => setFinishModalOpen(false)}
          onSave={handleFinishSave}
        />
      ) : null}

      <EditFollowUpModal
        open={Boolean(editFollowUp)}
        followUp={editFollowUp}
        saving={updateMutation.isPending}
        deleting={deleteMutation.isPending}
        onClose={() => setEditFollowUp(null)}
        onSave={(input) => {
          updateMutation.mutate(input, { onSuccess: () => setEditFollowUp(null) })
        }}
        onDelete={handleDeleteFollowUp}
      />
    </div>
  )
}
