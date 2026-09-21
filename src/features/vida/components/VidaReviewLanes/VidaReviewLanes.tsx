import type { CSSProperties } from 'react'
import type { ReviewLaneRow } from '@/features/vida/utils/vida-review.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaReviewLanes.module.scss'

type VidaReviewLanesProps = {
  rows: ReviewLaneRow[]
}

function colorStyleOf(color: string | null): CSSProperties | undefined {
  return color ? ({ '--vida-category-color': color } as CSSProperties) : undefined
}

/**
 * **Los dos carriles alineados por hora** del marco D (criterio 22).
 *
 * Tres columnas —hora · plan · real— y **una fila por borde de tiempo**. Las
 * filas las proyecta `buildReviewLanes` desde `execution.entries`, que es el
 * mismo recorrido de reloj que pinta la agenda de Hoy: aquí no se calcula
 * nada, solo se coloca en dos columnas (A2).
 *
 * Lo que enseña cada carril:
 *
 * - el **plan quieto en su columna**, en su hora, pase lo que pase;
 * - lo **fuera del plan** en la columna real **sin nada enfrente**;
 * - el **movido** como sombra a su hora planeada («→ hecho a las 19:40») y su
 *   tarjeta real donde ocurrió — **una sola tarjeta real** (criterio 17);
 * - los tramos **sin registrar** ocupando su sitio, con su tamaño de verdad:
 *   el alto crece con los minutos, acotado para que dos horas no se coman la
 *   pantalla.
 *
 * Es **solo de escritorio**: la página lo monta cuando hay ancho, y en el móvil
 * monta la lista compacta. Las dos salen de la misma derivación, así que no se
 * pueden contradecir.
 */
export function VidaReviewLanes({ rows }: VidaReviewLanesProps) {
  return (
    <div className={styles.root}>
      <p className={styles.head} aria-hidden>
        <span className={styles.headTime} />
        <span>Planeado</span>
        <span>Real</span>
      </p>
      <ol className={styles.rows}>
        {rows.map((row) => (
          <li className={styles.row} key={row.id}>
            <time className={styles.time}>{row.timeLabel}</time>

            <div className={styles.lane}>
              {row.plan ? (
                <article
                  className={styles.card}
                  style={colorStyleOf(row.plan.color)}
                  data-shadow={row.plan.isShadow ? '' : undefined}
                >
                  <span className={styles.capsule} aria-hidden>
                    <AppIcon name={row.plan.icon} size="sm" decorative />
                  </span>
                  <span className={styles.name}>{row.plan.title}</span>
                  <span className={styles.meta}>{row.plan.durationLabel}</span>
                </article>
              ) : null}
            </div>

            <div className={styles.lane}>
              {row.real.kind === 'matched' ||
              row.real.kind === 'moved' ||
              row.real.kind === 'off-plan' ? (
                <article
                  className={styles.card}
                  style={colorStyleOf(row.real.color)}
                  data-real={row.real.kind}
                >
                  <span className={styles.capsule} aria-hidden>
                    <AppIcon name={row.real.icon} size="sm" decorative />
                  </span>
                  <span className={styles.name}>{row.real.title}</span>
                  <span className={styles.meta}>{row.real.rangeLabel}</span>
                  {row.real.tags.map((tag) => (
                    <span className={styles.tag} data-kind={tag.kind} key={tag.label}>
                      {tag.label}
                    </span>
                  ))}
                </article>
              ) : row.real.kind === 'moved-shadow' ? (
                <p className={styles.movedTo}>{row.real.label} · movido</p>
              ) : row.real.kind === 'missing' ? (
                <p className={styles.missing}>
                  {row.real.label}
                  {row.real.reason ? (
                    <span className={styles.reason}> «{row.real.reason}»</span>
                  ) : row.real.withoutReason ? (
                    <span className={styles.reason}> sin razón</span>
                  ) : null}
                </p>
              ) : row.real.kind === 'no-data' ? (
                <p
                  className={styles.noData}
                  style={{ '--vida-no-data-minutes': row.real.minutes } as CSSProperties}
                >
                  {row.real.rangeLabel} · sin registrar · <b>{row.real.durationLabel}</b>
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
