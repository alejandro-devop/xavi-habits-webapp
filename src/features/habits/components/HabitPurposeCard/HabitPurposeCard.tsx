import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { HabitPurpose, HabitPurposePlacement } from '@/features/habits/types/habit-purpose.types'
import { AppIcon } from '@/shared/ui/AppIcon'
import { IconButton } from '@/shared/ui/IconButton'
import styles from './HabitPurposeCard.module.scss'

const PLACEMENT_LABELS: Record<HabitPurposePlacement, string> = {
  pool: 'Sin asignar',
  want: 'Quiero ser',
  avoid: 'Quiero evitar',
}

const ALL_PLACEMENTS: HabitPurposePlacement[] = ['pool', 'want', 'avoid']

type HabitPurposeCardProps = {
  purpose: HabitPurpose
  onEdit: () => void
  onDelete: () => void
  onMove: (placement: HabitPurposePlacement) => void
  dragging?: boolean
}

export function HabitPurposeCard({ purpose, onEdit, onDelete, onMove, dragging = false }: HabitPurposeCardProps) {
  const [movePanelOpen, setMovePanelOpen] = useState(false)

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

        {movePanelOpen ? (
          <div className={styles.movePanel} onPointerDown={(e) => e.stopPropagation()}>
            {ALL_PLACEMENTS.map((pl) => (
              <button
                key={pl}
                type="button"
                className={`${styles.movePill} ${pl === purpose.placement ? styles.movePillActive : ''}`}
                disabled={pl === purpose.placement}
                onClick={() => {
                  onMove(pl)
                  setMovePanelOpen(false)
                }}
              >
                {PLACEMENT_LABELS[pl]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.actions} onPointerDown={(e) => e.stopPropagation()}>
        <IconButton
          icon="arrows-left-right"
          size="sm"
          aria-label="Mover a"
          aria-pressed={movePanelOpen}
          onClick={() => setMovePanelOpen((v) => !v)}
        />
        <IconButton
          icon="pencil"
          size="sm"
          aria-label="Editar"
          onClick={onEdit}
        />
        <IconButton
          icon="trash"
          size="sm"
          variant="danger"
          aria-label="Eliminar"
          onClick={onDelete}
        />
      </div>
    </div>
  )
}
