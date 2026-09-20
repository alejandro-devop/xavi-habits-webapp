import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { ColorPicker } from '@/shared/ui/ColorPicker'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import styles from './VidaCategoryForm.module.scss'

export type VidaCategoryFormValues = {
  name: string
  icon: string | null
  color: string | null
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
 * Nombre, icono y color de una categoría de Vida: los tres campos del criterio
 * 27 y ni uno más. Es el mismo trío de `CreateVidaCategoryStep` —el paso que se
 * apila en la hoja— pero **sin mutar nada**: aquí el formulario es tonto y la
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
