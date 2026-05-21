import { useMemo, useState, type FormEvent } from 'react'
import type { ActivityCategory } from '@/features/activities/types/activity-category.types'
import type { ActivityFormValues } from '@/features/activities/types/activity.types'
import {
  activityPriorityOptions,
  activityStatusOptions,
} from '@/features/activities/utils/activity-enums'
import { validateActivityForm } from '@/features/activities/utils/activity-form'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { SearchSelect } from '@/shared/ui/SearchSelect'
import { Select } from '@/shared/ui/Select'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './ActivityForm.module.scss'

type ActivityFormProps = {
  values: ActivityFormValues
  categories: ActivityCategory[]
  onChange: (values: ActivityFormValues) => void
  onSubmit: (values: ActivityFormValues) => void
  onCancel: () => void
  submitLabel: string
  loading?: boolean
}

export function ActivityForm({
  values,
  categories,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
}: ActivityFormProps) {
  const [error, setError] = useState<string | null>(null)

  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
        icon: (
          <span
            className={styles.categoryIcon}
            style={{ color: cat.color ?? 'var(--color-text)' }}
            aria-hidden
          >
            <AppIcon name={cat.icon ?? 'list-check'} size="sm" decorative />
          </span>
        ),
      })),
    [categories],
  )

  const patch = (partial: Partial<ActivityFormValues>) => {
    onChange({ ...values, ...partial })
    if (error) setError(null)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateActivityForm(values)
    if (validationError) {
      setError(validationError)
      return
    }
    onSubmit(values)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <FormField id="activity-title" label="Título" error={error?.includes('título') ? error : undefined}>
        <Input
          id="activity-title"
          value={values.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Ej. Revisar informe"
          disabled={loading}
          autoFocus
        />
      </FormField>

      <FormField id="activity-description" label="Descripción">
        <Textarea
          id="activity-description"
          value={values.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Opcional"
          disabled={loading}
          rows={4}
        />
      </FormField>

      <div className={styles.row}>
        <Select
          id="activity-status"
          label="Estado"
          value={values.status}
          options={activityStatusOptions}
          onChange={(value) => patch({ status: value as ActivityFormValues['status'] })}
          disabled={loading}
        />
        <Select
          id="activity-priority"
          label="Prioridad"
          value={values.priority}
          options={activityPriorityOptions}
          onChange={(value) => patch({ priority: value as ActivityFormValues['priority'] })}
          disabled={loading}
        />
      </div>

      <SearchSelect
        label="Categoría"
        placeholder="Sin categoría"
        value={values.categoryId}
        options={categoryOptions}
        onChange={(value) => patch({ categoryId: value })}
        clearable
        disabled={loading}
      />

      <FormField id="activity-scheduled" label="Fecha programada">
        <Input
          id="activity-scheduled"
          type="datetime-local"
          value={values.scheduledDate}
          onChange={(e) => patch({ scheduledDate: e.target.value })}
          disabled={loading}
        />
      </FormField>

      {error && !error.includes('título') ? (
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
