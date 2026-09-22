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
 * Los tramos más cortos que `MIN_GAP_MINUTES` (`isSliver`) y **los que ya
 * pasaron** (`isPast`) se pintan igual —una línea con sus minutos— pero sin
 * fichas: si desaparecieran, la leyenda del presupuesto dejaría de cuadrar con
 * lo que se ve (criterio 14), y ofrecer algo para un rato que ya pasó no tiene
 * sentido. El hueco que contiene a «ahora» lo parte `buildDayAgenda`, así que
 * la mitad de después ya llega con el tamaño que de verdad queda.
 */
export function VidaAgendaGap({
  gap,
  suggestions,
  dayLabel,
  showTemplateHint = false,
  onPlaceSuggestion,
  onOpenSheet,
  isPlacing = false,
}: VidaAgendaGapProps) {
  const canPlace = Boolean(onPlaceSuggestion)
  const rangeLabel = formatGapRange(gap)
  const sizeLabel = formatDurationFromMinutes(gap.durationMinutes)

  // Un resto de menos de 15 min, o un tramo que ya pasó: se pinta con sus
  // minutos —si desapareciera, la leyenda dejaría de cuadrar (criterio 14)—
  // pero sin fichas. En el pasado no hay nada que colocar.
  if (gap.isSliver || gap.isPast) {
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
      </section>
    </li>
  )
}
