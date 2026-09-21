import type { ReactNode } from 'react'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import { VIDA_DAY_LABELS } from '@/features/vida/utils/vida-date.utils'
import {
  describeTemplateDayTotals,
  type TemplateDay,
} from '@/features/vida/utils/vida-template.utils'
import {
  formatDurationFromMinutes,
  formatTimeForDisplay,
} from '@/features/vida/utils/vida-time.utils'
import { Button } from '@/shared/ui/Button'
import styles from './VidaTemplateDaySummary.module.scss'

type VidaTemplateDaySummaryProps = {
  day: TemplateDay
  /** La frase compuesta con reglas (`buildTemplateGuidance`), criterio 5. */
  guidance: string
  dayStart: string
  dayEnd: string
  /** El horario es el respaldo del cliente, no una elección del usuario. */
  isDefaultSchedule: boolean
  /**
   * Los atajos del día, **opcionales y aditivos** (tajada 4): «Copiar este día
   * a otros» y «Ver la semana entera», que en el render viven justo debajo de
   * la frase de guía (marco A). Sin ellos el resumen es exactamente el de la
   * tajada 1.
   */
  actions?: ReactNode
}

/**
 * El resumen del día tipo: «Viernes · 3h 40 puestas de 16h 30», la barra del
 * día entero y la frase de guía (criterios 4 y 5).
 *
 * Molde: `VidaDayBudget` (FEAT-003/004), del que hereda **las dos reglas que
 * importan** —la barra es `aria-hidden` y la leyenda escribe los minutos como
 * **texto real**, que es la «tabla oculta» de la barra—. No se reutiliza aquel
 * componente (decisión A2): está atado a `DayAgenda` + `DayBudget` +
 * `ExecutedBudget` y dice «te quedan 3h 40 **hasta las 23:00**», y en una
 * plantilla no hay ni «ahora» ni tiempo restante: hay «puestas de». La
 * duplicación queda acotada al JSX; **la aritmética entera vive una sola vez**
 * en `vida-template.utils.ts`.
 */
export function VidaTemplateDaySummary({
  day,
  guidance,
  dayStart,
  dayEnd,
  isDefaultSchedule,
  actions,
}: VidaTemplateDaySummaryProps) {
  const label = VIDA_DAY_LABELS[day.day]
  const totals = describeTemplateDayTotals(day)
  const dayMinutes = Math.max(1, day.dayMinutes)

  return (
    <section className={styles.root} aria-labelledby="vida-template-summary-heading">
      <div className={styles.head}>
        <h2 className={styles.heading} id="vida-template-summary-heading">
          {label}
        </h2>
        <p className={styles.totals}>
          <strong className={styles.value}>{totals.plannedLabel}</strong> puestas de{' '}
          {totals.dayLabel}
        </p>
      </div>

      {/* Los anchos salen de `segments`, que ya vienen con `trackMinutes`: dos
          ítems pisados no hacen que la barra rebase el 100 % (criterio 4). */}
      <div className={styles.track} aria-hidden>
        {day.segments.map((segment) => (
          <span
            key={segment.id}
            className={styles.segment}
            data-kind={segment.kind}
            style={{ width: `${(segment.trackMinutes / dayMinutes) * 100}%` }}
          />
        ))}
      </div>

      {/* La «tabla» de la barra: los minutos como texto que se lee y se copia. */}
      <ul className={styles.legend}>
        <li className={styles.legendItem} data-kind="planned">
          <span className={styles.dot} aria-hidden />
          puesto {formatDurationFromMinutes(day.plannedMinutes)}
        </li>
        <li className={styles.legendItem} data-kind="free">
          <span className={styles.dot} aria-hidden />
          libre {formatDurationFromMinutes(day.freeMinutes)}
        </li>
      </ul>

      <p className={styles.guidance}>{guidance}</p>

      {actions ? <div className={styles.actions}>{actions}</div> : null}

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
