import { Fragment, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { RunningActivityWidget } from '@/features/activities/components/RunningActivityWidget'
import { LogoutButton } from '@/features/auth/components/LogoutButton/LogoutButton'
import { SessionExpiredModal } from '@/features/auth/components/SessionExpiredModal'
import { useLogoutMutation } from '@/features/auth/hooks/useLogoutMutation'
import { selectAuthUser } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useTheme } from '@/features/theme'
import { resolveBreadcrumbs } from '@/layouts/AppLayout/app-breadcrumbs'
import {
  appSidebarItems,
  createCommandActions,
} from '@/layouts/AppLayout/app-nav.config'
import { AppIcon } from '@/shared/ui/AppIcon'
import { AuraRing } from '@/shared/ui/AuraRing'
import { AuroraCanvas } from '@/shared/ui/AuroraCanvas'
import { Button } from '@/shared/ui/Button'
import { CommandPaletteProvider, useCommandPalette } from '@/shared/ui/CommandPalette'
import { ConnectionIndicator } from '@/shared/ui/ConnectionIndicator'
import { RetryNotice } from '@/shared/ui/RetryNotice'
import { Drawer } from '@/shared/ui/Drawer'
import { Sidebar } from '@/shared/ui/Sidebar'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { Topbar } from '@/shared/ui/Topbar'
import { AppNavLink } from '@/shared/ui/NavLink'
import styles from './AppLayout.module.scss'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

/**
 * El ámbito Aura vive en el cromo (lateral, barra superior, portales), no en el
 * contenedor del `<Outlet />`: los módulos sin migrar mezclan tokens con valores
 * a pelo y heredarlos los dejaría peor que ahora.
 */
const CHROME_DS = 'aura'

function readSidebarCollapsedPreference(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    return stored !== null ? stored === 'true' : true
  } catch {
    return true
  }
}

/** Píldora de la barra superior que abre la paleta de comandos. */
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
      <span className={styles.cmdLabel}>Buscar o ir a…</span>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsedPreference)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }

  const commandActions = useMemo(
    () =>
      createCommandActions({
        navigate: (path) => navigate(path),
        cycleTheme: cyclePreference,
        logout: () => logoutMutation.mutate(),
      }),
    [navigate, cyclePreference, logoutMutation],
  )

  const breadcrumbs = useMemo(() => resolveBreadcrumbs(pathname), [pathname])
  const userInitial = user?.email?.trim().charAt(0).toUpperCase() ?? '·'

  return (
    <CommandPaletteProvider actions={commandActions} ds={CHROME_DS}>
      <div className={styles.root}>
        <AuroraCanvas ds={CHROME_DS} className={styles.aurora} />

        <Sidebar
          ds={CHROME_DS}
          brand={
            <span className={styles.lockup}>
              <AuraRing size={24} />
              {!sidebarCollapsed ? <span className={styles.lockupText}>Xavi</span> : null}
            </span>
          }
          items={appSidebarItems}
          collapsed={sidebarCollapsed}
          footer={
            <div
              className={[
                styles.sidebarUserArea,
                sidebarCollapsed ? styles.sidebarUserAreaCollapsed : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.avatar} aria-hidden>
                {userInitial}
              </span>
              {!sidebarCollapsed && user ? (
                <span className={styles.userEmail}>{user.email}</span>
              ) : null}
              <LogoutButton />
            </div>
          }
        />

        <div className={styles.mainColumn}>
          <Topbar
            ds={CHROME_DS}
            leading={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.menuBtn}
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Abrir menú"
                >
                  ☰
                </Button>
                <button
                  type="button"
                  className={styles.collapseBtn}
                  onClick={toggleSidebarCollapse}
                  aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                >
                  <AppIcon name={sidebarCollapsed ? 'chevron-right' : 'arrow-left'} size="xs" decorative />
                </button>
              </>
            }
            breadcrumbs={breadcrumbs}
            breadcrumbsClassName={styles.topbarCrumbs}
            title="Xavi"
            titleClassName={styles.topbarBrand}
            actions={
              <div className={styles.topbarActions}>
                <CommandPaletteTrigger />
                <ConnectionIndicator />
                <ThemeToggle />
              </div>
            }
          />
          <main className={styles.main}>
            <Outlet />
          </main>
        </div>

        <RunningActivityWidget />

        <RetryNotice />
        <SessionExpiredModal />

        <Drawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          side="left"
          ds={CHROME_DS}
          title="Menú"
        >
          <nav className={styles.mobileNav}>
            {appSidebarItems.map((item, index) => (
              <Fragment key={item.to}>
                {item.group !== appSidebarItems[index - 1]?.group ? (
                  <span className={styles.mobileNavGroup}>{item.group}</span>
                ) : null}
                <AppNavLink
                  to={item.to}
                  end={item.end}
                  icon={item.icon}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {item.label}
                </AppNavLink>
              </Fragment>
            ))}
          </nav>
        </Drawer>
      </div>
    </CommandPaletteProvider>
  )
}

export function AppLayout() {
  return <AppLayoutShell />
}
