import type { StandupItem, StandupItemStatus } from '@/features/activities/types/standup.types'
import { Badge, type BadgeVariant } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import styles from './StandupItemDrawer.module.scss'

const STATUS_LABELS: Record<StandupItemStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  blocked: 'Bloqueada',
  completed: 'Completada',
}

const STATUS_BADGE: Record<StandupItemStatus, BadgeVariant> = {
  pending: 'neutral',
  in_progress: 'primary',
  blocked: 'danger',
  completed: 'success',
}

const ALL_STATUSES: StandupItemStatus[] = ['pending', 'in_progress', 'blocked', 'completed']

type StandupItemDrawerProps = {
  item: StandupItem | null
  memberName: string
  onClose: () => void
  onEdit: () => void
  onMove: (status: StandupItemStatus) => void
  onCreateTodo: () => void
  onDelete: () => void
  canCreateTodo: boolean
  creatingTodo: boolean
  interactive?: boolean
}

export function StandupItemDrawer({
  item,
  memberName,
  onClose,
  onEdit,
  onMove,
  onCreateTodo,
  onDelete,
  canCreateTodo,
  creatingTodo,
  interactive = true,
}: StandupItemDrawerProps) {
  return (
    <Drawer open={Boolean(item)} onClose={onClose} side="right" title={item?.title ?? 'Entrada'}>
      {item ? (
        <div className={styles.content}>
          <div className={styles.badgeRow}>
            <Badge variant={STATUS_BADGE[item.status]}>{STATUS_LABELS[item.status]}</Badge>
            <Badge variant="neutral">{memberName}</Badge>
            {item.daysInBacklog > 0 ? (
              <Badge variant="warning">{item.daysInBacklog}d en backlog</Badge>
            ) : null}
          </div>

          {item.ticketNumber ? (
            <div className={styles.field}>
              <span className={styles.label}>Ticket</span>
              <span>#{item.ticketNumber}</span>
            </div>
          ) : null}

          {item.status === 'blocked' && item.blockedReason ? (
            <div className={styles.field}>
              <span className={styles.label}>Motivo del bloqueo</span>
              <p className={styles.blockedReason}>🚧 {item.blockedReason}</p>
            </div>
          ) : null}

          {item.notes ? (
            <div className={styles.field}>
              <span className={styles.label}>Notas</span>
              <p className={styles.notes}>{item.notes}</p>
            </div>
          ) : null}

          {item.linkedTodoId ? (
            <div className={styles.field}>
              <span className={styles.label}>Tareas</span>
              <span>Ya tiene una tarea vinculada</span>
            </div>
          ) : null}

          {interactive ? (
            <>
              <div className={styles.field}>
                <span className={styles.label}>Mover a</span>
                <div className={styles.moveRow}>
                  {ALL_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`${styles.movePill} ${status === item.status ? styles.movePillActive : ''}`}
                      disabled={status === item.status}
                      onClick={() => onMove(status)}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <Button variant="secondary" onClick={onEdit}>
                  Editar
                </Button>
                <Button
                  variant="secondary"
                  disabled={creatingTodo || !canCreateTodo}
                  onClick={onCreateTodo}
                >
                  {item.linkedTodoId ? 'Ver todo' : 'Enviar a tareas'}
                </Button>
              </div>

              <div className={styles.dangerZone}>
                <Button variant="danger" onClick={onDelete}>
                  Eliminar entrada
                </Button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  )
}
