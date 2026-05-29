import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState } from '@/shared/ui/EmptyState'
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
  const todos = useMemo(() => data?.todos ?? [], [data?.todos])

  const createTodo = useCreateTodoMutation()
  const completeTodo = useCompleteTodoMutation()
  const updateTodo = useUpdateTodoMutation()
  const removeTodo = useRemoveTodoMutation()
  const { confirm } = useConfirmDialog()
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const [openTodoId, setOpenTodoId] = useState<string | null>(null)
  const newInputRef = useRef<HTMLInputElement>(null)

  const handleAdd = useCallback(
    (title: string) => {
      createTodo.mutate({
        title,
        priority: 'medium',
        folderId: selectedFolderId ?? undefined,
      })
    },
    [createTodo, selectedFolderId],
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

      if (isEditing) return

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
    <div className={styles.container}>
    <NotebookTabs selectedFolderId={selectedFolderId} onSelect={(id) => { setSelectedFolderId(id); setFocusedIndex(-1) }} />
    <div className={styles.notebook}>
      <div className={styles.margin} aria-hidden="true" />

      <div className={styles.content}>
        <NotebookInput ref={newInputRef} onAdd={handleAdd} />

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
              />
            ))}
          </ul>
        )}
      </div>

      <TodoDrawer todoId={openTodoId} onClose={() => setOpenTodoId(null)} />
    </div>
    </div>
  )
}
