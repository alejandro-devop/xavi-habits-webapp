import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui'
import { IconButton } from '@/shared/ui/IconButton'
import { useActivateQuarterMutation } from '@/features/quarters/hooks/useQuarters'
import { formatDateRange } from '@/features/quarters/utils/format'
import type { BadgeVariant } from '@/shared/ui/Badge'
import type { Quarter, QuarterStatus } from '@/features/quarters/types/quarter.types'
import styles from './QuarterCard.module.scss'

const STATUS_LABEL: Record<QuarterStatus, string> = {
  planning: 'Planificando',
  active: 'Activo',
  completed: 'Completado',
}

const STATUS_VARIANT: Record<QuarterStatus, BadgeVariant> = {
  planning: 'warning',
  active: 'success',
  completed: 'neutral',
}

type Props = {
  quarter: Quarter
  onEdit: () => void
  hasActiveQuarter: boolean
}

export function QuarterCard({ quarter, onEdit, hasActiveQuarter }: Props) {
  const activateMutation = useActivateQuarterMutation()

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.name}>{quarter.name}</h3>
          <Badge variant={STATUS_VARIANT[quarter.status]}>{STATUS_LABEL[quarter.status]}</Badge>
        </div>
        <div className={styles.actions}>
          <IconButton icon="pencil" size="sm" aria-label="Editar quarter" onClick={onEdit} />
        </div>
      </div>

      <p className={styles.dates}>
        {formatDateRange(quarter.startDate, quarter.endDate)}
      </p>

      {quarter.projects.length > 0 && (
        <div className={styles.projectsList}>
          {quarter.projects.map((qp) => (
            <span key={qp.id} className={styles.projectTag}>
              {qp.project.name} · {qp.weeklyHours}h
            </span>
          ))}
        </div>
      )}

      {quarter.status === 'planning' && !hasActiveQuarter && (
        <div className={styles.footer}>
          <Button
            variant="primary"
            size="sm"
            disabled={activateMutation.isPending}
            onClick={() => activateMutation.mutate(quarter.id)}
          >
            {activateMutation.isPending ? 'Activando…' : 'Activar quarter'}
          </Button>
        </div>
      )}

      {quarter.status === 'planning' && hasActiveQuarter && (
        <p className={styles.hint}>Ya hay un quarter activo. Complétalo antes de activar este.</p>
      )}

      {quarter.status === 'completed' && quarter.retrospectiveNotes && (
        <p className={styles.notes}>{quarter.retrospectiveNotes}</p>
      )}
    </div>
  )
}
