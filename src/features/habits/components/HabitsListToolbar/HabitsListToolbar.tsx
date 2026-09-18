import type { ReactNode } from 'react'
import { HabitCategoryFilter } from '@/features/habits/components/HabitCategoryFilter'
import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import type { HabitCategory } from '@/features/habits/types/habit.types'
import { HABIT_SORT_OPTIONS, type HabitSortKey } from '@/features/habits/utils/habit-list.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { IconButton } from '@/shared/ui/IconButton'
import { Input } from '@/shared/ui/Input'
import { Popover } from '@/shared/ui/Popover'
import { Select } from '@/shared/ui/Select'
import styles from './HabitsListToolbar.module.scss'

export type HabitsListView = 'cards' | 'table'

type HabitsListToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  sort: HabitSortKey
  onSortChange: (value: HabitSortKey) => void
  categories: HabitCategory[]
  categoryCounts: Map<string, number>
  totalCount: number
  categoryId: string | null
  onCategoryChange: (value: string | null) => void
  purposes: HabitPurpose[]
  purposeCounts: Map<string, number>
  purposeId: string | null
  onPurposeChange: (value: string | null) => void
  view: HabitsListView
  onViewChange: (view: HabitsListView) => void
  /** `true` a <768px: orden, filtros y vista se pliegan en un popover. */
  isCompact: boolean
  /** El CTA "Nuevo hábito", que en móvil flota sobre la rejilla. */
  action: ReactNode
}

const ALL_PURPOSES = '__all__'

/**
 * Buscar, ordenar y filtrar, todo en cliente sobre los hábitos ya cargados:
 * ninguno de estos controles vuelve a pedir datos.
 */
export function HabitsListToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  categories,
  categoryCounts,
  totalCount,
  categoryId,
  onCategoryChange,
  purposes,
  purposeCounts,
  purposeId,
  onPurposeChange,
  view,
  onViewChange,
  isCompact,
  action,
}: HabitsListToolbarProps) {
  const purposeOptions = [
    { value: ALL_PURPOSES, label: 'Propósito: todos' },
    ...purposes.map((purpose) => ({
      value: purpose.id,
      label: `${purpose.name} (${purposeCounts.get(purpose.id) ?? 0})`,
    })),
  ]

  const controls = (
    <>
      <div className={styles.control}>
        <Select
          id="habits-sort"
          className={styles.pillSelect}
          aria-label="Ordenar hábitos"
          options={HABIT_SORT_OPTIONS.map((option) => ({
            value: option.value,
            label: `Ordenar: ${option.label.toLowerCase()}`,
          }))}
          value={sort}
          onChange={(value) => onSortChange(value as HabitSortKey)}
        />
      </div>
      <div className={styles.control}>
        <Select
          id="habits-purpose"
          className={styles.pillSelect}
          aria-label="Filtrar por propósito"
          options={purposeOptions}
          value={purposeId ?? ALL_PURPOSES}
          onChange={(value) => onPurposeChange(value === ALL_PURPOSES ? null : value)}
        />
      </div>
      <div className={styles.viewToggle} role="group" aria-label="Vista de la lista">
        <button
          type="button"
          className={[styles.viewOption, view === 'cards' ? styles.viewOptionActive : '']
            .filter(Boolean)
            .join(' ')}
          aria-pressed={view === 'cards'}
          onClick={() => onViewChange('cards')}
        >
          Tarjetas
        </button>
        <button
          type="button"
          className={[styles.viewOption, view === 'table' ? styles.viewOptionActive : '']
            .filter(Boolean)
            .join(' ')}
          aria-pressed={view === 'table'}
          onClick={() => onViewChange('table')}
        >
          Tabla
        </button>
      </div>
    </>
  )

  const categoryFilter = (
    <HabitCategoryFilter
      categories={categories}
      counts={categoryCounts}
      totalCount={totalCount}
      value={categoryId}
      onChange={onCategoryChange}
    />
  )

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <div className={styles.search}>
          <Input
            type="search"
            aria-label="Buscar hábitos"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            leftIcon={<AppIcon name="search" size="xs" decorative />}
          />
        </div>

        {isCompact ? (
          <Popover
            triggerLabel="Orden y filtros"
            trigger={<IconButton icon="gear" size="sm" tabIndex={-1} aria-hidden />}
            content={
              <div className={styles.sheet}>
                {controls}
                {categoryFilter}
              </div>
            }
            placement="bottom-end"
          />
        ) : (
          controls
        )}

        {action}
      </div>

      {isCompact ? null : categoryFilter}
    </div>
  )
}
