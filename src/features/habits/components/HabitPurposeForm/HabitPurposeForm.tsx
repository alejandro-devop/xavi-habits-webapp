import { useState, type FormEvent } from 'react'
import type { HabitPurpose, HabitPurposeInput } from '@/features/habits/types/habit-purpose.types'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './HabitPurposeForm.module.scss'

type HabitPurposeFormProps = {
  initial?: HabitPurpose
  onSubmit: (values: HabitPurposeInput) => void
  onCancel: () => void
  loading?: boolean
}

export function HabitPurposeForm({ initial, onSubmit, onCancel, loading = false }: HabitPurposeFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icon, setIcon] = useState<string | null>(initial?.icon ?? null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      icon: icon ?? null,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <FormField id="purpose-name" label="Nombre" error={error ?? undefined}>
        <Input
          id="purpose-name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
          placeholder="Ej. Ser más disciplinado"
          disabled={loading}
          autoFocus
        />
      </FormField>

      <FormField id="purpose-description" label="Descripción">
        <Textarea
          id="purpose-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional — por qué este propósito es importante para ti"
          disabled={loading}
          rows={3}
        />
      </FormField>

      <FormField id="purpose-icon" label="Icono">
        <IconPicker
          value={icon}
          onChange={(v) => setIcon(v)}
          placeholder="Elegir icono"
          disabled={loading}
          clearable
        />
      </FormField>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={loading}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
