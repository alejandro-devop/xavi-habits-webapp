import { useEffect, type ReactNode } from 'react'
import { useThemeStore } from '@/features/theme/store/theme.store'

type ThemeProviderProps = {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const preference = useThemeStore((s) => s.preference)
  const syncResolvedTheme = useThemeStore((s) => s.syncResolvedTheme)

  useEffect(() => {
    syncResolvedTheme()
  }, [preference, syncResolvedTheme])

  useEffect(() => {
    if (preference !== 'system' || typeof window.matchMedia !== 'function') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => syncResolvedTheme()

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preference, syncResolvedTheme])

  return children
}
