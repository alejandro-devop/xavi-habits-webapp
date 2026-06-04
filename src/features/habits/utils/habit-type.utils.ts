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
