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
} from '@/features/todos/hooks/useTodos'
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
  const createTag = useCreateTodoTagMutation()

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

  const handleTagToggle = (tag: TodoTag) => {
    if (!todo) return
    const currentIds = todo.tags.map((t) => t.id)
    const isSelected = currentIds.includes(tag.id)
    const newIds = isSelected ? currentIds.filter((id) => id !== tag.id) : [...currentIds, tag.id]
    updateTodo.mutate({ id: todo.id, tagIds: newIds })
  }

  const sanitizeTagName = (raw: string) =>
    raw.replace(/[^\p{L}\p{N} _\-]/gu, '').slice(0, 25)

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTagName(sanitizeTagName(e.target.value))
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const name = newTagName.trim()
    if (!name || !todo) return
    createTag.mutate(
      { name, color: '#636366' },
      {
        onSuccess: (newTag) => {
          const currentIds = todo.tags.map((t) => t.id)
          updateTodo.mutate({ id: todo.id, tagIds: [...currentIds, newTag.id] })
          setNewTagName('')
        },
      },
    )
  }

  const selectedTagIds = todo?.tags.map((t) => t.id) ?? []

  return (
    <Drawer open={Boolean(todoId)} onClose={onClose} side="right" title="Detalle de tarea">
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
            <div className={styles.tags}>
              {allTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  selected={selectedTagIds.includes(tag.id)}
                  onToggle={handleTagToggle}
                />
              ))}
            </div>
            <input
              className={styles.newTagInput}
              value={newTagName}
              onChange={handleTagInput}
              onKeyDown={handleAddTag}
              placeholder="Nueva etiqueta… (Enter para crear)"
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
        </div>
      )}
    </Drawer>
  )
}
