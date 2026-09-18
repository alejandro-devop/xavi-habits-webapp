import type { ReactNode } from 'react'
import { Link } from 'react-router'
import styles from './Breadcrumbs.module.scss'

export type BreadcrumbItem = {
  label: string
  to?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  className?: string
  /** Separador entre niveles. Por defecto `/`; el cromo Aura usa `·`. */
  separator?: ReactNode
}

export function Breadcrumbs({ items, className, separator = '/' }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav className={[styles.nav, className].filter(Boolean).join(' ')} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {index > 0 ? (
                <span className={styles.separator} aria-hidden>
                  {separator}
                </span>
              ) : null}
              {isLast || !item.to ? (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link className={styles.link} to={item.to}>
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
