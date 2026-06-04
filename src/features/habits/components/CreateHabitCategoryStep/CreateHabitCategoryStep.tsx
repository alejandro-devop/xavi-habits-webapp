import { useState } from 'react'
import { useCreateHabitCategoryMutation } from '@/features/habits/hooks/useHabitCategories'
import { useModalStep } from '@/shared/ui/SteppedModal'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import styles from './CreateHabitCategoryStep.module.scss'

type Props = { onCreated: (categoryId: string) => void }

export function CreateHabitCategoryStep({ onCreated }: Props) {
  const { pop } = useModalStep()
  const createMutation = useCreateHabitCategoryMutation()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const isMutating = createMutation.isPending

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('El nombre es obligatorio.')
      return
    }
    setNameError(null)
    createMutation.mutate(
      { name: trimmed, icon, color },
      {
        onSuccess: (category) => {
          onCreated(category.id)
          pop()
        },
      },
    )
  }

  return (
    <div className={styles.step}>
      <FormField id="new-habit-category-name" label="Nombre" error={nameError}>
        <Input
          id="new-habit-category-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError(null)
          }}
          placeholder="Ej. Salud"
          disabled={isMutating}
          autoFocus
        />
      </FormField>

      <FormField id="new-habit-category-icon" label="Icono">
        <IconPicker
          value={icon}
          onChange={setIcon}
          placeholder="Elegir icono (opcional)"
          clearable
          disabled={isMutating}
        />
      </FormField>

      <div className={styles.colorRow}>
        <label className={styles.colorLabel} htmlFor="new-habit-category-color-picker">
          Color
        </label>
        <div className={styles.colorInputs}>
          <input
            type="color"
            id="new-habit-category-color-picker"
            className={styles.colorSwatch}
            value={color ?? '#6366f1'}
            onChange={(e) => setColor(e.target.value)}
            disabled={isMutating}
            aria-label="Selector de color"
          />
          <Input
            value={color ?? ''}
            onChange={(e) => setColor(e.target.value || null)}
            placeholder="#6366f1"
            disabled={isMutating}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={pop} disabled={isMutating}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleCreate} isLoading={isMutating}>
          Crear categoría
        </Button>
      </div>
    </div>
  )
}
