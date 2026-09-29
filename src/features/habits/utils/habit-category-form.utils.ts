import type {
  HabitCategoryEditInput,
  HabitCategoryFormValues,
  HabitCategoryInput,
} from '@/features/habits/types/habit-category.types'
import type { HabitCategory } from '@/features/habits/types/habit.types'
import { normalizeIconName } from '@/shared/icons'

/**
 * Los valores con los que se abre «crear». El color **lo trae quien llama**
 * (el sorteo de `pickInitialHabitCategoryColor`, que necesita la lista de
 * categorías ya llegada): este fichero no sortea, solo arma el formulario.
 *
 * Antes el valor por defecto era `#6366f1`, un índigo que no está en la paleta
 * de 22: toda categoría creada sin tocar el color nacía con un color de fuera
 * (FEAT-026).
 */
export function defaultCategoryFormValues(
  orderIndex = 0,
  color: string | null = null,
): HabitCategoryFormValues {
  return {
    name: '',
    description: '',
    icon: null,
    color,
    orderIndex: String(orderIndex),
  }
}

/**
 * Editar enseña **el color que la categoría ya tiene, tal cual**: uno de la
 * paleta, uno de fuera (el `ColorPicker` lo pinta como «Color actual») o
 * ninguno. Antes, sin color, se rellenaba con `#6366f1` y guardar le escribía
 * índigo aunque solo se hubiera cambiado el nombre (FEAT-026, criterio 8).
 */
export function categoryToFormValues(category: HabitCategory): HabitCategoryFormValues {
  return {
    name: category.name,
    description: category.description ?? '',
    icon: category.icon,
    color: category.color,
    orderIndex: String(category.orderIndex),
  }
}

/**
 * Ya no se valida el color (FEAT-026): desde el `ColorPicker` no se puede
 * escribir uno mal, y lo único que podría no ser un hex de seis cifras es lo
 * que la categoría ya traía guardado. Bloquear el guardado por eso obligaría a
 * cambiar el color para poder cambiar el nombre, y editar no toca el color que
 * no se toca (el servidor tampoco lo exige: `z.string().max(255)`).
 */
export function validateCategoryForm(values: HabitCategoryFormValues): string | null {
  if (!values.name.trim()) {
    return 'El nombre es obligatorio.'
  }
  const order = Number(values.orderIndex)
  if (values.orderIndex.trim() !== '' && (!Number.isInteger(order) || order < 0)) {
    return 'El orden debe ser un número entero mayor o igual a 0.'
  }
  return null
}

export function buildCategoryCreatePayload(values: HabitCategoryFormValues): HabitCategoryInput {
  const name = values.name.trim()
  const description = values.description.trim()
  const color = values.color?.trim()
  const orderRaw = values.orderIndex.trim()
  const orderIndex = orderRaw === '' ? undefined : Number(orderRaw)

  return {
    name,
    description: description || null,
    icon: values.icon ? normalizeIconName(values.icon) : null,
    color: color || null,
    orderIndex,
  }
}

export function buildCategoryEditPayload(
  values: HabitCategoryFormValues,
  category: HabitCategory,
): HabitCategoryEditInput {
  return {
    id: category.id,
    ...buildCategoryCreatePayload(values),
  }
}

export function nextCategoryOrderIndex(categories: HabitCategory[]): number {
  if (categories.length === 0) return 0
  return Math.max(...categories.map((c) => c.orderIndex)) + 1
}
