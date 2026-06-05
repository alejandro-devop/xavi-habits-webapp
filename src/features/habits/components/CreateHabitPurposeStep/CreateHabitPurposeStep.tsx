import { useState } from 'react'
import type { HabitPurposePlacement } from '@/features/habits/types/habit-purpose.types'
import { useCreateHabitPurposeMutation } from '@/features/habits/hooks/useHabitPurposes'
import { useModalStep } from '@/shared/ui/SteppedModal'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './CreateHabitPurposeStep.module.scss'

type Props = {
  placement: HabitPurposePlacement
  onCreated: (purposeId: string) => void
}

export function CreateHabitPurposeStep({ placement, onCreated }: Props) {
  const { pop } = useModalStep()
  const createMutation = useCreateHabitPurposeMutation()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState<string | null>(null)
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
      { name: trimmed, description: description.trim() || null, icon, placement },
      {
        onSuccess: (purpose) => {
          onCreated(purpose.id)
          pop()
        },
      },
    )
  }

  return (
    <div className={styles.step}>
      <FormField id="new-purpose-name" label="Nombre" error={nameError}>
        <Input
          id="new-purpose-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError(null)
          }}
          placeholder="Ej. Ser más disciplinado"
          disabled={isMutating}
          autoFocus
        />
      </FormField>

      <FormField id="new-purpose-description" label="Descripción">
        <Textarea
          id="new-purpose-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
          rows={2}
          disabled={isMutating}
        />
      </FormField>

      <FormField id="new-purpose-icon" label="Icono">
        <IconPicker
          value={icon}
          onChange={setIcon}
          placeholder="Elegir icono (opcional)"
          clearable
          disabled={isMutating}
        />
      </FormField>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={pop} disabled={isMutating}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleCreate} isLoading={isMutating}>
          Crear propósito
        </Button>
      </div>
    </div>
  )
}
