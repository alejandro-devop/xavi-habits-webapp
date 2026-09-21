import type { NoDataSlice } from '@/features/vida/utils/vida-execution.utils'
import { formatTimeForDisplay, minutesToTime } from '@/features/vida/utils/vida-time.utils'
import styles from './VidaAgendaNoData.module.scss'

type VidaAgendaNoDataProps = {
  slice: NoDataSlice
  /** **«¿Qué pasó?»**: abre la hoja con la hora y la duración ya puestas (criterio 48). */
  onAsk?: (slice: NoDataSlice) => void
  /** **«Dejarlo así»**: ese tramo no vuelve a preguntar en este aparato (criterio 49). */
  onLeaveIt?: (slice: NoDataSlice) => void
  /** Ya se dejó así: sigue siendo «sin dato», pero sin preguntar otra vez. */
  isDismissed?: boolean
}

/**
 * **Un rato ya pasado del que no se sabe nada** (criterios 47, 48 y 49).
 *
 * Se llama **«sin dato»** y nada más: ni «desperdiciado», ni «perdido», ni
 * «vacío», ni «libre» — *libre* es el futuro, *sin dato* es el pasado del que
 * no se sabe. La diferencia no es de estilo: uno describe y el otro reprocha.
 *
 * Lleva **sus horas y sus minutos**, los mismos que cuenta la barra, y —si es
 * de al menos `VIDA_NO_DATA_MIN_MINUTES`— **dos salidas igual de válidas**:
 * **«¿Qué pasó?»**, que abre la hoja de registrar con la hora y la duración del
 * tramo ya puestas, y **«Dejarlo así»**, que es una respuesta, no una evasiva.
 *
 * Tras «Dejarlo así» el tramo **sigue aquí y sigue siendo sin dato** (criterio
 * 49): no cambia de color ni desaparece. Lo único que cambia es que ya no
 * pregunta, y eso se recuerda **en este aparato** —en otro volverá a
 * preguntar—, que es la deuda de D8 y está dicha, no escondida.
 *
 * Mismo esqueleto que el bloque, el hueco y la sesión —canaleta con la hora a
 * la izquierda, tarjeta a la derecha— para que la agenda se lea de corrido.
 */
export function VidaAgendaNoData({
  slice,
  onAsk,
  onLeaveIt,
  isDismissed = false,
}: VidaAgendaNoDataProps) {
  const canAsk = slice.canAsk && !isDismissed && Boolean(onAsk || onLeaveIt)

  return (
    <li className={styles.row} data-dismissed={isDismissed ? '' : undefined}>
      <span className={styles.gutter}>
        <time className={styles.time} dateTime={minutesToTime(slice.startMinutes)}>
          {formatTimeForDisplay(minutesToTime(slice.startMinutes))}
        </time>
        <span className={styles.tick} aria-hidden />
      </span>

      <div className={styles.card}>
        <div className={styles.body}>
          <p className={styles.name}>Sin dato</p>
          <p className={styles.meta}>
            {slice.rangeLabel} · {slice.durationLabel}
          </p>
          {isDismissed ? <p className={styles.left}>Lo dejaste así.</p> : null}
        </div>

        {canAsk ? (
          <div className={styles.actions}>
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
          </div>
        ) : null}
      </div>
    </li>
  )
}
