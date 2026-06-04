import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as habitCategoriesApi from '@/features/habits/api/habit-categories.api'
import type {
  HabitCategoryEditInput,
  HabitCategoryInput,
} from '@/features/habits/types/habit-category.types'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { habitKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'
import { GraphQLClientError } from '@/shared/api/api-error'

export { useHabitCategoriesQuery } from '@/features/habits/hooks/useHabits'

function getHabitCategoryErrorMessage(error: unknown): string {
  if (error instanceof GraphQLClientError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Ha ocurrido un error inesperado.'
}

export function useCreateHabitCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: HabitCategoryInput) => habitCategoriesApi.createHabitCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.categories.list() })
      toast.success('Categoría creada')
    },
    onError: (error) => {
      toast.error(getHabitCategoryErrorMessage(error))
    },
  })
}

export function useUpdateHabitCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: HabitCategoryEditInput) => habitCategoriesApi.updateHabitCategory(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.categories.list() })
      void queryClient.invalidateQueries({ queryKey: habitKeys.categories.detail(variables.id) })
      toast.success('Categoría actualizada')
    },
    onError: (error) => {
      toast.error(getHabitCategoryErrorMessage(error))
    },
  })
}

export function useRemoveHabitCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => habitCategoriesApi.removeHabitCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.categories.list() })
      toast.success('Categoría eliminada')
    },
    onError: (error) => {
      toast.error(getHabitCategoryErrorMessage(error))
    },
  })
}

export function useHabitCategoryQueryGuard() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}
