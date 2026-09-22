import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as vidaItemsApi from '@/features/vida/api/vida-items.api'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import type {
  VidaItemCreateInput,
  VidaItemDeleteInput,
  VidaItemUpdateInput,
  VidaMarkTakenTodayInput,
  VidaUnmarkTakenTodayInput,
} from '@/features/vida/types/vida-item.types'
import {
  invalidateVidaItemQueries,
  invalidateVidaTakenTodayQueries,
} from '@/features/vida/utils/invalidate-vida-queries'
import { toErrorMessage } from '@/features/vida/utils/vida-error.utils'
import { vidaKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

/**
 * La plantilla Vida y lo tomado de ella. Desde la tajada 3 de F1 la consume el
 * catálogo: las casillas de cada tarjeta y el interruptor de la hoja.
 *
 * `onError` con toast en las tres que escriben —crear, actualizar y borrar—; el
 * mensaje lo arma `toErrorMessage`, compartido por los tres hooks de Vida.
 * `useDeleteVidaItemMutation` **ya tiene quien la llame** desde FEAT-005:
 * «Quitar de la plantilla» (criterio 21), que es su primer uso y no contradice
 * el D1 de FEAT-002 —apagar el interruptor sigue sin borrar nada: son dos
 * gestos distintos, «desactivar ≠ quitar»—.
 *
 * `VidaItemCreateInput.clientId` (UUID v7, idempotencia offline) existe en el
 * esquema y **ningún hook lo genera**: la web es el piloto y no hay modo
 * offline. Cuando lo haya, se emite aquí, no en el `api`.
 */
/**
 * `enabled` es **aditivo y por defecto `true`**: quien no lo pase se comporta
 * exactamente igual que antes. Lo estrena FEAT-007, donde la ventana de seis
 * semanas se monta **diferida** en Hoy y en la Plantilla y esta consulta tenía
 * que poder esperar con ella; sin esto, el primer pintado de Hoy la dispararía
 * (criterio 92).
 */
export function useVidaItemsQuery(includeInactive = false, enabled = true) {
  const guard = useVidaQueryGuard()
  return useQuery({
    queryKey: vidaKeys.items.list(includeInactive),
    enabled: guard && enabled,
    queryFn: () => vidaItemsApi.getVidaItems(includeInactive),
    staleTime: 1000 * 60,
  })
}

export function useVidaSuggestionsForDateQuery(date: string) {
  const guard = useVidaQueryGuard()
  const enabled = guard && Boolean(date)
  return useQuery({
    queryKey: vidaKeys.items.suggestions(date),
    enabled,
    queryFn: () => vidaItemsApi.getVidaSuggestionsForDate(date),
    staleTime: 1000 * 30,
  })
}

export function useVidaTakenTodayQuery(date: string) {
  const guard = useVidaQueryGuard()
  const enabled = guard && Boolean(date)
  return useQuery({
    queryKey: vidaKeys.items.takenToday(date),
    enabled,
    queryFn: () => vidaItemsApi.getVidaTakenToday(date),
    staleTime: 1000 * 30,
  })
}

export function useCreateVidaItemMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: VidaItemCreateInput) => vidaItemsApi.createVidaItem(input),
    onSuccess: () => {
      invalidateVidaItemQueries(queryClient)
      toast.success('Añadido a tu plantilla')
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos añadirla a tu plantilla'))
    },
  })
}

export function useUpdateVidaItemMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: VidaItemUpdateInput) => vidaItemsApi.updateVidaItem(input),
    onSuccess: () => {
      invalidateVidaItemQueries(queryClient)
      toast.success('Plantilla actualizada')
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos guardar tu plantilla'))
    },
  })
}

export function useDeleteVidaItemMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: VidaItemDeleteInput) => vidaItemsApi.deleteVidaItem(input),
    onSuccess: () => {
      invalidateVidaItemQueries(queryClient)
      toast.success('Quitado de tu plantilla')
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos quitarlo de tu plantilla'))
    },
  })
}

export function useMarkTakenTodayMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: VidaMarkTakenTodayInput) => vidaItemsApi.markVidaItemTakenToday(input),
    onSuccess: (_data, variables) => {
      invalidateVidaTakenTodayQueries(queryClient, { date: variables.date })
      toast.success('Tomado hoy')
    },
  })
}

export function useUnmarkTakenTodayMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: VidaUnmarkTakenTodayInput) => vidaItemsApi.unmarkVidaItemTakenToday(input),
    onSuccess: (_data, variables) => {
      invalidateVidaTakenTodayQueries(queryClient, { date: variables.date })
      toast.success('Ya no está tomado')
    },
  })
}
