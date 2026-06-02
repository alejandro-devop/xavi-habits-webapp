import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as notesApi from '@/features/notes/api/notes.api'
import type { Note, NoteCollection, NoteEditInput, NoteInput, NotesFilters } from '@/features/notes/types/note.types'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { noteKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

function useAuthReady() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}

type QC = ReturnType<typeof useQueryClient>

function addNoteToLists(qc: QC, note: Note) {
  qc.setQueriesData<NoteCollection>({ queryKey: noteKeys.lists() }, (old) => {
    if (!old) return old
    if (old.notes.some((n) => n.id === note.id)) return old
    return { ...old, notes: [note, ...old.notes], total: old.total + 1 }
  })
}

function patchNoteInLists(qc: QC, id: string, patch: Partial<Note>) {
  qc.setQueriesData<NoteCollection>({ queryKey: noteKeys.lists() }, (old) => {
    if (!old) return old
    return { ...old, notes: old.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }
  })
}

function removeNoteFromLists(qc: QC, id: string) {
  qc.setQueriesData<NoteCollection>({ queryKey: noteKeys.lists() }, (old) => {
    if (!old) return old
    return { ...old, notes: old.notes.filter((n) => n.id !== id), total: old.total - 1 }
  })
}

export function useNotes(filters: NotesFilters = {}) {
  const authReady = useAuthReady()
  return useQuery({
    queryKey: noteKeys.list(filters),
    queryFn: () => notesApi.getNotes(filters),
    enabled: authReady,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (input: NoteInput) => notesApi.createNote(input),
    onSuccess: (note) => {
      addNoteToLists(qc, note)
      qc.setQueryData(noteKeys.detail(note.id), note)
    },
    onError: () => showToast({ message: 'Error al crear la nota', type: 'error' }),
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (input: NoteEditInput) => notesApi.updateNote(input),
    onSuccess: (note) => {
      patchNoteInLists(qc, note.id, note)
      qc.setQueryData(noteKeys.detail(note.id), note)
    },
    onError: () => showToast({ message: 'Error al actualizar la nota', type: 'error' }),
  })
}

export function useRemoveNote() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (id: string) => notesApi.removeNote(id),
    onSuccess: (_, id) => {
      removeNoteFromLists(qc, id)
      qc.removeQueries({ queryKey: noteKeys.detail(id) })
    },
    onError: () => showToast({ message: 'Error al eliminar la nota', type: 'error' }),
  })
}
