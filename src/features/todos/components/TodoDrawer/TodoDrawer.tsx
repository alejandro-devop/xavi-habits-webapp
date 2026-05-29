import { useEffect, useRef, useState } from 'react'
import { Drawer } from '@/shared/ui/Drawer'
import { Spinner } from '@/shared/ui/Spinner'
import { PriorityBadge } from '@/features/todos/components/PriorityBadge/PriorityBadge'
import { TagChip } from '@/features/todos/components/TagChip/TagChip'
import { SubtaskList } from '@/features/todos/components/SubtaskList/SubtaskList'
import {
  useTodoQuery,
  useTodoTagsQuery,
  useUpdateTodoMutation,
  useCreateTodoTagMutation,
  useRemoveTodoMutation,
} from '@/features/todos/hooks/useTodos'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import type { TodoPriority, TodoTag } from '@/features/todos/types/todo.types'
import styles from './TodoDrawer.module.scss'

type Props = {
  todoId: string | null
  onClose: () => void
}

export function TodoDrawer({ todoId, onClose }: Props) {
  const { data: todo, isLoading } = useTodoQuery(todoId ?? undefined)
  const { data: allTags = [] } = useTodoTagsQuery()
  const updateTodo = useUpdateTodoMutation()
  const removeTodo = useRemoveTodoMutation()
  const createTag = useCreateTodoTagMutation()
  const { confirm } = useConfirmDialog()

  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const [newTagName, setNewTagName] = useState('')

  useEffect(() => {
    if (todo && titleRef.current) {
      titleRef.current.textContent = todo.title
    }
  // Sincronizar el título editable solo cuando cambia el todo abierto
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todo?.id])

  if (!todoId) return null

  const handleTitleBlur = () => {
    const newTitle = titleRef.current?.textContent?.trim()
    if (!newTitle || !todo || newTitle === todo.title) return
    updateTodo.mutate({ id: todo.id, title: newTitle })
  }

  const handleDescBlur = () => {
    if (!todo) return
    const newDesc = descRef.current?.value ?? ''
    if (newDesc === (todo.description ?? '')) return
    updateTodo.mutate({ id: todo.id, description: newDesc || null })
  }

  const handlePriority = (priority: TodoPriority) => {
    if (!todo) return
    updateTodo.mutate({ id: todo.id, priority })
  }

  const TAG_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16']

  const sanitizeTagName = (raw: string) =>
    raw.replace(/[^\p{L}\p{N} _\-]/gu, '').slice(0, 25)

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
          <h2
            ref={titleRef}
            className={styles.title}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleTitleBlur}
            aria-label="Título de la tarea"
          />

          <section className={styles.section}>
            <span className={styles.label}>Descripción</span>
            <textarea
              ref={descRef}
              className={styles.description}
              defaultValue={todo.description ?? ''}
              onBlur={handleDescBlur}
              placeholder="Añade una descripción…"
              rows={4}
            />
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
