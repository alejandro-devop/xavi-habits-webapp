import type { QueryClient } from '@tanstack/react-query'
import { getCurrentWeekRange } from '@/features/vida/utils/vida-date.utils'
import { vidaKeys } from '@/shared/api/query-keys'

/**
 * El **único** sitio con invalidaciones de Vida. En `79bece0` había dos
 * versiones distintas (un `invalidate-follow-up-queries.ts` corto y una copia
 * privada más completa dentro de `useActivityFollowUps.ts`): las listas se
 * desincronizaban según por dónde entrara la mutación. Aquí queda la completa.
 */

type InvalidateFollowUpOptions = {
  date: string
  activityId?: string
  weekRange?: { from: string; to: string }
}

/** `2026-05-20T11:00:00` → `2026-05-20`: el backend devuelve las dos formas. */
export function toFollowUpDateKey(value: string): string {
  return value.slice(0, 10)
}

export function invalidateFollowUpQueries(
  queryClient: QueryClient,
  options: InvalidateFollowUpOptions,
) {
  const date = toFollowUpDateKey(options.date)
  const week = options.weekRange ?? getCurrentWeekRange()

  void queryClient.invalidateQueries({ queryKey: vidaKeys.followUps.day(date) })
  void queryClient.invalidateQueries({ queryKey: vidaKeys.followUps.range(week.from, week.to) })
  void queryClient.invalidateQueries({ queryKey: vidaKeys.followUps.open() })

  if (options.activityId) {
    void queryClient.invalidateQueries({ queryKey: vidaKeys.activities.detail(options.activityId) })
  }

  void queryClient.invalidateQueries({ queryKey: vidaKeys.activities.all() })
}

export function invalidateActivityQueries(queryClient: QueryClient, options: { id?: string } = {}) {
  void queryClient.invalidateQueries({ queryKey: vidaKeys.activities.all() })

  if (options.id) {
    void queryClient.invalidateQueries({ queryKey: vidaKeys.activities.detail(options.id) })
  }
}

export function invalidateActivityCategoryQueries(
  queryClient: QueryClient,
  options: { id?: string } = {},
) {
  void queryClient.invalidateQueries({ queryKey: vidaKeys.categories.list() })

  if (options.id) {
    void queryClient.invalidateQueries({ queryKey: vidaKeys.categories.detail(options.id) })
  }
}

/**
 * Plan del día: mutarlo solo afecta a **esa** fecha. No se invalida
 * `dayPlan.all()`: tirar el plan de todos los días porque cambió el de hoy
 * obligaría a refetch de fechas que nadie tocó.
 */
export function invalidateDayPlanQueries(queryClient: QueryClient, options: { date: string }) {
  const date = toFollowUpDateKey(options.date)

  void queryClient.invalidateQueries({ queryKey: vidaKeys.dayPlan.byDate(date) })
}

/**
 * Plantilla Vida: crear, editar o borrar un `VidaItem` cambia la lista **y** las
 * sugerencias de cualquier fecha. Una sola clave basta, porque
 * `items.suggestions(*)` y `items.takenToday(*)` cuelgan de `items.all()` y
 * React Query invalida por prefijo.
 */
export function invalidateVidaItemQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: vidaKeys.items.all() })
}

/**
 * Marcar/desmarcar «tomado hoy» solo mueve esa fecha: lo tomado y las
 * sugerencias de ese día (cuyo `takenToday` cambia). La plantilla en sí no
 * cambia, así que no se invalida la lista de ítems.
 */
export function invalidateVidaTakenTodayQueries(
  queryClient: QueryClient,
  options: { date: string },
) {
  const date = toFollowUpDateKey(options.date)

  void queryClient.invalidateQueries({ queryKey: vidaKeys.items.takenToday(date) })
  void queryClient.invalidateQueries({ queryKey: vidaKeys.items.suggestions(date) })
}
