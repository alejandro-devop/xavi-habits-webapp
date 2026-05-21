import type { Activity, ActivityFilters } from '@/features/activities/types/activity.types'

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  page: 1,
  limit: 50,
  status: null,
  priority: null,
  categoryId: null,
  search: '',
}

export function serializeActivityFilters(filters: ActivityFilters): Record<string, unknown> {
  return {
    status: filters.status ?? null,
    priority: filters.priority ?? null,
    categoryId: filters.categoryId ?? null,
    startDate: filters.startDate ?? null,
    endDate: filters.endDate ?? null,
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
  }
}

export function toGraphQLActivityVariables(filters: ActivityFilters) {
  return {
    status: filters.status ?? undefined,
    priority: filters.priority ?? undefined,
    categoryId: filters.categoryId ?? undefined,
    startDate: filters.startDate ?? undefined,
    endDate: filters.endDate ?? undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
  }
}

export function filterActivitiesBySearch(activities: Activity[], search: string): Activity[] {
  const q = search.trim().toLowerCase()
  if (!q) return activities
  return activities.filter((a) => {
    const haystack = [a.title, a.description ?? '', a.category?.name ?? '']
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}
