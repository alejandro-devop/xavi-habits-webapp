import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import * as appIdeasApi from '@/features/app-ideas/api/app-ideas.api'
import type {
  AppIdea,
  AppIdeaCollection,
  AppIdeaEditInput,
  AppIdeaInput,
  AppIdeasFilters,
} from '@/features/app-ideas/types/app-idea.types'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { appIdeaKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

function useAuthReady() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}

type ListSnapshot = [readonly unknown[], AppIdeaCollection | undefined][]

function snapshotIdeaLists(qc: QueryClient): ListSnapshot {
  return qc.getQueriesData<AppIdeaCollection>({ queryKey: appIdeaKeys.lists() })
}

function restoreIdeaLists(qc: QueryClient, snapshot: ListSnapshot) {
  for (const [key, data] of snapshot) {
    qc.setQueryData(key, data)
  }
}

function isBaseListFilters(filters: Record<string, unknown> | undefined) {
  if (!filters) return true
  const search = typeof filters.search === 'string' ? filters.search.trim() : ''
  const status = typeof filters.status === 'string' ? filters.status : ''
  return !search && !status
}

function addIdeaToBaseLists(qc: QueryClient, idea: AppIdea) {
  const entries = qc.getQueriesData<AppIdeaCollection>({
    queryKey: appIdeaKeys.lists(),
  })
  for (const [key, old] of entries) {
    if (!old) continue
    const filters = (key[2] ?? {}) as Record<string, unknown>
    if (!isBaseListFilters(filters)) continue
    if (old.ideas.some((n) => n.id === idea.id)) continue
    qc.setQueryData(key, {
      ...old,
      ideas: [idea, ...old.ideas],
      total: old.total + 1,
    })
  }
}

function replaceIdeaIdInLists(qc: QueryClient, tempId: string, idea: AppIdea) {
  qc.setQueriesData<AppIdeaCollection>({ queryKey: appIdeaKeys.lists() }, (old) => {
    if (!old) return old
    if (!old.ideas.some((n) => n.id === tempId)) return old
    return {
      ...old,
      ideas: old.ideas.map((n) => (n.id === tempId ? idea : n)),
    }
  })
}

function patchIdeaInLists(qc: QueryClient, id: string, patch: Partial<AppIdea>) {
  qc.setQueriesData<AppIdeaCollection>({ queryKey: appIdeaKeys.lists() }, (old) => {
    if (!old) return old
    return {
      ...old,
      ideas: old.ideas.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }
  })
}

function removeIdeaFromLists(qc: QueryClient, id: string) {
  qc.setQueriesData<AppIdeaCollection>({ queryKey: appIdeaKeys.lists() }, (old) => {
    if (!old) return old
    if (!old.ideas.some((n) => n.id === id)) return old
    return {
      ...old,
      ideas: old.ideas.filter((n) => n.id !== id),
      total: Math.max(0, old.total - 1),
    }
  })
}

export function useAppIdeas(filters: AppIdeasFilters = {}) {
  const authReady = useAuthReady()
  return useQuery({
    queryKey: appIdeaKeys.list(filters as Record<string, unknown>),
    queryFn: () => appIdeasApi.getAppIdeas(filters),
    enabled: authReady,
  })
}

export function useAppIdea(id: string | undefined) {
  const authReady = useAuthReady()
  return useQuery({
    queryKey: appIdeaKeys.detail(id ?? ''),
    queryFn: () => appIdeasApi.getAppIdea(id!),
    enabled: authReady && Boolean(id) && !id!.startsWith('temp-'),
  })
}

export function useCreateAppIdea() {
  const qc = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: AppIdeaInput & { tempId: string }) => {
      const { tempId: _tempId, ...payload } = input
      return appIdeasApi.createAppIdea(payload)
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: appIdeaKeys.lists() })
      const previousLists = snapshotIdeaLists(qc)
      const now = new Date().toISOString()
      const optimistic: AppIdea = {
        id: input.tempId,
        userId: 0,
        title: input.title,
        contentMarkdown: input.contentMarkdown ?? '',
        status: input.status ?? 'draft',
        createdAt: now,
        updatedAt: now,
      }
      addIdeaToBaseLists(qc, optimistic)
      qc.setQueryData(appIdeaKeys.detail(input.tempId), optimistic)
      return { previousLists, tempId: input.tempId }
    },
    onError: (_err, _input, context) => {
      if (context?.previousLists) restoreIdeaLists(qc, context.previousLists)
      if (context?.tempId) qc.removeQueries({ queryKey: appIdeaKeys.detail(context.tempId) })
      toast.error('No se pudo crear la idea')
    },
    onSuccess: (idea, input) => {
      replaceIdeaIdInLists(qc, input.tempId, idea)
      qc.setQueryData(appIdeaKeys.detail(idea.id), idea)
      qc.removeQueries({ queryKey: appIdeaKeys.detail(input.tempId) })
      void qc.invalidateQueries({ queryKey: appIdeaKeys.lists() })
    },
  })
}

export function useUpdateAppIdea() {
  const qc = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: AppIdeaEditInput) => appIdeasApi.updateAppIdea(input),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: appIdeaKeys.lists() })
      await qc.cancelQueries({ queryKey: appIdeaKeys.detail(variables.id) })
      const previousLists = snapshotIdeaLists(qc)
      const previousDetail = qc.getQueryData<AppIdea>(appIdeaKeys.detail(variables.id))

      const patch: Partial<AppIdea> = { updatedAt: new Date().toISOString() }
      if (variables.title !== undefined) patch.title = variables.title
      if (variables.contentMarkdown !== undefined) patch.contentMarkdown = variables.contentMarkdown
      if (variables.status !== undefined) patch.status = variables.status

      patchIdeaInLists(qc, variables.id, patch)
      qc.setQueryData<AppIdea>(appIdeaKeys.detail(variables.id), (old) =>
        old ? { ...old, ...patch } : old,
      )

      return { previousLists, previousDetail }
    },
    onError: (_err, variables, context) => {
      if (context?.previousLists) restoreIdeaLists(qc, context.previousLists)
      if (context?.previousDetail) {
        qc.setQueryData(appIdeaKeys.detail(variables.id), context.previousDetail)
      }
      toast.error('No se pudo actualizar la idea')
    },
    onSuccess: (idea) => {
      patchIdeaInLists(qc, idea.id, idea)
      qc.setQueryData(appIdeaKeys.detail(idea.id), idea)
    },
  })
}

export function useRemoveAppIdea() {
  const qc = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => appIdeasApi.removeAppIdea(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: appIdeaKeys.lists() })
      const previousLists = snapshotIdeaLists(qc)
      const previousDetail = qc.getQueryData<AppIdea>(appIdeaKeys.detail(id))
      removeIdeaFromLists(qc, id)
      qc.removeQueries({ queryKey: appIdeaKeys.detail(id) })
      return { previousLists, previousDetail, id }
    },
    onError: (_err, id, context) => {
      if (context?.previousLists) restoreIdeaLists(qc, context.previousLists)
      if (context?.previousDetail) {
        qc.setQueryData(appIdeaKeys.detail(id), context.previousDetail)
      }
      toast.error('No se pudo eliminar la idea')
    },
  })
}
