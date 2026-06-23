import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as followUpsApi from '@/features/habits/api/habit-follow-ups.api'
import type {
  HabitFollowUp,
  HabitFollowUpAddInput,
  HabitFollowUpEditInput,
  HabitMyDayEntry,
} from '@/features/habits/types/habit.types'
import { habitKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

type FollowUpMutationContext = {
  habitId: string
  date?: string
  weekStart?: string
}

function patchMyDayCache(
  queryClient: ReturnType<typeof useQueryClient>,
  date: string,
  habitId: string,
  followUp: HabitFollowUp,
) {
  queryClient.setQueryData<HabitMyDayEntry[]>(habitKeys.myDay(date), (old) => {
    if (!old) return old
    return old.map((entry) =>
      entry.habit.id === habitId ? { ...entry, followUp } : entry,
    )
  })
}

export function useAddHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: HabitFollowUpAddInput) => followUpsApi.addHabitFollowUp(input),
    onSuccess: (data, variables) => {
      const date = variables.date ?? new Date().toISOString().split('T')[0]
      // Actualización inmediata del cache para reflejar el cambio en la UI sin esperar el refetch
      patchMyDayCache(queryClient, date, variables.habitId, data)
      void queryClient.invalidateQueries({ queryKey: habitKeys.myDay(date), refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: habitKeys.detail(variables.habitId), refetchType: 'all' })
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'weekView', variables.habitId],
        refetchType: 'all',
      })
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'calendar'],
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
    onSuccess: (data, { context }) => {
      const date = context.date ?? new Date().toISOString().split('T')[0]
      // Actualización inmediata del cache
      patchMyDayCache(queryClient, date, context.habitId, data)
      void queryClient.invalidateQueries({ queryKey: habitKeys.myDay(date), refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: habitKeys.detail(context.habitId), refetchType: 'all' })
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'weekView', context.habitId],
        refetchType: 'all',
      })
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'calendar'],
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
      void queryClient.invalidateQueries({
        queryKey: [...habitKeys.all, 'calendar'],
        refetchType: 'all',
      })
    },
    onError: () => {
      toast.error('Error al eliminar el log')
    },
  })
}
