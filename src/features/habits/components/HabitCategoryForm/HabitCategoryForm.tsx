import { useState, type FormEvent } from 'react'
import type { HabitCategoryFormValues } from '@/features/habits/types/habit-category.types'
import { validateCategoryForm } from '@/features/habits/utils/habit-category-form.utils'
import { Button } from '@/shared/ui/Button'
import { ColorPicker } from '@/shared/ui/ColorPicker'
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

      {/* Las veintidós de la paleta compartida, como en `VidaCategoryForm`: la
          rueda del sistema y el campo de hex se fueron en FEAT-026. No va en
          `FormField` porque su `<label for>` apuntaría a un grupo de radios; el
          nombre accesible lo lleva el propio grupo. Lo que llega en `values.color`
          se enseña tal cual —de la paleta, de fuera («Color actual») o ninguno— y
          solo cambia si alguien elige otra muestra. */}
      <div className={styles.colorRow}>
        <span className={styles.colorLabel}>Color</span>
        <ColorPicker
          value={values.color}
          onChange={(color) => patch({ color })}
          disabled={loading}
          label="Color de la categoría"
        />
      </div>

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

      {error && !error.includes('nombre') && !error.includes('orden') ? (
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
