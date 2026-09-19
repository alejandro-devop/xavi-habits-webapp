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
import { vidaKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

/**
 * La plantilla Vida y lo tomado de ella. Ninguna pantalla consume esto todavía
 * (F0): existe para que F1–F5 no lo improvisen.
 *
 * `VidaItemCreateInput.clientId` (UUID v7, idempotencia offline) existe en el
 * esquema y **ningún hook lo genera**: la web es el piloto y no hay modo
 * offline. Cuando lo haya, se emite aquí, no en el `api`.
 */
export function useVidaItemsQuery(includeInactive = false) {
  const enabled = useVidaQueryGuard()
  return useQuery({
    queryKey: vidaKeys.items.list(includeInactive),
    enabled,
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
