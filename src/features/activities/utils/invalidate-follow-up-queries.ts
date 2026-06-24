import type { QueryClient } from '@tanstack/react-query'
import { activityKeys } from '@/shared/api/query-keys'
import { getCurrentWeekRange } from '@/features/activities/utils/activity-time.utils'

type InvalidateFollowUpOptions = {
  date: string
  activityId?: string
  weekRange?: { from: string; to: string }
}

export function toFollowUpDateKey(value: string): string {
  return value.slice(0, 10)
}

export function invalidateActivityFollowUpQueries(
  queryClient: QueryClient,
  options: InvalidateFollowUpOptions,
) {
  const date = toFollowUpDateKey(options.date)
  const week = options.weekRange ?? getCurrentWeekRange()

  void queryClient.invalidateQueries({
    queryKey: activityKeys.followUps.day(date),
  })
  void queryClient.invalidateQueries({
    queryKey: activityKeys.followUps.range(week.from, week.to),
  })

  if (options.activityId) {
    void queryClient.invalidateQueries({
      queryKey: activityKeys.detail(options.activityId),
    })
  }
}
