import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PaperSurface } from '@/shared/ui/PaperSurface'
import { Spinner } from '@/shared/ui/Spinner'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { NotebookItem } from '@/features/todos/components/NotebookItem/NotebookItem'
import { NotebookInput } from '@/features/todos/components/NotebookInput/NotebookInput'
import { NotebookTabs } from '@/features/todos/components/NotebookTabs/NotebookTabs'
import { TodoDrawer } from '@/features/todos/components/TodoDrawer/TodoDrawer'
import {
  useCompleteTodoMutation,
  useCreateTodoMutation,
  useRemoveTodoMutation,
  useTodosQuery,
  useUpdateTodoMutation,
} from '@/features/todos/hooks/useTodos'
import type { TodoFilters } from '@/features/todos/types/todo.types'
import styles from './NotebookList.module.scss'

function draftKey(folderId: string | null) {
  return `todo-draft:${folderId ?? '__all__'}`
}

function useTodoDraft(folderId: string | null) {
  const [value, setValue] = useState(() => sessionStorage.getItem(draftKey(folderId)) ?? '')

  useEffect(() => {
    setValue(sessionStorage.getItem(draftKey(folderId)) ?? '')
  }, [folderId])

  const set = useCallback((v: string) => {
    setValue(v)
    if (v) {
      sessionStorage.setItem(draftKey(folderId), v)
    } else {
      sessionStorage.removeItem(draftKey(folderId))
    }
  }, [folderId])

  const clear = useCallback(() => {
    sessionStorage.removeItem(draftKey(folderId))
    setValue('')
  }, [folderId])

  return { value, set, clear }
}

type Props = {
  filters?: TodoFilters
}

export function NotebookList({ filters = {} }: Props) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  const { data, isLoading } = useTodosQuery({
    limit: 50,
    ...filters,
    folderId: selectedFolderId,
  })
  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

  const todos = useMemo(() => {
    const raw = data?.todos ?? []
    return [...raw].sort((a, b) => {
      // Completadas siempre al final
      const aComp = a.status === 'completed' ? 1 : 0
      const bComp = b.status === 'completed' ? 1 : 0
      if (aComp !== bComp) return aComp - bComp
      // Dentro del mismo grupo, ordenar por prioridad
      return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
    })
  }, [data?.todos])

  const createTodo = useCreateTodoMutation()
  const completeTodo = useCompleteTodoMutation()
  const updateTodo = useUpdateTodoMutation()
  const removeTodo = useRemoveTodoMutation()
  const { confirm } = useConfirmDialog()
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const [openTodoId, setOpenTodoId] = useState<string | null>(null)
  const newInputRef = useRef<HTMLInputElement>(null)
  const draft = useTodoDraft(selectedFolderId)

  const handleAdd = useCallback(
    (title: string) => {
      draft.clear()
      createTodo.mutate({
        title,
        priority: 'medium',
        folderId: selectedFolderId ?? undefined,
      })
    },
    [createTodo, draft, selectedFolderId],
  )

  const handleToggleComplete = useCallback(
    (todo: (typeof todos)[number]) => {
      if (todo.status === 'completed') {
        updateTodo.mutate({ id: todo.id, status: 'pending' })
      } else {
        completeTodo.mutate(todo.id)
      }
    },
    [completeTodo, updateTodo],
  )

  const handleDelete = useCallback(
    (todo: (typeof todos)[number]) => {
      void confirm({
        title: '¿Eliminar esta tarea?',
        description: 'Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        variant: 'danger',
        onConfirm: () => removeTodo.mutate(todo.id),
      })
    },
    [confirm, removeTodo],
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isEditing =
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA'
      // Never intercept keyboard events on links or buttons outside the list
      const isNavigating = target.tagName === 'A' || target.closest('a') !== null

      if (isEditing || isNavigating) return

      if (openTodoId) {
        if (e.key === 'Escape') setOpenTodoId(null)
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((i) => Math.min(i + 1, todos.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((i) => Math.max(i - 1, 0))
          break
        case 'e':
        case 'E':
          if (focusedIndex >= 0 && todos[focusedIndex]) {
            e.preventDefault()
            handleToggleComplete(todos[focusedIndex])
          }
          break
        case 'Enter':
        case ' ':
          if (focusedIndex >= 0 && todos[focusedIndex]) {
            e.preventDefault()
            setOpenTodoId(todos[focusedIndex].id)
          }
          break
        case 'd':
        case 'D':
          if (focusedIndex >= 0 && todos[focusedIndex]) {
            e.preventDefault()
            void handleDelete(todos[focusedIndex])
          }
          break
        case 'n':
        case 'N':
          e.preventDefault()
          newInputRef.current?.focus()
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [todos, focusedIndex, openTodoId, handleToggleComplete, handleDelete])

  return (
    <PaperSurface
      tabs={
        <NotebookTabs
          selectedFolderId={selectedFolderId}
          onSelect={(id) => {
            setSelectedFolderId(id)
            setFocusedIndex(-1)
          }}
        />
      }
    >
      <NotebookInput
        ref={newInputRef}
        value={draft.value}
        onChange={draft.set}
        onAdd={handleAdd}
        onClear={draft.clear}
      />

      {isLoading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : todos.length === 0 ? (
        <EmptyState
          title="Sin tareas pendientes"
          description='Presiona N para añadir tu primera tarea.'
        />
      ) : (
        <ul className={styles.list} role="list">
          {todos.map((todo, index) => (
            <NotebookItem
              key={todo.id}
              todo={todo}
              focused={focusedIndex === index}
              onFocus={() => setFocusedIndex(index)}
              onClick={() => setOpenTodoId(todo.id)}
              onToggle={() => handleToggleComplete(todo)}
            />
          ))}
        </ul>
      )}

      <TodoDrawer todoId={openTodoId} onClose={() => setOpenTodoId(null)} />
    </PaperSurface>
  )
}
