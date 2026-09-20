import type { CSSProperties } from 'react'
import { useRemoveDayPlanItemMutation } from '@/features/vida/hooks/useActivityDayPlan'
import type { AgendaBlock } from '@/features/vida/utils/vida-agenda.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import {
  formatDurationMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { IconButton } from '@/shared/ui/IconButton'
import { Popover } from '@/shared/ui/Popover'
import styles from './VidaAgendaBlock.module.scss'

type VidaAgendaBlockProps = {
  block: AgendaBlock
  /** Es el primero que aún no ha empezado: lleva el «en N min» (criterio 16). */
  isNext?: boolean
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes?: number | null
  /**
   * `YYYY-MM-DD` del día del bloque: `activityDayPlanItemRemove` devuelve
   * `Boolean!` sin fecha, así que la invalidación la sostiene quien llama.
   * Sin fecha no se pinta el «···»: un menú que no puede escribir no se pinta.
   */
  date?: string | null
  /** «Cambiar hora o duración»: abre la hoja con la ventana del bloque (criterio 30). */
  onEdit?: (block: AgendaBlock) => void
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
 * Lo único que escribe es el «···»: **quitar del plan** y **cambiar hora o
 * duración** (criterio 30), que es planear, no vivir.
 *
 * En pantalla se lee **«Quitar del plan»**: nunca «cancelar» ni «eliminar»
 * (criterio 30, heredado del 25 de FEAT-002). Y la salida del diálogo es
 * «Volver», igual que al archivar en el catálogo.
 *
 * El menú se monta como en `VidaActivityCard`: `Popover` + `IconButton`, y la
 * mutación vive **aquí**, no en la página, por el mismo motivo que allí —el
 * confirmar y el quitar son una sola decisión y no hay nada que la página
 * necesite saber—. Cambiar hora o duración sí sube: la hoja es de la página.
 */
export function VidaAgendaBlock({
  block,
  isNext = false,
  nowMinutes = null,
  date = null,
  onEdit,
}: VidaAgendaBlockProps) {
  const { confirm } = useConfirmDialog()
  const removeMutation = useRemoveDayPlanItemMutation()
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

  async function handleRemove() {
    if (!date) return
    const ok = await confirm({
      title: `¿Quitar «${title}» de tu plan?`,
      description:
        'Sale del plan de este día y el rato vuelve a quedar libre. Sigue en tu catálogo y en tu plantilla.',
      confirmLabel: 'Quitar del plan',
      cancelLabel: 'Volver',
    })
    if (!ok) return
    removeMutation.mutate({ itemId: block.item.id, date })
  }

  const menu = (
    <ul className={styles.menu}>
      {onEdit ? (
        <li>
          <button type="button" className={styles.menuItem} onClick={() => onEdit(block)}>
            Cambiar hora o duración
          </button>
        </li>
      ) : null}
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={handleRemove}
          disabled={removeMutation.isPending}
        >
          Quitar del plan
        </button>
      </li>
    </ul>
  )

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

        {date ? (
          <div className={styles.more}>
            <Popover
              triggerLabel={`Más opciones de ${title}`}
              trigger={<IconButton icon="ellipsis" size="sm" tabIndex={-1} aria-hidden />}
              content={menu}
              placement="bottom-end"
            />
          </div>
        ) : null}
      </article>
    </li>
  )
}
