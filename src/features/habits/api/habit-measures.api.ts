import {
  HABIT_MEASURE_QUERY,
  HABIT_MEASURE_ADD_MUTATION,
  HABIT_MEASURE_EDIT_MUTATION,
  HABIT_MEASURE_REMOVE_MUTATION,
} from '@/features/habits/graphql/habit-measures.graphql'
import type {
  HabitMeasureEditInput,
  HabitMeasureInput,
} from '@/features/habits/types/habit-measure.types'
import type { HabitMeasure } from '@/features/habits/types/habit.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

type HabitMeasureData = {
  habitMeasure: HabitMeasure | null
}

type HabitMeasureAddData = {
  habitMeasureAdd: HabitMeasure
}

type HabitMeasureEditData = {
  habitMeasureEdit: HabitMeasure
}

type HabitMeasureRemoveData = {
  habitMeasureRemove: boolean
}

export async function getHabitMeasure(id: string): Promise<HabitMeasure | null> {
  const data = await graphqlRequest<HabitMeasureData, { id: string }>(HABIT_MEASURE_QUERY, { id })
  return data.habitMeasure
}

export async function createHabitMeasure(input: HabitMeasureInput): Promise<HabitMeasure> {
  const data = await graphqlRequest<HabitMeasureAddData, { input: HabitMeasureInput }>(
    HABIT_MEASURE_ADD_MUTATION,
    { input },
  )
  return data.habitMeasureAdd
}

export async function updateHabitMeasure(input: HabitMeasureEditInput): Promise<HabitMeasure> {
  const data = await graphqlRequest<HabitMeasureEditData, { input: HabitMeasureEditInput }>(
    HABIT_MEASURE_EDIT_MUTATION,
    { input },
  )
  return data.habitMeasureEdit
}

export async function removeHabitMeasure(id: string): Promise<boolean> {
  const data = await graphqlRequest<HabitMeasureRemoveData, { id: string }>(
    HABIT_MEASURE_REMOVE_MUTATION,
    { id },
  )
  return data.habitMeasureRemove
}
