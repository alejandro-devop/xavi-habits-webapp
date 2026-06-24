import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as sleepApi from '@/features/sleep/api/sleep.api'
import { invalidateActivityFollowUpQueries, toFollowUpDateKey } from '@/features/activities/utils/invalidate-follow-up-queries'
import type { SleepLogEditInput, SleepLogInput, SleepLogsFilters, SleepStatsFilters } from '@/features/sleep/types/sleep.types'
import { serializeSleepFilters } from '@/features/sleep/utils/sleep-filters'
import { sleepKeys } from '@/shared/api/query-keys'

export function useSleepStatsQuery(filters: SleepStatsFilters = {}) {
  return useQuery({
    queryKey: sleepKeys.stats(filters as Record<string, unknown>),
    queryFn: () => sleepApi.getSleepStats(filters),
    staleTime: 1000 * 60,
  })
}

export function useSleepLogsQuery(filters: SleepLogsFilters = {}) {
  return useQuery({
    queryKey: sleepKeys.list(serializeSleepFilters(filters)),
    queryFn: () => sleepApi.getSleepLogs(filters),
    staleTime: 1000 * 60,
  })
}

export function useSleepLogQuery(id: string) {
  return useQuery({
    queryKey: sleepKeys.detail(id),
    queryFn: () => sleepApi.getSleepLog(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  })
}

export function useCreateSleepLogMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SleepLogInput) => sleepApi.createSleepLog(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: sleepKeys.all })
      invalidateActivityFollowUpQueries(queryClient, {
        date: toFollowUpDateKey(data.sleepDate),
      })
    },
  })
}

type UpdateSleepLogPayload = SleepLogEditInput & {
  previousSleepDate?: string
}

export function useUpdateSleepLogMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ previousSleepDate: _previousSleepDate, ...input }: UpdateSleepLogPayload) =>
      sleepApi.updateSleepLog(input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(sleepKeys.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: sleepKeys.list() })
      invalidateActivityFollowUpQueries(queryClient, {
        date: toFollowUpDateKey(data.sleepDate),
      })
      if (variables.previousSleepDate) {
        invalidateActivityFollowUpQueries(queryClient, {
          date: toFollowUpDateKey(variables.previousSleepDate),
        })
      }
    },
  })
}

type RemoveSleepLogPayload = {
  id: string
  sleepDate: string
}

export function useRemoveSleepLogMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: RemoveSleepLogPayload) => sleepApi.removeSleepLog(id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: sleepKeys.all })
      invalidateActivityFollowUpQueries(queryClient, {
        date: toFollowUpDateKey(variables.sleepDate),
      })
    },
  })
}
