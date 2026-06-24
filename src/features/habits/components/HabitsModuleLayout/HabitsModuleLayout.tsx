import { Outlet } from 'react-router'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { AppNavLink } from '@/shared/ui/NavLink'
import styles from './HabitsModuleLayout.module.scss'

function habitsNavLinkClassName({ isActive }: { isActive: boolean }) {
  return [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
}

export function HabitsModuleLayout() {
  return (
    <div className={styles.root}>
      <nav className={styles.nav} aria-label="Secciones de hábitos">
        <AppNavLink to={habitsPaths.myDay} icon="sun" className={habitsNavLinkClassName}>
          Mi Día
        </AppNavLink>
        <AppNavLink to={habitsPaths.list} icon="list" className={habitsNavLinkClassName}>
          Mis Hábitos
        </AppNavLink>
        <AppNavLink to={habitsPaths.categories} icon="tag" className={habitsNavLinkClassName}>
          Categorías
        </AppNavLink>
        <AppNavLink to={habitsPaths.persona} icon="user" className={habitsNavLinkClassName}>
          Mi Persona
        </AppNavLink>
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
