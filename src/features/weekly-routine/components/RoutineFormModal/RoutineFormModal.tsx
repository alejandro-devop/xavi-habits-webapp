import { useEffect, useState } from 'react'
import type {
  WeeklyRoutine,
  WeeklyRoutineEditInput,
  WeeklyRoutineInput,
  DayOfWeek,
} from '@/features/weekly-routine/types/weekly-routine.types'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './RoutineFormModal.module.scss'

type FormValues = {
  name: string
  description: string
  startDay: DayOfWeek
  dayStartTime: string
  dayEndTime: string
}

type Props = {
  open: boolean
  editing?: WeeklyRoutine | null
  onClose: () => void
  onSubmit: (values: WeeklyRoutineInput | WeeklyRoutineEditInput) => void
  submitting?: boolean
}

const DAY_OPTIONS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

function buildTimeOptions(): { value: string; label: string }[] {
  const options = []
  for (let h = 0; h < 24; h++) {
    options.push({
      value: `${String(h).padStart(2, '0')}:00`,
      label: `${String(h).padStart(2, '0')}:00`,
    })
  }
  return options
}

const TIME_OPTIONS = buildTimeOptions()

const EMPTY: FormValues = {
  name: '',
  description: '',
  startDay: 'monday',
  dayStartTime: '07:00',
  dayEndTime: '22:00',
}

export function RoutineFormModal({ open, editing, onClose, onSubmit, submitting = false }: Props) {
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(
      editing
        ? {
            name: editing.name,
            description: editing.description ?? '',
            startDay: editing.startDay,
            dayStartTime: editing.dayStartTime,
            dayEndTime: editing.dayEndTime,
          }
        : EMPTY,
    )
    setError(null)
  }, [open, editing])

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }))
    setError(null)
  }

  function handleSubmit() {
    const name = values.name.trim()
    if (!name) {
      setError('El nombre es obligatorio.')
      return
    }
    if (values.dayStartTime >= values.dayEndTime) {
      setError('La hora de inicio debe ser anterior a la hora de fin.')
      return
    }
    const payload = {
      name,
      description: values.description.trim() || null,
      startDay: values.startDay,
      dayStartTime: values.dayStartTime,
      dayEndTime: values.dayEndTime,
    }
    onSubmit(editing ? { ...payload, id: editing.id } : payload)
  }

  const title = editing ? 'Editar rutina' : 'Nueva rutina'

  const footer = (
    <div className={styles.footer}>
      <Button variant="ghost" onClick={onClose} disabled={submitting}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSubmit} disabled={submitting} isLoading={submitting}>
        {editing ? 'Guardar' : 'Crear'}
      </Button>
    </div>
  )

  return (
    <SteppedModal open={open} onClose={onClose} title={title} footer={footer} size="sm">
      <div className={styles.form}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <FormField id="routine-name" label="Nombre">
          <Input
            id="routine-name"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Mi rutina semanal…"
            autoFocus
          />
        </FormField>

        <FormField id="routine-description" label="Descripción">
          <Textarea
            id="routine-description"
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Opcional…"
            rows={2}
          />
        </FormField>

        <FormField id="routine-start-day" label="Primer día de la semana">
          <Select
            id="routine-start-day"
            value={values.startDay}
            options={DAY_OPTIONS}
            onChange={(v) => set('startDay', v as DayOfWeek)}
          />
        </FormField>

        <div className={styles.row}>
          <FormField id="routine-start-time" label="Hora inicio del día">
            <Select
              id="routine-start-time"
              value={values.dayStartTime}
              options={TIME_OPTIONS}
              onChange={(v) => set('dayStartTime', v)}
            />
          </FormField>

          <FormField id="routine-end-time" label="Hora fin del día">
            <Select
              id="routine-end-time"
              value={values.dayEndTime}
              options={TIME_OPTIONS}
              onChange={(v) => set('dayEndTime', v)}
            />
          </FormField>
        </div>
      </div>
    </SteppedModal>
  )
}
