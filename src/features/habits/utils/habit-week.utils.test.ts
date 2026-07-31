import { describe, expect, it } from 'vitest'
import {
  getFollowUpQueryRange,
  getMonthDaysForWeek,
  getMonthRange,
  getMyDayFocusDate,
  getWeekEnd,
  isFutureWeek,
} from '@/features/habits/utils/habit-week.utils'

describe('habit-week.utils', () => {
  it('getWeekEnd returns Sunday of the week', () => {
    expect(getWeekEnd('2026-07-27')).toBe('2026-08-02')
  })

  it('isFutureWeek compares against current week', () => {
    expect(isFutureWeek('2026-08-03', '2026-07-30')).toBe(true)
    expect(isFutureWeek('2026-07-27', '2026-07-30')).toBe(false)
    expect(isFutureWeek('2026-07-20', '2026-07-30')).toBe(false)
  })

  it('getMyDayFocusDate uses today in the current week', () => {
    expect(getMyDayFocusDate('2026-07-27', '2026-07-30')).toBe('2026-07-30')
    expect(getMyDayFocusDate('2026-07-20', '2026-07-30')).toBe('2026-07-20')
  })

  it('getMonthDaysForWeek includes spillover days when week crosses months', () => {
    const days = getMonthDaysForWeek(2026, 7, '2026-07-27', '2026-07-30')
    const inWeek = days.filter((d) => d.isInWeek).map((d) => d.date)
    expect(inWeek).toEqual([
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ])
    expect(days.find((d) => d.date === '2026-08-01')?.isOutsideMonth).toBe(true)
    expect(days.find((d) => d.date === '2026-07-30')?.isToday).toBe(true)
    expect(days.find((d) => d.date === '2026-07-30')?.isOutsideMonth).toBe(false)
  })

  it('getMonthRange returns first and last day of month', () => {
    expect(getMonthRange(2026, 7)).toEqual({ from: '2026-07-01', to: '2026-07-31' })
    expect(getMonthRange(2026, 2)).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })

  it('getFollowUpQueryRange extends month range with week spillover', () => {
    expect(getFollowUpQueryRange(2026, 7, '2026-07-27')).toEqual({
      from: '2026-07-01',
      to: '2026-08-02',
    })
  })
})
