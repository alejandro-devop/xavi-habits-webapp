import type { HTMLAttributes, ReactNode } from 'react'
import type { AlignItems, GapSize, JustifyContent } from '@/shared/layout/types/layout.types'
import styles from './Inline.module.scss'

type InlineProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  gap?: GapSize
  align?: AlignItems
  justify?: JustifyContent
  wrap?: boolean
}

export function Inline({
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  className,
  ...props
}: InlineProps) {
  const classNames = [
    styles.inline,
    styles[`gap-${gap}`],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    wrap ? styles.wrap : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}
