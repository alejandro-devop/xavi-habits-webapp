import type { SleepLogsFilters } from '@/features/sleep/types/sleep.types'

export function serializeSleepFilters(filters: SleepLogsFilters): Record<string, unknown> {
  return {
    startDate: filters.startDate ?? null,
    endDate: filters.endDate ?? null,
    quality: filters.quality ?? null,
    page: filters.page ?? null,
    limit: filters.limit ?? null,
  }
}
