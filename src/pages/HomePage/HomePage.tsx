import { useExampleQuery } from '@/features/example/hooks/useExampleQuery'
import { useExampleStore } from '@/features/example/store/example.store'
import styles from './HomePage.module.scss'

export function HomePage() {
  const { count, increment, reset } = useExampleStore()
  const { data, isPending, isError } = useExampleQuery()

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Xavi Habits</h1>
      <p>SPA inicializada con Vite, React Router, Zustand y React Query.</p>

      <section className={styles.section} aria-label="Zustand persist">
        <span className={styles.label}>Zustand (persist): {count}</span>
        <div className={styles.actions}>
          <button type="button" onClick={increment}>
            Incrementar
          </button>
          <button type="button" onClick={reset}>
            Reset
          </button>
        </div>
      </section>

      <section className={styles.section} aria-label="React Query persist">
        <span className={styles.label}>
          React Query (persist):{' '}
          {isPending && 'Cargando…'}
          {isError && 'Error'}
          {data?.message}
        </span>
      </section>
    </main>
  )
}
