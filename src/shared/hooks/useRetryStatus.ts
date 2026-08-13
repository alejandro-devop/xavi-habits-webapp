import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Query, QueryClient } from '@tanstack/react-query'
import { getRetryDelay } from '@/app/providers/query-client'

export type RetryStatus =
  /** Nada que anunciar. */
  | { kind: 'idle' }
  /** Un intento falló y hay otro programado. */
  | { kind: 'retrying'; secondsLeft: number; attempt: number }
  /** Se agotaron los reintentos automáticos: toca decidir al usuario. */
  | { kind: 'failed'; failedCount: number }

type Snapshot = {
  /** Momento del próximo reintento automático más cercano. */
  nextRetryAt: number | null
  secondsLeft: number
  attempt: number
  failedCount: number
}

const EMPTY: Snapshot = { nextRetryAt: null, secondsLeft: 0, attempt: 0, failedCount: 0 }

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.nextRetryAt === b.nextRetryAt &&
    a.secondsLeft === b.secondsLeft &&
    a.attempt === b.attempt &&
    a.failedCount === b.failedCount
  )
}

/**
 * Backoff que realmente aplicará esta query. Se lee de sus propias opciones en
 * vez de asumir el default global: una query puede sobreescribir `retryDelay`,
 * y anunciar una cuenta atrás calculada con otra fórmula sería mentir.
 */
function resolveRetryDelay(query: Query, failureCount: number): number {
  const configured = query.options.retryDelay

  if (typeof configured === 'number') return configured

  if (typeof configured === 'function') {
    // `fetchFailureReason` es el error del intento en curso; `error` sólo queda
    // fijado al agotarse los reintentos. Si no hubiera ninguno, se cae al
    // backoff por defecto en vez de inventar un argumento.
    const reason = query.state.fetchFailureReason ?? query.state.error
    if (reason) return configured(failureCount - 1, reason)
  }

  return getRetryDelay(failureCount - 1)
}

/**
 * react-query no expone cuándo disparará el próximo reintento, así que se
 * deduce: al detectar que el contador de fallos de una query subió, se anota el
 * instante y se le suma su backoff.
 */
function readSnapshot(
  queryClient: QueryClient,
  seen: Map<string, { count: number; at: number }>,
  now: number,
): Snapshot {
  let nextRetryAt: number | null = null
  let attempt = 0
  let failedCount = 0

  for (const query of queryClient.getQueryCache().getAll()) {
    const { fetchFailureCount, fetchStatus, error } = query.state
    const key = query.queryHash

    if (fetchFailureCount === 0) {
      seen.delete(key)
    } else {
      const previous = seen.get(key)
      if (!previous || previous.count !== fetchFailureCount) {
        seen.set(key, { count: fetchFailureCount, at: now })
      }
    }

    // Reintento en curso: el fetch sigue vivo y ya acumuló al menos un fallo.
    if (fetchStatus === 'fetching' && fetchFailureCount > 0) {
      const record = seen.get(key)
      if (record) {
        const scheduledAt = record.at + resolveRetryDelay(query, fetchFailureCount)
        if (nextRetryAt === null || scheduledAt < nextRetryAt) {
          nextRetryAt = scheduledAt
          attempt = fetchFailureCount
        }
      }
    }

    // Reintentos agotados: quedó en error y ya no hay fetch en vuelo.
    if (fetchStatus === 'idle' && error !== null) {
      failedCount += 1
    }
  }

  return {
    nextRetryAt,
    secondsLeft: nextRetryAt === null ? 0 : Math.max(0, Math.ceil((nextRetryAt - now) / 1000)),
    attempt,
    failedCount,
  }
}

export function useRetryStatus(): { status: RetryStatus; retryNow: () => void } {
  const queryClient = useQueryClient()
  const seen = useRef(new Map<string, { count: number; at: number }>())
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY)

  // El reloj se lee aquí, nunca durante el render: leerlo al renderizar haría
  // impuro al componente.
  const sync = useCallback(() => {
    const next = readSnapshot(queryClient, seen.current, Date.now())
    setSnapshot((prev) => (sameSnapshot(prev, next) ? prev : next))
  }, [queryClient])

  useEffect(() => queryClient.getQueryCache().subscribe(sync), [queryClient, sync])

  // El latido de la cuenta atrás sólo corre mientras haya algo que contar.
  useEffect(() => {
    if (snapshot.nextRetryAt === null) return

    const id = window.setInterval(sync, 250)
    return () => window.clearInterval(id)
  }, [snapshot.nextRetryAt, sync])

  const retryNow = useCallback(() => {
    void queryClient.refetchQueries({ predicate: (query) => query.state.error !== null })
  }, [queryClient])

  let status: RetryStatus = { kind: 'idle' }

  if (snapshot.nextRetryAt !== null) {
    status = { kind: 'retrying', secondsLeft: snapshot.secondsLeft, attempt: snapshot.attempt }
  } else if (snapshot.failedCount > 0) {
    status = { kind: 'failed', failedCount: snapshot.failedCount }
  }

  return { status, retryNow }
}
