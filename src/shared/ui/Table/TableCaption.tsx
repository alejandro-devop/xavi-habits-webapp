import type { ReactNode } from 'react'
import styles from './Table.module.scss'

export function TableCaption({ children }: { children: ReactNode }) {
  return <caption className={styles.caption}>{children}</caption>
}
