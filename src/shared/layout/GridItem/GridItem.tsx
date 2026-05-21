import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import styles from './GridItem.module.scss'

type GridItemProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  span?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
}

export function GridItem({
  children,
  span = 12,
  sm,
  md,
  lg,
  xl,
  className,
  style,
  ...props
}: GridItemProps) {
  const itemStyle = {
    ...style,
    '--span': String(span),
    ...(sm !== undefined ? { '--span-sm': String(sm) } : {}),
    ...(md !== undefined ? { '--span-md': String(md) } : {}),
    ...(lg !== undefined ? { '--span-lg': String(lg) } : {}),
    ...(xl !== undefined ? { '--span-xl': String(xl) } : {}),
  } as CSSProperties

  return (
    <div className={[styles.item, className].filter(Boolean).join(' ')} style={itemStyle} {...props}>
      {children}
    </div>
  )
}
