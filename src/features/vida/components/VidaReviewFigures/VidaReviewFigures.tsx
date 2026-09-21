import type { ReviewFigures } from '@/features/vida/utils/vida-review.utils'
import styles from './VidaReviewFigures.module.scss'

type VidaReviewFiguresProps = {
  figures: ReviewFigures
  /**
   * **La salida al lado de la cifra** (criterio 44): «Registrar tiempo pasado»
   * junto a «Sin registrar», que es el número de esta tarjeta que habla de lo
   * que no salió. Sin ella —día futuro— no se pinta ningún botón.
   */
  onLogPast?: () => void
}

/**
 * **La cifra grande** y los minutos de al lado (criterios 9, 10 y 11).
 *
 * `6 / 8 bloques seguidos` es, literalmente,
 * `collectDayClosing(...).followedCount / .plannedCount`: **la misma
 * definición de «seguido» que usa Hoy**, sin una segunda regla y sin otro
 * umbral (criterio 9). Aquí no se suma nada.
 *
 * **«Sin registrar» se llama así** (D7/U2) y siempre con su aclaración: es
 * tiempo del que **no hay dato**, nunca tiempo perdido. Se mide contra el día
 * entero de los ajustes (D5), no contra los ratos entre cosas registradas.
 *
 * En un día **sin plan** no se enseña «N de M» (criterio 20): no hay contra qué
 * comparar y un «0 de 0» se leería como una nota. En un día **abierto** se dice
 * que las cifras van hasta ahora (criterio 5).
 *
 * **Desde la tajada 3 la cifra de lo que no salió lleva su salida al lado**
 * (criterio 44): «Sin registrar» va con **«Registrar tiempo pasado»**, que abre
 * la hoja de FEAT-004 sin salir de la revisión. Los bloques que no se hicieron
 * llevan la suya en su propia fila («Lo hice»), que es donde se sabe **cuál**.
 */
export function VidaReviewFigures({ figures, onLogPast }: VidaReviewFiguresProps) {
  return (
    <section className={styles.root} aria-label="Las cifras del día">
      {figures.hasCount ? (
        <p className={styles.count}>
          <span className={styles.big}>{figures.followedCount}</span>
          <span className={styles.of}>/ {figures.plannedCount}</span>
          <span className={styles.unit}>
            bloques
            <br />
            seguidos
          </span>
        </p>
      ) : null}

      <div className={styles.lines}>
        <p className={styles.line}>
          <span className={styles.term}>planeado</span>{' '}
          <span className={styles.value}>{figures.plannedMinutesLabel}</span>
          <span className={styles.sep}> · </span>
          <span className={styles.term}>registrado</span>{' '}
          <span className={styles.value}>{figures.registeredMinutesLabel}</span>
        </p>
        {figures.offPlanMinutes > 0 ? (
          <p className={styles.note}>
            de lo registrado, <b>{figures.offPlanMinutesLabel}</b> fuera del plan
          </p>
        ) : null}
        {figures.isOpen ? <p className={styles.note}>Las cifras van hasta ahora.</p> : null}
      </div>

      <p className={styles.noData}>
        <span className={styles.noDataName}>Sin registrar</span>{' '}
        <b className={styles.noDataValue}>{figures.noDataMinutesLabel}</b>
        <span className={styles.noDataNote}>
          {' '}
          de las {figures.dayMinutesLabel} de tu día · no hay dato, no se adivina
        </span>
        {onLogPast ? (
          <button type="button" className={styles.action} onClick={onLogPast}>
            Registrar tiempo pasado
          </button>
        ) : null}
      </p>
    </section>
  )
}
