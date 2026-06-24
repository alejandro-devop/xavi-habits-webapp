import { useMemo, useState } from 'react'
import { HabitMeasureForm } from '@/features/habits/components/HabitMeasureForm'
import {
  useHabitMeasuresQuery,
  useCreateHabitMeasureMutation,
  useUpdateHabitMeasureMutation,
  useRemoveHabitMeasureMutation,
} from '@/features/habits/hooks/useHabitMeasures'
import type { HabitMeasureFormValues } from '@/features/habits/types/habit-measure.types'
import type { HabitMeasure } from '@/features/habits/types/habit.types'
import {
  measureToFormValues,
  defaultMeasureFormValues,
  buildMeasureCreatePayload,
  buildMeasureEditPayload,
  formatMeasureLabel,
} from '@/features/habits/utils/habit-measure-form.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Modal } from '@/shared/ui/Modal'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './HabitMeasuresPage.module.scss'

type FormMode = { type: 'create' } | { type: 'edit'; measure: HabitMeasure }

export function HabitMeasuresPage() {
  const { data: measures = [], isLoading, isError, error, refetch } = useHabitMeasuresQuery()
  const createMutation = useCreateHabitMeasureMutation()
  const updateMutation = useUpdateHabitMeasureMutation()
  const removeMutation = useRemoveHabitMeasureMutation()
  const { confirm } = useConfirmDialog()

  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [formValues, setFormValues] = useState<HabitMeasureFormValues>(defaultMeasureFormValues())

  const sortedMeasures = useMemo(
    () => [...measures].sort((a, b) => a.name.localeCompare(b.name)),
    [measures],
  )

  const openCreate = () => {
    setFormValues(defaultMeasureFormValues())
    setFormMode({ type: 'create' })
  }

  const openEdit = (measure: HabitMeasure) => {
    setFormValues(measureToFormValues(measure))
    setFormMode({ type: 'edit', measure })
  }

  const closeForm = () => {
    if (createMutation.isPending || updateMutation.isPending) return
    setFormMode(null)
  }

  const handleSubmit = (values: HabitMeasureFormValues) => {
    if (formMode?.type === 'create') {
      const input = buildMeasureCreatePayload(values)
      createMutation.mutate(input, { onSuccess: () => setFormMode(null) })
      return
    }

    if (formMode?.type === 'edit') {
      const input = buildMeasureEditPayload(values, formMode.measure)
      updateMutation.mutate(input, { onSuccess: () => setFormMode(null) })
    }
  }

  const handleDelete = async (measure: HabitMeasure) => {
    const confirmed = await confirm({
      title: 'Eliminar medida',
      description: `¿Eliminar "${measure.name}"? Los hábitos que la usen quedarán sin medida asignada.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) return
    removeMutation.mutate(measure.id)
  }

  const modalOpen = formMode !== null
  const modalTitle = formMode?.type === 'edit' ? 'Editar medida' : 'Nueva medida'
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <p className={styles.lead}>
          Define unidades para hábitos de contador o tiempo (vasos, km, minutos, etc.).
        </p>
        <Button type="button" onClick={openCreate} disabled={isLoading}>
          Nueva medida
        </Button>
      </div>

      {isError ? (
        <Alert variant="danger" title="No se pudieron cargar las medidas">
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

      {!isLoading && !isError && sortedMeasures.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No hay medidas todavía.</p>
          <Button type="button" onClick={openCreate}>
            Crear la primera medida
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && sortedMeasures.length > 0 ? (
        <div className={styles.grid}>
          {sortedMeasures.map((measure) => (
            <Card key={measure.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.iconWrap} aria-hidden>
                  <AppIcon name="weight-scale" size="md" decorative />
                </span>
                <div className={styles.cardMeta}>
                  <h3 className={styles.cardName}>{formatMeasureLabel(measure)}</h3>
                  {measure.type ? (
                    <span className={styles.cardType}>{measure.type}</span>
                  ) : (
                    <span className={styles.cardTypeMuted}>Sin tipo</span>
                  )}
                </div>
              </div>

              <div className={styles.cardActions}>
                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(measure)}>
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(measure)}
                  disabled={removeMutation.isPending && removeMutation.variables === measure.id}
                >
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      <Modal open={modalOpen} onClose={closeForm} title={modalTitle} size="md">
        <HabitMeasureForm
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
