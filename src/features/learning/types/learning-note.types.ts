export interface LearningTag {
  id: string
  name: string
  slug: string
}

export interface LearningNote {
  id: string
  userId: number
  title: string
  contentMarkdown: string
  tags: LearningTag[]
  createdAt: string
  updatedAt: string
}

export interface LearningNoteCollection {
  notes: LearningNote[]
  page: number
  limit: number
  total: number
}

export interface LearningNoteInput {
  title: string
  contentMarkdown?: string
  tagIds?: string[]
}

export interface LearningNoteEditInput {
  id: string
  title?: string
  contentMarkdown?: string
  tagIds?: string[]
}

export interface LearningTagInput {
  name: string
}

export interface LearningNotesFilters {
  search?: string
  tags?: string[]
  page?: number
  limit?: number
}
