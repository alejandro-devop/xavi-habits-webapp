import type { CSSProperties } from 'react'
import type { CategoryBreakdown } from '@/features/vida/utils/vida-review.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaReviewCategories.module.scss'

type VidaReviewCategoriesProps = {
  breakdown: CategoryBreakdown
}

function barStyle(share: number, color: string | null): CSSProperties {
  return {
    width: `${Math.round(share * 100)}%`,
    ...(color ? ({ '--vida-category-color': color } as CSSProperties) : {}),
  }
}

/**
 * **Minutos por categoría** (criterios 26–30), el marco B del render.
 *
 * Dos barras por categoría: **planeado rayado** y **registrado sólido**, las
 * dos con **el color del catálogo** de esa categoría —que ya viaja dentro del
 * plan y de las sesiones, sin consulta extra—. La cabecera dice «Casa · 45 min
 * → 2h 53»: dos magnitudes, **nunca un porcentaje único** que se lea como una
 * nota (criterio 29; en esta pantalla no aparece la palabra «cumplimiento»).
 *
 * «Sin categoría» tiene **su propia fila** (criterio 27) y **«Sin registrar» es
 * una fila más**, separada por una línea punteada y medida contra el día entero
 * (criterio 28): no es una categoría y no se reparte entre las demás.
 *
 * Las barras van con `aria-hidden`: lo que lee un lector de pantalla es la
 * cabecera, que trae los dos números exactos. Una barra no dice nada que el
 * texto no diga ya.
 */
export function VidaReviewCategories({ breakdown }: VidaReviewCategoriesProps) {
  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {breakdown.rows.map((row) => (
          <li className={styles.row} key={row.key}>
            <p className={styles.head}>
              <span className={styles.capsule} aria-hidden>
                <AppIcon name={row.icon} size="sm" decorative />
              </span>
              <span className={styles.name}>{row.name}</span>
              <span className={styles.values}>
                {row.plannedLabel} → <b>{row.registeredLabel}</b>
              </span>
            </p>
            <div className={styles.bars} aria-hidden>
              <span className={styles.barRow}>
                <span className={styles.barLabel}>planeado</span>
                <span className={styles.track}>
                  <i className={styles.planned} style={barStyle(row.plannedShare, row.color)} />
                </span>
              </span>
              <span className={styles.barRow}>
                <span className={styles.barLabel}>registrado</span>
                <span className={styles.track}>
                  <i
                    className={styles.registered}
                    style={barStyle(row.registeredShare, row.color)}
                  />
                </span>
              </span>
            </div>
            {row.note ? <p className={styles.note}>{row.note}</p> : null}
          </li>
        ))}
      </ul>

      <div className={styles.noData}>
        <p className={styles.head}>
          <span className={styles.name}>Sin registrar</span>
          <span className={styles.values}>
            <b>{breakdown.noData.label}</b>
          </span>
        </p>
        <div className={styles.bars} aria-hidden>
          <span className={styles.barRow}>
            <span className={styles.barLabel}>del día</span>
            <span className={styles.track}>
              <i className={styles.noDataBar} style={{ width: `${Math.round(breakdown.noData.share * 100)}%` }} />
            </span>
          </span>
        </div>
        <p className={styles.note}>
          {breakdown.noData.label} de las {breakdown.noData.dayLabel} de tu día.{' '}
          {breakdown.noData.note}
        </p>
      </div>
    </div>
  )
}
