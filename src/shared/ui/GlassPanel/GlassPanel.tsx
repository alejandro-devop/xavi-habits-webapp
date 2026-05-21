import type { HTMLAttributes, ReactNode } from 'react'
import styles from './GlassPanel.module.scss'

type GlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  padding?: 'sm' | 'md' | 'lg'
}

export function GlassPanel({ children, padding = 'md', className, ...props }: GlassPanelProps) {
  const classNames = [styles.panel, styles[`padding-${padding}`], className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}
