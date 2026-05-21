import { useMemo } from 'react'
import type { ActivityCategory } from '@/features/activities/types/activity-category.types'
import type { ActivityFilters as ActivityFiltersState } from '@/features/activities/types/activity.types'
import {
  activityPriorityOptions,
  activityStatusOptions,
} from '@/features/activities/utils/activity-enums'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { SearchSelect } from '@/shared/ui/SearchSelect'
import { Select } from '@/shared/ui/Select'
import styles from './ActivityFilters.module.scss'

type ActivityFiltersProps = {
  filters: ActivityFiltersState
  categories: ActivityCategory[]
  onChange: (filters: ActivityFiltersState) => void
  onClear: () => void
}

export function ActivityFilters({ filters, categories, onChange, onClear }: ActivityFiltersProps) {
  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
        icon: (
          <span
            className={styles.categoryIcon}
            style={{ color: cat.color ?? 'var(--color-text)' }}
            aria-hidden
          >
            <AppIcon name={cat.icon ?? 'list-check'} size="sm" decorative />
          </span>
        ),
      })),
    [categories],
  )

  const patch = (partial: Partial<ActivityFiltersState>) => {
    onChange({ ...filters, ...partial })
  }

  return (
    <div className={styles.root} role="search" aria-label="Filtros de actividades">
      <div className={styles.row}>
        <FormField id="activity-search" label="Buscar">
          <Input
            id="activity-search"
            placeholder="Título o descripción…"
            value={filters.search ?? ''}
            onChange={(e) => patch({ search: e.target.value })}
          />
        </FormField>
        <Select
          id="activity-filter-status"
          label="Estado"
          placeholder="Todos"
          value={filters.status ?? ''}
          options={activityStatusOptions}
          onChange={(value) =>
            patch({ status: value ? (value as ActivityFiltersState['status']) : null })
          }
        />
        <Select
          id="activity-filter-priority"
          label="Prioridad"
          placeholder="Todas"
          value={filters.priority ?? ''}
          options={activityPriorityOptions}
          onChange={(value) =>
            patch({ priority: value ? (value as ActivityFiltersState['priority']) : null })
          }
        />
      </div>
      <div className={styles.rowSecondary}>
        <SearchSelect
          label="Categoría"
          placeholder="Todas las categorías"
          value={filters.categoryId ?? null}
          options={categoryOptions}
          onChange={(value) => patch({ categoryId: value })}
          clearable
        />
        <Button type="button" variant="ghost" onClick={onClear}>
          Limpiar filtros
        </Button>
      </div>
    </div>
  )
}
