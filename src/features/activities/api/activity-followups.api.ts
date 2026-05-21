import {
  ACTIVITY_DAY_FOLLOW_UPS_QUERY,
  ACTIVITY_FOLLOW_UP_ADD_MUTATION,
  ACTIVITY_FOLLOW_UP_EDIT_MUTATION,
  ACTIVITY_FOLLOW_UP_REMOVE_MUTATION,
  ACTIVITY_FOLLOW_UPS_IN_DATES_QUERY,
} from '@/features/activities/graphql/activity-followups.graphql'
import type {
  ActivityDayFollowUp,
  ActivityFollowUp,
  ActivityFollowUpEditInput,
  ActivityFollowUpInput,
  ActivityFollowUpsDateGroup,
} from '@/features/activities/types/activity-followup.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

type ActivityDayFollowUpsData = {
  activityDayFollowUps: ActivityDayFollowUp[]
}

type ActivityFollowUpsInDatesData = {
  activityFollowUpsInDates: ActivityFollowUpsDateGroup[]
}

type ActivityFollowUpAddData = {
  activityFollowUpAdd: ActivityFollowUp
}

type ActivityFollowUpEditData = {
  activityFollowUpEdit: ActivityFollowUp
}

type ActivityFollowUpRemoveData = {
  activityFollowUpRemove: boolean
}

export async function getActivityDayFollowUps(date: string): Promise<ActivityDayFollowUp[]> {
  const data = await graphqlRequest<ActivityDayFollowUpsData, { date: string }>(
    ACTIVITY_DAY_FOLLOW_UPS_QUERY,
    { date },
  )
  return data.activityDayFollowUps ?? []
}

export async function getActivityFollowUpsInDates(
  from: string,
  to: string,
): Promise<ActivityFollowUpsDateGroup[]> {
  const data = await graphqlRequest<ActivityFollowUpsInDatesData, { from: string; to: string }>(
    ACTIVITY_FOLLOW_UPS_IN_DATES_QUERY,
    { from, to },
  )
  return data.activityFollowUpsInDates ?? []
}

export async function createActivityFollowUp(
  input: ActivityFollowUpInput,
): Promise<ActivityFollowUp> {
  const data = await graphqlRequest<ActivityFollowUpAddData, { input: ActivityFollowUpInput }>(
    ACTIVITY_FOLLOW_UP_ADD_MUTATION,
    { input },
  )
  return data.activityFollowUpAdd
}

export async function updateActivityFollowUp(
  input: ActivityFollowUpEditInput,
): Promise<ActivityFollowUp> {
  const data = await graphqlRequest<
    ActivityFollowUpEditData,
    { input: ActivityFollowUpEditInput }
  >(ACTIVITY_FOLLOW_UP_EDIT_MUTATION, { input })
  return data.activityFollowUpEdit
}

export async function deleteActivityFollowUp(id: string): Promise<boolean> {
  const data = await graphqlRequest<ActivityFollowUpRemoveData, { id: string }>(
    ACTIVITY_FOLLOW_UP_REMOVE_MUTATION,
    { id },
  )
  return data.activityFollowUpRemove
}
