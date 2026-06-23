import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { HabitPurpose, HabitPurposePlacement } from '@/features/habits/types/habit-purpose.types'
import type { HabitPurposeInput } from '@/features/habits/types/habit-purpose.types'
import {
  useHabitPurposesQuery,
  useCreateHabitPurposeMutation,
  useUpdateHabitPurposeMutation,
  useRemoveHabitPurposeMutation,
} from '@/features/habits/hooks/useHabitPurposes'
import { HabitPurposeCard } from '@/features/habits/components/HabitPurposeCard'
import { HabitPurposeForm } from '@/features/habits/components/HabitPurposeForm'
import { PersonaColumn } from '@/features/habits/components/PersonaColumn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Modal } from '@/shared/ui/Modal'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './HabitPersonaPage.module.scss'

export function HabitPersonaPage() {
  const { data: purposes = [], isLoading, isError, error, refetch } = useHabitPurposesQuery()
  const createMutation = useCreateHabitPurposeMutation()
  const updateMutation = useUpdateHabitPurposeMutation()
  const removeMutation = useRemoveHabitPurposeMutation()
  const { confirm } = useConfirmDialog()

  const [editingPurpose, setEditingPurpose] = useState<HabitPurpose | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const pool = purposes.filter((p) => p.placement === 'pool')
  const want = purposes.filter((p) => p.placement === 'want')
  const avoid = purposes.filter((p) => p.placement === 'avoid')

  const activePurpose = activeId ? purposes.find((p) => p.id === activeId) ?? null : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || !activeId) return
    const currentPurpose = purposes.find((p) => p.id === active.id)
    if (!currentPurpose) return
    const newPlacement = over.id as HabitPurposePlacement
    if (newPlacement === currentPurpose.placement) return
    updateMutation.mutate({ id: currentPurpose.id, placement: newPlacement })
  }

  const handleCreate = (values: HabitPurposeInput) => {
    createMutation.mutate(
      { ...values, placement: 'pool' },
      { onSuccess: () => setIsCreating(false) },
    )
  }

  const handleEdit = (values: HabitPurposeInput) => {
    if (!editingPurpose) return
    updateMutation.mutate(
      { id: editingPurpose.id, ...values },
      { onSuccess: () => setEditingPurpose(null) },
    )
  }

  const handleMove = (id: string, placement: HabitPurposePlacement) => {
    updateMutation.mutate({ id, placement })
  }

  const handleDelete = async (id: string) => {
    const purpose = purposes.find((p) => p.id === id)
    const confirmed = await confirm({
      title: 'Eliminar propósito',
      description: `¿Eliminar "${purpose?.name ?? 'este propósito'}"?`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) return
    removeMutation.mutate(id)
  }

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.heading}>Mi Persona Ideal</h2>
          <p className={styles.lead}>Define quién quieres ser y qué quieres evitar.</p>
        </div>
        <Button type="button" onClick={() => setIsCreating(true)} disabled={isLoading}>
          Nuevo propósito
        </Button>
      </div>

      {isError ? (
        <Alert variant="danger" title="No se pudieron cargar los propósitos">
          {error instanceof Error ? error.message : 'Error desconocido'}
          <Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} height={40} radius="var(--radius-md)" />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={styles.threeColumns}>
            <PersonaColumn
              title="Sin asignar"
              placement="pool"
              purposes={pool}
              onEdit={(p) => setEditingPurpose(p)}
              onDelete={(id) => void handleDelete(id)}
              onMove={handleMove}
            />
            <PersonaColumn
              title="Lo que quiero"
              placement="want"
              purposes={want}
              onEdit={(p) => setEditingPurpose(p)}
              onDelete={(id) => void handleDelete(id)}
              onMove={handleMove}
            />
            <PersonaColumn
              title="Lo que no quiero"
              placement="avoid"
              purposes={avoid}
              onEdit={(p) => setEditingPurpose(p)}
              onDelete={(id) => void handleDelete(id)}
              onMove={handleMove}
            />
          </div>

          <DragOverlay>
            {activePurpose ? (
              <HabitPurposeCard
                purpose={activePurpose}
                onEdit={() => {}}
                onDelete={() => {}}
                onMove={() => {}}
                dragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      <Modal
        open={isCreating}
        onClose={() => { if (!createMutation.isPending) setIsCreating(false) }}
        title="Nuevo propósito"
        size="md"
      >
        <HabitPurposeForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      <Modal
        open={editingPurpose !== null}
        onClose={() => { if (!updateMutation.isPending) setEditingPurpose(null) }}
        title="Editar propósito"
        size="md"
      >
        <HabitPurposeForm
          initial={editingPurpose ?? undefined}
          onSubmit={handleEdit}
          onCancel={() => setEditingPurpose(null)}
          loading={updateMutation.isPending}
        />
      </Modal>
    </section>
  )
}
