import {
  ACTIVITY_DAY_PLAN_ITEM_ADD_MUTATION,
  ACTIVITY_DAY_PLAN_ITEM_EDIT_MUTATION,
  ACTIVITY_DAY_PLAN_ITEM_REMOVE_MUTATION,
  ACTIVITY_DAY_PLAN_QUERY,
  ACTIVITY_DAY_PLAN_SET_MUTATION,
} from '@/features/vida/graphql/activity-day-plan.graphql'
import type {
  ActivityDayPlanItem,
  ActivityDayPlanItemAddInput,
  ActivityDayPlanItemEditInput,
  ActivityDayPlanItemRemoveInput,
  ActivityDayPlanSetInput,
} from '@/features/vida/types/activity-day-plan.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

type ActivityDayPlanData = {
  activityDayPlan: ActivityDayPlanItem[]
}

type ActivityDayPlanSetData = {
  activityDayPlanSet: ActivityDayPlanItem[]
}

type ActivityDayPlanItemAddData = {
  activityDayPlanItemAdd: ActivityDayPlanItem
}

type ActivityDayPlanItemEditData = {
  activityDayPlanItemEdit: ActivityDayPlanItem
}

type ActivityDayPlanItemRemoveData = {
  activityDayPlanItemRemove: boolean
}

export async function getActivityDayPlan(date: string): Promise<ActivityDayPlanItem[]> {
  const data = await graphqlRequest<ActivityDayPlanData, { date: string }>(
    ACTIVITY_DAY_PLAN_QUERY,
    { date },
  )
  return data.activityDayPlan ?? []
}

export async function setActivityDayPlan(
  input: ActivityDayPlanSetInput,
): Promise<ActivityDayPlanItem[]> {
  const data = await graphqlRequest<ActivityDayPlanSetData, { input: ActivityDayPlanSetInput }>(
    ACTIVITY_DAY_PLAN_SET_MUTATION,
    { input },
  )
  return data.activityDayPlanSet ?? []
}

export async function addActivityDayPlanItem(
  input: ActivityDayPlanItemAddInput,
): Promise<ActivityDayPlanItem> {
  const data = await graphqlRequest<
    ActivityDayPlanItemAddData,
    { input: ActivityDayPlanItemAddInput }
  >(ACTIVITY_DAY_PLAN_ITEM_ADD_MUTATION, { input })
  return data.activityDayPlanItemAdd
}

export async function editActivityDayPlanItem(
  input: ActivityDayPlanItemEditInput,
): Promise<ActivityDayPlanItem> {
  const data = await graphqlRequest<
    ActivityDayPlanItemEditData,
    { input: ActivityDayPlanItemEditInput }
  >(ACTIVITY_DAY_PLAN_ITEM_EDIT_MUTATION, { input })
  return data.activityDayPlanItemEdit
}

export async function removeActivityDayPlanItem(
  input: ActivityDayPlanItemRemoveInput,
): Promise<boolean> {
  const data = await graphqlRequest<
    ActivityDayPlanItemRemoveData,
    { input: ActivityDayPlanItemRemoveInput }
  >(ACTIVITY_DAY_PLAN_ITEM_REMOVE_MUTATION, { input })
  return data.activityDayPlanItemRemove
}
