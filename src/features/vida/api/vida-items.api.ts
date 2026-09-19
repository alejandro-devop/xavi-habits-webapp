import {
  VIDA_ITEM_CREATE_MUTATION,
  VIDA_ITEM_DELETE_MUTATION,
  VIDA_ITEM_UPDATE_MUTATION,
  VIDA_ITEMS_QUERY,
  VIDA_MARK_TAKEN_TODAY_MUTATION,
  VIDA_SUGGESTIONS_FOR_DATE_QUERY,
  VIDA_TAKEN_TODAY_QUERY,
  VIDA_UNMARK_TAKEN_TODAY_MUTATION,
} from '@/features/vida/graphql/vida-items.graphql'
import type {
  VidaItem,
  VidaItemCreateInput,
  VidaItemDeleteInput,
  VidaItemUpdateInput,
  VidaMarkTakenTodayInput,
  VidaSuggestion,
  VidaTakenToday,
  VidaUnmarkTakenTodayInput,
} from '@/features/vida/types/vida-item.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

type VidaItemsData = {
  vidaItems: VidaItem[]
}

type VidaSuggestionsForDateData = {
  vidaSuggestionsForDate: VidaSuggestion[]
}

type VidaTakenTodayData = {
  vidaTakenToday: VidaTakenToday[]
}

type VidaItemCreateData = {
  vidaItemCreate: VidaItem
}

type VidaItemUpdateData = {
  vidaItemUpdate: VidaItem
}

type VidaItemDeleteData = {
  vidaItemDelete: boolean
}

type VidaMarkTakenTodayData = {
  vidaMarkTakenToday: VidaTakenToday
}

type VidaUnmarkTakenTodayData = {
  vidaUnmarkTakenToday: boolean
}

export async function getVidaItems(includeInactive = false): Promise<VidaItem[]> {
  const data = await graphqlRequest<VidaItemsData, { includeInactive: boolean }>(VIDA_ITEMS_QUERY, {
    includeInactive,
  })
  return data.vidaItems ?? []
}

export async function getVidaSuggestionsForDate(date: string): Promise<VidaSuggestion[]> {
  const data = await graphqlRequest<VidaSuggestionsForDateData, { date: string }>(
    VIDA_SUGGESTIONS_FOR_DATE_QUERY,
    { date },
  )
  return data.vidaSuggestionsForDate ?? []
}

export async function getVidaTakenToday(date: string): Promise<VidaTakenToday[]> {
  const data = await graphqlRequest<VidaTakenTodayData, { date: string }>(VIDA_TAKEN_TODAY_QUERY, {
    date,
  })
  return data.vidaTakenToday ?? []
}

export async function createVidaItem(input: VidaItemCreateInput): Promise<VidaItem> {
  const data = await graphqlRequest<VidaItemCreateData, { input: VidaItemCreateInput }>(
    VIDA_ITEM_CREATE_MUTATION,
    { input },
  )
  return data.vidaItemCreate
}

export async function updateVidaItem(input: VidaItemUpdateInput): Promise<VidaItem> {
  const data = await graphqlRequest<VidaItemUpdateData, { input: VidaItemUpdateInput }>(
    VIDA_ITEM_UPDATE_MUTATION,
    { input },
  )
  return data.vidaItemUpdate
}

export async function deleteVidaItem(input: VidaItemDeleteInput): Promise<boolean> {
  const data = await graphqlRequest<VidaItemDeleteData, { input: VidaItemDeleteInput }>(
    VIDA_ITEM_DELETE_MUTATION,
    { input },
  )
  return data.vidaItemDelete
}

export async function markVidaItemTakenToday(
  input: VidaMarkTakenTodayInput,
): Promise<VidaTakenToday> {
  const data = await graphqlRequest<VidaMarkTakenTodayData, { input: VidaMarkTakenTodayInput }>(
    VIDA_MARK_TAKEN_TODAY_MUTATION,
    { input },
  )
  return data.vidaMarkTakenToday
}

export async function unmarkVidaItemTakenToday(
  input: VidaUnmarkTakenTodayInput,
): Promise<boolean> {
  const data = await graphqlRequest<VidaUnmarkTakenTodayData, { input: VidaUnmarkTakenTodayInput }>(
    VIDA_UNMARK_TAKEN_TODAY_MUTATION,
    { input },
  )
  return data.vidaUnmarkTakenToday
}
