import {
  HABIT_CATEGORY_QUERY,
  HABIT_CATEGORY_ADD_MUTATION,
  HABIT_CATEGORY_EDIT_MUTATION,
  HABIT_CATEGORY_REMOVE_MUTATION,
} from '@/features/habits/graphql/habit-categories.graphql'
import type {
  HabitCategoryEditInput,
  HabitCategoryInput,
} from '@/features/habits/types/habit-category.types'
import type { HabitCategory } from '@/features/habits/types/habit.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

type HabitCategoryData = {
  habitCategory: HabitCategory | null
}

type HabitCategoryAddData = {
  habitCategoryAdd: HabitCategory
}

type HabitCategoryEditData = {
  habitCategoryEdit: HabitCategory
}

type HabitCategoryRemoveData = {
  habitCategoryRemove: boolean
}

export async function getHabitCategory(id: string): Promise<HabitCategory | null> {
  const data = await graphqlRequest<HabitCategoryData, { id: string }>(HABIT_CATEGORY_QUERY, { id })
  return data.habitCategory
}

export async function createHabitCategory(input: HabitCategoryInput): Promise<HabitCategory> {
  const data = await graphqlRequest<HabitCategoryAddData, { input: HabitCategoryInput }>(
    HABIT_CATEGORY_ADD_MUTATION,
    { input },
  )
  return data.habitCategoryAdd
}

export async function updateHabitCategory(
  input: HabitCategoryEditInput,
): Promise<HabitCategory> {
  const data = await graphqlRequest<HabitCategoryEditData, { input: HabitCategoryEditInput }>(
    HABIT_CATEGORY_EDIT_MUTATION,
    { input },
  )
  return data.habitCategoryEdit
}

export async function removeHabitCategory(id: string): Promise<boolean> {
  const data = await graphqlRequest<HabitCategoryRemoveData, { id: string }>(
    HABIT_CATEGORY_REMOVE_MUTATION,
    { id },
  )
  return data.habitCategoryRemove
}
