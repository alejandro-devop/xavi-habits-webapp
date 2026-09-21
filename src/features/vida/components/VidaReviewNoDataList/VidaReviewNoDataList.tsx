import type { NoDataSlice } from '@/features/vida/utils/vida-execution.utils'
import styles from './VidaReviewNoDataList.module.scss'

type VidaReviewNoDataListProps = {
  slices: NoDataSlice[]
}

/**
 * **Los tramos más largos sin registrar** (criterios 31 y 32).
 *
 * Cada uno con su franja («10:32 – 13:05») y su tamaño («2h 33»), de mayor a
 * menor. Son los mismos tramos de Hoy, con **el mismo umbral**
 * (`VIDA_NO_DATA_MIN_MINUTES`): aquí no se calcula ninguno.
 *
 * Si la lista viene **vacía**, esto devuelve `null` y no se pinta nada: no se
 * escribe «no hay tramos» ni se rellena con tramos menores (criterio 32). El
 * «¿Qué pasó?» y el «Dejarlo así» de cada tramo son de la tajada 3 — aquí no se
 * pinta ningún botón muerto.
 */
export function VidaReviewNoDataList({ slices }: VidaReviewNoDataListProps) {
  if (slices.length === 0) return null
  return (
    <ol className={styles.list}>
      {slices.map((slice) => (
        <li className={styles.row} key={slice.id}>
          <span className={styles.range}>{slice.rangeLabel}</span>
          <span className={styles.duration}>{slice.durationLabel}</span>
        </li>
      ))}
    </ol>
  )
}
