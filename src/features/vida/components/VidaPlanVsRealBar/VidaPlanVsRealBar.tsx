import type { CSSProperties } from 'react'
import styles from './VidaPlanVsRealBar.module.scss'

type VidaPlanVsRealBarProps = {
  plannedMinutes: number
  realMinutes: number
  /** «plan 30 · real 41», ya compuesto por `describeBlockExecution`. */
  label: string
}

/**
 * La barrita de plan frente a real (criterio 21).
 *
 * Dos trazos cortos bajo el bloque —lo que planeaste y lo que duró— **con su
 * texto al lado**: «plan 30 · real 41». El número se lee como texto de verdad,
 * no en un `title` ni solo como color, que es lo que pide el criterio; la barra
 * es `aria-hidden` por el mismo motivo que la del presupuesto (es el dibujo del
 * dato que ya está escrito).
 *
 * Los anchos se normalizan contra **el mayor de los dos**, así que el más largo
 * siempre llena la barrita y el otro se lee en proporción. No hay color de
 * alarma: durar más no es un fallo (criterio 59).
 */
export function VidaPlanVsRealBar({ plannedMinutes, realMinutes, label }: VidaPlanVsRealBarProps) {
  const top = Math.max(1, plannedMinutes, realMinutes)
  const style = {
    '--vida-plan-width': `${(Math.max(0, plannedMinutes) / top) * 100}%`,
    '--vida-real-width': `${(Math.max(0, realMinutes) / top) * 100}%`,
  } as CSSProperties

  return (
    <p className={styles.root} style={style}>
      <span className={styles.bars} aria-hidden>
        <span className={styles.plan} />
        <span className={styles.real} data-longer={realMinutes > plannedMinutes ? '' : undefined} />
      </span>
      <span className={styles.label}>{label}</span>
    </p>
  )
}
