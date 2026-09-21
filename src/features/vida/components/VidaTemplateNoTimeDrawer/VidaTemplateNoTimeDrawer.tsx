import { VidaTemplateItemCard } from '@/features/vida/components/VidaTemplateItemCard'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import styles from './VidaTemplateNoTimeDrawer.module.scss'

type VidaTemplateNoTimeDrawerProps = {
  items: VidaItem[]
  /** Abrir la hoja de ese ítem (criterio 16). Opcional, como en la tarjeta. */
  onOpen?: (item: VidaItem) => void
  /** «Ponerle hora» (criterio 25): la misma hoja, con la hora lista. */
  onSetTime?: (item: VidaItem) => void
  /** «Activar» de un toque (criterio 26): aquí también hay desactivados. */
  onActivate?: (item: VidaItem) => void
  /** El id del ítem cuya reactivación está en vuelo, si hay alguna. */
  activatingId?: string | null
}

/**
 * El cajón «Sin hora» del final del día (criterio 9).
 *
 * Tres cosas que no son adorno:
 *
 * - **No están escondidos y no están mezclados**: van juntos, al final, con su
 *   cuenta. Descubrir que tres cosas se quedaron sin hora es la mitad de la
 *   razón de esta pantalla.
 * - La explicación es **literal** y dice lo que Hoy hace de verdad con ellos:
 *   los encadena al final del día (`buildDayFromTemplate`, regla 2).
 * - **«Ponerle hora»** (criterio 25) se pinta desde la tajada 2, y solo si
 *   quien monta el cajón la pasa: sin ella esto sigue siendo lectura pura.
 */
export function VidaTemplateNoTimeDrawer({
  items,
  onOpen,
  onSetTime,
  onActivate,
  activatingId = null,
}: VidaTemplateNoTimeDrawerProps) {
  if (items.length === 0) return null

  return (
    <section className={styles.root} aria-labelledby="vida-template-no-time-heading">
      <h3 className={styles.heading} id="vida-template-no-time-heading">
        Sin hora <span className={styles.count}>{items.length}</span>
      </h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <VidaTemplateItemCard
            key={item.id}
            item={item}
            onOpen={onOpen}
            onSetTime={onSetTime}
            onActivate={onActivate}
            isActivating={activatingId === item.id}
          />
        ))}
      </ul>
      <p className={styles.why}>
        Hoy las pone <b>al final del día</b>, una detrás de otra. Con hora quedan en su sitio.
      </p>
    </section>
  )
}
