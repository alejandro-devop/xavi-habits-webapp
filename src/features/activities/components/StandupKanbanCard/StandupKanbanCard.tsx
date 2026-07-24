import { useDraggable } from '@dnd-kit/core'
import type { StandupItem, StandupItemStatus } from '@/features/activities/types/standup.types'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Badge } from '@/shared/ui/Badge'
import styles from './StandupKanbanCard.module.scss'

const STATUS_CARD_CLASS: Record<StandupItemStatus, string> = {
  pending: 'cardPending',
  in_progress: 'cardInProgress',
  blocked: 'cardBlocked',
  completed: 'cardCompleted',
}

type StandupKanbanCardProps = {
  item: StandupItem
  memberName: string
  onOpenDetail: () => void
  dragging?: boolean
  interactive?: boolean
}

export function StandupKanbanCard({
  item,
  memberName,
  onOpenDetail,
  dragging = false,
  interactive = true,
}: StandupKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: { status: item.status },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${styles[STATUS_CARD_CLASS[item.status]]} ${dragging ? styles.dragging : ''}`}
      onClick={onOpenDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenDetail()
        }
      }}
    >
      {interactive ? (
        <div
          className={styles.dragHandle}
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          aria-label="Arrastrar"
        >
          <AppIcon name="grip-vertical" size="sm" decorative />
        </div>
      ) : null}

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{item.title}</span>
          {item.daysInBacklog > 0 ? (
            <Badge variant="warning">{item.daysInBacklog}d</Badge>
          ) : null}
        </div>
        <div className={styles.meta}>
          <span className={styles.member}>{memberName}</span>
          {item.ticketNumber ? <span>#{item.ticketNumber}</span> : null}
        </div>
        {item.status === 'blocked' && item.blockedReason ? (
          <div className={styles.blockedReason}>🚧 {item.blockedReason}</div>
        ) : item.notes ? (
          <p className={styles.notes}>{item.notes}</p>
        ) : null}
      </div>
    </div>
  )
}
