import type {
  ActivityCategory,
  ActivityCategoryFormValues,
  ActivityCategoryInput,
} from '@/features/activities/types/activity-category.types'
import { normalizeIconName } from '@/shared/icons'

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

export function emptyCategoryFormValues(orderIndex = 0): ActivityCategoryFormValues {
  return {
    name: '',
    description: '',
    icon: null,
    color: '#6366f1',
    orderIndex: String(orderIndex),
  }
}

export function categoryToFormValues(category: ActivityCategory): ActivityCategoryFormValues {
  return {
    name: category.name,
    description: category.description ?? '',
    icon: category.icon,
    color: category.color ?? '#6366f1',
    orderIndex: String(category.orderIndex),
  }
}

export function validateCategoryForm(values: ActivityCategoryFormValues): string | null {
  const name = values.name.trim()
  if (!name) {
    return 'El nombre es obligatorio.'
  }

  if (values.color.trim() && !HEX_COLOR_PATTERN.test(values.color.trim())) {
    return 'El color debe ser un hex válido (ej. #6366f1).'
  }

  const order = Number(values.orderIndex)
  if (values.orderIndex.trim() !== '' && (!Number.isInteger(order) || order < 0)) {
    return 'El orden debe ser un número entero mayor o igual a 0.'
  }

  return null
}

export function formValuesToInput(values: ActivityCategoryFormValues): ActivityCategoryInput {
  const name = values.name.trim()
  const description = values.description.trim()
  const color = values.color.trim()
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

export function nextOrderIndex(categories: ActivityCategory[]): number {
  if (categories.length === 0) return 0
  return Math.max(...categories.map((c) => c.orderIndex)) + 1
}
