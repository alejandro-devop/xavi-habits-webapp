import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as followUpsApi from '@/features/vida/api/activity-followups.api'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import type {
  ActivityFollowUpEditInput,
  ActivityFollowUpInput,
  ActivityFollowUpStartInput,
  ActivityFollowUpSubtaskEditInput,
} from '@/features/vida/types/activity-followup.types'
import { isFutureDate } from '@/features/vida/utils/vida-date.utils'
import { invalidateFollowUpQueries } from '@/features/vida/utils/invalidate-vida-queries'
import { vidaKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

export function useActivityOpenFollowUpQuery() {
  const enabled = useVidaQueryGuard()
  return useQuery({
    queryKey: vidaKeys.followUps.open(),
    enabled,
    queryFn: () => followUpsApi.getActivityOpenFollowUp(),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  })
}

export function useActivityDayFollowUpsQuery(date: string) {
  const guard = useVidaQueryGuard()
  const enabled = guard && Boolean(date) && !isFutureDate(date)
  return useQuery({
    queryKey: vidaKeys.followUps.day(date),
    enabled,
    queryFn: () => followUpsApi.getActivityDayFollowUps(date),
    staleTime: 1000 * 30,
  })
}

export function useActivityFollowUpsInDatesQuery(from: string, to: string) {
  const guard = useVidaQueryGuard()
  const enabled = guard && Boolean(from) && Boolean(to)
  return useQuery({
    queryKey: vidaKeys.followUps.range(from, to),
    enabled,
    queryFn: () => followUpsApi.getActivityFollowUpsInDates(from, to),
    staleTime: 1000 * 60,
  })
}

/**
 * Silenciar el toast del hook (FEAT-004, tajada 1).
 *
 * Existe por el criterio 15: «empezar algo con otra cosa en marcha» son **dos**
 * mutaciones encadenadas y tienen que dejar **un solo mensaje** —«Terminamos
 * "Organizar la casa" a las 10:08. En marcha: Leer un rato.»—, no tres avisos
 * apilados sobre el mismo gesto. Y por el criterio 5: el toast del «Terminar»
 * lleva la acción «añadir una nota», que es un cierre de quien conoce la
 * sesión, así que **lo lanza el llamante**, no el hook.
 *
 * Es aditivo: quien no pase nada sigue viendo su toast como siempre.
 */
export type VidaMutationOptions = { silent?: boolean }

export function useStartActivityFollowUpMutation(options: VidaMutationOptions = {}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityFollowUpStartInput) => followUpsApi.startActivityFollowUp(input),
    onSuccess: (data) => {
      queryClient.setQueryData(vidaKeys.followUps.open(), data)
      invalidateFollowUpQueries(queryClient, { date: data.date, activityId: data.activityId })
      // «En marcha» es la palabra del render, no «Actividad iniciada».
      if (!options.silent) toast.success('En marcha')
    },
  })
}

export function useCreateActivityFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityFollowUpInput) => followUpsApi.createActivityFollowUp(input),
    onSuccess: (_data, variables) => {
      invalidateFollowUpQueries(queryClient, {
        date: variables.date,
        activityId: variables.activityId,
      })
      toast.success('Tiempo registrado')
    },
  })
}

export function useUpdateActivityFollowUpMutation(options: VidaMutationOptions = {}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityFollowUpEditInput) => followUpsApi.updateActivityFollowUp(input),
    onSuccess: (data) => {
      if (!data.isOpen) {
        queryClient.setQueryData(vidaKeys.followUps.open(), null)
      }
      invalidateFollowUpQueries(queryClient, { date: data.date, activityId: data.activityId })
      if (!options.silent) toast.success(data.isOpen ? 'Registro actualizado' : 'Tiempo registrado')
    },
  })
}

export function useDeleteActivityFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (payload: { id: string; date: string; activityId: string; wasOpen?: boolean }) =>
      followUpsApi.deleteActivityFollowUp(payload.id),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(vidaKeys.followUps.open(), (current: unknown) => {
        if (
          current &&
          typeof current === 'object' &&
          'id' in current &&
          (current as { id: string }).id === variables.id
        ) {
          return null
        }
        return current
      })
      invalidateFollowUpQueries(queryClient, {
        date: variables.date,
        activityId: variables.activityId,
      })
      // En Vida **no se cancela ni se elimina** (criterios 14 y 59): una sesión
      // empezada por error no se guarda, y un registro se quita del registro.
      toast.success(variables.wasOpen ? 'No la guardamos' : 'Lo quitamos del registro')
    },
  })
}

/**
 * Marcar y desmarcar una subtarea de la sesión abierta (criterio 10).
 *
 * Sin toast: son casillas, y un aviso por cada una sería ruido sobre un gesto
 * que ya se ve en pantalla. La sesión abierta se invalida para que la cuenta
 * («2 de 5») venga del servidor y no de un contador de cliente.
 */
export function useEditFollowUpSubtaskMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActivityFollowUpSubtaskEditInput) =>
      followUpsApi.editActivityFollowUpSubtask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vidaKeys.followUps.open() })
    },
  })
}
