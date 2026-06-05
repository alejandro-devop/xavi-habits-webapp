import {
  HABIT_PURPOSES_QUERY,
  HABIT_PURPOSE_ADD_MUTATION,
  HABIT_PURPOSE_EDIT_MUTATION,
  HABIT_PURPOSE_REMOVE_MUTATION,
} from '@/features/habits/graphql/habit-purposes.graphql'
import type { HabitPurpose, HabitPurposeInput, HabitPurposeEditInput } from '@/features/habits/types/habit-purpose.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

type HabitPurposesData = { habitPurposes: HabitPurpose[] }
type HabitPurposeAddData = { habitPurposeAdd: HabitPurpose }
type HabitPurposeEditData = { habitPurposeEdit: HabitPurpose }
type HabitPurposeRemoveData = { habitPurposeRemove: boolean }

export async function getHabitPurposes(): Promise<HabitPurpose[]> {
  const data = await graphqlRequest<HabitPurposesData>(HABIT_PURPOSES_QUERY)
  return data.habitPurposes
}

export async function createHabitPurpose(input: HabitPurposeInput): Promise<HabitPurpose> {
  const data = await graphqlRequest<HabitPurposeAddData, { input: HabitPurposeInput }>(
    HABIT_PURPOSE_ADD_MUTATION,
    { input },
  )
  return data.habitPurposeAdd
}

export async function updateHabitPurpose(input: HabitPurposeEditInput): Promise<HabitPurpose> {
  const data = await graphqlRequest<HabitPurposeEditData, { input: HabitPurposeEditInput }>(
    HABIT_PURPOSE_EDIT_MUTATION,
    { input },
  )
  return data.habitPurposeEdit
}

export async function removeHabitPurpose(id: string): Promise<boolean> {
  const data = await graphqlRequest<HabitPurposeRemoveData, { id: string }>(
    HABIT_PURPOSE_REMOVE_MUTATION,
    { id },
  )
  return data.habitPurposeRemove
}
