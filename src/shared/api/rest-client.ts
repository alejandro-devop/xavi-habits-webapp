import { env } from '@/app/config/env'
import { ApiClientError, ApiNetworkError, ApiTimeoutError } from '@/shared/api/api-error'
import {
  isApiErrorResponse,
  isApiSuccess,
  type ApiErrorResponse,
  type ApiSuccess,
} from '@/shared/api/rest.types'

const DEFAULT_TIMEOUT_MS = 30_000

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RestRequestOptions<TBody = unknown> {
  method?: HttpMethod
  path: string
  baseUrl?: string
  body?: TBody
  headers?: Record<string, string>
  accessToken?: string
  timeoutMs?: number
}

function buildUrl(baseUrl: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const base = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text.trim()) {
    return undefined
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new ApiClientError({
      message: 'La respuesta del servidor no es válida.',
      httpStatus: response.status,
    })
  }
}

function toApiClientError(
  payload: ApiErrorResponse,
  httpStatus: number,
): ApiClientError {
  const message = payload.errors[0] ?? 'Ha ocurrido un error.'
  return new ApiClientError({
    message,
    errors: payload.errors,
    httpStatus,
    env: payload.env,
    isAuthError: httpStatus === 401,
  })
}

export async function restRequest<TData, TBody = unknown>(
  options: RestRequestOptions<TBody>,
): Promise<TData> {
  const {
    method = 'GET',
    path,
    baseUrl = env.apiUrl,
    body,
    headers = {},
    accessToken,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options

  const url = buildUrl(baseUrl, path)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  }

  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`
  }

  let requestBody: string | undefined
  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    })

    const parsed = await parseResponseBody(response)

    if (isApiErrorResponse(parsed)) {
      throw toApiClientError(parsed, response.status)
    }

    if (isApiSuccess<TData>(parsed)) {
      return parsed.data
    }

    if (!response.ok) {
      throw new ApiClientError({
        message: `Error del servidor (${response.status}).`,
        httpStatus: response.status,
        isAuthError: response.status === 401,
      })
    }

    if (parsed === undefined) {
      return undefined as TData
    }

    throw new ApiClientError({
      message: 'Formato de respuesta inesperado.',
      httpStatus: response.status,
    })
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiTimeoutError(timeoutMs)
    }

    if (error instanceof TypeError) {
      throw new ApiNetworkError(error)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export type { ApiSuccess, ApiErrorResponse }
