import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { DayAgenda, DayBudget } from '@/features/vida/utils/vida-agenda.utils'
import type { ExecutedBudget } from '@/features/vida/utils/vida-execution.utils'
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
  /**
   * El presupuesto de lo vivido (FEAT-004, tajada 2). Con `form: 'planned'`
   * —que es lo que devuelve un día sin nada registrado— se pinta **igual que en
   * FEAT-003**: es el criterio 29.
   */
  executed?: ExecutedBudget | null
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
 * **Desde FEAT-004 (tajada 2) la barra tiene tres formas y no se mezclan** (D5,
 * criterio 24):
 *
 * - Día **sin nada registrado**: planeado · libre, exactamente como en F2. Es
 *   lo que pide el criterio 29, y por eso `executed` es opcional.
 * - Día **en marcha**: hecho · en marcha · planeado · libre.
 * - Día **cerrado** (pasada la hora de fin, o cualquier día pasado): seguido ·
 *   de más · fuera del plan · sin dato.
 *
 * Los anchos los calcula `getExecutedBudget`, no este componente: aquí solo se
 * traducen minutos a `width`, igual que hacía F2. Y el cambio de una forma a la
 * otra **se explica con una línea** (criterio 25): la barra no cambia de
 * colores en silencio.
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
  executed = null,
}: VidaDayBudgetProps) {
  const dayMinutes = Math.max(1, budget.dayMinutes)
  // Las dos formas de D5 solo aparecen cuando hay algo registrado: con la
  // forma `planned` esto es exactamente la barra de FEAT-003 (criterio 29).
  const hasExecuted = executed !== null && executed.form !== 'planned'

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

      {/* `data-form` no es decoración: **«hecho» y «planeado» son el mismo
          mint si no se distinguen por forma**, y el criterio 62 pide que los
          cuatro tramos de cada leyenda se distingan entre sí. Con el día en
          marcha, lo que queda por delante baja a media fuerza; en la forma de
          F2 —planeado · libre— el planeado sigue siendo el de FEAT-003. */}
      <div className={styles.track} data-form={executed?.form ?? 'planned'} aria-hidden>
        {/* `trackMinutes` y no `durationMinutes`: con dos bloques pisados la
            suma de duraciones rebasa el 100 % y la barra se sale. La marca de
            «ahora» no es un tramo: se pinta aparte, con `left`.

            Con algo registrado, los tramos salen de `getExecutedBudget`, que
            parte el día por los bordes de todo lo que hay y clasifica cada
            trocito **una vez**: por eso suman el 100 % también con sesiones
            solapadas (criterio 26). */}
        {hasExecuted
          ? executed!.segments.map((segment) => (
              <span
                key={segment.id}
                className={styles.segment}
                data-kind={segment.kind}
                style={{
                  width: `${(segment.trackMinutes / Math.max(1, executed!.dayMinutes)) * 100}%`,
                }}
              />
            ))
          : agenda.entries
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
          copiar. Es lo que sostiene el criterio 14 de F2 y el 24 de F3: cada
          tramo **con sus minutos**, y ninguno en cero. */}
      <ul className={styles.legend} data-form={executed?.form ?? 'planned'}>
        {hasExecuted ? (
          executed!.legend.map((item) => (
            <li key={item.kind} className={styles.legendItem} data-kind={item.kind}>
              <span className={styles.dot} aria-hidden />
              {item.label} {formatDurationFromMinutes(item.minutes)}
            </li>
          ))
        ) : (
          <>
            <li className={styles.legendItem} data-kind="planned">
              <span className={styles.dot} aria-hidden />
              planeado {formatDurationFromMinutes(budget.plannedMinutes)}
            </li>
            <li className={styles.legendItem} data-kind="free">
              <span className={styles.dot} aria-hidden />
              libre {formatDurationFromMinutes(budget.freeMinutes)}
            </li>
          </>
        )}
      </ul>

      {/* La barra **no cambia de colores en silencio** (criterio 25): cuando el
          día se cierra, una línea lo dice. */}
      {hasExecuted && executed!.note ? <p className={styles.formNote}>{executed!.note}</p> : null}

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
