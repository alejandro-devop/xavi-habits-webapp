import type { ReactNode } from 'react'
import type { VidaAdherence } from '@/features/vida/utils/vida-adherence.utils'
import styles from './VidaAdherenceSummary.module.scss'

type VidaAdherenceSummaryProps = {
  adherence: VidaAdherence
  /**
   * **Lo que ya se sabe** (criterio 84, marco F): va **entre** la línea de
   * datos y «Lo que llega después», porque el render pone primero lo que hay y
   * después lo que falta. Sin esto, «lo que llega después» quedaría encima de
   * la única tarjeta útil de la pantalla.
   */
  children?: ReactNode
}

/**
 * **La cabecera de «Lo que se repite»** (criterios 65, 66 y 71).
 *
 * Tres cosas y ninguna más: la frase de adherencia —como mucho dos, y la
 * segunda solo si la serie sube—, la línea que dice **de cuántos datos habla y
 * qué se deja fuera**, y, cuando todavía no hay bastante, **lo que llega
 * después** con el umbral dicho en claro y cuánto falta, con fechas de verdad.
 *
 * El componente **no decide nada ni compone ninguna cifra**: todo llega escrito
 * desde `buildAdherence`. Es la regla que hereda de `VidaReviewBridge`.
 *
 * Lo importante aquí es lo que **no** hay: ni una pantalla vacía que diga
 * «vuelve en tres semanas», ni una barra a cero, ni una frase que empuje a
 * planear más.
 */
export function VidaAdherenceSummary({ adherence, children }: VidaAdherenceSummaryProps) {
  return (
    <div className={styles.root}>
      <h3 className={styles.title}>Tu adherencia</h3>

      {adherence.headline.map((sentence) => (
        <p className={styles.headline} key={sentence}>
          {sentence}
        </p>
      ))}

      <p className={styles.note}>{adherence.dataNote}</p>

      {children}

      {adherence.waiting.length > 0 ? (
        <div className={styles.waiting}>
          <h4 className={styles.waitingTitle}>Lo que llega después</h4>
          <ul className={styles.waitingList}>
            {adherence.waiting.map((row) => (
              <li className={styles.waitingRow} key={row.title}>
                <span className={styles.waitingName}>{row.title}</span>
                <span className={styles.waitingWhen}>
                  {row.thresholdLabel} · {row.missingLabel}
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.waitingNote}>{adherence.waitingNote}</p>
        </div>
      ) : null}
    </div>
  )
}
