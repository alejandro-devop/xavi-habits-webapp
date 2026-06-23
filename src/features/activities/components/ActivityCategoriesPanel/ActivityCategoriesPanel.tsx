import { useMemo, useState } from 'react'
import { ActivityCategoryCard } from '@/features/activities/components/ActivityCategoryCard'
import { ActivityCategoryEmptyState } from '@/features/activities/components/ActivityCategoryEmptyState'
import { ActivityCategoryForm } from '@/features/activities/components/ActivityCategoryForm'
import {
  useActivityCategoriesQuery,
  useCreateActivityCategoryMutation,
  useDeleteActivityCategoryMutation,
  useUpdateActivityCategoryMutation,
} from '@/features/activities/hooks/useActivityCategories'
import type { ActivityCategory } from '@/features/activities/types/activity-category.types'
import type { ActivityCategoryFormValues } from '@/features/activities/types/activity-category.types'
import {
  categoryToFormValues,
  emptyCategoryFormValues,
  formValuesToInput,
  nextOrderIndex,
} from '@/features/activities/utils/activity-category-form'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Modal } from '@/shared/ui/Modal'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './ActivityCategoriesPanel.module.scss'

type FormMode = { type: 'create' } | { type: 'edit'; category: ActivityCategory }

export function ActivityCategoriesPanel() {
  const { data: categories = [], isLoading, isError, error, refetch } = useActivityCategoriesQuery()
  const createMutation = useCreateActivityCategoryMutation()
  const updateMutation = useUpdateActivityCategoryMutation()
  const deleteMutation = useDeleteActivityCategoryMutation()
  const { confirm } = useConfirmDialog()

  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [formValues, setFormValues] = useState<ActivityCategoryFormValues>(
    emptyCategoryFormValues(),
  )

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name)),
    [categories],
  )

  const openCreate = () => {
    setFormValues(emptyCategoryFormValues(nextOrderIndex(categories)))
    setFormMode({ type: 'create' })
  }

  const openEdit = (category: ActivityCategory) => {
    setFormValues(categoryToFormValues(category))
    setFormMode({ type: 'edit', category })
  }

  const closeForm = () => {
    if (createMutation.isPending || updateMutation.isPending) return
    setFormMode(null)
  }

  const handleSubmit = (values: ActivityCategoryFormValues) => {
    const input = formValuesToInput(values)

    if (formMode?.type === 'create') {
      createMutation.mutate(input, { onSuccess: () => setFormMode(null) })
      return
    }

    if (formMode?.type === 'edit') {
      updateMutation.mutate(
        { id: formMode.category.id, ...input },
        { onSuccess: () => setFormMode(null) },
      )
    }
  }

  const handleDelete = async (category: ActivityCategory) => {
    const confirmed = await confirm({
      title: 'Eliminar categoría',
      description: `¿Eliminar "${category.name}"? No podrás eliminarla si tiene actividades asignadas.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })

    if (!confirmed) return
    deleteMutation.mutate(category.id)
  }

  const modalOpen = formMode !== null
  const modalTitle = formMode?.type === 'edit' ? 'Editar categoría' : 'Nueva categoría'
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <p className={styles.lead}>
          Organiza tus actividades en categorías con icono, color y orden.
        </p>
        <Button type="button" onClick={openCreate} disabled={isLoading}>
          Nueva categoría
        </Button>
      </div>

      {isError ? (
        <Alert variant="danger" title="No se pudieron cargar las categorías">
          {error instanceof Error ? error.message : 'Error desconocido'}
          <Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <Skeleton height={48} radius="var(--radius-md)" />
              <Skeleton height={16} width="60%" />
              <Skeleton height={14} width="90%" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && sortedCategories.length === 0 ? (
        <ActivityCategoryEmptyState onCreate={openCreate} />
      ) : null}

      {!isLoading && !isError && sortedCategories.length > 0 ? (
        <div className={styles.grid}>
          {sortedCategories.map((category) => (
            <ActivityCategoryCard
              key={category.id}
              category={category}
              onEdit={openEdit}
              onDelete={handleDelete}
              deleting={deleteMutation.isPending && deleteMutation.variables === category.id}
            />
          ))}
          <button
            type="button"
            className={styles.addCard}
            onClick={openCreate}
            aria-label="Nueva categoría"
          >
            <AppIcon name="plus" size="sm" decorative />
            Nueva categoría
          </button>
        </div>
      ) : null}

      <Modal open={modalOpen} onClose={closeForm} title={modalTitle} size="md">
        <ActivityCategoryForm
          values={formValues}
          onChange={setFormValues}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitLabel={formMode?.type === 'edit' ? 'Guardar' : 'Crear'}
          loading={isSaving}
        />
      </Modal>
    </section>
  )
}
