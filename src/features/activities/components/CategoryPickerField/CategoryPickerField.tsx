import { useMemo, useState } from 'react'
import { useCreateActivityCategoryMutation } from '@/features/activities/hooks/useActivityCategories'
import type { ActivityCategory } from '@/features/activities/types/activity-category.types'
import {
  emptyCategoryFormValues,
  formValuesToInput,
  nextOrderIndex,
  validateCategoryForm,
} from '@/features/activities/utils/activity-category-form'
import { categoriesToSelectOptions } from '@/features/activities/utils/activity-select-options'
import panelStyles from '@/features/activities/components/inline-create-panel.module.scss'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import { SearchSelect } from '@/shared/ui/SearchSelect'

type CategoryPickerFieldProps = {
  idPrefix?: string
  label?: string
  placeholder?: string
  value: string | null
  onChange: (categoryId: string | null) => void
  categories: ActivityCategory[]
  disabled?: boolean
  clearable?: boolean
  onCreateNew?: () => void
}

export function CategoryPickerField({
  idPrefix = 'category',
  label = 'Categoría',
  placeholder = 'Sin categoría',
  value,
  onChange,
  categories,
  disabled = false,
  clearable = true,
  onCreateNew,
}: CategoryPickerFieldProps) {
  const createMutation = useCreateActivityCategoryMutation()

  const [creating, setCreating] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickIcon, setQuickIcon] = useState<string | null>(null)
  const [quickColor, setQuickColor] = useState('#6366f1')
  const [error, setError] = useState<string | null>(null)

  const options = useMemo(() => categoriesToSelectOptions(categories), [categories])

  const resetCreate = () => {
    setCreating(false)
    setQuickName('')
    setQuickIcon(null)
    setQuickColor('#6366f1')
    setError(null)
  }

  const handleCreateCategory = () => {
    const formValues = {
      ...emptyCategoryFormValues(nextOrderIndex(categories)),
      name: quickName,
      icon: quickIcon,
      color: quickColor,
    }
    const validationError = validateCategoryForm(formValues)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    createMutation.mutate(formValuesToInput(formValues), {
      onSuccess: (category) => {
        onChange(category.id)
        resetCreate()
      },
    })
  }

  if (creating) {
    return (
      <div className={panelStyles.inlinePanel}>
        <p className={panelStyles.inlineTitle}>Nueva categoría</p>
        <FormField
          id={`${idPrefix}-name`}
          label="Nombre"
          error={error === 'El nombre es obligatorio.' ? error : undefined}
        >
          <Input
            id={`${idPrefix}-name`}
            value={quickName}
            onChange={(e) => {
              setQuickName(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Ej. Trabajo"
            disabled={disabled || createMutation.isPending}
            autoFocus
          />
        </FormField>
        <FormField id={`${idPrefix}-icon`} label="Icono">
          <IconPicker
            value={quickIcon}
            onChange={setQuickIcon}
            placeholder="Elegir icono"
            disabled={disabled || createMutation.isPending}
            clearable
          />
        </FormField>
        <FormField
          id={`${idPrefix}-color`}
          label="Color"
          error={error?.includes('color') ? error : undefined}
        >
          <div className={panelStyles.colorRow}>
            <input
              type="color"
              className={panelStyles.colorPicker}
              value={quickColor}
              onChange={(e) => setQuickColor(e.target.value)}
              disabled={disabled || createMutation.isPending}
              aria-label="Selector de color"
            />
            <Input
              value={quickColor}
              onChange={(e) => setQuickColor(e.target.value)}
              disabled={disabled || createMutation.isPending}
            />
          </div>
        </FormField>
        {error && !error.includes('nombre') && !error.includes('color') ? (
          <p className={panelStyles.inlineError} role="alert">
            {error}
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
            onClick={handleCreateCategory}
            isLoading={createMutation.isPending}
            disabled={disabled}
          >
            Crear categoría
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
        onChange={(categoryId) => onChange(categoryId)}
        clearable={clearable}
        disabled={disabled}
      />
      <button
        type="button"
        className={panelStyles.createLink}
        onClick={() => (onCreateNew ? onCreateNew() : setCreating(true))}
        disabled={disabled}
      >
        + Crear categoría
      </button>
    </div>
  )
}
