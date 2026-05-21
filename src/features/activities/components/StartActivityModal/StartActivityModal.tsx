import { useEffect, useMemo, useState } from 'react'
import type { Activity } from '@/features/activities/types/activity.types'
import type { StartActivityFormValues } from '@/features/activities/types/activity-followup.types'
import {
  emptyStartActivityFormValues,
  validateStartActivityForm,
} from '@/features/activities/utils/activity-followup-form'
import { getCurrentLocalTime } from '@/features/activities/utils/activity-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { SearchSelect } from '@/shared/ui/SearchSelect'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './StartActivityModal.module.scss'

type StartActivityModalProps = {
  open: boolean
  sessionDate: string
  activities: Activity[]
  loading?: boolean
  onClose: () => void
  onStart: (values: StartActivityFormValues) => void
}

export function StartActivityModal({
  open,
  sessionDate,
  activities,
  loading = false,
  onClose,
  onStart,
}: StartActivityModalProps) {
  const [values, setValues] = useState<StartActivityFormValues>(
    emptyStartActivityFormValues(getCurrentLocalTime()),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(emptyStartActivityFormValues(getCurrentLocalTime()))
      setError(null)
    }
  }, [open])

  const options = useMemo(
    () =>
      activities.map((activity) => ({
        value: activity.id,
        label: activity.title,
        description: activity.category?.name ?? undefined,
        icon: (
          <span
            className={styles.categoryIcon}
            style={{ color: activity.category?.color ?? 'var(--color-text)' }}
            aria-hidden
          >
            <AppIcon name={activity.category?.icon ?? 'list-check'} size="sm" decorative />
          </span>
        ),
      })),
    [activities],
  )

  const handleSubmit = () => {
    const validationError = validateStartActivityForm(values, sessionDate)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onStart(values)
  }

  const handleClose = () => {
    if (loading) return
    setValues(emptyStartActivityFormValues(getCurrentLocalTime()))
    setError(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Iniciar nueva actividad"
      description="Indica la hora de inicio. El tiempo se guardará al finalizar."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            Iniciar
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <FormField id="start-activity" label="Actividad" error={error && !values.activityId ? error : undefined}>
          <SearchSelect
            label="Actividad"
            placeholder="Buscar actividad…"
            value={values.activityId}
            options={options}
            onChange={(activityId) => setValues((prev) => ({ ...prev, activityId }))}
            disabled={loading}
            error={error && !values.activityId ? error : undefined}
          />
        </FormField>

        <FormField
          id="start-time"
          label="Hora de inicio"
          error={error?.includes('hora') ? error : undefined}
        >
          <Input
            id="start-time"
            type="time"
            value={values.startTime}
            onChange={(e) => setValues((prev) => ({ ...prev, startTime: e.target.value }))}
            disabled={loading}
          />
        </FormField>

        <FormField id="start-notes" label="Descripción (opcional)">
          <Textarea
            id="start-notes"
            value={values.notes}
            onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="¿Qué vas a hacer?"
            rows={3}
            disabled={loading}
          />
        </FormField>

        {error && values.activityId && !error.includes('hora') ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
