import { graphqlRequest } from '@/shared/api/graphql-client'
import {
  STANDUP_CARRY_OVER_MUTATION,
  STANDUP_CLOSE_DAY_MUTATION,
  STANDUP_DAY_QUERY,
  STANDUP_DAY_SUMMARY_QUERY,
  STANDUP_ITEM_CREATE_MUTATION,
  STANDUP_ITEM_CREATE_TODO_MUTATION,
  STANDUP_ITEM_DELETE_MUTATION,
  STANDUP_ITEM_UPDATE_MUTATION,
  STANDUP_MEMBER_CREATE_MUTATION,
  STANDUP_MEMBER_DELETE_MUTATION,
  STANDUP_MEMBER_UPDATE_MUTATION,
  STANDUP_MEMBERS_QUERY,
  STANDUP_OPEN_DAY_MUTATION,
} from '@/features/activities/graphql/standup.graphql'
import type {
  StandupDay,
  StandupDaySummary,
  StandupDayView,
  StandupItem,
  StandupItemCreateInput,
  StandupItemUpdateInput,
  StandupMember,
  StandupMemberCreateInput,
  StandupMemberUpdateInput,
} from '@/features/activities/types/standup.types'

export async function getStandupMembers(includeInactive = false): Promise<StandupMember[]> {
  const data = await graphqlRequest<{ standupMembers: StandupMember[] }, { includeInactive?: boolean }>(
    STANDUP_MEMBERS_QUERY,
    { includeInactive },
  )
  return data.standupMembers ?? []
}

export async function getStandupDay(date: string): Promise<StandupDayView> {
  const data = await graphqlRequest<{ standupDay: StandupDayView }, { date: string }>(
    STANDUP_DAY_QUERY,
    { date },
  )
  return (
    data.standupDay ?? {
      day: null,
      items: [],
      carryOverCandidates: [],
    }
  )
}

export async function getStandupDaySummary(date: string): Promise<StandupDaySummary> {
  const data = await graphqlRequest<{ standupDaySummary: StandupDaySummary }, { date: string }>(
    STANDUP_DAY_SUMMARY_QUERY,
    { date },
  )
  return data.standupDaySummary
}

export async function createStandupMember(input: StandupMemberCreateInput): Promise<StandupMember> {
  const data = await graphqlRequest<
    { standupMemberCreate: StandupMember },
    { input: StandupMemberCreateInput }
  >(STANDUP_MEMBER_CREATE_MUTATION, { input })
  return data.standupMemberCreate
}

export async function updateStandupMember(input: StandupMemberUpdateInput): Promise<StandupMember> {
  const data = await graphqlRequest<
    { standupMemberUpdate: StandupMember },
    { input: StandupMemberUpdateInput }
  >(STANDUP_MEMBER_UPDATE_MUTATION, { input })
  return data.standupMemberUpdate
}

export async function deleteStandupMember(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ standupMemberDelete: boolean }, { input: { id: string } }>(
    STANDUP_MEMBER_DELETE_MUTATION,
    { input: { id } },
  )
  return data.standupMemberDelete
}

export async function openStandupDay(date: string): Promise<StandupDayView> {
  const data = await graphqlRequest<{ standupOpenDay: StandupDayView }, { input: { date: string } }>(
    STANDUP_OPEN_DAY_MUTATION,
    { input: { date } },
  )
  return data.standupOpenDay
}

export async function closeStandupDay(date: string): Promise<StandupDay> {
  const data = await graphqlRequest<{ standupCloseDay: StandupDay }, { input: { date: string } }>(
    STANDUP_CLOSE_DAY_MUTATION,
    { input: { date } },
  )
  return data.standupCloseDay
}

export async function carryOverStandupItems(date: string, itemIds: string[]): Promise<StandupItem[]> {
  const data = await graphqlRequest<
    { standupCarryOver: StandupItem[] },
    { input: { date: string; itemIds: string[] } }
  >(STANDUP_CARRY_OVER_MUTATION, { input: { date, itemIds } })
  return data.standupCarryOver ?? []
}

export async function createStandupItem(input: StandupItemCreateInput): Promise<StandupItem> {
  const data = await graphqlRequest<
    { standupItemCreate: StandupItem },
    { input: StandupItemCreateInput }
  >(STANDUP_ITEM_CREATE_MUTATION, { input })
  return data.standupItemCreate
}

export async function updateStandupItem(input: StandupItemUpdateInput): Promise<StandupItem> {
  const data = await graphqlRequest<
    { standupItemUpdate: StandupItem },
    { input: StandupItemUpdateInput }
  >(STANDUP_ITEM_UPDATE_MUTATION, { input })
  return data.standupItemUpdate
}

export async function deleteStandupItem(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ standupItemDelete: boolean }, { input: { id: string } }>(
    STANDUP_ITEM_DELETE_MUTATION,
    { input: { id } },
  )
  return data.standupItemDelete
}

export async function createTodoFromStandupItem(itemId: string): Promise<{ id: string; title: string }> {
  const data = await graphqlRequest<
    { standupItemCreateTodo: { id: string; title: string } },
    { input: { itemId: string } }
  >(STANDUP_ITEM_CREATE_TODO_MUTATION, { input: { itemId } })
  return data.standupItemCreateTodo
}
