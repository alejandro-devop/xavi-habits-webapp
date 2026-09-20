import type { CSSProperties } from 'react'
import type { ExecutionSessionEntry } from '@/features/vida/utils/vida-execution.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import { formatTimeForDisplay, minutesToTime } from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaAgendaSession.module.scss'

type VidaAgendaSessionProps = {
  entry: ExecutionSessionEntry
}

/**
 * Algo que pasó y **no es de ningún bloque del plan** (criterio 22), o lo real
 * de un bloque **movido** (criterio 23).
 *
 * Se pinta **en su hora**, en trazo punteado, con su actividad, sus horas y su
 * duración. No se descarta ni se encaja a la fuerza en un bloque: el plan se
 * queda quieto donde estaba y esto se cuenta aparte.
 *
 * Mismo esqueleto que `VidaAgendaBlock` y `VidaAgendaGap` —canaleta con la hora
 * a la izquierda, tarjeta a la derecha— para que la agenda se lea de corrido.
 * Lo que cambia es el trazo: **punteado**, como en el render 04-B.
 *
 * El texto distingue los dos casos **sin depender del color** (criterio 45, que
 * es de la tajada 4, pero la regla vale ya): «fuera del plan» y «40 min tarde».
 * Ninguno reprocha nada.
 *
 * Lo que **no** hace todavía: el «···» con corregir y quitar del registro
 * (criterio 35) — eso es la **tajada 3**, que es la que escribe la hoja.
 */
export function VidaAgendaSession({ entry }: VidaAgendaSessionProps) {
  const category = entry.span.session.activity?.category ?? null
  const colorStyle = category?.color
    ? ({ '--vida-category-color': category.color } as CSSProperties)
    : undefined

  return (
    <li className={styles.row} style={colorStyle} data-variant={entry.variant}>
      <span className={styles.gutter}>
        <time className={styles.time} dateTime={minutesToTime(entry.startMinutes)}>
          {formatTimeForDisplay(minutesToTime(entry.startMinutes))}
        </time>
        <span className={styles.tick} aria-hidden />
      </span>

      <article className={styles.card}>
        <span className={styles.capsule} aria-hidden>
          <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
        </span>
        <div className={styles.body}>
          <p className={styles.name}>{entry.span.title}</p>
          <p className={styles.meta}>
            {entry.rangeLabel} · {entry.durationLabel}
            {entry.span.isRunning ? (
              <>
                {' · '}
                <span className={styles.live}>en marcha</span>
              </>
            ) : null}
          </p>
        </div>
        <span className={styles.tag}>{entry.label}</span>
      </article>
    </li>
  )
}
