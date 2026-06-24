import { useState } from 'react'
import { useCreateHabitMeasureMutation } from '@/features/habits/hooks/useHabitMeasures'
import { useModalStep } from '@/shared/ui/SteppedModal'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import styles from './CreateHabitMeasureStep.module.scss'

type Props = { onCreated: (measureId: string) => void }

export function CreateHabitMeasureStep({ onCreated }: Props) {
  const { pop } = useModalStep()
  const createMutation = useCreateHabitMeasureMutation()

  const [name, setName] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
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
      {
        name: trimmed,
        abbreviation: abbreviation.trim() || null,
      },
      {
        onSuccess: (measure) => {
          onCreated(measure.id)
          pop()
        },
      },
    )
  }

  return (
    <div className={styles.step}>
      <FormField id="new-habit-measure-name" label="Nombre" error={nameError}>
        <Input
          id="new-habit-measure-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError(null)
          }}
          placeholder="Ej. vasos de agua"
          disabled={isMutating}
          autoFocus
        />
      </FormField>

      <FormField id="new-habit-measure-abbreviation" label="Abreviatura">
        <Input
          id="new-habit-measure-abbreviation"
          value={abbreviation}
          onChange={(e) => setAbbreviation(e.target.value)}
          placeholder="Ej. vasos (opcional)"
          disabled={isMutating}
        />
      </FormField>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={pop} disabled={isMutating}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleCreate} isLoading={isMutating}>
          Crear medida
        </Button>
      </div>
    </div>
  )
}
