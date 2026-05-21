import { describe, expect, it } from 'vitest'
import {
  emptyFreeSlotFormValues,
  freeSlotFormToInput,
  validateFreeSlotForm,
} from '@/features/activities/utils/activity-free-slot-form'

const slot = {
  id: 'free-1',
  date: '2026-05-20',
  startTime: '10:30:00',
  endTime: '11:00:00',
  durationMinutes: 30,
}

describe('activity-free-slot-form', () => {
  it('emptyFreeSlotFormValues pre-fills slot start', () => {
    const values = emptyFreeSlotFormValues(slot)
    expect(values.startTime).toBe('10:30')
    expect(values.date).toBe('2026-05-20')
  })

  it('validateFreeSlotForm rejects duration exceeding slot', () => {
    const values = {
      ...emptyFreeSlotFormValues(slot),
      activityId: 'act-1',
      startTime: '10:45',
      durationHours: 0,
      durationMinutes: 30,
    }
    expect(validateFreeSlotForm(values, slot)).toMatch(/duración|superar/i)
  })

  it('freeSlotFormToInput sends HH:mm:ss startTime', () => {
    const values = {
      ...emptyFreeSlotFormValues(slot),
      activityId: 'act-1',
      startTime: '10:30',
      durationHours: 0,
      durationMinutes: 30,
    }
    expect(freeSlotFormToInput(values)).toEqual({
      activityId: 'act-1',
      date: '2026-05-20',
      startTime: '10:30:00',
      durationMinutes: 30,
      notes: null,
    })
  })
})
