import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { DayAgenda, DayBudget } from '@/features/vida/utils/vida-agenda.utils'
import { formatDayHeading } from '@/features/vida/utils/vida-date.utils'
import {
  formatDurationFromMinutes,
  formatTimeForDisplay,
} from '@/features/vida/utils/vida-time.utils'
import { Button } from '@/shared/ui/Button'
import styles from './VidaDayBudget.module.scss'

type VidaDayBudgetProps = {
  /** `YYYY-MM-DD` local del día mostrado. */
  date: string
  dayStart: string
  dayEnd: string
  /** El horario es el respaldo del cliente, no una elección (criterio 9). */
  isDefaultSchedule: boolean
  agenda: DayAgenda
  budget: DayBudget
  /** La línea de guía ya compuesta (criterio 15). */
  guidance: string
  /** «9:24». `null` cuando el día mostrado no es hoy. */
  nowLabel: string | null
}

/**
 * El presupuesto del día: cuánto queda, cómo está repartido y una línea de guía.
 *
 * La barra se pinta como `HabitPanel` pinta sus gráficos: **la aritmética entera
 * vive en `vida-agenda.utils.ts`** y aquí solo se traducen porcentajes a
 * `width`. Y, como allí, el gráfico no es la única forma de leer el dato: la
 * leyenda escribe los minutos **como texto real** —no en un `title`—, así que
 * es la «tabla oculta» de esta barra. Por eso la barra es `aria-hidden`.
 *
 * Cuando el día ya se cerró (`remainingMinutes` en 0) **no se escribe «te
 * quedan 0m»**: se enseña el resumen de lo planeado, y la línea de guía es la
 * que dice que el día terminó. Era el hallazgo 5 del revisor.
 *
 * En F2 hay **dos tramos y nada más**: planeado y libre. Los colores de
 * ejecutado (hecho · en marcha · seguido · de más · fuera del plan · sin dato)
 * que dibuja el render son F3 (criterios 14 y 22).
 */
export function VidaDayBudget({
  date,
  dayStart,
  dayEnd,
  isDefaultSchedule,
  agenda,
  budget,
  guidance,
  nowLabel,
}: VidaDayBudgetProps) {
  const dayMinutes = Math.max(1, budget.dayMinutes)

  return (
    <section className={styles.root} aria-labelledby="vida-budget-heading">
      <div className={styles.head}>
        <h2 className={styles.heading} id="vida-budget-heading">
          <span className={styles.day}>{formatDayHeading(date)}</span>
          {nowLabel ? <span className={styles.clock}> · {nowLabel}</span> : null}
        </h2>
        {budget.remainingMinutes !== null && budget.remainingMinutes > 0 ? (
          <p className={styles.remaining}>
            te quedan{' '}
            <strong className={styles.remainingValue}>
              {formatDurationFromMinutes(budget.remainingMinutes)}
            </strong>{' '}
            hasta las {formatTimeForDisplay(dayEnd)}
          </p>
        ) : (
          <p className={styles.remaining}>
            planeado{' '}
            <strong className={styles.remainingValue}>
              {formatDurationFromMinutes(budget.plannedMinutes)}
            </strong>{' '}
            de {formatDurationFromMinutes(budget.dayMinutes)}
          </p>
        )}
      </div>

      <div className={styles.track} aria-hidden>
        {/* `trackMinutes` y no `durationMinutes`: con dos bloques pisados la
            suma de duraciones rebasa el 100 % y la barra se sale. La marca de
            «ahora» no es un tramo: se pinta aparte, con `left`. */}
        {agenda.entries
          .filter((entry) => entry.kind !== 'now')
          .map((entry) => (
            <span
              key={entry.id}
              className={styles.segment}
              data-kind={entry.kind === 'block' ? 'planned' : 'free'}
              style={{ width: `${(entry.trackMinutes / dayMinutes) * 100}%` }}
            />
          ))}
        {budget.nowPercent !== null ? (
          <span className={styles.nowMark} style={{ left: `${budget.nowPercent}%` }} />
        ) : null}
      </div>

      {/* La «tabla» de la barra: los minutos, como texto que se puede leer y
          copiar. Es lo que sostiene el criterio 14. */}
      <ul className={styles.legend}>
        <li className={styles.legendItem} data-kind="planned">
          <span className={styles.dot} aria-hidden />
          planeado {formatDurationFromMinutes(budget.plannedMinutes)}
        </li>
        <li className={styles.legendItem} data-kind="free">
          <span className={styles.dot} aria-hidden />
          libre {formatDurationFromMinutes(budget.freeMinutes)}
        </li>
      </ul>

      <p className={styles.guidance}>{guidance}</p>

      <p className={styles.schedule}>
        Tu día · {formatTimeForDisplay(dayStart)} → {formatTimeForDisplay(dayEnd)}
        {isDefaultSchedule ? (
          <>
            {' '}
            <span className={styles.scheduleNote}>(el horario por defecto)</span>{' '}
            <Button variant="ghost" size="sm" to={vidaPaths.ajustes}>
              Cambiarlo
            </Button>
          </>
        ) : null}
      </p>
    </section>
  )
}
