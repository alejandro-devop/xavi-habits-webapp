import { useDroppable } from '@dnd-kit/core'
import type { HabitPurpose, HabitPurposePlacement } from '@/features/habits/types/habit-purpose.types'
import { HabitPurposeCard } from '@/features/habits/components/HabitPurposeCard'
import styles from './PersonaColumn.module.scss'

type PersonaColumnProps = {
  title: string
  placement: HabitPurposePlacement
  purposes: HabitPurpose[]
  onEdit: (p: HabitPurpose) => void
  onDelete: (id: string) => void
  onMove: (id: string, placement: HabitPurposePlacement) => void
}

export function PersonaColumn({ title, placement, purposes, onEdit, onDelete, onMove }: PersonaColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: placement })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.over : ''}`}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.count}>{purposes.length}</span>
      </div>

      <div className={styles.list}>
        {purposes.map((p) => (
          <HabitPurposeCard
            key={p.id}
            purpose={p}
            onEdit={() => onEdit(p)}
            onDelete={() => onDelete(p.id)}
            onMove={(pl) => onMove(p.id, pl)}
          />
        ))}

        {purposes.length === 0 ? (
          <p className={styles.empty}>Arrastra propósitos aquí</p>
        ) : null}
      </div>
    </div>
  )
}
