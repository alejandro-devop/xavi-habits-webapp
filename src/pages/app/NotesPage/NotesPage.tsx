import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui'
import { NotesFeed } from '@/features/notes/components/NotesFeed/NotesFeed'
import { NoteCapture } from '@/features/notes/components/NoteCapture/NoteCapture'
import { NotesFilters } from '@/features/notes/components/NotesFilters/NotesFilters'
import { useNotes } from '@/features/notes/hooks/useNotes'
import { useTodoTagsQuery } from '@/features/todos/hooks/useTodos'
import type { NotesFilters as Filters } from '@/features/notes/types/note.types'
import styles from './NotesPage.module.scss'

export function NotesPage() {
  const [captureOpen, setCaptureOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({})

  const { data: collection, isLoading } = useNotes(filters)
  const { data: tags = [] } = useTodoTagsQuery()

  const openCapture = useCallback(() => setCaptureOpen(true), [])
  const closeCapture = useCallback(() => setCaptureOpen(false), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'n') {
        e.preventDefault()
        openCapture()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openCapture])

  return (
    <section className={styles.page}>
      <PageHeader
        title="Notas"
        subtitle="Tu bitácora de trabajo · ⌘⇧N para captura rápida"
        hideSubtitleOnMobile
        actions={
          <Button variant="primary" size="sm" onClick={openCapture}>
            + Nueva nota
          </Button>
        }
      />

      {tags.length > 0 && (
        <div className={styles.filters}>
          <NotesFilters filters={filters} onChange={setFilters} availableTags={tags} />
        </div>
      )}

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>Cargando notas…</div>
        ) : (
          <NotesFeed notes={collection?.notes ?? []} availableTags={tags} />
        )}
      </div>

      <NoteCapture open={captureOpen} onClose={closeCapture} availableTags={tags} />
    </section>
  )
}
