import type { TodoTag } from '@/features/todos/types/todo.types'

export type { TodoTag }

export interface Note {
  id: string
  userId: number
  content: string
  tags: TodoTag[]
  createdAt: string
  updatedAt: string
}

export interface NoteCollection {
  notes: Note[]
  page: number
  limit: number
  total: number
}

export interface NoteInput {
  content: string
  tagIds?: string[]
}

export interface NoteEditInput {
  id: string
  content?: string
  tagIds?: string[]
}

export interface NotesFilters {
  tagId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}
