import { useVidaDayHours, type VidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useActivityDayPlanQuery } from '@/features/vida/hooks/useActivityDayPlan'
import { useActivityDayFollowUpsQuery } from '@/features/vida/hooks/useActivityFollowUps'
import { useVidaSuggestionsForDateQuery } from '@/features/vida/hooks/useVidaItems'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'

export type VidaDayData = {
  date: string
  planItems: ActivityDayPlanItem[]
  suggestions: VidaSuggestion[]
  /**
   * Lo que se vivió ese día (FEAT-004, tajada 2). En un día **futuro** llega
   * siempre vacía: `useActivityDayFollowUpsQuery` está apagada ahí, que es lo
   * que pide el criterio 27.
   */
  followUps: ActivityFollowUp[]
  dayHours: VidaDayHours
  /** Sin sesión: las consultas quedan deshabilitadas y no va a llegar nada. */
  isDisabled: boolean
  /** Algo en vuelo: no se afirma «no tienes plan» todavía (criterio 50). */
  isPending: boolean
  /** El plan no cargó: sin él no hay agenda que pintar. */
  isPlanError: boolean
  /** Lo que falló, en lenguaje humano, para decir **qué falta** (criterio 52). */
  failed: string[]
  /** Vuelve a pedir las cuatro. */
  refetch: () => void
}

/**
 * Las cuatro consultas de un día, juntas y con el estado de cada una.
 *
 * Existe por el criterio 52: si falla **una** y las otras no, la pantalla tiene
 * que poder decir qué falta en vez de quedarse a medias sin explicación. Un
 * `isError` suelto no da para eso.
 *
 * Cuando falla **lo vivido**, `followUps` llega vacía y `failed` dice «lo que
 * viviste» (criterio 58). No hay un `isFollowUpsError` aparte **a propósito**:
 * con lo vivido caído no se pinta ni una etiqueta de ejecutado, así que nada
 * afirma lo que no sabe, y un campo que no usa nadie es un campo que miente
 * sobre lo que hace la pantalla. Cuando la **tajada 4** tenga que distinguir
 * «no hecho» de «no lo sé», ese será el momento de sacarlo, con quien lo use
 * delante.
 *
 * No crea ninguna clave de caché ni ninguna consulta nueva: son
 * `vidaKeys.dayPlan.byDate`, `vidaKeys.items.suggestions`,
 * `vidaKeys.followUps.day` y `settingsKeys.my`, las cuatro ya existentes. `useVidaDayHours` es un envoltorio de lectura sobre
 * los ajustes, no una cuarta consulta.
 *
 * El catálogo de actividades (`useActivitiesQuery`) **no entra aquí**: ni la
 * agenda ni lo vivido buscan entre actividades; el icono y el color salen de la
 * categoría que ya viene dentro de cada bloque, de cada sugerencia y de cada
 * sesión (`activityDayFollowUps` ya selecciona `activity { category }`).
 */
export function useVidaDayData(date: string): VidaDayData {
  const planQuery = useActivityDayPlanQuery(date)
  const suggestionsQuery = useVidaSuggestionsForDateQuery(date)
  const followUpsQuery = useActivityDayFollowUpsQuery(date)
  const dayHours = useVidaDayHours()

  // Deshabilitada (sin sesión) es `isPending` con `fetchStatus: 'idle'`. Mirar
  // solo `isPending` dejaría un esqueleto girando para siempre (criterio 51).
  const isPlanDisabled = planQuery.isPending && planQuery.fetchStatus === 'idle'
  const isSuggestionsDisabled = suggestionsQuery.isPending && suggestionsQuery.fetchStatus === 'idle'
  // La de lo vivido está apagada **también en los días futuros**, no solo sin
  // sesión: ahí `isPending` + `idle` es lo normal y no significa que falte
  // nada (criterio 27).
  const isFollowUpsDisabled = followUpsQuery.isPending && followUpsQuery.fetchStatus === 'idle'
  const isDisabled = isPlanDisabled && isSuggestionsDisabled && dayHours.isDisabled

  const failed: string[] = []
  if (planQuery.isError) failed.push('tu plan del día')
  if (suggestionsQuery.isError) failed.push('lo que trae tu plantilla')
  if (followUpsQuery.isError) failed.push('lo que viviste')
  if (dayHours.isError) failed.push('tu horario de Vida')

  return {
    date,
    planItems: planQuery.data ?? [],
    suggestions: suggestionsQuery.data ?? [],
    followUps: followUpsQuery.data ?? [],
    dayHours,
    isDisabled,
    isPending:
      (planQuery.isPending && !isPlanDisabled) ||
      (suggestionsQuery.isPending && !isSuggestionsDisabled) ||
      (followUpsQuery.isPending && !isFollowUpsDisabled) ||
      dayHours.isPending,
    isPlanError: planQuery.isError,
    failed,
    refetch: () => {
      void planQuery.refetch()
      void suggestionsQuery.refetch()
      void followUpsQuery.refetch()
      dayHours.refetch()
    },
  }
}
