export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface WeeklyRoutineActivity {
  id: string
  routineId: string
  activityId: string
  dayOfWeek: DayOfWeek
  startTime: string
  durationMinutes: number
  notes: string | null
  createdAt: string
  updatedAt: string
  activity?: {
    id: string
    title: string
    description: string | null
    category: { id: string; name: string; icon: string | null; color: string | null } | null
  } | null
}

export interface WeeklyRoutineDaySchedule {
  dayOfWeek: DayOfWeek
  activities: WeeklyRoutineActivity[]
}

export interface WeeklyRoutine {
  id: string
  userId: number
  name: string
  description: string | null
  startDay: DayOfWeek
  isActive: boolean
  dayStartTime: string
  dayEndTime: string
  activitiesCount: number | null
  createdAt: string
  updatedAt: string
  schedule?: WeeklyRoutineDaySchedule[]
}

export interface WeeklyRoutineCollection {
  routines: WeeklyRoutine[]
  page: number
  limit: number
  total: number
}

export interface WeeklyRoutineInput {
  name: string
  description?: string | null
  startDay?: DayOfWeek
  dayStartTime?: string
  dayEndTime?: string
}

export interface WeeklyRoutineEditInput extends WeeklyRoutineInput {
  id: string
}

export interface WeeklyRoutineActivityInput {
  routineId: string
  activityId: string
  dayOfWeek: DayOfWeek
  startTime: string
  durationMinutes: number
  notes?: string | null
}

export interface WeeklyRoutineActivityEditInput {
  id: string
  dayOfWeek?: DayOfWeek
  startTime?: string
  durationMinutes?: number
  notes?: string | null
}

// Planner-specific types
export interface TimeBlock {
  time: string
  label: string
  isHour: boolean
  isQuarter: boolean
  isEvenHour: boolean
}

export interface PlannerEvent extends WeeklyRoutineActivity {
  rowStart: number
  rowSpan: number
}

export interface PlannerSlot {
  time: string
  events: PlannerEvent[]
}
