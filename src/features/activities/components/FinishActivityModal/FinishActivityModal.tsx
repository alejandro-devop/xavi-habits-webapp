import { useEffect, useState } from 'react'
import { ActivityPickerField } from '@/features/activities/components/ActivityPickerField'
import { CreateActivityStep } from '@/features/activities/components/CreateActivityStep'
import { DurationHoursMinutesFields } from '@/features/activities/components/DurationHoursMinutesFields'
import type { Activity } from '@/features/activities/types/activity.types'
import type { FinishActivityFormValues } from '@/features/activities/types/activity-followup.types'
import { validateFinishActivityForm } from '@/features/activities/utils/activity-followup-form'
import { calculateEndTime } from '@/features/activities/utils/activity-time.utils'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { SteppedModal, useModalStep } from '@/shared/ui/SteppedModal'
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

// ─── Root step ────────────────────────────────────────────────────────────────

type RootStepProps = {
  values: FinishActivityFormValues
  setValues: React.Dispatch<React.SetStateAction<FinishActivityFormValues>>
  activities: Activity[]
  loading: boolean
  onClose: () => void
  onSave: (values: FinishActivityFormValues) => void
}

function FinishActivityRootStep({
  values,
  setValues,
  activities,
  loading,
  onClose,
  onSave,
}: RootStepProps) {
  const { push, pop } = useModalStep()
  const [error, setError] = useState<string | null>(null)

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
    <div className={styles.form}>
      <FormField
        id="finish-activity"
        label="Actividad"
        error={error && !values.activityId ? error : undefined}
      >
        <ActivityPickerField
          idPrefix="finish-activity"
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
        onChange={(durationMinutes) => setValues((prev) => ({ ...prev, durationMinutes }))}
        disabled={loading}
        error={error?.includes('duración') ? error : undefined}
      />

      <FormField id="finish-end" label="Hora fin (calculada)">
        <Input id="finish-end" type="text" value={endTime} readOnly disabled />
      </FormField>

      {error && values.activityId && !error.includes('duración') ? (
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

export function FinishActivityModal({
  open,
  initialValues,
  activities,
  loading = false,
  onClose,
  onSave,
}: FinishActivityModalProps) {
  const [values, setValues] = useState<FinishActivityFormValues>(initialValues)

  useEffect(() => {
    if (open) {
      setValues(initialValues)
    }
  }, [open, initialValues])

  return (
    <SteppedModal
      open={open}
      onClose={() => !loading && onClose()}
      title="Finalizar actividad"
      description="Revisa los datos antes de guardar el registro de tiempo."
    >
      <FinishActivityRootStep
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
