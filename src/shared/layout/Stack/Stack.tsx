import type { HTMLAttributes, ReactNode } from 'react'
import type { AlignItems, GapSize } from '@/shared/layout/types/layout.types'
import styles from './Stack.module.scss'

type StackProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  gap?: GapSize
  align?: AlignItems
}

export function Stack({ children, gap = 'md', align = 'stretch', className, ...props }: StackProps) {
  const classNames = [styles.stack, styles[`gap-${gap}`], styles[`align-${align}`], className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}
