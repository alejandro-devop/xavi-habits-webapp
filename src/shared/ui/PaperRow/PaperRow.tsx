import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import styles from './PaperRow.module.scss'

export type PaperRowProps<T extends ElementType = 'div'> = {
  as?: T
  children: ReactNode
  divider?: boolean
  focused?: boolean
  interactive?: boolean
} & Omit<HTMLAttributes<HTMLElement>, 'as'>

export function PaperRow<T extends ElementType = 'div'>({
  as,
  children,
  divider = true,
  focused = false,
  interactive = false,
  className,
  ...props
}: PaperRowProps<T>) {
  const Component = as ?? 'div'
  const classNames = [
    styles.row,
    divider ? styles.divider : '',
    focused ? styles.focused : '',
    interactive ? styles.interactive : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  )
}
