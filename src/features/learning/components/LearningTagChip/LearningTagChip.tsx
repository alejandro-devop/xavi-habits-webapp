import type { LearningTag } from '@/features/learning/types/learning-note.types'
import styles from './LearningTagChip.module.scss'

type Props = {
  tag: Pick<LearningTag, 'id' | 'name' | 'slug'>
  selected?: boolean
  onToggle?: (tag: Pick<LearningTag, 'id' | 'name' | 'slug'>) => void
  onRemove?: (tag: Pick<LearningTag, 'id' | 'name' | 'slug'>) => void
}

export function LearningTagChip({ tag, selected, onToggle, onRemove }: Props) {
  return (
    <span
      className={[styles.chip, selected ? styles.selected : ''].join(' ')}
      role={onToggle ? 'button' : undefined}
      tabIndex={onToggle ? 0 : undefined}
      onClick={() => onToggle?.(tag)}
      onKeyDown={(e) => e.key === 'Enter' && onToggle?.(tag)}
    >
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
