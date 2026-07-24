import { LearningTagChip } from '@/features/learning/components/LearningTagChip'
import type {
  LearningNotesFilters as Filters,
  LearningTag,
} from '@/features/learning/types/learning-note.types'
import { Input } from '@/shared/ui'
import styles from './LearningNotesFilters.module.scss'

type Props = {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: Filters
  onChange: (filters: Filters) => void
  availableTags: LearningTag[]
}

export function LearningNotesFilters({
  searchValue,
  onSearchChange,
  filters,
  onChange,
  availableTags,
}: Props) {
  const selectedSlugs = new Set(filters.tags ?? [])

  const toggleTag = (tag: LearningTag) => {
    const current = filters.tags ?? []
    const next = selectedSlugs.has(tag.slug)
      ? current.filter((slug) => slug !== tag.slug)
      : [...current, tag.slug]
    onChange({
      ...filters,
      tags: next.length ? next : undefined,
      page: 1,
    })
  }

  const hasFilters = Boolean(searchValue.trim() || (filters.tags?.length ?? 0) > 0)

  return (
    <div className={styles.root}>
      <div className={styles.search}>
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar en título y contenido…"
          aria-label="Buscar notas de learning"
        />
      </div>

      {availableTags.length > 0 ? (
        <div className={styles.tags}>
          {availableTags.map((tag) => (
            <LearningTagChip
              key={tag.id}
              tag={tag}
              selected={selectedSlugs.has(tag.slug)}
              onToggle={() => toggleTag(tag)}
            />
          ))}
          {hasFilters ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                onSearchChange('')
                onChange({ page: 1, limit: filters.limit })
              }}
            >
              Limpiar
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
