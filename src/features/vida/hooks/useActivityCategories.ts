import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as activityCategoriesApi from '@/features/vida/api/activity-categories.api'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import type {
  ActivityCategoryEditInput,
  ActivityCategoryInput,
} from '@/features/vida/types/activity-category.types'
import { invalidateActivityCategoryQueries } from '@/features/vida/utils/invalidate-vida-queries'
import { vidaKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

export function useActivityCategoriesQuery() {
  const enabled = useVidaQueryGuard()
  return useQuery({
    queryKey: vidaKeys.categories.list(),
    enabled,
    queryFn: activityCategoriesApi.getActivityCategories,
    staleTime: 1000 * 60 * 5,
  })
}

export function useActivityCategoryQuery(id: string | undefined) {
  const enabled = useVidaQueryGuard()
  return useQuery({
    queryKey: vidaKeys.categories.detail(id ?? ''),
    enabled: enabled && Boolean(id),
    queryFn: () => activityCategoriesApi.getActivityCategory(id!),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateActivityCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityCategoryInput) =>
      activityCategoriesApi.createActivityCategory(input),
    onSuccess: () => {
      invalidateActivityCategoryQueries(queryClient)
      toast.success('Categoría creada')
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
      invalidateActivityCategoryQueries(queryClient, { id: variables.id })
      toast.success('Categoría actualizada')
    },
  })
}

export function useDeleteActivityCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => activityCategoriesApi.deleteActivityCategory(id),
    onSuccess: () => {
      invalidateActivityCategoryQueries(queryClient)
      toast.success('Categoría eliminada')
    },
  })
}
