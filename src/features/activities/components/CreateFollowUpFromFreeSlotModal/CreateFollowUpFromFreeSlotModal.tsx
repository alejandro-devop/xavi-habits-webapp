import { useEffect, useMemo, useState } from 'react'
import { ActivityPickerField } from '@/features/activities/components/ActivityPickerField'
import { CreateActivityStep } from '@/features/activities/components/CreateActivityStep'
import { DurationHoursMinutesFields } from '@/features/activities/components/DurationHoursMinutesFields'
import type { Activity } from '@/features/activities/types/activity.types'
import type { TimelineFreeSlot } from '@/features/activities/types/activity-timeline.types'
import {
  clampFreeSlotFormToSlot,
  emptyFreeSlotFormValues,
  freeSlotDurationTotal,
  freeSlotFormToInput,
  validateFreeSlotForm,
} from '@/features/activities/utils/activity-free-slot-form'
import {
  calculateEndTime,
  formatDurationMinutes,
  formatFollowUpTimeLabel,
  getMaxDurationForStartTime,
  minutesToHoursMinutes,
  normalizeTimeForDisplay,
  minutesToTime,
  timeToMinutes,
} from '@/features/activities/utils/activity-time.utils'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { SteppedModal, useModalStep } from '@/shared/ui/SteppedModal'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './CreateFollowUpFromFreeSlotModal.module.scss'

type CreateFollowUpFromFreeSlotModalProps = {
  open: boolean
  slot: TimelineFreeSlot | null
  activities: Activity[]
  loading?: boolean
  onClose: () => void
  onSave: (input: ReturnType<typeof freeSlotFormToInput>) => void
}

// ─── Root step ────────────────────────────────────────────────────────────────

type RootStepProps = {
  slot: TimelineFreeSlot
  values: ReturnType<typeof emptyFreeSlotFormValues>
  setValues: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyFreeSlotFormValues>>>
  activities: Activity[]
  loading: boolean
  onClose: () => void
  onSave: CreateFollowUpFromFreeSlotModalProps['onSave']
}

function CreateFollowUpRootStep({
  slot,
  values,
  setValues,
  activities,
  loading,
  onClose,
  onSave,
}: RootStepProps) {
  const { push, pop } = useModalStep()
  const [error, setError] = useState<string | null>(null)

  const maxDuration = useMemo(
    () => getMaxDurationForStartTime(values.startTime, slot),
    [slot, values.startTime],
  )

  const totalMinutes = freeSlotDurationTotal(values)
  const endTime = calculateEndTime(slot.date, values.startTime, totalMinutes)

  const timeMin = normalizeTimeForDisplay(slot.startTime)
  const endMinutes = timeToMinutes(slot.endTime)
  const timeMax = endMinutes > 0
    ? minutesToTime(endMinutes - 1)
    : normalizeTimeForDisplay(slot.endTime)

  const handleSubmit = () => {
    const validationError = validateFreeSlotForm(values, slot)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onSave(freeSlotFormToInput(values))
  }

  return (
    <div className={styles.form}>
      <FormField
        id="slot-activity"
        label="Actividad"
        error={error && !values.activityId ? error : undefined}
      >
        <ActivityPickerField
          idPrefix="slot-activity"
          value={values.activityId}
          activities={activities}
          onChange={(activityId) => {
            setValues((prev) => ({ ...prev, activityId }))
            if (error) setError(null)
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

      <FormField id="slot-notes" label="Notas (opcional)">
        <Textarea
          id="slot-notes"
          value={values.notes}
          onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
          rows={3}
          disabled={loading}
        />
      </FormField>

      <div className={styles.row}>
        <FormField id="slot-date" label="Fecha">
          <Input id="slot-date" type="date" value={values.date} readOnly disabled />
        </FormField>
        <FormField
          id="slot-start"
          label="Hora inicio"
          error={error?.includes('hora') || error?.includes('espacio') ? error : undefined}
        >
          <Input
            id="slot-start"
            type="time"
            value={values.startTime}
            min={timeMin}
            max={timeMax}
            onChange={(e) => {
              const next = { ...values, startTime: e.target.value }
              setValues(clampFreeSlotFormToSlot(next, slot))
              if (error) setError(null)
            }}
            disabled={loading}
          />
        </FormField>
      </div>

      <DurationHoursMinutesFields
        idPrefix="slot-duration"
        totalMinutes={totalMinutes}
        maxTotalMinutes={maxDuration}
        onChange={(durationMinutes) => {
          const { hours, minutes } = minutesToHoursMinutes(durationMinutes)
          setValues((prev) =>
            clampFreeSlotFormToSlot(
              { ...prev, durationHours: hours, durationMinutes: minutes },
              slot,
            ),
          )
          if (error) setError(null)
        }}
        disabled={loading}
        error={error?.includes('duración') ? error : undefined}
      />

      <p className={styles.hint}>
        Hora fin calculada: <strong>{endTime}</strong> · máximo {maxDuration} min desde la hora elegida
      </p>

      {error && values.activityId ? (
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

export function CreateFollowUpFromFreeSlotModal({
  open,
  slot,
  activities,
  loading = false,
  onClose,
  onSave,
}: CreateFollowUpFromFreeSlotModalProps) {
  const [values, setValues] = useState(
    emptyFreeSlotFormValues(
      slot ?? { id: '', date: '', startTime: '00:00:00', endTime: '00:00:00', durationMinutes: 30 },
    ),
  )

  useEffect(() => {
    if (open && slot) {
      setValues(emptyFreeSlotFormValues(slot))
    }
  }, [open, slot])

  if (!slot) return null

  const slotRange = formatFollowUpTimeLabel(slot.startTime, slot.endTime)

  return (
    <SteppedModal
      open={open}
      onClose={() => !loading && onClose()}
      title="Registrar en espacio libre"
      description={`Espacio disponible: ${slotRange.startLabel} → ${slotRange.endLabel} (${formatDurationMinutes(slot.durationMinutes)} máx.)`}
    >
      <CreateFollowUpRootStep
        slot={slot}
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
