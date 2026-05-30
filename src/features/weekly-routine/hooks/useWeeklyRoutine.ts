import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/weekly-routine/api/weekly-routine.api'
import type {
  WeeklyRoutineActivityBatchInput,
  WeeklyRoutineActivityEditInput,
  WeeklyRoutineActivityInput,
  WeeklyRoutineEditInput,
  WeeklyRoutineInput,
} from '@/features/weekly-routine/types/weekly-routine.types'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { weeklyRoutineKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

function useReadyAuth() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function useWeeklyRoutinesQuery(params: api.ListWeeklyRoutinesParams = {}) {
  const enabled = useReadyAuth()
  return useQuery({
    queryKey: weeklyRoutineKeys.list(params),
    enabled,
    queryFn: () => api.getWeeklyRoutines(params),
    staleTime: 1000 * 30,
  })
}

export function useWeeklyRoutineQuery(id: string | undefined) {
  const enabled = useReadyAuth()
  return useQuery({
    queryKey: weeklyRoutineKeys.detail(id ?? ''),
    enabled: enabled && Boolean(id),
    queryFn: () => api.getWeeklyRoutine(id!),
    staleTime: 1000 * 30,
  })
}

export function useActiveWeeklyRoutineQuery() {
  const enabled = useReadyAuth()
  return useQuery({
    queryKey: weeklyRoutineKeys.active(),
    enabled,
    queryFn: api.getActiveWeeklyRoutine,
    staleTime: 1000 * 30,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateWeeklyRoutineMutation() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: WeeklyRoutineInput) => api.createWeeklyRoutine(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: weeklyRoutineKeys.all })
      toast.success('Rutina creada')
    },
    onError: () => toast.error('No se pudo crear la rutina'),
  })
}

export function useUpdateWeeklyRoutineMutation() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: WeeklyRoutineEditInput) => api.updateWeeklyRoutine(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: weeklyRoutineKeys.all })
      toast.success('Rutina actualizada')
    },
    onError: () => toast.error('No se pudo actualizar la rutina'),
  })
}

export function useRemoveWeeklyRoutineMutation() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => api.removeWeeklyRoutine(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: weeklyRoutineKeys.all })
      toast.success('Rutina eliminada')
    },
    onError: () => toast.error('No se pudo eliminar la rutina'),
  })
}

export function useSetActiveWeeklyRoutineMutation() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => api.setWeeklyRoutineActive(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: weeklyRoutineKeys.all })
      toast.success('Rutina activada')
    },
    onError: () => toast.error('No se pudo activar la rutina'),
  })
}

export function useAddWeeklyRoutineActivityMutation() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: WeeklyRoutineActivityInput) => api.addWeeklyRoutineActivity(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: weeklyRoutineKeys.all })
    },
    onError: () => toast.error('No se pudo agregar la actividad'),
  })
}

export function useAddWeeklyRoutineActivitiesBatchMutation() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: WeeklyRoutineActivityBatchInput) => api.addWeeklyRoutineActivitiesBatch(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: weeklyRoutineKeys.all })
    },
    onError: () => toast.error('No se pudo agregar las actividades'),
  })
}

export function useUpdateWeeklyRoutineActivityMutation() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: WeeklyRoutineActivityEditInput) => api.updateWeeklyRoutineActivity(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: weeklyRoutineKeys.all })
    },
    onError: () => toast.error('No se pudo actualizar la actividad'),
  })
}

export function useRemoveWeeklyRoutineActivityMutation() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => api.removeWeeklyRoutineActivity(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: weeklyRoutineKeys.all })
      toast.success('Evento eliminado')
    },
    onError: () => toast.error('No se pudo eliminar el evento'),
  })
}
