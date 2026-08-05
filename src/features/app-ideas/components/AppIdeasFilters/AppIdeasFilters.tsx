import type { AppIdeasFilters as Filters, AppIdeaStatus } from '@/features/app-ideas/types/app-idea.types'
import { APP_IDEA_STATUS_OPTIONS } from '@/features/app-ideas/types/app-idea.types'
import { Input, Select } from '@/shared/ui'
import styles from './AppIdeasFilters.module.scss'

type Props = {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: Filters
  onChange: (filters: Filters) => void
}

export function AppIdeasFilters({ searchValue, onSearchChange, filters, onChange }: Props) {
  const hasFilters = Boolean(searchValue.trim() || filters.status)

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <div className={styles.search}>
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar en título y contenido…"
            aria-label="Buscar ideas de apps"
          />
        </div>
        <div className={styles.status}>
          <Select
            value={filters.status ?? ''}
            onChange={(next) => {
              const value = next as AppIdeaStatus | ''
              onChange({
                ...filters,
                status: value || undefined,
                page: 1,
              })
            }}
            aria-label="Filtrar por estado"
            options={[
              { value: '', label: 'Todos los estados' },
              ...APP_IDEA_STATUS_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              })),
            ]}
          />
        </div>
      </div>

      {hasFilters ? (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => {
            onSearchChange('')
            onChange({ page: 1, limit: filters.limit })
          }}
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  )
}
