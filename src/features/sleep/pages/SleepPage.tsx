import { useState } from 'react'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Spinner } from '@/shared/ui/Spinner'
import { SleepEmptyState } from '@/features/sleep/components/SleepEmptyState'
import { SleepForm } from '@/features/sleep/components/SleepForm'
import { SleepLogCard } from '@/features/sleep/components/SleepLogCard'
import {
  useCreateSleepLogMutation,
  useRemoveSleepLogMutation,
  useSleepLogsQuery,
  useUpdateSleepLogMutation,
} from '@/features/sleep/hooks/useSleep'
import type { SleepLog, SleepLogInput } from '@/features/sleep/types/sleep.types'
import styles from './SleepPage.module.scss'

export function SleepPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<SleepLog | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading, isError } = useSleepLogsQuery({ limit: 30 })
  const createMutation = useCreateSleepLogMutation()
  const updateMutation = useUpdateSleepLogMutation()
  const removeMutation = useRemoveSleepLogMutation()

  const logs = data?.sleepLogs ?? []

  function openCreate() {
    setEditing(null)
    setDrawerOpen(true)
  }

  function openEdit(log: SleepLog) {
    setEditing(log)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditing(null)
  }

  async function handleSubmit(values: SleepLogInput) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values })
    } else {
      await createMutation.mutateAsync(values)
    }
    closeDrawer()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await removeMutation.mutateAsync(id)
    } finally {
      setDeletingId(null)
    }
  }

  const formLoading = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <PageHeader
        title="Sueño"
        subtitle="Registra y revisa tus sesiones de sueño diarias."
      />

      <div className={styles.toolbar}>
        <Button variant="primary" onClick={openCreate}>
          Registrar sueño
        </Button>
      </div>

      {isLoading && (
        <div className={styles.center}>
          <Spinner />
        </div>
      )}

      {isError && (
        <Alert variant="danger">No se pudieron cargar los registros de sueño.</Alert>
      )}

      {!isLoading && !isError && logs.length === 0 && (
        <SleepEmptyState onAdd={openCreate} />
      )}

      {logs.length > 0 && (
        <div className={styles.list}>
          {logs.map((log) => (
            <SleepLogCard
              key={log.id}
              log={log}
              onEdit={openEdit}
              onDelete={handleDelete}
              deleteLoading={deletingId === log.id}
            />
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? 'Editar registro de sueño' : 'Registrar sueño'}
      >
        <SleepForm
          initialValues={editing ?? undefined}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={closeDrawer}
        />
      </Drawer>
    </>
  )
}
