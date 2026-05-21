import type { ActivityPriority, ActivityStatus } from '@/features/activities/types/activity.types'

export const ACTIVITY_STATUSES: ActivityStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]

export const ACTIVITY_PRIORITIES: ActivityPriority[] = ['low', 'medium', 'high', 'urgent']

const STATUS_LABELS: Record<ActivityStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const PRIORITY_LABELS: Record<ActivityPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

export function getActivityStatusLabel(status: ActivityStatus): string {
  return STATUS_LABELS[status]
}

export function getActivityPriorityLabel(priority: ActivityPriority): string {
  return PRIORITY_LABELS[priority]
}

export const activityStatusOptions = ACTIVITY_STATUSES.map((value) => ({
  value,
  label: getActivityStatusLabel(value),
}))

export const activityPriorityOptions = ACTIVITY_PRIORITIES.map((value) => ({
  value,
  label: getActivityPriorityLabel(value),
}))
