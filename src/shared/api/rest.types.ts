export interface ApiSuccess<T> {
  status: true
  data: T
  message?: string
  meta?: { env: string }
}

export interface ApiErrorResponse {
  status: false
  errors: string[]
  env: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    (value as ApiErrorResponse).status === false &&
    Array.isArray((value as ApiErrorResponse).errors)
  )
}

export function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    (value as ApiSuccess<T>).status === true &&
    'data' in value
  )
}
