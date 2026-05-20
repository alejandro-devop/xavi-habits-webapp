const isBrowser = typeof window !== 'undefined'

export const storage = {
  getItem(key: string): string | null {
    if (!isBrowser) return null
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    if (!isBrowser) return
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Quota exceeded or private mode
    }
  },
  removeItem(key: string): void {
    if (!isBrowser) return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
}
