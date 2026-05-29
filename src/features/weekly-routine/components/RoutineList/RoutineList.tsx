import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Badge } from '@/shared/ui/Badge'
import type { WeeklyRoutine } from '@/features/weekly-routine/types/weekly-routine.types'
import styles from './RoutineList.module.scss'

type Props = {
  routines: WeeklyRoutine[]
  onAdd: () => void
  onEdit: (routine: WeeklyRoutine) => void
  onDelete: (id: string) => void
  onSetActive: (id: string) => void
  onOpen: (id: string) => void
}

export function RoutineList({ routines, onEdit, onDelete, onSetActive, onOpen }: Props) {
  const { confirm } = useConfirmDialog()

  async function handleDelete(routine: WeeklyRoutine) {
    const ok = await confirm({
      title: 'Eliminar rutina',
      description: `¿Eliminar "${routine.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (ok) onDelete(routine.id)
  }

  if (routines.length === 0) {
    return (
      <div className={styles.empty}>
        <AppIcon name="calendar-week" size="lg" className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>Sin rutinas</p>
        <p className={styles.emptyText}>Crea tu primera rutina semanal para empezar.</p>
      </div>
    )
  }

  return (
    <ul className={styles.list} role="list">
      {routines.map((routine) => (
        <li
          key={routine.id}
          className={[styles.item, routine.isActive ? styles.itemActive : ''].join(' ')}
        >
          <button
            type="button"
            className={styles.itemMain}
            onClick={() => onOpen(routine.id)}
            aria-label={`Abrir planner de ${routine.name}`}
          >
            <div className={styles.iconWrap}>
              <AppIcon name="calendar-week" size="md" />
            </div>
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{routine.name}</span>
              {routine.isActive && (
                <Badge variant="success">Activa</Badge>
              )}
            </div>
            <AppIcon name="chevron-right" size="sm" className={styles.itemChevron} />
          </button>

          <div className={styles.itemActions}>
            {!routine.isActive && (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => onSetActive(routine.id)}
                aria-label="Activar rutina"
                title="Activar"
              >
                <AppIcon name="circle-play" size="sm" />
              </button>
            )}
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => onEdit(routine)}
              aria-label="Editar rutina"
              title="Editar"
            >
              <AppIcon name="pen" size="sm" />
            </button>
            <button
              type="button"
              className={[styles.actionBtn, styles.actionBtnDanger].join(' ')}
              onClick={() => handleDelete(routine)}
              aria-label="Eliminar rutina"
              title="Eliminar"
            >
              <AppIcon name="trash" size="sm" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
