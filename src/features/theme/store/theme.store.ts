import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  applyThemeToDocument,
  resolveTheme,
} from '@/features/theme/theme.utils'
import type { ResolvedTheme, ThemePreference } from '@/features/theme/types/theme.types'
import { THEME_STORAGE_KEY } from '@/features/theme/types/theme.types'
import { storage } from '@/shared/lib/storage'

export interface ThemeState {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
  syncResolvedTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'system',
      resolvedTheme: 'light',

      setPreference: (preference) => {
        const resolvedTheme = resolveTheme(preference)
        applyThemeToDocument(resolvedTheme)
        set({ preference, resolvedTheme })
      },

      syncResolvedTheme: () => {
        const resolvedTheme = resolveTheme(get().preference)
        applyThemeToDocument(resolvedTheme)
        set({ resolvedTheme })
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) => storage.getItem(name),
        setItem: (name, value) => storage.setItem(name, value),
        removeItem: (name) => storage.removeItem(name),
      })),
      partialize: (state) => ({ preference: state.preference }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncResolvedTheme()
        }
      },
    },
  ),
)
