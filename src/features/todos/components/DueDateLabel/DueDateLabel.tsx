import type { TodoStatus } from '@/features/todos/types/todo.types'
import styles from './DueDateLabel.module.scss'

function getDaysDiff(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((dueDay.getTime() - todayDay.getTime()) / (1000 * 60 * 60 * 24))
}

type Props = {
  dueDate: string | null
  status: TodoStatus
}

export function DueDateLabel({ dueDate, status }: Props) {
  if (!dueDate || status === 'completed') return null

  const diff = getDaysDiff(dueDate)

  if (diff === 0) {
    return <span className={`${styles.label} ${styles.today}`}>Hoy</span>
  }
  if (diff > 0) {
    return (
      <span className={`${styles.label} ${diff <= 3 ? styles.soon : styles.future}`}>
        {diff}d
      </span>
    )
  }
  return (
    <span className={`${styles.label} ${styles.overdue}`}>
      -{Math.abs(diff)}d
    </span>
  )
}
