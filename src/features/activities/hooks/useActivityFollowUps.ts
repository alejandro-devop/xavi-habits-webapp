import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as followUpsApi from '@/features/activities/api/activity-followups.api'
import type {
  ActivityFollowUpEditInput,
  ActivityFollowUpInput,
  ActivityFollowUpStartInput,
} from '@/features/activities/types/activity-followup.types'
import { getActivityFollowUpErrorMessage } from '@/features/activities/utils/activity-followup.errors'
import { getCurrentWeekRange, isFutureDate } from '@/features/activities/utils/activity-time.utils'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { activityKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

type InvalidateFollowUpOptions = {
  date: string
  activityId?: string
  weekRange?: { from: string; to: string }
}

function invalidateFollowUpQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  options: InvalidateFollowUpOptions,
) {
  const week = options.weekRange ?? getCurrentWeekRange()

  void queryClient.invalidateQueries({
    queryKey: activityKeys.followUps.day(options.date),
  })
  void queryClient.invalidateQueries({
    queryKey: activityKeys.followUps.range(week.from, week.to),
  })

  if (options.activityId) {
    void queryClient.invalidateQueries({
      queryKey: activityKeys.detail(options.activityId),
    })
  }

  void queryClient.invalidateQueries({ queryKey: activityKeys.all })
  void queryClient.invalidateQueries({ queryKey: activityKeys.followUps.open() })
}

function invalidateOpenFollowUp(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: activityKeys.followUps.open() })
}

export function useActivityOpenFollowUpQuery() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  return useQuery({
    queryKey: activityKeys.followUps.open(),
    queryFn: () => followUpsApi.getActivityOpenFollowUp(),
    enabled: isReady && isAuthenticated,
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  })
}

export function useActivityDayFollowUpsQuery(date: string) {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const enabled = isReady && isAuthenticated && Boolean(date) && !isFutureDate(date)

  return useQuery({
    queryKey: activityKeys.followUps.day(date),
    queryFn: () => followUpsApi.getActivityDayFollowUps(date),
    enabled,
    staleTime: 1000 * 30,
  })
}

export function useActivityFollowUpsInDatesQuery(from: string, to: string) {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  return useQuery({
    queryKey: activityKeys.followUps.range(from, to),
    queryFn: () => followUpsApi.getActivityFollowUpsInDates(from, to),
    enabled: isReady && isAuthenticated && Boolean(from) && Boolean(to),
    staleTime: 1000 * 60,
  })
}

export function useStartActivityFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: ActivityFollowUpStartInput) => followUpsApi.startActivityFollowUp(input),
    onSuccess: (data) => {
      queryClient.setQueryData(activityKeys.followUps.open(), data)
      invalidateFollowUpQueries(queryClient, {
        date: data.date,
        activityId: data.activityId,
      })
      toast.success('Actividad iniciada')
    },
    onError: (error) => {
      toast.error(getActivityFollowUpErrorMessage(error))
    },
  })
}

export function useCreateActivityFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: ActivityFollowUpInput) => followUpsApi.createActivityFollowUp(input),
    onSuccess: (_data, variables) => {
      invalidateFollowUpQueries(queryClient, {
        date: variables.date,
        activityId: variables.activityId,
      })
      toast.success('Tiempo registrado')
    },
    onError: (error) => {
      toast.error(getActivityFollowUpErrorMessage(error))
    },
  })
}

export function useUpdateActivityFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: ActivityFollowUpEditInput) => followUpsApi.updateActivityFollowUp(input),
    onSuccess: (data) => {
      if (!data.isOpen) {
        queryClient.setQueryData(activityKeys.followUps.open(), null)
      }
      invalidateFollowUpQueries(queryClient, {
        date: data.date,
        activityId: data.activityId,
      })
      toast.success(data.isOpen ? 'Registro actualizado' : 'Tiempo registrado')
    },
    onError: (error) => {
      toast.error(getActivityFollowUpErrorMessage(error))
    },
  })
}

export function useDeleteActivityFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (payload: {
      id: string
      date: string
      activityId: string
      wasOpen?: boolean
    }) => followUpsApi.deleteActivityFollowUp(payload.id),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(activityKeys.followUps.open(), (current: unknown) => {
        if (
          current &&
          typeof current === 'object' &&
          'id' in current &&
          (current as { id: string }).id === variables.id
        ) {
          return null
        }
        return current
      })
      invalidateOpenFollowUp(queryClient)
      invalidateFollowUpQueries(queryClient, {
        date: variables.date,
        activityId: variables.activityId,
      })
      toast.success(variables.wasOpen ? 'Actividad cancelada' : 'Registro eliminado')
    },
    onError: (error) => {
      toast.error(getActivityFollowUpErrorMessage(error))
    },
  })
}
