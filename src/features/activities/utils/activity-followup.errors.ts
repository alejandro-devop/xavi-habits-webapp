import { GraphQLClientError, ValidationError } from '@/shared/api/api-error'

export function getActivityFollowUpErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message
  }

  if (error instanceof GraphQLClientError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'No se pudo completar la operación de seguimiento de tiempo'
}
