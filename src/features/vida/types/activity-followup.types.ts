import type { ActivitySubtasksCount } from '@/features/vida/types/activity.types'

export interface ActivityFollowUpActivityRef {
  id: string
  title: string
  description?: string | null
  category?: {
    id: string
    name: string
    color: string | null
    icon: string | null
  } | null
}

export interface ActivityFollowUpSubtask {
  id: string
  followUpId: string
  activitySubtaskId: string | null
  title: string
  isCompleted: boolean
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface ActivityFollowUp {
  id: string
  activityId: string
  date: string
  startTime: string
  durationMinutes: number | null
  isOpen?: boolean
  endTime: string | null
  endDate: string | null
  endDateTime: string | null
  notes: string | null
  activity?: ActivityFollowUpActivityRef | null
  sessionSubtasks?: ActivityFollowUpSubtask[]
  sessionSubtasksCount?: ActivitySubtasksCount
}

export type ActivityDayFollowUp = ActivityFollowUp

export interface ActivityFollowUpInput {
  activityId: string
  date: string
  startTime: string
  durationMinutes: number
  notes?: string | null
  /** UUID v7 del cliente para idempotencia offline. */
  clientId?: string | null
}

export interface ActivityFollowUpStartInput {
  activityId: string
  date: string
  startTime: string
  notes?: string | null
  /** UUID v7 del cliente para idempotencia offline. */
  clientId?: string | null
  /** IDs de subtareas de la actividad a incluir en esta ejecución. */
  subtaskIds?: string[]
}

/** Backend edit input: id required; other fields optional (no activityId). */
export interface ActivityFollowUpEditInput {
  id: string
  date?: string
  startTime?: string
  durationMinutes?: number
  notes?: string | null
}

export interface ActivityFollowUpsDateGroup {
  date: string
  followUps: ActivityFollowUp[]
}
