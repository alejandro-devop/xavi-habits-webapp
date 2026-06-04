import { Outlet } from 'react-router'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { PageHeader } from '@/shared/ui/PageHeader'
import { AppNavLink } from '@/shared/ui/NavLink'
import styles from './HabitsModuleLayout.module.scss'

export function HabitsModuleLayout() {
  return (
    <div className={styles.root}>
      <PageHeader
        title="Hábitos"
        subtitle="Registra y sigue tus hábitos diarios."
      />
      <nav className={styles.nav} aria-label="Secciones de hábitos">
        <AppNavLink to={habitsPaths.myDay} icon="sun">
          Mi Día
        </AppNavLink>
        <AppNavLink to={habitsPaths.list} icon="list">
          Mis Hábitos
        </AppNavLink>
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
