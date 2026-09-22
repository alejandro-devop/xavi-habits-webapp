import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { ColorPicker } from '@/shared/ui/ColorPicker'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import styles from './VidaCategoryForm.module.scss'

export type VidaCategoryFormValues = {
  name: string
  icon: string | null
  color: string | null
  /**
   * La categoría apunta a la meta de trabajo.
   *
   * **Se llama `isWork` y no `goalId` a propósito**: hoy el formulario no puede
   * producir un id, porque la meta puede no existir todavía — la crea el
   * servidor la primera vez. El día que haya más de una meta este campo pasa a
   * `goalId: string | null` y el campo se dibuja como lista, sin tocar el API.
   */
  isWork: boolean
}

type Props = {
  values: VidaCategoryFormValues
  onChange: (values: VidaCategoryFormValues) => void
  onSubmit: (values: VidaCategoryFormValues) => void
  onCancel: () => void
  submitLabel?: string
  loading?: boolean
}

/**
 * Nombre, icono, color y la meta de una categoría de Vida. Son los mismos
 * campos de `CreateVidaCategoryStep` —el paso que se apila en la hoja— pero
 * **sin mutar nada**: aquí el formulario es tonto y la
 * pantalla decide qué mutación toca, como `HabitCategoryForm` en hábitos.
 *
 * El icono entra por `IconPickerLazy` (lo que exporta `@/shared/ui/IconPicker`)
 * y el color por los diecisiete de la paleta compartida: el `<input type=color>`
 * a pelo no se usa en Vida.
 */
export function VidaCategoryForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  loading = false,
}: Props) {
  const [nameError, setNameError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = values.name.trim()
    if (!trimmed) {
      setNameError('Ponle un nombre a la categoría.')
      return
    }
    setNameError(null)
    onSubmit({ ...values, name: trimmed })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <FormField id="vida-category-name" label="Cómo la llamas" error={nameError}>
        <Input
          id="vida-category-name"
          value={values.name}
          onChange={(event) => {
            onChange({ ...values, name: event.target.value })
            if (nameError) setNameError(null)
          }}
          placeholder="Ej. Casa"
          disabled={loading}
          autoFocus
        />
      </FormField>

      <FormField id="vida-category-icon" label="Icono">
        <IconPicker
          value={values.icon}
          onChange={(icon) => onChange({ ...values, icon })}
          placeholder="Elegir icono (opcional)"
          clearable
          disabled={loading}
        />
      </FormField>

      <div className={styles.colorRow}>
        <span className={styles.colorLabel}>Color</span>
        <ColorPicker
          value={values.color}
          onChange={(color) => onChange({ ...values, color })}
          disabled={loading}
          label="Color de la categoría"
        />
      </div>

      <Checkbox
        id="vida-category-is-work"
        checked={values.isWork}
        onChange={(event) => onChange({ ...values, isWork: event.target.checked })}
        disabled={loading}
        label="Esto es trabajo"
        description="Sus horas suman en el arco de trabajo de Hoy."
      />

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Volver
        </Button>
        <Button type="submit" isLoading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
