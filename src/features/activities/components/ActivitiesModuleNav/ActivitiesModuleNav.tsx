import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { AppNavLink } from '@/shared/ui/NavLink'
import styles from './ActivitiesModuleNav.module.scss'

export function ActivitiesModuleNav() {
  return (
    <nav className={styles.nav} aria-label="Secciones de actividades">
      <AppNavLink to={activitiesPaths.root} end icon="list-check">
        Actividades
      </AppNavLink>
      <AppNavLink to={activitiesPaths.categories} icon="gear">
        Categorías
      </AppNavLink>
      <AppNavLink to={activitiesPaths.tracking} icon="clock">
        Seguimiento
      </AppNavLink>
    </nav>
  )
}
