import { useState } from 'react'
import { useCreateActivityCategoryMutation } from '@/features/activities/hooks/useActivityCategories'
import { useActivityCategoriesQuery } from '@/features/activities/hooks/useActivityCategories'
import {
  emptyCategoryFormValues,
  formValuesToInput,
  nextOrderIndex,
  validateCategoryForm,
} from '@/features/activities/utils/activity-category-form'
import panelStyles from '@/features/activities/components/inline-create-panel.module.scss'
import { useModalStep } from '@/shared/ui/SteppedModal'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'

type CreateCategoryStepProps = {
  onCreated: (categoryId: string) => void
}

export function CreateCategoryStep({ onCreated }: CreateCategoryStepProps) {
  const { pop } = useModalStep()
  const { data: categories = [] } = useActivityCategoriesQuery()
  const createMutation = useCreateActivityCategoryMutation()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState<string | null>(null)
  const [color, setColor] = useState('#6366f1')
  const [error, setError] = useState<string | null>(null)

  const handleCreate = () => {
    const formValues = {
      ...emptyCategoryFormValues(nextOrderIndex(categories)),
      name,
      icon,
      color,
    }
    const validationError = validateCategoryForm(formValues)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    createMutation.mutate(formValuesToInput(formValues), {
      onSuccess: (category) => onCreated(category.id),
    })
  }

  return (
    <div>
      <FormField
        id="new-category-name"
        label="Nombre"
        error={error?.includes('nombre') ? error : undefined}
      >
        <Input
          id="new-category-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError(null)
          }}
          placeholder="Ej. Trabajo"
          disabled={createMutation.isPending}
          autoFocus
        />
      </FormField>

      <FormField id="new-category-icon" label="Icono">
        <IconPicker
          value={icon}
          onChange={setIcon}
          placeholder="Elegir icono"
          disabled={createMutation.isPending}
          clearable
        />
      </FormField>

      <FormField
        id="new-category-color"
        label="Color"
        error={error?.includes('color') ? error : undefined}
      >
        <div className={panelStyles.colorRow}>
          <input
            type="color"
            className={panelStyles.colorPicker}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={createMutation.isPending}
            aria-label="Selector de color"
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={createMutation.isPending}
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
          onClick={pop}
          disabled={createMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleCreate}
          isLoading={createMutation.isPending}
        >
          Crear categoría
        </Button>
      </div>
    </div>
  )
}
