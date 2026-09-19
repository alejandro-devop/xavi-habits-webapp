import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as followUpsApi from '@/features/vida/api/activity-followups.api'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import type {
  ActivityFollowUpEditInput,
  ActivityFollowUpInput,
  ActivityFollowUpStartInput,
} from '@/features/vida/types/activity-followup.types'
import { isFutureDate } from '@/features/vida/utils/vida-date.utils'
import { invalidateFollowUpQueries } from '@/features/vida/utils/invalidate-vida-queries'
import { vidaKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

export function useActivityOpenFollowUpQuery() {
  const enabled = useVidaQueryGuard()
  return useQuery({
    queryKey: vidaKeys.followUps.open(),
    enabled,
    queryFn: () => followUpsApi.getActivityOpenFollowUp(),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  })
}

export function useActivityDayFollowUpsQuery(date: string) {
  const guard = useVidaQueryGuard()
  const enabled = guard && Boolean(date) && !isFutureDate(date)
  return useQuery({
    queryKey: vidaKeys.followUps.day(date),
    enabled,
    queryFn: () => followUpsApi.getActivityDayFollowUps(date),
    staleTime: 1000 * 30,
  })
}

export function useActivityFollowUpsInDatesQuery(from: string, to: string) {
  const guard = useVidaQueryGuard()
  const enabled = guard && Boolean(from) && Boolean(to)
  return useQuery({
    queryKey: vidaKeys.followUps.range(from, to),
    enabled,
    queryFn: () => followUpsApi.getActivityFollowUpsInDates(from, to),
    staleTime: 1000 * 60,
  })
}

export function useStartActivityFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityFollowUpStartInput) => followUpsApi.startActivityFollowUp(input),
    onSuccess: (data) => {
      queryClient.setQueryData(vidaKeys.followUps.open(), data)
      invalidateFollowUpQueries(queryClient, { date: data.date, activityId: data.activityId })
      toast.success('Actividad iniciada')
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
  })
}

export function useUpdateActivityFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityFollowUpEditInput) => followUpsApi.updateActivityFollowUp(input),
    onSuccess: (data) => {
      if (!data.isOpen) {
        queryClient.setQueryData(vidaKeys.followUps.open(), null)
      }
      invalidateFollowUpQueries(queryClient, { date: data.date, activityId: data.activityId })
      toast.success(data.isOpen ? 'Registro actualizado' : 'Tiempo registrado')
    },
  })
}

export function useDeleteActivityFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (payload: { id: string; date: string; activityId: string; wasOpen?: boolean }) =>
      followUpsApi.deleteActivityFollowUp(payload.id),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(vidaKeys.followUps.open(), (current: unknown) => {
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
      invalidateFollowUpQueries(queryClient, {
        date: variables.date,
        activityId: variables.activityId,
      })
      toast.success(variables.wasOpen ? 'Actividad cancelada' : 'Registro eliminado')
    },
  })
}
