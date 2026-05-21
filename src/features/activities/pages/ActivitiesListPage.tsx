import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ActivityCard } from '@/features/activities/components/ActivityCard'
import { ActivityEmptyState } from '@/features/activities/components/ActivityEmptyState'
import { ActivityFilters } from '@/features/activities/components/ActivityFilters'
import { ActivityListHeader } from '@/features/activities/components/ActivityListHeader'
import { ActivityTable } from '@/features/activities/components/ActivityTable'
import {
  useActivitiesQuery,
  useCompleteActivityMutation,
  useDeleteActivityMutation,
} from '@/features/activities/hooks/useActivities'
import { useActivityCategoriesQuery } from '@/features/activities/hooks/useActivityCategories'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import type { Activity } from '@/features/activities/types/activity.types'
import {
  DEFAULT_ACTIVITY_FILTERS,
  filterActivitiesBySearch,
} from '@/features/activities/utils/activity-filters'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './ActivitiesListPage.module.scss'

export function ActivitiesListPage() {
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const [filters, setFilters] = useState(DEFAULT_ACTIVITY_FILTERS)

  const { data: categories = [] } = useActivityCategoriesQuery()
  const { data, isLoading, isError, error, refetch } = useActivitiesQuery(filters)
  const completeMutation = useCompleteActivityMutation()
  const deleteMutation = useDeleteActivityMutation()

  const displayedActivities = useMemo(() => {
    const list = data?.activities ?? []
    return filterActivitiesBySearch(list, filters.search ?? '')
  }, [data?.activities, filters.search])

  const hasActiveFilters = Boolean(
    filters.status || filters.priority || filters.categoryId || filters.search?.trim(),
  )

  const handleClearFilters = () => {
    setFilters(DEFAULT_ACTIVITY_FILTERS)
  }

  const handleComplete = (activity: Activity) => {
    completeMutation.mutate(activity.id)
  }

  const handleDelete = async (activity: Activity) => {
    const confirmed = await confirm({
      title: 'Eliminar actividad',
      description: `¿Eliminar "${activity.title}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) return
    deleteMutation.mutate(activity.id)
  }

  return (
    <div className={styles.page}>
      <ActivityListHeader total={data?.total} onCreate={() => navigate(activitiesPaths.new)} />

      <ActivityFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
        onClear={handleClearFilters}
      />

      {isError ? (
        <Alert variant="danger" title="No se pudieron cargar las actividades">
          {error instanceof Error ? error.message : 'Error desconocido'}
          <Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      {isLoading ? (
        <>
          <div className={styles.desktopOnly}>
            <div className={styles.skeletonTable}>
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} height={40} />
              ))}
            </div>
          </div>
          <div className={styles.mobileOnly}>
            <div className={styles.cardGrid}>
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <Skeleton height={48} />
                  <Skeleton height={16} width="70%" />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {!isLoading && !isError && displayedActivities.length === 0 ? (
        <ActivityEmptyState
          onCreate={() => navigate(activitiesPaths.new)}
          hasFilters={hasActiveFilters}
        />
      ) : null}

      {!isLoading && !isError && displayedActivities.length > 0 ? (
        <>
          <div className={styles.desktopOnly}>
            <ActivityTable
              activities={displayedActivities}
              onComplete={handleComplete}
              onDelete={handleDelete}
              completingId={
                completeMutation.isPending ? completeMutation.variables : undefined
              }
              deletingId={deleteMutation.isPending ? deleteMutation.variables : undefined}
            />
          </div>
          <div className={styles.mobileOnly}>
            <div className={styles.cardGrid}>
              {displayedActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  completing={
                    completeMutation.isPending &&
                    completeMutation.variables === activity.id
                  }
                  deleting={
                    deleteMutation.isPending && deleteMutation.variables === activity.id
                  }
                />
              ))}
            </div>
          </div>
        </>
      ) : null}

      <Button
        type="button"
        className={styles.fab}
        onClick={() => navigate(activitiesPaths.new)}
        aria-label="Nueva actividad"
      >
        <AppIcon name="plus" size="md" decorative />
      </Button>
    </div>
  )
}
