import { NavLink } from 'react-router'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import styles from './ActivitiesModuleNav.module.scss'

export function ActivitiesModuleNav() {
  return (
    <nav className={styles.nav} aria-label="Secciones de actividades">
      <NavLink
        to={activitiesPaths.list}
        className={({ isActive }) =>
          [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')
        }
      >
        Actividades
      </NavLink>
      <NavLink
        to={activitiesPaths.categories}
        className={({ isActive }) =>
          [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')
        }
      >
        Categorías
      </NavLink>
      <NavLink
        to={activitiesPaths.tracking}
        className={({ isActive }) =>
          [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')
        }
      >
        Seguimiento
      </NavLink>
    </nav>
  )
}
