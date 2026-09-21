import type { NoDataSlice } from '@/features/vida/utils/vida-execution.utils'
import styles from './VidaReviewNoDataList.module.scss'

type VidaReviewNoDataListProps = {
  slices: NoDataSlice[]
  /** **«¿Qué pasó?»**: abre la hoja con la hora y la duración del tramo puestas. */
  onAsk?: (slice: NoDataSlice) => void
  /** **«Dejarlo así»**: ese tramo no vuelve a preguntar en este aparato. */
  onLeaveIt?: (slice: NoDataSlice) => void
  /** Qué tramos ya recibieron un «dejarlo así» — el **mismo** store que Hoy. */
  isDismissed?: (slice: NoDataSlice) => boolean
}

/**
 * **Los tramos más largos sin registrar** (criterios 31, 32 y 38).
 *
 * Cada uno con su franja («10:32 – 13:05») y su tamaño («2h 33»), de mayor a
 * menor. Son los mismos tramos de Hoy, con **el mismo umbral**
 * (`VIDA_NO_DATA_MIN_MINUTES`): aquí no se calcula ninguno.
 *
 * Si la lista viene **vacía**, esto devuelve `null` y no se pinta nada: no se
 * escribe «no hay tramos» ni se rellena con tramos menores (criterio 32).
 *
 * **Desde la tajada 3 cada tramo tiene sus dos salidas**, las mismas de Hoy y
 * con **el mismo peso visual** —misma `className`, ninguna destacada—:
 * **«¿Qué pasó?»**, que abre la hoja de registrar con la hora del tramo ya
 * puesta, y **«Dejarlo así»**, que es una respuesta y no una evasiva. Molde
 * exacto: `VidaAgendaNoData`. Tras dejarlo así el tramo **sigue aquí y sigue
 * siendo sin registrar**: lo único que cambia es que ya no pregunta, y eso se
 * recuerda **en este aparato**.
 */
export function VidaReviewNoDataList({
  slices,
  onAsk,
  onLeaveIt,
  isDismissed,
}: VidaReviewNoDataListProps) {
  if (slices.length === 0) return null
  return (
    <ol className={styles.list}>
      {slices.map((slice) => {
        const dismissed = isDismissed?.(slice) ?? false
        const canAsk = slice.canAsk && !dismissed && Boolean(onAsk || onLeaveIt)
        return (
          <li className={styles.row} key={slice.id} data-dismissed={dismissed ? '' : undefined}>
            <span className={styles.range}>{slice.rangeLabel}</span>
            <span className={styles.duration}>{slice.durationLabel}</span>
            {dismissed ? <span className={styles.left}>Lo dejaste así.</span> : null}
            {canAsk ? (
              <span className={styles.actions}>
                {onAsk ? (
                  <button type="button" className={styles.action} onClick={() => onAsk(slice)}>
                    ¿Qué pasó?
                  </button>
                ) : null}
                {onLeaveIt ? (
                  <button type="button" className={styles.action} onClick={() => onLeaveIt(slice)}>
                    Dejarlo así
                  </button>
                ) : null}
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
