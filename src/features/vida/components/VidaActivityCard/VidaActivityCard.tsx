import type { CSSProperties } from 'react'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaActivityCard.module.scss'

type VidaActivityCardProps = {
  activity: Activity
  /**
   * Icono y color **de la categoría**: el API no guarda ninguno de los dos en
   * `Activity`. Los resuelve la página con un mapa por id, como hace
   * `HabitsListPage` con `categoriesById`: ni una consulta por tarjeta.
   */
  icon: string
  color: string | null
  /** El `VidaItem` **activo**, si lo hay. Sin él, la tarjeta dice «sin plantilla». */
  vidaItem?: VidaItem | null
}

/** «lunes, miércoles y viernes»: la fila de letras sola no se lee en voz alta. */
function formatDaysLabel(days: VidaItem['days']): string {
  const names = VIDA_DAY_ORDER.filter((day) => days.includes(day)).map(
    (day) => VIDA_DAY_LABELS[day],
  )
  if (names.length === 0) return 'ningún día'
  if (names.length === 1) return names[0]!
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
}

export function VidaActivityCard({ activity, icon, color, vidaItem }: VidaActivityCardProps) {
  const days = vidaItem?.days ?? []
  const colorStyle = color ? ({ '--vida-category-color': color } as CSSProperties) : undefined

  return (
    <article className={styles.card} style={colorStyle}>
      <span className={styles.capsule} aria-hidden>
        <AppIcon name={icon} size="sm" decorative />
      </span>

      <div className={styles.body}>
        <p className={styles.name}>{activity.title}</p>
        {vidaItem ? (
          <span
            className={styles.days}
            role="img"
            aria-label={`En tu plantilla: ${formatDaysLabel(days)}`}
          >
            {VIDA_DAY_ORDER.map((day) => {
              const isOn = days.includes(day)
              return (
                <i
                  key={day}
                  aria-hidden
                  data-day={day}
                  data-on={isOn ? 'true' : 'false'}
                  className={[styles.day, isOn ? styles.dayOn : ''].filter(Boolean).join(' ')}
                >
                  {VIDA_DAY_SHORT_LABELS[day]}
                </i>
              )
            })}
          </span>
        ) : (
          <p className={styles.meta}>sin plantilla</p>
        )}
      </div>
    </article>
  )
}
