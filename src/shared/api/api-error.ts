export interface GraphQLValidationErrorItem {
  path: string[]
  message: string
}

export interface GraphQLErrorItem {
  message: string
  extensions?: {
    code?: string
    validationErrors?: GraphQLValidationErrorItem[]
  }
}

export class ApiClientError extends Error {
  readonly name = 'ApiClientError'
  readonly errors: string[]
  readonly httpStatus?: number
  readonly env?: string
  readonly isAuthError: boolean

  constructor(options: {
    message: string
    errors?: string[]
    httpStatus?: number
    env?: string
    isAuthError?: boolean
    cause?: unknown
  }) {
    super(options.message)
    this.errors = options.errors ?? [options.message]
    this.httpStatus = options.httpStatus
    this.env = options.env
    this.isAuthError = options.isAuthError ?? options.httpStatus === 401
    if (options.cause !== undefined) {
      this.cause = options.cause
    }
  }
}

export class ApiTimeoutError extends Error {
  readonly name = 'ApiTimeoutError'
  readonly timeoutMs: number

  constructor(timeoutMs: number) {
    super('La solicitud tardó demasiado. Inténtalo de nuevo.')
    this.timeoutMs = timeoutMs
  }
}

export class ApiNetworkError extends Error {
  readonly name = 'ApiNetworkError'

  constructor(cause?: unknown) {
    super('Error de conexión. Comprueba tu red e inténtalo de nuevo.')
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

export class GraphQLClientError extends Error {
  readonly name = 'GraphQLClientError'
  readonly graphQLErrors: GraphQLErrorItem[]

  constructor(graphQLErrors: GraphQLErrorItem[]) {
    const message = graphQLErrors[0]?.message ?? 'Error en la solicitud GraphQL'
    super(message)
    this.graphQLErrors = graphQLErrors
  }
}

export class AuthRequiredError extends Error {
  readonly name = 'AuthRequiredError'

  constructor(message = 'Debes iniciar sesión para continuar.') {
    super(message)
  }
}

export class ValidationError extends Error {
  readonly name = 'ValidationError'
  readonly validationErrors: GraphQLValidationErrorItem[]
  readonly graphQLErrors: GraphQLErrorItem[]

  constructor(graphQLErrors: GraphQLErrorItem[], validationErrors: GraphQLValidationErrorItem[]) {
    const message =
      validationErrors[0]?.message ?? graphQLErrors[0]?.message ?? 'Datos no válidos'
    super(message)
    this.graphQLErrors = graphQLErrors
    this.validationErrors = validationErrors
  }
}

const AUTH_ERROR_MESSAGES = new Set([
  'authentication required',
  'unauthorized',
])

export function isAuthGraphQLError(errors: GraphQLErrorItem[]): boolean {
  return errors.some((error) =>
    AUTH_ERROR_MESSAGES.has(error.message.trim().toLowerCase()),
  )
}

export function extractValidationErrors(
  errors: GraphQLErrorItem[],
): GraphQLValidationErrorItem[] {
  const items: GraphQLValidationErrorItem[] = []
  for (const error of errors) {
    if (error.extensions?.code === 'BAD_USER_INPUT' && error.extensions.validationErrors) {
      items.push(...error.extensions.validationErrors)
    }
  }
  return items
}

export function classifyGraphQLErrors(errors: GraphQLErrorItem[]): Error {
  if (errors.length === 0) {
    return new GraphQLClientError([{ message: 'Error desconocido en GraphQL' }])
  }

  if (isAuthGraphQLError(errors)) {
    return new AuthRequiredError(errors[0]?.message)
  }

  const validationErrors = extractValidationErrors(errors)
  if (validationErrors.length > 0) {
    return new ValidationError(errors, validationErrors)
  }

  return new GraphQLClientError(errors)
}

export function isRetryableQueryError(error: unknown): boolean {
  if (error instanceof AuthRequiredError || error instanceof ValidationError) {
    return false
  }
  if (error instanceof ApiClientError && error.isAuthError) {
    return false
  }
  return true
}
