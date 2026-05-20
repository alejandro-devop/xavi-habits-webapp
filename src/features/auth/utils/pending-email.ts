const STORAGE_KEY = 'xavi-auth-pending-email'

export function setPendingEmail(email: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, email.trim().toLowerCase())
  } catch {
    // ignore quota / private mode
  }
}

export function getPendingEmail(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearPendingEmail(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
