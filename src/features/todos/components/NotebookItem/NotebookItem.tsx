import { motion } from 'framer-motion'
import { PriorityBadge } from '@/features/todos/components/PriorityBadge/PriorityBadge'
import { TagChip } from '@/features/todos/components/TagChip/TagChip'
import type { Todo } from '@/features/todos/types/todo.types'
import styles from './NotebookItem.module.scss'

type Props = {
  todo: Todo
  focused: boolean
  onFocus: () => void
  onClick: () => void
  onToggle: () => void
}

function subtaskProgressStyle(
  completed: number,
  total: number,
): React.CSSProperties {
  if (total === 0) return {}
  const pct = Math.round((completed / total) * 100)
  const ratio = completed / total
  // Color semáforo según progreso
  const color =
    ratio === 1
      ? 'rgba(16, 185, 129, 0.13)'   // verde
      : ratio >= 0.5
        ? 'rgba(245, 158, 11, 0.12)' // amarillo
        : 'rgba(239, 68, 68, 0.10)'  // rojo
  return {
    background: `linear-gradient(to right, ${color} ${pct}%, transparent ${pct}%)`,
  }
}

export function NotebookItem({ todo, focused, onFocus, onClick, onToggle }: Props) {
  const isCompleted = todo.status === 'completed'
  const hasSubtasks = todo.subtasksCount.total > 0
  const progressStyle = hasSubtasks && !focused
    ? subtaskProgressStyle(todo.subtasksCount.completed, todo.subtasksCount.total)
    : undefined

  return (
    <motion.li
      className={[
        styles.row,
        focused ? styles.focused : '',
        isCompleted ? styles.completed : '',
      ].join(' ')}
      style={progressStyle}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onMouseEnter={onFocus}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={todo.title}
    >
      <button
        type="button"
        className={styles.check}
        aria-label={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {isCompleted ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="currentColor" />
            <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="currentColor" />
          </svg>
        )}
      </button>

      <span className={styles.title}>{todo.title}</span>

      <div className={styles.meta}>
        {todo.tags.length > 0 ? (
          <div className={styles.tags}>
            <span className={styles.tagsDesktop}>
              {todo.tags.slice(0, 2).map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
              {todo.tags.length > 2 ? (
                <span className={styles.moreTags}>+{todo.tags.length - 2}</span>
              ) : null}
            </span>
            <span className={styles.tagsMobile}>
              <span className={styles.moreTags}>{todo.tags.length} tag{todo.tags.length !== 1 ? 's' : ''}</span>
            </span>
          </div>
        ) : null}
        <PriorityBadge priority={todo.priority} selected />
      </div>
    </motion.li>
  )
}
