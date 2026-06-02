import { TagChip } from '@/features/todos/components/TagChip/TagChip'
import type { NotesFilters as Filters, TodoTag } from '@/features/notes/types/note.types'
import styles from './NotesFilters.module.scss'

type Props = {
  filters: Filters
  onChange: (filters: Filters) => void
  availableTags: TodoTag[]
}

export function NotesFilters({ filters, onChange, availableTags }: Props) {
  const toggleTag = (tag: TodoTag) => {
    onChange({ ...filters, tagId: filters.tagId === tag.id ? undefined : tag.id })
  }

  return (
    <div className={styles.root}>
      <div className={styles.tags}>
        {availableTags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            selected={filters.tagId === tag.id}
            onToggle={toggleTag}
          />
        ))}
      </div>

      <div className={styles.dates}>
        <label className={styles.dateField}>
          <span>Desde</span>
          <input
            type="date"
            value={filters.dateFrom ? filters.dateFrom.slice(0, 10) : ''}
            onChange={(e) =>
              onChange({
                ...filters,
                dateFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
              })
            }
          />
        </label>
        <label className={styles.dateField}>
          <span>Hasta</span>
          <input
            type="date"
            value={filters.dateTo ? filters.dateTo.slice(0, 10) : ''}
            onChange={(e) =>
              onChange({
                ...filters,
                dateTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
              })
            }
          />
        </label>
        {(filters.tagId || filters.dateFrom || filters.dateTo) && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => onChange({})}
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
