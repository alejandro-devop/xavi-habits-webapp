import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.scss'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, padding = 'md', className, ...props }: CardProps) {
  const classNames = [styles.card, styles[`padding-${padding}`], className].filter(Boolean).join(' ')

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}
