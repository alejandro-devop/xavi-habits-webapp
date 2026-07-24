import {
  LEARNING_NOTE_ADD_MUTATION,
  LEARNING_NOTE_EDIT_MUTATION,
  LEARNING_NOTE_QUERY,
  LEARNING_NOTE_REMOVE_MUTATION,
  LEARNING_NOTES_QUERY,
  LEARNING_TAG_ADD_MUTATION,
  LEARNING_TAGS_QUERY,
} from '@/features/learning/graphql/learning-notes.graphql'
import type {
  LearningNote,
  LearningNoteCollection,
  LearningNoteEditInput,
  LearningNoteInput,
  LearningNotesFilters,
  LearningTag,
  LearningTagInput,
} from '@/features/learning/types/learning-note.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

export async function getLearningNotes(
  filters: LearningNotesFilters = {},
): Promise<LearningNoteCollection> {
  const data = await graphqlRequest<{ learningNotes: LearningNoteCollection }, LearningNotesFilters>(
    LEARNING_NOTES_QUERY,
    filters,
  )
  return data.learningNotes
}

export async function getLearningNote(id: string): Promise<LearningNote | null> {
  const data = await graphqlRequest<{ learningNote: LearningNote | null }, { id: string }>(
    LEARNING_NOTE_QUERY,
    { id },
  )
  return data.learningNote
}

export async function getLearningTags(query?: string): Promise<LearningTag[]> {
  const data = await graphqlRequest<{ learningTags: LearningTag[] }, { query?: string }>(
    LEARNING_TAGS_QUERY,
    { query },
  )
  return data.learningTags
}

export async function createLearningNote(input: LearningNoteInput): Promise<LearningNote> {
  const data = await graphqlRequest<{ learningNoteAdd: LearningNote }, { input: LearningNoteInput }>(
    LEARNING_NOTE_ADD_MUTATION,
    { input },
  )
  return data.learningNoteAdd
}

export async function updateLearningNote(input: LearningNoteEditInput): Promise<LearningNote> {
  const data = await graphqlRequest<
    { learningNoteEdit: LearningNote },
    { input: LearningNoteEditInput }
  >(LEARNING_NOTE_EDIT_MUTATION, { input })
  return data.learningNoteEdit
}

export async function removeLearningNote(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ learningNoteRemove: boolean }, { id: string }>(
    LEARNING_NOTE_REMOVE_MUTATION,
    { id },
  )
  return data.learningNoteRemove
}

export async function createLearningTag(input: LearningTagInput): Promise<LearningTag> {
  const data = await graphqlRequest<{ learningTagAdd: LearningTag }, { input: LearningTagInput }>(
    LEARNING_TAG_ADD_MUTATION,
    { input },
  )
  return data.learningTagAdd
}
