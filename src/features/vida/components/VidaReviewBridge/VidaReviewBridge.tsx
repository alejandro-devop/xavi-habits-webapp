import type { CSSProperties } from 'react'
import type { TemplateBridge } from '@/features/vida/utils/vida-week-review.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import styles from './VidaReviewBridge.module.scss'

type VidaReviewBridgeProps = {
  bridge: TemplateBridge
  /** **«Moverlo a las HH:mm»**: escribe en **la plantilla**, nunca en el plan. */
  onMove: (bridge: TemplateBridge) => void
  /** **«Dejarlo como está»**: el aviso no vuelve esta semana (criterio 58). */
  onDismiss: (bridge: TemplateBridge) => void
  isSaving?: boolean
}

function colorStyleOf(color: string | null): CSSProperties | undefined {
  return color ? ({ '--vida-category-color': color } as CSSProperties) : undefined
}

/**
 * **El puente a la plantilla: un solo aviso, en forma de pregunta**
 * (criterios 54, 57 y 58).
 *
 * Tres cosas que no son de estilo:
 *
 * 1. **Es una pregunta, no una corrección.** «¿Lo movemos a las 20:30 en tu
 *    plantilla?», con **su base dicha** encima —«3 de las últimas 4 noches no
 *    llegó a esa hora»—, para que se pueda contestar «no» con la misma
 *    información con la que se contesta «sí». Ni una palabra de culpa: el
 *    barrido de `vida-vocabulary.test.ts` cubre este archivo.
 * 2. **La consecuencia se lee antes de confirmar** (criterio 57): «En tu
 *    plantilla está 5 días (L M X J V): se mueve en todos» está **en la
 *    tarjeta**, no detrás del botón. Por eso no hay un segundo diálogo: la
 *    confirmación que pedía el criterio es saber qué pasa, y eso ya está a la
 *    vista cuando se toca.
 * 3. **Las dos salidas son afirmativas y ninguna es `danger`** —ese `variant`
 *    no se lee en tema oscuro, deuda anotada del sistema de diseño—: «Moverlo
 *    a las 20:30» y **«Dejarlo como está»**, que es una respuesta, no una
 *    evasiva, y se recuerda **en este aparato**.
 *
 * Lo que este componente **no** puede hacer: tocar el plan de ningún día. Lo
 * único que sale de aquí es un `onMove` que la página convierte en
 * `vidaItemUpdate` con `{ id, startTime }`.
 */
export function VidaReviewBridge({
  bridge,
  onMove,
  onDismiss,
  isSaving = false,
}: VidaReviewBridgeProps) {
  return (
    <Card className={styles.root} padding="md">
      <h2 className={styles.title}>Lo que esto sugiere para tu plantilla</h2>

      <div className={styles.item} style={colorStyleOf(bridge.color)}>
        <span className={styles.capsule} aria-hidden>
          <AppIcon name={bridge.icon} size="sm" decorative />
        </span>
        <div className={styles.body}>
          <p className={styles.name}>
            {bridge.title} · {bridge.currentTimeLabel}
          </p>
          <p className={styles.basis}>{bridge.basis}</p>
        </div>
      </div>

      <p className={styles.ask}>
        ¿Lo movemos a las <b>{bridge.proposedTimeLabel}</b> en tu plantilla?
      </p>
      <p className={styles.consequence}>{bridge.consequence}</p>

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onMove(bridge)}
          disabled={isSaving}
        >
          Moverlo a las {bridge.proposedTimeLabel}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDismiss(bridge)}
          disabled={isSaving}
        >
          Dejarlo como está
        </Button>
      </div>

      <p className={styles.deviceNote}>
        Esto solo cambia tu plantilla: los días que ya tienes armados se quedan como están.
      </p>
    </Card>
  )
}
