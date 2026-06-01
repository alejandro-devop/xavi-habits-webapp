import { useEffect } from 'react'
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

function addTodoToTodayCache(qc: QC, todo: Todo) {
  const allLists = qc.getQueriesData<TodoCollection>({ queryKey: todoKeys.lists() })
  for (const [key, data] of allLists) {
    if (!data) continue
    const filters = key[2] as Record<string, unknown> | undefined
    if (filters?.selectedToday !== true) continue
    if (data.todos.some((t) => t.id === todo.id)) continue
    qc.setQueryData(key, { ...data, todos: [todo, ...data.todos], total: data.total + 1 })
  }
}

function removeTodoFromTodayCache(qc: QC, id: string) {
  const allLists = qc.getQueriesData<TodoCollection>({ queryKey: todoKeys.lists() })
  for (const [key, data] of allLists) {
    if (!data) continue
    const filters = key[2] as Record<string, unknown> | undefined
    if (filters?.selectedToday !== true) continue
    if (!data.todos.some((t) => t.id === id)) continue
    qc.setQueryData(key, {
      ...data,
      todos: data.todos.filter((t) => t.id !== id),
      total: data.total - 1,
    })
  }
}

function addTodoToFolderCache(qc: QC, todo: Todo, folderId: string) {
  const allLists = qc.getQueriesData<TodoCollection>({ queryKey: todoKeys.lists() })
  for (const [key, data] of allLists) {
    if (!data) continue
    const filters = key[2] as Record<string, unknown> | undefined
    if (filters?.folderId !== folderId) continue
    if (data.todos.some((t) => t.id === todo.id)) continue
    qc.setQueryData(key, { ...data, todos: [todo, ...data.todos], total: data.total + 1 })
  }
}

function removeTodoFromMismatchedFolderLists(qc: QC, id: string, newFolderId: string | null) {
  const allLists = qc.getQueriesData<TodoCollection>({ queryKey: todoKeys.lists() })
  for (const [key, data] of allLists) {
    if (!data) continue
    const filters = key[2] as Record<string, unknown> | undefined
    const shouldRemove =
      (filters?.folderId !== undefined && filters.folderId !== newFolderId) ||
      (filters?.withoutFolder === true && newFolderId !== null)
    if (!shouldRemove) continue
    if (!data.todos.some((t) => t.id === id)) continue
    qc.setQueryData(key, {
      ...data,
      todos: data.todos.filter((t) => t.id !== id),
      total: data.total - 1,
    })
  }
}

// Quita un ítem del caché de la carpeta Suggested (selectedToday === false)
function removeTodoFromSuggestedCache(qc: QC, id: string) {
  const allLists = qc.getQueriesData<TodoCollection>({ queryKey: todoKeys.lists() })
  for (const [key, data] of allLists) {
    if (!data) continue
    const filters = key[2] as Record<string, unknown> | undefined
    if (filters?.selectedToday !== false) continue
    if (!data.todos.some((t) => t.id === id)) continue
    qc.setQueryData(key, {
      ...data,
      todos: data.todos.filter((t) => t.id !== id),
      total: data.total - 1,
    })
  }
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
  const queryClient = useQueryClient()
  const enabled = useAuthReady()
  const query = useQuery({
    queryKey: todoKeys.detail(id ?? ''),
    enabled: enabled && Boolean(id),
    queryFn: () => todosApi.getTodo(id!),
    staleTime: 1000 * 60 * 2,
  })

  // El detalle siempre trae subtasks/subtasksCount correctos desde el servidor.
  // Si el cache de lista tiene datos desincronizados (ej. servidor devuelve
  // subtasksCount incorrecto en la query de lista), esto los corrige al abrir el drawer.
  const todo = query.data
  useEffect(() => {
    if (!todo) return
    patchTodoInLists(queryClient, todo.id, {
      subtasks: todo.subtasks,
      subtasksCount: todo.subtasksCount,
    })
  }, [todo, queryClient])

  return query
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
      if (variables.selectedToday !== undefined) listPatch.selectedToday = variables.selectedToday
      if (variables.folderId !== undefined) listPatch.folderId = variables.folderId ?? null

      const detailPatch: Partial<Todo> = { ...listPatch }
      if (variables.description !== undefined) detailPatch.description = variables.description

      if (Object.keys(listPatch).length > 0) {
        patchTodoInLists(queryClient, variables.id, listPatch)
      }

      // Mover el todo entre listas de carpeta optimistamente
      if (variables.folderId !== undefined) {
        removeTodoFromMismatchedFolderLists(queryClient, variables.id, variables.folderId ?? null)
        // Agregar a la carpeta destino si su lista ya está en cache
        if (variables.folderId) {
          let sourceTodo: Todo | undefined
          for (const [, data] of previousLists) {
            sourceTodo = data?.todos.find((t) => t.id === variables.id)
            if (sourceTodo) break
          }
          if (!sourceTodo) sourceTodo = previousDetail ?? undefined
          if (sourceTodo) {
            addTodoToFolderCache(queryClient, { ...sourceTodo, ...listPatch }, variables.folderId)
          }
        }
      }

      // Mantener los cachés virtuales sincronizados inmediatamente sin esperar refetch
      if (variables.selectedToday === true) {
        // Buscar el todo en los snapshots para agregarlo al caché de "Hoy"
        let sourceTodo: Todo | undefined
        for (const [, data] of previousLists) {
          sourceTodo = data?.todos.find((t) => t.id === variables.id)
          if (sourceTodo) break
        }
        if (!sourceTodo) sourceTodo = previousDetail ?? undefined
        if (sourceTodo) addTodoToTodayCache(queryClient, { ...sourceTodo, ...listPatch })
        // También quitarlo de Suggested (ya no es un candidato)
        removeTodoFromSuggestedCache(queryClient, variables.id)
      } else if (variables.selectedToday === false) {
        removeTodoFromTodayCache(queryClient, variables.id)
        // Si pasa a no-hoy, Suggested se actualiza vía invalidateQueries en onSuccess
      }

      queryClient.setQueryData<Todo>(todoKeys.detail(variables.id), (old) =>
        old ? { ...old, ...detailPatch } : old,
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
      // selectedToday y folderId mueven la tarea entre listas filtradas — invalidar todas (activas e inactivas)
      if (variables.selectedToday !== undefined || variables.folderId !== undefined) {
        void queryClient.invalidateQueries({ queryKey: todoKeys.lists(), refetchType: 'all' })
      } else {
        patchTodoInLists(queryClient, variables.id, data)
      }
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
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(todoId) })
      queryClient.setQueriesData<TodoCollection>({ queryKey: todoKeys.lists() }, (old) => {
        if (!old) return old
        return {
          ...old,
          todos: old.todos.map((t) => {
            if (t.id !== todoId) return t
            const prev = t.subtasksCount ?? { total: 0, completed: 0 }
            return {
              ...t,
              subtasks: [...(t.subtasks ?? []), data],
              subtasksCount: { ...prev, total: prev.total + 1 },
            }
          }),
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
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(todoId) })
      queryClient.setQueriesData<TodoCollection>({ queryKey: todoKeys.lists() }, (old) => {
        if (!old) return old
        return {
          ...old,
          todos: old.todos.map((t) => {
            if (t.id !== todoId) return t
            const prev = t.subtasksCount ?? { total: 0, completed: 0 }
            const delta = variables.isCompleted !== undefined
              ? (variables.isCompleted ? 1 : -1)
              : 0
            return {
              ...t,
              subtasks: (t.subtasks ?? []).map((s) =>
                s.id === variables.subtaskId ? { ...s, ...data } : s
              ),
              subtasksCount: { ...prev, completed: prev.completed + delta },
            }
          }),
        }
      })
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
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(todoId) })
      queryClient.setQueriesData<TodoCollection>({ queryKey: todoKeys.lists() }, (old) => {
        if (!old) return old
        return {
          ...old,
          todos: old.todos.map((t) => {
            if (t.id !== todoId) return t
            const prev = t.subtasksCount ?? { total: 0, completed: 0 }
            const removed = (t.subtasks ?? []).find((s) => s.id === variables.subtaskId)
            return {
              ...t,
              subtasks: (t.subtasks ?? []).filter((s) => s.id !== variables.subtaskId),
              subtasksCount: {
                total: Math.max(0, prev.total - 1),
                completed: Math.max(0, prev.completed - (removed?.isCompleted ? 1 : 0)),
              },
            }
          }),
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
