import { Link } from 'react-router'
import styles from './NotFoundPage.module.scss'

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.code}>404</h1>
      <p className={styles.message}>Página no encontrada</p>
      <Link className={styles.link} to="/">
        Volver al inicio
      </Link>
    </section>
  )
}
