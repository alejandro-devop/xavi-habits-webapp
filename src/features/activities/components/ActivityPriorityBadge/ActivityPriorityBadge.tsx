import type { ActivityPriority } from '@/features/activities/types/activity.types'
import { getActivityPriorityLabel } from '@/features/activities/utils/activity-enums'
import { Badge, type BadgeVariant } from '@/shared/ui/Badge'
import styles from './ActivityPriorityBadge.module.scss'

const PRIORITY_VARIANT: Record<ActivityPriority, BadgeVariant> = {
  low: 'neutral',
  medium: 'primary',
  high: 'warning',
  urgent: 'danger',
}

type ActivityPriorityBadgeProps = {
  priority: ActivityPriority
  className?: string
}

export function ActivityPriorityBadge({ priority, className }: ActivityPriorityBadgeProps) {
  return (
    <Badge
      variant={PRIORITY_VARIANT[priority]}
      className={[styles.badge, className].filter(Boolean).join(' ')}
    >
      {getActivityPriorityLabel(priority)}
    </Badge>
  )
}
