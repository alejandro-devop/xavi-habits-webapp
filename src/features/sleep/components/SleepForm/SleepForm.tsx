import { useState } from 'react'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import { Button } from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Select'
import type {
  MoodOnWaking,
  SleepFormValues,
  SleepLog,
  SleepLogInput,
  SleepQuality,
} from '@/features/sleep/types/sleep.types'
import {
  calcDurationMinutes,
  formatSleepDuration,
  getTodayDate,
  isoToTime,
  MOOD_ON_WAKING_OPTIONS,
  SLEEP_QUALITY_OPTIONS,
  sleepDateToInputValue,
  timeToIso,
} from '@/features/sleep/utils/sleep.utils'
import styles from './SleepForm.module.scss'

interface SleepFormProps {
  initialValues?: SleepLog
  loading?: boolean
  onSubmit: (values: SleepLogInput) => void
  onCancel: () => void
}

function buildInitialValues(log?: SleepLog): SleepFormValues {
  if (log) {
    return {
      sleepDate: sleepDateToInputValue(log.sleepDate),
      bedtime: isoToTime(log.bedtime),
      wakeTime: isoToTime(log.wakeTime),
      quality: log.quality ?? '',
      moodOnWaking: log.moodOnWaking ?? '',
      notes: log.notes ?? '',
    }
  }
  return {
    sleepDate: getTodayDate(),
    bedtime: '22:00',
    wakeTime: '07:00',
    quality: '',
    moodOnWaking: '',
    notes: '',
  }
}

export function SleepForm({ initialValues, loading = false, onSubmit, onCancel }: SleepFormProps) {
  const [values, setValues] = useState<SleepFormValues>(() => buildInitialValues(initialValues))
  const [errors, setErrors] = useState<Partial<Record<keyof SleepFormValues, string>>>({})

  function patch(partial: Partial<SleepFormValues>) {
    setValues((prev) => ({ ...prev, ...partial }))
    const key = Object.keys(partial)[0] as keyof SleepFormValues
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const durationMinutes =
    values.bedtime && values.wakeTime
      ? calcDurationMinutes(
          timeToIso(values.sleepDate, values.bedtime),
          timeToIso(values.sleepDate, values.wakeTime),
        )
      : null

  function validate(): boolean {
    const next: Partial<Record<keyof SleepFormValues, string>> = {}
    if (!values.sleepDate) next.sleepDate = 'La fecha es obligatoria'
    if (!values.bedtime) next.bedtime = 'La hora de dormir es obligatoria'
    if (!values.wakeTime) next.wakeTime = 'La hora de despertar es obligatoria'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      sleepDate: values.sleepDate,
      bedtime: timeToIso(values.sleepDate, values.bedtime),
      wakeTime: timeToIso(values.sleepDate, values.wakeTime),
      quality: values.quality ? (values.quality as SleepQuality) : null,
      moodOnWaking: values.moodOnWaking ? (values.moodOnWaking as MoodOnWaking) : null,
      notes: values.notes.trim() || null,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <FormField id="sleep-date" label="Fecha" error={errors.sleepDate}>
        <Input
          id="sleep-date"
          type="date"
          value={values.sleepDate}
          onChange={(e) => patch({ sleepDate: e.target.value })}
          disabled={loading}
        />
      </FormField>

      <FormField id="sleep-bedtime" label="Hora de dormir" error={errors.bedtime}>
        <Input
          id="sleep-bedtime"
          type="time"
          value={values.bedtime}
          onChange={(e) => patch({ bedtime: e.target.value })}
          disabled={loading}
        />
      </FormField>

      <FormField id="sleep-waketime" label="Hora de despertar" error={errors.wakeTime}>
        <Input
          id="sleep-waketime"
          type="time"
          value={values.wakeTime}
          onChange={(e) => patch({ wakeTime: e.target.value })}
          disabled={loading}
        />
      </FormField>

      {durationMinutes !== null && durationMinutes > 0 && (
        <p className={styles.duration}>
          Duración calculada: <strong>{formatSleepDuration(durationMinutes)}</strong>
        </p>
      )}

      <FormField id="sleep-quality" label="Calidad del sueño">
        <Select
          id="sleep-quality"
          value={values.quality}
          options={SLEEP_QUALITY_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          placeholder="Opcional"
          onChange={(value) => patch({ quality: value })}
          disabled={loading}
        />
      </FormField>

      <FormField id="sleep-mood" label="Estado al despertar">
        <Select
          id="sleep-mood"
          value={values.moodOnWaking}
          options={MOOD_ON_WAKING_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          placeholder="Opcional"
          onChange={(value) => patch({ moodOnWaking: value })}
          disabled={loading}
        />
      </FormField>

      <FormField id="sleep-notes" label="Notas">
        <Textarea
          id="sleep-notes"
          value={values.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          disabled={loading}
          placeholder="Opcional"
          rows={3}
        />
      </FormField>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={loading} isLoading={loading}>
          {initialValues ? 'Guardar cambios' : 'Registrar sueño'}
        </Button>
      </div>
    </form>
  )
}
