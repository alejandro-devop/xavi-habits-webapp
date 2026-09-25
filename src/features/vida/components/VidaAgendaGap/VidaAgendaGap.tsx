import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { AgendaGap } from '@/features/vida/utils/vida-agenda.utils'
import { formatGapRange } from '@/features/vida/utils/vida-agenda.utils'
import { pluralDayLabel } from '@/features/vida/utils/vida-date.utils'
import {
  formatDurationFromMinutes,
  formatTimeForDisplay,
  MIN_LOG_MINUTES,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'
import { Button } from '@/shared/ui/Button'
import styles from './VidaAgendaGap.module.scss'

type VidaAgendaGapProps = {
  gap: AgendaGap
  /** «viernes»: de qué día es la plantilla de la que se habla. */
  dayLabel: string
  /**
   * Este es el hueco donde se explica que la plantilla está vacía. Se marca uno
   * solo: repetir el aviso en cada hueco sería ruido.
   */
  showTemplateHint?: boolean
  /**
   * **Cuántas cosas trae la plantilla de este día** (FEAT-010, criterio 381).
   * Con `showTemplateHint` y `0`, el hueco explica que la plantilla está vacía
   * y enlaza al catálogo. Antes este número venía dentro de `GapSuggestions`;
   * al retirarse las fichas llega **suelto**, para que esa rama no se pierda
   * por el camino. Lo calcula la página, que ya lo tiene para «Armar desde la
   * plantilla».
   */
  templateCount?: number
  /** «+ otra cosa»: abre la hoja de tres preguntas (criterio 24). */
  onOpenSheet?: (gap: AgendaGap) => void
  /**
   * **«Registrar lo que hice»** (FEAT-011, criterio 220): la salida del hueco
   * que **ya pasó**. Quien escuche abre la hoja de registrar **anclada a este
   * hueco**; aquí no se decide nada más que el gesto.
   *
   * Sin esta prop —un día futuro, o lo vivido que no se pudo cargar— el hueco
   * pasado se queda **exactamente como estaba**: una línea con sus minutos y
   * ningún control (criterios 232 y 244).
   */
  onLogPast?: (gap: AgendaGap) => void
  /**
   * **El día entero ya pasó.** `gap.isPast` sale de comparar el hueco con el
   * reloj, y en un día de atrás no hay reloj que mirar (`useVidaNowMinute` da
   * `null`), así que **ninguno** de sus huecos viene marcado. Quien sabe que el
   * día es pasado es la página, y lo dice aquí: si no, registrar en un día de
   * la tira no se ofrecería nunca (criterio 232).
   */
  isPastDay?: boolean
}

/**
 * Un tramo libre: sus horas, su tamaño y la vía para poner algo dentro.
 *
 * **Las fichas de sugerencia ya no están** (FEAT-010, criterio 381): quedan
 * derogados los criterios 18 —en su parte de fichas—, 19 y 23 de FEAT-003, y
 * con ellos la mitad del criterio 91 de FEAT-007 (los chips que ofrecían «la
 * duración que sueles tardar»), cuya parte útil se mudó a la tarjeta de «Lo que
 * viene» (criterio 372). Colocaban al primer toque, sin confirmación, y el
 * usuario dijo que no le resultaba intuitivo qué hacían.
 *
 * La única salida para planear aquí es **«+ otra cosa»**, que abre la hoja de
 * «Poner algo a las HH:MM» con el subtítulo del hueco (criterios 24 y 25, y
 * FEAT-010 criterio 382): explícita y confirmable, que es justo lo que las
 * fichas no eran. El hueco **sigue diciendo su franja y su tamaño**.
 *
 * Los tramos más cortos que `MIN_PLANNING_MINUTES` (`isSliver`) **no ofrecen
 * planear**: ahí no cabe ninguna píldora. Si además no hay nada que contar, se
 * pintan como una línea con sus minutos y sin ningún control —si desaparecieran,
 * la leyenda del presupuesto dejaría de cuadrar con lo que se ve (criterio 14)—.
 *
 * **Pero contar tiene otro suelo** (FEAT-014, criterio 401). Un hueco de trece
 * minutos que ya pasó sí es sitio donde ofrecer registrar: lo que hiciste duró
 * lo que duró. Desde `MIN_LOG_MINUTES` (5) hacia arriba, el hueco pasado trae la
 * **misma** tarjeta y las **mismas** palabras que el grande, sin variante corta;
 * por debajo sigue siendo la línea fina de siempre (criterio 402). El criterio
 * 221 de FEAT-011 —«un resto de diez minutos no es sitio donde ofrecer nada»—
 * queda sustituido por el 402 en el tramo de 5 a 14, y sigue vigente por debajo
 * de 5.
 *
 * **El hueco de delante** también cuenta hacia atrás, pero de segundo: las
 * fichas de plantilla mandan y «Registrar» va detrás, con menos peso (criterio
 * 241). Quien escucha decide qué ventana le da a la hoja; aquí solo está el
 * gesto.
 *
 * **Los que ya pasaron** (`isPast`) no ofrecen planear —planear hacia atrás no
 * significa nada— pero sí **contar**: con `onLogPast` traen una salida, y solo
 * una, «Registrar lo que hice» (criterio 220). Sin ella se quedan como la línea
 * de antes. El hueco que contiene a «ahora» lo parte `buildDayAgenda`, así que
 * cada mitad llega ya con su lado del reloj.
 */
export function VidaAgendaGap({
  gap,
  dayLabel,
  showTemplateHint = false,
  templateCount = 0,
  onOpenSheet,
  onLogPast,
  isPastDay = false,
}: VidaAgendaGapProps) {
  const rangeLabel = formatGapRange(gap)
  const sizeLabel = formatDurationFromMinutes(gap.durationMinutes)
  const isPast = gap.isPast || isPastDay
  const fromLabel = formatTimeForDisplay(minutesToTime(gap.startMinutes))
  const toLabel = formatTimeForDisplay(minutesToTime(gap.endMinutes))
  // **Aquí sí se puede contar** (FEAT-014, criterio 401): el rato ya pasó, hay
  // quien escuche el registro y dura al menos `MIN_LOG_MINUTES`. Los 5 exactos
  // entran (`>=`, D1). Es lo único que salva a un `isSliver` de la línea fina, y
  // **solo hacia atrás**: un hueco corto que aún no ha llegado se ve igual que
  // antes de esta feature (criterio 404).
  const canLogHere = isPast && Boolean(onLogPast) && gap.durationMinutes >= MIN_LOG_MINUTES

  // Un resto que no da ni para contar, o un tramo que ya pasó **sin nadie que
  // escuche el registro**: se pinta con sus minutos —si desapareciera, la
  // leyenda dejaría de cuadrar (criterio 14)— pero sin ningún control.
  if ((gap.isSliver && !canLogHere) || (isPast && !onLogPast)) {
    return (
      <li className={styles.row} data-sliver={gap.isSliver ? 'true' : undefined}>
        <span className={styles.gutter}>
          <time className={styles.time} dateTime={minutesToTime(gap.startMinutes)}>
            {formatTimeForDisplay(minutesToTime(gap.startMinutes))}
          </time>
        </span>
        <p className={styles.sliver}>
          Libre {rangeLabel} · {sizeLabel}
        </p>
      </li>
    )
  }

  // El rato que ya pasó: sus horas, su tamaño y **una** salida, la de contar
  // qué hiciste (criterio 220). Ni fichas de plantilla ni «+ otra cosa»: en el
  // pasado no hay nada que colocar. Un hueco corto que llega hasta aquí
  // (`canLogHere`) usa **esta misma** tarjeta: no hay variante corta (criterio
  // 401).
  if (isPast) {
    return (
      <li className={styles.row}>
        <span className={styles.gutter}>
          <time className={styles.time} dateTime={minutesToTime(gap.startMinutes)}>
            {fromLabel}
          </time>
        </span>

        <section className={styles.card} data-past="true" aria-label={`Libre de ${rangeLabel}`}>
          <p className={styles.head}>
            <span className={styles.free}>Libre {rangeLabel}</span>
            <span className={styles.size}>{sizeLabel}</span>
          </p>
          <button
            type="button"
            className={styles.logButton}
            // Lo que se oye dice **qué** se hace y **de qué rato**: una lista de
            // huecos iguales necesita la hora en el rótulo (molde:
            // `VidaTemplateGapRow`).
            aria-label={`Registrar lo que hiciste entre las ${fromLabel} y las ${toLabel}`}
            onClick={() => onLogPast?.(gap)}
          >
            Registrar lo que hice
          </button>
        </section>
      </li>
    )
  }

  return (
    <li className={styles.row}>
      <span className={styles.gutter}>
        <time className={styles.time} dateTime={minutesToTime(gap.startMinutes)}>
          {formatTimeForDisplay(minutesToTime(gap.startMinutes))}
        </time>
      </span>

      <section className={styles.card} aria-label={`Libre de ${rangeLabel}`}>
        <p className={styles.head}>
          <span className={styles.free}>Libre {rangeLabel}</span>
          <span className={styles.size}>{sizeLabel}</span>
        </p>

        {/* **La única vía para planear aquí** (criterio 382). Antes iba
            detrás de hasta tres fichas de plantilla; desde FEAT-010 tajada 3 es
            lo que hay, y sigue abriendo la misma hoja con el subtítulo del
            hueco. La lista de una sola píldora se conserva a propósito: es la
            misma forma —y los mismos estilos— que tenía cuando la acompañaban
            las fichas, así que el hueco no cambia de aspecto al perderlas. */}
        {showTemplateHint && templateCount === 0 ? (
          <p className={styles.note}>
            Todavía no tienes nada en tu plantilla para los {pluralDayLabel(dayLabel)}.{' '}
            <Button variant="ghost" size="sm" to={vidaPaths.actividades}>
              Ver tus actividades
            </Button>
          </p>
        ) : null}

        {onOpenSheet ? (
          <ul className={styles.chips}>
            <li>
              <button
                type="button"
                className={[styles.chip, styles.chipMore].join(' ')}
                aria-label={`Poner otra cosa a las ${formatTimeForDisplay(minutesToTime(gap.startMinutes))}`}
                onClick={() => onOpenSheet(gap)}
              >
                + otra cosa
              </button>
            </li>
          </ul>
        ) : null}

        {/* **La otra cara del hueco** (criterio 241). Aquí manda «Poner algo»
            —las fichas de arriba— y esto queda de **segunda** salida, con menos
            peso: por si acabas de hacer algo y no lo dijiste. Cuelga de su
            propio nodo, hermano de las fichas y **no** de que haya fichas: si
            mañana las de sugerencia se van, esta salida sigue donde está. */}
        {onLogPast ? (
          <button
            type="button"
            className={[styles.logButton, styles.logButtonGhost].join(' ')}
            aria-label={`Registrar algo que hiciste antes de las ${toLabel}`}
            onClick={() => onLogPast(gap)}
          >
            Registrar
          </button>
        ) : null}
      </section>
    </li>
  )
}
