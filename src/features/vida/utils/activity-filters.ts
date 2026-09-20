import type { Activity, ActivityFilters } from '@/features/vida/types/activity.types'
import { normalizeVidaText } from '@/features/vida/utils/vida-text.utils'

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

/**
 * Busca **por nombre y nada más**, sin distinguir mayúsculas ni tildes: «banar»
 * encuentra «Bañarme». Antes miraba también la descripción y el nombre de la
 * categoría, y eso sorprendía —escribir «casa» devolvía actividades que no se
 * llaman así—; el catálogo ya agrupa por categoría, que es donde se busca por
 * categoría.
 */
export function filterActivitiesBySearch(activities: Activity[], search: string): Activity[] {
  const needle = normalizeVidaText(search)
  if (!needle) return activities
  return activities.filter((activity) => normalizeVidaText(activity.title).includes(needle))
}
