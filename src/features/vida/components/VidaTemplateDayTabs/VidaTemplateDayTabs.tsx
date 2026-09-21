import type { ReactNode } from 'react'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import type { TemplateDayCount } from '@/features/vida/utils/vida-template.utils'
import { Tabs } from '@/shared/ui/Tabs'
import styles from './VidaTemplateDayTabs.module.scss'

type VidaTemplateDayTabsProps = {
  value: VidaDayOfWeek
  onChange: (day: VidaDayOfWeek) => void
  /** Lo que cuenta cada pestaña, ya derivado (`countTemplateByDay`). */
  counts: Record<VidaDayOfWeek, TemplateDayCount>
  /** El día de la semana de hoy: se marca, aunque se esté mirando otro. */
  today: VidaDayOfWeek
  /** La agenda del día elegido: va dentro del `tabpanel`, enlazado por `aria-controls`. */
  children: ReactNode
}

/**
 * Las siete pestañas de día de la plantilla (criterios 2 y 3).
 *
 * **No se escriben pestañas a mano**: envuelve `@/shared/ui/Tabs`, que ya trae
 * `role="tablist"`, las flechas ←/→, el `tabIndex` móvil y el panel enlazado
 * por `aria-controls`. Eso es lo que cierra «se puede cambiar con el teclado»
 * del criterio 2 sin código nuevo de accesibilidad.
 *
 * La pestaña activa **se distingue por algo más que el color**: borde y peso
 * (lo pide el criterio 2), así que también se ve en escala de grises.
 *
 * Bajo cada letra, un **punto rayado** si ese día tiene algo y uno apagado si
 * no, con la misma lectura que la tira de Hoy (criterio 3). El punto es
 * decorativo —una diferencia de relleno no se oye— y lo que se oye va en un
 * texto oculto dentro de la propia pestaña, igual que `VidaDayStrip` lo pone
 * en su `aria-label`.
 */
export function VidaTemplateDayTabs({
  value,
  onChange,
  counts,
  today,
  children,
}: VidaTemplateDayTabsProps) {
  return (
    <Tabs value={value} onChange={(next) => onChange(next as VidaDayOfWeek)} className={styles.root}>
      <Tabs.List>
        {VIDA_DAY_ORDER.map((day) => {
          const count = counts[day]
          const label = VIDA_DAY_LABELS[day]
          const spoken = count.hasAny
            ? `${count.count} ${count.count === 1 ? 'cosa' : 'cosas'}`
            : 'nada puesto todavía'

          return (
            <Tabs.Tab key={day} value={day}>
              <span className={styles.tab} data-today={day === today ? 'true' : undefined}>
                <span className={styles.letter} aria-hidden>
                  {VIDA_DAY_SHORT_LABELS[day]}
                </span>
                <span className={styles.count} aria-hidden>
                  {count.count}
                </span>
                <span
                  className={styles.dot}
                  data-state={count.hasAny ? 'some' : 'none'}
                  aria-hidden
                />
                <span className={styles.srOnly}>
                  {label}
                  {day === today ? ', hoy' : ''} · {spoken}
                </span>
              </span>
            </Tabs.Tab>
          )
        })}
      </Tabs.List>
      <Tabs.Panel value={value}>{children}</Tabs.Panel>
    </Tabs>
  )
}
