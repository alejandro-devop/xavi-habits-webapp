import { useMemo, useState } from 'react'
import { HabitCategoryForm } from '@/features/habits/components/HabitCategoryForm'
import {
  useHabitCategoriesQuery,
  useCreateHabitCategoryMutation,
  useUpdateHabitCategoryMutation,
  useRemoveHabitCategoryMutation,
} from '@/features/habits/hooks/useHabitCategories'
import type { HabitCategoryFormValues } from '@/features/habits/types/habit-category.types'
import type { HabitCategory } from '@/features/habits/types/habit.types'
import {
  categoryToFormValues,
  defaultCategoryFormValues,
  buildCategoryCreatePayload,
  buildCategoryEditPayload,
  nextCategoryOrderIndex,
} from '@/features/habits/utils/habit-category-form.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Modal } from '@/shared/ui/Modal'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './HabitCategoriesPage.module.scss'

type FormMode = { type: 'create' } | { type: 'edit'; category: HabitCategory }

export function HabitCategoriesPage() {
  const { data: categories = [], isLoading, isError, error, refetch } = useHabitCategoriesQuery()
  const createMutation = useCreateHabitCategoryMutation()
  const updateMutation = useUpdateHabitCategoryMutation()
  const removeMutation = useRemoveHabitCategoryMutation()
  const { confirm } = useConfirmDialog()

  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [formValues, setFormValues] = useState<HabitCategoryFormValues>(defaultCategoryFormValues())

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name),
      ),
    [categories],
  )

  const openCreate = () => {
    setFormValues(defaultCategoryFormValues(nextCategoryOrderIndex(categories)))
    setFormMode({ type: 'create' })
  }

  const openEdit = (category: HabitCategory) => {
    setFormValues(categoryToFormValues(category))
    setFormMode({ type: 'edit', category })
  }

  const closeForm = () => {
    if (createMutation.isPending || updateMutation.isPending) return
    setFormMode(null)
  }

  const handleSubmit = (values: HabitCategoryFormValues) => {
    if (formMode?.type === 'create') {
      const input = buildCategoryCreatePayload(values)
      createMutation.mutate(input, { onSuccess: () => setFormMode(null) })
      return
    }

    if (formMode?.type === 'edit') {
      const input = buildCategoryEditPayload(values, formMode.category)
      updateMutation.mutate(input, { onSuccess: () => setFormMode(null) })
    }
  }

  const handleDelete = async (category: HabitCategory) => {
    const confirmed = await confirm({
      title: 'Eliminar categoría',
      description: `¿Eliminar "${category.name}"? No podrás eliminarla si tiene hábitos asignados.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) return
    removeMutation.mutate(category.id)
  }

  const modalOpen = formMode !== null
  const modalTitle = formMode?.type === 'edit' ? 'Editar categoría' : 'Nueva categoría'
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <p className={styles.lead}>Organiza tus hábitos en categorías con icono, color y orden.</p>
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
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No hay categorías todavía.</p>
          <Button type="button" onClick={openCreate}>
            Crear la primera categoría
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && sortedCategories.length > 0 ? (
        <div className={styles.grid}>
          {sortedCategories.map((category) => {
            const accent = category.color ?? 'var(--color-border)'
            return (
              <Card key={category.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span
                    className={styles.iconWrap}
                    style={{
                      backgroundColor: `${accent}22`,
                      color: accent,
                      borderColor: accent,
                    }}
                    aria-hidden
                  >
                    {category.icon ? (
                      <AppIcon name={category.icon} size="md" decorative />
                    ) : (
                      <AppIcon name="list-check" size="md" decorative />
                    )}
                  </span>
                  <div className={styles.cardMeta}>
                    <h3 className={styles.cardName}>{category.name}</h3>
                    <span className={styles.cardOrder}>Orden {category.orderIndex}</span>
                  </div>
                </div>

                {category.description ? (
                  <p className={styles.cardDescription}>{category.description}</p>
                ) : (
                  <p className={styles.cardDescriptionMuted}>Sin descripción</p>
                )}

                <div className={styles.cardActions}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(category)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDelete(category)}
                    disabled={removeMutation.isPending && removeMutation.variables === category.id}
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : null}

      <Modal open={modalOpen} onClose={closeForm} title={modalTitle} size="md">
        <HabitCategoryForm
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
