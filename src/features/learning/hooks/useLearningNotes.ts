import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import * as learningNotesApi from '@/features/learning/api/learning-notes.api'
import type {
  LearningNote,
  LearningNoteCollection,
  LearningNoteEditInput,
  LearningNoteInput,
  LearningNotesFilters,
  LearningTag,
} from '@/features/learning/types/learning-note.types'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { learningKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

function useAuthReady() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}

type ListSnapshot = [readonly unknown[], LearningNoteCollection | undefined][]

function snapshotNoteLists(qc: QueryClient): ListSnapshot {
  return qc.getQueriesData<LearningNoteCollection>({ queryKey: learningKeys.notes.lists() })
}

function restoreNoteLists(qc: QueryClient, snapshot: ListSnapshot) {
  for (const [key, data] of snapshot) {
    qc.setQueryData(key, data)
  }
}

function isBaseListFilters(filters: Record<string, unknown> | undefined) {
  if (!filters) return true
  const search = typeof filters.search === 'string' ? filters.search.trim() : ''
  const tags = Array.isArray(filters.tags) ? filters.tags : []
  return !search && tags.length === 0
}

function addNoteToBaseLists(qc: QueryClient, note: LearningNote) {
  const entries = qc.getQueriesData<LearningNoteCollection>({
    queryKey: learningKeys.notes.lists(),
  })
  for (const [key, old] of entries) {
    if (!old) continue
    const filters = (key[3] ?? {}) as Record<string, unknown>
    if (!isBaseListFilters(filters)) continue
    if (old.notes.some((n) => n.id === note.id)) continue
    qc.setQueryData(key, {
      ...old,
      notes: [note, ...old.notes],
      total: old.total + 1,
    })
  }
}

function replaceNoteIdInLists(qc: QueryClient, tempId: string, note: LearningNote) {
  qc.setQueriesData<LearningNoteCollection>({ queryKey: learningKeys.notes.lists() }, (old) => {
    if (!old) return old
    if (!old.notes.some((n) => n.id === tempId)) return old
    return {
      ...old,
      notes: old.notes.map((n) => (n.id === tempId ? note : n)),
    }
  })
}

function patchNoteInLists(qc: QueryClient, id: string, patch: Partial<LearningNote>) {
  qc.setQueriesData<LearningNoteCollection>({ queryKey: learningKeys.notes.lists() }, (old) => {
    if (!old) return old
    return {
      ...old,
      notes: old.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }
  })
}

function removeNoteFromLists(qc: QueryClient, id: string) {
  qc.setQueriesData<LearningNoteCollection>({ queryKey: learningKeys.notes.lists() }, (old) => {
    if (!old) return old
    if (!old.notes.some((n) => n.id === id)) return old
    return {
      ...old,
      notes: old.notes.filter((n) => n.id !== id),
      total: Math.max(0, old.total - 1),
    }
  })
}

function addTagToLists(qc: QueryClient, tag: LearningTag) {
  qc.setQueriesData<LearningTag[]>({ queryKey: learningKeys.tags.all() }, (old) => {
    if (!old) return old
    if (old.some((t) => t.id === tag.id || t.slug === tag.slug)) {
      return old.map((t) => (t.id === tag.id || t.slug === tag.slug ? tag : t))
    }
    return [...old, tag].sort((a, b) => a.name.localeCompare(b.name))
  })
}

export function useLearningNotes(filters: LearningNotesFilters = {}) {
  const authReady = useAuthReady()
  return useQuery({
    queryKey: learningKeys.notes.list(filters as Record<string, unknown>),
    queryFn: () => learningNotesApi.getLearningNotes(filters),
    enabled: authReady,
  })
}

export function useLearningNote(id: string | undefined) {
  const authReady = useAuthReady()
  return useQuery({
    queryKey: learningKeys.notes.detail(id ?? ''),
    queryFn: () => learningNotesApi.getLearningNote(id!),
    enabled: authReady && Boolean(id) && !id!.startsWith('temp-'),
  })
}

export function useLearningTags(query = '') {
  const authReady = useAuthReady()
  return useQuery({
    queryKey: learningKeys.tags.list(query),
    queryFn: () => learningNotesApi.getLearningTags(query || undefined),
    enabled: authReady,
    staleTime: 60_000,
  })
}

export function useCreateLearningNote() {
  const qc = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: LearningNoteInput & { tempId: string }) => {
      const { tempId: _tempId, ...payload } = input
      return learningNotesApi.createLearningNote(payload)
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: learningKeys.notes.lists() })
      const previousLists = snapshotNoteLists(qc)
      const now = new Date().toISOString()
      const optimistic: LearningNote = {
        id: input.tempId,
        userId: 0,
        title: input.title,
        contentMarkdown: input.contentMarkdown ?? '',
        tags: [],
        createdAt: now,
        updatedAt: now,
      }
      addNoteToBaseLists(qc, optimistic)
      qc.setQueryData(learningKeys.notes.detail(input.tempId), optimistic)
      return { previousLists, tempId: input.tempId }
    },
    onError: (_err, _input, context) => {
      if (context?.previousLists) restoreNoteLists(qc, context.previousLists)
      if (context?.tempId) qc.removeQueries({ queryKey: learningKeys.notes.detail(context.tempId) })
      toast.error('No se pudo crear la nota')
    },
    onSuccess: (note, input) => {
      replaceNoteIdInLists(qc, input.tempId, note)
      qc.setQueryData(learningKeys.notes.detail(note.id), note)
      qc.removeQueries({ queryKey: learningKeys.notes.detail(input.tempId) })
      void qc.invalidateQueries({ queryKey: learningKeys.notes.lists() })
    },
  })
}

export function useUpdateLearningNote() {
  const qc = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: LearningNoteEditInput & { tags?: LearningTag[] }) => {
      const { tags: _tags, ...payload } = input
      return learningNotesApi.updateLearningNote(payload)
    },
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: learningKeys.notes.lists() })
      await qc.cancelQueries({ queryKey: learningKeys.notes.detail(variables.id) })
      const previousLists = snapshotNoteLists(qc)
      const previousDetail = qc.getQueryData<LearningNote>(learningKeys.notes.detail(variables.id))

      const patch: Partial<LearningNote> = { updatedAt: new Date().toISOString() }
      if (variables.title !== undefined) patch.title = variables.title
      if (variables.contentMarkdown !== undefined) patch.contentMarkdown = variables.contentMarkdown
      if (variables.tags !== undefined) patch.tags = variables.tags

      patchNoteInLists(qc, variables.id, patch)
      qc.setQueryData<LearningNote>(learningKeys.notes.detail(variables.id), (old) =>
        old ? { ...old, ...patch } : old,
      )

      return { previousLists, previousDetail }
    },
    onError: (_err, variables, context) => {
      if (context?.previousLists) restoreNoteLists(qc, context.previousLists)
      if (context?.previousDetail) {
        qc.setQueryData(learningKeys.notes.detail(variables.id), context.previousDetail)
      }
      toast.error('No se pudo actualizar la nota')
    },
    onSuccess: (note) => {
      patchNoteInLists(qc, note.id, note)
      qc.setQueryData(learningKeys.notes.detail(note.id), note)
    },
  })
}

export function useRemoveLearningNote() {
  const qc = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => learningNotesApi.removeLearningNote(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: learningKeys.notes.lists() })
      const previousLists = snapshotNoteLists(qc)
      const previousDetail = qc.getQueryData<LearningNote>(learningKeys.notes.detail(id))
      removeNoteFromLists(qc, id)
      qc.removeQueries({ queryKey: learningKeys.notes.detail(id) })
      return { previousLists, previousDetail, id }
    },
    onError: (_err, id, context) => {
      if (context?.previousLists) restoreNoteLists(qc, context.previousLists)
      if (context?.previousDetail) {
        qc.setQueryData(learningKeys.notes.detail(id), context.previousDetail)
      }
      toast.error('No se pudo eliminar la nota')
    },
  })
}

export function useCreateLearningTag() {
  const qc = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (input: { name: string; tempId?: string }) =>
      learningNotesApi.createLearningTag({ name: input.name }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: learningKeys.tags.all() })
      const previous = qc.getQueriesData<LearningTag[]>({ queryKey: learningKeys.tags.all() })
      if (input.tempId) {
        const optimistic: LearningTag = {
          id: input.tempId,
          name: input.name.trim(),
          slug: input.name
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{M}/gu, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
        }
        addTagToLists(qc, optimistic)
      }
      return { previous }
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          qc.setQueryData(key, data)
        }
      }
      toast.error('No se pudo crear la etiqueta')
    },
    onSuccess: (tag) => {
      addTagToLists(qc, tag)
      void qc.invalidateQueries({ queryKey: learningKeys.tags.all() })
    },
  })
}
