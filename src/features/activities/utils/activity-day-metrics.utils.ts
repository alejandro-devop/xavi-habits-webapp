import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import {
  formatDateToYmd,
  formatElapsedHHMMSS,
  normalizeTimeForDisplay,
} from '@/features/activities/utils/activity-time.utils'

/** Hardcoded day end; future: load from user settings. */
export const DAY_END_TIME = '23:00:00'

const DAY_START_TIME = '00:00:00'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function parseDateParts(date: string): { year: number; month: number; day: number } | null {
  const [year, month, day] = date.split('-').map(Number)
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null
  return { year, month: month - 1, day }
}

function parseEndTimeParts(endTime: string): { hours: number; minutes: number } | null {
  const normalized = normalizeTimeForDisplay(endTime)
  const [hours, minutes] = normalized.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return { hours, minutes }
}

function getPreviousDateString(date: string): string {
  const parts = parseDateParts(date)
  if (!parts) return date
  const d = new Date(parts.year, parts.month, parts.day)
  d.setDate(d.getDate() - 1)
  return formatDateToYmd(d)
}

/** Local Date when the previous day ended (= start of this day's window). */
export function getDayWindowStartDateTime(
  date: string,
  endTime: string = DAY_END_TIME,
): Date {
  return getDayEndDateTime(getPreviousDateString(date), endTime)
}

/** Local Date for YYYY-MM-DD at the given HH:mm:ss (default DAY_END_TIME). */
export function getDayEndDateTime(date: string, endTime: string = DAY_END_TIME): Date {
  const parts = parseDateParts(date)
  const time = parseEndTimeParts(endTime)
  if (!parts || !time) return new Date()
  return new Date(parts.year, parts.month, parts.day, time.hours, time.minutes, 0, 0)
}

function getDayStartDateTime(date: string): Date {
  const parts = parseDateParts(date)
  const time = parseEndTimeParts(DAY_START_TIME)
  if (!parts || !time) return new Date()
  return new Date(parts.year, parts.month, parts.day, time.hours, time.minutes, 0, 0)
}

/** Milliseconds until day end; 0 if now is at or past end time on that calendar day. */
export function getRemainingDayMs(
  now: Date,
  date: string,
  endTime: string = DAY_END_TIME,
): number {
  const end = getDayEndDateTime(date, endTime)
  return Math.max(0, end.getTime() - now.getTime())
}

export function formatDurationFromMs(ms: number): string {
  return formatElapsedHHMMSS(ms)
}

/** Compact label: "2h 30m", "45m", "0m". */
export function formatDurationFromMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  if (safe === 0) return '0m'
  const h = Math.floor(safe / 60)
  const m = safe % 60
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function getUsedMinutesFromFollowUps(followUps: ActivityFollowUp[]): number {
  return followUps.reduce((sum, f) => sum + Math.max(0, f.durationMinutes), 0)
}

export function getFreeMinutesFromSlots(freeSlots: TimelineFreeSlot[]): number {
  return freeSlots.reduce((sum, slot) => sum + Math.max(0, slot.durationMinutes), 0)
}

/**
 * Minutes elapsed in the day window: previous day 23:00 → selected day 23:00.
 * For today, caps at `now` when before day end.
 */
export function getDayWindowElapsedMinutes(
  date: string,
  now: Date = new Date(),
  endTime: string = DAY_END_TIME,
): number {
  const windowStart = getDayWindowStartDateTime(date, endTime)
  const windowEnd = getDayEndDateTime(date, endTime)
  const today = formatDateToYmd(now)

  const effectiveEnd =
    date === today && now.getTime() < windowEnd.getTime() ? now : windowEnd

  if (effectiveEnd.getTime() <= windowStart.getTime()) return 0

  return Math.round((effectiveEnd.getTime() - windowStart.getTime()) / 60_000)
}

export interface DayUsageMetrics {
  usedMinutes: number
  freeMinutes: number
  wasteMinutes: number
  totalWindowMinutes: number
  totalTrackedMinutes: number
  usedPercentage: number
  freePercentage: number
  wastePercentage: number
}

export type DayUsageMetricsOptions = {
  now?: Date
  endTime?: string
}

export function getDayUsageMetrics(
  date: string,
  followUps: ActivityFollowUp[],
  freeSlots: TimelineFreeSlot[],
  options: DayUsageMetricsOptions = {},
): DayUsageMetrics {
  const { now = new Date(), endTime = DAY_END_TIME } = options
  const usedMinutes = getUsedMinutesFromFollowUps(followUps)
  const freeMinutes = getFreeMinutesFromSlots(freeSlots)
  const totalTrackedMinutes = usedMinutes + freeMinutes
  const totalWindowMinutes = getDayWindowElapsedMinutes(date, now, endTime)
  const wasteMinutes = Math.max(0, totalWindowMinutes - usedMinutes - freeMinutes)

  if (totalWindowMinutes === 0) {
    return {
      usedMinutes,
      freeMinutes,
      wasteMinutes: 0,
      totalWindowMinutes: 0,
      totalTrackedMinutes,
      usedPercentage: 0,
      freePercentage: 0,
      wastePercentage: 0,
    }
  }

  const usedPercentage = Math.round((usedMinutes / totalWindowMinutes) * 100)
  const freePercentage = Math.round((freeMinutes / totalWindowMinutes) * 100)
  const wastePercentage = Math.max(0, 100 - usedPercentage - freePercentage)

  return {
    usedMinutes,
    freeMinutes,
    wasteMinutes,
    totalWindowMinutes,
    totalTrackedMinutes,
    usedPercentage,
    freePercentage,
    wastePercentage,
  }
}

/** Elapsed share of the 00:00 → day-end window (0–100). */
export function getDayElapsedPercentage(
  now: Date,
  date: string,
  endTime: string = DAY_END_TIME,
): number {
  const start = getDayStartDateTime(date)
  const end = getDayEndDateTime(date, endTime)
  const totalMs = end.getTime() - start.getTime()
  if (totalMs <= 0) return 100
  const remainingMs = getRemainingDayMs(now, date, endTime)
  const elapsedMs = totalMs - remainingMs
  return Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)))
}

/** Human label for day end, e.g. "11:00 PM". */
export function formatDayEndLabel(endTime: string = DAY_END_TIME): string {
  const normalized = normalizeTimeForDisplay(endTime)
  const [h, m] = normalized.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return '11:00 PM'

  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${pad2(m)} ${period}`
}
