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

export interface ActivityFollowUp {
  id: string
  activityId: string
  date: string
  startTime: string
  durationMinutes: number
  endTime: string
  endDate: string
  endDateTime: string
  notes: string | null
  activity?: ActivityFollowUpActivityRef | null
}

export type ActivityDayFollowUp = ActivityFollowUp

export interface ActivityFollowUpInput {
  activityId: string
  date: string
  startTime: string
  durationMinutes: number
  notes?: string | null
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

export interface RunningActivitySession {
  activityId: string
  activityTitle: string
  categoryId?: string | null
  categoryName?: string | null
  categoryColor?: string | null
  categoryIcon?: string | null
  notes?: string | null
  startedAt: string
}

export interface StartActivityFormValues {
  activityId: string | null
  notes: string
  startTime: string
}

export interface LogPastActivityFormValues {
  activityId: string | null
  notes: string
  date: string
  startTime: string
  durationHours: number
  durationMinutes: number
}

export interface FinishActivityFormValues {
  activityId: string | null
  notes: string
  date: string
  startTime: string
  durationMinutes: number
}

export interface EditFollowUpFormValues {
  activityId: string | null
  notes: string
  date: string
  startTime: string
  durationMinutes: number
}

export interface WeekDay {
  date: string
  label: string
  dayNumber: number
  isToday: boolean
  isFuture: boolean
  isSelected: boolean
}
