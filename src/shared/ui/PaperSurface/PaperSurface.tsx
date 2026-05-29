import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import styles from './PaperSurface.module.scss'

export type PaperSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  /** Pestañas u otra UI encima del bloque papel (p. ej. carpetas de tareas) */
  tabs?: ReactNode
  /** Líneas horizontales alineadas a --paper-row-height */
  ruled?: boolean
  /** Línea vertical del margen del cuaderno */
  withMargin?: boolean
  minHeight?: CSSProperties['minHeight']
}

export function PaperSurface({
  children,
  tabs,
  ruled = true,
  withMargin = true,
  minHeight = '400px',
  className,
  style,
  ...props
}: PaperSurfaceProps) {
  const surfaceClassName = [
    styles.surface,
    ruled ? styles.ruled : '',
    tabs ? styles.connectTop : styles.roundedTop,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      {tabs ? <div className={styles.tabsBar}>{tabs}</div> : null}
      <div className={surfaceClassName} style={{ minHeight, ...style }} {...props}>
        {withMargin ? <div className={styles.margin} aria-hidden="true" /> : null}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
