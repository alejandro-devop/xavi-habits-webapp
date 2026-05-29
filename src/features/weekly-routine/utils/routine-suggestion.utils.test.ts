import { describe, expect, it } from 'vitest'
import type { WeeklyRoutineActivity } from '../types/weekly-routine.types'
import {
  findCurrentRoutineActivity,
  findUpcomingRoutineActivity,
  getDayOfWeekForDate,
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
})
