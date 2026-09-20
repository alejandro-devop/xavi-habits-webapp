import type { CSSProperties } from 'react'
import type { AgendaBlock } from '@/features/vida/utils/vida-agenda.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import {
  formatDurationMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaAgendaBlock.module.scss'

type VidaAgendaBlockProps = {
  block: AgendaBlock
  /** Es el primero que aún no ha empezado: lleva el «en N min» (criterio 16). */
  isNext?: boolean
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes?: number | null
}

/**
 * Un bloque del plan: hora, icono y color de su categoría, nombre y duración.
 *
 * El icono y el color salen de `item.activity.category`, que **ya viaja dentro
 * del plan del día** (`activity-day-plan.graphql.ts` selecciona
 * `category { id name color icon }`). Por eso aquí no hace falta el cruce por
 * `Map` con las categorías que hace `VidaActividadesPage`: el dato viene
 * pegado al bloque y una consulta menos es una consulta menos.
 *
 * **Nada de vivir el día** (criterio 22): ni «Empezar», ni cronómetro, ni
 * «Terminar», ni etiquetas de ejecutado. Eso es F3, aunque el render lo dibuje.
 */
export function VidaAgendaBlock({ block, isNext = false, nowMinutes = null }: VidaAgendaBlockProps) {
  const category = block.item.activity?.category ?? null
  const colorStyle = category?.color
    ? ({ '--vida-category-color': category.color } as CSSProperties)
    : undefined
  const startsIn = nowMinutes === null ? null : block.startMinutes - nowMinutes
  const title = block.item.activity?.title ?? 'Actividad'
  // El criterio 16 pide «en N min» y eso es lo que se lee dentro de la hora
  // siguiente. Más allá, «en 920 min» no se lee: se usa el formateador largo
  // que ya existe y queda «en 15 h 20 min» (hallazgo 4 del revisor).
  const soonLabel =
    startsIn === null || startsIn <= 0
      ? null
      : startsIn < 60
        ? `en ${startsIn} min`
        : `en ${formatDurationMinutes(startsIn)}`

  return (
    <li className={styles.row} style={colorStyle}>
      <span className={styles.gutter}>
        <time className={styles.time} dateTime={minutesToTime(block.startMinutes)}>
          {formatTimeForDisplay(minutesToTime(block.startMinutes))}
        </time>
        <span className={styles.tick} aria-hidden />
      </span>

      <article className={styles.card}>
        <span className={styles.capsule} aria-hidden>
          <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
        </span>
        <div className={styles.body}>
          <p className={styles.name}>{title}</p>
          <p className={styles.meta}>
            {formatDurationMinutes(block.durationMinutes)}
            {isNext && soonLabel ? <span className={styles.soon}> · {soonLabel}</span> : null}
          </p>
        </div>
      </article>
    </li>
  )
}
