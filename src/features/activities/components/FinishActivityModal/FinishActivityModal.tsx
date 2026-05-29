import { useEffect, useState } from 'react'
import { ActivityPickerField } from '@/features/activities/components/ActivityPickerField'
import { CreateActivityStep } from '@/features/activities/components/CreateActivityStep'
import { DurationHoursMinutesFields } from '@/features/activities/components/DurationHoursMinutesFields'
import type { Activity } from '@/features/activities/types/activity.types'
import type {
  FinishActivityFormValues,
  StartActivityFormValues,
} from '@/features/activities/types/activity-followup.types'
import {
  validateFinishActivityForm,
} from '@/features/activities/utils/activity-followup-form'
import { calculateEndTime } from '@/features/activities/utils/activity-time.utils'
import type { WeeklyRoutineActivity } from '@/features/weekly-routine/types/weekly-routine.types'
import { formatEventTime } from '@/features/weekly-routine/utils/planner.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
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
  routineSuggestion?: WeeklyRoutineActivity | null
  routineUpcoming?: WeeklyRoutineActivity | null
  onClose: () => void
  onSave: (values: FinishActivityFormValues) => void
  onSaveAndContinue?: (
    finishValues: FinishActivityFormValues,
    next: StartActivityFormValues,
  ) => void
}

// ─── Step 3: manual activity picker ──────────────────────────────────────────

type ActivityPickerStepProps = {
  activities: Activity[]
  nextStartTime: string
  finishValues: FinishActivityFormValues
  onConfirm: (finishValues: FinishActivityFormValues, next: StartActivityFormValues) => void
}

function ActivityPickerStep({
  activities,
  nextStartTime,
  finishValues,
  onConfirm,
}: ActivityPickerStepProps) {
  const { push, pop } = useModalStep()
  const [activityId, setActivityId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    if (!activityId) {
      setError('Selecciona una actividad')
      return
    }
    onConfirm(finishValues, { activityId, startTime: nextStartTime, notes: '' })
  }

  return (
    <div className={styles.form}>
      <FormField id="next-activity" label="Actividad" error={error ?? undefined}>
        <ActivityPickerField
          idPrefix="next-activity"
          value={activityId}
          activities={activities}
          onChange={(id) => {
            setActivityId(id)
            setError(null)
          }}
          onCreateNew={() =>
            push({
              title: 'Nueva actividad',
              content: (
                <CreateActivityStep
                  onCreated={(id) => {
                    setActivityId(id)
                    pop()
                  }}
                />
              ),
            })
          }
        />
      </FormField>

      <div className={styles.stepActions}>
        <Button variant="ghost" onClick={pop}>
          Atrás
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Iniciar
        </Button>
      </div>
    </div>
  )
}

// ─── Step 2: what's next ──────────────────────────────────────────────────────

type WhatsNextStepProps = {
  finishValues: FinishActivityFormValues
  nextStartTime: string
  routineSuggestion?: WeeklyRoutineActivity | null
  routineUpcoming?: WeeklyRoutineActivity | null
  activities: Activity[]
  onFinish: (values: FinishActivityFormValues) => void
  onFinishAndContinue: (finishValues: FinishActivityFormValues, next: StartActivityFormValues) => void
}

function SuggestionCard({
  label,
  event,
  onClick,
}: {
  label: string
  event: WeeklyRoutineActivity
  onClick: () => void
}) {
  const accentColor = event.activity?.category?.color ?? 'var(--color-primary)'

  return (
    <button type="button" className={styles.nextCard} onClick={onClick}>
      <span
        className={styles.nextCardIcon}
        style={{
          color: accentColor,
          borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
          background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
        }}
        aria-hidden
      >
        <AppIcon name={event.activity?.category?.icon ?? 'clock'} size="sm" decorative />
      </span>
      <div className={styles.nextCardText}>
        <span className={styles.nextCardLabel}>{label}</span>
        <span className={styles.nextCardTitle}>{event.activity?.title ?? '—'}</span>
        <span className={styles.nextCardTime}>
          {formatEventTime(event.startTime, event.durationMinutes)}
        </span>
      </div>
      <AppIcon name="chevron-right" size="sm" decorative />
    </button>
  )
}

function WhatsNextStep({
  finishValues,
  nextStartTime,
  routineSuggestion,
  routineUpcoming,
  activities,
  onFinish,
  onFinishAndContinue,
}: WhatsNextStepProps) {
  const { push } = useModalStep()

  const handleSuggestion = (event: WeeklyRoutineActivity) => {
    onFinishAndContinue(finishValues, {
      activityId: event.activityId,
      startTime: nextStartTime,
      notes: event.notes ?? '',
    })
  }

  const handlePickManual = () => {
    push({
      title: 'Elegir actividad',
      description: `Comenzará a las ${nextStartTime}`,
      content: (
        <ActivityPickerStep
          activities={activities}
          nextStartTime={nextStartTime}
          finishValues={finishValues}
          onConfirm={onFinishAndContinue}
        />
      ),
    })
  }

  return (
    <div className={styles.nextForm}>
      <p className={styles.nextHint}>
        La siguiente actividad comenzará a las <strong>{nextStartTime}</strong>
      </p>

      <div className={styles.nextOptions}>
        {routineSuggestion ? (
          <SuggestionCard
            label="Según tu rutina (ahora)"
            event={routineSuggestion}
            onClick={() => handleSuggestion(routineSuggestion)}
          />
        ) : null}

        {routineUpcoming &&
        routineUpcoming.id !== routineSuggestion?.id ? (
          <SuggestionCard
            label="Próximo en tu rutina"
            event={routineUpcoming}
            onClick={() => handleSuggestion(routineUpcoming)}
          />
        ) : null}

        <button type="button" className={styles.nextPickBtn} onClick={handlePickManual}>
          <AppIcon name="magnifying-glass" size="sm" decorative />
          Elegir otra actividad
        </button>
      </div>

      <div className={styles.stepActions}>
        <Button variant="ghost" onClick={() => onFinish(finishValues)}>
          Nada por ahora
        </Button>
      </div>
    </div>
  )
}

// ─── Step 1: finish form ──────────────────────────────────────────────────────

type RootStepProps = {
  values: FinishActivityFormValues
  setValues: React.Dispatch<React.SetStateAction<FinishActivityFormValues>>
  activities: Activity[]
  loading: boolean
  routineSuggestion?: WeeklyRoutineActivity | null
  routineUpcoming?: WeeklyRoutineActivity | null
  onClose: () => void
  onSave: (values: FinishActivityFormValues) => void
  onSaveAndContinue?: FinishActivityModalProps['onSaveAndContinue']
}

function FinishActivityRootStep({
  values,
  setValues,
  activities,
  loading,
  routineSuggestion,
  routineUpcoming,
  onClose,
  onSave,
  onSaveAndContinue,
}: RootStepProps) {
  const { push, pop: _pop } = useModalStep()
  const [error, setError] = useState<string | null>(null)

  const endTime = calculateEndTime(values.date, values.startTime, values.durationMinutes)

  const handleContinue = () => {
    const validationError = validateFinishActivityForm(values)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)

    if (onSaveAndContinue) {
      push({
        title: '¿Qué sigue?',
        content: (
          <WhatsNextStep
            finishValues={values}
            nextStartTime={endTime}
            routineSuggestion={routineSuggestion}
            routineUpcoming={routineUpcoming}
            activities={activities}
            onFinish={onSave}
            onFinishAndContinue={onSaveAndContinue}
          />
        ),
      })
    } else {
      onSave(values)
    }
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
                    _pop()
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
        <Button variant="primary" onClick={handleContinue} disabled={loading} isLoading={loading}>
          {onSaveAndContinue ? 'Continuar' : 'Guardar'}
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
  routineSuggestion,
  routineUpcoming,
  onClose,
  onSave,
  onSaveAndContinue,
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
        routineSuggestion={routineSuggestion}
        routineUpcoming={routineUpcoming}
        onClose={onClose}
        onSave={onSave}
        onSaveAndContinue={onSaveAndContinue}
      />
    </SteppedModal>
  )
}
