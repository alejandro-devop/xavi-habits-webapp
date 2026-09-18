import { useSyncExternalStore } from 'react'

/**
 * Suscripción a una media query. `useSyncExternalStore` evita el parpadeo del
 * patrón `useState` + `useEffect`: el primer render ya lee el valor real.
 */
export function useMediaQuery(query: string): boolean {
  function subscribe(onStoreChange: () => void): () => void {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {}
    const mediaQuery = window.matchMedia(query)
    mediaQuery.addEventListener('change', onStoreChange)
    return () => mediaQuery.removeEventListener('change', onStoreChange)
  }

  function getSnapshot(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  }

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
