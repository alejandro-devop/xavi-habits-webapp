import { useState } from 'react'
import { CategoryPickerField } from '@/features/activities/components/CategoryPickerField'
import { CreateCategoryStep } from '@/features/activities/components/CreateCategoryStep'
import { useCreateActivityMutation } from '@/features/activities/hooks/useActivities'
import { useActivityCategoriesQuery } from '@/features/activities/hooks/useActivityCategories'
import { formValuesToInput } from '@/features/activities/utils/activity-form'
import panelStyles from '@/features/activities/components/inline-create-panel.module.scss'
import { useModalStep } from '@/shared/ui/SteppedModal'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'

type CreateActivityStepProps = {
  onCreated: (activityId: string) => void
}

export function CreateActivityStep({ onCreated }: CreateActivityStepProps) {
  const { push, pop } = useModalStep()
  const { data: categories = [] } = useActivityCategoriesQuery()
  const createMutation = useCreateActivityMutation()

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('El título es obligatorio.')
      return
    }
    if (trimmed.length > 255) {
      setError('El título no puede superar 255 caracteres.')
      return
    }
    setError(null)
    createMutation.mutate(
      formValuesToInput({
        title: trimmed,
        description: '',
        status: 'pending',
        priority: 'medium',
        categoryId,
        scheduledDate: '',
        todoFolderIds: [],
      }),
      { onSuccess: (activity) => onCreated(activity.id) },
    )
  }

  const handleCreateCategory = () => {
    push({
      title: 'Nueva categoría',
      content: (
        <CreateCategoryStep
          onCreated={(id) => {
            setCategoryId(id)
            pop()
          }}
        />
      ),
    })
  }

  return (
    <div>
      <FormField
        id="new-activity-title"
        label="Título"
        error={error?.includes('título') ? error : undefined}
      >
        <Input
          id="new-activity-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (error) setError(null)
          }}
          placeholder="Ej. Revisar informe"
          disabled={createMutation.isPending}
          autoFocus
        />
      </FormField>

      <FormField id="new-activity-category" label="Categoría (opcional)">
        <CategoryPickerField
          idPrefix="new-activity-category"
          value={categoryId}
          onChange={setCategoryId}
          categories={categories}
          disabled={createMutation.isPending}
          onCreateNew={handleCreateCategory}
        />
      </FormField>

      {error && !error.includes('título') ? (
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
          Crear actividad
        </Button>
      </div>
    </div>
  )
}
