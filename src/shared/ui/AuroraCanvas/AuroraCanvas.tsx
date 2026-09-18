import styles from './AuroraCanvas.module.scss'

export type AuroraCanvasProps = {
  /**
   * `true` (por defecto) fija el lienzo al viewport.
   * `false` lo ancla al contenedor posicionado más cercano (demos, tarjetas).
   */
  fixed?: boolean
  className?: string
  /**
   * Ámbito del design system (p. ej. `'aura'`) cuando el lienzo se monta fuera
   * de un subárbol que ya lo lleve: sin esto los orbes usan los valores de
   * respaldo claros y el tema oscuro queda lavado.
   */
  ds?: string
}

/**
 * Fondo decorativo del lenguaje Aura: tres orbes difuminados detrás del
 * contenido. Es puramente ornamental, por eso va `aria-hidden` y sin eventos.
 * Los colores salen de `--aurora-orb-*`, que el ámbito `[data-ds='aura']`
 * re-mapea en claro y oscuro.
 */
export function AuroraCanvas({ fixed = true, className, ds }: AuroraCanvasProps) {
  const rootClass = [styles.canvas, fixed ? styles.fixed : styles.absolute, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} data-ds={ds} aria-hidden="true">
      <span className={[styles.orb, styles.orb1].join(' ')} />
      <span className={[styles.orb, styles.orb2].join(' ')} />
      <span className={[styles.orb, styles.orb3].join(' ')} />
    </div>
  )
}
