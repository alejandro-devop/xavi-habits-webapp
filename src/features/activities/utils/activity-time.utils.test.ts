import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  calculateDurationMinutes,
  calculateEndTime,
  formatElapsedHHMMSS,
  formatDurationConversionHint,
  getTimelineCardHeight,
  getWeekDaysForDate,
  hoursMinutesToTotalMinutes,
  isFutureDate,
  minutesToHoursMinutes,
  MIN_FOLLOW_UP_HEIGHT,
  HOUR_BLOCK_HEIGHT,
} from '@/features/activities/utils/activity-time.utils'

describe('activity-time.utils', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('isFutureDate returns true for dates after today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00'))
    expect(isFutureDate('2026-05-21')).toBe(true)
    expect(isFutureDate('2026-05-20')).toBe(false)
    expect(isFutureDate('2026-05-19')).toBe(false)
  })

  it('getWeekDaysForDate marks future days disabled', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00')) // Wednesday
    const days = getWeekDaysForDate(new Date(), '2026-05-20')
    expect(days).toHaveLength(7)
    expect(days[0]?.label).toBe('Lun')
    const futureDays = days.filter((d) => d.isFuture)
    expect(futureDays.length).toBeGreaterThan(0)
    expect(days.find((d) => d.isToday)?.date).toBe('2026-05-20')
  })

  it('formatElapsedHHMMSS formats from elapsed ms', () => {
    expect(formatElapsedHHMMSS(3661000)).toBe('01:01:01')
  })

  it('calculateDurationMinutes uses real timestamps', () => {
    const start = '2026-05-20T09:00:00.000Z'
    const end = '2026-05-20T10:30:00.000Z'
    expect(calculateDurationMinutes(start, end)).toBe(90)
  })

  it('calculateEndTime adds duration to start time', () => {
    expect(calculateEndTime('2026-05-20', '09:30', 90)).toBe('11:00')
  })

  it('getTimelineCardHeight scales with duration', () => {
    expect(getTimelineCardHeight(15)).toBe(MIN_FOLLOW_UP_HEIGHT)
    expect(getTimelineCardHeight(60)).toBe(HOUR_BLOCK_HEIGHT)
    expect(getTimelineCardHeight(120)).toBe(HOUR_BLOCK_HEIGHT * 2)
  })

  it('hoursMinutesToTotalMinutes and minutesToHoursMinutes round-trip', () => {
    expect(hoursMinutesToTotalMinutes(1, 30)).toBe(90)
    expect(minutesToHoursMinutes(90)).toEqual({ hours: 1, minutes: 30 })
  })

  it('formatDurationConversionHint shows total minutes', () => {
    expect(formatDurationConversionHint(90)).toContain('90 minutos')
    expect(formatDurationConversionHint(90)).toContain('1 h 30 min')
  })
})
