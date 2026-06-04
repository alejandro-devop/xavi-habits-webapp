import type {
  HabitCategoryEditInput,
  HabitCategoryFormValues,
  HabitCategoryInput,
} from '@/features/habits/types/habit-category.types'
import type { HabitCategory } from '@/features/habits/types/habit.types'
import { normalizeIconName } from '@/shared/icons'

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

export function defaultCategoryFormValues(orderIndex = 0): HabitCategoryFormValues {
  return {
    name: '',
    description: '',
    icon: null,
    color: '#6366f1',
    orderIndex: String(orderIndex),
  }
}

export function categoryToFormValues(category: HabitCategory): HabitCategoryFormValues {
  return {
    name: category.name,
    description: category.description ?? '',
    icon: category.icon,
    color: category.color ?? '#6366f1',
    orderIndex: String(category.orderIndex),
  }
}

export function validateCategoryForm(values: HabitCategoryFormValues): string | null {
  if (!values.name.trim()) {
    return 'El nombre es obligatorio.'
  }
  if (values.color && values.color.trim() && !HEX_COLOR_PATTERN.test(values.color.trim())) {
    return 'El color debe ser un hex válido (ej. #6366f1).'
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
