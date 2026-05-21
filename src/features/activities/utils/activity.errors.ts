import { GraphQLClientError, ValidationError } from '@/shared/api/api-error'

export function getActivityErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    const first = error.validationErrors[0]
    return first?.message ?? error.message
  }

  if (error instanceof GraphQLClientError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Ha ocurrido un error inesperado.'
}
