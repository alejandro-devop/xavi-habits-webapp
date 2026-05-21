import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  finishFormFromSession,
  finishFormToInput,
  logPastFormToInput,
  validateFinishActivityForm,
  validateLogPastActivityForm,
} from '@/features/activities/utils/activity-followup-form'
import type { RunningActivitySession } from '@/features/activities/types/activity-followup.types'

describe('activity-followup-form', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('finishFormFromSession computes durationMinutes from startedAt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T11:30:00.000Z'))

    const session: RunningActivitySession = {
      activityId: '7',
      activityTitle: 'Deep work',
      startedAt: '2026-05-20T10:00:00.000Z',
      notes: 'Focus',
    }

    const form = finishFormFromSession(session, '2026-05-20')
    expect(form.durationMinutes).toBe(90)
    expect(form.activityId).toBe('7')
    expect(form.notes).toBe('Focus')
  })

  it('finishFormToInput maps to API payload', () => {
    const input = finishFormToInput({
      activityId: '7',
      notes: 'Deep work',
      date: '2026-05-20',
      startTime: '09:30',
      durationMinutes: 90,
    })

    expect(input).toEqual({
      activityId: '7',
      date: '2026-05-20',
      startTime: '09:30',
      durationMinutes: 90,
      notes: 'Deep work',
    })
  })

  it('validateFinishActivityForm requires activity and duration', () => {
    expect(validateFinishActivityForm({
      activityId: null,
      notes: '',
      date: '2026-05-20',
      startTime: '09:00',
      durationMinutes: 0,
    })).toBeTruthy()
  })

  it('logPastFormToInput converts hours and minutes to durationMinutes', () => {
    const input = logPastFormToInput({
      activityId: '7',
      notes: 'Retro',
      date: '2026-05-19',
      startTime: '14:15',
      durationHours: 2,
      durationMinutes: 15,
    })
    expect(input.durationMinutes).toBe(135)
    expect(input.startTime).toBe('14:15')
  })

  it('validateLogPastActivityForm rejects zero duration', () => {
    expect(
      validateLogPastActivityForm({
        activityId: '1',
        notes: '',
        date: '2026-05-19',
        startTime: '10:00',
        durationHours: 0,
        durationMinutes: 0,
      }),
    ).toMatch(/duración/i)
  })
})
