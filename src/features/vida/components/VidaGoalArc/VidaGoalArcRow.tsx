import type { VidaGoalArc as VidaGoalArcData } from '@/features/vida/utils/vida-goals.utils'
import { VidaGoalArc } from './VidaGoalArc'
import styles from './VidaGoalArc.module.scss'

type VidaGoalArcRowProps = {
  arcs: VidaGoalArcData[]
  /** «2 h 40 min sin dato hoy.» Cadena vacía cuando no hay ninguno. */
  noDataLabel: string
  isPastDay: boolean
}

/**
 * **Los arcos de Hoy**, en fila.
 *
 * Con **un** arco ocupa el ancho entero —el panel 1 del render aprobado, que es
 * lo único que se ve en esta feature—; con varios, la fila en pequeño del panel
 * 2. Que hoy sea uno solo **lo garantiza el dato** (una sola meta por usuario),
 * no un tope aquí dentro: un `slice(0, 1)` sería código muerto que la feature
 * siguiente tendría que quitar.
 *
 * Bajo los arcos, **lo que el arco no puede saber**: las sesiones sin categoría
 * se confiesan en su propia línea con la palabra del módulo, **sin dato**
 * (criterio 494). No es una fila de un desglose y no lleva tono de aviso: es
 * una advertencia de alcance, dicha en voz baja.
 */
export function VidaGoalArcRow({ arcs, noDataLabel, isPastDay }: VidaGoalArcRowProps) {
  if (arcs.length === 0) return null

  return (
    <section className={styles.root} data-count={arcs.length > 1 ? 'many' : 'one'}>
      <div className={styles.row}>
        {arcs.map((arc) => (
          <VidaGoalArc arc={arc} isPastDay={isPastDay} key={arc.goal.id} />
        ))}
      </div>
      {noDataLabel ? <p className={styles.noData}>{noDataLabel}</p> : null}
    </section>
  )
}
