import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'

/**
 * Copia de `useHabitQueryGuard` (`src/features/habits/hooks/useHabits.ts:14-18`),
 * aquí exportada: en `79bece0` cada hook repetía estas dos líneas.
 */
export function useVidaQueryGuard() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}
