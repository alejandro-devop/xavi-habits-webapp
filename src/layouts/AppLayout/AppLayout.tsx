import { NavLink, Outlet } from 'react-router'
import { LogoutButton } from '@/features/auth/components/LogoutButton/LogoutButton'
import { authPaths } from '@/features/auth/router/auth-paths'
import { selectAuthUser } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import styles from './AppLayout.module.scss'

export function AppLayout() {
  const user = useAuthStore(selectAuthUser)

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.brand}>Xavi</span>
        <nav className={styles.nav} aria-label="Aplicación">
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to={authPaths.today}
            end
          >
            Hoy
          </NavLink>
        </nav>
        <div className={styles.userArea}>
          {user ? <span className={styles.userEmail}>{user.email}</span> : null}
          <LogoutButton />
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
