import type { ReactNode } from 'react'
import styles from './Alert.module.scss'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

const ICONS: Record<AlertVariant, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '✕',
}

type AlertProps = {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  role?: 'alert' | 'status'
}

export function Alert({ variant = 'info', title, children, role }: AlertProps) {
  const resolvedRole = role ?? (variant === 'danger' || variant === 'warning' ? 'alert' : 'status')

  return (
    <div className={[styles.alert, styles[variant]].join(' ')} role={resolvedRole}>
      <span className={styles.icon} aria-hidden>
        {ICONS[variant]}
      </span>
      <div className={styles.content}>
        {title ? <strong>{title}</strong> : null}
        {title ? ' ' : null}
        {children}
      </div>
    </div>
  )
}
