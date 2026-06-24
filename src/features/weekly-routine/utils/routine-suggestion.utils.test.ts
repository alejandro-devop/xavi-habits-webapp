import { describe, expect, it, vi } from 'vitest'
import type { WeeklyRoutineActivity } from '../types/weekly-routine.types'
import {
  findCurrentRoutineActivity,
  findUpcomingRoutineActivity,
  getCurrentDayOfWeek,
  getDayOfWeekForDate,
  getRoutineActivityWindow,
  getRoutineNowStatus,
} from './routine-suggestion.utils'
import { timeToMinutes } from './planner.utils'

function activity(
  startTime: string,
  durationMinutes: number,
  id = '1',
): WeeklyRoutineActivity {
  return {
    id,
    routineId: 'r1',
    activityId: 'a1',
    dayOfWeek: 'monday',
    startTime,
    durationMinutes,
    notes: null,
    createdAt: '',
    updatedAt: '',
    activity: { id: 'a1', title: 'Test', description: null, category: null },
  }
}

describe('routine-suggestion.utils', () => {
  it('getDayOfWeekForDate resolves weekday from ISO date', () => {
    expect(getDayOfWeekForDate('2026-05-29')).toBe('friday')
  })

  it('getCurrentDayOfWeek matches local weekday for a known instant', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-23T10:00:00'))
    expect(getCurrentDayOfWeek()).toBe('tuesday')
    vi.useRealTimers()
  })

  it('findCurrentRoutineActivity returns in-progress block', () => {
    const list = [activity('09:00', 60), activity('11:00', 30)]
    expect(findCurrentRoutineActivity(list, timeToMinutes('09:30'))?.id).toBe('1')
    expect(findCurrentRoutineActivity(list, timeToMinutes('10:30'))).toBeNull()
  })

  it('findUpcomingRoutineActivity returns next future block', () => {
    const list = [activity('09:00', 60, 'a'), activity('11:00', 30, 'b'), activity('14:00', 45, 'c')]
    expect(findUpcomingRoutineActivity(list, timeToMinutes('10:00'))?.id).toBe('b')
    expect(findUpcomingRoutineActivity(list, timeToMinutes('12:00'))?.id).toBe('c')
    expect(findUpcomingRoutineActivity(list, timeToMinutes('20:00'))).toBeNull()
  })

  it('getRoutineActivityWindow shows 2 before and 2 after the pivot', () => {
    const list = [
      activity('08:00', 60, 'a'),
      activity('09:00', 60, 'b'),
      activity('10:00', 60, 'c'),
      activity('11:00', 60, 'd'),
      activity('12:00', 60, 'e'),
      activity('13:00', 60, 'f'),
      activity('14:00', 60, 'g'),
    ]

    const duringE = getRoutineActivityWindow(list, timeToMinutes('12:30'))
    expect(duringE.visible.map((a) => a.id)).toEqual(['c', 'd', 'e', 'f', 'g'])
    expect(duringE.hasMoreBefore).toBe(true)
    expect(duringE.hasMoreAfter).toBe(false)

    const beforeDay = getRoutineActivityWindow(list, timeToMinutes('07:30'))
    expect(beforeDay.visible.map((a) => a.id)).toEqual(['a', 'b', 'c'])
    expect(beforeDay.hasMoreBefore).toBe(false)
    expect(beforeDay.hasMoreAfter).toBe(true)

    const afterDay = getRoutineActivityWindow(list, timeToMinutes('20:00'))
    expect(afterDay.visible.map((a) => a.id)).toEqual(['e', 'f', 'g'])
    expect(afterDay.hasMoreBefore).toBe(true)
    expect(afterDay.hasMoreAfter).toBe(false)
  })

  it('getRoutineNowStatus returns in-progress, upcoming, or done', () => {
    const list = [
      activity('09:00', 60, 'a'),
      activity('11:00', 30, 'b'),
      activity('14:00', 45, 'c'),
    ]

    expect(getRoutineNowStatus(list, timeToMinutes('09:30'))).toEqual({
      kind: 'in_progress',
      activity: list[0],
    })
    expect(getRoutineNowStatus(list, timeToMinutes('10:30'))).toEqual({
      kind: 'upcoming',
      activity: list[1],
    })
    expect(getRoutineNowStatus(list, timeToMinutes('20:00'))).toEqual({ kind: 'done' })
    expect(getRoutineNowStatus([], timeToMinutes('10:00'))).toBeNull()
  })
})
