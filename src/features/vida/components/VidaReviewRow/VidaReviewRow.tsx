import type { CSSProperties } from 'react'
import type { ReviewOffPlanRow, ReviewRow } from '@/features/vida/utils/vida-review.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaReviewRow.module.scss'

type VidaReviewRowProps = {
  row: ReviewRow
  /**
   * El plan en **trazo fantasma** del marco E: el día no tuvo registros, así
   * que no se afirma nada de cada bloque (criterio 19). Los «Lo hice» de esas
   * filas son de la tajada 3.
   */
  isGhost?: boolean
}

function colorStyleOf(color: string | null): CSSProperties | undefined {
  return color ? ({ '--vida-category-color': color } as CSSProperties) : undefined
}

/**
 * **Un renglón de plan frente a real** (criterios 13, 14 y 17).
 *
 * Anatomía calcada de `VidaAgendaBlock`: cápsula con el icono y el color de la
 * categoría —que **ya viaja dentro del plan del día**, sin consulta extra—, el
 * nombre, y dos columnas: **Planeado** («7:00 · 15 min») y **Real** («7:04 ·
 * 14 min · ✓ calcado»).
 *
 * **Ni una etiqueta se escribe aquí.** Las compone `describeBlockExecution` en
 * `vida-execution.utils.ts`, que es la misma que las pinta durante el día: si
 * alguna cambiara, cambiaría en las dos pantallas a la vez (criterio 13).
 *
 * Un bloque **«no se pudo»** se lee igual que los demás —sin rojo y sin
 * esconderse— con su razón entre comillas; sin razón, se lee «sin razón» y
 * nada más (criterio 14). Un **movido** aparece **una sola vez**, en su fila de
 * plan, con «movido · 40 min tarde» (criterio 17).
 */
export function VidaReviewRow({ row, isGhost = false }: VidaReviewRowProps) {
  return (
    <li
      className={styles.row}
      style={colorStyleOf(row.color)}
      data-ghost={isGhost ? '' : undefined}
      data-real={row.real.kind}
      id={`review-${row.id}`}
    >
      <span className={styles.capsule} aria-hidden>
        <AppIcon name={row.icon} size="sm" decorative />
      </span>
      <div className={styles.body}>
        <p className={styles.name}>{row.title}</p>
        <div className={styles.columns}>
          <p className={styles.planned}>
            <span className={styles.srOnly}>Planeado: </span>
            {row.plannedTimeLabel} · {row.plannedDurationLabel}
          </p>
          <p className={styles.real}>
            <span className={styles.srOnly}>Real: </span>
            {row.real.kind === 'matched' || row.real.kind === 'moved' ? (
              <>
                {row.real.timeLabel} · {row.real.durationLabel}
                {row.real.tags.map((tag) => (
                  <span className={styles.tag} data-kind={tag.kind} key={tag.label}>
                    {tag.label}
                  </span>
                ))}
              </>
            ) : row.real.kind === 'missing' ? (
              <>
                <span className={styles.missing}>{row.real.label}</span>
                {row.real.reason ? (
                  <span className={styles.reason}>«{row.real.reason}»</span>
                ) : row.real.withoutReason ? (
                  <span className={styles.reason}>sin razón</span>
                ) : null}
              </>
            ) : (
              <span className={styles.pending}>{isGhost ? 'sin registro' : '—'}</span>
            )}
          </p>
        </div>
      </div>
    </li>
  )
}

type VidaReviewOffPlanRowProps = {
  row: ReviewOffPlanRow
}

/**
 * **Una sesión que no es de ningún bloque** (criterio 16): la misma anatomía,
 * con la columna de plan vacía —un guion, no un hueco mudo— y la etiqueta
 * *fuera del plan* que compone `vida-execution.utils.ts`.
 */
export function VidaReviewOffPlanRow({ row }: VidaReviewOffPlanRowProps) {
  return (
    <li className={styles.row} style={colorStyleOf(row.color)} data-real="off-plan" id={row.id}>
      <span className={styles.capsule} aria-hidden>
        <AppIcon name={row.icon} size="sm" decorative />
      </span>
      <div className={styles.body}>
        <p className={styles.name}>{row.title}</p>
        <div className={styles.columns}>
          <p className={styles.planned}>
            <span className={styles.srOnly}>Planeado: </span>—
          </p>
          <p className={styles.real}>
            <span className={styles.srOnly}>Real: </span>
            {row.timeLabel} · {row.durationLabel}
            <span className={styles.tag} data-kind="off-plan">
              {row.label}
            </span>
          </p>
        </div>
      </div>
    </li>
  )
}
