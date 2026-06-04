import { useState, type FormEvent } from 'react'
import type { HabitCategoryFormValues } from '@/features/habits/types/habit-category.types'
import { validateCategoryForm } from '@/features/habits/utils/habit-category-form.utils'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './HabitCategoryForm.module.scss'

type HabitCategoryFormProps = {
  values: HabitCategoryFormValues
  onChange: (values: HabitCategoryFormValues) => void
  onSubmit: (values: HabitCategoryFormValues) => void
  onCancel: () => void
  submitLabel: string
  loading?: boolean
}

export function HabitCategoryForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
}: HabitCategoryFormProps) {
  const [error, setError] = useState<string | null>(null)

  const patch = (partial: Partial<HabitCategoryFormValues>) => {
    onChange({ ...values, ...partial })
    if (error) setError(null)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateCategoryForm(values)
    if (validationError) {
      setError(validationError)
      return
    }
    onSubmit(values)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <FormField
        id="habit-category-name"
        label="Nombre"
        error={error?.includes('nombre') ? error : undefined}
      >
        <Input
          id="habit-category-name"
          value={values.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Ej. Salud"
          disabled={loading}
          autoFocus
        />
      </FormField>

      <FormField id="habit-category-description" label="Descripción">
        <Textarea
          id="habit-category-description"
          value={values.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Opcional"
          disabled={loading}
          rows={3}
        />
      </FormField>

      <FormField id="habit-category-icon" label="Icono">
        <IconPicker
          value={values.icon}
          onChange={(icon) => patch({ icon })}
          placeholder="Elegir icono"
          disabled={loading}
          clearable
        />
      </FormField>

      <FormField
        id="habit-category-color"
        label="Color"
        error={error?.includes('color') ? error : undefined}
      >
        <div className={styles.colorRow}>
          <input
            type="color"
            className={styles.colorPicker}
            value={values.color ?? '#6366f1'}
            onChange={(e) => patch({ color: e.target.value })}
            disabled={loading}
            aria-label="Selector de color"
          />
          <Input
            value={values.color ?? ''}
            onChange={(e) => patch({ color: e.target.value })}
            placeholder="#6366f1"
            disabled={loading}
          />
        </div>
      </FormField>

      <FormField
        id="habit-category-order"
        label="Orden"
        error={error?.includes('orden') ? error : undefined}
      >
        <Input
          id="habit-category-order"
          type="number"
          min={0}
          step={1}
          value={values.orderIndex}
          onChange={(e) => patch({ orderIndex: e.target.value })}
          disabled={loading}
        />
      </FormField>

      {error && !error.includes('nombre') && !error.includes('color') && !error.includes('orden') ? (
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
