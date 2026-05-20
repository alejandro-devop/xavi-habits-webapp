import { Link, Outlet } from 'react-router'
import { authPaths } from '@/features/auth/router/auth-paths'
import styles from './PublicLayout.module.scss'

export function PublicLayout() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link className={styles.brand} to={authPaths.home}>
          Xavi
        </Link>
        <nav className={styles.nav} aria-label="Público">
          <Link className={styles.navLink} to={authPaths.login}>
            Iniciar sesión
          </Link>
          <Link className={[styles.navLink, styles.navCta].join(' ')} to={authPaths.register}>
            Registrarse
          </Link>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
