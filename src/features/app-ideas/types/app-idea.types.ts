export type AppIdeaStatus = 'draft' | 'exploring' | 'building' | 'shipped' | 'archived'

export interface AppIdea {
  id: string
  userId: number
  title: string
  contentMarkdown: string
  status: AppIdeaStatus
  createdAt: string
  updatedAt: string
}

export interface AppIdeaCollection {
  ideas: AppIdea[]
  page: number
  limit: number
  total: number
}

export interface AppIdeaInput {
  title: string
  contentMarkdown?: string
  status?: AppIdeaStatus
}

export interface AppIdeaEditInput {
  id: string
  title?: string
  contentMarkdown?: string
  status?: AppIdeaStatus
}

export interface AppIdeasFilters {
  search?: string
  status?: AppIdeaStatus
  page?: number
  limit?: number
}

export const APP_IDEA_STATUS_LABELS: Record<AppIdeaStatus, string> = {
  draft: 'Borrador',
  exploring: 'Explorando',
  building: 'Construyendo',
  shipped: 'Lanzada',
  archived: 'Archivada',
}

export const APP_IDEA_STATUS_OPTIONS: { value: AppIdeaStatus; label: string }[] = [
  { value: 'draft', label: APP_IDEA_STATUS_LABELS.draft },
  { value: 'exploring', label: APP_IDEA_STATUS_LABELS.exploring },
  { value: 'building', label: APP_IDEA_STATUS_LABELS.building },
  { value: 'shipped', label: APP_IDEA_STATUS_LABELS.shipped },
  { value: 'archived', label: APP_IDEA_STATUS_LABELS.archived },
]
