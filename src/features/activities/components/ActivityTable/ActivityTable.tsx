import { Link } from 'react-router'
import { ActivityPriorityBadge } from '@/features/activities/components/ActivityPriorityBadge'
import { ActivityStatusBadge } from '@/features/activities/components/ActivityStatusBadge'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import type { Activity } from '@/features/activities/types/activity.types'
import { formatActivityDate, formatSpentMinutes } from '@/features/activities/utils/activity-date'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/Table'
import styles from './ActivityTable.module.scss'

type ActivityTableProps = {
  activities: Activity[]
  onComplete: (activity: Activity) => void
  onDelete: (activity: Activity) => void
  completingId?: string
  deletingId?: string
}

export function ActivityTable({
  activities,
  onComplete,
  onDelete,
  completingId,
  deletingId,
}: ActivityTableProps) {
  return (
    <Table caption="Listado de actividades" className={styles.table}>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Prioridad</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Programada</TableHead>
          <TableHead>Tiempo</TableHead>
          <TableHead align="end">
            <span className={styles.srOnly}>Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((activity) => {
          const isCompleted = activity.status === 'completed'
          return (
            <TableRow key={activity.id}>
              <TableCell>
                <Link to={activitiesPaths.detail(activity.id)} className={styles.titleLink}>
                  {activity.title}
                </Link>
              </TableCell>
              <TableCell>
                <span className={styles.categoryCell}>
                  <AppIcon
                    name={activity.category?.icon ?? 'list-check'}
                    size="sm"
                    decorative
                  />
                  {activity.category?.name ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <ActivityPriorityBadge priority={activity.priority} />
              </TableCell>
              <TableCell>
                <ActivityStatusBadge status={activity.status} />
              </TableCell>
              <TableCell>{formatActivityDate(activity.scheduledDate)}</TableCell>
              <TableCell>{formatSpentMinutes(activity.spentTimeMinutes)}</TableCell>
              <TableCell>
                <div className={styles.actions}>
                  <Button variant="ghost" size="sm" to={activitiesPaths.edit(activity.id)}>
                    Editar
                  </Button>
                  {!isCompleted ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onComplete(activity)}
                      disabled={completingId === activity.id}
                    >
                      Completar
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(activity)}
                    disabled={deletingId === activity.id}
                  >
                    Eliminar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
