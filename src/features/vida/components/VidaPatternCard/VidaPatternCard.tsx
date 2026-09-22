import type { CSSProperties } from 'react'
import type { VidaPatternView } from '@/features/vida/hooks/useVidaPatterns'
import type { VidaPatternSuggestion } from '@/features/vida/utils/vida-patterns.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import styles from './VidaPatternCard.module.scss'

type VidaPatternCardProps = {
  pattern: VidaPatternView
  /** La salida afirmativa: **un `vidaItemUpdate`**, nunca un día armado. */
  onApply: (suggestion: VidaPatternSuggestion) => void
  /** «Dejarlo»: no llama a nadie, se guarda en el aparato (criterio 82). */
  onDismiss: (suggestion: VidaPatternSuggestion) => void
  isSaving?: boolean
  /** Lo que pasó cuando ya se aplicó: la tarjeta deja de preguntar. */
  appliedLabel?: string | null
}

function colorStyleOf(color: string | null): CSSProperties | undefined {
  return color ? ({ '--vida-category-color': color } as CSSProperties) : undefined
}

/**
 * **Una actividad, contada igual que todas las demás** (criterios 74–81).
 *
 * El orden es fijo y es el del render: lo que dice la plantilla, a qué hora
 * sueles empezar, cuánto suele llevarte, la mini-fila L M X J V S D con el
 * desfase de cada día, el pie con **cuántas veces de cuántas** se siguió, y al
 * final una de tres cosas —y solo una—:
 *
 * 1. **«Esto pasa como lo planeaste. Aquí no hay nada que proponer.»** Es la
 *    tarjeta que demuestra que esto no es una lista de correcciones, y por eso
 *    no lleva ni un botón (criterio 77). Cuando **no hay patrón del que hablar**
 *    —planeada varias veces y ninguna registrada— la frase es otra, la de
 *    `closingLabel`: decirlo, no fingir que va clavado.
 * 2. **Una pregunta con dos salidas escritas**, la afirmativa con el número
 *    dentro y «Dejarlo» al lado, con **la consecuencia a la vista antes** de
 *    tocar nada (criterios 78 y 80). Ninguna es `danger`: ese `variant` no se
 *    lee en tema oscuro.
 * 3. **Lo que se contestó**, con la fecha en la que la pregunta vuelve. Nada
 *    desaparece a escondidas (D1, criterio 99).
 *
 * El componente **no decide ni compone ninguna cifra**: todo llega escrito
 * desde `buildActivityPatterns`. Es la regla que hereda de `VidaReviewBridge`.
 */
export function VidaPatternCard({
  pattern,
  onApply,
  onDismiss,
  isSaving = false,
  appliedLabel = null,
}: VidaPatternCardProps) {
  const suggestion = pattern.suggestion

  return (
    <Card className={styles.root} padding="md" style={colorStyleOf(pattern.color)}>
      <div className={styles.head}>
        <span className={styles.capsule} aria-hidden>
          <AppIcon name={pattern.icon} size="sm" decorative />
        </span>
        <div className={styles.headBody}>
          <p className={styles.name}>{pattern.title}</p>
          <p className={styles.template}>{pattern.templateLabel}</p>
        </div>
      </div>

      <dl className={styles.lines}>
        {[pattern.startLine, pattern.durationLine, pattern.dayLine].map((line) =>
          line ? (
            <div className={styles.line} key={line.label}>
              <dt className={styles.lineLabel}>{line.label}</dt>
              <dd className={styles.lineValue}>
                <b>{line.valueLabel}</b>
                <span className={line.isSettled ? styles.tagSettled : styles.tag}>
                  {line.offsetLabel}
                </span>
              </dd>
            </div>
          ) : null,
        )}
      </dl>

      <ul className={styles.week}>
        {pattern.weekdayCells.map((cell) => (
          <li
            className={cell.hasData ? styles.cell : styles.cellEmpty}
            key={cell.day}
            style={
              cell.hasData ? ({ '--vida-cell-weight': cell.weight } as CSSProperties) : undefined
            }
          >
            <span className={styles.cellDay} aria-hidden>
              {cell.shortLabel}
            </span>
            <span className={styles.cellValue} aria-hidden>
              {cell.offsetLabel}
            </span>
            <span className={styles.srOnly}>{cell.srLabel}</span>
          </li>
        ))}
      </ul>

      <p className={styles.footnote}>{pattern.footnote}</p>

      {appliedLabel ? <p className={styles.done}>{appliedLabel}</p> : null}

      {/* **Una sola línea de cierre.** Una tarjeta desactivada y a la vez
          dentro de tolerancia decía dos veces que no hay nada que proponer
          (hallazgo 3 de la revisión de la tajada 2): manda `mutedReason`, que
          es la que explica **por qué** no se pregunta. */}
      {!appliedLabel && !pattern.mutedReason && pattern.settledLabel ? (
        <p className={styles.settled}>{pattern.settledLabel}</p>
      ) : null}

      {/* **Ninguna tarjeta termina muda**: si no hay pregunta y tampoco se
          puede confirmar el patrón, se dice por qué. */}
      {!appliedLabel && pattern.closingLabel ? (
        <p className={styles.settled}>{pattern.closingLabel}</p>
      ) : null}

      {!appliedLabel && pattern.mutedReason ? (
        <p className={styles.muted}>{pattern.mutedReason}</p>
      ) : null}

      {!appliedLabel && pattern.answerNote ? (
        <p className={styles.muted}>{pattern.answerNote}</p>
      ) : null}

      {!appliedLabel && suggestion ? (
        <>
          <p className={styles.ask}>{suggestion.ask}</p>
          <p className={styles.consequence}>{suggestion.consequence}</p>
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onApply(suggestion)}
              disabled={isSaving}
            >
              {suggestion.affirmativeLabel}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDismiss(suggestion)}
              disabled={isSaving}
            >
              {suggestion.dismissLabel}
            </Button>
          </div>
        </>
      ) : null}
    </Card>
  )
}
