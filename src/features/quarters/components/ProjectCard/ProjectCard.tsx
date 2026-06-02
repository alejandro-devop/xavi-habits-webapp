import { Badge } from '@/shared/ui/Badge'
import { IconButton } from '@/shared/ui/IconButton'
import type { BadgeVariant } from '@/shared/ui/Badge'
import type { Project, ProjectStatus } from '@/features/quarters/types/quarter.types'
import styles from './ProjectCard.module.scss'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Activo',
  paused: 'En pausa',
  completed: 'Completado',
  archived: 'Archivado',
}

const STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  active: 'success',
  paused: 'warning',
  completed: 'primary',
  archived: 'neutral',
}

type Props = {
  project: Project
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ProjectCard({ project, onClick, onEdit, onDelete }: Props) {
  const objectivesTotal = project.objectives.length
  const objectivesDone = project.objectives.filter((o) => o.status === 'completed').length

  return (
    <div className={styles.card} role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className={styles.header}>
        <h3 className={styles.name}>{project.name}</h3>
        <div className={styles.actions} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <IconButton icon="pencil" size="sm" aria-label="Editar proyecto" onClick={onEdit} />
          <IconButton icon="trash" size="sm" aria-label="Eliminar proyecto" onClick={onDelete} />
        </div>
      </div>

      {project.description && <p className={styles.description}>{project.description}</p>}

      <div className={styles.footer}>
        <Badge variant={STATUS_VARIANT[project.status]}>{STATUS_LABEL[project.status]}</Badge>
        {objectivesTotal > 0 && (
          <span className={styles.objectives}>
            {objectivesDone}/{objectivesTotal} objetivos
          </span>
        )}
      </div>
    </div>
  )
}
