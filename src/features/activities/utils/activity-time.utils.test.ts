import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  calculateDurationMinutes,
  calculateEndTime,
  formatDurationConversionHint,
  formatElapsedHHMMSS,
  formatFollowUpTimeLabel,
  getCurrentLocalTime,
  getWeekDaysForDate,
  hoursMinutesToTotalMinutes,
  isFutureDate,
  minutesToHoursMinutes,
  sortFollowUpsByStartTimeAsc,
} from '@/features/activities/utils/activity-time.utils'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'

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
    vi.setSystemTime(new Date('2026-05-20T12:00:00'))

    const days = getWeekDaysForDate(new Date(), '2026-05-20')
    expect(days).toHaveLength(7)
    expect(days.find((d) => d.isToday)?.date).toBe('2026-05-20')
    expect(days.some((d) => d.isFuture)).toBe(true)
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

  it('hoursMinutesToTotalMinutes and minutesToHoursMinutes round-trip', () => {
    expect(hoursMinutesToTotalMinutes(1, 30)).toBe(90)
    expect(minutesToHoursMinutes(90)).toEqual({ hours: 1, minutes: 30 })
  })

  it('formatDurationConversionHint shows total minutes', () => {
    expect(formatDurationConversionHint(90)).toContain('90 minutos')
    expect(formatDurationConversionHint(90)).toContain('1 h 30 min')
  })

  it('formatFollowUpTimeLabel normalizes times', () => {
    expect(formatFollowUpTimeLabel('11:30:00', '12:00:00')).toEqual({
      startLabel: '11:30',
      endLabel: '12:00',
    })
  })

  it('sortFollowUpsByStartTimeAsc orders earliest first', () => {
    const a: ActivityFollowUp = {
      id: '1',
      activityId: 'a',
      date: '2026-05-20',
      startTime: '14:00:00',
      durationMinutes: 30,
      endTime: '14:30:00',
      endDate: '2026-05-20',
      endDateTime: '',
      notes: null,
    }
    const b: ActivityFollowUp = {
      ...a,
      id: '2',
      startTime: '09:00:00',
    }
    const sorted = sortFollowUpsByStartTimeAsc([a, b])
    expect(sorted[0]?.id).toBe('2')
    expect(sorted[1]?.id).toBe('1')
  })

  it('getCurrentLocalTime returns HH:mm', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T14:05:00'))
    expect(getCurrentLocalTime()).toMatch(/^\d{2}:\d{2}$/)
  })
})
