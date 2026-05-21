import type { TableHeadProps } from '@/shared/ui/Table/Table.types'
import styles from './Table.module.scss'

export function TableHead({
  children,
  sortable,
  sortDirection,
  onSort,
  align = 'start',
  className,
  ...props
}: TableHeadProps) {
  const classNames = [
    styles.headCell,
    sortable ? styles.headCellSortable : '',
    align === 'end' ? styles.alignEnd : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const ariaSort =
    sortable && sortDirection
      ? sortDirection === 'asc'
        ? ('ascending' as const)
        : ('descending' as const)
      : undefined

  return (
    <th
      className={classNames}
      aria-sort={ariaSort}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      {children}
      {sortable && sortDirection ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : null}
    </th>
  )
}
