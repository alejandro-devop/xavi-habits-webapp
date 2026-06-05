import type { HabitPurpose } from './habit-purpose.types'

export type HabitType = 'boolean' | 'count' | 'time'

export type HabitStatus = 'active' | 'completed' | 'archived'

export type HabitDayStatus = 'empty' | 'accomplished' | 'failed' | 'lifeline'

export interface HabitCategory {
  id: string
  userId: number
  name: string
  description: string | null
  icon: string | null
  color: string | null
  orderIndex: number
}

export interface HabitMeasure {
  id: string
  name: string
  unit: string | null
}

export interface Habit {
  id: string
  userId: string
  name: string
  description: string | null
  habitType: HabitType
  periodDays: number
  restartCount: number
  weeklyLifelines: number
  status: HabitStatus
  shouldAvoid: boolean
  shouldKeep: boolean
  streak: number
  maxStreak: number
  days: number
  dailyGoal: boolean
  timerGoal: number | null
  timesGoal: number | null
  icon: string | null
  color: string | null
  orderIndex: number
  startDate: string | null
  endDate: string | null
  categoryId: string | null
  measureId: string | null
  purposeId: string | null
  createdAt: string
  updatedAt: string
  category?: HabitCategory | null
  measure?: HabitMeasure | null
  purpose?: HabitPurpose | null
}

export interface HabitFollowUp {
  id: string
  date: string
  habitId: string
  isAccomplished: boolean
  isFailed: boolean
  isLifeline: boolean
  difficulty: number | null
  count: number | null
  time: number | null
  notes: string | null
  story: string | null
  archived: boolean
}

export interface HabitCollection {
  habits: Habit[]
  page: number
  limit: number
  total: number
}

export interface HabitMyDayEntry {
  habit: Habit
  followUp: HabitFollowUp | null
  lifelinesUsedThisWeek: number
  lifelinesRemaining: number
}

export interface HabitDayEntry {
  date: string
  status: HabitDayStatus
  followUp: HabitFollowUp | null
}

export interface HabitWeekView {
  habit: Habit
  days: HabitDayEntry[]
  lifelinesRemaining: number
}

export interface HabitFollowUpsDateGroup {
  date: string
  followUps: Array<{
    id: string
    date: string
    habitId: string
    isAccomplished: boolean
    isFailed: boolean
    isLifeline: boolean
    difficulty: number | null
    count: number | null
    time: number | null
  }>
}

export interface HabitInput {
  name: string
  description?: string | null
  habitType: HabitType
  periodDays?: number
  weeklyLifelines?: number
  shouldAvoid?: boolean
  shouldKeep?: boolean
  dailyGoal?: number | null
  timerGoal?: number | null
  timesGoal?: number | null
  icon?: string | null
  color?: string | null
  orderIndex?: number
  startDate?: string | null
  endDate?: string | null
  categoryId?: string | null
  measureId?: string | null
  purposeId?: string | null
}

export interface HabitEditInput extends Partial<HabitInput> {
  id: string
  status?: HabitStatus
  isActive?: boolean
}

export interface HabitFollowUpAddInput {
  habitId: string
  date?: string
  count?: number
  time?: number
  notes?: string | null
  story?: string | null
  isAccomplished?: boolean
  isFailed?: boolean
  isLifeline?: boolean
  difficulty?: number | null
}

export interface HabitFollowUpEditInput {
  id: string
  count?: number
  time?: number
  notes?: string | null
  story?: string | null
  isAccomplished?: boolean
  isFailed?: boolean
  archived?: boolean
  difficulty?: number | null
}

export interface HabitFilters {
  isActive?: boolean
  status?: HabitStatus
  categoryId?: string
  page?: number
  limit?: number
}
