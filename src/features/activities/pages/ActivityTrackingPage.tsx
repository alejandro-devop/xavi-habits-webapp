import { useMemo, useState } from 'react'
import { ActivityDayTimeline } from '@/features/activities/components/ActivityDayTimeline'
import { ActivityWeekSelector } from '@/features/activities/components/ActivityWeekSelector'
import { DayRemainingWidget } from '@/features/activities/components/DayRemainingWidget'
import { DayUsageWidget } from '@/features/activities/components/DayUsageWidget'
import { CreateFollowUpFromFreeSlotModal } from '@/features/activities/components/CreateFollowUpFromFreeSlotModal'
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
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import {
  activityToRunningSession,
  finishFormFromSession,
  startFormToStartedAtIso,
} from '@/features/activities/utils/activity-followup-form'
import {
  getCurrentLocalDate,
  getCurrentWeekRange,
  getFollowUpEndTimeForNextEntry,
  getFreeSlotsBetweenFollowUps,
  getWeekDaysForDate,
  isFutureDate,
  isToday,
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
  const [startInitialStartTime, setStartInitialStartTime] = useState<string | null>(null)
  const [logPastModalOpen, setLogPastModalOpen] = useState(false)
  const [logPastInitialStartTime, setLogPastInitialStartTime] = useState<string | null>(null)
  const [finishModalOpen, setFinishModalOpen] = useState(false)
  const [finishFormValues, setFinishFormValues] = useState<FinishActivityFormValues | null>(null)
  const [editFollowUp, setEditFollowUp] = useState<ActivityFollowUp | null>(null)
  const [freeSlotModal, setFreeSlotModal] = useState<TimelineFreeSlot | null>(null)

  const { confirm } = useConfirmDialog()

  const weekDays = useMemo(
    () => getWeekDaysForDate(new Date(), selectedDate),
    [selectedDate],
  )

  const { data: followUps = [], isLoading, isError, error, refetch } =
    useActivityDayFollowUpsQuery(selectedDate)

  const freeSlots = useMemo(
    () => getFreeSlotsBetweenFollowUps(selectedDate, followUps),
    [selectedDate, followUps],
  )

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
    setStartInitialStartTime(null)
  }

  const handleLogPastSave = (input: ActivityFollowUpInput) => {
    createMutation.mutate(input, {
      onSuccess: () => {
        setLogPastModalOpen(false)
        setLogPastInitialStartTime(null)
      },
    })
  }

  const handleOpenLogPast = () => {
    if (session) return
    setLogPastInitialStartTime(null)
    setLogPastModalOpen(true)
  }

  const handleContinueAfterFollowUp = (followUp: ActivityFollowUp) => {
    if (session) return
    setLogPastInitialStartTime(getFollowUpEndTimeForNextEntry(followUp, selectedDate))
    setLogPastModalOpen(true)
  }

  const handleOpenStart = () => {
    if (session) return
    setStartInitialStartTime(null)
    setStartModalOpen(true)
  }

  const handleStartFromFollowUp = (followUp: ActivityFollowUp) => {
    if (session) return
    setStartInitialStartTime(getFollowUpEndTimeForNextEntry(followUp, selectedDate))
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
  const showDayHint = !isLoading && !isError && !hasFollowUps && !session

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Seguimiento de tiempo</h2>
          <p className={styles.subtitle}>Semana actual · más reciente arriba</p>
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

      <div className={styles.widgetsRow}>
        <DayRemainingWidget className={styles.widgetRemaining} />
        <DayUsageWidget
          className={styles.widgetUsage}
          date={selectedDate}
          followUps={followUps}
          freeSlots={freeSlots}
          isLoading={isLoading}
        />
      </div>

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
          onClick={handleOpenLogPast}
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

      {showDayHint ? (
        <p className={styles.dayHint}>
          No hay registros este día. Inicia una actividad o registra tiempo pasado con los botones de arriba.
        </p>
      ) : null}

      {!isLoading && !isError ? (
        <ActivityDayTimeline
          date={selectedDate}
          followUps={followUps}
          freeSlots={freeSlots}
          showCurrentTimeMarker={isToday(selectedDate)}
          quickActionsDisabled={Boolean(session)}
          onFollowUpClick={setEditFollowUp}
          onFreeSlotClick={setFreeSlotModal}
          onContinueAfterFollowUp={handleContinueAfterFollowUp}
          onStartFromFollowUp={handleStartFromFollowUp}
        />
      ) : null}

      <StartActivityModal
        open={startModalOpen}
        sessionDate={selectedDate}
        initialStartTime={startInitialStartTime}
        activities={activities}
        onClose={() => {
          setStartModalOpen(false)
          setStartInitialStartTime(null)
        }}
        onStart={handleStart}
      />

      <LogPastActivityModal
        open={logPastModalOpen}
        defaultDate={selectedDate}
        initialStartTime={logPastInitialStartTime}
        activities={activities}
        loading={createMutation.isPending}
        onClose={() => {
          setLogPastModalOpen(false)
          setLogPastInitialStartTime(null)
        }}
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

      <CreateFollowUpFromFreeSlotModal
        open={Boolean(freeSlotModal)}
        slot={freeSlotModal}
        activities={activities}
        loading={createMutation.isPending}
        onClose={() => setFreeSlotModal(null)}
        onSave={(input) => {
          createMutation.mutate(input, { onSuccess: () => setFreeSlotModal(null) })
        }}
      />

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
