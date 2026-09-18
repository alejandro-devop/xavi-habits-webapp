import { useNavigate } from 'react-router'
import { HabitStreakBadge } from '@/features/habits/components/HabitStreakBadge'
import { HabitTypeBadge } from '@/features/habits/components/HabitTypeBadge'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import type { Habit } from '@/features/habits/types/habit.types'
import {
  getHabitFrequencyLabel,
  getHabitIntent,
  type HabitSortKey,
} from '@/features/habits/utils/habit-list.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/Table'
import styles from './HabitListTable.module.scss'

type HabitListTableProps = {
  /** Ya filtrados y ordenados por la página: la tabla ordena igual que la rejilla. */
  habits: Habit[]
  sort: HabitSortKey
  onSortChange: (sort: HabitSortKey) => void
}

export function HabitListTable({ habits, sort, onSortChange }: HabitListTableProps) {
  const navigate = useNavigate()

  /** Las columnas ordenables usan la misma clave que la rejilla. */
  function sortableHead(label: string, key: HabitSortKey) {
    return (
      <TableHead
        sortable
        sortDirection={sort === key ? 'desc' : undefined}
        onSort={() => onSortChange(key)}
      >
        {label}
      </TableHead>
    )
  }

  return (
    // Solo la tabla hace scroll horizontal en móvil; la página, nunca.
    <div className={styles.scroller}>
      <Table caption="Hábitos activos">
        <TableHeader>
          <TableRow>
            {sortableHead('Hábito', 'name')}
            <TableHead>Tipo</TableHead>
            <TableHead>Frecuencia</TableHead>
            {sortableHead('Racha', 'streak')}
            {sortableHead('Periodo', 'period')}
          </TableRow>
        </TableHeader>
        <TableBody>
          {habits.map((habit) => (
            <TableRow key={habit.id}>
              <TableCell>
                <button
                  type="button"
                  className={styles.habitCell}
                  onClick={() => navigate(habitsPaths.detail(habit.id))}
                >
                  <AppIcon name={habit.icon ?? 'seedling'} size="xs" decorative />
                  <span className={styles.habitName}>{habit.name}</span>
                </button>
              </TableCell>
              <TableCell>
                <HabitTypeBadge habitType={habit.habitType} intent={getHabitIntent(habit)} />
              </TableCell>
              <TableCell>
                <span className={styles.muted}>{getHabitFrequencyLabel(habit)}</span>
              </TableCell>
              <TableCell>
                {/* De `habit.streak`, igual que la tarjeta. */}
                <HabitStreakBadge streak={habit.streak} compact />
              </TableCell>
              <TableCell>
                <span className={styles.numeric}>
                  {habit.periodDays > 0 ? `${habit.days}/${habit.periodDays}` : '—'}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
