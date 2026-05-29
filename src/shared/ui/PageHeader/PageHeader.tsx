import type { ReactNode } from 'react'
import styles from './PageHeader.module.scss'

type PageHeaderProps = {
  title: string
  subtitle?: string
  hideSubtitleOnMobile?: boolean
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, hideSubtitleOnMobile, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? (
          <p className={[styles.subtitle, hideSubtitleOnMobile ? styles.subtitleHideOnMobile : ''].join(' ')}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  )
}
