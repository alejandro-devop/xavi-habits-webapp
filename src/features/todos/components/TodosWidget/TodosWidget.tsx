import { Link } from 'react-router'
import { useTodosQuery } from '@/features/todos/hooks/useTodos'
import { Spinner } from '@/shared/ui/Spinner'
import styles from './TodosWidget.module.scss'

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
}

export function TodosWidget() {
  const { data: inProgressData, isLoading: loadingInProgress } = useTodosQuery({
    status: 'in_progress',
    limit: 1,
  })
  const { data: todayData, isLoading: loadingToday } = useTodosQuery({
    selectedToday: true,
    pendingOnly: true,
    limit: 5,
  })

  const inProgressTodo = inProgressData?.todos[0]
  const todayTodos = todayData?.todos ?? []
  const isLoading = loadingInProgress || loadingToday
  const isEmpty = !inProgressTodo && todayTodos.length === 0

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.title}>Tareas</span>
        <Link to="/app/todos" className={styles.link}>
          Ver todo
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.center}>
          <Spinner size="sm" />
        </div>
      ) : (
        <>
          {inProgressTodo && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>En progreso</p>
              <div className={styles.inProgressCard}>
                <span className={styles.inProgressDot} />
                <span className={styles.taskTitle}>{inProgressTodo.title}</span>
                {inProgressTodo.priority !== 'low' && inProgressTodo.priority !== 'medium' ? null : null}
                {inProgressTodo.priority in PRIORITY_LABEL && (
                  <span
                    className={[
                      styles.priority,
                      styles[`priority--${inProgressTodo.priority}`],
                    ].join(' ')}
                  >
                    {PRIORITY_LABEL[inProgressTodo.priority]}
                  </span>
                )}
              </div>
            </div>
          )}

          {todayTodos.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Para hoy</p>
              <ul className={styles.list}>
                {todayTodos.map((todo) => (
                  <li key={todo.id} className={styles.item}>
                    <span className={styles.checkbox} />
                    <span className={styles.taskTitle}>{todo.title}</span>
                    {todo.priority in PRIORITY_LABEL && (
                      <span
                        className={[
                          styles.priorityDot,
                          styles[`priority--${todo.priority}`],
                        ].join(' ')}
                        title={PRIORITY_LABEL[todo.priority]}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isEmpty && <p className={styles.empty}>No hay tareas pendientes para hoy.</p>}
        </>
      )}
    </div>
  )
}
