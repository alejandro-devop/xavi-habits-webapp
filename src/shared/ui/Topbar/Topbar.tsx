import type { ReactNode } from 'react'
import { Breadcrumbs, type BreadcrumbItem } from '@/shared/ui/Breadcrumbs'
import styles from './Topbar.module.scss'

type TopbarProps = {
  title?: string
  titleClassName?: string
  breadcrumbs?: BreadcrumbItem[]
  breadcrumbsClassName?: string
  actions?: ReactNode
  userArea?: ReactNode
  leading?: ReactNode
  /** Ámbito del design system para el cromo (p. ej. `'aura'`). */
  ds?: string
}

export function Topbar({
  title,
  titleClassName,
  breadcrumbs,
  breadcrumbsClassName,
  actions,
  userArea,
  leading,
  ds,
}: TopbarProps) {
  const trailing = actions || userArea

  return (
    <header className={styles.topbar} data-ds={ds}>
      <div className={styles.leading}>
        {leading}
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumbs items={breadcrumbs} separator="·" className={breadcrumbsClassName} />
        ) : title ? (
          <h1 className={[styles.title, titleClassName].filter(Boolean).join(' ')}>{title}</h1>
        ) : null}
      </div>
      {trailing ? (
        <div className={styles.trailing}>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
          {userArea ? <div className={styles.userArea}>{userArea}</div> : null}
        </div>
      ) : null}
    </header>
  )
}
