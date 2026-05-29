import { useEffect, useState } from 'react'
import { ActivityPickerField } from '@/features/activities/components/ActivityPickerField'
import type { Activity } from '@/features/activities/types/activity.types'
import type { FinishActivityFormValues } from '@/features/activities/types/activity-followup.types'
import { validateFinishActivityForm } from '@/features/activities/utils/activity-followup-form'
import { DurationHoursMinutesFields } from '@/features/activities/components/DurationHoursMinutesFields'
import { calculateEndTime } from '@/features/activities/utils/activity-time.utils'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './FinishActivityModal.module.scss'

type FinishActivityModalProps = {
  open: boolean
  initialValues: FinishActivityFormValues
  activities: Activity[]
  loading?: boolean
  onClose: () => void
  onSave: (values: FinishActivityFormValues) => void
}

export function FinishActivityModal({
  open,
  initialValues,
  activities,
  loading = false,
  onClose,
  onSave,
}: FinishActivityModalProps) {
  const [values, setValues] = useState<FinishActivityFormValues>(initialValues)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(initialValues)
      setError(null)
    }
  }, [open, initialValues])

  const endTime = calculateEndTime(values.date, values.startTime, values.durationMinutes)

  const handleSubmit = () => {
    const validationError = validateFinishActivityForm(values)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onSave(values)
  }

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title="Finalizar actividad"
      description="Revisa los datos antes de guardar el registro de tiempo."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <FormField id="finish-activity" label="Actividad" error={error && !values.activityId ? error : undefined}>
          <ActivityPickerField
            idPrefix="finish-activity"
            value={values.activityId}
            activities={activities}
            onChange={(activityId) => setValues((prev) => ({ ...prev, activityId }))}
            disabled={loading}
            error={error && !values.activityId ? error : undefined}
          />
        </FormField>

        <FormField id="finish-notes" label="Notas">
          <Textarea
            id="finish-notes"
            value={values.notes}
            onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
            disabled={loading}
          />
        </FormField>

        <div className={styles.row}>
          <FormField id="finish-date" label="Fecha">
            <Input
              id="finish-date"
              type="date"
              value={values.date}
              onChange={(e) => setValues((prev) => ({ ...prev, date: e.target.value }))}
              disabled={loading}
            />
          </FormField>
          <FormField id="finish-start" label="Hora inicio">
            <Input
              id="finish-start"
              type="time"
              value={values.startTime}
              onChange={(e) => setValues((prev) => ({ ...prev, startTime: e.target.value }))}
              disabled={loading}
            />
          </FormField>
        </div>

        <DurationHoursMinutesFields
          idPrefix="finish-duration"
          totalMinutes={values.durationMinutes}
          onChange={(durationMinutes) =>
            setValues((prev) => ({ ...prev, durationMinutes }))
          }
          disabled={loading}
          error={error?.includes('duración') ? error : undefined}
        />

        <FormField id="finish-end" label="Hora fin (calculada)">
          <Input id="finish-end" type="text" value={endTime} readOnly disabled />
        </FormField>

        {error && !error.includes('duración') && !values.activityId ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
