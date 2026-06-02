import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as quartersApi from '@/features/quarters/api/quarters.api'
import type {
  ProjectAddInput,
  ProjectEditInput,
  ObjectiveAddInput,
  ObjectiveEditInput,
  QuarterAddInput,
  QuarterEditInput,
  QuarterCompleteInput,
  QuarterProjectAddInput,
  QuarterProjectEditInput,
  SessionLogAddInput,
  SessionLogEditInput,
  WeekScheduleSlotAddInput,
  WeekScheduleSlotEditInput,
} from '@/features/quarters/types/quarter.types'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { quarterKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

function useAuthReady() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useProjectsQuery() {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: quarterKeys.projects.list(),
    enabled,
    queryFn: () => quartersApi.getProjects(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useProjectQuery(id: string | undefined) {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: quarterKeys.projects.detail(id ?? ''),
    enabled: enabled && Boolean(id),
    queryFn: () => quartersApi.getProject(id!),
    staleTime: 1000 * 60 * 3,
  })
}

export function useQuartersQuery() {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: quarterKeys.list(),
    enabled,
    queryFn: () => quartersApi.getQuarters(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useQuarterQuery(id: string | undefined) {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: quarterKeys.detail(id ?? ''),
    enabled: enabled && Boolean(id),
    queryFn: () => quartersApi.getQuarter(id!),
    staleTime: 1000 * 60 * 3,
  })
}

export function useActiveQuarterQuery() {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: quarterKeys.active(),
    enabled,
    queryFn: () => quartersApi.getActiveQuarter(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useSessionLogsQuery(quarterId: string | undefined, projectId?: string) {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: quarterKeys.sessionLogs.byQuarter(quarterId ?? '', projectId),
    enabled: enabled && Boolean(quarterId),
    queryFn: () => quartersApi.getSessionLogs(quarterId!, projectId),
    staleTime: 1000 * 60 * 2,
  })
}

export function useProjectSessionLogsQuery(projectId: string | undefined) {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: quarterKeys.sessionLogs.byProject(projectId ?? ''),
    enabled: enabled && Boolean(projectId),
    queryFn: () => quartersApi.getProjectSessionLogs(projectId!),
    staleTime: 1000 * 60 * 2,
  })
}

// ─── Project mutations ────────────────────────────────────────────────────────

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: ProjectAddInput) => quartersApi.createProject(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.projects.list() })
    },
    onError: () => toast.error('No se pudo crear el proyecto'),
  })
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: ProjectEditInput) => quartersApi.updateProject(input),
    onSuccess: (data) => {
      queryClient.setQueryData(quarterKeys.projects.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: quarterKeys.projects.list() })
    },
    onError: () => toast.error('No se pudo actualizar el proyecto'),
  })
}

export function useRemoveProjectMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => quartersApi.removeProject(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: quarterKeys.projects.detail(id) })
      void queryClient.invalidateQueries({ queryKey: quarterKeys.projects.list() })
      toast.success('Proyecto eliminado')
    },
    onError: () => toast.error('No se pudo eliminar el proyecto'),
  })
}

// ─── Objective mutations ──────────────────────────────────────────────────────

export function useAddObjectiveMutation(projectId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: ObjectiveAddInput) => quartersApi.addObjective(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.projects.detail(projectId) })
    },
    onError: () => toast.error('No se pudo añadir el objetivo'),
  })
}

export function useUpdateObjectiveMutation(projectId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: ObjectiveEditInput) => quartersApi.updateObjective(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.projects.detail(projectId) })
    },
    onError: () => toast.error('No se pudo actualizar el objetivo'),
  })
}

export function useRemoveObjectiveMutation(projectId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => quartersApi.removeObjective(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.projects.detail(projectId) })
      toast.success('Objetivo eliminado')
    },
    onError: () => toast.error('No se pudo eliminar el objetivo'),
  })
}

// ─── Quarter mutations ────────────────────────────────────────────────────────

export function useCreateQuarterMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: QuarterAddInput) => quartersApi.createQuarter(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.list() })
    },
    onError: () => toast.error('No se pudo crear el quarter'),
  })
}

export function useUpdateQuarterMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: QuarterEditInput) => quartersApi.updateQuarter(input),
    onSuccess: (data) => {
      queryClient.setQueryData(quarterKeys.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: quarterKeys.list() })
    },
    onError: () => toast.error('No se pudo actualizar el quarter'),
  })
}

export function useActivateQuarterMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => quartersApi.activateQuarter(id),
    onSuccess: (data) => {
      queryClient.setQueryData(quarterKeys.active(), data)
      void queryClient.invalidateQueries({ queryKey: quarterKeys.list() })
      toast.success('Quarter activado')
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo activar el quarter'),
  })
}

export function useCompleteQuarterMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: QuarterCompleteInput) => quartersApi.completeQuarter(input),
    onSuccess: () => {
      queryClient.setQueryData(quarterKeys.active(), null)
      void queryClient.invalidateQueries({ queryKey: quarterKeys.list() })
      toast.success('Quarter completado')
    },
    onError: () => toast.error('No se pudo completar el quarter'),
  })
}

// ─── Quarter project mutations ────────────────────────────────────────────────

export function useAddProjectToQuarterMutation(quarterId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: QuarterProjectAddInput) => quartersApi.addProjectToQuarter(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.detail(quarterId) })
      void queryClient.invalidateQueries({ queryKey: quarterKeys.active() })
    },
    onError: () => toast.error('No se pudo añadir el proyecto al quarter'),
  })
}

export function useUpdateQuarterProjectMutation(quarterId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: QuarterProjectEditInput) => quartersApi.updateQuarterProject(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.detail(quarterId) })
      void queryClient.invalidateQueries({ queryKey: quarterKeys.active() })
    },
    onError: () => toast.error('No se pudo actualizar las horas del proyecto'),
  })
}

export function useRemoveProjectFromQuarterMutation(quarterId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => quartersApi.removeProjectFromQuarter(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.detail(quarterId) })
      void queryClient.invalidateQueries({ queryKey: quarterKeys.active() })
      toast.success('Proyecto removido del quarter')
    },
    onError: () => toast.error('No se pudo remover el proyecto del quarter'),
  })
}

// ─── Session log mutations ────────────────────────────────────────────────────

export function useCreateSessionLogMutation(quarterId: string, projectId?: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: SessionLogAddInput) => quartersApi.createSessionLog(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: quarterKeys.sessionLogs.byQuarter(quarterId, projectId),
      })
      void queryClient.invalidateQueries({
        queryKey: quarterKeys.sessionLogs.byProject(data.projectId),
      })
    },
    onError: () => toast.error('No se pudo guardar el log'),
  })
}

export function useUpdateSessionLogMutation(quarterId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: SessionLogEditInput) => quartersApi.updateSessionLog(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: quarterKeys.sessionLogs.byQuarter(quarterId),
      })
      void queryClient.invalidateQueries({
        queryKey: quarterKeys.sessionLogs.byProject(data.projectId),
      })
    },
    onError: () => toast.error('No se pudo actualizar el log'),
  })
}

export function useDeleteSessionLogMutation(quarterId: string, projectId?: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ id, logProjectId }: { id: string; logProjectId: string }) =>
      quartersApi.deleteSessionLog(id).then((res) => ({ res, logProjectId })),
    onSuccess: ({ logProjectId }) => {
      void queryClient.invalidateQueries({
        queryKey: quarterKeys.sessionLogs.byQuarter(quarterId, projectId),
      })
      void queryClient.invalidateQueries({
        queryKey: quarterKeys.sessionLogs.byProject(logProjectId),
      })
      toast.success('Log eliminado')
    },
    onError: () => toast.error('No se pudo eliminar el log'),
  })
}

// ─── Week Schedule Slot hooks ─────────────────────────────────────────────────

export function useWeekScheduleSlotsQuery(quarterId: string | undefined) {
  const enabled = useAuthReady()
  return useQuery({
    queryKey: quarterKeys.weekSchedule.byQuarter(quarterId ?? ''),
    enabled: enabled && Boolean(quarterId),
    queryFn: () => quartersApi.getWeekScheduleSlots(quarterId!),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateWeekScheduleSlotMutation(quarterId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: WeekScheduleSlotAddInput) => quartersApi.createWeekScheduleSlot(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.weekSchedule.byQuarter(quarterId) })
    },
    onError: () => toast.error('No se pudo crear el slot'),
  })
}

export function useUpdateWeekScheduleSlotMutation(quarterId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: WeekScheduleSlotEditInput) => quartersApi.updateWeekScheduleSlot(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.weekSchedule.byQuarter(quarterId) })
    },
    onError: () => toast.error('No se pudo actualizar el slot'),
  })
}

export function useDeleteWeekScheduleSlotMutation(quarterId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => quartersApi.deleteWeekScheduleSlot(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quarterKeys.weekSchedule.byQuarter(quarterId) })
      toast.success('Slot eliminado')
    },
    onError: () => toast.error('No se pudo eliminar el slot'),
  })
}
