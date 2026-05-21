import { describe, expect, it, vi, afterEach } from 'vitest'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import {
  DAY_END_TIME,
  formatDayEndLabel,
  formatDurationFromMs,
  formatDurationFromMinutes,
  getDayUsageMetrics,
  getDayWindowElapsedMinutes,
  getFreeMinutesFromSlots,
  getRemainingDayMs,
  getUsedMinutesFromFollowUps,
} from '@/features/activities/utils/activity-day-metrics.utils'

const followUp = (durationMinutes: number): ActivityFollowUp => ({
  id: '1',
  activityId: 'a',
  date: '2026-05-20',
  startTime: '09:00:00',
  durationMinutes,
  endTime: '10:00:00',
  endDate: '2026-05-20',
  endDateTime: '2026-05-20T10:00:00',
  notes: null,
})

const slot = (durationMinutes: number): TimelineFreeSlot => ({
  id: 'free-1',
  date: '2026-05-20',
  startTime: '10:00:00',
  endTime: '10:45:00',
  durationMinutes,
})

describe('activity-day-metrics.utils', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('getRemainingDayMs returns correct value before 23:00', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 20, 20, 0, 0))

    const remaining = getRemainingDayMs(new Date(), '2026-05-20', DAY_END_TIME)
    expect(remaining).toBe(3 * 60 * 60 * 1000)
  })

  it('getRemainingDayMs returns 0 after 23:00', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 20, 23, 30, 0))

    const remaining = getRemainingDayMs(new Date(), '2026-05-20', DAY_END_TIME)
    expect(remaining).toBe(0)
  })

  it('formatDurationFromMs formats HH:mm:ss', () => {
    expect(formatDurationFromMs(3661000)).toBe('01:01:01')
  })

  it('getUsedMinutesFromFollowUps sums durationMinutes', () => {
    expect(getUsedMinutesFromFollowUps([followUp(90), followUp(30)])).toBe(120)
  })

  it('getFreeMinutesFromSlots sums durationMinutes', () => {
    expect(getFreeMinutesFromSlots([slot(45), slot(15)])).toBe(60)
  })

  it('getDayWindowElapsedMinutes uses previous day 23:00 as start', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 21, 20, 0, 0))

    expect(getDayWindowElapsedMinutes('2026-05-21')).toBe(21 * 60)
  })

  it('getDayWindowElapsedMinutes is full 24h for a completed past day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 25, 12, 0, 0))

    expect(getDayWindowElapsedMinutes('2026-05-20')).toBe(24 * 60)
  })

  it('getDayUsageMetrics treats full window as waste when nothing tracked', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 20, 23, 0, 0))

    const metrics = getDayUsageMetrics('2026-05-20', [], [])

    expect(metrics.wasteMinutes).toBe(24 * 60)
    expect(metrics.wastePercentage).toBe(100)
    expect(metrics.usedPercentage).toBe(0)
    expect(metrics.freePercentage).toBe(0)
  })

  it('getDayUsageMetrics computes waste as unaccounted window time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 20, 23, 0, 0))

    const metrics = getDayUsageMetrics('2026-05-20', [followUp(90)], [slot(30)])

    expect(metrics.totalWindowMinutes).toBe(24 * 60)
    expect(metrics.usedMinutes).toBe(90)
    expect(metrics.freeMinutes).toBe(30)
    expect(metrics.wasteMinutes).toBe(24 * 60 - 120)
    expect(metrics.usedPercentage + metrics.freePercentage + metrics.wastePercentage).toBe(100)
  })

  it('formatDurationFromMinutes uses compact labels', () => {
    expect(formatDurationFromMinutes(150)).toBe('2h 30m')
    expect(formatDurationFromMinutes(45)).toBe('45m')
    expect(formatDurationFromMinutes(0)).toBe('0m')
  })

  it('formatDayEndLabel formats 23:00 as 11:00 PM', () => {
    expect(formatDayEndLabel('23:00:00')).toBe('11:00 PM')
  })
})
