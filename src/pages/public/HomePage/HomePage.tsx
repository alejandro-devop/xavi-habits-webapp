import { Link } from 'react-router'
import { authPaths } from '@/features/auth/router/auth-paths'
import styles from './HomePage.module.scss'

export function HomePage() {
  return (
    <section className={styles.hero}>
      <p className={styles.eyebrow}>Hábitos, actividades y cursos</p>
      <h1 className={styles.title}>Xavi</h1>
      <p className={styles.description}>
        Organiza tu día, construye hábitos duraderos y sigue tu progreso en un solo lugar.
      </p>
      <div className={styles.actions}>
        <Link className={styles.primary} to={authPaths.register}>
          Crear cuenta
        </Link>
        <Link className={styles.secondary} to={authPaths.login}>
          Iniciar sesión
        </Link>
      </div>
    </section>
  )
}
