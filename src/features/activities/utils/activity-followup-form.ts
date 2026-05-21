import type {
  ActivityFollowUp,
  EditFollowUpFormValues,
  FinishActivityFormValues,
  LogPastActivityFormValues,
  RunningActivitySession,
  StartActivityFormValues,
} from '@/features/activities/types/activity-followup.types'
import type { Activity } from '@/features/activities/types/activity.types'
import {
  calculateDurationMinutes,
  getCurrentLocalDate,
  getCurrentLocalTime,
  hoursMinutesToTotalMinutes,
  isFutureDate,
  isFutureDateTime,
  isToday,
  isoToLocalDate,
  isoToLocalTime,
  localDateTimeToIso,
  normalizeTimeForApi,
  normalizeTimeForDisplay,
} from '@/features/activities/utils/activity-time.utils'

export function emptyStartActivityFormValues(
  startTime: string = getCurrentLocalTime(),
): StartActivityFormValues {
  return { activityId: null, notes: '', startTime }
}

export function emptyLogPastActivityFormValues(
  date: string = getCurrentLocalDate(),
): LogPastActivityFormValues {
  return {
    activityId: null,
    notes: '',
    date,
    startTime: '09:00',
    durationHours: 0,
    durationMinutes: 30,
  }
}

export function validateStartActivityForm(
  values: StartActivityFormValues,
  sessionDate: string,
): string | null {
  if (!values.activityId?.trim()) return 'Selecciona una actividad'
  if (!values.startTime.trim()) return 'Indica la hora de inicio'
  if (isFutureDate(sessionDate)) return 'No puedes iniciar en un día futuro'
  if (isToday(sessionDate) && isFutureDateTime(sessionDate, values.startTime)) {
    return 'La hora de inicio no puede ser futura'
  }
  return null
}

export function validateLogPastActivityForm(values: LogPastActivityFormValues): string | null {
  if (!values.activityId?.trim()) return 'Selecciona una actividad'
  if (!values.date.trim()) return 'La fecha es obligatoria'
  if (!values.startTime.trim()) return 'La hora de inicio es obligatoria'
  if (isFutureDate(values.date)) return 'No puedes registrar en un día futuro'
  if (isTodayOrFutureDateTime(values.date, values.startTime)) {
    return 'La hora de inicio no puede ser futura'
  }
  const total = logPastDurationTotal(values)
  if (total < 1) return 'La duración debe ser al menos 1 minuto'
  return null
}

function isTodayOrFutureDateTime(date: string, time: string): boolean {
  if (!isToday(date)) return false
  return isFutureDateTime(date, time)
}

export function logPastDurationTotal(values: LogPastActivityFormValues): number {
  return hoursMinutesToTotalMinutes(values.durationHours, values.durationMinutes)
}

export function logPastFormToInput(values: LogPastActivityFormValues) {
  return {
    activityId: values.activityId!,
    date: values.date,
    startTime: normalizeTimeForApi(values.startTime),
    durationMinutes: logPastDurationTotal(values),
    notes: values.notes.trim() || null,
  }
}

export function startFormToStartedAtIso(sessionDate: string, values: StartActivityFormValues): string {
  return localDateTimeToIso(sessionDate, values.startTime)
}

export function activityToRunningSession(
  activity: Activity,
  notes: string,
  startedAt: string,
): RunningActivitySession {
  return {
    activityId: activity.id,
    activityTitle: activity.title,
    categoryId: activity.categoryId,
    categoryName: activity.category?.name ?? null,
    categoryColor: activity.category?.color ?? null,
    categoryIcon: activity.category?.icon ?? null,
    notes: notes.trim() || null,
    startedAt,
  }
}

export function finishFormFromSession(
  session: RunningActivitySession,
  selectedDate: string,
): FinishActivityFormValues {
  const endedAt = new Date().toISOString()
  return {
    activityId: session.activityId,
    notes: session.notes ?? '',
    date: selectedDate || isoToLocalDate(session.startedAt),
    startTime: isoToLocalTime(session.startedAt),
    durationMinutes: calculateDurationMinutes(session.startedAt, endedAt),
  }
}

export function validateFinishActivityForm(values: FinishActivityFormValues): string | null {
  if (!values.activityId?.trim()) return 'Selecciona una actividad'
  if (!values.date.trim()) return 'La fecha es obligatoria'
  if (!values.startTime.trim()) return 'La hora de inicio es obligatoria'
  if (!Number.isFinite(values.durationMinutes) || values.durationMinutes < 1) {
    return 'La duración debe ser al menos 1 minuto'
  }
  return null
}

export function finishFormToInput(values: FinishActivityFormValues) {
  return {
    activityId: values.activityId!,
    date: values.date,
    startTime: normalizeTimeForApi(values.startTime),
    durationMinutes: Math.round(values.durationMinutes),
    notes: values.notes.trim() || null,
  }
}

export function followUpToEditFormValues(followUp: ActivityFollowUp): EditFollowUpFormValues {
  return {
    activityId: followUp.activityId,
    notes: followUp.notes ?? '',
    date: followUp.date,
    startTime: normalizeTimeForDisplay(followUp.startTime),
    durationMinutes: followUp.durationMinutes,
  }
}

export function validateEditFollowUpForm(values: EditFollowUpFormValues): string | null {
  if (!values.date.trim()) return 'La fecha es obligatoria'
  if (!values.startTime.trim()) return 'La hora de inicio es obligatoria'
  if (!Number.isFinite(values.durationMinutes) || values.durationMinutes < 1) {
    return 'La duración debe ser al menos 1 minuto'
  }
  return null
}

export function editFormToInput(id: string, values: EditFollowUpFormValues) {
  return {
    id,
    date: values.date,
    startTime: normalizeTimeForApi(values.startTime),
    durationMinutes: Math.round(values.durationMinutes),
    notes: values.notes.trim() || null,
  }
}

export function emptyEditFollowUpFormValues(): EditFollowUpFormValues {
  return {
    activityId: null,
    notes: '',
    date: getCurrentLocalDate(),
    startTime: getCurrentLocalTime(),
    durationMinutes: 30,
  }
}
