import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as habitMeasuresApi from '@/features/habits/api/habit-measures.api'
import type {
  HabitMeasureEditInput,
  HabitMeasureInput,
} from '@/features/habits/types/habit-measure.types'
import { habitKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'
import { GraphQLClientError } from '@/shared/api/api-error'

export { useHabitMeasuresQuery } from '@/features/habits/hooks/useHabits'

function getHabitMeasureErrorMessage(error: unknown): string {
  if (error instanceof GraphQLClientError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Ha ocurrido un error inesperado.'
}

export function useCreateHabitMeasureMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: HabitMeasureInput) => habitMeasuresApi.createHabitMeasure(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.measures.list() })
      toast.success('Medida creada')
    },
    onError: (error) => {
      toast.error(getHabitMeasureErrorMessage(error))
    },
  })
}

export function useUpdateHabitMeasureMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: HabitMeasureEditInput) => habitMeasuresApi.updateHabitMeasure(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.measures.list() })
      void queryClient.invalidateQueries({ queryKey: habitKeys.measures.detail(variables.id) })
      toast.success('Medida actualizada')
    },
    onError: (error) => {
      toast.error(getHabitMeasureErrorMessage(error))
    },
  })
}

export function useRemoveHabitMeasureMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => habitMeasuresApi.removeHabitMeasure(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.measures.list() })
      void queryClient.invalidateQueries({ queryKey: habitKeys.all, refetchType: 'all' })
      toast.success('Medida eliminada')
    },
    onError: (error) => {
      toast.error(getHabitMeasureErrorMessage(error))
    },
  })
}
