import { useState } from 'react'
import { useCreateActivityCategoryMutation } from '@/features/vida/hooks/useActivityCategories'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { ColorPicker } from '@/shared/ui/ColorPicker'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import { useModalStep } from '@/shared/ui/SteppedModal'
import styles from './CreateVidaCategoryStep.module.scss'

type Props = {
  /** Se llama con el id de la categoría recién creada, para dejarla elegida. */
  onCreated: (categoryId: string) => void
  /** Nombre sugerido por quien abre el paso. */
  initialName?: string
}

/**
 * «+ nueva» categoría **dentro de la misma hoja**: el paso se apila encima con
 * `push` y al confirmar vuelve con `pop`. Lo que se había escrito en la hoja de
 * abajo no se pierde porque ese estado vive en `VidaActivitySheet`, que no se
 * desmonta —el mismo reparto que `CreateHabitCategoryStep` en hábitos—.
 *
 * El color entra por el `ColorPicker` compartido (los diecisiete de la paleta),
 * no por la rueda del sistema: en Vida el color de la categoría es lo que pinta
 * la cápsula de cada tarjeta y tiene que leerse en los dos temas.
 */
export function CreateVidaCategoryStep({ onCreated, initialName = '' }: Props) {
  const { pop } = useModalStep()
  const createMutation = useCreateActivityCategoryMutation()

  const [name, setName] = useState(initialName)
  const [icon, setIcon] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const isMutating = createMutation.isPending

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Ponle un nombre a la categoría.')
      return
    }
    setNameError(null)
    createMutation.mutate(
      { name: trimmed, icon, color },
      {
        // Solo se vuelve al formulario si de verdad se creó. Si falla, el paso
        // se queda abierto con lo escrito (criterio 16).
        onSuccess: (category) => {
          onCreated(category.id)
          pop()
        },
      },
    )
  }

  return (
    <div className={styles.step}>
      <FormField id="new-vida-category-name" label="Cómo la llamas" error={nameError}>
        <Input
          id="new-vida-category-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (nameError) setNameError(null)
          }}
          placeholder="Ej. Casa"
          disabled={isMutating}
          autoFocus
        />
      </FormField>

      <FormField id="new-vida-category-icon" label="Icono">
        <IconPicker
          value={icon}
          onChange={setIcon}
          placeholder="Elegir icono (opcional)"
          clearable
          disabled={isMutating}
        />
      </FormField>

      <div className={styles.colorRow}>
        <span className={styles.colorLabel}>Color</span>
        <ColorPicker
          value={color}
          onChange={setColor}
          disabled={isMutating}
          label="Color de la categoría"
        />
      </div>

      {createMutation.isError ? (
        <Alert variant="danger">
          No pudimos crear la categoría. Revisa la conexión y vuelve a intentarlo; lo que
          escribiste sigue aquí.
        </Alert>
      ) : null}

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
