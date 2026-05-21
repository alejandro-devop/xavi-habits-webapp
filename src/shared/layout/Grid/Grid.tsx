import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import type { AlignItems, GapSize, GridColumns, JustifyContent } from '@/shared/layout/types/layout.types'
import styles from './Grid.module.scss'

type GridProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  columns?: GridColumns
  gap?: GapSize
  align?: AlignItems
  justify?: JustifyContent
}

export function Grid({
  children,
  columns = 12,
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className,
  style,
  ...props
}: GridProps) {
  const classNames = [
    styles.grid,
    styles[`gap-${gap}`],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const gridStyle = {
    ...style,
    '--grid-columns': String(columns),
  } as CSSProperties

  return (
    <div className={classNames} style={gridStyle} {...props}>
      {children}
    </div>
  )
}
