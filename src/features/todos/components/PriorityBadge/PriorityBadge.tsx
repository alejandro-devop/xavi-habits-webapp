import type { TodoPriority } from '@/features/todos/types/todo.types'
import styles from './PriorityBadge.module.scss'

const LABELS: Record<TodoPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

type Props = {
  priority: TodoPriority
  selected?: boolean
  onClick?: () => void
}

export function PriorityBadge({ priority, selected, onClick }: Props) {
  return (
    <button
      type="button"
      className={[styles.badge, styles[priority], selected ? styles.selected : ''].join(' ')}
      onClick={onClick}
      aria-pressed={selected}
    >
      {LABELS[priority]}
    </button>
  )
}
