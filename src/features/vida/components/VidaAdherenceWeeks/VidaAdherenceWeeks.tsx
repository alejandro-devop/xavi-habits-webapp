import type { AdherenceWeek } from '@/features/vida/utils/vida-adherence.utils'
import styles from './VidaAdherenceWeeks.module.scss'

type VidaAdherenceWeeksProps = {
  weeks: AdherenceWeek[]
}

/**
 * **Semana a semana** (criterios 67 y 68).
 *
 * Una fila por semana computable: su rango de fechas, la barra con **lo
 * planeado rayado y lo seguido sólido** —los mismos colores que la barra del
 * día, para que signifiquen lo mismo en las dos pantallas— y la cifra en
 * **fracción**, con el porcentaje pequeño al lado. **Nunca el porcentaje
 * solo**: esa es la regla del módulo desde el render.
 *
 * Las semanas con menos de tres días planeados **no llegan hasta aquí**:
 * `buildAdherence` las deja fuera, y la línea de datos lo dice en voz alta.
 *
 * La barra es decorativa (`aria-hidden`): lo que dice ya está escrito en la
 * fracción, y un lector de pantalla no oye un ancho. Molde: `VidaReviewWeek`.
 */
export function VidaAdherenceWeeks({ weeks }: VidaAdherenceWeeksProps) {
  const hasCurrent = weeks.some((week) => week.isCurrent)

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>Semana a semana</h3>

      <ol className={styles.rows} aria-label="Semana a semana">
        {weeks.map((week) => (
          <li className={styles.row} key={week.monday}>
            <span className={styles.when}>
              <span className={styles.month} aria-hidden>
                {week.monthLabel}
              </span>
              <span className={styles.days} aria-hidden>
                {week.daysLabel}
              </span>
              <span className={styles.srOnly}>Semana del {week.rangeLabel}</span>
            </span>

            <span className={styles.track} aria-hidden>
              <span className={styles.followed} style={{ width: `${week.followedPercent}%` }} />
            </span>

            <span className={styles.figures}>
              <b className={styles.fraction}>{week.fractionLabel}</b>
              <span className={styles.percent}>{week.percentLabel}</span>
              <span className={styles.srOnly}>bloques seguidos de planeados</span>
            </span>
          </li>
        ))}
      </ol>

      <ul className={styles.legend}>
        <li className={styles.legendItem}>
          <span className={styles.swatch} data-kind="followed" aria-hidden />
          seguido
        </li>
        <li className={styles.legendItem}>
          <span className={styles.swatch} data-kind="planned" aria-hidden />
          planeado
        </li>
        {/* La semana en curso no está terminada y la cifra lo dice antes de
            que nadie se pregunte por qué es más baja (criterio 68). */}
        {hasCurrent ? <li className={styles.legendItem}>la semana en curso cuenta hasta hoy</li> : null}
      </ul>
    </div>
  )
}
