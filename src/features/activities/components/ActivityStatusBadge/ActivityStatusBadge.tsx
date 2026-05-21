import type { ActivityStatus } from '@/features/activities/types/activity.types'
import { getActivityStatusLabel } from '@/features/activities/utils/activity-enums'
import { Badge, type BadgeVariant } from '@/shared/ui/Badge'
import styles from './ActivityStatusBadge.module.scss'

const STATUS_VARIANT: Record<ActivityStatus, BadgeVariant> = {
  pending: 'neutral',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'danger',
}

type ActivityStatusBadgeProps = {
  status: ActivityStatus
  className?: string
}

export function ActivityStatusBadge({ status, className }: ActivityStatusBadgeProps) {
  return (
    <Badge
      variant={STATUS_VARIANT[status]}
      className={[styles.badge, className].filter(Boolean).join(' ')}
    >
      {getActivityStatusLabel(status)}
    </Badge>
  )
}
