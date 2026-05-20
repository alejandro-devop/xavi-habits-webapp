import styles from './ErrorFallback.module.scss'

type ErrorFallbackProps = {
  error?: Error
  onReset?: () => void
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const handleReset = () => {
    if (onReset) {
      onReset()
      return
    }
    window.location.reload()
  }

  return (
    <div className={styles.fallback} role="alert">
      <h1 className={styles.title}>Algo salió mal</h1>
      <p className={styles.message}>
        Ha ocurrido un error inesperado. Puedes recargar la página e intentarlo de nuevo.
      </p>
      {import.meta.env.DEV && error?.message ? (
        <pre className={styles.details}>{error.message}</pre>
      ) : null}
      <button type="button" className={styles.button} onClick={handleReset}>
        Recargar
      </button>
    </div>
  )
}
