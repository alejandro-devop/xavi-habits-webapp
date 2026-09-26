import { useState } from 'react'
import {
  useActivityCategoriesQuery,
  useCreateActivityCategoryMutation,
  useSetActivityCategoryGoalMutation,
} from '@/features/vida/hooks/useActivityCategories'
import { pickInitialCategoryColor } from '@/features/vida/utils/vida-category-color.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { ColorPicker } from '@/shared/ui/ColorPicker'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import { useModalStep } from '@/shared/ui/SteppedModal'
import styles from './CreateVidaCategoryStep.module.scss'

type Props = {
  /** Se llama con el id de la categoría recién creada, para dejarla elegida. */
  onCreated: (categoryId: string) => void
}

/**
 * «+ nueva» categoría **dentro de la misma hoja**: el paso se apila encima con
 * `push` y al confirmar vuelve con `pop`. Lo que se había escrito en la hoja de
 * abajo no se pierde porque ese estado vive en `VidaActivitySheet`, que no se
 * desmonta —el mismo reparto que `CreateHabitCategoryStep` en hábitos—.
 *
 * El color entra por el `ColorPicker` compartido (los diecisiete de la paleta),
 * no por la rueda del sistema: en Vida el color de la categoría es lo que pinta
 * la cápsula de cada tarjeta y tiene que leerse en los dos temas. Y llega ya
 * sorteado: ver `pickInitialCategoryColor` más abajo.
 */
export function CreateVidaCategoryStep({ onCreated }: Props) {
  const { pop } = useModalStep()
  const createMutation = useCreateActivityCategoryMutation()
  const setGoalMutation = useSetActivityCategoryGoalMutation()
  // Los colores que ya usan las categorías del usuario. Es la misma lista que
  // pide la hoja de abajo, así que casi siempre viene de la caché.
  const categoriesQuery = useActivityCategoriesQuery()
  const categories = categoriesQuery.data

  const [name, setName] = useState('')
  const [icon, setIcon] = useState<string | null>(null)
  const [isWork, setIsWork] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  /**
   * El color, **sorteado una sola vez y en cuanto haya lista** (criterios 516 y
   * 518).
   *
   * Aquí **no** vale el `useState(() => …)` de `HabitCreateWizard:52-69`. Ese
   * wizard es la raíz de su modal y su lista viene de la caché; este paso se
   * apila dentro de `VidaActivitySheet`, y en frío —sesión recién abierta, o
   * `useVidaQueryGuard` todavía cerrado— el primer render llega con
   * `data: undefined`. Un inicializador sortearía sobre cero categorías y
   * podría repetir el color de la de al lado, y en los tests **saldría verde**
   * porque ahí el hook está mockeado con datos síncronos.
   *
   * `decided` es el pestillo que garantiza «una sola vez»: se echa al sortear y
   * también al elegir una muestra a mano, así que ni escribir el nombre, ni
   * elegir el icono, ni que la lista se refresque por debajo mueven el color.
   * Va en el propio estado —el patrón de React para ajustar estado durante el
   * render— y no en un `useRef`: leer una `ref` en el cuerpo del componente lo
   * prohíbe `react-hooks` («Cannot access refs during render»), y un `useEffect`
   * con `setState` también está vetado por el linter de este repositorio.
   */
  const [colorChoice, setColorChoice] = useState<{ decided: boolean; value: string | null }>({
    decided: false,
    value: null,
  })
  if (!colorChoice.decided && categories) {
    setColorChoice({
      decided: true,
      value: pickInitialCategoryColor(categories.map((category) => category.color)),
    })
  }
  const color = colorChoice.value

  /** Lo que elige la persona manda: a partir de ahí el sorteo ya no entra. */
  function handleColorChange(next: string | null) {
    setColorChoice({ decided: true, value: next })
  }

  const isMutating = createMutation.isPending || setGoalMutation.isPending

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Ponle un nombre a la categoría.')
      return
    }
    setNameError(null)
    try {
      const category = await createMutation.mutateAsync({ name: trimmed, icon, color })
      if (isWork) {
        // **Dos viajes a propósito, y es lo único que se puede hacer aquí:** el
        // puntero necesita el id de la categoría, que no existe hasta que se
        // crea. Si este segundo falla, la categoría queda creada y sin marcar
        // —recuperable desde la casilla de editar— y el hook ya lo dice con su
        // toast, así que el paso se cierra igual: dejarlo abierto invitaría a
        // crear la misma categoría dos veces.
        try {
          await setGoalMutation.mutateAsync({ categoryId: category.id, attached: true })
        } catch {
          // Avisado por el toast del hook.
        }
      }
      onCreated(category.id)
      pop()
    } catch {
      // Solo se vuelve al formulario si de verdad se creó. Si falla, el paso
      // se queda abierto con lo escrito (criterio 16).
    }
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
          onChange={handleColorChange}
          disabled={isMutating}
          label="Color de la categoría"
        />
      </div>

      <Checkbox
        id="new-vida-category-is-work"
        checked={isWork}
        onChange={(event) => setIsWork(event.target.checked)}
        disabled={isMutating}
        label="Esto es trabajo"
        description="Sus horas suman en el arco de trabajo de Hoy."
      />

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
        <Button type="button" onClick={() => void handleCreate()} isLoading={isMutating}>
          Crear categoría
        </Button>
      </div>
    </div>
  )
}
