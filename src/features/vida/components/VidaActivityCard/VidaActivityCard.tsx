import type { CSSProperties } from 'react'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import { useArchiveActivity } from '@/features/vida/hooks/useArchiveActivity'
import { AppIcon } from '@/shared/ui/AppIcon'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { IconButton } from '@/shared/ui/IconButton'
import { Popover } from '@/shared/ui/Popover'
import { Skeleton } from '@/shared/ui/Skeleton'
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
  /**
   * La plantilla viene en otra consulta y puede llegar después que las
   * actividades. Mientras está en vuelo la tarjeta **no afirma** «sin
   * plantilla» —sería mentira durante ese hueco—: enseña un hueco.
   */
  isTemplatePending?: boolean
  /** El «···» → «Editar». Abre la hoja de la página: la tarjeta no muta nada. */
  onEdit: (activity: Activity) => void
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

export function VidaActivityCard({
  activity,
  icon,
  color,
  vidaItem,
  isTemplatePending = false,
  onEdit,
}: VidaActivityCardProps) {
  const { confirm } = useConfirmDialog()
  const { archive, isPending: isArchiving } = useArchiveActivity()
  const days = vidaItem?.days ?? []
  const colorStyle = color ? ({ '--vida-category-color': color } as CSSProperties) : undefined

  /**
   * Archivar con confirmación, como `HabitListCard`. Dos cosas a propósito:
   * el diálogo **no** es `variant: 'danger'` —archivar es reversible y nada se
   * borra (D1), teñirlo de rojo diría lo contrario— y el botón de salida dice
   * «Volver» y no «Cancelar»: el criterio 25 prohíbe esa palabra en todo este
   * flujo, para que no se confunda con el `cancelled` del API.
   */
  async function handleArchive() {
    const ok = await confirm({
      title: `¿Archivar «${activity.title}»?`,
      description:
        'Sale del catálogo y de tu plantilla. Puedes restaurarla cuando quieras y lo que ya registraste se conserva.',
      confirmLabel: 'Archivar',
      cancelLabel: 'Volver',
    })
    if (!ok) return
    archive(activity, vidaItem)
  }

  const menu = (
    <ul className={styles.menu}>
      <li>
        <button type="button" className={styles.menuItem} onClick={() => onEdit(activity)}>
          Editar
        </button>
      </li>
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={handleArchive}
          disabled={isArchiving}
        >
          Archivar
        </button>
      </li>
    </ul>
  )

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
        ) : isTemplatePending ? (
          <span className={styles.daysPending} aria-busy="true">
            <Skeleton width={92} height={12} radius="0.35rem" />
            <span className={styles.srOnly}>Cargando tu plantilla…</span>
          </span>
        ) : (
          <p className={styles.meta}>sin plantilla</p>
        )}
      </div>

      <div className={styles.more}>
        <Popover
          triggerLabel={`Más opciones de ${activity.title}`}
          trigger={<IconButton icon="ellipsis" size="sm" tabIndex={-1} aria-hidden />}
          content={menu}
          placement="bottom-end"
        />
      </div>
    </article>
  )
}
