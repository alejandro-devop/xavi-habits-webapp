export function assertDefined<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null || value === '') {
    throw new Error(message)
  }
  return value
}

export function assertValidUrl(value: string, message: string): string {
  try {
    new URL(value)
    return value
  } catch {
    throw new Error(message)
  }
}
