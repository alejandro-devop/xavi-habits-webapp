import { Link } from 'react-router'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { VidaDayPlanDot } from '@/features/vida/hooks/useVidaWeekPlans'
import type { DayStripDay } from '@/features/vida/utils/vida-window.utils'
import styles from './VidaDayStrip.module.scss'

type VidaDayStripProps = {
  days: DayStripDay[]
  /** El estado del plan de cada día, por fecha. */
  plans: Record<string, VidaDayPlanDot>
  /** La frase del borde de la ventana (criterio 35). */
  edgeNote: string
  /**
   * A dónde lleva cada día. Por defecto, **a Hoy**: sin esta prop la tira se
   * comporta exactamente como en `VidaHoyPage`. La revisión le pasa
   * `vidaPaths.revisionForDate` para quedarse en su pantalla (FEAT-006, A3).
   *
   * Es una prop y no un componente nuevo a propósito: dos tiras se
   * desincronizarían.
   */
  basePath?: (date: string) => string
}

/**
 * La tira de siete días de arriba de Hoy: es lo que permite **planear con
 * antelación** (criterio 31).
 *
 * Cada día es un **enlace** a `?d=YYYY-MM-DD`, no un botón: así el «atrás» del
 * navegador, abrir en otra pestaña y recargar salen gratis (criterio 34), y la
 * ruta sigue siendo `vidaPaths.hoy`, con su píldora encendida.
 *
 * Bajo cada uno, un **punto**: rayado si ese día tiene plan, vacío si no
 * (criterio 32). El punto es decorativo —los lectores de pantalla leen el
 * `aria-label` del enlace, que dice lo mismo con palabras—: una diferencia de
 * relleno no se oye.
 *
 * **El borde de la ventana no es un botón muerto** (criterio 35): no hay
 * flechas de «semana anterior/siguiente» que no lleven a ninguna parte; hay una
 * línea que dice hasta dónde se planea.
 */
export function VidaDayStrip({
  days,
  plans,
  edgeNote,
  basePath = vidaPaths.hoyForDate,
}: VidaDayStripProps) {
  return (
    <nav className={styles.root} aria-label="Elige el día">
      <ul className={styles.days}>
        {days.map((day) => {
          const plan = plans[day.date]
          const hasPlan = plan?.hasPlan ?? false
          // **Un día cuya consulta falló no afirma «sin plan»**: el punto se
          // marca aparte y lo que se oye lo dice con palabras. Era el hallazgo
          // 1 de la revisión de la tajada 4; en la semana llegó a poder
          // machacar un plan, aquí solo mentía.
          const state = plan?.isError
            ? 'error'
            : plan?.isPending
              ? 'pending'
              : hasPlan
                ? 'plan'
                : 'empty'
          const planLabel = plan?.isError
            ? 'no pudimos cargar su plan'
            : plan?.isPending
              ? 'cargando su plan'
              : hasPlan
                ? `con plan, ${plan?.blockCount ?? 0} ${plan?.blockCount === 1 ? 'bloque' : 'bloques'}`
                : 'sin plan todavía'

          return (
            <li className={styles.day} key={day.date}>
              <Link
                to={basePath(day.date)}
                className={styles.link}
                data-selected={day.isSelected ? 'true' : undefined}
                data-today={day.isToday ? 'true' : undefined}
                data-past={day.isPast ? 'true' : undefined}
                aria-current={day.isSelected ? 'page' : undefined}
                aria-label={`${day.longLabel} ${day.dayOfMonth}${day.isToday ? ', hoy' : ''} · ${planLabel}`}
              >
                <span className={styles.weekday}>{day.isToday ? 'Hoy' : day.weekdayLabel}</span>
                <span className={styles.number}>{day.dayOfMonth}</span>
                <span className={styles.dot} data-state={state} aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
      <p className={styles.edge}>{edgeNote}</p>
    </nav>
  )
}
