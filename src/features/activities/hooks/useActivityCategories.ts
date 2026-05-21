import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as activityCategoriesApi from '@/features/activities/api/activity-categories.api'
import type {
  ActivityCategoryEditInput,
  ActivityCategoryInput,
} from '@/features/activities/types/activity-category.types'
import { getActivityCategoryErrorMessage } from '@/features/activities/utils/activity-category.errors'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { activityKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

export function useActivityCategoriesQuery() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  return useQuery({
    queryKey: activityKeys.categories.list(),
    enabled: isReady && isAuthenticated,
    queryFn: activityCategoriesApi.getActivityCategories,
    staleTime: 1000 * 30,
  })
}

export function useActivityCategoryQuery(id: string | undefined) {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  return useQuery({
    queryKey: activityKeys.categories.detail(id ?? ''),
    enabled: isReady && isAuthenticated && Boolean(id),
    queryFn: () => activityCategoriesApi.getActivityCategory(id!),
    staleTime: 1000 * 30,
  })
}

export function useCreateActivityCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: ActivityCategoryInput) => activityCategoriesApi.createActivityCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.categories.list() })
      toast.success('Categoría creada')
    },
    onError: (error) => {
      toast.error(getActivityCategoryErrorMessage(error))
    },
  })
}

export function useUpdateActivityCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: ActivityCategoryEditInput) =>
      activityCategoriesApi.updateActivityCategory(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.categories.list() })
      void queryClient.invalidateQueries({
        queryKey: activityKeys.categories.detail(variables.id),
      })
      toast.success('Categoría actualizada')
    },
    onError: (error) => {
      toast.error(getActivityCategoryErrorMessage(error))
    },
  })
}

export function useDeleteActivityCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => activityCategoriesApi.deleteActivityCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.categories.list() })
      toast.success('Categoría eliminada')
    },
    onError: (error) => {
      toast.error(getActivityCategoryErrorMessage(error))
    },
  })
}
