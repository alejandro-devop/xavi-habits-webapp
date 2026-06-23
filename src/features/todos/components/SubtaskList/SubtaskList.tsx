import { useRef, useState } from 'react'
import { Checkbox } from '@/shared/ui/Checkbox'
import {
  useAddSubtaskMutation,
  useEditSubtaskMutation,
  useRemoveSubtaskMutation,
} from '@/features/todos/hooks/useTodos'
import type { TodoSubtask } from '@/features/todos/types/todo.types'
import styles from './SubtaskList.module.scss'

type Props = {
  todoId: string
  subtasks: TodoSubtask[]
}

export function SubtaskList({ todoId, subtasks = [] }: Props) {
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const addSubtask = useAddSubtaskMutation(todoId)
  const editSubtask = useEditSubtaskMutation(todoId)
  const removeSubtask = useRemoveSubtaskMutation(todoId)

  const handleAdd = () => {
    const title = newTitle.trim()
    if (!title) return
    addSubtask.mutate(
      { todoId, title, orderIndex: subtasks.length },
      { onSuccess: () => setNewTitle('') },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleToggle = (subtask: TodoSubtask) => {
    editSubtask.mutate({
      todoId,
      subtaskId: subtask.id,
      isCompleted: !subtask.isCompleted,
    })
  }

  const handleTitleBlur = (subtask: TodoSubtask, newValue: string) => {
    const trimmed = newValue.trim()
    if (trimmed && trimmed !== subtask.title) {
      editSubtask.mutate({ todoId, subtaskId: subtask.id, title: trimmed })
    }
  }

  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {subtasks
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((subtask) => (
            <li key={subtask.id} className={styles.item}>
              <Checkbox
                checked={subtask.isCompleted}
                onChange={() => handleToggle(subtask)}
                aria-label={subtask.title}
              />
              <span
                className={[styles.title, subtask.isCompleted ? styles.completed : ''].join(' ')}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTitleBlur(subtask, e.currentTarget.textContent ?? '')}
              >
                {subtask.title}
              </span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeSubtask.mutate({ todoId, subtaskId: subtask.id })}
                aria-label="Eliminar subtarea"
              >
                ×
              </button>
            </li>
          ))}
      </ul>

      <div className={styles.newRow}>
        <span className={styles.addIcon}>+</span>
        <input
          ref={inputRef}
          className={styles.newInput}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAdd}
          placeholder="Añadir subtarea…"
        />
      </div>
    </div>
  )
}
