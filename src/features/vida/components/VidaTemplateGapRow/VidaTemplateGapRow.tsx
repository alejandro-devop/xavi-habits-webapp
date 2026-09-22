import type {
  TemplateGapRow,
  TemplateUnknownRow,
} from '@/features/vida/utils/vida-template.utils'
import { templateItemTitle } from '@/features/vida/utils/vida-template.utils'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import {
  formatDurationFromMinutes,
  formatDurationMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'
import { Button } from '@/shared/ui/Button'
import styles from './VidaTemplateGapRow.module.scss'

type VidaTemplateGapRowProps = {
  /** La fila derivada por `buildTemplateDay`: un hueco o una línea de «no sabemos». */
  row: TemplateGapRow | TemplateUnknownRow

  /* ── Las salidas, **las dos opcionales** ──────────────────────────────────
   *
   * Mismo contrato que `VidaTemplateItemCard` (`:87-97`), que es el `<li>`
   * vecino en esta misma lista: **sin la prop de acción la fila es texto**;
   * con ella se pinta un `<button>` de verdad —no un `div` con `onClick`—
   * para que el teclado llegue gratis. En la tajada 1 nadie las pasa, y por
   * eso no hay nada pulsable en la lista.
   */

  /** Tajada 2: pone algo en ese hueco. Solo llega a los huecos de 15 min o más. */
  onPlace?: (row: TemplateGapRow) => void
  /** Tajada 3: «Ponerle duración» al ítem del que no se sabe dónde acaba. */
  onSetDuration?: (item: VidaItem) => void
}

/**
 * Lo que hay **entre** las cosas de la plantilla, en tres formas y un solo
 * componente —igual que `VidaAgendaGap` resuelve en un archivo su forma normal
 * y su forma fina—:
 *
 * 1. **El hueco**: «Libre 8:40 → 9:00 · 20m», con su trazo discontinuo.
 * 2. **El hueco fino** (menos de `MIN_GAP_MINUTES`): la misma frase en una
 *    línea sin caja y **sin nada que pulsar** (criterio 143). No desaparece: si
 *    desapareciera, la barra diría que hay libre donde la lista no enseña nada.
 * 3. **La línea del ítem sin duración**: no es un hueco y no se pinta como uno;
 *    dice que no se sabe dónde acaba y por eso no se puede afirmar qué queda
 *    libre (criterio 145). Es lo único de aquí que imprime un nombre de
 *    actividad, y por eso es lo único que envuelve.
 *
 * Nada de esto reprocha nada: un rato sin nada es **libre**.
 */
export function VidaTemplateGapRow({ row, onPlace, onSetDuration }: VidaTemplateGapRowProps) {
  if (row.kind === 'unknown') {
    const untilLabel = row.isDayEnd
      ? 'el final del día'
      : `las ${formatTimeForDisplay(minutesToTime(row.untilMinutes))}`

    return (
      <li className={styles.row}>
        <span className={styles.gutter} aria-hidden />
        <div className={styles.unknown}>
          <p className={styles.unknownText}>
            No sabemos cuánto dura <b>{templateItemTitle(row.item)}</b>, así que no podemos
            decir qué queda libre hasta {untilLabel}.
          </p>
          {onSetDuration ? (
            <span className={styles.unknownActions}>
              <Button type="button" variant="ghost" size="sm" onClick={() => onSetDuration(row.item)}>
                Ponerle duración
              </Button>
            </span>
          ) : null}
        </div>
      </li>
    )
  }

  const fromLabel = formatTimeForDisplay(minutesToTime(row.startMinutes))
  const toLabel = formatTimeForDisplay(minutesToTime(row.endMinutes))
  const sizeLabel = formatDurationFromMinutes(row.minutes)

  // Un resto de menos de 15 minutos se pinta con sus minutos, pero no ofrece
  // nada: no cabe una cosa ahí, y un botón muerto es peor que ninguno.
  if (row.isSliver) {
    return (
      <li className={styles.row} data-sliver="true">
        <span className={styles.gutter} aria-hidden />
        <p className={styles.sliver}>
          Libre {fromLabel} → {toLabel} · {sizeLabel}
        </p>
      </li>
    )
  }

  const label = (
    <span className={styles.label}>
      Libre{' '}
      <b>
        {fromLabel} → {toLabel}
      </b>{' '}
      · {sizeLabel}
    </span>
  )

  return (
    <li className={styles.row}>
      <span className={styles.gutter} aria-hidden />
      {onPlace ? (
        <button
          type="button"
          className={[styles.gap, styles.gapButton].join(' ')}
          // Lo que se oye dice **qué** se hace ahí, no «botón»: una lista de
          // huecos iguales necesita la hora y el tamaño en el rótulo.
          aria-label={`Poner algo a las ${fromLabel}, ${formatDurationMinutes(row.minutes)} libres`}
          onClick={() => onPlace(row)}
        >
          {label}
          <span className={styles.plus} aria-hidden>
            +
          </span>
        </button>
      ) : (
        <p className={styles.gap}>{label}</p>
      )}
    </li>
  )
}
