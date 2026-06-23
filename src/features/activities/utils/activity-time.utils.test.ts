import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  calculateDurationMinutes,
  calculateEndTime,
  formatDurationConversionHint,
  formatElapsedHHMMSS,
  formatFollowUpTimeLabel,
  getCurrentLocalTime,
  getFollowUpEndTimeForNextEntry,
  getFreeSlotsBetweenFollowUps,
  getMostRecentFollowUp,
  getMaxDurationForStartTime,
  getMonthDaysForDate,
  getMonthRange,
  getTimelineItemHeight,
  getWeekDaysForDate,
  getYearMonthFromDate,
  canNavigateToNextMonth,
  shiftMonth,
  hoursMinutesToTotalMinutes,
  isFutureDate,
  MIN_FOLLOW_UP_HEIGHT,
  minutesToHoursMinutes,
  sortFollowUpsByStartTimeAsc,
  validateFollowUpInsideSlot,
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

  it('getMonthDaysForDate returns all days in month with future flags', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00'))

    const days = getMonthDaysForDate(2026, 5, '2026-05-20')
    expect(days).toHaveLength(31)
    expect(days.find((d) => d.isSelected)?.date).toBe('2026-05-20')
    expect(days.filter((d) => d.isFuture)).toHaveLength(11)
  })

  it('getMonthRange returns first and last day of month', () => {
    expect(getMonthRange(2026, 5)).toEqual({ from: '2026-05-01', to: '2026-05-31' })
    expect(getMonthRange(2026, 2)).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })

  it('canNavigateToNextMonth blocks future months', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00'))

    expect(canNavigateToNextMonth(2026, 4)).toBe(true)
    expect(canNavigateToNextMonth(2026, 5)).toBe(false)
    expect(canNavigateToNextMonth(2026, 6)).toBe(false)
  })

  it('shiftMonth moves across year boundary', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 })
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 })
  })

  it('getYearMonthFromDate parses YYYY-MM-DD', () => {
    expect(getYearMonthFromDate('2026-05-20')).toEqual({ year: 2026, month: 5 })
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

  it('getFreeSlotsBetweenFollowUps finds 10:30–11:00 gap', () => {
    const a: ActivityFollowUp = {
      id: '1',
      activityId: 'a',
      date: '2026-05-20',
      startTime: '10:00:00',
      durationMinutes: 30,
      endTime: '10:30:00',
      endDate: '2026-05-20',
      endDateTime: '',
      notes: null,
    }
    const b: ActivityFollowUp = {
      ...a,
      id: '2',
      startTime: '11:00:00',
      durationMinutes: 60,
      endTime: '12:00:00',
    }
    const slots = getFreeSlotsBetweenFollowUps('2026-05-20', [a, b])
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatchObject({
      date: '2026-05-20',
      startTime: '10:30:00',
      endTime: '11:00:00',
      durationMinutes: 30,
    })
  })

  it('getFreeSlotsBetweenFollowUps returns empty for contiguous activities', () => {
    const a: ActivityFollowUp = {
      id: '1',
      activityId: 'a',
      date: '2026-05-20',
      startTime: '10:00:00',
      durationMinutes: 30,
      endTime: '10:30:00',
      endDate: '2026-05-20',
      endDateTime: '',
      notes: null,
    }
    const b: ActivityFollowUp = {
      ...a,
      id: '2',
      startTime: '10:30:00',
      durationMinutes: 30,
      endTime: '11:00:00',
    }
    expect(getFreeSlotsBetweenFollowUps('2026-05-20', [a, b])).toHaveLength(0)
  })

  it('getFreeSlotsBetweenFollowUps avoids negative gaps on overlap', () => {
    const a: ActivityFollowUp = {
      id: '1',
      activityId: 'a',
      date: '2026-05-20',
      startTime: '10:00:00',
      durationMinutes: 60,
      endTime: '11:00:00',
      endDate: '2026-05-20',
      endDateTime: '',
      notes: null,
    }
    const b: ActivityFollowUp = {
      ...a,
      id: '2',
      startTime: '10:30:00',
      durationMinutes: 30,
      endTime: '11:00:00',
    }
    const slots = getFreeSlotsBetweenFollowUps('2026-05-20', [a, b])
    expect(slots.every((s) => s.durationMinutes > 0)).toBe(true)
  })

  it('getMaxDurationForStartTime respects slot end', () => {
    const slot = {
      id: 'free',
      date: '2026-05-20',
      startTime: '10:30:00',
      endTime: '11:00:00',
      durationMinutes: 30,
    }
    expect(getMaxDurationForStartTime('10:30', slot)).toBe(30)
    expect(getMaxDurationForStartTime('10:45', slot)).toBe(15)
  })

  it('validateFollowUpInsideSlot rejects out-of-range entries', () => {
    const slot = {
      id: 'free',
      date: '2026-05-20',
      startTime: '10:30:00',
      endTime: '11:00:00',
      durationMinutes: 30,
    }
    expect(validateFollowUpInsideSlot({ startTime: '10:30', durationMinutes: 30 }, slot).valid).toBe(
      true,
    )
    expect(validateFollowUpInsideSlot({ startTime: '10:45', durationMinutes: 15 }, slot).valid).toBe(
      true,
    )
    expect(validateFollowUpInsideSlot({ startTime: '10:20', durationMinutes: 10 }, slot).valid).toBe(
      false,
    )
    expect(validateFollowUpInsideSlot({ startTime: '10:45', durationMinutes: 30 }, slot).valid).toBe(
      false,
    )
  })

  it('getTimelineItemHeight scales with duration', () => {
    expect(getTimelineItemHeight(5)).toBe(MIN_FOLLOW_UP_HEIGHT)
    expect(getTimelineItemHeight(120)).toBeGreaterThan(getTimelineItemHeight(5))
  })

  it('getMostRecentFollowUp returns latest start time for the day', () => {
    const early: ActivityFollowUp = {
      id: '1',
      activityId: 'a',
      date: '2026-05-20',
      startTime: '09:00:00',
      durationMinutes: 60,
      endTime: '10:00:00',
      endDate: '2026-05-20',
      endDateTime: '',
      notes: null,
    }
    const late: ActivityFollowUp = {
      ...early,
      id: '2',
      startTime: '11:00:00',
      durationMinutes: 30,
      endTime: '11:30:00',
    }
    expect(getMostRecentFollowUp('2026-05-20', [early, late])?.id).toBe('2')
  })

  it('getFollowUpEndTimeForNextEntry returns end time for next activity', () => {
    const followUp: ActivityFollowUp = {
      id: '1',
      activityId: 'a',
      date: '2026-05-20',
      startTime: '11:00:00',
      durationMinutes: 30,
      endTime: '11:30:00',
      endDate: '2026-05-20',
      endDateTime: '',
      notes: null,
    }
    expect(getFollowUpEndTimeForNextEntry(followUp, '2026-05-20')).toBe('11:30')
  })
})

