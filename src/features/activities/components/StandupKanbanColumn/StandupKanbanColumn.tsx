import { useDroppable } from '@dnd-kit/core'
import { StandupKanbanCard } from '@/features/activities/components/StandupKanbanCard'
import type { StandupItem, StandupItemStatus } from '@/features/activities/types/standup.types'
import styles from './StandupKanbanColumn.module.scss'

type StandupKanbanColumnProps = {
  status: StandupItemStatus
  title: string
  items: StandupItem[]
  memberNameById: Map<string, string>
  onOpenDetail: (item: StandupItem) => void
  interactive?: boolean
}

export function StandupKanbanColumn({
  status,
  title,
  items,
  memberNameById,
  onOpenDetail,
  interactive = true,
}: StandupKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef} className={`${styles.column} ${isOver ? styles.over : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.count}>{items.length}</span>
      </div>

      <div className={styles.list}>
        {items.map((item) => (
          <StandupKanbanCard
            key={item.id}
            item={item}
            memberName={memberNameById.get(item.memberId) ?? item.member?.name ?? 'Sin responsable'}
            onOpenDetail={() => onOpenDetail(item)}
            interactive={interactive}
          />
        ))}

        {items.length === 0 ? <p className={styles.empty}>Sin entradas</p> : null}
      </div>
    </div>
  )
}
