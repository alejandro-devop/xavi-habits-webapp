import {
  TODO_ADD_MUTATION,
  TODO_COMPLETE_MUTATION,
  TODO_EDIT_MUTATION,
  TODO_FOLDER_ADD_MUTATION,
  TODO_FOLDER_EDIT_MUTATION,
  TODO_FOLDER_REMOVE_MUTATION,
  TODO_FOLDERS_QUERY,
  TODO_QUERY,
  TODO_REMOVE_MUTATION,
  TODO_SUBTASK_ADD_MUTATION,
  TODO_SUBTASK_EDIT_MUTATION,
  TODO_SUBTASK_REMOVE_MUTATION,
  TODO_TAG_ADD_MUTATION,
  TODO_TAG_EDIT_MUTATION,
  TODO_TAG_REMOVE_MUTATION,
  TODO_TAGS_QUERY,
  TODOS_QUERY,
} from '@/features/todos/graphql/todos.graphql'
import type {
  Todo,
  TodoCollection,
  TodoEditInput,
  TodoFilters,
  TodoFolder,
  TodoFolderEditInput,
  TodoFolderInput,
  TodoInput,
  TodoSubtask,
  TodoSubtaskEditInput,
  TodoSubtaskInput,
  TodoSubtaskRemoveInput,
  TodoTag,
  TodoTagEditInput,
  TodoTagInput,
} from '@/features/todos/types/todo.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

export async function getTodos(filters: TodoFilters = {}): Promise<TodoCollection> {
  const data = await graphqlRequest<{ todos: TodoCollection }, TodoFilters>(TODOS_QUERY, filters)
  return data.todos
}

export async function getTodo(id: string): Promise<Todo | null> {
  const data = await graphqlRequest<{ todo: Todo | null }, { id: string }>(TODO_QUERY, { id })
  return data.todo
}

export async function getTodoTags(): Promise<TodoTag[]> {
  const data = await graphqlRequest<{ todoTags: TodoTag[] }>(TODO_TAGS_QUERY)
  return data.todoTags
}

export async function createTodo(input: TodoInput): Promise<Todo> {
  const data = await graphqlRequest<{ todoAdd: Todo }, { input: TodoInput }>(TODO_ADD_MUTATION, {
    input,
  })
  return data.todoAdd
}

export async function updateTodo(input: TodoEditInput): Promise<Todo> {
  const data = await graphqlRequest<{ todoEdit: Todo }, { input: TodoEditInput }>(
    TODO_EDIT_MUTATION,
    { input },
  )
  return data.todoEdit
}

export async function removeTodo(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ todoRemove: boolean }, { id: string }>(TODO_REMOVE_MUTATION, {
    id,
  })
  return data.todoRemove
}

export async function completeTodo(id: string): Promise<Todo> {
  const data = await graphqlRequest<{ todoComplete: Pick<Todo, 'id' | 'status' | 'completedAt'> }, { id: string }>(
    TODO_COMPLETE_MUTATION,
    { id },
  )
  return data.todoComplete as Todo
}

export async function addSubtask(input: TodoSubtaskInput): Promise<TodoSubtask> {
  const data = await graphqlRequest<{ todoSubtaskAdd: TodoSubtask }, { input: TodoSubtaskInput }>(
    TODO_SUBTASK_ADD_MUTATION,
    { input },
  )
  return data.todoSubtaskAdd
}

export async function editSubtask(input: TodoSubtaskEditInput): Promise<TodoSubtask> {
  const data = await graphqlRequest<
    { todoSubtaskEdit: TodoSubtask },
    { input: TodoSubtaskEditInput }
  >(TODO_SUBTASK_EDIT_MUTATION, { input })
  return data.todoSubtaskEdit
}

export async function removeSubtask(input: TodoSubtaskRemoveInput): Promise<boolean> {
  const data = await graphqlRequest<
    { todoSubtaskRemove: boolean },
    { input: TodoSubtaskRemoveInput }
  >(TODO_SUBTASK_REMOVE_MUTATION, { input })
  return data.todoSubtaskRemove
}

export async function createTodoTag(input: TodoTagInput): Promise<TodoTag> {
  const data = await graphqlRequest<{ todoTagAdd: TodoTag }, { input: TodoTagInput }>(
    TODO_TAG_ADD_MUTATION,
    { input },
  )
  return data.todoTagAdd
}

export async function updateTodoTag(input: TodoTagEditInput): Promise<TodoTag> {
  const data = await graphqlRequest<{ todoTagEdit: TodoTag }, { input: TodoTagEditInput }>(
    TODO_TAG_EDIT_MUTATION,
    { input },
  )
  return data.todoTagEdit
}

export async function removeTodoTag(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ todoTagRemove: boolean }, { id: string }>(
    TODO_TAG_REMOVE_MUTATION,
    { id },
  )
  return data.todoTagRemove
}

export async function getTodoFolders(): Promise<TodoFolder[]> {
  const data = await graphqlRequest<{ todoFolders: TodoFolder[] }>(TODO_FOLDERS_QUERY)
  return data.todoFolders
}

export async function createTodoFolder(input: TodoFolderInput): Promise<TodoFolder> {
  const data = await graphqlRequest<{ todoFolderAdd: TodoFolder }, { input: TodoFolderInput }>(
    TODO_FOLDER_ADD_MUTATION,
    { input },
  )
  return data.todoFolderAdd
}

export async function updateTodoFolder(input: TodoFolderEditInput): Promise<TodoFolder> {
  const data = await graphqlRequest<{ todoFolderEdit: TodoFolder }, { input: TodoFolderEditInput }>(
    TODO_FOLDER_EDIT_MUTATION,
    { input },
  )
  return data.todoFolderEdit
}

export async function removeTodoFolder(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ todoFolderRemove: boolean }, { id: string }>(
    TODO_FOLDER_REMOVE_MUTATION,
    { id },
  )
  return data.todoFolderRemove
}
