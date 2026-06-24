import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { AppIcon } from '@/shared/ui/AppIcon'
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

function formatTime(time: string) {
  return time.slice(0, 5)
}

function HeroCard({
  routine,
  onEdit,
  onDelete,
  onOpen,
}: {
  routine: WeeklyRoutine
  onEdit: (r: WeeklyRoutine) => void
  onDelete: (r: WeeklyRoutine) => void
  onOpen: (id: string) => void
}) {
  return (
    <article className={styles.hero}>
      <div className={styles.heroAccent} />

      <div className={styles.heroContent}>
        {/* Top row: badge + actions */}
        <div className={styles.heroTopRow}>
          <span className={styles.heroBadge}>
            <span className={styles.heroDot} />
            <span>Activa</span>
          </span>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.heroActionBtn}
              onClick={() => onEdit(routine)}
              aria-label="Editar"
            >
              <AppIcon name="pen" size="sm" />
            </button>
            <button
              type="button"
              className={[styles.heroActionBtn, styles.heroActionBtnDanger].join(' ')}
              onClick={() => onDelete(routine)}
              aria-label="Eliminar"
            >
              <AppIcon name="trash" size="sm" />
            </button>
          </div>
        </div>

        {/* Name + description */}
        <div className={styles.heroBody}>
          <h2 className={styles.heroName}>{routine.name}</h2>
          {routine.description ? (
            <p className={styles.heroDesc}>{routine.description}</p>
          ) : (
            <p className={[styles.heroDesc, styles.heroDescEmpty].join(' ')}>Sin descripción</p>
          )}
        </div>

        {/* Footer: stats + CTA */}
        <div className={styles.heroFooter}>
          <div className={styles.heroStats}>
            {routine.activitiesCount != null && (
              <span className={styles.heroStat}>
                <AppIcon name="list-check" size="sm" />
                <span>{routine.activitiesCount} {routine.activitiesCount === 1 ? 'actividad' : 'actividades'}</span>
              </span>
            )}
            {routine.dayStartTime && routine.dayEndTime && (
              <span className={styles.heroStat}>
                <AppIcon name="clock" size="sm" />
                <span>{formatTime(routine.dayStartTime)} – {formatTime(routine.dayEndTime)}</span>
              </span>
            )}
          </div>
          <button
            type="button"
            className={styles.heroCta}
            onClick={() => onOpen(routine.id)}
          >
            <span>Ver planner</span>
            <AppIcon name="arrow-right" size="sm" />
          </button>
        </div>
      </div>
    </article>
  )
}

function RoutineRow({
  routine,
  onEdit,
  onDelete,
  onSetActive,
  onOpen,
}: {
  routine: WeeklyRoutine
  onEdit: (r: WeeklyRoutine) => void
  onDelete: (r: WeeklyRoutine) => void
  onSetActive: (id: string) => void
  onOpen: (id: string) => void
}) {
  return (
    <article className={styles.row}>
      {/* Clickeable: icono + info */}
      <button
        type="button"
        className={styles.rowClickable}
        onClick={() => onOpen(routine.id)}
      >
        <div className={styles.rowIcon}>
          <AppIcon name="calendar-week" size="sm" />
        </div>
        <div className={styles.rowInfo}>
          <span className={styles.rowName}>{routine.name}</span>
          {routine.description && (
            <span className={styles.rowDesc}>{routine.description}</span>
          )}
        </div>
      </button>

      {/* Stats (no clickeable) */}
      <div className={styles.rowStats}>
        {routine.activitiesCount != null && (
          <span className={styles.rowStat}>
            <AppIcon name="list-check" size="sm" />
            <span>{routine.activitiesCount}</span>
          </span>
        )}
        {routine.dayStartTime && routine.dayEndTime && (
          <span className={styles.rowStat}>
            <AppIcon name="clock" size="sm" />
            <span>{formatTime(routine.dayStartTime)} – {formatTime(routine.dayEndTime)}</span>
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className={styles.rowActions}>
        <button
          type="button"
          className={styles.rowActivateBtn}
          onClick={() => onSetActive(routine.id)}
          title="Activar rutina"
        >
          <AppIcon name="circle-play" size="sm" />
          <span>Activar</span>
        </button>
        <button
          type="button"
          className={styles.rowBtn}
          onClick={() => onEdit(routine)}
          aria-label="Editar"
        >
          <AppIcon name="pen" size="sm" />
        </button>
        <button
          type="button"
          className={[styles.rowBtn, styles.rowBtnDanger].join(' ')}
          onClick={() => onDelete(routine)}
          aria-label="Eliminar"
        >
          <AppIcon name="trash" size="sm" />
        </button>
      </div>
    </article>
  )
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

  const active = routines.find((r) => r.isActive)
  const inactive = routines.filter((r) => !r.isActive)

  return (
    <div className={styles.root}>
      {active && (
        <HeroCard
          routine={active}
          onEdit={onEdit}
          onDelete={handleDelete}
          onOpen={onOpen}
        />
      )}

      {inactive.length > 0 && (
        <section className={styles.otherSection}>
          {active && <p className={styles.otherLabel}>Otras rutinas</p>}
          <div className={styles.rowList}>
            {inactive.map((routine) => (
              <RoutineRow
                key={routine.id}
                routine={routine}
                onEdit={onEdit}
                onDelete={handleDelete}
                onSetActive={onSetActive}
                onOpen={onOpen}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
