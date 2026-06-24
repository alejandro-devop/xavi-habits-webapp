import { useState, type FormEvent } from 'react'
import type { HabitMeasureFormValues } from '@/features/habits/types/habit-measure.types'
import { validateMeasureForm } from '@/features/habits/utils/habit-measure-form.utils'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import styles from './HabitMeasureForm.module.scss'

type HabitMeasureFormProps = {
  values: HabitMeasureFormValues
  onChange: (values: HabitMeasureFormValues) => void
  onSubmit: (values: HabitMeasureFormValues) => void
  onCancel: () => void
  submitLabel: string
  loading?: boolean
}

export function HabitMeasureForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
}: HabitMeasureFormProps) {
  const [error, setError] = useState<string | null>(null)

  const patch = (partial: Partial<HabitMeasureFormValues>) => {
    onChange({ ...values, ...partial })
    if (error) setError(null)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateMeasureForm(values)
    if (validationError) {
      setError(validationError)
      return
    }
    onSubmit(values)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <FormField
        id="habit-measure-name"
        label="Nombre"
        error={error?.includes('nombre') ? error : undefined}
      >
        <Input
          id="habit-measure-name"
          value={values.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Ej. kilómetros, vasos, páginas"
          disabled={loading}
          autoFocus
        />
      </FormField>

      <FormField id="habit-measure-abbreviation" label="Abreviatura">
        <Input
          id="habit-measure-abbreviation"
          value={values.abbreviation}
          onChange={(e) => patch({ abbreviation: e.target.value })}
          placeholder="Ej. km, ml, pág. (opcional)"
          disabled={loading}
        />
      </FormField>

      <FormField id="habit-measure-type" label="Tipo">
        <Input
          id="habit-measure-type"
          value={values.type}
          onChange={(e) => patch({ type: e.target.value })}
          placeholder="Ej. distancia, volumen (opcional)"
          disabled={loading}
        />
      </FormField>

      {error && !error.includes('nombre') ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
