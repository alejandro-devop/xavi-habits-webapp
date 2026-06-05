import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as habitPurposesApi from '@/features/habits/api/habit-purposes.api'
import type { HabitPurposeEditInput, HabitPurposeInput } from '@/features/habits/types/habit-purpose.types'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { habitKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'
import { GraphQLClientError } from '@/shared/api/api-error'

function useHabitPurposeQueryGuard() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}

function getPurposeErrorMessage(error: unknown): string {
  if (error instanceof GraphQLClientError) return error.message
  if (error instanceof Error) return error.message
  return 'Ha ocurrido un error inesperado.'
}

export function useHabitPurposesQuery() {
  const enabled = useHabitPurposeQueryGuard()
  return useQuery({
    queryKey: habitKeys.purposes.list(),
    enabled,
    queryFn: () => habitPurposesApi.getHabitPurposes(),
    staleTime: 1000 * 60,
  })
}

export function useCreateHabitPurposeMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: HabitPurposeInput) => habitPurposesApi.createHabitPurpose(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.purposes.list() })
      toast.success('Propósito creado')
    },
    onError: (error) => {
      toast.error(getPurposeErrorMessage(error))
    },
  })
}

export function useUpdateHabitPurposeMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: HabitPurposeEditInput) => habitPurposesApi.updateHabitPurpose(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.purposes.list() })
      toast.success('Propósito actualizado')
    },
    onError: (error) => {
      toast.error(getPurposeErrorMessage(error))
    },
  })
}

export function useRemoveHabitPurposeMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => habitPurposesApi.removeHabitPurpose(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.purposes.list() })
      toast.success('Propósito eliminado')
    },
    onError: (error) => {
      toast.error(getPurposeErrorMessage(error))
    },
  })
}
