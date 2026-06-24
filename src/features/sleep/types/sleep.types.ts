export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent'

export type MoodOnWaking = 'tired' | 'groggy' | 'refreshed' | 'energized'

export interface SleepLog {
  id: string
  userId: number
  sleepDate: string
  bedtime: string
  wakeTime: string
  durationMinutes: number
  durationHours: string
  quality: SleepQuality | null
  moodOnWaking: MoodOnWaking | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface SleepLogInput {
  sleepDate: string
  bedtime: string
  wakeTime: string
  quality?: SleepQuality | null
  moodOnWaking?: MoodOnWaking | null
  notes?: string | null
  bedtimeStartTime?: string
}

export interface SleepLogEditInput {
  id: string
  sleepDate?: string
  bedtime?: string
  wakeTime?: string
  quality?: SleepQuality | null
  moodOnWaking?: MoodOnWaking | null
  notes?: string | null
  bedtimeStartTime?: string
}

export interface SleepLogsResponse {
  sleepLogs: SleepLog[]
  page: number
  limit: number
  total: number
}

export interface SleepLogsFilters {
  startDate?: string | null
  endDate?: string | null
  quality?: SleepQuality | null
  page?: number
  limit?: number
}

export interface SleepFormValues {
  sleepDate: string
  bedtime: string
  wakeTime: string
  quality: string
  moodOnWaking: string
  notes: string
}

export interface SleepQualityDistribution {
  poor: number
  fair: number
  good: number
  excellent: number
}

export interface SleepStatsPeriod {
  startDate: string | null
  endDate: string | null
}

export interface SleepStats {
  totalNights: number
  avgDurationMinutes: number
  avgDurationHours: string
  minDurationMinutes: number
  minDurationHours: string
  maxDurationMinutes: number
  maxDurationHours: string
  qualityDistribution: SleepQualityDistribution
  period: SleepStatsPeriod
}

export interface SleepStatsFilters {
  startDate?: string | null
  endDate?: string | null
}
