import { useQueries } from '@tanstack/react-query'
import * as followUpsApi from '@/features/vida/api/activity-followups.api'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { isFutureDate } from '@/features/vida/utils/vida-date.utils'
import { vidaKeys } from '@/shared/api/query-keys'

export type VidaDayFollowUps = {
  date: string
  /** Lo que se registró ese día. Vacío mientras no se sepa. */
  followUps: ActivityFollowUp[]
  /** Todavía no se sabe: la fila no afirma «no hay nada» mientras carga. */
  isPending: boolean
  /**
   * **Su consulta falló.** No es lo mismo que «ese día no registró nada»: sin
   * esta distinción, un fallo de red pintaría una fila con la barra entera en
   * «sin registrar», que es afirmar algo que no se sabe (criterio 52).
   */
  isError: boolean
}

export type VidaWeekFollowUps = {
  /** Por fecha, para que la semana no tenga que buscar en una lista. */
  byDate: Record<string, VidaDayFollowUps>
  /** Alguna de las consultas sigue en vuelo. */
  isPending: boolean
  /** Alguna falló: hay días de los que no se sabe qué pasó. */
  hasError: boolean
  /** Vuelve a pedir las que fallaron. */
  refetch: () => void
}

/**
 * **La mitad real de la semana** (FEAT-006, tajada 4, A4): **una consulta por
 * día**, con la misma clave (`vidaKeys.followUps.day`) y la misma `queryFn`
 * (`getActivityDayFollowUps`) que `useActivityDayFollowUpsQuery`.
 *
 * Es el calco de `useVidaWeekPlans` sobre las sesiones, y lo es a propósito:
 *
 * - **El día visto es un acierto de caché** —ya lo pidió `useVidaDayData`—, así
 *   que abrir la semana desde la revisión de un día cuesta seis consultas de
 *   sesiones, no siete (criterio 53).
 * - **Escribir en un día refresca su fila sin invalidación nueva**:
 *   `invalidateFollowUpQueries(date)` invalida `followUps.day(date)`, que es
 *   **esta misma entrada de caché**.
 * - **Un fallo se sabe por día** (criterio 52). Con el rango
 *   (`followUps.range`) habría una sola consulta, pero falla entera y no
 *   comparte caché con el día: las dos razones por las que el plan lo descartó.
 *
 * Mismo `enabled` que el hook de un día, **incluido `!isFutureDate(date)`**: el
 * domingo que todavía no ha llegado no pide lo que no existe.
 */
export function useVidaWeekFollowUps(dates: string[]): VidaWeekFollowUps {
  const guard = useVidaQueryGuard()

  const results = useQueries({
    queries: dates.map((date) => ({
      queryKey: vidaKeys.followUps.day(date),
      enabled: guard && Boolean(date) && !isFutureDate(date),
      queryFn: () => followUpsApi.getActivityDayFollowUps(date),
      staleTime: 1000 * 30,
    })),
  })

  const byDate: Record<string, VidaDayFollowUps> = {}
  let isPending = false
  let hasError = false

  dates.forEach((date, index) => {
    const result = results[index]
    // Sin sesión —y en un día futuro— la consulta queda deshabilitada
    // (`isPending` + `idle`) y no va a llegar nada: la fila se queda quieta, no
    // girando para siempre. Es la misma lectura que hace `useVidaWeekPlans`.
    const isDisabled = Boolean(result?.isPending) && result?.fetchStatus === 'idle'
    const pending = Boolean(result?.isPending) && !isDisabled
    const failed = Boolean(result?.isError)
    byDate[date] = {
      date,
      followUps: failed ? [] : (result?.data ?? []),
      isPending: pending,
      isError: failed,
    }
    if (pending) isPending = true
    if (failed) hasError = true
  })

  return {
    byDate,
    isPending,
    hasError,
    refetch: () => {
      for (const result of results) {
        if (result?.isError) void result.refetch()
      }
    },
  }
}
