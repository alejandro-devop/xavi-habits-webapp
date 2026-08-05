import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { AppIdeaCard } from '@/features/app-ideas/components/AppIdeaCard'
import { AppIdeasFilters } from '@/features/app-ideas/components/AppIdeasFilters'
import { useAppIdeas } from '@/features/app-ideas/hooks/useAppIdeas'
import { appIdeasPaths } from '@/features/app-ideas/routes/app-ideas-paths'
import type { AppIdeasFilters as Filters } from '@/features/app-ideas/types/app-idea.types'
import { Button, EmptyState, PageHeader } from '@/shared/ui'
import styles from './AppIdeasPage.module.scss'

const SEARCH_DEBOUNCE_MS = 350

export function AppIdeasPage() {
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

  const { data: collection, isLoading } = useAppIdeas(filters)

  const total = collection?.total ?? 0
  const page = collection?.page ?? filters.page ?? 1
  const limit = collection?.limit ?? filters.limit ?? 20
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <section className={styles.page}>
      <PageHeader
        title="Ideas de apps"
        subtitle="Registra conceptos de producto en markdown"
        hideSubtitleOnMobile
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(appIdeasPaths.new)}>
            + Nueva idea
          </Button>
        }
      />

      <div className={styles.filters}>
        <AppIdeasFilters
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.loading}>Cargando ideas…</div>
        ) : (collection?.ideas.length ?? 0) === 0 ? (
          <EmptyState
            title="Sin ideas todavía"
            description="Crea tu primera idea de app y documenta el concepto en markdown."
            action={
              <Button variant="primary" size="sm" onClick={() => navigate(appIdeasPaths.new)}>
                Nueva idea
              </Button>
            }
          />
        ) : (
          collection?.ideas.map((idea) => <AppIdeaCard key={idea.id} idea={idea} />)
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
