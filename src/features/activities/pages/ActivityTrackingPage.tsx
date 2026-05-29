import { useMemo, useState } from 'react'
import { ActivityDayTimeline } from '@/features/activities/components/ActivityDayTimeline'
import { ActivityWeekSelector } from '@/features/activities/components/ActivityWeekSelector'
import { DayRemainingWidget } from '@/features/activities/components/DayRemainingWidget'
import { CategoryTimeWidget } from '@/features/activities/components/CategoryTimeWidget'
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
  useActivityOpenFollowUpQuery,
  useCreateActivityFollowUpMutation,
  useDeleteActivityFollowUpMutation,
  useStartActivityFollowUpMutation,
  useUpdateActivityFollowUpMutation,
} from '@/features/activities/hooks/useActivityFollowUps'
import { useActivitiesQuery } from '@/features/activities/hooks/useActivities'
import { useCompleteTodoMutation } from '@/features/todos/hooks/useTodos'
import type { RunningActivitySessionLinkedTodo } from '@/features/activities/types/activity-followup.types'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import type {
  ActivityFollowUpInput,
  FinishActivityFormValues,
  StartActivityFormValues,
} from '@/features/activities/types/activity-followup.types'
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import {
  finishFormFromSession,
  finishOpenFollowUpToEditInput,
  openFollowUpToRunningSession,
  startFormToFollowUpStartInput,
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
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Tabs } from '@/shared/ui/Tabs'
import styles from './ActivityTrackingPage.module.scss'

const TRACKING_VIEW = {
  timeline: 'timeline',
  summary: 'summary',
} as const

type TrackingView = (typeof TRACKING_VIEW)[keyof typeof TRACKING_VIEW]

export function ActivityTrackingPage() {
  const today = getCurrentLocalDate()
  const [selectedDate, setSelectedDate] = useState(today)
  const weekRange = getCurrentWeekRange()

  const { data: openFollowUp } = useActivityOpenFollowUpQuery()
  const session = useMemo(
    () => (openFollowUp ? openFollowUpToRunningSession(openFollowUp) : null),
    [openFollowUp],
  )

  const [startModalOpen, setStartModalOpen] = useState(false)
  const [startInitialStartTime, setStartInitialStartTime] = useState<string | null>(null)
  const [logPastModalOpen, setLogPastModalOpen] = useState(false)
  const [logPastInitialStartTime, setLogPastInitialStartTime] = useState<string | null>(null)
  const [finishModalOpen, setFinishModalOpen] = useState(false)
  const [finishFormValues, setFinishFormValues] = useState<FinishActivityFormValues | null>(null)
  const [editFollowUp, setEditFollowUp] = useState<ActivityFollowUp | null>(null)
  const [freeSlotModal, setFreeSlotModal] = useState<TimelineFreeSlot | null>(null)
  const [activeView, setActiveView] = useState<TrackingView>(TRACKING_VIEW.timeline)

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

  const startMutation = useStartActivityFollowUpMutation()
  const createMutation = useCreateActivityFollowUpMutation()
  const updateMutation = useUpdateActivityFollowUpMutation()
  const deleteMutation = useDeleteActivityFollowUpMutation()
  const completeTodoMutation = useCompleteTodoMutation()

  const handleSelectDay = (date: string) => {
    if (isFutureDate(date)) return
    setSelectedDate(date)
  }

  const handleStart = (
    values: StartActivityFormValues,
    linkedTodo?: RunningActivitySessionLinkedTodo,
  ) => {
    startMutation.mutate(startFormToFollowUpStartInput(selectedDate, values, linkedTodo), {
      onSuccess: () => {
        setStartModalOpen(false)
        setStartInitialStartTime(null)
      },
    })
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
    if (!session) return
    if (!confirmed) return

    deleteMutation.mutate({
      id: session.followUpId,
      date: openFollowUp?.date ?? selectedDate,
      activityId: session.activityId,
      wasOpen: true,
    })
  }

  const handleOpenFinish = () => {
    if (!session) return
    setFinishFormValues(finishFormFromSession(session, selectedDate))
    setFinishModalOpen(true)
  }

  const handleFinishSave = (values: FinishActivityFormValues) => {
    if (!session) return
    const linkedTodo = session.linkedTodo ?? null

    updateMutation.mutate(finishOpenFollowUpToEditInput(session.followUpId, values), {
      onSuccess: async () => {
        setFinishModalOpen(false)

        if (!linkedTodo) return

        const confirmed = await confirm({
          title: '¿Completar la tarea?',
          description: `¿Marcar «${linkedTodo.title}» como completada? Las subtareas pueden quedar pendientes.`,
          confirmLabel: 'Completar tarea',
          cancelLabel: 'No',
        })

        if (confirmed) {
          completeTodoMutation.mutate(linkedTodo.id)
        }
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
          loading={startMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
        />
      ) : null}

      <Tabs
        value={activeView}
        onChange={(value) => setActiveView(value as TrackingView)}
        className={styles.views}
      >
        <Tabs.List>
          <Tabs.Tab value={TRACKING_VIEW.timeline}>Registro</Tabs.Tab>
          <Tabs.Tab value={TRACKING_VIEW.summary}>Resumen</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={TRACKING_VIEW.timeline}>
          <div className={styles.timelinePanel}>
            <DayRemainingWidget className={styles.timelineClock} />
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
                No hay registros este día. Inicia una actividad o registra tiempo pasado con los
                botones de arriba.
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
          </div>
        </Tabs.Panel>

        <Tabs.Panel value={TRACKING_VIEW.summary}>
          <div className={styles.summaryPanel}>
            <p className={styles.summaryHint}>
              Métricas del día seleccionado · {selectedDate}
            </p>
            <div className={styles.widgetsRow}>
            <DayUsageWidget
                className={styles.widgetUsage}
                date={selectedDate}
                followUps={followUps}
                freeSlots={freeSlots}
                isLoading={isLoading}
              />
              <CategoryTimeWidget
                className={styles.widgetCategory}
                date={selectedDate}
                followUps={followUps}
                isLoading={isLoading}
              />

            </div>
          </div>
        </Tabs.Panel>
      </Tabs>

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
          loading={updateMutation.isPending}
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
