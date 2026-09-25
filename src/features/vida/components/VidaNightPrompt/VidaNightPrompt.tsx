import type { VidaNight } from '@/features/vida/utils/vida-night.utils'
import { formatNightTime } from '@/features/vida/utils/vida-night.utils'
import { Button } from '@/shared/ui/Button'
import styles from './VidaNightPrompt.module.scss'

export type VidaNightPromptProps = {
  /** La noche **planeada** que terminó en este día: lo que se pregunta. */
  night: VidaNight
  /** Un toque: lo planeado pasa a real y confirmado. Nada más (criterio 290). */
  onConfirm: () => void
  /** «Fue distinto»: abre la hoja. No guarda nada por sí mismo (criterio 291). */
  onDifferent: () => void
}

/**
 * **La pregunta de la mañana** (FEAT-012, tajada 3, criterios 288 a 290).
 *
 * El momento A4 del render aprobado `docs/vida/assets/13-vida-dormir.html`: se
 * pinta **en el sitio de la franja de arriba**, con su misma forma y su mismo
 * color, porque es la misma cosa —la noche que acaba en este día— solo que
 * todavía sin contestar. Por eso aquí no hay una tarjeta nueva compitiendo con
 * la agenda: hay una franja que pregunta.
 *
 * **Molde: `VidaGoalPrompt`** (FEAT-016), la otra pregunta de un toque de Hoy:
 * un `<section>` con su título, la línea de por qué, los botones y nada más.
 * Con una diferencia deliberada: **aquí no hay «Ahora no»**. Ignorarla ya es
 * gratis y no escribe nada (criterio 295); un tercer botón sería un clic más
 * para no hacer nada, y la regla de la casa es la contraria — «entre más
 * acciones tenga que hacer un usuario normal, más va a posponer».
 *
 * **Un toque de verdad.** «Sí, así fue» no abre nada, no pide confirmación y no
 * manda a ninguna pantalla: guarda lo planeado como real y la pregunta
 * desaparece. «Fue distinto» abre la hoja, que es el camino largo para quien lo
 * necesita.
 *
 * **Ni una palabra de reproche** (criterio 316): no dice si dormiste poco, no
 * pregunta por qué y no insiste. Dormir mal no es un fallo de nadie.
 */
export function VidaNightPrompt({ night, onConfirm, onDifferent }: VidaNightPromptProps) {
  return (
    <section
      className={styles.root}
      data-variant="prompt"
      aria-labelledby="vida-night-prompt-title"
    >
      <span className={styles.mark} aria-hidden>
        🌅
      </span>
      <p className={styles.question} id="vida-night-prompt-title">
        ¿Dormiste {formatNightTime(night.bedTime)} → {formatNightTime(night.wakeTime)}?
      </p>
      <p className={styles.why}>Es tu noche de siempre. Si fue así, un toque y listo.</p>
      <div className={styles.actions}>
        <Button variant="primary" size="sm" onClick={onConfirm}>
          Sí, así fue
        </Button>
        <Button variant="secondary" size="sm" onClick={onDifferent}>
          Fue distinto
        </Button>
      </div>
    </section>
  )
}
