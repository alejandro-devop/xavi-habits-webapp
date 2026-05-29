import { useTodoQuery, useEditSubtaskMutation } from '@/features/todos/hooks/useTodos'
import type { TodoSubtask } from '@/features/todos/types/todo.types'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './SessionLinkedTodo.module.scss'

type SessionLinkedTodoProps = {
  todoId: string
  todoTitle: string
}

function SubtaskRow({
  todoId,
  subtask,
}: {
  todoId: string
  subtask: TodoSubtask
}) {
  const editSubtask = useEditSubtaskMutation(todoId)

  return (
    <li className={styles.subtask}>
      <div className={styles.checkboxSlot}>
        <Checkbox
          id={`session-subtask-${subtask.id}`}
          checked={subtask.isCompleted}
          disabled={editSubtask.isPending}
          aria-label={subtask.title}
          onChange={() =>
            editSubtask.mutate({
              todoId,
              subtaskId: subtask.id,
              isCompleted: !subtask.isCompleted,
            })
          }
        />
      </div>
      <span className={[styles.subtaskTitle, subtask.isCompleted ? styles.subtaskDone : ''].join(' ')}>
        {subtask.title}
      </span>
    </li>
  )
}

export function SessionLinkedTodo({ todoId, todoTitle }: SessionLinkedTodoProps) {
  const { data: todo, isLoading, isError } = useTodoQuery(todoId)
  const subtasks = todo?.subtasks ?? []

  return (
    <section className={styles.section} aria-label="Tarea vinculada">
      <p className={styles.label}>Tarea vinculada</p>
      <h4 className={styles.todoTitle}>{todoTitle}</h4>

      {isLoading ? (
        <Skeleton height={48} />
      ) : isError ? (
        <p className={styles.muted}>No se pudieron cargar las subtareas.</p>
      ) : subtasks.length === 0 ? (
        <p className={styles.muted}>Sin subtareas.</p>
      ) : (
        <ul className={styles.subtasks}>
          {subtasks
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((subtask) => (
              <SubtaskRow key={subtask.id} todoId={todoId} subtask={subtask} />
            ))}
        </ul>
      )}
    </section>
  )
}
