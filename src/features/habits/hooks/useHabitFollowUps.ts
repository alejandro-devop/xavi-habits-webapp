import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as followUpsApi from '@/features/habits/api/habit-follow-ups.api'
import type {
  HabitFollowUpAddInput,
  HabitFollowUpEditInput,
} from '@/features/habits/types/habit.types'
import { habitKeys } from '@/shared/api/query-keys'

type FollowUpMutationContext = {
  habitId: string
  date?: string
  weekStart?: string
}

export function useAddHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: HabitFollowUpAddInput) => followUpsApi.addHabitFollowUp(input),
    onSuccess: (_data, variables) => {
      const date = variables.date ?? new Date().toISOString().split('T')[0]
      void queryClient.invalidateQueries({ queryKey: habitKeys.myDay(date) })
      void queryClient.invalidateQueries({ queryKey: habitKeys.detail(variables.habitId) })
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'weekView', variables.habitId],
      })
    },
  })
}

export function useUpdateHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
    }: {
      input: HabitFollowUpEditInput
      context: FollowUpMutationContext
    }) => followUpsApi.updateHabitFollowUp(input),
    onSuccess: (_data, { context }) => {
      const date = context.date ?? new Date().toISOString().split('T')[0]
      void queryClient.invalidateQueries({ queryKey: habitKeys.myDay(date) })
      void queryClient.invalidateQueries({ queryKey: habitKeys.detail(context.habitId) })
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'weekView', context.habitId],
      })
    },
  })
}

export function useRemoveHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; context: FollowUpMutationContext }) =>
      followUpsApi.removeHabitFollowUp(id),
    onSuccess: (_data, { context }) => {
      const date = context.date ?? new Date().toISOString().split('T')[0]
      void queryClient.invalidateQueries({ queryKey: habitKeys.myDay(date) })
      void queryClient.invalidateQueries({ queryKey: habitKeys.detail(context.habitId) })
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'weekView', context.habitId],
      })
    },
  })
}
