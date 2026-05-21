import { useEffect, useState } from 'react'
import { ActivityPickerField } from '@/features/activities/components/ActivityPickerField'
import type { Activity } from '@/features/activities/types/activity.types'
import type { LogPastActivityFormValues } from '@/features/activities/types/activity-followup.types'
import { DurationHoursMinutesFields } from '@/features/activities/components/DurationHoursMinutesFields'
import {
  emptyLogPastActivityFormValues,
  logPastDurationTotal,
  logPastFormToInput,
  validateLogPastActivityForm,
} from '@/features/activities/utils/activity-followup-form'
import {
  calculateEndTime,
  getCurrentLocalDate,
  minutesToHoursMinutes,
} from '@/features/activities/utils/activity-time.utils'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './LogPastActivityModal.module.scss'

type LogPastActivityModalProps = {
  open: boolean
  defaultDate: string
  /** HH:mm al abrir desde “continuar” en timeline; si no se pasa, 09:00. */
  initialStartTime?: string | null
  activities: Activity[]
  loading?: boolean
  onClose: () => void
  onSave: (input: ReturnType<typeof logPastFormToInput>) => void
}

export function LogPastActivityModal({
  open,
  defaultDate,
  initialStartTime = null,
  activities,
  loading = false,
  onClose,
  onSave,
}: LogPastActivityModalProps) {
  const [values, setValues] = useState<LogPastActivityFormValues>(
    emptyLogPastActivityFormValues(defaultDate),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(
        emptyLogPastActivityFormValues(
          defaultDate,
          initialStartTime ?? undefined,
        ),
      )
      setError(null)
    }
  }, [open, defaultDate, initialStartTime])

  const totalMinutes = logPastDurationTotal(values)
  const endTime = calculateEndTime(values.date, values.startTime, totalMinutes)

  const handleSubmit = () => {
    const validationError = validateLogPastActivityForm(values)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onSave(logPastFormToInput(values))
  }

  const durationError = error?.includes('duración') ? error : undefined

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title="Registrar tiempo pasado"
      description="Guarda un bloque de tiempo sin usar el cronómetro."
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
        <FormField id="log-activity" label="Actividad" error={error && !values.activityId ? error : undefined}>
          <ActivityPickerField
            idPrefix="log-activity"
            value={values.activityId}
            activities={activities}
            onChange={(activityId) => setValues((prev) => ({ ...prev, activityId }))}
            disabled={loading}
            error={error && !values.activityId ? error : undefined}
          />
        </FormField>

        <FormField id="log-notes" label="Notas (opcional)">
          <Textarea
            id="log-notes"
            value={values.notes}
            onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
            disabled={loading}
          />
        </FormField>

        <div className={styles.row}>
          <FormField id="log-date" label="Fecha">
            <Input
              id="log-date"
              type="date"
              value={values.date}
              max={getCurrentLocalDate()}
              onChange={(e) => setValues((prev) => ({ ...prev, date: e.target.value }))}
              disabled={loading}
            />
          </FormField>
          <FormField id="log-start" label="Hora inicio">
            <Input
              id="log-start"
              type="time"
              value={values.startTime}
              onChange={(e) => setValues((prev) => ({ ...prev, startTime: e.target.value }))}
              disabled={loading}
            />
          </FormField>
        </div>

        <DurationHoursMinutesFields
          idPrefix="log-duration"
          totalMinutes={totalMinutes}
          onChange={(durationMinutes) => {
            const { hours, minutes } = minutesToHoursMinutes(durationMinutes)
            setValues((prev) => ({ ...prev, durationHours: hours, durationMinutes: minutes }))
          }}
          disabled={loading}
          error={durationError}
        />

        <FormField id="log-end" label="Hora fin (calculada)">
          <Input id="log-end" type="text" value={endTime} readOnly disabled />
        </FormField>

        {error && !durationError && !values.activityId ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
