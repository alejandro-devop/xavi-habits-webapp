import styles from './SuspenseFallback.module.scss'

type SuspenseFallbackProps = {
  label?: string
}

export function SuspenseFallback({ label = 'Cargando contenido…' }: SuspenseFallbackProps) {
  return (
    <div className={styles.fallback} role="status" aria-live="polite" aria-busy="true">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
