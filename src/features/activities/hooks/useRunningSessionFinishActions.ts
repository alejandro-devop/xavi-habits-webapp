import {
  useStartActivityFollowUpMutation,
  useUpdateActivityFollowUpMutation,
} from '@/features/activities/hooks/useActivityFollowUps'
import type {
  FinishActivityFormValues,
  RunningActivitySession,
  StartActivityFormValues,
} from '@/features/activities/types/activity-followup.types'
import {
  finishOpenFollowUpToEditInput,
  startFormToFollowUpStartInput,
} from '@/features/activities/utils/activity-followup-form'
import { isToday } from '@/features/activities/utils/activity-time.utils'
import { useCurrentRoutineEventSuggestion } from '@/features/weekly-routine/hooks/useCurrentRoutineEventSuggestion'
import { useUpcomingRoutineEventSuggestion } from '@/features/weekly-routine/hooks/useUpcomingRoutineEventSuggestion'
import type { WeeklyRoutineActivity } from '@/features/weekly-routine/types/weekly-routine.types'
import { useCompleteTodoMutation } from '@/features/todos/hooks/useTodos'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'

type UseRunningSessionFinishActionsOptions = {
  session: RunningActivitySession | null
  sessionDate: string
  onFinished?: () => void
}

async function maybeCompleteLinkedTodo(
  confirm: ReturnType<typeof useConfirmDialog>['confirm'],
  completeTodo: ReturnType<typeof useCompleteTodoMutation>['mutate'],
  linkedTodo: NonNullable<RunningActivitySession['linkedTodo']>,
) {
  const confirmed = await confirm({
    title: '¿Completar la tarea?',
    description: `¿Marcar «${linkedTodo.title}» como completada? Las subtareas pueden quedar pendientes.`,
    confirmLabel: 'Completar tarea',
    cancelLabel: 'No',
  })

  if (confirmed) {
    completeTodo(linkedTodo.id)
  }
}

export function useRunningSessionFinishActions({
  session,
  sessionDate,
  onFinished,
}: UseRunningSessionFinishActionsOptions) {
  const { confirm } = useConfirmDialog()
  const updateMutation = useUpdateActivityFollowUpMutation()
  const startMutation = useStartActivityFollowUpMutation()
  const completeTodoMutation = useCompleteTodoMutation()

  const routineSuggestionRaw = useCurrentRoutineEventSuggestion(sessionDate)
  const routineUpcomingRaw = useUpcomingRoutineEventSuggestion(sessionDate)
  const showRoutineSuggestions = isToday(sessionDate)
  const routineSuggestion: WeeklyRoutineActivity | null = showRoutineSuggestions
    ? routineSuggestionRaw
    : null
  const routineUpcoming: WeeklyRoutineActivity | null = showRoutineSuggestions
    ? routineUpcomingRaw
    : null

  async function afterFinishSuccess(linkedTodo: RunningActivitySession['linkedTodo']) {
    onFinished?.()

    if (!linkedTodo) return
    await maybeCompleteLinkedTodo(confirm, completeTodoMutation.mutate, linkedTodo)
  }

  function handleFinishSave(values: FinishActivityFormValues) {
    if (!session) return
    const linkedTodo = session.linkedTodo ?? null

    updateMutation.mutate(finishOpenFollowUpToEditInput(session.followUpId, values), {
      onSuccess: () => {
        void afterFinishSuccess(linkedTodo)
      },
    })
  }

  function handleFinishAndContinue(
    finishValues: FinishActivityFormValues,
    nextStart: StartActivityFormValues,
  ) {
    if (!session) return
    const linkedTodo = session.linkedTodo ?? null

    updateMutation.mutate(finishOpenFollowUpToEditInput(session.followUpId, finishValues), {
      onSuccess: () => {
        void (async () => {
          await afterFinishSuccess(linkedTodo)
          startMutation.mutate(startFormToFollowUpStartInput(sessionDate, nextStart))
        })()
      },
    })
  }

  return {
    handleFinishSave,
    handleFinishAndContinue,
    routineSuggestion,
    routineUpcoming,
    isSaving: updateMutation.isPending,
  }
}
