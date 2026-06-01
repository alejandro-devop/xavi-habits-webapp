import { useCallback, useEffect, useRef, useState } from 'react'
import { Drawer } from '@/shared/ui/Drawer'
import { Spinner } from '@/shared/ui/Spinner'
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor'
import { PriorityBadge } from '@/features/todos/components/PriorityBadge/PriorityBadge'
import { TagChip } from '@/features/todos/components/TagChip/TagChip'
import { SubtaskList } from '@/features/todos/components/SubtaskList/SubtaskList'
import {
  useTodoQuery,
  useTodoTagsQuery,
  useTodoFoldersQuery,
  useUpdateTodoMutation,
  useCompleteTodoMutation,
  useCreateTodoTagMutation,
  useRemoveTodoMutation,
} from '@/features/todos/hooks/useTodos'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { TODO_DESCRIPTION_MAX_LENGTH } from '@/shared/constants/text-limits'
import type { TodoPriority, TodoTag, Todo } from '@/features/todos/types/todo.types'
import styles from './TodoDrawer.module.scss'

type Props = {
  todoId: string | null
  onClose: () => void
}

type DescriptionEditorProps = {
  todo: Todo
  onSave: (description: string | null, onSuccess?: () => void) => void
}

function TodoDescriptionEditor({ todo, onSave }: DescriptionEditorProps) {
  const [description, setDescription] = useState(todo.description ?? '')
  const [savedDescription, setSavedDescription] = useState(todo.description ?? '')

  const handleDescriptionSave = useCallback(
    (nextDescription: string) => {
      const normalized = nextDescription.trim() ? nextDescription : null
      const current = todo.description ?? null
      if (normalized === current) {
        setSavedDescription(nextDescription)
        return
      }
      onSave(normalized, () => setSavedDescription(nextDescription))
    },
    [onSave, todo.description],
  )

  return (
    <MarkdownEditor
      value={description}
      onChange={setDescription}
      onSave={handleDescriptionSave}
      savedValue={savedDescription}
      saveDebounceMs={1000}
      maxLength={TODO_DESCRIPTION_MAX_LENGTH}
      placeholder="Añade una descripción… (# título, **negrita**, - lista)"
      variant="notebook"
      aria-label="Descripción de la tarea"
    />
  )
}

export function TodoDrawer({ todoId, onClose }: Props) {
  const { data: todo, isLoading } = useTodoQuery(todoId ?? undefined)
  const { data: allTags = [] } = useTodoTagsQuery()
  const { data: folders = [] } = useTodoFoldersQuery()
  const updateTodo = useUpdateTodoMutation()
  const completeTodo = useCompleteTodoMutation()
  const removeTodo = useRemoveTodoMutation()
  const createTag = useCreateTodoTagMutation()
  const { confirm } = useConfirmDialog()

  const titleRef = useRef<HTMLHeadingElement>(null)
  const [newTagName, setNewTagName] = useState('')

  useEffect(() => {
    if (todo && titleRef.current) {
      titleRef.current.textContent = todo.title
    }
  // Sincronizar el título editable solo cuando cambia el todo abierto
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todo?.id])

  const handleDescriptionSave = useCallback(
    (description: string | null, onSuccess?: () => void) => {
      if (!todo) return
      updateTodo.mutate({ id: todo.id, description }, { onSuccess: () => onSuccess?.() })
    },
    [todo, updateTodo],
  )

  if (!todoId) return null

  const handleTitleBlur = () => {
    const newTitle = titleRef.current?.textContent?.trim()
    if (!newTitle || !todo || newTitle === todo.title) return
    updateTodo.mutate({ id: todo.id, title: newTitle })
  }

  const handlePriority = (priority: TodoPriority) => {
    if (!todo) return
    updateTodo.mutate({ id: todo.id, priority })
  }

  const TAG_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16']

  const sanitizeTagName = (raw: string) =>
    raw.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 25)

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTagName(sanitizeTagName(e.target.value))
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const name = newTagName.trim()
    if (!name || !todo) return

    const existing = allTags.find((t) => t.name.toLowerCase() === name.toLowerCase())

    if (existing) {
      const alreadyAssigned = todo.tags.some((t) => t.id === existing.id)
      if (!alreadyAssigned) {
        updateTodo.mutate({ id: todo.id, tagIds: [...todo.tags.map((t) => t.id), existing.id] })
      }
      setNewTagName('')
      return
    }

    const color = TAG_COLORS[allTags.length % TAG_COLORS.length]
    createTag.mutate(
      { name, color },
      {
        onSuccess: (newTag) => {
          updateTodo.mutate({ id: todo.id, tagIds: [...todo.tags.map((t) => t.id), newTag.id] })
          setNewTagName('')
        },
      },
    )
  }

  const handleToggleComplete = () => {
    if (!todo) return
    if (todo.status === 'completed') {
      updateTodo.mutate({ id: todo.id, status: 'pending' })
    } else {
      completeTodo.mutate(todo.id)
    }
  }

  const handleDelete = () => {
    if (!todo) return
    void confirm({
      title: '¿Eliminar esta tarea?',
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      onConfirm: () => {
        removeTodo.mutate(todo.id)
        onClose()
      },
    })
  }

  const handleRemoveTagFromTodo = (tag: TodoTag) => {
    if (!todo) return
    const newIds = todo.tags.filter((t) => t.id !== tag.id).map((t) => t.id)
    updateTodo.mutate({ id: todo.id, tagIds: newIds })
  }

  return (
    <Drawer open={Boolean(todoId)} onClose={onClose} side="right" variant="notebook" title="Detalle de tarea">
      {isLoading || !todo ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.titleGroup}>
            <div className={[styles.titleRow, todo.status === 'completed' ? styles.completedRow : ''].join(' ')}>
              <button
                type="button"
                className={styles.completeBtn}
                onClick={handleToggleComplete}
                aria-label={todo.status === 'completed' ? 'Marcar como pendiente' : 'Marcar como completada'}
              >
                {todo.status === 'completed' ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8.5" stroke="currentColor" />
                    <path d="M5 9l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8.5" stroke="currentColor" />
                  </svg>
                )}
              </button>
              <h2
                ref={titleRef}
                className={styles.title}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleTitleBlur}
                aria-label="Título de la tarea"
              />
            </div>

            <div className={styles.subTitleRow}>
              <select
                className={styles.folderChip}
                value={todo.folderId ?? ''}
                onChange={(e) => {
                  updateTodo.mutate({ id: todo.id, folderId: e.target.value || null })
                }}
                aria-label="Carpeta de la tarea"
              >
                <option value="">Sin carpeta</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <button
                type="button"
                className={[styles.todayChip, todo.selectedToday ? styles.todayChipActive : ''].join(' ')}
                onClick={() => updateTodo.mutate({ id: todo.id, selectedToday: !todo.selectedToday })}
                aria-pressed={todo.selectedToday}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v6l4 2.4-1 1.7-5-3V7z"/>
                </svg>
                {todo.selectedToday ? 'En lista de hoy' : 'Agregar a hoy'}
              </button>
            </div>
          </div>

          <section className={[styles.section, styles.descriptionSection].join(' ')}>
            <span className={styles.label}>Descripción</span>
            <TodoDescriptionEditor key={todo.id} todo={todo} onSave={handleDescriptionSave} />
          </section>

          <section className={styles.section}>
            <span className={styles.label}>Fecha límite</span>
            <div className={styles.dateRow}>
              <input
                type="date"
                className={styles.dateInput}
                value={todo.dueDate ? todo.dueDate.slice(0, 10) : ''}
                onChange={(e) => {
                  const val = e.target.value
                  updateTodo.mutate({
                    id: todo.id,
                    dueDate: val ? new Date(val + 'T12:00:00').toISOString() : null,
                  })
                }}
              />
              {todo.dueDate ? (
                <button
                  type="button"
                  className={styles.clearDateBtn}
                  onClick={() => updateTodo.mutate({ id: todo.id, dueDate: null })}
                  aria-label="Quitar fecha límite"
                >
                  ×
                </button>
              ) : null}
            </div>
          </section>

          <section className={styles.section}>
            <span className={styles.label}>Prioridad</span>
            <div className={styles.priorities}>
              {(['low', 'medium', 'high', 'urgent'] as TodoPriority[]).map((p) => (
                <PriorityBadge
                  key={p}
                  priority={p}
                  selected={todo.priority === p}
                  onClick={() => handlePriority(p)}
                />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <span className={styles.label}>Etiquetas</span>
            {todo.tags.length > 0 ? (
              <div className={styles.tags}>
                {todo.tags.map((tag) => (
                  <TagChip
                    key={tag.id}
                    tag={tag}
                    selected
                    onRemove={handleRemoveTagFromTodo}
                  />
                ))}
              </div>
            ) : null}
            <input
              className={styles.newTagInput}
              value={newTagName}
              onChange={handleTagInput}
              onKeyDown={handleAddTag}
              placeholder="Añadir etiqueta… (Enter)"
            />
          </section>

          <section className={styles.section}>
            <span className={styles.label}>
              Subtareas
              {todo.subtasksCount.total > 0 ? (
                <span className={styles.subtaskCount}>
                  {todo.subtasksCount.completed}/{todo.subtasksCount.total}
                </span>
              ) : null}
            </span>
            <SubtaskList todoId={todo.id} subtasks={todo.subtasks} />
          </section>

          <div className={styles.dangerZone}>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => void handleDelete()}
            >
              Eliminar tarea
            </button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
