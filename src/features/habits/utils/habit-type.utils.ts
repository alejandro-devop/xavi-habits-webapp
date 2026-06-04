import type { HabitType } from '@/features/habits/types/habit.types'

export const HABIT_TYPE_LABELS: Record<HabitType, string> = {
  boolean: 'Sí / No',
  count: 'Contador',
  time: 'Tiempo',
}

export const HABIT_TYPE_ICONS: Record<HabitType, string> = {
  boolean: 'check-circle',
  count: 'hash',
  time: 'clock',
}

export function getHabitTypeLabel(type: HabitType): string {
  return HABIT_TYPE_LABELS[type]
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getYesterdayString(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]
}

export function addDaysToString(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

export function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const dayOfWeek = d.getUTCDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  d.setUTCDate(d.getUTCDate() - daysFromMonday)
  return d.toISOString().split('T')[0]
}
