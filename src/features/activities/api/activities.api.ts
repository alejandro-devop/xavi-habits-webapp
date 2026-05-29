import {
  ACTIVITIES_QUERY,
  ACTIVITY_ADD_MUTATION,
  ACTIVITY_COMPLETE_MUTATION,
  ACTIVITY_EDIT_MUTATION,
  ACTIVITY_PENDING_TODOS_QUERY,
  ACTIVITY_QUERY,
  ACTIVITY_REMOVE_MUTATION,
} from '@/features/activities/graphql/activities.graphql'
import type {
  ActivitiesResponse,
  Activity,
  ActivityEditInput,
  ActivityFilters,
  ActivityInput,
} from '@/features/activities/types/activity.types'
import type { TodoSubtasksCount } from '@/features/todos/types/todo.types'
import type { TodoPriority, TodoStatus } from '@/features/todos/types/todo.types'
import { toGraphQLActivityVariables } from '@/features/activities/utils/activity-filters'
import { graphqlRequest } from '@/shared/api/graphql-client'

type ActivitiesData = {
  activities: ActivitiesResponse
}

type ActivityData = {
  activity: Activity | null
}

type ActivityAddData = {
  activityAdd: Activity
}

type ActivityEditData = {
  activityEdit: Activity
}

type ActivityRemoveData = {
  activityRemove: boolean
}

type ActivityCompleteData = {
  activityComplete: Activity
}

export type ActivityPendingTodo = {
  id: string
  title: string
  status: TodoStatus
  priority: TodoPriority
  folderId: string | null
  subtasksCount: TodoSubtasksCount
}

type ActivityPendingTodosData = {
  activityPendingTodos: ActivityPendingTodo[]
}

export async function getActivities(filters: ActivityFilters = {}): Promise<ActivitiesResponse> {
  const data = await graphqlRequest<ActivitiesData, ReturnType<typeof toGraphQLActivityVariables>>(
    ACTIVITIES_QUERY,
    toGraphQLActivityVariables(filters),
  )
  return data.activities
}

export async function getActivity(id: string): Promise<Activity | null> {
  const data = await graphqlRequest<ActivityData, { id: string }>(ACTIVITY_QUERY, { id })
  return data.activity
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const data = await graphqlRequest<ActivityAddData, { input: ActivityInput }>(ACTIVITY_ADD_MUTATION, {
    input,
  })
  return data.activityAdd
}

export async function updateActivity(input: ActivityEditInput): Promise<Activity> {
  const data = await graphqlRequest<ActivityEditData, { input: ActivityEditInput }>(
    ACTIVITY_EDIT_MUTATION,
    { input },
  )
  return data.activityEdit
}

export async function removeActivity(id: string): Promise<boolean> {
  const data = await graphqlRequest<ActivityRemoveData, { id: string }>(ACTIVITY_REMOVE_MUTATION, {
    id,
  })
  return data.activityRemove
}

export async function completeActivity(id: string): Promise<Activity> {
  const data = await graphqlRequest<ActivityCompleteData, { id: string }>(ACTIVITY_COMPLETE_MUTATION, {
    id,
  })
  return data.activityComplete
}

export async function getActivityPendingTodos(
  activityId: string,
  limit = 50,
): Promise<ActivityPendingTodosData['activityPendingTodos']> {
  const data = await graphqlRequest<
    ActivityPendingTodosData,
    { activityId: string; limit: number }
  >(ACTIVITY_PENDING_TODOS_QUERY, { activityId, limit })
  return data.activityPendingTodos
}
