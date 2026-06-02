import {
  NOTE_ADD_MUTATION,
  NOTE_EDIT_MUTATION,
  NOTE_QUERY,
  NOTE_REMOVE_MUTATION,
  NOTES_QUERY,
} from '@/features/notes/graphql/notes.graphql'
import type {
  Note,
  NoteCollection,
  NoteEditInput,
  NoteInput,
  NotesFilters,
} from '@/features/notes/types/note.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

export async function getNotes(filters: NotesFilters = {}): Promise<NoteCollection> {
  const data = await graphqlRequest<{ notes: NoteCollection }, NotesFilters>(NOTES_QUERY, filters)
  return data.notes
}

export async function getNote(id: string): Promise<Note | null> {
  const data = await graphqlRequest<{ note: Note | null }, { id: string }>(NOTE_QUERY, { id })
  return data.note
}

export async function createNote(input: NoteInput): Promise<Note> {
  const data = await graphqlRequest<{ noteAdd: Note }, { input: NoteInput }>(NOTE_ADD_MUTATION, { input })
  return data.noteAdd
}

export async function updateNote(input: NoteEditInput): Promise<Note> {
  const data = await graphqlRequest<{ noteEdit: Note }, { input: NoteEditInput }>(NOTE_EDIT_MUTATION, { input })
  return data.noteEdit
}

export async function removeNote(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ noteRemove: boolean }, { id: string }>(NOTE_REMOVE_MUTATION, { id })
  return data.noteRemove
}
