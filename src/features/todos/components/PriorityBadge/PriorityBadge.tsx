import type { TodoPriority } from '@/features/todos/types/todo.types'
import styles from './PriorityBadge.module.scss'

const LABELS: Record<TodoPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

function PriorityIcon({ priority }: { priority: TodoPriority }) {
  switch (priority) {
    case 'low':
      return (
        // Flecha abajo
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'medium':
      return (
        // Guion
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'high':
      return (
        // Flecha arriba
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 10V2M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'urgent':
      return (
        // Triángulo warning
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 1.5L11 10.5H1L6 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6 5v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="6" cy="9" r="0.6" fill="currentColor" />
        </svg>
      )
  }
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
      aria-label={LABELS[priority]}
      title={LABELS[priority]}
      aria-pressed={selected}
    >
      <PriorityIcon priority={priority} />
    </button>
  )
}
