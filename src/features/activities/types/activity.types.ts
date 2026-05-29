export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface ActivityCategoryRef {
  id: string
  name: string
  icon: string | null
  color: string | null
  description?: string | null
  orderIndex?: number
}

export interface ActivityTodoFolderRef {
  id: string
  name: string
  color: string
  orderIndex: number
}

export interface Activity {
  id: string
  userId: number
  title: string
  description: string | null
  status: ActivityStatus
  priority: ActivityPriority
  categoryId: string | null
  scheduledDate: string | null
  completedAt: string | null
  spentTimeMinutes: number
  createdAt: string
  updatedAt: string
  category?: ActivityCategoryRef | null
  todoFolders?: ActivityTodoFolderRef[]
}

export interface ActivityInput {
  title: string
  description?: string | null
  status?: ActivityStatus
  priority?: ActivityPriority
  categoryId?: string | null
  scheduledDate?: string | null
  todoFolderIds?: string[]
}

export interface ActivityEditInput {
  id: string
  title?: string
  description?: string | null
  status?: ActivityStatus
  priority?: ActivityPriority
  categoryId?: string | null
  scheduledDate?: string | null
  todoFolderIds?: string[]
}

export interface ActivityFilters {
  status?: ActivityStatus | null
  priority?: ActivityPriority | null
  categoryId?: string | null
  startDate?: string | null
  endDate?: string | null
  page?: number
  limit?: number
  search?: string
}

export interface ActivitiesResponse {
  activities: Activity[]
  page: number
  limit: number
  total: number
}

export interface ActivityFormValues {
  title: string
  description: string
  status: ActivityStatus
  priority: ActivityPriority
  categoryId: string | null
  scheduledDate: string
  todoFolderIds: string[]
}
