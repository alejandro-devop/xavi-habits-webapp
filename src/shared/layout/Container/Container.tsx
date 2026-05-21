import type { HTMLAttributes, ReactNode } from 'react'
import type { ContainerPadding, ContainerSize } from '@/shared/layout/types/layout.types'
import styles from './Container.module.scss'

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  size?: ContainerSize
  padding?: ContainerPadding
}

export function Container({
  children,
  size = 'lg',
  padding = 'md',
  className,
  ...props
}: ContainerProps) {
  const classNames = [
    styles.container,
    styles[size],
    styles[`padding-${padding}`],
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
