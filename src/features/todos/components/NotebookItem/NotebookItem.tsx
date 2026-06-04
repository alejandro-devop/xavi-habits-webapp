import { motion } from 'framer-motion'
import { PriorityBadge } from '@/features/todos/components/PriorityBadge/PriorityBadge'
import { TagChip } from '@/features/todos/components/TagChip/TagChip'
import { DueDateLabel } from '@/features/todos/components/DueDateLabel/DueDateLabel'
import type { Todo } from '@/features/todos/types/todo.types'
import styles from './NotebookItem.module.scss'

type Props = {
  todo: Todo
  focused: boolean
  onFocus: () => void
  onClick: () => void
  onToggle: () => void
  onToggleToday?: () => void
  onChangePriority?: (priority: Todo['priority']) => void
}

function subtaskProgressStyle(
  completed: number,
  total: number,
): React.CSSProperties {
  if (total === 0) return {}
  const pct = Math.round((completed / total) * 100)
  const ratio = completed / total

  // Semaphore colors: fill (brighter) + track (faint, always visible)
  const [fill, track] =
    ratio === 1
      ? ['rgba(16, 185, 129, 0.18)', 'rgba(16, 185, 129, 0.05)']   // verde
      : ratio >= 0.5
        ? ['rgba(245, 158, 11, 0.16)', 'rgba(245, 158, 11, 0.05)'] // amarillo
        : ['rgba(239, 68, 68, 0.14)', 'rgba(239, 68, 68, 0.05)']   // rojo

  return {
    background: `linear-gradient(to right, ${fill} ${pct}%, ${track} ${pct}%)`,
  }
}

export function NotebookItem({ todo, focused, onFocus, onClick, onToggle, onToggleToday, onChangePriority }: Props) {
  const isCompleted = todo.status === 'completed'
  // subtasksCount puede ser null en tareas antiguas — usar el array real como fallback
  const subtaskTotal = todo.subtasksCount?.total ?? todo.subtasks?.length ?? 0
  const subtaskCompleted = todo.subtasksCount?.completed ?? todo.subtasks?.filter(s => s.isCompleted).length ?? 0
  const hasSubtasks = subtaskTotal > 0
  const progressStyle = hasSubtasks && !focused
    ? subtaskProgressStyle(subtaskCompleted, subtaskTotal)
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
        {hasSubtasks ? (
          <svg className={styles.subtaskIcon} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-label="Tiene subtareas">
            <path d="M2 3h8M4 6h6M4 9h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : null}
        <DueDateLabel dueDate={todo.dueDate} status={todo.status} />
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
        {onToggleToday != null ? (
          <button
            type="button"
            className={[styles.todayBtn, todo.selectedToday ? styles.todayActive : ''].join(' ')}
            aria-label={todo.selectedToday ? 'Quitar de tareas de hoy' : 'Agregar a tareas de hoy'}
            aria-pressed={todo.selectedToday}
            onClick={(e) => {
              e.stopPropagation()
              onToggleToday()
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v6l4 2.4-1 1.7-5-3V7z"/>
            </svg>
          </button>
        ) : null}
        <PriorityBadge
          priority={todo.priority}
          selected
          iconOnly
          onChangePriority={onChangePriority}
        />
      </div>
    </motion.li>
  )
}
