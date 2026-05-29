import { useEffect, useState } from 'react'
import { ActivityPickerField } from '@/features/activities/components/ActivityPickerField'
import { CreateActivityStep } from '@/features/activities/components/CreateActivityStep'
import { DurationHoursMinutesFields } from '@/features/activities/components/DurationHoursMinutesFields'
import type { Activity } from '@/features/activities/types/activity.types'
import type { LogPastActivityFormValues } from '@/features/activities/types/activity-followup.types'
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
import { SteppedModal, useModalStep } from '@/shared/ui/SteppedModal'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './LogPastActivityModal.module.scss'

type LogPastActivityModalProps = {
  open: boolean
  defaultDate: string
  /** HH:mm al abrir desde "continuar" en timeline; si no se pasa, 09:00. */
  initialStartTime?: string | null
  activities: Activity[]
  loading?: boolean
  onClose: () => void
  onSave: (input: ReturnType<typeof logPastFormToInput>) => void
}

// ─── Root step ────────────────────────────────────────────────────────────────

type RootStepProps = {
  values: LogPastActivityFormValues
  setValues: React.Dispatch<React.SetStateAction<LogPastActivityFormValues>>
  activities: Activity[]
  loading: boolean
  onClose: () => void
  onSave: LogPastActivityModalProps['onSave']
}

function LogPastActivityRootStep({
  values,
  setValues,
  activities,
  loading,
  onClose,
  onSave,
}: RootStepProps) {
  const { push, pop } = useModalStep()
  const [error, setError] = useState<string | null>(null)

  const totalMinutes = logPastDurationTotal(values)
  const endTime = calculateEndTime(values.date, values.startTime, totalMinutes)
  const durationError = error?.includes('duración') ? error : undefined

  const handleSubmit = () => {
    const validationError = validateLogPastActivityForm(values)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onSave(logPastFormToInput(values))
  }

  return (
    <div className={styles.form}>
      <FormField
        id="log-activity"
        label="Actividad"
        error={error && !values.activityId ? error : undefined}
      >
        <ActivityPickerField
          idPrefix="log-activity"
          value={values.activityId}
          activities={activities}
          onChange={(activityId) => {
            setValues((prev) => ({ ...prev, activityId }))
            setError(null)
          }}
          disabled={loading}
          error={error && !values.activityId ? error : undefined}
          onCreateNew={() =>
            push({
              title: 'Nueva actividad',
              content: (
                <CreateActivityStep
                  onCreated={(id) => {
                    setValues((prev) => ({ ...prev, activityId: id }))
                    pop()
                  }}
                />
              ),
            })
          }
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

      {error && !durationError && values.activityId ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.stepActions}>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading} isLoading={loading}>
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (open) {
      setValues(emptyLogPastActivityFormValues(defaultDate, initialStartTime ?? undefined))
    }
  }, [open, defaultDate, initialStartTime])

  return (
    <SteppedModal
      open={open}
      onClose={() => !loading && onClose()}
      title="Registrar tiempo pasado"
      description="Guarda un bloque de tiempo sin usar el cronómetro."
    >
      <LogPastActivityRootStep
        values={values}
        setValues={setValues}
        activities={activities}
        loading={loading}
        onClose={onClose}
        onSave={onSave}
      />
    </SteppedModal>
  )
}
