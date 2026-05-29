import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as todosApi from '@/features/todos/api/todos.api'
import type {
  Todo,
  TodoCollection,
  TodoEditInput,
  TodoFilters,
  TodoFolderEditInput,
  TodoFolderInput,
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

// ─── Cache helpers ────────────────────────────────────────────────────────────

type QC = ReturnType<typeof useQueryClient>

function patchTodoInLists(qc: QC, id: string, patch: Partial<Todo>) {
  qc.setQueriesData<TodoCollection>({ queryKey: todoKeys.lists() }, (old) => {
    if (!old) return old
    return { ...old, todos: old.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) }
  })
}

function removeTodoFromLists(qc: QC, id: string) {
  qc.setQueriesData<TodoCollection>({ queryKey: todoKeys.lists() }, (old) => {
    if (!old) return old
    return { ...old, todos: old.todos.filter((t) => t.id !== id), total: old.total - 1 }
  })
}

function snapshotLists(qc: QC) {
  return qc.getQueriesData<TodoCollection>({ queryKey: todoKeys.lists() })
}

function restoreLists(qc: QC, snapshot: ReturnType<typeof snapshotLists>) {
  for (const [key, data] of snapshot) {
    qc.setQueryData(key, data)
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTodosQuery(filters: TodoFilters = {}) {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: todoKeys.list(filters as Record<string, unknown>),
    enabled,
    queryFn: () => todosApi.getTodos(filters),
    staleTime: 1000 * 60 * 3,
  })
}

export function useTodoQuery(id: string | undefined) {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: todoKeys.detail(id ?? ''),
    enabled: enabled && Boolean(id),
    queryFn: () => todosApi.getTodo(id!),
    staleTime: 1000 * 60 * 2,
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

export function useTodoFoldersQuery() {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: todoKeys.folders.list(),
    enabled,
    queryFn: () => todosApi.getTodoFolders(),
    staleTime: 1000 * 60 * 5,
  })
}

// ─── Todo mutations ───────────────────────────────────────────────────────────

export function useCreateTodoMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: TodoInput) => todosApi.createTodo(input),
    onSuccess: () => {
      // Invalidar solo las listas, nunca detalles ni tags ni folders
      void queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() })
      const previousLists = snapshotLists(queryClient)
      const previousDetail = queryClient.getQueryData<Todo>(todoKeys.detail(variables.id))

      // Solo aplicar campos visibles en la lista de forma optimista
      const listPatch: Partial<Todo> = {}
      if (variables.title !== undefined) listPatch.title = variables.title
      if (variables.status !== undefined) listPatch.status = variables.status
      if (variables.priority !== undefined) listPatch.priority = variables.priority

      if (Object.keys(listPatch).length > 0) {
        patchTodoInLists(queryClient, variables.id, listPatch)
      }
      queryClient.setQueryData<Todo>(todoKeys.detail(variables.id), (old) =>
        old ? { ...old, ...listPatch } : old,
      )
      return { previousLists, previousDetail }
    },
    onError: (_err, variables, context) => {
      if (context?.previousLists) restoreLists(queryClient, context.previousLists)
      if (context?.previousDetail) {
        queryClient.setQueryData(todoKeys.detail(variables.id), context.previousDetail)
      }
      toast.error('No se pudo actualizar la tarea')
    },
    onSuccess: (data, variables) => {
      // Sincronizar con la respuesta real del servidor
      queryClient.setQueryData<Todo>(todoKeys.detail(variables.id), (old) =>
        old ? { ...old, ...data } : data,
      )
      patchTodoInLists(queryClient, variables.id, data)
    },
  })
}

export function useCompleteTodoMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => todosApi.completeTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() })
      const previousLists = snapshotLists(queryClient)
      const previousDetail = queryClient.getQueryData<Todo>(todoKeys.detail(id))

      const patch = { status: 'completed' as const, completedAt: new Date().toISOString() }
      patchTodoInLists(queryClient, id, patch)
      queryClient.setQueryData<Todo>(todoKeys.detail(id), (old) =>
        old ? { ...old, ...patch } : old,
      )
      return { previousLists, previousDetail }
    },
    onError: (_err, id, context) => {
      if (context?.previousLists) restoreLists(queryClient, context.previousLists)
      if (context?.previousDetail) {
        queryClient.setQueryData(todoKeys.detail(id), context.previousDetail)
      }
      toast.error('No se pudo completar la tarea')
    },
    onSuccess: (data, id) => {
      // Sincronizar estado final del servidor
      queryClient.setQueryData<Todo>(todoKeys.detail(id), (old) =>
        old ? { ...old, ...data } : old,
      )
      patchTodoInLists(queryClient, id, data)
    },
  })
}

export function useRemoveTodoMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => todosApi.removeTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() })
      const previousLists = snapshotLists(queryClient)
      removeTodoFromLists(queryClient, id)
      return { previousLists }
    },
    onError: (_err, _id, context) => {
      if (context?.previousLists) restoreLists(queryClient, context.previousLists)
      toast.error('No se pudo eliminar la tarea')
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: todoKeys.detail(id) })
      toast.success('Tarea eliminada')
    },
  })
}

// ─── Subtask mutations ────────────────────────────────────────────────────────

export function useAddSubtaskMutation(todoId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: TodoSubtaskInput) => todosApi.addSubtask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(todoId) })
      // Actualizar subtasksCount en listas sin refetch completo
      queryClient.setQueriesData<TodoCollection>({ queryKey: todoKeys.lists() }, (old) => {
        if (!old) return old
        return {
          ...old,
          todos: old.todos.map((t) =>
            t.id === todoId
              ? { ...t, subtasksCount: { ...t.subtasksCount, total: t.subtasksCount.total + 1 } }
              : t,
          ),
        }
      })
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
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(todoId) })
      // Si se está completando/descompletando, actualizar el contador en listas
      if (variables.isCompleted !== undefined) {
        const delta = variables.isCompleted ? 1 : -1
        queryClient.setQueriesData<TodoCollection>({ queryKey: todoKeys.lists() }, (old) => {
          if (!old) return old
          return {
            ...old,
            todos: old.todos.map((t) =>
              t.id === todoId
                ? {
                    ...t,
                    subtasksCount: {
                      ...t.subtasksCount,
                      completed: t.subtasksCount.completed + delta,
                    },
                  }
                : t,
            ),
          }
        })
      }
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
      queryClient.setQueriesData<TodoCollection>({ queryKey: todoKeys.lists() }, (old) => {
        if (!old) return old
        return {
          ...old,
          todos: old.todos.map((t) =>
            t.id === todoId
              ? { ...t, subtasksCount: { ...t.subtasksCount, total: t.subtasksCount.total - 1 } }
              : t,
          ),
        }
      })
    },
    onError: () => {
      toast.error('No se pudo eliminar la subtarea')
    },
  })
}

// ─── Tag mutations ────────────────────────────────────────────────────────────

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
      // Solo invalidar tags — los todos en lista mostrarán el cambio en el próximo refetch natural
      void queryClient.invalidateQueries({ queryKey: [...todoKeys.all, 'tags'] })
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
      toast.success('Etiqueta eliminada')
    },
    onError: () => {
      toast.error('No se pudo eliminar la etiqueta')
    },
  })
}

// ─── Folder mutations ─────────────────────────────────────────────────────────

export function useCreateTodoFolderMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: TodoFolderInput) => todosApi.createTodoFolder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.folders.all() })
    },
    onError: () => {
      toast.error('No se pudo crear la carpeta')
    },
  })
}

export function useUpdateTodoFolderMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: TodoFolderEditInput) => todosApi.updateTodoFolder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.folders.all() })
    },
    onError: () => {
      toast.error('No se pudo actualizar la carpeta')
    },
  })
}

export function useRemoveTodoFolderMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => todosApi.removeTodoFolder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.folders.all() })
      // Invalidar listas para que los todos sin carpeta aparezcan correctamente
      void queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
      toast.success('Carpeta eliminada')
    },
    onError: () => {
      toast.error('No se pudo eliminar la carpeta')
    },
  })
}
