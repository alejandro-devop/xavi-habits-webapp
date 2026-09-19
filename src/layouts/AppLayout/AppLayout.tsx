import { useEffect, useMemo } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { SessionExpiredModal } from '@/features/auth/components/SessionExpiredModal'
import { useLogoutMutation } from '@/features/auth/hooks/useLogoutMutation'
import { selectAuthUser } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { settingsPaths } from '@/features/settings'
import { useTheme } from '@/features/theme'
import {
  appModules,
  createCommandActions,
  findActiveModule,
} from '@/layouts/AppLayout/app-nav.config'
import { loadIconCatalog } from '@/shared/icons'
import { AppIcon } from '@/shared/ui/AppIcon'
import { AuraRing } from '@/shared/ui/AuraRing'
import { AuroraCanvas } from '@/shared/ui/AuroraCanvas'
import { CommandPaletteProvider, useCommandPalette } from '@/shared/ui/CommandPalette'
import { ConnectionIndicator } from '@/shared/ui/ConnectionIndicator'
import { AppNavLink } from '@/shared/ui/NavLink'
import { Popover } from '@/shared/ui/Popover'
import { RetryNotice } from '@/shared/ui/RetryNotice'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import styles from './AppLayout.module.scss'

/**
 * El ámbito Aura vive en el cromo y en las páginas de hábitos. `features/settings`
 * todavía no está migrado: re-mapearle los tokens lo dejaría peor que ahora.
 */
const CHROME_DS = 'aura'

function pillClassName({ isActive }: { isActive: boolean }) {
  return [styles.pill, isActive ? styles.pillActive : ''].filter(Boolean).join(' ')
}

/**
 * La píldora de módulo no se enciende por coincidencia de URL —apunta a la
 * portada del módulo, no a la sección en la que estás—, sino por el módulo
 * activo.
 */
function modClassName(isActive: boolean) {
  return [styles.mod, isActive ? styles.modActive : ''].filter(Boolean).join(' ')
}

/** Píldora de la barra que abre la paleta de comandos. */
function CommandPaletteTrigger() {
  const { open } = useCommandPalette()

  return (
    <button
      type="button"
      className={styles.cmdTrigger}
      onClick={open}
      aria-label="Buscar o ir a una sección"
    >
      <AppIcon name="search" size="sm" decorative />
      <span className={styles.cmdLabel}>Buscar</span>
      <kbd className={styles.cmdKbd} aria-hidden>
        ⌘K
      </kbd>
    </button>
  )
}

function AppLayoutShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore(selectAuthUser)
  const { cyclePreference } = useTheme()
  const logoutMutation = useLogoutMutation()

  // El catálogo de iconos viaja en su propio trozo. Se pide en cuanto la
  // sesión entra —sin bloquear nada—, para que los iconos de los hábitos estén
  // listos cuando llegue su respuesta y no aparezcan con un parpadeo.
  useEffect(() => {
    void loadIconCatalog()
  }, [])

  const commandActions = useMemo(
    () =>
      createCommandActions({
        navigate: (path) => navigate(path),
        cycleTheme: cyclePreference,
        logout: () => logoutMutation.mutate(),
      }),
    [navigate, cyclePreference, logoutMutation],
  )

  const userInitial = user?.email?.trim().charAt(0).toUpperCase() ?? '·'
  const activeModule = findActiveModule(pathname)
  const moduleSettings = activeModule.settings ?? []
  const isSettingsActive = moduleSettings.some((link) => pathname.startsWith(link.to))
  const contentDs = pathname.startsWith(settingsPaths.root) ? undefined : CHROME_DS

  const settingsMenu = (
    <ul className={styles.menu}>
      {moduleSettings.map((link) => (
        <li key={link.to}>
          <AppNavLink to={link.to} className={styles.menuItem}>
            {link.label}
          </AppNavLink>
        </li>
      ))}
    </ul>
  )

  const userMenu = (
    <div className={styles.userMenu}>
      <span className={styles.userMenuName}>{user?.email ?? 'Tu cuenta'}</span>
      <ul className={styles.menu}>
        <li>
          <AppNavLink to={settingsPaths.root} className={styles.menuItem}>
            Ajustes de cuenta
          </AppNavLink>
        </li>
        <li>
          <button
            type="button"
            className={styles.menuButton}
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            Cerrar sesión
          </button>
        </li>
      </ul>
    </div>
  )

  return (
    <CommandPaletteProvider actions={commandActions} ds={CHROME_DS}>
      <div className={styles.root}>
        <AuroraCanvas ds={CHROME_DS} className={styles.aurora} />

        <header className={styles.bar} data-ds={CHROME_DS}>
          <div className={styles.barInner}>
            <Link to={activeModule.home} className={styles.lockup}>
              <AuraRing size={26} />
              <span className={styles.brand}>Xavi</span>
            </Link>

            <nav className={styles.mods} aria-label="Módulos">
              {appModules.map((module) => (
                <AppNavLink
                  key={module.id}
                  to={module.home}
                  className={modClassName(module.id === activeModule.id)}
                >
                  {module.label}
                </AppNavLink>
              ))}
            </nav>

            <nav className={styles.pills} aria-label="Secciones">
              {/* Solo los destinos hacen scroll: el popover de Ajustes no puede
                  vivir dentro de un contenedor con overflow o queda recortado. */}
              <div className={styles.pillsScroll}>
                {activeModule.sections.map((section) => (
                  <AppNavLink key={section.id} to={section.to} className={pillClassName}>
                    {section.label}
                  </AppNavLink>
                ))}
              </div>
              {moduleSettings.length > 0 ? (
                <Popover
                  triggerLabel={`Ajustes de ${activeModule.label.toLowerCase()}`}
                  trigger={
                    <span className={pillClassName({ isActive: isSettingsActive })}>
                      Ajustes
                    </span>
                  }
                  content={settingsMenu}
                  placement="bottom-end"
                />
              ) : null}
            </nav>

            <div className={styles.barActions}>
              <CommandPaletteTrigger />
              <ConnectionIndicator />
              <ThemeToggle />
              <Popover
                triggerLabel="Tu cuenta"
                trigger={
                  <span className={styles.avatar} aria-hidden>
                    {userInitial}
                  </span>
                }
                content={userMenu}
                placement="bottom-end"
              />
            </div>
          </div>
        </header>

        <main className={styles.content} data-ds={contentDs}>
          <Outlet />
        </main>

        <RetryNotice />
        <SessionExpiredModal />
      </div>
    </CommandPaletteProvider>
  )
}

export function AppLayout() {
  return <AppLayoutShell />
}
