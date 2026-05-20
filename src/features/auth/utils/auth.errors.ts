import { ApiClientError, ApiNetworkError, ApiTimeoutError } from '@/shared/api/api-error'

export function getAuthErrorMessage(error: unknown, fallback = 'Ha ocurrido un error.'): string {
  if (error instanceof ApiClientError) {
    return error.errors[0] ?? error.message
  }
  if (error instanceof ApiNetworkError || error instanceof ApiTimeoutError) {
    return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
