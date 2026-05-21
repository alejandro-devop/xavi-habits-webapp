import { Link } from 'react-router'
import { ActivityPriorityBadge } from '@/features/activities/components/ActivityPriorityBadge'
import { ActivityStatusBadge } from '@/features/activities/components/ActivityStatusBadge'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import type { Activity } from '@/features/activities/types/activity.types'
import { formatActivityDate, formatSpentMinutes } from '@/features/activities/utils/activity-date'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import styles from './ActivityCard.module.scss'

type ActivityCardProps = {
  activity: Activity
  onComplete: (activity: Activity) => void
  onDelete: (activity: Activity) => void
  completing?: boolean
  deleting?: boolean
}

export function ActivityCard({
  activity,
  onComplete,
  onDelete,
  completing = false,
  deleting = false,
}: ActivityCardProps) {
  const accent = activity.category?.color ?? 'var(--color-border)'
  const isCompleted = activity.status === 'completed'

  return (
    <Card className={styles.card}>
      <div className={styles.top}>
        <span
          className={styles.iconWrap}
          style={{ backgroundColor: `${accent}22`, color: accent, borderColor: accent }}
          aria-hidden
        >
          <AppIcon name={activity.category?.icon ?? 'list-check'} size="md" decorative />
        </span>
        <div className={styles.headText}>
          <Link to={activitiesPaths.detail(activity.id)} className={styles.title}>
            {activity.title}
          </Link>
          <span className={styles.category}>{activity.category?.name ?? 'Sin categoría'}</span>
        </div>
      </div>

      <div className={styles.badges}>
        <ActivityPriorityBadge priority={activity.priority} />
        <ActivityStatusBadge status={activity.status} />
      </div>

      <dl className={styles.meta}>
        <div>
          <dt>Programada</dt>
          <dd>{formatActivityDate(activity.scheduledDate)}</dd>
        </div>
        <div>
          <dt>Tiempo</dt>
          <dd>{formatSpentMinutes(activity.spentTimeMinutes)}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Button variant="ghost" size="sm" to={activitiesPaths.detail(activity.id)}>
          Ver
        </Button>
        <Button variant="ghost" size="sm" to={activitiesPaths.edit(activity.id)}>
          Editar
        </Button>
        {!isCompleted ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComplete(activity)}
            disabled={completing}
          >
            Completar
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(activity)}
          disabled={deleting}
        >
          Eliminar
        </Button>
      </div>
    </Card>
  )
}
