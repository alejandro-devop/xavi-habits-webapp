import type { CreateFollowUpFromFreeSlotFormValues } from '@/features/activities/types/activity-timeline.types'
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import {
  getMaxDurationForStartTime,
  hoursMinutesToTotalMinutes,
  minutesToHoursMinutes,
  normalizeTimeForDisplay,
  normalizeTimeToSeconds,
  validateFollowUpInsideSlot,
} from '@/features/activities/utils/activity-time.utils'

export function emptyFreeSlotFormValues(slot: TimelineFreeSlot): CreateFollowUpFromFreeSlotFormValues {
  const total = Math.min(slot.durationMinutes, 30)
  const { hours, minutes } = minutesToHoursMinutes(total)
  return {
    activityId: null,
    notes: '',
    date: slot.date,
    startTime: normalizeTimeForDisplay(slot.startTime),
    durationHours: hours,
    durationMinutes: minutes,
  }
}

export function freeSlotDurationTotal(values: CreateFollowUpFromFreeSlotFormValues): number {
  return hoursMinutesToTotalMinutes(values.durationHours, values.durationMinutes)
}

export function clampFreeSlotFormToSlot(
  values: CreateFollowUpFromFreeSlotFormValues,
  slot: TimelineFreeSlot,
): CreateFollowUpFromFreeSlotFormValues {
  const max = getMaxDurationForStartTime(values.startTime, slot)
  const total = Math.min(freeSlotDurationTotal(values), max)
  const { hours, minutes } = minutesToHoursMinutes(total)
  return { ...values, durationHours: hours, durationMinutes: minutes }
}

export function validateFreeSlotForm(
  values: CreateFollowUpFromFreeSlotFormValues,
  slot: TimelineFreeSlot,
): string | null {
  if (!values.activityId?.trim()) return 'Selecciona una actividad'
  const slotValidation = validateFollowUpInsideSlot(
    { startTime: values.startTime, durationMinutes: freeSlotDurationTotal(values) },
    slot,
  )
  if (!slotValidation.valid) return slotValidation.message
  return null
}

export function freeSlotFormToInput(values: CreateFollowUpFromFreeSlotFormValues) {
  return {
    activityId: values.activityId!,
    date: values.date,
    startTime: normalizeTimeToSeconds(values.startTime),
    durationMinutes: freeSlotDurationTotal(values),
    notes: values.notes.trim() || null,
  }
}
