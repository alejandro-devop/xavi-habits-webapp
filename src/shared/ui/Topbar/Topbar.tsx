import type { ReactNode } from 'react'
import { Breadcrumbs, type BreadcrumbItem } from '@/shared/ui/Breadcrumbs'
import styles from './Topbar.module.scss'

type TopbarProps = {
  title?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  userArea?: ReactNode
  leading?: ReactNode
}

export function Topbar({ title, breadcrumbs, actions, userArea, leading }: TopbarProps) {
  const trailing = actions || userArea

  return (
    <header className={styles.topbar}>
      <div className={styles.leading}>
        {leading}
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumbs items={breadcrumbs} />
        ) : title ? (
          <h1 className={styles.title}>{title}</h1>
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
