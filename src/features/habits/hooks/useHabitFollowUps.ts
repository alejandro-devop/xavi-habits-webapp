import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as followUpsApi from '@/features/habits/api/habit-follow-ups.api'
import type {
  HabitFollowUpAddInput,
  HabitFollowUpEditInput,
} from '@/features/habits/types/habit.types'
import { habitKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

type FollowUpMutationContext = {
  habitId: string
  date?: string
  weekStart?: string
}

/** Invalida todo lo que depende del log (racha incluida en habitMyDay / detail / list). */
function invalidateAfterFollowUpChange(
  queryClient: ReturnType<typeof useQueryClient>,
  habitId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: [...habitKeys.all, 'myDay'],
    refetchType: 'all',
  })
  void queryClient.invalidateQueries({
    queryKey: habitKeys.detail(habitId),
    refetchType: 'all',
  })
  void queryClient.invalidateQueries({
    queryKey: [...habitKeys.all, 'list'],
    refetchType: 'all',
  })
  void queryClient.invalidateQueries({
    queryKey: [...habitKeys.all, 'weekView', habitId],
    refetchType: 'all',
  })
  void queryClient.invalidateQueries({
    queryKey: [...habitKeys.all, 'calendar'],
    refetchType: 'all',
  })
}

export function useAddHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: HabitFollowUpAddInput) => followUpsApi.addHabitFollowUp(input),
    onSuccess: (_data, variables) => {
      invalidateAfterFollowUpChange(queryClient, variables.habitId)
    },
    onError: () => {
      toast.error('Error al registrar el log')
    },
  })
}

export function useUpdateHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({
      input,
    }: {
      input: HabitFollowUpEditInput
      context: FollowUpMutationContext
    }) => followUpsApi.updateHabitFollowUp(input),
    onSuccess: (_data, { context }) => {
      invalidateAfterFollowUpChange(queryClient, context.habitId)
    },
    onError: () => {
      toast.error('Error al actualizar el log')
    },
  })
}

export function useRemoveHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id }: { id: string; context: FollowUpMutationContext }) =>
      followUpsApi.removeHabitFollowUp(id),
    onSuccess: (_data, { context }) => {
      invalidateAfterFollowUpChange(queryClient, context.habitId)
    },
    onError: () => {
      toast.error('Error al eliminar el log')
    },
  })
}
