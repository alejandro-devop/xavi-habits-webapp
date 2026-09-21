import type { CSSProperties } from 'react'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import {
  describeItemDays,
  describeItemDuration,
  templateItemTitle,
} from '@/features/vida/utils/vida-template.utils'
import { formatTimeForDisplay, minutesToTime } from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaTemplateItemCard.module.scss'

type VidaTemplateItemCardProps = {
  item: VidaItem
  /**
   * Minutos desde medianoche de su hora. **`null` en el cajón «Sin hora»**: sin
   * hora no hay canaleta que rellenar, y ahí es donde el ítem dice que le falta.
   */
  startMinutes?: number | null
}

/**
 * Una cosa de la plantilla: la hora a la izquierda y la tarjeta de vidrio a la
 * derecha, como el marco A del render (criterio 6).
 *
 * El icono y el color salen de `item.activity.category`, que **ya viaja dentro
 * del `VidaItem`** (`vida-items.graphql.ts` selecciona
 * `category { id name color icon }`): ni consulta extra ni cruce por `Map`,
 * igual que en `VidaAgendaBlock`.
 *
 * Un ítem **desactivado no desaparece**: se queda en su hora, en trazo suave, y
 * lleva la etiqueta «desactivada · no sale en Hoy» (criterio 8). **En esta
 * tajada no se pinta «Activar»**, ni el «···», ni nada que escriba: son los
 * criterios 25 y 26, de la tajada 2, y un botón muerto es peor que ninguno.
 * Cuando lleguen, entran como **props opcionales**, igual que en
 * `VidaAgendaBlock`.
 */
export function VidaTemplateItemCard({ item, startMinutes = null }: VidaTemplateItemCardProps) {
  const category = item.activity?.category ?? null
  const colorStyle = category?.color
    ? ({ '--vida-category-color': category.color } as CSSProperties)
    : undefined
  const title = templateItemTitle(item)
  const isInactive = item.isActive === false

  return (
    <li className={styles.row} style={colorStyle} data-inactive={isInactive ? 'true' : undefined}>
      <span className={styles.gutter}>
        {startMinutes === null ? (
          <span className={styles.noTime}>—</span>
        ) : (
          <time className={styles.time} dateTime={minutesToTime(startMinutes)}>
            {formatTimeForDisplay(minutesToTime(startMinutes))}
          </time>
        )}
        <span className={styles.tick} aria-hidden />
      </span>

      <article className={styles.card}>
        <span className={styles.capsule} aria-hidden>
          <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
        </span>
        <div className={styles.body}>
          <p className={styles.name}>{title}</p>
          <p className={styles.meta}>
            {isInactive ? (
              <>
                <span className={styles.tag}>desactivada</span> · no sale en Hoy
              </>
            ) : (
              <>
                {describeItemDuration(item)} · <b className={styles.days}>{describeItemDays(item)}</b>
              </>
            )}
          </p>
        </div>
      </article>
    </li>
  )
}
