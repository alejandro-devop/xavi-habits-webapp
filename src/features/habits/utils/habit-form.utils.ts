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
  purposeId: string | null
  hidden: boolean
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
      purposeId: null,
      hidden: false,
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
    dailyGoal:
      habit.habitType === 'count' && habit.dailyGoal > 0 ? String(habit.dailyGoal) : '',
    timerGoal:
      habit.habitType === 'time' && habit.timerGoal > 0 ? String(habit.timerGoal) : '',
    purposeId: habit.purposeId ?? null,
    hidden: habit.hidden,
  }
}

export function buildHabitCreatePayload(values: HabitFormValues): HabitInput {
  const payload: HabitInput = {
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
    purposeId: values.purposeId || null,
    hidden: values.hidden,
  }

  if (values.habitType === 'count' && values.dailyGoal !== '') {
    payload.dailyGoal = Number(values.dailyGoal)
  }

  if (values.habitType === 'time' && values.timerGoal !== '') {
    payload.timerGoal = Number(values.timerGoal)
  }

  return payload
}

export function buildHabitEditPayload(values: HabitFormValues, habit: Habit): HabitEditInput {
  const payload: Partial<HabitInput> = buildHabitCreatePayload(values)
  const hasFollowUps = habit.days > 0

  if (hasFollowUps) {
    // Backend rejects date/type changes when follow-ups exist; omit locked fields
    delete payload.startDate
    delete payload.endDate
    delete payload.habitType
  }

  // null goal values would overwrite existing DB values with null (violating NOT NULL).
  // undefined means "don't change" in the backend's partial update.
  if (payload.timerGoal === undefined) delete payload.timerGoal
  if (payload.timesGoal === undefined) delete payload.timesGoal
  if (payload.dailyGoal === undefined) delete payload.dailyGoal

  return { id: habit.id, ...payload }
}
