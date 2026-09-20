import type { CSSProperties } from 'react'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import {
  formatDurationMinutes,
  formatTimeForDisplay,
} from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import styles from './VidaTemplateAside.module.scss'

type VidaTemplateAsideProps = {
  /** «viernes». */
  dayLabel: string
  suggestions: VidaSuggestion[]
  planItems: ActivityDayPlanItem[]
}

/**
 * El lateral de escritorio: «Tu plantilla de \<día\>», marcando lo que ya está
 * en el plan (criterio 48, su primera mitad).
 *
 * Marcado **contra el plan del día**, por `activityId`, nunca contra
 * `takenToday`: aquél es el «ya lo tomé hoy» de F1, sale de otra tabla y en un
 * día futuro es siempre `false`.
 *
 * En la tajada 2 no lleva botón de «ponerla en el primer hueco donde cabe»
 * —eso es una mutación, tajada 3— ni el bloque «Mañana», que es la 5.
 */
export function VidaTemplateAside({ dayLabel, suggestions, planItems }: VidaTemplateAsideProps) {
  const plannedActivityIds = new Set(planItems.map((item) => item.activityId))
  const items = suggestions.filter((suggestion) => suggestion.item.isActive !== false)

  return (
    <aside className={styles.root} aria-label={`Tu plantilla de ${dayLabel}`}>
      <h2 className={styles.heading}>Tu plantilla de {dayLabel}</h2>
      <p className={styles.subtitle}>Lo que sueles hacer; marcado, lo que ya está en el plan.</p>

      {items.length === 0 ? (
        <p className={styles.empty}>
          Todavía no tienes nada en tu plantilla para los {dayLabel}.{' '}
          <Button variant="ghost" size="sm" to={vidaPaths.actividades}>
            Ver tus actividades
          </Button>
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map(({ item }) => {
            const category = item.activity?.category ?? null
            const colorStyle = category?.color
              ? ({ '--vida-category-color': category.color } as CSSProperties)
              : undefined
            const schedule = [
              item.startTime ? formatTimeForDisplay(item.startTime) : 'sin hora',
              item.durationMinutes !== null ? formatDurationMinutes(item.durationMinutes) : null,
            ]
              .filter(Boolean)
              .join(' · ')
            return (
              <li key={item.id} className={styles.item} style={colorStyle}>
                <span className={styles.capsule} aria-hidden>
                  <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="xs" decorative />
                </span>
                <span className={styles.body}>
                  <span className={styles.name}>{item.activity?.title ?? 'Actividad'}</span>
                  <span className={styles.meta}>{schedule}</span>
                </span>
                {plannedActivityIds.has(item.activityId) ? (
                  <span className={styles.badge}>en el plan</span>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
