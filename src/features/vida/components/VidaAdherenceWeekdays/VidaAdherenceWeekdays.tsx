import type { AdherenceWeekday } from '@/features/vida/utils/vida-adherence.utils'
import styles from './VidaAdherenceWeekdays.module.scss'

type VidaAdherenceWeekdaysProps = {
  weekdays: AdherenceWeekday[]
  /** «5 semanas»: de cuántas habla la rejilla. */
  weeksLabel: string
  /** El pie: el día que más se parece, y el umbral de las tres semanas. */
  note: string[]
}

/**
 * **Por día de la semana** (criterio 69): siete casillas, L a D.
 *
 * Una casilla con **tres semanas o más** con plan enseña su fracción («9/10»).
 * Por debajo **no enseña un promedio de dos datos disfrazado de costumbre**:
 * dice cuántas semanas lleva («2 sem»), y el pie explica que a partir de tres
 * se puede hablar de ese día. Un día que **nunca** se ha planeado dice lo
 * mismo —«0 sem»—, nunca «0/0», que se leería como un resultado.
 *
 * La letra es decorativa: lo que se oye es el nombre del día entero.
 */
export function VidaAdherenceWeekdays({ weekdays, weeksLabel, note }: VidaAdherenceWeekdaysProps) {
  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <h3 className={styles.title}>Por día de la semana</h3>
        <span className={styles.weeks}>{weeksLabel}</span>
      </div>

      <ul className={styles.grid} aria-label="Por día de la semana">
        {weekdays.map((weekday) => (
          <li className={styles.cell} key={weekday.day} data-enough={weekday.hasEnough ? 'true' : undefined}>
            <span className={styles.letter} aria-hidden>
              {weekday.shortLabel}
            </span>
            <span className={styles.value} aria-hidden>
              {weekday.fractionLabel ?? weekday.waitingLabel}
            </span>
            <span className={styles.srOnly}>
              {weekday.longLabel}:{' '}
              {weekday.hasEnough
                ? `${weekday.followedCount} de ${weekday.plannedCount} bloques seguidos`
                : `${weekday.weeksWithPlan} ${
                    weekday.weeksWithPlan === 1 ? 'semana' : 'semanas'
                  } con plan`}
            </span>
          </li>
        ))}
      </ul>

      {note.map((line) => (
        <p className={styles.note} key={line}>
          {line}
        </p>
      ))}
    </div>
  )
}
