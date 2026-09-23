import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import { VIDA_DAY_LABELS, VIDA_DAY_ORDER } from '@/features/vida/utils/vida-date.utils'
import type { VidaNight } from '@/features/vida/utils/vida-night.utils'
import {
  crossesMidnight,
  formatNightDuration,
  formatNightTime,
  nightDurationMinutes,
} from '@/features/vida/utils/vida-night.utils'
import styles from './VidaNightBand.module.scss'

export type VidaNightBandVariant = 'dawn' | 'dusk'

type VidaNightBandProps = {
  /** `dawn`: la franja de arriba, la noche que **acaba** aquí. `dusk`: la de abajo. */
  variant: VidaNightBandVariant
  night: VidaNight
  /**
   * El día de la semana **en el que se pinta la franja**. Va por día de la
   * semana y no por fecha porque la plantilla no tiene fechas: es una semana
   * tipo. En Hoy se saca con `getVidaDayOfWeek(fecha)`.
   */
  day: VidaDayOfWeek
}

/** El día siguiente, en palabras: «miércoles». */
function nextDayLabel(day: VidaDayOfWeek): string {
  return VIDA_DAY_LABELS[VIDA_DAY_ORDER[(VIDA_DAY_ORDER.indexOf(day) + 1) % 7]!]
}

/**
 * **La noche, como una franja** — arriba y abajo del día, nunca dentro de la
 * lista (criterio 272).
 *
 * Es la primera cosa del módulo que se pinta **sin pasar por `buildDayAgenda`**,
 * y eso es deliberado: dormir no es un bloque, no es un hueco y no es «sin
 * dato». Por eso **no lleva hora en la canaleta, no abre ninguna hoja, no se
 * edita desde aquí y no entra en ningún recuento ni en el presupuesto**
 * (criterios 272, 273 y 284). Quien la monta la pone **fuera** del `<ol>` de la
 * agenda: si estuviera dentro sería una fila, y una fila cuenta.
 *
 * El color sale de los tokens `--aura-night-*` (criterio 274): no es el de
 * ninguna categoría ni el de ningún estado de bloque, y cambia con el tema
 * (criterio 315).
 *
 * Los dos textos son los del render aprobado
 * (`docs/vida/assets/13-vida-dormir.html:174-184`):
 *
 * - **Amanecer:** «Duermes hasta las 5:00 · Vienes de anoche · 6 h». Si la
 *   noche **no cruzó** la medianoche no se viene de anoche: empezó esa misma
 *   madrugada, y la frase lo dice (criterio 276).
 * - **Anochecer:** «23:00 · te acuestas · Duermes 6 h y te levantas el
 *   miércoles a las 5:00».
 *
 * Ni una palabra de reproche y ni una cifra inventada (criterios 316 y 317):
 * sin duración se lee «—», nunca «0 h».
 */
export function VidaNightBand({ variant, night, day }: VidaNightBandProps) {
  const minutes = nightDurationMinutes(night.bedTime, night.wakeTime)
  const duration = formatNightDuration(minutes)
  const crosses = crossesMidnight(night)

  const label =
    variant === 'dawn'
      ? `Duermes hasta las ${formatNightTime(night.wakeTime)}`
      : `${formatNightTime(night.bedTime)} · te acuestas`

  const detail =
    variant === 'dawn'
      ? crosses
        ? `Vienes de anoche · ${duration}`
        : `Empezó esta madrugada, a la ${formatNightTime(night.bedTime)} · ${duration}`
      : crosses
        ? `Duermes ${duration} y te levantas el ${nextDayLabel(day)} a las ${formatNightTime(night.wakeTime)}`
        : `Duermes ${duration} y te levantas a las ${formatNightTime(night.wakeTime)}`

  return (
    <div className={styles.band} data-variant={variant}>
      <span className={styles.mark} aria-hidden>
        {variant === 'dawn' ? '🌅' : '🌙'}
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.detail}>{detail}</span>
    </div>
  )
}
