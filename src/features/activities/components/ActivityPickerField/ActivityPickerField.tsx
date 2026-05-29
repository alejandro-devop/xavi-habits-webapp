import { useMemo, useState } from 'react'
import { CategoryPickerField } from '@/features/activities/components/CategoryPickerField'
import panelStyles from '@/features/activities/components/inline-create-panel.module.scss'
import { useCreateActivityMutation } from '@/features/activities/hooks/useActivities'
import { useActivityCategoriesQuery } from '@/features/activities/hooks/useActivityCategories'
import type { Activity } from '@/features/activities/types/activity.types'
import { formValuesToInput } from '@/features/activities/utils/activity-form'
import { activitiesToSelectOptions } from '@/features/activities/utils/activity-select-options'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { SearchSelect } from '@/shared/ui/SearchSelect'

type ActivityPickerFieldProps = {
  idPrefix?: string
  label?: string
  placeholder?: string
  value: string | null
  onChange: (activityId: string | null) => void
  activities: Activity[]
  disabled?: boolean
  error?: string
}

export function ActivityPickerField({
  idPrefix = 'activity',
  label,
  placeholder = 'Buscar actividad…',
  value,
  onChange,
  activities,
  disabled = false,
  error,
}: ActivityPickerFieldProps) {
  const { data: categories = [] } = useActivityCategoriesQuery()
  const createMutation = useCreateActivityMutation()

  const [creating, setCreating] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickCategoryId, setQuickCategoryId] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  const options = useMemo(() => activitiesToSelectOptions(activities), [activities])

  const resetCreate = () => {
    setCreating(false)
    setQuickTitle('')
    setQuickCategoryId(null)
    setCreateError(null)
  }

  const handleCreateActivity = () => {
    const title = quickTitle.trim()
    if (!title) {
      setCreateError('El título es obligatorio.')
      return
    }
    if (title.length > 255) {
      setCreateError('El título no puede superar 255 caracteres.')
      return
    }
    setCreateError(null)
    createMutation.mutate(
      formValuesToInput({
        title,
        description: '',
        status: 'pending',
        priority: 'medium',
        categoryId: quickCategoryId,
        scheduledDate: '',
        todoFolderIds: [],
      }),
      {
        onSuccess: (activity) => {
          onChange(activity.id)
          resetCreate()
        },
      },
    )
  }

  if (creating) {
    return (
      <div className={panelStyles.inlinePanel}>
        <p className={panelStyles.inlineTitle}>Nueva actividad</p>
        <FormField
          id={`${idPrefix}-title`}
          label="Título"
          error={createError?.includes('título') ? createError : undefined}
        >
          <Input
            id={`${idPrefix}-title`}
            value={quickTitle}
            onChange={(e) => {
              setQuickTitle(e.target.value)
              if (createError) setCreateError(null)
            }}
            placeholder="Ej. Revisar informe"
            disabled={disabled || createMutation.isPending}
            autoFocus
          />
        </FormField>
        <CategoryPickerField
          idPrefix={`${idPrefix}-category`}
          value={quickCategoryId}
          onChange={setQuickCategoryId}
          categories={categories}
          disabled={disabled || createMutation.isPending}
        />
        {createError && !createError.includes('título') ? (
          <p className={panelStyles.inlineError} role="alert">
            {createError}
          </p>
        ) : null}
        <div className={panelStyles.inlineActions}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetCreate}
            disabled={disabled || createMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCreateActivity}
            isLoading={createMutation.isPending}
            disabled={disabled}
          >
            Crear actividad
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SearchSelect
        label={label}
        placeholder={placeholder}
        value={value}
        options={options}
        onChange={(activityId) => onChange(activityId)}
        disabled={disabled}
        error={error}
      />
      <button
        type="button"
        className={panelStyles.createLink}
        onClick={() => setCreating(true)}
        disabled={disabled}
      >
        + Crear actividad
      </button>
    </div>
  )
}
