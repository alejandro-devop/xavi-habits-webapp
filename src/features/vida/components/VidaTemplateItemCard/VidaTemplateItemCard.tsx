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
import { Button } from '@/shared/ui/Button'
import styles from './VidaTemplateItemCard.module.scss'

type VidaTemplateItemCardProps = {
  item: VidaItem
  /**
   * Minutos desde medianoche de su hora. **`null` en el cajón «Sin hora»**: sin
   * hora no hay canaleta que rellenar, y ahí es donde el ítem dice que le falta.
   */
  startMinutes?: number | null

  /* ── Las acciones, **todas opcionales** (tajada 2) ────────────────────────
   *
   * Mismo contrato que `VidaAgendaBlock`: sin ninguna de estas props la
   * tarjeta es exactamente la de la tajada 1, lectura pura. Un botón muerto es
   * peor que ninguno, así que cada una se pinta solo si llega.
   */

  /** Abre la hoja de ese ítem (criterio 16). Con ella la tarjeta es pulsable. */
  onOpen?: (item: VidaItem) => void
  /** «Ponerle hora» en el cajón «Sin hora» (criterio 25): abre la misma hoja. */
  onSetTime?: (item: VidaItem) => void
  /** «Activar» de un toque, **sin abrir la hoja** (criterio 26). */
  onActivate?: (item: VidaItem) => void
  /** Mientras la reactivación viaja: el botón se apaga y lo dice. */
  isActivating?: boolean
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
 * lleva la etiqueta «desactivada · no sale en Hoy» (criterio 8). Desde la
 * tajada 2 lleva además **«Activar»**, que lo reactiva de un toque **sin abrir
 * la hoja** (criterio 26).
 *
 * **La tarjeta entera es el gesto de abrir** (criterio 16): con `onOpen` el
 * cuerpo se pinta como un `<button>` —no un `div` con `onClick`— para que
 * llegue el teclado gratis. Sin `onOpen` sigue siendo un `<article>` de solo
 * lectura, que es como la monta la tajada 1.
 */
export function VidaTemplateItemCard({
  item,
  startMinutes = null,
  onOpen,
  onSetTime,
  onActivate,
  isActivating = false,
}: VidaTemplateItemCardProps) {
  const category = item.activity?.category ?? null
  const colorStyle = category?.color
    ? ({ '--vida-category-color': category.color } as CSSProperties)
    : undefined
  const title = templateItemTitle(item)
  const isInactive = item.isActive === false

  const inner = (
    <>
      <span className={styles.capsule} aria-hidden>
        <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{title}</span>
        <span className={styles.meta}>
          {isInactive ? (
            <>
              <span className={styles.tag}>desactivada</span> · no sale en Hoy
            </>
          ) : (
            <>
              {describeItemDuration(item)} · <b className={styles.days}>{describeItemDays(item)}</b>
            </>
          )}
        </span>
      </span>
    </>
  )

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

      <div className={styles.stack}>
        {onOpen ? (
          <button
            type="button"
            className={[styles.card, styles.cardButton].join(' ')}
            // Lo que se oye dice **qué** se abre, no «botón»: una lista de
            // tarjetas iguales necesita que el nombre entre en el rótulo.
            aria-label={`Abrir ${title}`}
            onClick={() => onOpen(item)}
          >
            {inner}
          </button>
        ) : (
          <article className={styles.card}>{inner}</article>
        )}

        {onSetTime || (isInactive && onActivate) ? (
          <span className={styles.actions}>
            {onSetTime ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSetTime(item)}
              >
                Ponerle hora
              </Button>
            ) : null}
            {isInactive && onActivate ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isActivating}
                onClick={() => onActivate(item)}
              >
                {isActivating ? 'Activando…' : 'Activar'}
              </Button>
            ) : null}
          </span>
        ) : null}
      </div>
    </li>
  )
}
