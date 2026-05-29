import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as todosApi from '@/features/todos/api/todos.api'
import type {
  TodoEditInput,
  TodoFilters,
  TodoInput,
  TodoSubtaskEditInput,
  TodoSubtaskInput,
  TodoSubtaskRemoveInput,
  TodoTagEditInput,
  TodoTagInput,
} from '@/features/todos/types/todo.types'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { todoKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

function useAuthReady() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}

export function useTodosQuery(filters: TodoFilters = {}) {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: todoKeys.list(filters as Record<string, unknown>),
    enabled,
    queryFn: () => todosApi.getTodos(filters),
    staleTime: 1000 * 30,
  })
}

export function useTodoQuery(id: string | undefined) {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: todoKeys.detail(id ?? ''),
    enabled: enabled && Boolean(id),
    queryFn: () => todosApi.getTodo(id!),
    staleTime: 1000 * 30,
  })
}

export function useTodoTagsQuery() {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: [...todoKeys.all, 'tags'],
    enabled,
    queryFn: () => todosApi.getTodoTags(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateTodoMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: TodoInput) => todosApi.createTodo(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
    onError: () => {
      toast.error('No se pudo crear la tarea')
    },
  })
}

export function useUpdateTodoMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: TodoEditInput) => todosApi.updateTodo(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.all })
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) })
    },
    onError: () => {
      toast.error('No se pudo actualizar la tarea')
    },
  })
}

export function useCompleteTodoMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => todosApi.completeTodo(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.all })
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(id) })
    },
    onError: () => {
      toast.error('No se pudo completar la tarea')
    },
  })
}

export function useRemoveTodoMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => todosApi.removeTodo(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.all })
      toast.success('Tarea eliminada')
    },
    onError: () => {
      toast.error('No se pudo eliminar la tarea')
    },
  })
}

export function useAddSubtaskMutation(todoId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: TodoSubtaskInput) => todosApi.addSubtask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(todoId) })
      void queryClient.invalidateQueries({ queryKey: todoKeys.list() })
    },
    onError: () => {
      toast.error('No se pudo añadir la subtarea')
    },
  })
}

export function useEditSubtaskMutation(todoId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: TodoSubtaskEditInput) => todosApi.editSubtask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(todoId) })
      void queryClient.invalidateQueries({ queryKey: todoKeys.list() })
    },
    onError: () => {
      toast.error('No se pudo actualizar la subtarea')
    },
  })
}

export function useRemoveSubtaskMutation(todoId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: TodoSubtaskRemoveInput) => todosApi.removeSubtask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(todoId) })
      void queryClient.invalidateQueries({ queryKey: todoKeys.list() })
    },
    onError: () => {
      toast.error('No se pudo eliminar la subtarea')
    },
  })
}

export function useCreateTodoTagMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: TodoTagInput) => todosApi.createTodoTag(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...todoKeys.all, 'tags'] })
    },
    onError: () => {
      toast.error('No se pudo crear la etiqueta')
    },
  })
}

export function useUpdateTodoTagMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TodoTagEditInput) => todosApi.updateTodoTag(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...todoKeys.all, 'tags'] })
      void queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export function useRemoveTodoTagMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => todosApi.removeTodoTag(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...todoKeys.all, 'tags'] })
      void queryClient.invalidateQueries({ queryKey: todoKeys.all })
      toast.success('Etiqueta eliminada')
    },
    onError: () => {
      toast.error('No se pudo eliminar la etiqueta')
    },
  })
}
