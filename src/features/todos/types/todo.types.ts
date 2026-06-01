export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TodoFolder {
  id: string
  name: string
  color: string
  orderIndex: number
  todoCount: number
  createdAt: string
  updatedAt: string
}

export interface TodoFolderInput {
  name: string
  color: string
  orderIndex?: number
}

export interface TodoFolderEditInput {
  id: string
  name?: string
  color?: string
  orderIndex?: number
}

export interface TodoTag {
  id: string
  name: string
  color: string
}

export interface TodoSubtask {
  id: string
  todoId: string
  title: string
  isCompleted: boolean
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface TodoSubtasksCount {
  total: number
  completed: number
}

export interface Todo {
  id: string
  userId: number
  title: string
  description: string | null
  status: TodoStatus
  priority: TodoPriority
  dueDate: string | null
  completedAt: string | null
  selectedToday: boolean
  folderId: string | null
  createdAt: string
  updatedAt: string
  subtasks: TodoSubtask[]
  subtasksCount: TodoSubtasksCount
  tags: TodoTag[]
}

export interface TodoCollection {
  todos: Todo[]
  page: number
  limit: number
  total: number
}

export interface TodoFilters {
  status?: TodoStatus | null
  priority?: TodoPriority | null
  tagId?: string | null
  folderId?: string | null
  withoutFolder?: boolean | null
  selectedToday?: boolean | null
  pendingOnly?: boolean | null
  dueBefore?: string | null
  dueAfter?: string | null
  page?: number
  limit?: number
}

export interface TodoInput {
  title: string
  description?: string | null
  status?: TodoStatus
  priority?: TodoPriority
  dueDate?: string | null
  selectedToday?: boolean
  tagIds?: string[]
  folderId?: string | null
}

export interface TodoEditInput {
  id: string
  title?: string
  description?: string | null
  status?: TodoStatus
  priority?: TodoPriority
  dueDate?: string | null
  selectedToday?: boolean
  tagIds?: string[]
  folderId?: string | null
}

export interface TodoSubtaskInput {
  todoId: string
  title: string
  orderIndex?: number
}

export interface TodoSubtaskEditInput {
  todoId: string
  subtaskId: string
  title?: string
  isCompleted?: boolean
  orderIndex?: number
}

export interface TodoSubtaskRemoveInput {
  todoId: string
  subtaskId: string
}

export interface TodoTagInput {
  name: string
  color: string
}

export interface TodoTagEditInput {
  id: string
  name?: string
  color?: string
}
