import styles from './VidaReviewStory.module.scss'

type VidaReviewStoryProps = {
  /** «Viernes 18 de septiembre». */
  dateLabel: string
  /** «día cerrado» · «aún abierto». */
  statusLabel: string
  /** Como mucho tres frases, ya compuestas por `buildReviewStory`. */
  sentences: string[]
}

/**
 * **La historia del día**: lo primero que se lee (criterios 6 y 7).
 *
 * Aquí no se compone ni una palabra: las frases llegan hechas de
 * `utils/vida-review.utils.ts`, que es donde se pueden probar sin pintar nada.
 * Este componente solo decide **cómo se ven**, y por eso no tiene ni una
 * condición sobre el contenido.
 *
 * Con **una sola** frase se ve exactamente igual: la historia no rellena, y un
 * día con un solo dato se cuenta en una línea (criterio 6).
 */
export function VidaReviewStory({ dateLabel, statusLabel, sentences }: VidaReviewStoryProps) {
  return (
    <section className={styles.root} aria-labelledby="vida-review-story">
      {/* En el móvil manda la fecha; en escritorio el título de la columna se
          lee (criterio 22). Es el mismo elemento, no dos. */}
      <h2 className={styles.title} id="vida-review-story">
        La historia del día
      </h2>
      <p className={styles.date}>
        {dateLabel} · <span className={styles.status}>{statusLabel}</span>
      </p>
      {sentences.map((sentence) => (
        <p className={styles.sentence} key={sentence}>
          {sentence}
        </p>
      ))}
    </section>
  )
}
