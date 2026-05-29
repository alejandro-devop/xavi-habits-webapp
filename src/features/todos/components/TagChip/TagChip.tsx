import type { TodoTag } from '@/features/todos/types/todo.types'
import styles from './TagChip.module.scss'

type Props = {
  tag: TodoTag
  selected?: boolean
  onToggle?: (tag: TodoTag) => void
  onRemove?: (tag: TodoTag) => void
}

export function TagChip({ tag, selected, onToggle, onRemove }: Props) {
  return (
    <span
      className={[styles.chip, selected ? styles.selected : ''].join(' ')}
      style={{ '--tag-color': tag.color } as React.CSSProperties}
      role={onToggle ? 'button' : undefined}
      tabIndex={onToggle ? 0 : undefined}
      onClick={() => onToggle?.(tag)}
      onKeyDown={(e) => e.key === 'Enter' && onToggle?.(tag)}
    >
      <span className={styles.dot} />
      {tag.name}
      {onRemove ? (
        <button
          type="button"
          className={styles.remove}
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag)
          }}
          aria-label={`Quitar etiqueta ${tag.name}`}
        >
          ×
        </button>
      ) : null}
    </span>
  )
}
