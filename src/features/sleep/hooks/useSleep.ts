import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as sleepApi from '@/features/sleep/api/sleep.api'
import type { SleepLogEditInput, SleepLogInput, SleepLogsFilters } from '@/features/sleep/types/sleep.types'
import { serializeSleepFilters } from '@/features/sleep/utils/sleep-filters'
import { activityKeys, sleepKeys } from '@/shared/api/query-keys'

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sleepKeys.all })
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
  })
}

export function useUpdateSleepLogMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SleepLogEditInput) => sleepApi.updateSleepLog(input),
    onSuccess: (data) => {
      queryClient.setQueryData(sleepKeys.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: sleepKeys.list() })
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
  })
}

export function useRemoveSleepLogMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sleepApi.removeSleepLog(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sleepKeys.all })
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
  })
}
