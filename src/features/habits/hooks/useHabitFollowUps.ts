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

export function useAddHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: HabitFollowUpAddInput) => followUpsApi.addHabitFollowUp(input),
    onSuccess: (_data, variables) => {
      const date = variables.date ?? new Date().toISOString().split('T')[0]
      void queryClient.invalidateQueries({ queryKey: habitKeys.myDay(date), refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: habitKeys.detail(variables.habitId), refetchType: 'all' })
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'weekView', variables.habitId],
        refetchType: 'all',
      })
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
      const date = context.date ?? new Date().toISOString().split('T')[0]
      void queryClient.invalidateQueries({ queryKey: habitKeys.myDay(date), refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: habitKeys.detail(context.habitId), refetchType: 'all' })
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'weekView', context.habitId],
        refetchType: 'all',
      })
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
      const date = context.date ?? new Date().toISOString().split('T')[0]
      void queryClient.invalidateQueries({ queryKey: habitKeys.myDay(date), refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: habitKeys.detail(context.habitId), refetchType: 'all' })
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'weekView', context.habitId],
        refetchType: 'all',
      })
    },
    onError: () => {
      toast.error('Error al eliminar el log')
    },
  })
}
