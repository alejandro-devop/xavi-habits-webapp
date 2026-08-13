import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { QueryClient } from '@tanstack/react-query'

/**
 * - `ok`: no hay nada que advertir.
 * - `offline`: el navegador reporta que no hay red.
 * - `stale`: hay datos en pantalla, pero el último intento de refrescarlos
 *   falló. Es el caso del backend dormido: la caché persistida se hidrata y se
 *   ve contenido, sin señal de que no está al día.
 * - `syncing`: mismo caso que `stale`, pero con un reintento en vuelo.
 */
export type ConnectionStatus = 'ok' | 'offline' | 'stale' | 'syncing'

function computeStatus(queryClient: QueryClient): ConnectionStatus {
  if (!onlineManager.isOnline()) return 'offline'

  const queries = queryClient.getQueryCache().getAll()

  // Sólo interesan las queries que tienen datos que mostrar y cuyo último
  // fetch falló. Una query que falló sin datos no es "caché vieja": es un
  // error, y de eso ya se encarga cada pantalla.
  let stale = 0
  let refetching = 0

  for (const query of queries) {
    const { error, data, fetchStatus } = query.state
    if (error !== null && data !== undefined) {
      stale += 1
      if (fetchStatus === 'fetching') refetching += 1
    }
  }

  if (stale === 0) return 'ok'
  return refetching > 0 ? 'syncing' : 'stale'
}

export function useConnectionStatus(): ConnectionStatus {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ConnectionStatus>(() => computeStatus(queryClient))

  useEffect(() => {
    const update = () => setStatus(computeStatus(queryClient))

    // Al montar puede haber cambiado algo entre el useState inicial y aquí.
    update()

    const unsubscribeCache = queryClient.getQueryCache().subscribe(update)
    const unsubscribeOnline = onlineManager.subscribe(update)

    return () => {
      unsubscribeCache()
      unsubscribeOnline()
    }
  }, [queryClient])

  return status
}
