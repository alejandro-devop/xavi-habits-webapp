import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as dayPlanApi from '@/features/vida/api/activity-day-plan.api'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import type {
  ActivityDayPlanItemAddInput,
  ActivityDayPlanItemEditInput,
  ActivityDayPlanSetInput,
} from '@/features/vida/types/activity-day-plan.types'
import { invalidateDayPlanQueries } from '@/features/vida/utils/invalidate-vida-queries'
import { vidaKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

/**
 * Plan del día. A diferencia de los follow-ups, **una fecha futura sí consulta**:
 * planear mañana es el caso de uso, no un error.
 *
 * Los inputs del esquema aceptan `clientId` (UUID v7, idempotencia offline) y
 * aquí **no se genera ninguno**: la web es el piloto y no hay modo offline. El
 * día que lo haya, se emite en estos hooks —no en el `api`—, junto al borrador
 * que se quiera reenviar.
 */
export function useActivityDayPlanQuery(date: string) {
  const guard = useVidaQueryGuard()
  const enabled = guard && Boolean(date)
  return useQuery({
    queryKey: vidaKeys.dayPlan.byDate(date),
    enabled,
    queryFn: () => dayPlanApi.getActivityDayPlan(date),
    staleTime: 1000 * 30,
  })
}

export function useSetActivityDayPlanMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityDayPlanSetInput) => dayPlanApi.setActivityDayPlan(input),
    onSuccess: (_data, variables) => {
      invalidateDayPlanQueries(queryClient, { date: variables.date })
      toast.success('Plan del día guardado')
    },
  })
}

export function useAddDayPlanItemMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityDayPlanItemAddInput) => dayPlanApi.addActivityDayPlanItem(input),
    onSuccess: (data, variables) => {
      invalidateDayPlanQueries(queryClient, { date: data.date ?? variables.date })
      toast.success('Añadido a tu plan')
    },
  })
}

/**
 * `activityDayPlanItemEdit` solo recibe `itemId`: la fecha del bloque no viaja
 * en el input, así que la respuesta es la que dice qué día invalidar.
 */
export function useEditDayPlanItemMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityDayPlanItemEditInput) => dayPlanApi.editActivityDayPlanItem(input),
    onSuccess: (data) => {
      invalidateDayPlanQueries(queryClient, { date: data.date })
      toast.success('Plan actualizado')
    },
  })
}

/**
 * Quitar devuelve `Boolean!`, sin fecha: por eso quien llama pasa la fecha del
 * bloque que está quitando.
 */
export function useRemoveDayPlanItemMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (payload: { itemId: string; date: string }) =>
      dayPlanApi.removeActivityDayPlanItem({ itemId: payload.itemId }),
    onSuccess: (_data, variables) => {
      invalidateDayPlanQueries(queryClient, { date: variables.date })
      toast.success('Quitado del plan')
    },
  })
}
