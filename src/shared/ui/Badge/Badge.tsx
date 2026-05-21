import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Badge.module.scss'

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'primary'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
  variant?: BadgeVariant
}

export function Badge({ children, variant = 'neutral', className, ...props }: BadgeProps) {
  const classNames = [styles.badge, styles[variant], className].filter(Boolean).join(' ')

  return (
    <span className={classNames} {...props}>
      {children}
    </span>
  )
}
