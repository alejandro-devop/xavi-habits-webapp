import { useEffect, useState } from 'react'
import { ActivityPickerField } from '@/features/activities/components/ActivityPickerField'
import { CreateActivityStep } from '@/features/activities/components/CreateActivityStep'
import { useActivitiesQuery } from '@/features/activities/hooks/useActivities'
import {
  buildDurationOptions,
  buildStartTimeOptions,
  clampEventDuration,
  DAY_LABELS_FULL,
  formatEventEndTime,
  hasConflict,
  snapTimeTo15,
} from '@/features/weekly-routine/utils/planner.utils'
import type {
  DayOfWeek,
  WeeklyRoutine,
  WeeklyRoutineActivity,
} from '@/features/weekly-routine/types/weekly-routine.types'
import { DayPickerToggle } from '@/features/weekly-routine/components/DayPickerToggle'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { SteppedModal, useModalStep } from '@/shared/ui/SteppedModal'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './RoutineEventModal.module.scss'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoutineEventFormValues = {
  activityId: string | null
  days: DayOfWeek[]
  startTime: string
  durationMinutes: number
  notes: string
}

type Props = {
  open: boolean
  routine: WeeklyRoutine
  initialDay?: DayOfWeek
  initialTime?: string
  editing?: WeeklyRoutineActivity | null
  onClose: () => void
  onSubmit: (values: RoutineEventFormValues) => void
  onDelete?: () => void
  submitting?: boolean
  deleting?: boolean
}

const DAY_OPTIONS: { label: string; value: DayOfWeek }[] = [
  { label: 'Lunes', value: 'monday' },
  { label: 'Martes', value: 'tuesday' },
  { label: 'Miércoles', value: 'wednesday' },
  { label: 'Jueves', value: 'thursday' },
  { label: 'Viernes', value: 'friday' },
  { label: 'Sábado', value: 'saturday' },
  { label: 'Domingo', value: 'sunday' },
]

// ── Root step ─────────────────────────────────────────────────────────────────

type RootStepProps = {
  values: RoutineEventFormValues
  set: <K extends keyof RoutineEventFormValues>(key: K, val: RoutineEventFormValues[K]) => void
  routine: WeeklyRoutine
  editing?: WeeklyRoutineActivity | null
  onDelete?: () => void
  onClose: () => void
  onSubmit: () => void
  submitting: boolean
  deleting: boolean
  error: string | null
}

function RoutineEventRootStep({
  values,
  set,
  routine,
  editing,
  onDelete,
  onClose,
  onSubmit,
  submitting,
  deleting,
  error,
}: RootStepProps) {
  const { push, pop } = useModalStep()
  const { data: activitiesData } = useActivitiesQuery({})
  const activities = activitiesData?.activities ?? []

  const startTimeOptions = buildStartTimeOptions(routine.dayStartTime, routine.dayEndTime)
  const durationOptions = buildDurationOptions(values.startTime, routine.dayEndTime)
  const endTimeLabel = formatEventEndTime(values.startTime, values.durationMinutes)

  return (
    <div className={styles.form}>
      {error ? <p className={styles.error}>{error}</p> : null}

      <FormField id="event-activity" label="Actividad">
        <ActivityPickerField
          idPrefix="event-activity"
          value={values.activityId}
          activities={activities}
          onChange={(id) => set('activityId', id)}
          onCreateNew={() =>
            push({
              title: 'Nueva actividad',
              content: (
                <CreateActivityStep
                  onCreated={(id) => {
                    set('activityId', id)
                    pop()
                  }}
                />
              ),
            })
          }
        />
      </FormField>

      {editing ? (
        <FormField id="event-day" label="Día">
          <Select
            id="event-day"
            value={values.days[0]}
            options={DAY_OPTIONS}
            onChange={(v) => set('days', [v as DayOfWeek])}
          />
        </FormField>
      ) : (
        <FormField id="event-days" label="Días">
          <DayPickerToggle
            selected={values.days}
            onChange={(days) => set('days', days)}
          />
        </FormField>
      )}

      <div className={styles.row}>
        <FormField id="event-start" label="Hora de inicio">
          <Select
            id="event-start"
            value={values.startTime}
            options={startTimeOptions}
            onChange={(v) => {
              set('startTime', v)
              set(
                'durationMinutes',
                clampEventDuration(v, routine.dayEndTime, values.durationMinutes),
              )
            }}
          />
        </FormField>

        <FormField
          id="event-duration"
          label="Duración"
          helperText="Máximo 4 h por evento"
        >
          <Select
            id="event-duration"
            value={String(values.durationMinutes)}
            options={durationOptions.map((o) => ({ value: String(o.value), label: o.label }))}
            onChange={(v) => set('durationMinutes', parseInt(v, 10))}
            disabled={durationOptions.length === 0}
          />
        </FormField>
      </div>

      <FormField id="event-end" label="Hora de fin (calculada)">
        <Input id="event-end" type="text" value={endTimeLabel} readOnly disabled />
      </FormField>

      <FormField id="event-notes" label="Notas" helperText="Descripción breve del evento">
        <Textarea
          id="event-notes"
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Opcional…"
          rows={2}
        />
      </FormField>

      <div className={styles.footer}>
        {editing && onDelete ? (
          <Button variant="danger" onClick={onDelete} disabled={submitting || deleting} isLoading={deleting}>
            Eliminar
          </Button>
        ) : (
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <div className={styles.footerRight}>
          {editing && onDelete ? (
            <Button variant="ghost" onClick={onClose} disabled={submitting || deleting}>
              Cancelar
            </Button>
          ) : null}
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={submitting || deleting}
            isLoading={submitting}
          >
            {editing ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export function RoutineEventModal({
  open,
  routine,
  initialDay,
  initialTime,
  editing,
  onClose,
  onSubmit,
  onDelete,
  submitting = false,
  deleting = false,
}: Props) {
  const defaultTime = snapTimeTo15(initialTime ?? routine.dayStartTime)

  const initialStartTime = editing?.startTime ?? defaultTime
  const [values, setValues] = useState<RoutineEventFormValues>({
    activityId: editing?.activityId ?? null,
    days: [editing?.dayOfWeek ?? initialDay ?? 'monday'],
    startTime: initialStartTime,
    durationMinutes: clampEventDuration(
      initialStartTime,
      routine.dayEndTime,
      editing?.durationMinutes ?? 30,
    ),
    notes: editing?.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const startTime = editing?.startTime ?? defaultTime
    setValues({
      activityId: editing?.activityId ?? null,
      days: [editing?.dayOfWeek ?? initialDay ?? 'monday'],
      startTime,
      durationMinutes: clampEventDuration(
        startTime,
        routine.dayEndTime,
        editing?.durationMinutes ?? 30,
      ),
      notes: editing?.notes ?? '',
    })
    setError(null)
  }, [open, editing, initialDay]) // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof RoutineEventFormValues>(key: K, val: RoutineEventFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }))
    setError(null)
  }

  const allActivitiesInRoutine: WeeklyRoutineActivity[] =
    routine.schedule?.flatMap((d) => d.activities) ?? []

  function handleSubmit() {
    if (!values.activityId) {
      setError('Selecciona una actividad.')
      return
    }
    const conflictingDays = values.days.filter((day) =>
      hasConflict(allActivitiesInRoutine, day, values.startTime, values.durationMinutes, editing?.id)
    )
    if (conflictingDays.length > 0) {
      const names = conflictingDays.map((d) => DAY_LABELS_FULL[d]).join(', ')
      setError(`Este horario se solapa con eventos existentes en: ${names}`)
      return
    }
    onSubmit(values)
  }

  return (
    <SteppedModal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar evento' : 'Agregar evento'}
      size="sm"
    >
      <RoutineEventRootStep
        values={values}
        set={set}
        routine={routine}
        editing={editing}
        onDelete={onDelete}
        onClose={onClose}
        onSubmit={handleSubmit}
        submitting={submitting}
        deleting={deleting}
        error={error}
      />
    </SteppedModal>
  )
}
