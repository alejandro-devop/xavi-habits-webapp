import {
  WEEKLY_ROUTINES_QUERY,
  WEEKLY_ROUTINE_QUERY,
  WEEKLY_ROUTINE_ACTIVE_QUERY,
  WEEKLY_ROUTINE_ADD_MUTATION,
  WEEKLY_ROUTINE_EDIT_MUTATION,
  WEEKLY_ROUTINE_REMOVE_MUTATION,
  WEEKLY_ROUTINE_SET_ACTIVE_MUTATION,
  WEEKLY_ROUTINE_TOGGLE_ACTIVE_MUTATION,
  WEEKLY_ROUTINE_ACTIVITY_ADD_MUTATION,
  WEEKLY_ROUTINE_ACTIVITY_EDIT_MUTATION,
  WEEKLY_ROUTINE_ACTIVITY_REMOVE_MUTATION,
} from '@/features/weekly-routine/graphql/weekly-routine.graphql'
import type {
  WeeklyRoutine,
  WeeklyRoutineActivity,
  WeeklyRoutineActivityEditInput,
  WeeklyRoutineActivityInput,
  WeeklyRoutineCollection,
  WeeklyRoutineEditInput,
  WeeklyRoutineInput,
} from '@/features/weekly-routine/types/weekly-routine.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

type RoutinesData = { weeklyRoutines: WeeklyRoutineCollection }
type RoutineData = { weeklyRoutine: WeeklyRoutine | null }
type RoutineActiveData = { weeklyRoutineActive: WeeklyRoutine | null }
type RoutineAddData = { weeklyRoutineAdd: WeeklyRoutine }
type RoutineEditData = { weeklyRoutineEdit: WeeklyRoutine }
type RoutineRemoveData = { weeklyRoutineRemove: boolean }
type RoutineSetActiveData = { weeklyRoutineSetActive: WeeklyRoutine }
type RoutineToggleActiveData = { weeklyRoutineToggleActive: WeeklyRoutine }
type ActivityAddData = { weeklyRoutineActivityAdd: WeeklyRoutineActivity }
type ActivityEditData = { weeklyRoutineActivityEdit: WeeklyRoutineActivity }
type ActivityRemoveData = { weeklyRoutineActivityRemove: boolean }

export type ListWeeklyRoutinesParams = {
  isActive?: boolean
  page?: number
  limit?: number
}

export async function getWeeklyRoutines(
  params: ListWeeklyRoutinesParams = {},
): Promise<WeeklyRoutineCollection> {
  const data = await graphqlRequest<RoutinesData, ListWeeklyRoutinesParams>(
    WEEKLY_ROUTINES_QUERY,
    params,
  )
  return data.weeklyRoutines
}

export async function getWeeklyRoutine(id: string): Promise<WeeklyRoutine | null> {
  const data = await graphqlRequest<RoutineData, { id: string }>(WEEKLY_ROUTINE_QUERY, { id })
  return data.weeklyRoutine
}

export async function getActiveWeeklyRoutine(): Promise<WeeklyRoutine | null> {
  const data = await graphqlRequest<RoutineActiveData>(WEEKLY_ROUTINE_ACTIVE_QUERY)
  return data.weeklyRoutineActive
}

export async function createWeeklyRoutine(input: WeeklyRoutineInput): Promise<WeeklyRoutine> {
  const data = await graphqlRequest<RoutineAddData, { input: WeeklyRoutineInput }>(
    WEEKLY_ROUTINE_ADD_MUTATION,
    { input },
  )
  return data.weeklyRoutineAdd
}

export async function updateWeeklyRoutine(input: WeeklyRoutineEditInput): Promise<WeeklyRoutine> {
  const data = await graphqlRequest<RoutineEditData, { input: WeeklyRoutineEditInput }>(
    WEEKLY_ROUTINE_EDIT_MUTATION,
    { input },
  )
  return data.weeklyRoutineEdit
}

export async function removeWeeklyRoutine(id: string): Promise<boolean> {
  const data = await graphqlRequest<RoutineRemoveData, { id: string }>(
    WEEKLY_ROUTINE_REMOVE_MUTATION,
    { id },
  )
  return data.weeklyRoutineRemove
}

export async function setWeeklyRoutineActive(id: string): Promise<WeeklyRoutine> {
  const data = await graphqlRequest<RoutineSetActiveData, { id: string }>(
    WEEKLY_ROUTINE_SET_ACTIVE_MUTATION,
    { id },
  )
  return data.weeklyRoutineSetActive
}

export async function toggleWeeklyRoutineActive(id: string): Promise<WeeklyRoutine> {
  const data = await graphqlRequest<RoutineToggleActiveData, { id: string }>(
    WEEKLY_ROUTINE_TOGGLE_ACTIVE_MUTATION,
    { id },
  )
  return data.weeklyRoutineToggleActive
}

export async function addWeeklyRoutineActivity(
  input: WeeklyRoutineActivityInput,
): Promise<WeeklyRoutineActivity> {
  const data = await graphqlRequest<ActivityAddData, { input: WeeklyRoutineActivityInput }>(
    WEEKLY_ROUTINE_ACTIVITY_ADD_MUTATION,
    { input },
  )
  return data.weeklyRoutineActivityAdd
}

export async function updateWeeklyRoutineActivity(
  input: WeeklyRoutineActivityEditInput,
): Promise<WeeklyRoutineActivity> {
  const data = await graphqlRequest<ActivityEditData, { input: WeeklyRoutineActivityEditInput }>(
    WEEKLY_ROUTINE_ACTIVITY_EDIT_MUTATION,
    { input },
  )
  return data.weeklyRoutineActivityEdit
}

export async function removeWeeklyRoutineActivity(id: string): Promise<boolean> {
  const data = await graphqlRequest<ActivityRemoveData, { id: string }>(
    WEEKLY_ROUTINE_ACTIVITY_REMOVE_MUTATION,
    { id },
  )
  return data.weeklyRoutineActivityRemove
}
