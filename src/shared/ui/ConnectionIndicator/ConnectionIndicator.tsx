import { useConnectionStatus } from '@/shared/hooks/useConnectionStatus'
import type { ConnectionStatus } from '@/shared/hooks/useConnectionStatus'
import styles from './ConnectionIndicator.module.scss'

type Presentation = {
  label: string
  /** Explicación completa; la etiqueta visible se mantiene corta por el móvil. */
  detail: string
  className: string
}

const PRESENTATION: Record<Exclude<ConnectionStatus, 'ok'>, Presentation> = {
  offline: {
    label: 'Sin conexión',
    detail: 'Sin conexión. Se muestran los datos guardados en este dispositivo.',
    className: 'offline',
  },
  stale: {
    label: 'Datos guardados',
    detail:
      'No se pudieron actualizar los datos. Lo que ves es la última copia guardada en este dispositivo.',
    className: 'stale',
  },
  syncing: {
    label: 'Actualizando…',
    detail: 'Reintentando la conexión. Mientras tanto se muestran los datos guardados.',
    className: 'syncing',
  },
}

/**
 * Distingue "esto es caché" de "esto está fresco". Sin esto, cuando el backend
 * está dormido la app se ve normal pero muestra datos viejos, sin ninguna señal.
 */
export function ConnectionIndicator() {
  const status = useConnectionStatus()

  if (status === 'ok') return null

  const { label, detail, className } = PRESENTATION[status]

  return (
    <span
      role="status"
      aria-live="polite"
      className={[styles.pill, styles[className]].join(' ')}
      title={detail}
    >
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>{label}</span>
      <span className={styles.srOnly}>{detail}</span>
    </span>
  )
}
