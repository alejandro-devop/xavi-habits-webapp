import { assertDefined, assertValidUrl } from '@/shared/utils/assert'

const REQUIRED_KEYS = [
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_API_URL',
] as const satisfies readonly (keyof ImportMetaEnv)[]

function readRequiredEnv(key: (typeof REQUIRED_KEYS)[number]): string {
  const raw = import.meta.env[key]
  return assertDefined(
    typeof raw === 'string' ? raw.trim() : undefined,
    `Missing required environment variable: ${key}`,
  )
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

function parseEnv() {
  const missing = REQUIRED_KEYS.filter((key) => {
    const value = import.meta.env[key]
    return typeof value !== 'string' || value.trim() === ''
  })

  if (missing.length > 0) {
    throw new Error(`Invalid environment configuration. Missing or empty: ${missing.join(', ')}`)
  }

  const appName = readRequiredEnv('VITE_APP_NAME')
  const appVersion = readRequiredEnv('VITE_APP_VERSION')
  const apiUrl = normalizeBaseUrl(
    assertValidUrl(readRequiredEnv('VITE_API_URL'), 'VITE_API_URL must be a valid absolute URL'),
  )

  return {
    appName,
    appVersion,
    apiUrl,
    authBaseUrl: `${apiUrl}/api/auth`,
    graphqlUrl: `${apiUrl}/graphql`,
  } as const
}

export const env = parseEnv()
