import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as activitiesApi from '@/features/activities/api/activities.api'
import type {
  ActivityEditInput,
  ActivityFilters,
  ActivityInput,
} from '@/features/activities/types/activity.types'
import { getActivityErrorMessage } from '@/features/activities/utils/activity.errors'
import { serializeActivityFilters } from '@/features/activities/utils/activity-filters'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { activityKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

export function useActivitiesQuery(filters: ActivityFilters) {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  return useQuery({
    queryKey: activityKeys.list(serializeActivityFilters(filters)),
    enabled: isReady && isAuthenticated,
    queryFn: () => activitiesApi.getActivities(filters),
    staleTime: 1000 * 30,
  })
}

export function useActivityQuery(id: string | undefined) {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  return useQuery({
    queryKey: activityKeys.detail(id ?? ''),
    enabled: isReady && isAuthenticated && Boolean(id),
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
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
      toast.success('Actividad creada')
    },
    onError: (error) => {
      toast.error(getActivityErrorMessage(error))
    },
  })
}

export function useUpdateActivityMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: ActivityEditInput) => activitiesApi.updateActivity(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
      void queryClient.invalidateQueries({ queryKey: activityKeys.detail(variables.id) })
      toast.success('Actividad actualizada')
    },
    onError: (error) => {
      toast.error(getActivityErrorMessage(error))
    },
  })
}

export function useDeleteActivityMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => activitiesApi.removeActivity(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
      toast.success('Actividad eliminada')
    },
    onError: (error) => {
      toast.error(getActivityErrorMessage(error))
    },
  })
}

export function useActivityPendingTodosQuery(activityId: string | null | undefined) {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  return useQuery({
    queryKey: activityKeys.pendingTodos(activityId ?? ''),
    enabled: isReady && isAuthenticated && Boolean(activityId),
    queryFn: () => activitiesApi.getActivityPendingTodos(activityId!),
    staleTime: 1000 * 15,
  })
}

export function useCompleteActivityMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => activitiesApi.completeActivity(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
      void queryClient.invalidateQueries({ queryKey: activityKeys.detail(id) })
      toast.success('Actividad completada')
    },
    onError: (error) => {
      toast.error(getActivityErrorMessage(error))
    },
  })
}
