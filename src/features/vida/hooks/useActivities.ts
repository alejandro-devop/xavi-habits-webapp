import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as activitiesApi from '@/features/vida/api/activities.api'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import type {
  ActivityEditInput,
  ActivityFilters,
  ActivityInput,
} from '@/features/vida/types/activity.types'
import { serializeActivityFilters } from '@/features/vida/utils/activity-filters'
import { invalidateActivityQueries } from '@/features/vida/utils/invalidate-vida-queries'
import { vidaKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

/**
 * `onError` con toast en las mutaciones que estrena F1. Lo dejaron anotado los
 * tres revisores de F0: sin él, una mutación que falla no dice nada y el
 * usuario cree que guardó. Va en el hook y no en cada pantalla para que la
 * siguiente no se lo olvide.
 */
function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

export function useActivitiesQuery(filters: ActivityFilters = {}) {
  const enabled = useVidaQueryGuard()
  return useQuery({
    queryKey: vidaKeys.activities.list(serializeActivityFilters(filters)),
    enabled,
    queryFn: () => activitiesApi.getActivities(filters),
    staleTime: 1000 * 30,
  })
}

export function useActivityQuery(id: string | undefined) {
  const enabled = useVidaQueryGuard()
  return useQuery({
    queryKey: vidaKeys.activities.detail(id ?? ''),
    enabled: enabled && Boolean(id),
    queryFn: () => activitiesApi.getActivity(id!),
    staleTime: 1000 * 30,
  })
}

export function useCreateActivityMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityInput) => activitiesApi.createActivity(input),
    onSuccess: () => {
      invalidateActivityQueries(queryClient)
      toast.success('Actividad creada')
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos crear la actividad'))
    },
  })
}

export function useUpdateActivityMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityEditInput) => activitiesApi.updateActivity(input),
    onSuccess: (_data, variables) => {
      invalidateActivityQueries(queryClient, { id: variables.id })
      toast.success('Actividad actualizada')
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos guardar los cambios'))
    },
  })
}

export function useDeleteActivityMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => activitiesApi.removeActivity(id),
    onSuccess: () => {
      invalidateActivityQueries(queryClient)
      toast.success('Actividad eliminada')
    },
  })
}

export function useCompleteActivityMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => activitiesApi.completeActivity(id),
    onSuccess: (_data, id) => {
      invalidateActivityQueries(queryClient, { id })
      toast.success('Actividad completada')
    },
  })
}
