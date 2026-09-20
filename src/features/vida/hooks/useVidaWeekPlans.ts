import { useQueries } from '@tanstack/react-query'
import * as dayPlanApi from '@/features/vida/api/activity-day-plan.api'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import { vidaKeys } from '@/shared/api/query-keys'

export type VidaDayPlanDot = {
  date: string
  /** Ese día tiene al menos un bloque puesto (criterio 32). */
  hasPlan: boolean
  /** Cuántos bloques trae. Es lo que nombra «Copiar del \<día\> pasado». */
  blockCount: number
  /** Todavía no se sabe: el punto no afirma «no tiene plan» mientras carga. */
  isPending: boolean
}

export type VidaWeekPlans = {
  /** Por fecha, para que la tira no tenga que buscar en una lista. */
  byDate: Record<string, VidaDayPlanDot>
  /** Alguna de las consultas sigue en vuelo. */
  isPending: boolean
}

/**
 * Los puntos de la tira: **una consulta por día**, con la misma clave y la
 * misma `queryFn` que `useActivityDayPlanQuery`.
 *
 * Por eso el día abierto es un acierto de caché (ya lo pidió `useVidaDayData`)
 * y por eso `invalidateDayPlanQueries(date)` refresca a la vez la agenda y su
 * punto: es **la misma entrada de caché**, no dos. No se inventa ninguna clave
 * de rango, que es lo que el plan del arquitecto prohíbe expresamente.
 *
 * El coste —siete consultas pequeñas con `staleTime` de 30 s— no está medido
 * contra el API real; queda anotado en el dossier. Si se notara, la salida es
 * pedir solo el día visto y llenar los puntos perezosamente, sin tocar a quien
 * llama: la forma de esta función no cambiaría.
 */
export function useVidaWeekPlans(dates: string[]): VidaWeekPlans {
  const guard = useVidaQueryGuard()

  const results = useQueries({
    queries: dates.map((date) => ({
      queryKey: vidaKeys.dayPlan.byDate(date),
      enabled: guard && Boolean(date),
      queryFn: () => dayPlanApi.getActivityDayPlan(date),
      staleTime: 1000 * 30,
    })),
  })

  const byDate: Record<string, VidaDayPlanDot> = {}
  let isPending = false

  dates.forEach((date, index) => {
    const result = results[index]
    // Sin sesión las consultas quedan deshabilitadas (`isPending` + `idle`) y
    // no va a llegar nada: el punto se queda vacío, no girando para siempre.
    const isDisabled = Boolean(result?.isPending) && result?.fetchStatus === 'idle'
    const pending = Boolean(result?.isPending) && !isDisabled
    const items = result?.data ?? []
    byDate[date] = {
      date,
      hasPlan: items.length > 0,
      blockCount: items.length,
      isPending: pending,
    }
    if (pending) isPending = true
  })

  return { byDate, isPending }
}
