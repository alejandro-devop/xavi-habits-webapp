import type { TdHTMLAttributes, ReactNode } from 'react'
import styles from './Table.module.scss'

type TableCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> & {
  children: ReactNode
  align?: 'start' | 'end'
}

export function TableCell({ children, align = 'start', className, ...props }: TableCellProps) {
  return (
    <td
      className={[styles.cell, align === 'end' ? styles.alignEnd : '', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </td>
  )
}
