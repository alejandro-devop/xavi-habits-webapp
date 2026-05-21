import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ActivityForm } from '@/features/activities/components/ActivityForm'
import { useActivityCategoriesQuery } from '@/features/activities/hooks/useActivityCategories'
import { useCreateActivityMutation } from '@/features/activities/hooks/useActivities'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { emptyActivityFormValues, formValuesToInput } from '@/features/activities/utils/activity-form'
import type { ActivityFormValues } from '@/features/activities/types/activity.types'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './ActivityFormPage.module.scss'

export function ActivityCreatePage() {
  const navigate = useNavigate()
  const { data: categories = [], isLoading: categoriesLoading } = useActivityCategoriesQuery()
  const createMutation = useCreateActivityMutation()
  const [values, setValues] = useState<ActivityFormValues>(emptyActivityFormValues())

  const handleSubmit = (formValues: ActivityFormValues) => {
    createMutation.mutate(formValuesToInput(formValues), {
      onSuccess: (activity) => navigate(activitiesPaths.detail(activity.id)),
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" size="sm" to={activitiesPaths.root}>
          ← Volver
        </Button>
        <h1 className={styles.title}>Nueva actividad</h1>
      </div>

      {categoriesLoading ? (
        <Skeleton height={320} />
      ) : (
        <ActivityForm
          values={values}
          categories={categories}
          onChange={setValues}
          onSubmit={handleSubmit}
          onCancel={() => navigate(activitiesPaths.root)}
          submitLabel="Crear actividad"
          loading={createMutation.isPending}
        />
      )}
    </div>
  )
}
