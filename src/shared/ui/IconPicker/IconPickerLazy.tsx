import { Suspense, lazy } from 'react'
import { Skeleton } from '@/shared/ui/Skeleton'
import type { IconPickerProps } from '@/shared/ui/IconPicker/IconPicker'
import styles from './IconPicker.module.scss'

/**
 * El selector entero —la rejilla, el buscador y las 850 entradas del catálogo—
 * se descarga la primera vez que alguien lo abre, no al arrancar la app. Quien
 * solo mira Mi día no paga por un catálogo que no va a ver.
 *
 * Esto es lo que exporta `@/shared/ui/IconPicker`: quien pone un `IconPicker`
 * en un formulario obtiene la versión diferida sin tener que acordarse.
 */
const IconPickerImpl = lazy(() =>
  import('@/shared/ui/IconPicker/IconPicker').then((module) => ({
    default: module.IconPicker,
  })),
)

/** Un hueco del tamaño del disparador, para que el formulario no dé un salto. */
function IconPickerFallback({ label }: { label?: string }) {
  return (
    <div className={styles.field}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <Skeleton height="3rem" radius="var(--radius-md)" />
    </div>
  )
}

export function IconPicker(props: IconPickerProps) {
  return (
    <Suspense fallback={<IconPickerFallback label={props.label} />}>
      <IconPickerImpl {...props} />
    </Suspense>
  )
}
