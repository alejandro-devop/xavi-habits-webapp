import { Link, Outlet, useLocation } from 'react-router'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { AuraRing } from '@/shared/ui'
import { AppNavLink } from '@/shared/ui/NavLink'
import { Popover } from '@/shared/ui/Popover'
import styles from './HabitsModuleLayout.module.scss'

/**
 * Categorías, Medidas y Mi Persona son ajustes del módulo, no destinos de uso
 * diario: van agrupados en una sola píldora para que la barra respire.
 */
const SETTINGS_LINKS = [
  { to: habitsPaths.categories, label: 'Categorías' },
  { to: habitsPaths.measures, label: 'Medidas' },
  { to: habitsPaths.persona, label: 'Mi Persona' },
] as const

function pillClassName({ isActive }: { isActive: boolean }) {
  return [styles.pill, isActive ? styles.pillActive : ''].filter(Boolean).join(' ')
}

export function HabitsModuleLayout() {
  const { pathname } = useLocation()
  const isSettingsActive = SETTINGS_LINKS.some((link) => pathname.startsWith(link.to))

  const settingsTrigger = (
    <span className={pillClassName({ isActive: isSettingsActive })}>Ajustes</span>
  )

  const settingsMenu = (
    <ul className={styles.menu}>
      {SETTINGS_LINKS.map((link) => (
        <li key={link.to}>
          <AppNavLink to={link.to} className={styles.menuItem}>
            {link.label}
          </AppNavLink>
        </li>
      ))}
    </ul>
  )

  return (
    <div className={styles.root} data-ds="aura">
      {/* El lienzo aurora lo monta `AppLayout` una sola vez, detrás de todo:
          pintarlo también aquí superponía dos lienzos. */}
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <Link to={habitsPaths.myDay} className={styles.lockup}>
            <AuraRing size={26} />
            <span className={styles.brand}>Xavi</span>
          </Link>

          <nav className={styles.pills} aria-label="Secciones de hábitos">
            {/* Solo los destinos hacen scroll: el popover de Ajustes no puede
                vivir dentro de un contenedor con overflow o queda recortado. */}
            <div className={styles.pillsScroll}>
              <AppNavLink to={habitsPaths.myDay} className={pillClassName}>
                Mi día
              </AppNavLink>
              <AppNavLink to={habitsPaths.list} className={pillClassName}>
                Mis hábitos
              </AppNavLink>
              <AppNavLink to={habitsPaths.archived} className={pillClassName}>
                Archivados
              </AppNavLink>
            </div>
            <Popover
              triggerLabel="Ajustes de hábitos"
              trigger={settingsTrigger}
              content={settingsMenu}
              placement="bottom-end"
            />
          </nav>
        </div>
      </header>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
