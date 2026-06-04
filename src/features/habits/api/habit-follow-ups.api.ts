import {
  HABIT_FOLLOW_UP_ADD_MUTATION,
  HABIT_FOLLOW_UP_EDIT_MUTATION,
  HABIT_FOLLOW_UP_REMOVE_MUTATION,
} from '@/features/habits/graphql/habit-follow-ups.graphql'
import type {
  HabitFollowUp,
  HabitFollowUpAddInput,
  HabitFollowUpEditInput,
} from '@/features/habits/types/habit.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

export async function addHabitFollowUp(input: HabitFollowUpAddInput): Promise<HabitFollowUp> {
  const data = await graphqlRequest<
    { habitFollowUpAdd: HabitFollowUp },
    { input: HabitFollowUpAddInput }
  >(HABIT_FOLLOW_UP_ADD_MUTATION, { input })
  return data.habitFollowUpAdd
}

export async function updateHabitFollowUp(input: HabitFollowUpEditInput): Promise<HabitFollowUp> {
  const data = await graphqlRequest<
    { habitFollowUpEdit: HabitFollowUp },
    { input: HabitFollowUpEditInput }
  >(HABIT_FOLLOW_UP_EDIT_MUTATION, { input })
  return data.habitFollowUpEdit
}

export async function removeHabitFollowUp(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ habitFollowUpRemove: boolean }, { id: string }>(
    HABIT_FOLLOW_UP_REMOVE_MUTATION,
    { id },
  )
  return data.habitFollowUpRemove
}
