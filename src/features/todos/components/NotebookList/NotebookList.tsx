import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PaperSurface } from '@/shared/ui/PaperSurface'
import { Spinner } from '@/shared/ui/Spinner'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { NotebookItem } from '@/features/todos/components/NotebookItem/NotebookItem'
import { NotebookInput } from '@/features/todos/components/NotebookInput/NotebookInput'
import { NotebookTabs, TODAY_FOLDER_ID, SUGGESTED_FOLDER_ID } from '@/features/todos/components/NotebookTabs/NotebookTabs'
import { NotebookFilters, type DateRange } from '@/features/todos/components/NotebookFilters/NotebookFilters'
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

// ─── Helpers de rango de fechas ───────────────────────────────────────────────

function getEndOfToday(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

function computeDateRange(range: DateRange): { dueAfter: string; dueBefore: string } {
  const now = new Date()
  switch (range) {
    case 'today': {
      const s = new Date(now); s.setHours(0, 0, 0, 0)
      const e = new Date(now); e.setHours(23, 59, 59, 999)
      return { dueAfter: s.toISOString(), dueBefore: e.toISOString() }
    }
    case 'week': {
      const day = now.getDay()
      const s = new Date(now)
      s.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      s.setHours(0, 0, 0, 0)
      const e = new Date(s)
      e.setDate(s.getDate() + 6)
      e.setHours(23, 59, 59, 999)
      return { dueAfter: s.toISOString(), dueBefore: e.toISOString() }
    }
    case 'month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return { dueAfter: s.toISOString(), dueBefore: e.toISOString() }
    }
  }
}

// ─── Draft persistido por carpeta ─────────────────────────────────────────────

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
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(TODAY_FOLDER_ID)
  const [dateRange, setDateRange] = useState<DateRange | null>('today')
  const [showCompleted, setShowCompleted] = useState(false)

  const isToday = selectedFolderId === TODAY_FOLDER_ID
  const isSuggested = selectedFolderId === SUGGESTED_FOLDER_ID

  // ── Construir filtros para la query ──────────────────────────────────────────
  const dateFilters = useMemo((): { dueAfter?: string; dueBefore?: string } => {
    // Suggested e Hoy no usan el filtro de fechas del panel
    if (isToday || isSuggested) return {}
    if (!dateRange) return {}
    return computeDateRange(dateRange)
  }, [isToday, isSuggested, dateRange])

  const queryFilters = useMemo((): TodoFilters => ({
    limit: 50,
    ...filters,
    folderId: (isToday || isSuggested) ? undefined : selectedFolderId,
    selectedToday: isToday ? true : isSuggested ? false : undefined,
    // Suggested: siempre pendingOnly=true (no le afecta showCompleted)
    pendingOnly: isSuggested ? true : (showCompleted ? undefined : true),
    // Suggested: siempre filtra por dueBefore = fin de hoy
    dueBefore: isSuggested ? getEndOfToday() : (dateFilters.dueBefore ?? undefined),
    dueAfter: isSuggested ? undefined : (dateFilters.dueAfter ?? undefined),
  }), [isToday, isSuggested, selectedFolderId, showCompleted, dateFilters, filters])

  const { data, isLoading } = useTodosQuery(queryFilters)

  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

  const todos = useMemo(() => {
    const raw = data?.todos ?? []
    return [...raw].sort((a, b) => {
      const aComp = a.status === 'completed' ? 1 : 0
      const bComp = b.status === 'completed' ? 1 : 0
      if (aComp !== bComp) return aComp - bComp
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
        folderId: isToday ? undefined : (selectedFolderId ?? undefined),
        selectedToday: isToday ? true : undefined,
      })
    },
    [createTodo, draft, selectedFolderId, isToday],
  )

  const handleToggleToday = useCallback(
    (todo: (typeof todos)[number]) => {
      updateTodo.mutate({ id: todo.id, selectedToday: !todo.selectedToday })
    },
    [updateTodo],
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
          if (!isSuggested) {
            e.preventDefault()
            newInputRef.current?.focus()
          }
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [todos, focusedIndex, openTodoId, isSuggested, handleToggleComplete, handleDelete])

  return (
    <PaperSurface
      tabs={
        <>
          <NotebookFilters
            dateRange={dateRange}
            showCompleted={showCompleted}
            onDateRangeChange={setDateRange}
            onShowCompletedChange={setShowCompleted}
          />
          <NotebookTabs
            selectedFolderId={selectedFolderId}
            onSelect={(id) => {
              setSelectedFolderId(id)
              setFocusedIndex(-1)
            }}
          />
        </>
      }
    >
      {/* Input oculto en Suggested */}
      {!isSuggested && (
        <NotebookInput
          ref={newInputRef}
          value={draft.value}
          onChange={draft.set}
          onAdd={handleAdd}
          onClear={draft.clear}
        />
      )}

      {isLoading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : todos.length === 0 ? (
        <EmptyState
          title={isSuggested ? 'Sin tareas sugeridas' : 'Sin tareas pendientes'}
          description={
            isSuggested
              ? 'Las tareas con fecha de vencimiento de hoy o anteriores aparecerán aquí.'
              : 'Presiona N para añadir tu primera tarea.'
          }
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
              onToggleToday={() => handleToggleToday(todo)}
            />
          ))}
        </ul>
      )}

      <TodoDrawer todoId={openTodoId} onClose={() => setOpenTodoId(null)} />
    </PaperSurface>
  )
}
