import { useState } from 'react'
import { pickInitialHabitCategoryColor } from '@/features/habits/data/habit-colors'
import {
  useCreateHabitCategoryMutation,
  useHabitCategoriesQuery,
} from '@/features/habits/hooks/useHabitCategories'
import { useModalStep } from '@/shared/ui/SteppedModal'
import { Button } from '@/shared/ui/Button'
import { ColorPicker } from '@/shared/ui/ColorPicker'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import styles from './CreateHabitCategoryStep.module.scss'

type Props = {
  onCreated: (categoryId: string) => void
  /** Nombre sugerido por quien abre el paso (p. ej. una plantilla). */
  initialName?: string
}

/**
 * «+ nueva categoría» **dentro del asistente de crear hábito**: el paso se apila
 * con `push` desde `NewCategoryButton` y al crear vuelve con `pop`, dejando la
 * categoría elegida en el hábito (`onCreated`).
 *
 * El color entra por el `ColorPicker` compartido (los veintidós de la paleta),
 * no por la rueda del sistema, y llega ya marcado con uno del núcleo que no
 * repite el de otra categoría de hábitos (FEAT-026, tajada 2). Lo que se ve
 * marcado es lo que se guarda: antes la rueda pintaba índigo y, sin tocarla, la
 * categoría se creaba sin color.
 */
export function CreateHabitCategoryStep({ onCreated, initialName = '' }: Props) {
  const { pop } = useModalStep()
  const createMutation = useCreateHabitCategoryMutation()
  // Los colores que ya usan las categorías de hábitos del usuario. Es la misma
  // lista que pinta el selector del asistente, así que casi siempre viene de la
  // caché. **Sin `= []`:** `undefined` es «todavía no ha llegado», que no es lo
  // mismo que «no hay ninguna».
  const { data: categories } = useHabitCategoriesQuery()

  const [name, setName] = useState(initialName)
  const [icon, setIcon] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  /**
   * El color, **sorteado una sola vez y en cuanto haya lista** (criterios 14 y
   * 17). Copia el pestillo de `CreateVidaCategoryStep`.
   *
   * No vale el `useState(() => sorteo)` de `HabitCreateWizard`: este paso se
   * apila, y en frío —sesión recién abierta, guardia de la consulta aún
   * cerrado— el primer render llega con `data: undefined`. Sortear ahí sería
   * sortear sobre cero categorías y poder repetir color.
   *
   * `decided` es el pestillo: se echa al sortear y también al elegir una
   * muestra a mano, así que ni escribir el nombre, ni elegir el icono, ni que la
   * lista se refresque por debajo mueven el color. Va en el propio estado —el
   * ajuste de estado durante el render— y no en un `useRef` ni en un
   * `useEffect`: el linter de este repositorio veta las dos cosas.
   */
  const [colorChoice, setColorChoice] = useState<{ decided: boolean; value: string | null }>({
    decided: false,
    value: null,
  })
  if (!colorChoice.decided && categories) {
    setColorChoice({
      decided: true,
      value: pickInitialHabitCategoryColor(categories.map((category) => category.color)),
    })
  }
  const color = colorChoice.value

  /** Lo que elige la persona manda: a partir de ahí el sorteo ya no entra. */
  function handleColorChange(next: string) {
    setColorChoice({ decided: true, value: next })
  }

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
        <span className={styles.colorLabel}>Color</span>
        <ColorPicker
          value={color}
          onChange={handleColorChange}
          disabled={isMutating}
          label="Color de la categoría"
        />
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
