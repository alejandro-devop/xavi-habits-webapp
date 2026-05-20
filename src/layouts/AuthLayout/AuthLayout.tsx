import { Link, Outlet } from 'react-router'
import { authPaths } from '@/features/auth/router/auth-paths'
import styles from './AuthLayout.module.scss'

export function AuthLayout() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link className={styles.brand} to={authPaths.home}>
          Xavi
        </Link>
      </header>
      <main className={styles.main}>
        <div className={styles.card}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
