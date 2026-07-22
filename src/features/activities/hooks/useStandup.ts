import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as standupApi from '@/features/activities/api/standup.api'
import type {
  StandupItemCreateInput,
  StandupItemUpdateInput,
  StandupMemberCreateInput,
  StandupMemberUpdateInput,
} from '@/features/activities/types/standup.types'
import { getActivityErrorMessage } from '@/features/activities/utils/activity.errors'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { standupKeys, todoKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

function useAuthReady() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}

function invalidateDay(queryClient: ReturnType<typeof useQueryClient>, date: string) {
  void queryClient.invalidateQueries({ queryKey: standupKeys.day(date) })
  void queryClient.invalidateQueries({ queryKey: standupKeys.summary(date) })
}

export function useStandupMembersQuery(includeInactive = false) {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: standupKeys.members(includeInactive),
    queryFn: () => standupApi.getStandupMembers(includeInactive),
    enabled,
    staleTime: 1000 * 60,
  })
}

export function useStandupDayQuery(date: string) {
  const enabled = useAuthReady() && Boolean(date)
  return useQuery({
    queryKey: standupKeys.day(date),
    queryFn: () => standupApi.getStandupDay(date),
    enabled,
    staleTime: 1000 * 20,
  })
}

export function useStandupDaySummaryQuery(date: string, enabledExtra = false) {
  const enabled = useAuthReady() && Boolean(date) && enabledExtra
  return useQuery({
    queryKey: standupKeys.summary(date),
    queryFn: () => standupApi.getStandupDaySummary(date),
    enabled,
    staleTime: 1000 * 10,
  })
}

export function useCreateStandupMemberMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: StandupMemberCreateInput) => standupApi.createStandupMember(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: standupKeys.membersRoot() })
      toast.success('Responsable añadido')
    },
    onError: (error) => toast.error(getActivityErrorMessage(error)),
  })
}

export function useUpdateStandupMemberMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: StandupMemberUpdateInput) => standupApi.updateStandupMember(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: standupKeys.membersRoot() })
      toast.success('Responsable actualizado')
    },
    onError: (error) => toast.error(getActivityErrorMessage(error)),
  })
}

export function useDeleteStandupMemberMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => standupApi.deleteStandupMember(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: standupKeys.membersRoot() })
      toast.success('Responsable eliminado')
    },
    onError: (error) => toast.error(getActivityErrorMessage(error)),
  })
}

export function useOpenStandupDayMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (date: string) => standupApi.openStandupDay(date),
    onSuccess: (data, date) => {
      queryClient.setQueryData(standupKeys.day(date), data)
      toast.success('Día abierto')
    },
    onError: (error) => toast.error(getActivityErrorMessage(error)),
  })
}

export function useCloseStandupDayMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (date: string) => standupApi.closeStandupDay(date),
    onSuccess: (_data, date) => {
      invalidateDay(queryClient, date)
      toast.success('Día cerrado')
    },
    onError: (error) => toast.error(getActivityErrorMessage(error)),
  })
}

export function useCarryOverStandupItemsMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ date, itemIds }: { date: string; itemIds: string[] }) =>
      standupApi.carryOverStandupItems(date, itemIds),
    onSuccess: (_data, { date }) => {
      invalidateDay(queryClient, date)
      toast.success('Ítems arrastrados de ayer')
    },
    onError: (error) => toast.error(getActivityErrorMessage(error)),
  })
}

export function useCreateStandupItemMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: StandupItemCreateInput) => standupApi.createStandupItem(input),
    onSuccess: (_data, input) => {
      invalidateDay(queryClient, input.date)
      toast.success('Entrada creada')
    },
    onError: (error) => toast.error(getActivityErrorMessage(error)),
  })
}

export function useUpdateStandupItemMutation(date: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: StandupItemUpdateInput) => standupApi.updateStandupItem(input),
    onSuccess: () => {
      invalidateDay(queryClient, date)
      toast.success('Entrada actualizada')
    },
    onError: (error) => toast.error(getActivityErrorMessage(error)),
  })
}

export function useDeleteStandupItemMutation(date: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => standupApi.deleteStandupItem(id),
    onSuccess: () => {
      invalidateDay(queryClient, date)
      toast.success('Entrada eliminada')
    },
    onError: (error) => toast.error(getActivityErrorMessage(error)),
  })
}

export function useCreateTodoFromStandupItemMutation(date: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (itemId: string) => standupApi.createTodoFromStandupItem(itemId),
    onSuccess: () => {
      invalidateDay(queryClient, date)
      void queryClient.invalidateQueries({ queryKey: todoKeys.all })
      toast.success('Tarea creada en la carpeta configurada')
    },
    onError: (error) => toast.error(getActivityErrorMessage(error)),
  })
}
