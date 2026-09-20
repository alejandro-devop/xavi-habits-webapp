import type { CSSProperties } from 'react'
import { VidaActivityCard } from '@/features/vida/components/VidaActivityCard'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import {
  UNCATEGORIZED_GROUP_ICON,
  type VidaCatalogGroupModel,
} from '@/features/vida/utils/vida-catalog.utils'
import styles from './VidaCatalogGroup.module.scss'

type VidaCatalogGroupProps = {
  group: VidaCatalogGroupModel
  /** `activityId → VidaItem` activo, resuelto una sola vez en la página. */
  vidaItemsByActivity: Map<string, VidaItem>
  /** La plantilla todavía viene en camino: la tarjeta no afirma «sin plantilla». */
  isTemplatePending?: boolean
  /** Se lo pasa a cada tarjeta: el «···» → «Editar» abre la hoja de la página. */
  onEdit: (activity: Activity) => void
}

export function VidaCatalogGroup({
  group,
  vidaItemsByActivity,
  isTemplatePending = false,
  onEdit,
}: VidaCatalogGroupProps) {
  const colorStyle = group.color
    ? ({ '--vida-category-color': group.color } as CSSProperties)
    : undefined
  const count = group.activities.length

  return (
    <section className={styles.group} style={colorStyle}>
      <h2 className={styles.heading}>
        <span className={styles.swatch} aria-hidden />
        <span className={styles.name}>{group.name}</span>
        <span className={styles.count}>
          {count} {count === 1 ? 'actividad' : 'actividades'}
        </span>
      </h2>

      <div className={styles.cards}>
        {group.activities.map((activity) => (
          <VidaActivityCard
            key={activity.id}
            activity={activity}
            icon={group.icon ?? UNCATEGORIZED_GROUP_ICON}
            color={group.color}
            vidaItem={vidaItemsByActivity.get(activity.id) ?? null}
            isTemplatePending={isTemplatePending}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  )
}
