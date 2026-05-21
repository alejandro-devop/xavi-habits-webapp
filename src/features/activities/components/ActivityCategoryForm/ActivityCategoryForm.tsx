import { useState, type FormEvent } from 'react'
import type { ActivityCategoryFormValues } from '@/features/activities/types/activity-category.types'
import { validateCategoryForm } from '@/features/activities/utils/activity-category-form'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './ActivityCategoryForm.module.scss'

type ActivityCategoryFormProps = {
  values: ActivityCategoryFormValues
  onChange: (values: ActivityCategoryFormValues) => void
  onSubmit: (values: ActivityCategoryFormValues) => void
  onCancel: () => void
  submitLabel: string
  loading?: boolean
}

export function ActivityCategoryForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
}: ActivityCategoryFormProps) {
  const [error, setError] = useState<string | null>(null)

  const patch = (partial: Partial<ActivityCategoryFormValues>) => {
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
        id="category-name"
        label="Nombre"
        error={error === 'El nombre es obligatorio.' ? error : undefined}
      >
        <Input
          id="category-name"
          value={values.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Ej. Trabajo"
          disabled={loading}
          autoFocus
        />
      </FormField>

      <FormField id="category-description" label="Descripción">
        <Textarea
          id="category-description"
          value={values.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Opcional"
          disabled={loading}
          rows={3}
        />
      </FormField>

      <FormField id="category-icon" label="Icono">
        <IconPicker
          value={values.icon}
          onChange={(icon) => patch({ icon })}
          placeholder="Elegir icono"
          disabled={loading}
          clearable
        />
      </FormField>

      <FormField id="category-color" label="Color" error={error?.includes('color') ? error : undefined}>
        <div className={styles.colorRow}>
          <input
            type="color"
            className={styles.colorPicker}
            value={values.color}
            onChange={(e) => patch({ color: e.target.value })}
            disabled={loading}
            aria-label="Selector de color"
          />
          <Input
            value={values.color}
            onChange={(e) => patch({ color: e.target.value })}
            placeholder="#6366f1"
            disabled={loading}
          />
        </div>
      </FormField>

      <FormField id="category-order" label="Orden" error={error?.includes('orden') ? error : undefined}>
        <Input
          id="category-order"
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
