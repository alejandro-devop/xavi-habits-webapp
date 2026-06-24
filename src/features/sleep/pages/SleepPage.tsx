import { useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SleepLogModal } from '@/features/sleep/components/SleepLogModal'
import { SleepMonthView } from '@/features/sleep/components/SleepMonthView/SleepMonthView'
import {
  useCreateSleepLogMutation,
  useRemoveSleepLogMutation,
  useUpdateSleepLogMutation,
} from '@/features/sleep/hooks/useSleep'
import type { SleepLog, SleepLogInput } from '@/features/sleep/types/sleep.types'
import { sleepDateToInputValue } from '@/features/sleep/utils/sleep.utils'

export function SleepPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SleepLog | null>(null)
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useCreateSleepLogMutation()
  const updateMutation = useUpdateSleepLogMutation()
  const removeMutation = useRemoveSleepLogMutation()

  function openCreate(date?: string) {
    setEditing(null)
    setPrefillDate(date)
    setSubmitError(null)
    setModalOpen(true)
  }

  function openEdit(log: SleepLog) {
    setEditing(log)
    setPrefillDate(undefined)
    setSubmitError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setPrefillDate(undefined)
  }

  async function handleSubmit(values: SleepLogInput) {
    setSubmitError(null)
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
      closeModal()
    } catch {
      setSubmitError('No se pudo guardar el registro. Intenta de nuevo.')
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
      <PageHeader title="Sueño" subtitle="Seguimiento mensual de tus sesiones de sueño." />

      <SleepMonthView
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      <SleepLogModal
        open={modalOpen}
        onClose={closeModal}
        initialLog={editing ?? undefined}
        prefillDate={prefillDate}
        loading={formLoading}
        submitError={submitError}
        onSubmit={handleSubmit}
      />
    </>
  )
}
