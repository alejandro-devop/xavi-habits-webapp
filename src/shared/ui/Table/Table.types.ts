import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from 'react'

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  children: ReactNode
  isLoading?: boolean
  empty?: ReactNode
  caption?: string
}

export type TableHeadProps = HTMLAttributes<HTMLTableCellElement> & {
  children: ReactNode
  sortable?: boolean
  sortDirection?: 'asc' | 'desc'
  onSort?: () => void
  align?: 'start' | 'end'
}
