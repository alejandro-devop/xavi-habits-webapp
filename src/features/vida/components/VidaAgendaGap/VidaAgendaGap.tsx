import type { CSSProperties } from 'react'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { AgendaGap, GapSuggestions } from '@/features/vida/utils/vida-agenda.utils'
import { formatGapRange } from '@/features/vida/utils/vida-agenda.utils'
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
}

/**
 * Un tramo libre: sus horas, su tamaño y lo que de la plantilla cabe dentro.
 *
 * **En la tajada 2 esto es lectura.** Las fichas no colocan nada: colocar es
 * `activityDayPlanItemAdd` y es la tajada 3 (criterios 23–28). Por eso son
 * `<span>` y no botones, y por eso **no** se pinta «+ otra cosa» todavía: un
 * botón que no hace nada miente más que un botón que no está. Es el mismo
 * recorte que el arquitecto dejó escrito para «Armar desde la plantilla».
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
}: VidaAgendaGapProps) {
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
              {suggestions.visible.map(({ suggestion, durationMinutes }) => {
                const category = suggestion.item.activity?.category ?? null
                const colorStyle = category?.color
                  ? ({ '--vida-category-color': category.color } as CSSProperties)
                  : undefined
                return (
                  <li key={suggestion.item.id} className={styles.chip} style={colorStyle}>
                    <AppIcon
                      name={category?.icon ?? UNCATEGORIZED_GROUP_ICON}
                      size="xs"
                      decorative
                    />
                    <span className={styles.chipName}>
                      {suggestion.item.activity?.title ?? 'Actividad'}
                    </span>
                    <span className={styles.chipTime}>
                      {durationMinutes === null
                        ? 'sin duración'
                        : formatDurationFromMinutes(durationMinutes)}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className={styles.note}>
              De tu plantilla de {dayLabel}, lo que cabe aquí
              {suggestions.hiddenCount > 0 ? ` (y ${suggestions.hiddenCount} más)` : ''}.
            </p>
          </>
        ) : showTemplateHint && suggestions.templateCount === 0 ? (
          <p className={styles.note}>
            Todavía no tienes nada en tu plantilla para los {dayLabel}.{' '}
            <Button variant="ghost" size="sm" to={vidaPaths.actividades}>
              Ver tus actividades
            </Button>
          </p>
        ) : null}
      </section>
    </li>
  )
}
