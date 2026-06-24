import { useState } from 'react'
import { Alert } from '@/shared/ui/Alert'
import { Drawer } from '@/shared/ui/Drawer'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SleepForm } from '@/features/sleep/components/SleepForm'
import { SleepMonthView } from '@/features/sleep/components/SleepMonthView/SleepMonthView'
import {
  useCreateSleepLogMutation,
  useRemoveSleepLogMutation,
  useUpdateSleepLogMutation,
} from '@/features/sleep/hooks/useSleep'
import type { SleepLog, SleepLogInput } from '@/features/sleep/types/sleep.types'
import { sleepDateToInputValue } from '@/features/sleep/utils/sleep.utils'

export function SleepPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<SleepLog | null>(null)
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const createMutation = useCreateSleepLogMutation()
  const updateMutation = useUpdateSleepLogMutation()
  const removeMutation = useRemoveSleepLogMutation()

  function openCreate(date?: string) {
    setEditing(null)
    setPrefillDate(date)
    setMutationError(null)
    setDrawerOpen(true)
  }

  function openEdit(log: SleepLog) {
    setEditing(log)
    setPrefillDate(undefined)
    setMutationError(null)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditing(null)
    setPrefillDate(undefined)
  }

  async function handleSubmit(values: SleepLogInput) {
    setMutationError(null)
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          ...values,
          previousSleepDate: sleepDateToInputValue(editing.sleepDate),
        })
      } else {
        await createMutation.mutateAsync(values)
      }
      closeDrawer()
    } catch {
      setMutationError('No se pudo guardar el registro. Intenta de nuevo.')
    }
  }

  async function handleDelete(log: SleepLog) {
    setDeletingId(log.id)
    try {
      await removeMutation.mutateAsync({
        id: log.id,
        sleepDate: log.sleepDate,
      })
    } finally {
      setDeletingId(null)
    }
  }

  const formLoading = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <PageHeader
        title="Sueño"
        subtitle="Seguimiento mensual de tus sesiones de sueño."
      />

      {mutationError && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert variant="danger">{mutationError}</Alert>
        </div>
      )}

      <SleepMonthView
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? 'Editar registro de sueño' : 'Registrar sueño'}
      >
        <SleepForm
          initialValues={editing ?? undefined}
          prefillDate={prefillDate}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={closeDrawer}
        />
      </Drawer>
    </>
  )
}
