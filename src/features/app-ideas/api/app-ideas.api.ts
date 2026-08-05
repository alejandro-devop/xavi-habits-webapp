import {
  APP_IDEA_ADD_MUTATION,
  APP_IDEA_EDIT_MUTATION,
  APP_IDEA_QUERY,
  APP_IDEA_REMOVE_MUTATION,
  APP_IDEAS_QUERY,
} from '@/features/app-ideas/graphql/app-ideas.graphql'
import type {
  AppIdea,
  AppIdeaCollection,
  AppIdeaEditInput,
  AppIdeaInput,
  AppIdeasFilters,
} from '@/features/app-ideas/types/app-idea.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

export async function getAppIdeas(filters: AppIdeasFilters = {}): Promise<AppIdeaCollection> {
  const data = await graphqlRequest<{ appIdeas: AppIdeaCollection }, AppIdeasFilters>(
    APP_IDEAS_QUERY,
    filters,
  )
  return data.appIdeas
}

export async function getAppIdea(id: string): Promise<AppIdea | null> {
  const data = await graphqlRequest<{ appIdea: AppIdea | null }, { id: string }>(APP_IDEA_QUERY, {
    id,
  })
  return data.appIdea
}

export async function createAppIdea(input: AppIdeaInput): Promise<AppIdea> {
  const data = await graphqlRequest<{ appIdeaAdd: AppIdea }, { input: AppIdeaInput }>(
    APP_IDEA_ADD_MUTATION,
    { input },
  )
  return data.appIdeaAdd
}

export async function updateAppIdea(input: AppIdeaEditInput): Promise<AppIdea> {
  const data = await graphqlRequest<{ appIdeaEdit: AppIdea }, { input: AppIdeaEditInput }>(
    APP_IDEA_EDIT_MUTATION,
    { input },
  )
  return data.appIdeaEdit
}

export async function removeAppIdea(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ appIdeaRemove: boolean }, { id: string }>(
    APP_IDEA_REMOVE_MUTATION,
    { id },
  )
  return data.appIdeaRemove
}
