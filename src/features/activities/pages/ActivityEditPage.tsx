import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ActivityForm } from '@/features/activities/components/ActivityForm'
import { useActivityCategoriesQuery } from '@/features/activities/hooks/useActivityCategories'
import { useActivityQuery, useUpdateActivityMutation } from '@/features/activities/hooks/useActivities'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import type { ActivityFormValues } from '@/features/activities/types/activity.types'
import {
  activityToFormValues,
  formValuesToInput,
} from '@/features/activities/utils/activity-form'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './ActivityFormPage.module.scss'

export function ActivityEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: categories = [], isLoading: categoriesLoading } = useActivityCategoriesQuery()
  const { data: activity, isLoading, isError } = useActivityQuery(id)
  const updateMutation = useUpdateActivityMutation()
  const [values, setValues] = useState<ActivityFormValues | null>(null)

  useEffect(() => {
    if (activity) {
      setValues(activityToFormValues(activity))
    }
  }, [activity])

  const handleSubmit = (formValues: ActivityFormValues) => {
    if (!id) return
    const input = formValuesToInput(formValues)
    updateMutation.mutate(
      { id, ...input },
      { onSuccess: () => navigate(activitiesPaths.detail(id)) },
    )
  }

  if (isLoading || categoriesLoading || !values) {
    return (
      <div className={styles.page}>
        <Skeleton height={32} width="40%" />
        <Skeleton height={320} />
      </div>
    )
  }

  if (isError || !activity) {
    return (
      <Alert variant="danger" title="No se pudo cargar la actividad">
        <Button variant="ghost" size="sm" to={activitiesPaths.list}>
          Volver
        </Button>
      </Alert>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" size="sm" to={activitiesPaths.detail(id!)}>
          ← Volver
        </Button>
        <h1 className={styles.title}>Editar actividad</h1>
      </div>

      <ActivityForm
        values={values}
        categories={categories}
        onChange={setValues}
        onSubmit={handleSubmit}
        onCancel={() => navigate(activitiesPaths.detail(id!))}
        submitLabel="Guardar cambios"
        loading={updateMutation.isPending}
      />
    </div>
  )
}
