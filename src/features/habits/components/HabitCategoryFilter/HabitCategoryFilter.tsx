import type { HabitCategory } from '@/features/habits/types/habit.types'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './HabitCategoryFilter.module.scss'

type HabitCategoryFilterProps = {
  categories: HabitCategory[]
  /** Hábitos del día por categoría. */
  counts: Map<string, number>
  totalCount: number
  /** `null` = "Todos". */
  value: string | null
  onChange: (categoryId: string | null) => void
}

/**
 * Filtro de cliente: acota `entries` sin lanzar ninguna petición nueva.
 */
export function HabitCategoryFilter({
  categories,
  counts,
  totalCount,
  value,
  onChange,
}: HabitCategoryFilterProps) {
  return (
    <div className={styles.root} role="group" aria-label="Filtrar por categoría">
      <Chip
        isActive={value === null}
        count={totalCount}
        onClick={() => onChange(null)}
        label="Todos"
      />
      {categories.map((category) => (
        <Chip
          key={category.id}
          isActive={value === category.id}
          count={counts.get(category.id) ?? 0}
          onClick={() => onChange(category.id)}
          label={category.name}
          icon={category.icon}
          color={category.color}
        />
      ))}
    </div>
  )
}

type ChipProps = {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
  icon?: string | null
  color?: string | null
}

function Chip({ label, count, isActive, onClick, icon, color }: ChipProps) {
  return (
    <button
      type="button"
      className={[styles.chip, isActive ? styles.chipActive : ''].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-pressed={isActive}
    >
      {icon ? (
        <AppIcon
          name={icon}
          size="2xs"
          decorative
          color={color ?? undefined}
          className={styles.chipIcon}
        />
      ) : null}
      {label}
      <span className={styles.count}>{count}</span>
    </button>
  )
}
