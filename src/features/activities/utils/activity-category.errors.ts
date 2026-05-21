import { GraphQLClientError, ValidationError } from '@/shared/api/api-error'

const DELETE_BLOCKED_EN =
  'No se puede eliminar la categoría mientras tenga actividades asignadas.'

const DELETE_BLOCKED_PATTERN = /cannot delete category while activities are assigned/i

export function getActivityCategoryErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    const first = error.validationErrors[0]
    return first?.message ?? error.message
  }

  if (error instanceof GraphQLClientError) {
    const message = error.message
    if (DELETE_BLOCKED_PATTERN.test(message)) {
      return DELETE_BLOCKED_EN
    }
    return message
  }

  if (error instanceof Error) {
    if (DELETE_BLOCKED_PATTERN.test(error.message)) {
      return DELETE_BLOCKED_EN
    }
    return error.message
  }

  return 'Ha ocurrido un error inesperado.'
}
