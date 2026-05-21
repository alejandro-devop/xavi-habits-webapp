import type { ReactNode } from 'react'
import { Spinner } from '@/shared/ui/Spinner/Spinner'
import type { TableProps } from '@/shared/ui/Table/Table.types'
import styles from './Table.module.scss'

export function Table({ children, isLoading, empty, caption, className, ...props }: TableProps) {
  return (
    <div className={styles.wrapper}>
      {isLoading ? (
        <div className={styles.loadingOverlay} aria-busy="true">
          <Spinner />
        </div>
      ) : null}
      <table className={[styles.table, className].filter(Boolean).join(' ')} {...props}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        {children}
      </table>
      {empty ? <div className={styles.empty}>{empty}</div> : null}
    </div>
  )
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className={styles.head}>{children}</thead>
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className={styles.row}>{children}</tr>
}

export { TableHead } from '@/shared/ui/Table/TableHead'
export { TableCell } from '@/shared/ui/Table/TableCell'
export { TableCaption } from '@/shared/ui/Table/TableCaption'
