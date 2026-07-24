import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { LearningNoteCard } from '@/features/learning/components/LearningNoteCard'
import { LearningNotesFilters } from '@/features/learning/components/LearningNotesFilters'
import { useLearningNotes, useLearningTags } from '@/features/learning/hooks/useLearningNotes'
import { learningPaths } from '@/features/learning/routes/learning-paths'
import type { LearningNotesFilters as Filters } from '@/features/learning/types/learning-note.types'
import { Button, EmptyState, PageHeader } from '@/shared/ui'
import styles from './LearningPage.module.scss'

const SEARCH_DEBOUNCE_MS = 350

export function LearningPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 })

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchInput.trim() || undefined,
        page: 1,
      }))
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [searchInput])

  const { data: collection, isLoading } = useLearningNotes(filters)
  const { data: tags = [] } = useLearningTags()

  const total = collection?.total ?? 0
  const page = collection?.page ?? filters.page ?? 1
  const limit = collection?.limit ?? filters.limit ?? 20
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <section className={styles.page}>
      <PageHeader
        title="Learning"
        subtitle="Base de conocimiento · búsqueda por texto y tags"
        hideSubtitleOnMobile
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(learningPaths.new)}>
            + Nueva nota
          </Button>
        }
      />

      <div className={styles.filters}>
        <LearningNotesFilters
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          filters={filters}
          onChange={setFilters}
          availableTags={tags}
        />
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.loading}>Cargando notas…</div>
        ) : (collection?.notes.length ?? 0) === 0 ? (
          <EmptyState
            title="Sin notas todavía"
            description="Crea tu primera nota de conocimiento para empezar a buscar por texto y tags."
            action={
              <Button variant="primary" size="sm" onClick={() => navigate(learningPaths.new)}>
                Nueva nota
              </Button>
            }
          />
        ) : (
          collection?.notes.map((note) => <LearningNoteCard key={note.id} note={note} />)
        )}
      </div>

      {totalPages > 1 ? (
        <div className={styles.pager}>
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: page - 1 }))}
          >
            Anterior
          </Button>
          <span className={styles.loading}>
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: page + 1 }))}
          >
            Siguiente
          </Button>
        </div>
      ) : null}
    </section>
  )
}
