import { useDraggable } from '@dnd-kit/core'
import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import styles from './HabitPurposeCard.module.scss'

type HabitPurposeCardProps = {
  purpose: HabitPurpose
  onEdit: () => void
  onDelete: () => void
  dragging?: boolean
}

export function HabitPurposeCard({ purpose, onEdit, onDelete, dragging = false }: HabitPurposeCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: purpose.id,
    data: { placement: purpose.placement },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${dragging ? styles.dragging : ''}`}
    >
      <div className={styles.dragHandle} {...listeners} {...attributes} aria-label="Arrastrar">
        <AppIcon name="grip-vertical" size="sm" decorative />
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          {purpose.icon ? (
            <span className={styles.icon} aria-hidden>
              <AppIcon name={purpose.icon} size="sm" decorative />
            </span>
          ) : null}
          <span className={styles.name}>{purpose.name}</span>
        </div>
        {purpose.description ? (
          <p className={styles.description}>{purpose.description}</p>
        ) : null}
      </div>

      <div className={styles.actions} onPointerDown={(e) => e.stopPropagation()}>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          Editar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </div>
  )
}
