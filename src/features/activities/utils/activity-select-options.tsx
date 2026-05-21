import type { Activity } from '@/features/activities/types/activity.types'
import type { ActivityCategory } from '@/features/activities/types/activity-category.types'
import { AppIcon } from '@/shared/ui/AppIcon'
import type { SearchSelectOption } from '@/shared/ui/SearchSelect'

export function activitiesToSelectOptions(activities: Activity[]): SearchSelectOption[] {
  return activities.map((activity) => ({
    value: activity.id,
    label: activity.title,
    description: activity.category?.name ?? undefined,
    icon: (
      <span
        style={{ color: activity.category?.color ?? 'var(--color-text)', display: 'inline-flex' }}
        aria-hidden
      >
        <AppIcon name={activity.category?.icon ?? 'list-check'} size="sm" decorative />
      </span>
    ),
  }))
}

export function categoriesToSelectOptions(categories: ActivityCategory[]): SearchSelectOption[] {
  return categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
    icon: (
      <span
        style={{ color: cat.color ?? 'var(--color-text)', display: 'inline-flex' }}
        aria-hidden
      >
        <AppIcon name={cat.icon ?? 'list-check'} size="sm" decorative />
      </span>
    ),
  }))
}
