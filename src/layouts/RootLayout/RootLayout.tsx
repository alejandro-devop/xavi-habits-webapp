import { Outlet } from 'react-router'
import { env } from '@/app/config/env'
import styles from './RootLayout.module.scss'

export function RootLayout() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.brand}>{env.appName}</span>
        <nav className={styles.nav} aria-label="Principal">
          {/* Navegación futura */}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
