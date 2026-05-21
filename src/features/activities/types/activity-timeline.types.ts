import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'

export interface TimelineInterval {
  startMinutes: number
  endMinutes: number
}

export interface TimelineFreeSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
}

export type TimelineItem =
  | { type: 'follow-up'; startMinutes: number; endMinutes: number; data: ActivityFollowUp }
  | { type: 'free-slot'; startMinutes: number; endMinutes: number; data: TimelineFreeSlot }
  | { type: 'now' }

export type ValidationResult =
  | { valid: true }
  | { valid: false; message: string }

export interface CreateFollowUpFromFreeSlotFormValues {
  activityId: string | null
  notes: string
  date: string
  startTime: string
  durationHours: number
  durationMinutes: number
}
