import { useThemeStore } from '@/features/theme/store/theme.store'
import type { ThemePreference } from '@/features/theme/types/theme.types'

export function useTheme() {
  const preference = useThemeStore((s) => s.preference)
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const setPreference = useThemeStore((s) => s.setPreference)

  const cyclePreference = () => {
    const order: ThemePreference[] = ['light', 'dark', 'system']
    const index = order.indexOf(preference)
    const next = order[(index + 1) % order.length] ?? 'system'
    setPreference(next)
  }

  return {
    preference,
    resolvedTheme,
    setPreference,
    cyclePreference,
  }
}
