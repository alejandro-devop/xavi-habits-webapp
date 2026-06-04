import type { Habit, HabitEditInput, HabitInput, HabitType } from '@/features/habits/types/habit.types'

export interface HabitFormValues {
  name: string
  description: string
  habitType: HabitType
  shouldAvoid: boolean
  icon: string | null
  color: string | null
  categoryId: string
  measureId: string
  weeklyLifelines: string
  startDate: string
  endDate: string
  dailyGoal: string
  timerGoal: string
}

export function defaultFormValues(habit?: Habit): HabitFormValues {
  if (!habit) {
    return {
      name: '',
      description: '',
      habitType: 'boolean',
      shouldAvoid: false,
      icon: null,
      color: null,
      categoryId: '',
      measureId: '',
      weeklyLifelines: '0',
      startDate: '',
      endDate: '',
      dailyGoal: '',
      timerGoal: '',
    }
  }
  return {
    name: habit.name,
    description: habit.description ?? '',
    habitType: habit.habitType,
    shouldAvoid: habit.shouldAvoid,
    icon: habit.icon,
    color: habit.color,
    categoryId: habit.categoryId ?? '',
    measureId: habit.measureId ?? '',
    weeklyLifelines: String(habit.weeklyLifelines),
    startDate: habit.startDate ?? '',
    endDate: habit.endDate ?? '',
    dailyGoal: habit.timesGoal != null ? String(habit.timesGoal) : '',
    timerGoal: habit.timerGoal != null ? String(habit.timerGoal) : '',
  }
}

export function buildHabitCreatePayload(values: HabitFormValues): HabitInput {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    habitType: values.habitType,
    shouldAvoid: values.shouldAvoid,
    icon: values.icon || null,
    color: values.color || null,
    categoryId: values.categoryId || null,
    measureId: values.measureId || null,
    weeklyLifelines: Number(values.weeklyLifelines) || 0,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    timesGoal:
      values.habitType === 'count' && values.dailyGoal !== '' ? Number(values.dailyGoal) : null,
    timerGoal:
      values.habitType === 'time' && values.timerGoal !== '' ? Number(values.timerGoal) : null,
    dailyGoal: values.habitType === 'boolean' ? 1 : null,
  }
}

export function buildHabitEditPayload(values: HabitFormValues, habit: Habit): HabitEditInput {
  return {
    id: habit.id,
    ...buildHabitCreatePayload(values),
  }
}
