import styles from './PageLoader.module.scss'

type PageLoaderProps = {
  label?: string
}

export function PageLoader({ label = 'Cargando…' }: PageLoaderProps) {
  return (
    <div className={styles.loader} role="status" aria-live="polite" aria-busy="true">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  )
}
