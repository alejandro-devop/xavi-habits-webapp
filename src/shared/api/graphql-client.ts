import { env } from '@/app/config/env'
import { getValidAccessToken } from '@/features/auth/services/token.service'
import {
  ApiNetworkError,
  ApiTimeoutError,
  AuthRequiredError,
  GraphQLClientError,
  ValidationError,
  classifyGraphQLErrors,
  type GraphQLErrorItem,
} from '@/shared/api/api-error'

const DEFAULT_TIMEOUT_MS = 30_000

interface GraphQLResponse<TData> {
  data?: TData
  errors?: GraphQLErrorItem[]
}

export async function graphqlRequest<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
): Promise<TData> {
  const token = await getValidAccessToken()
  if (!token) {
    throw new AuthRequiredError()
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(env.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    })

    let json: GraphQLResponse<TData>
    try {
      json = (await response.json()) as GraphQLResponse<TData>
    } catch {
      throw new AuthRequiredError('La respuesta GraphQL no es válida.')
    }

    if (json.errors?.length) {
      throw classifyGraphQLErrors(json.errors)
    }

    if (json.data === undefined) {
      throw new AuthRequiredError('La respuesta GraphQL no contiene datos.')
    }

    return json.data
  } catch (error) {
    if (
      error instanceof AuthRequiredError ||
      error instanceof ApiTimeoutError ||
      error instanceof ApiNetworkError ||
      error instanceof GraphQLClientError ||
      error instanceof ValidationError
    ) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiTimeoutError(DEFAULT_TIMEOUT_MS)
    }

    if (error instanceof TypeError) {
      throw new ApiNetworkError(error)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
