import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { LearningNoteEditor } from '@/features/learning/components/LearningNoteEditor'
import { useLearningNote, useLearningTags } from '@/features/learning/hooks/useLearningNotes'
import type { LearningNote } from '@/features/learning/types/learning-note.types'
import { learningKeys } from '@/shared/api/query-keys'
import { EmptyState, Spinner } from '@/shared/ui'
import styles from './LearningNoteEditorPage.module.scss'

export function LearningNoteEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { noteId } = useParams()
  const qc = useQueryClient()
  const { data: tags = [] } = useLearningTags()

  const cachedTemp =
    noteId?.startsWith('temp-')
      ? qc.getQueryData<LearningNote>(learningKeys.notes.detail(noteId))
      : undefined

  const { data: note, isLoading, isError } = useLearningNote(
    mode === 'edit' && noteId && !noteId.startsWith('temp-') ? noteId : undefined,
  )

  if (mode === 'create') {
    return <LearningNoteEditor mode="create" availableTags={tags} />
  }

  if (noteId?.startsWith('temp-')) {
    if (!cachedTemp) {
      return (
        <div className={styles.center}>
          <EmptyState title="Nota temporal no encontrada" description="Vuelve al listado e inténtalo de nuevo." />
        </div>
      )
    }
    return (
      <LearningNoteEditor
        key={cachedTemp.id}
        mode="edit"
        note={cachedTemp}
        availableTags={tags}
      />
    )
  }

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner />
      </div>
    )
  }

  if (isError || !note) {
    return (
      <div className={styles.center}>
        <EmptyState title="Nota no encontrada" description="Puede que se haya eliminado o no tengas acceso." />
      </div>
    )
  }

  return <LearningNoteEditor key={note.id} mode="edit" note={note} availableTags={tags} />
}
