import type { CSSProperties } from 'react'
import type { VidaPatternSuggestion } from '@/features/vida/utils/vida-patterns.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import styles from './VidaPatternAdvice.module.scss'

type VidaPatternAdviceProps = {
  /** De dónde sale el dato, antes que el dato. Va en violeta, en versales. */
  eyebrow: string
  /**
   * Icono, nombre y cifras de la actividad. Solo en el lateral de escritorio:
   * en la hoja del ítem el nombre ya está en la cabecera y repetirlo sobra.
   */
  activity?: { icon: string; title: string; color: string | null; meta: string } | null
  /** La frase, ya escrita por el derivado. Aquí no se compone ninguna cifra. */
  text: string
  /** Con ella salen **las dos salidas**; sin ella, esto es solo un dato. */
  suggestion?: VidaPatternSuggestion | null
  onApply?: (suggestion: VidaPatternSuggestion) => void
  onDismiss?: (suggestion: VidaPatternSuggestion) => void
  isSaving?: boolean
  /** Lo que ya se contestó, con la fecha en la que vuelve (D1, criterio 99). */
  note?: string | null
}

function colorStyleOf(color: string | null | undefined): CSSProperties | undefined {
  return color ? ({ '--vida-category-color': color } as CSSProperties) : undefined
}

/**
 * **El dato de tus semanas, en caja de nota al margen** (FEAT-007, tajada 4).
 *
 * Es la misma figura que dibuja el render aprobado dos veces —`.advice` bajo
 * los campos de la hoja del ítem (marco D) y `.sugg` en el lateral de
 * escritorio (marco E)—: trazo **violeta punteado**, cabecera en violeta, la
 * frase, y las dos salidas escritas cuando hay algo que proponer.
 *
 * **Por qué no es `VidaBlockHint`**, que es lo primero que hay que mirar: aquel
 * es un `<li>` con la canaleta de la hora de la agenda, se numera «1 de 2» y
 * su parche es el del día (`dayPatch`). Aquí no hay lista, no hay hora, no hay
 * cuenta, y lo que se toca es **la plantilla**. Comparten el lenguaje visual y
 * el token del violeta (`--aura-ring-to`), no el componente.
 *
 * Dos reglas heredadas de `VidaReviewBridge` y `VidaPatternCard`:
 *
 * - **Ninguna salida es `danger`** (no se lee en tema oscuro): `primary` y
 *   `secondary`, como en todo el módulo.
 * - **El componente no decide ni formatea nada.** Todo llega escrito; si la
 *   sugerencia es `null`, esto es un dato y no una pregunta, y no aparece
 *   media pregunta con un solo botón.
 */
export function VidaPatternAdvice({
  eyebrow,
  activity = null,
  text,
  suggestion = null,
  onApply,
  onDismiss,
  isSaving = false,
  note = null,
}: VidaPatternAdviceProps) {
  return (
    <section className={styles.card} aria-label={eyebrow}>
      {activity ? (
        <p className={styles.activity} style={colorStyleOf(activity.color)}>
          <span className={styles.capsule} aria-hidden>
            <AppIcon name={activity.icon} size="sm" decorative />
          </span>
          <span className={styles.activityBody}>
            <span className={styles.activityName}>{activity.title}</span>
            <span className={styles.activityMeta}>{activity.meta}</span>
          </span>
        </p>
      ) : null}

      <p className={styles.head}>{eyebrow}</p>
      <p className={styles.text}>{text}</p>

      {note ? <p className={styles.note}>{note}</p> : null}

      {suggestion ? (
        <>
          {/* La consecuencia, **antes** de los botones (criterio 80). */}
          <p className={styles.consequence}>{suggestion.consequence}</p>
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              disabled={isSaving}
              onClick={() => onApply?.(suggestion)}
            >
              {suggestion.affirmativeLabel}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={() => onDismiss?.(suggestion)}
            >
              {suggestion.dismissLabel}
            </Button>
          </div>
        </>
      ) : null}
    </section>
  )
}
