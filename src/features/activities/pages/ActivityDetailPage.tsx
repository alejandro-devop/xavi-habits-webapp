import { Link, useNavigate, useParams } from 'react-router'
import { ActivityPriorityBadge } from '@/features/activities/components/ActivityPriorityBadge'
import { ActivityStatusBadge } from '@/features/activities/components/ActivityStatusBadge'
import { ActivityTimeTrackingPlaceholder } from '@/features/activities/components/ActivityTimeTrackingPlaceholder'
import {
  useActivityQuery,
  useCompleteActivityMutation,
  useDeleteActivityMutation,
} from '@/features/activities/hooks/useActivities'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { formatActivityDate } from '@/features/activities/utils/activity-date'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './ActivityDetailPage.module.scss'

export function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const { data: activity, isLoading, isError, error } = useActivityQuery(id)
  const completeMutation = useCompleteActivityMutation()
  const deleteMutation = useDeleteActivityMutation()

  const handleComplete = () => {
    if (!id) return
    completeMutation.mutate(id)
  }

  const handleDelete = async () => {
    if (!activity) return
    const confirmed = await confirm({
      title: 'Eliminar actividad',
      description: `¿Eliminar "${activity.title}"?`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed || !id) return
    deleteMutation.mutate(id, {
      onSuccess: () => navigate(activitiesPaths.root),
    })
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton height={32} width="60%" />
        <Skeleton height={120} />
      </div>
    )
  }

  if (isError || !activity) {
    return (
      <Alert variant="danger" title="Actividad no encontrada">
        {error instanceof Error ? error.message : 'No se pudo cargar la actividad.'}
        <Button variant="ghost" size="sm" to={activitiesPaths.root}>
          Volver al listado
        </Button>
      </Alert>
    )
  }

  const accent = activity.category?.color ?? 'var(--color-border)'
  const isCompleted = activity.status === 'completed'

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button variant="ghost" size="sm" to={activitiesPaths.root}>
          ← Actividades
        </Button>
        <Button variant="ghost" size="sm" to={activitiesPaths.edit(activity.id)}>
          Editar
        </Button>
      </div>

      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <Card className={styles.mainCard}>
            <div className={styles.header}>
              <span
                className={styles.iconWrap}
                style={{ backgroundColor: `${accent}22`, color: accent, borderColor: accent }}
                aria-hidden
              >
                <AppIcon name={activity.category?.icon ?? 'list-check'} size="lg" decorative />
              </span>
              <div>
                <h1 className={styles.title}>{activity.title}</h1>
                {activity.category ? (
                  <Link to={activitiesPaths.categories} className={styles.categoryLink}>
                    {activity.category.name}
                  </Link>
                ) : (
                  <span className={styles.categoryMuted}>Sin categoría</span>
                )}
              </div>
            </div>

            {activity.description ? (
              <p className={styles.description}>{activity.description}</p>
            ) : (
              <p className={styles.descriptionMuted}>Sin descripción</p>
            )}

            <div className={styles.badges}>
              <ActivityPriorityBadge priority={activity.priority} />
              <ActivityStatusBadge status={activity.status} />
            </div>
          </Card>

          <ActivityTimeTrackingPlaceholder spentTimeMinutes={activity.spentTimeMinutes} />
        </div>

        <aside className={styles.sideCol}>
          <Card className={styles.sideCard}>
            <dl className={styles.metaGrid}>
              <div>
                <dt>Programada</dt>
                <dd>{formatActivityDate(activity.scheduledDate)}</dd>
              </div>
              <div>
                <dt>Completada</dt>
                <dd>{formatActivityDate(activity.completedAt)}</dd>
              </div>
              <div>
                <dt>Creada</dt>
                <dd>{formatActivityDate(activity.createdAt)}</dd>
              </div>
              <div>
                <dt>Actualizada</dt>
                <dd>{formatActivityDate(activity.updatedAt)}</dd>
              </div>
            </dl>

            <div className={styles.sideActions}>
              {!isCompleted ? (
                <Button
                  onClick={handleComplete}
                  isLoading={completeMutation.isPending}
                  className={styles.sideActionBtn}
                >
                  Completar actividad
                </Button>
              ) : null}
              <Button
                variant="danger"
                onClick={() => void handleDelete()}
                isLoading={deleteMutation.isPending}
                className={styles.sideActionBtn}
              >
                Eliminar
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <div className={styles.mobileActions}>
        {!isCompleted ? (
          <Button
            variant="primary"
            onClick={handleComplete}
            isLoading={completeMutation.isPending}
            className={styles.mobileActionBtn}
          >
            Completar
          </Button>
        ) : null}
        <Button
          variant="danger"
          onClick={() => void handleDelete()}
          isLoading={deleteMutation.isPending}
          className={styles.mobileActionBtn}
        >
          Eliminar
        </Button>
      </div>
    </div>
  )
}
