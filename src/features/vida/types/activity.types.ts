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

export interface ActivitySubtask {
  id: string
  activityId: string
  title: string
  isCompleted: boolean
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface ActivitySubtasksCount {
  total: number
  completed: number
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
  subtasks?: ActivitySubtask[]
  subtasksCount?: ActivitySubtasksCount
}

export interface ActivityInput {
  title: string
  description?: string | null
  status?: ActivityStatus
  priority?: ActivityPriority
  categoryId?: string | null
  scheduledDate?: string | null
}

export interface ActivityEditInput {
  id: string
  title?: string
  description?: string | null
  status?: ActivityStatus
  priority?: ActivityPriority
  categoryId?: string | null
  scheduledDate?: string | null
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
