import type { Habit, HabitFollowUp, HabitType } from '@/features/habits/types/habit.types'

export function getHabitDailyGoal(habit: Habit): number {
  if (habit.habitType === 'count') return habit.dailyGoal > 0 ? habit.dailyGoal : 0
  if (habit.habitType === 'time') return habit.timerGoal > 0 ? habit.timerGoal : 0
  return 0
}

export function getFollowUpProgressValue(followUp: HabitFollowUp, habitType: HabitType): number {
  if (habitType === 'count') return followUp.count ?? 0
  if (habitType === 'time') return followUp.time ?? 0
  return 0
}

export function isPartialFollowUp(habit: Habit, followUp: HabitFollowUp): boolean {
  if (followUp.isAccomplished || followUp.isFailed || followUp.isLifeline) return false
  if (habit.habitType === 'boolean') return false
  return getFollowUpProgressValue(followUp, habit.habitType) > 0
}

export function getProgressRatio(habit: Habit, followUp: HabitFollowUp): number | null {
  const goal = getHabitDailyGoal(habit)
  if (goal <= 0) return null
  const value = getFollowUpProgressValue(followUp, habit.habitType)
  return Math.min(value / goal, 1)
}

export function formatProgressLabel(
  habit: Habit,
  followUp: HabitFollowUp,
  measureLabel: string,
): string {
  const value = getFollowUpProgressValue(followUp, habit.habitType)
  const goal = getHabitDailyGoal(habit)
  const unit = habit.habitType === 'time' ? 'min' : measureLabel

  if (goal > 0) {
    return `${value} / ${goal} ${unit}`
  }
  return `${value} ${unit}`
}

export function getCurrentProgressValue(
  habit: Habit,
  followUp: HabitFollowUp | null | undefined,
): number {
  if (!followUp) return 0
  return getFollowUpProgressValue(followUp, habit.habitType)
}

export function getRemainingToGoal(
  habit: Habit,
  followUp: HabitFollowUp | null | undefined,
): number | null {
  const goal = getHabitDailyGoal(habit)
  if (goal <= 0) return null
  return Math.max(0, goal - getCurrentProgressValue(habit, followUp))
}

export function isGoalMet(
  habit: Habit,
  followUp: HabitFollowUp | null | undefined,
  extraAmount = 0,
): boolean {
  const goal = getHabitDailyGoal(habit)
  if (goal <= 0) return false
  return getCurrentProgressValue(habit, followUp) + extraAmount >= goal
}
