import type { CSSProperties } from 'react'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import type { AgendaGap, GapSuggestions } from '@/features/vida/utils/vida-agenda.utils'
import { formatGapRange } from '@/features/vida/utils/vida-agenda.utils'
import { pluralDayLabel } from '@/features/vida/utils/vida-date.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import {
  formatDurationFromMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import styles from './VidaAgendaGap.module.scss'

type VidaAgendaGapProps = {
  gap: AgendaGap
  /** Lo que la plantilla puede ofrecer aquí, ya filtrado y ordenado. */
  suggestions: GapSuggestions
  /** «viernes»: de qué día es la plantilla que se está ofreciendo. */
  dayLabel: string
  /**
   * Este es el hueco donde se explica que la plantilla está vacía. Se marca uno
   * solo: repetir el aviso en cada hueco sería ruido.
   */
  showTemplateHint?: boolean
  /**
   * Un toque en una ficha **con duración**: la coloca al principio del hueco
   * (criterio 23). Sin duración, `durationMinutes` llega `null` y quien escuche
   * abre la hoja para elegir cuánto en vez de inventárselo (criterio 19).
   */
  onPlaceSuggestion?: (
    gap: AgendaGap,
    suggestion: VidaSuggestion,
    durationMinutes: number | null,
  ) => void
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
  /** Hay una colocación en vuelo: las fichas no admiten un segundo toque. */
  isPlacing?: boolean
}

/**
 * Un tramo libre: sus horas, su tamaño y lo que de la plantilla cabe dentro.
 *
 * **Desde la tajada 3 las fichas colocan.** Un toque en una con duración la
 * pone al principio del hueco con `activityDayPlanItemAdd` (criterio 23); una
 * **sin duración** no se coloca a ciegas: abre la hoja para elegir cuánto
 * (criterio 19). Y «+ otra cosa» abre esa misma hoja vacía (criterio 24).
 *
 * Mientras no llegue `onPlaceSuggestion`, las fichas siguen siendo texto: es lo
 * que deja montar este componente en un arnés o en un día pasado (tajada 4, en
 * solo lectura) sin pintar controles que no llevan a ninguna parte.
 *
 * Los tramos más cortos que `MIN_GAP_MINUTES` (`isSliver`) se pintan como una
 * línea con sus minutos y **sin ningún control**: si desaparecieran, la leyenda
 * del presupuesto dejaría de cuadrar con lo que se ve (criterio 14), y un resto
 * de diez minutos no es sitio donde ofrecer nada (criterio 221).
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
  suggestions,
  dayLabel,
  showTemplateHint = false,
  onPlaceSuggestion,
  onOpenSheet,
  onLogPast,
  isPastDay = false,
  isPlacing = false,
}: VidaAgendaGapProps) {
  const canPlace = Boolean(onPlaceSuggestion)
  const rangeLabel = formatGapRange(gap)
  const sizeLabel = formatDurationFromMinutes(gap.durationMinutes)
  const isPast = gap.isPast || isPastDay
  const fromLabel = formatTimeForDisplay(minutesToTime(gap.startMinutes))
  const toLabel = formatTimeForDisplay(minutesToTime(gap.endMinutes))

  // Un resto de menos de 15 min, o un tramo que ya pasó **sin nadie que escuche
  // el registro**: se pinta con sus minutos —si desapareciera, la leyenda
  // dejaría de cuadrar (criterio 14)— pero sin ningún control.
  if (gap.isSliver || (isPast && !onLogPast)) {
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
  // pasado no hay nada que colocar.
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

        {suggestions.visible.length > 0 ? (
          <>
            <ul className={styles.chips}>
              {suggestions.visible.map(({ suggestion, durationMinutes, isUsual }) => {
                const category = suggestion.item.activity?.category ?? null
                const colorStyle = category?.color
                  ? ({ '--vida-category-color': category.color } as CSSProperties)
                  : undefined
                const title = suggestion.item.activity?.title ?? 'Actividad'
                const durationLabel =
                  durationMinutes === null
                    ? 'sin duración'
                    : formatDurationFromMinutes(durationMinutes)
                // **El dato sin pedir nada** (FEAT-007, criterio 91): cuando lo
                // que se ofrece es lo que **sueles** tardar, la ficha lo dice.
                // Con menos de cuatro datos no hay etiqueta **ni hueco
                // reservado** donde iría: la ficha es la de antes.
                const chipLabel = isUsual ? `sueles tardar ${durationLabel}` : durationLabel
                const body = (
                  <>
                    <AppIcon
                      name={category?.icon ?? UNCATEGORIZED_GROUP_ICON}
                      size="xs"
                      decorative
                    />
                    <span className={styles.chipName}>{title}</span>
                    <span className={styles.chipTime} data-usual={isUsual ? '' : undefined}>
                      {chipLabel}
                    </span>
                  </>
                )
                return (
                  <li key={suggestion.item.id}>
                    {canPlace ? (
                      <button
                        type="button"
                        className={styles.chip}
                        style={colorStyle}
                        disabled={isPlacing}
                        // Una ficha sin duración no se coloca a ciegas: quien
                        // escucha abre la hoja con ella puesta (criterio 19).
                        aria-label={
                          durationMinutes === null
                            ? `Poner ${title} aquí, eligiendo cuánto dura`
                            : `Poner ${title} a las ${formatTimeForDisplay(minutesToTime(gap.startMinutes))}, ${chipLabel}`
                        }
                        onClick={() => onPlaceSuggestion?.(gap, suggestion, durationMinutes)}
                      >
                        {body}
                      </button>
                    ) : (
                      <span className={styles.chip} style={colorStyle}>
                        {body}
                      </span>
                    )}
                  </li>
                )
              })}

              {onOpenSheet ? (
                <li>
                  <button
                    type="button"
                    className={[styles.chip, styles.chipMore].join(' ')}
                    disabled={isPlacing}
                    aria-label={`Poner otra cosa a las ${formatTimeForDisplay(minutesToTime(gap.startMinutes))}`}
                    onClick={() => onOpenSheet(gap)}
                  >
                    + otra cosa
                  </button>
                </li>
              ) : null}
            </ul>
            <p className={styles.note}>
              De tu plantilla de {dayLabel}, lo que cabe aquí
              {suggestions.hiddenCount > 0 ? ` (y ${suggestions.hiddenCount} más)` : ''}.
              {/* Solo cuando de verdad hay alguna costumbre que ofrecer: sin
                  datos, esta frase no existe (criterio 92). */}
              {suggestions.visible.some((entry) => entry.isUsual)
                ? ' La duración que se ofrece es la que sueles tardar, no la que pusiste.'
                : ''}
            </p>
          </>
        ) : showTemplateHint && suggestions.templateCount === 0 ? (
          <>
            <p className={styles.note}>
              Todavía no tienes nada en tu plantilla para los {pluralDayLabel(dayLabel)}.{' '}
              <Button variant="ghost" size="sm" to={vidaPaths.actividades}>
                Ver tus actividades
              </Button>
            </p>
            {onOpenSheet ? (
              <ul className={styles.chips}>
                <li>
                  <button
                    type="button"
                    className={[styles.chip, styles.chipMore].join(' ')}
                    disabled={isPlacing}
                    aria-label={`Poner otra cosa a las ${formatTimeForDisplay(minutesToTime(gap.startMinutes))}`}
                    onClick={() => onOpenSheet(gap)}
                  >
                    + otra cosa
                  </button>
                </li>
              </ul>
            ) : null}
          </>
        ) : onOpenSheet ? (
          // Sin fichas que ofrecer (todo lo de la plantilla ya está en el plan,
          // o no cabe) el hueco **sigue siendo sitio**: la vía a la hoja no
          // desaparece.
          <ul className={styles.chips}>
            <li>
              <button
                type="button"
                className={[styles.chip, styles.chipMore].join(' ')}
                disabled={isPlacing}
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
