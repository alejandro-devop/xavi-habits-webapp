import {
  ACTIVITY_CATEGORIES_QUERY,
  ACTIVITY_CATEGORY_ADD_MUTATION,
  ACTIVITY_CATEGORY_EDIT_MUTATION,
  ACTIVITY_CATEGORY_QUERY,
  ACTIVITY_CATEGORY_REMOVE_MUTATION,
} from '@/features/activities/graphql/activity-categories.graphql'
import type {
  ActivityCategory,
  ActivityCategoryEditInput,
  ActivityCategoryInput,
} from '@/features/activities/types/activity-category.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

type ActivityCategoriesData = {
  activityCategories: ActivityCategory[]
}

type ActivityCategoryData = {
  activityCategory: ActivityCategory | null
}

type ActivityCategoryAddData = {
  activityCategoryAdd: ActivityCategory
}

type ActivityCategoryEditData = {
  activityCategoryEdit: ActivityCategory
}

type ActivityCategoryRemoveData = {
  activityCategoryRemove: boolean
}

export async function getActivityCategories(): Promise<ActivityCategory[]> {
  const data = await graphqlRequest<ActivityCategoriesData>(ACTIVITY_CATEGORIES_QUERY)
  return data.activityCategories
}

export async function getActivityCategory(id: string): Promise<ActivityCategory | null> {
  const data = await graphqlRequest<ActivityCategoryData, { id: string }>(
    ACTIVITY_CATEGORY_QUERY,
    { id },
  )
  return data.activityCategory
}

export async function createActivityCategory(
  input: ActivityCategoryInput,
): Promise<ActivityCategory> {
  const data = await graphqlRequest<ActivityCategoryAddData, { input: ActivityCategoryInput }>(
    ACTIVITY_CATEGORY_ADD_MUTATION,
    { input },
  )
  return data.activityCategoryAdd
}

export async function updateActivityCategory(
  input: ActivityCategoryEditInput,
): Promise<ActivityCategory> {
  const data = await graphqlRequest<
    ActivityCategoryEditData,
    { input: ActivityCategoryEditInput }
  >(ACTIVITY_CATEGORY_EDIT_MUTATION, { input })
  return data.activityCategoryEdit
}

export async function deleteActivityCategory(id: string): Promise<boolean> {
  const data = await graphqlRequest<ActivityCategoryRemoveData, { id: string }>(
    ACTIVITY_CATEGORY_REMOVE_MUTATION,
    { id },
  )
  return data.activityCategoryRemove
}
