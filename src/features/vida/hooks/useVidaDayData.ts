import { useVidaDayHours, type VidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useActivityDayPlanQuery } from '@/features/vida/hooks/useActivityDayPlan'
import { useVidaSuggestionsForDateQuery } from '@/features/vida/hooks/useVidaItems'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'

export type VidaDayData = {
  date: string
  planItems: ActivityDayPlanItem[]
  suggestions: VidaSuggestion[]
  dayHours: VidaDayHours
  /** Sin sesión: las consultas quedan deshabilitadas y no va a llegar nada. */
  isDisabled: boolean
  /** Algo en vuelo: no se afirma «no tienes plan» todavía (criterio 50). */
  isPending: boolean
  /** El plan no cargó: sin él no hay agenda que pintar. */
  isPlanError: boolean
  /** Lo que falló, en lenguaje humano, para decir **qué falta** (criterio 52). */
  failed: string[]
  /** Vuelve a pedir las tres. */
  refetch: () => void
}

/**
 * Las tres consultas de un día, juntas y con el estado de cada una.
 *
 * Existe por el criterio 52: si falla **una** y las otras no, la pantalla tiene
 * que poder decir qué falta en vez de quedarse a medias sin explicación. Un
 * `isError` suelto no da para eso.
 *
 * No crea ninguna clave de caché ni ninguna consulta nueva: son
 * `vidaKeys.dayPlan.byDate`, `vidaKeys.items.suggestions` y `settingsKeys.my`,
 * las tres ya existentes. `useVidaDayHours` es un envoltorio de lectura sobre
 * los ajustes, no una cuarta consulta.
 *
 * El catálogo de actividades (`useActivitiesQuery`) **no entra aquí**: en la
 * tajada 2 nadie busca entre actividades; el icono y el color salen de la
 * categoría que ya viene dentro de cada bloque y de cada sugerencia.
 */
export function useVidaDayData(date: string): VidaDayData {
  const planQuery = useActivityDayPlanQuery(date)
  const suggestionsQuery = useVidaSuggestionsForDateQuery(date)
  const dayHours = useVidaDayHours()

  // Deshabilitada (sin sesión) es `isPending` con `fetchStatus: 'idle'`. Mirar
  // solo `isPending` dejaría un esqueleto girando para siempre (criterio 51).
  const isPlanDisabled = planQuery.isPending && planQuery.fetchStatus === 'idle'
  const isSuggestionsDisabled = suggestionsQuery.isPending && suggestionsQuery.fetchStatus === 'idle'
  const isDisabled = isPlanDisabled && isSuggestionsDisabled && dayHours.isDisabled

  const failed: string[] = []
  if (planQuery.isError) failed.push('tu plan del día')
  if (suggestionsQuery.isError) failed.push('lo que trae tu plantilla')
  if (dayHours.isError) failed.push('tu horario de Vida')

  return {
    date,
    planItems: planQuery.data ?? [],
    suggestions: suggestionsQuery.data ?? [],
    dayHours,
    isDisabled,
    isPending:
      (planQuery.isPending && !isPlanDisabled) ||
      (suggestionsQuery.isPending && !isSuggestionsDisabled) ||
      dayHours.isPending,
    isPlanError: planQuery.isError,
    failed,
    refetch: () => {
      void planQuery.refetch()
      void suggestionsQuery.refetch()
      dayHours.refetch()
    },
  }
}
