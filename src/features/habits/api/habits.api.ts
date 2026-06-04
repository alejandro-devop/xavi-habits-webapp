import {
  HABITS_QUERY,
  HABIT_QUERY,
  HABIT_MY_DAY_QUERY,
  HABIT_WEEK_VIEW_QUERY,
  HABIT_FOLLOW_UPS_IN_DATES_QUERY,
  HABIT_CATEGORIES_QUERY,
  HABIT_ADD_MUTATION,
  HABIT_EDIT_MUTATION,
  HABIT_REMOVE_MUTATION,
  HABIT_COMPLETE_MUTATION,
} from '@/features/habits/graphql/habits.graphql'
import type {
  Habit,
  HabitCategory,
  HabitCollection,
  HabitEditInput,
  HabitFilters,
  HabitFollowUpsDateGroup,
  HabitInput,
  HabitMyDayEntry,
  HabitWeekView,
} from '@/features/habits/types/habit.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

export async function getHabitMyDay(date: string): Promise<HabitMyDayEntry[]> {
  const data = await graphqlRequest<{ habitMyDay: HabitMyDayEntry[] }, { date: string }>(
    HABIT_MY_DAY_QUERY,
    { date },
  )
  return data.habitMyDay
}

export async function getHabits(filters: HabitFilters = {}): Promise<HabitCollection> {
  const data = await graphqlRequest<{ habits: HabitCollection }, HabitFilters>(
    HABITS_QUERY,
    filters,
  )
  return data.habits
}

export async function getHabit(id: string): Promise<Habit | null> {
  const data = await graphqlRequest<{ habit: Habit | null }, { id: string }>(HABIT_QUERY, { id })
  return data.habit
}

export async function getHabitWeekView(habitId: string, weekStart: string): Promise<HabitWeekView> {
  const data = await graphqlRequest<
    { habitWeekView: HabitWeekView },
    { habitId: string; weekStart: string }
  >(HABIT_WEEK_VIEW_QUERY, { habitId, weekStart })
  return data.habitWeekView
}

export async function getHabitFollowUpsInDates(
  from: string,
  to: string,
): Promise<HabitFollowUpsDateGroup[]> {
  const data = await graphqlRequest<
    { habitFollowUpsInDates: HabitFollowUpsDateGroup[] },
    { from: string; to: string }
  >(HABIT_FOLLOW_UPS_IN_DATES_QUERY, { from, to })
  return data.habitFollowUpsInDates
}

export async function getHabitCategories(): Promise<HabitCategory[]> {
  const data = await graphqlRequest<{ habitCategories: HabitCategory[] }, Record<string, never>>(
    HABIT_CATEGORIES_QUERY,
    {},
  )
  return data.habitCategories
}

export async function createHabit(input: HabitInput): Promise<Habit> {
  const data = await graphqlRequest<{ habitAdd: Habit }, { input: HabitInput }>(
    HABIT_ADD_MUTATION,
    { input },
  )
  return data.habitAdd
}

export async function updateHabit(input: HabitEditInput): Promise<Habit> {
  const data = await graphqlRequest<{ habitEdit: Habit }, { input: HabitEditInput }>(
    HABIT_EDIT_MUTATION,
    { input },
  )
  return data.habitEdit
}

export async function removeHabit(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ habitRemove: boolean }, { id: string }>(
    HABIT_REMOVE_MUTATION,
    { id },
  )
  return data.habitRemove
}

export async function completeHabit(id: string): Promise<Habit> {
  const data = await graphqlRequest<{ habitComplete: Habit }, { id: string }>(
    HABIT_COMPLETE_MUTATION,
    { id },
  )
  return data.habitComplete
}
