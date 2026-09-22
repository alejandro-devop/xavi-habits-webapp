import { Link } from 'react-router'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { WeekRow } from '@/features/vida/utils/vida-week-review.utils'
import styles from './VidaReviewWeek.module.scss'

type VidaReviewWeekProps = {
  rows: WeekRow[]
  /** A dónde lleva cada fila. Por defecto, **la revisión de ese día** (49). */
  basePath?: (date: string) => string
}

/** Los cuatro tramos, con el **mismo significado** que la barra de Hoy (48). */
const LEGEND: { kind: string; label: string }[] = [
  { kind: 'followed', label: 'seguido' },
  { kind: 'over', label: 'de más' },
  { kind: 'off-plan', label: 'fuera del plan' },
  { kind: 'no-data', label: 'sin registrar' },
]

/**
 * **La semana de lo real**: siete filas, una por día (criterios 46–49).
 *
 * Cada fila lleva el día y su número, el titular —«6 de 8», «Hoy · aún
 * abierto», «Planeado · 3 bloques» o «Sin plan»—, la **barrita del día** con
 * sus cuatro tramos y los minutos **registrados de planeados**. Un día del que
 * no hay dato dice **«—»**, nunca «0» (criterio 47).
 *
 * **Cada fila es un enlace**, no un botón: así el «atrás» del navegador, abrir
 * en otra pestaña y recargar salen gratis, igual que en `VidaDayStrip`. La
 * barra es decorativa (`aria-hidden`) porque lo que dice ya está escrito en el
 * titular y en los minutos: un lector de pantalla no oye un ancho.
 *
 * Un día **cuya consulta falló lo dice** y no se pinta con la barra entera en
 * «sin registrar» (criterio 52): afirmar que no se registró nada sería afirmar
 * lo que no se sabe.
 *
 * Molde: `VidaSemanaPage.tsx` (las filas de la semana de planear) y
 * `VidaDayBudget` (los colores de los tramos, que son los mismos y por eso se
 * leen igual en las dos pantallas).
 */
export function VidaReviewWeek({ rows, basePath = vidaPaths.revisionForDate }: VidaReviewWeekProps) {
  return (
    <div className={styles.root}>
      {/* «Día a día», como el render: el nombre de la lista es lo que separa
          estas siete filas de los siete enlaces de la tira, que dicen cosas
          parecidas en voz alta. */}
      <ol className={styles.rows} aria-label="Día a día">
        {rows.map((row) => (
          <li className={styles.row} key={row.date}>
            <Link
              to={basePath(row.date)}
              className={styles.link}
              data-selected={row.isSelected ? 'true' : undefined}
              data-today={row.isToday ? 'true' : undefined}
              data-status={row.status}
              aria-current={row.isSelected ? 'page' : undefined}
              aria-label={`${row.longLabel} ${row.dayOfMonth} · ${row.headline} · ${
                row.registeredLabel === '—'
                  ? 'sin dato registrado'
                  : `${row.registeredLabel} registrados`
              } de ${row.plannedLabel === '—' ? 'nada planeado' : `${row.plannedLabel} planeados`}`}
            >
              <span className={styles.day}>
                <span className={styles.weekday}>{row.weekdayLabel}</span>
                <span className={styles.number}>{row.dayOfMonth}</span>
              </span>
              <span className={styles.mid}>
                <span className={styles.headline}>{row.headline}</span>
                {row.segments.length > 0 ? (
                  <span className={styles.track} aria-hidden>
                    {row.segments.map((segment, index) => (
                      <span
                        className={styles.segment}
                        key={`${row.date}-${segment.kind}-${index}`}
                        data-kind={segment.kind}
                        style={{ width: `${segment.percent}%` }}
                      />
                    ))}
                  </span>
                ) : null}
              </span>
              <span className={styles.minutes}>
                <b className={styles.registered}>{row.registeredLabel}</b>
                {/* De un día que no se pudo leer no se dice «de —»: no se
                    sabe ni lo registrado ni lo planeado, y se calla entero. */}
                {row.status === 'error' || row.status === 'pending' ? null : (
                  <span className={styles.planned}>de {row.plannedLabel}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <ul className={styles.legend}>
        {LEGEND.map((item) => (
          <li className={styles.legendItem} key={item.kind}>
            <span className={styles.swatch} data-kind={item.kind} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
