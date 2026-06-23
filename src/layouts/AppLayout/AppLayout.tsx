import { useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { RunningActivityWidget } from '@/features/activities/components/RunningActivityWidget'
import { LogoutButton } from '@/features/auth/components/LogoutButton/LogoutButton'
import { useLogoutMutation } from '@/features/auth/hooks/useLogoutMutation'
import { selectAuthUser } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useTheme } from '@/features/theme'
import {
  appSidebarItems,
  createCommandActions,
} from '@/layouts/AppLayout/app-nav.config'
import { Button } from '@/shared/ui/Button'
import { CommandPaletteProvider } from '@/shared/ui/CommandPalette'
import { Drawer } from '@/shared/ui/Drawer'
import { Sidebar } from '@/shared/ui/Sidebar'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { Topbar } from '@/shared/ui/Topbar'
import { AppNavLink } from '@/shared/ui/NavLink'
import styles from './AppLayout.module.scss'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

function readSidebarCollapsedPreference(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    return stored !== null ? stored === 'true' : true
  } catch {
    return true
  }
}

function AppLayoutShell() {
  const navigate = useNavigate()
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

  return (
    <CommandPaletteProvider actions={commandActions}>
      <div className={styles.root}>
        <Sidebar
          brand="Xavi"
          items={appSidebarItems}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          footer={
            <div
              className={[
                styles.sidebarUserArea,
                sidebarCollapsed ? styles.sidebarUserAreaCollapsed : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {!sidebarCollapsed && user ? (
                <span className={styles.userEmail}>{user.email}</span>
              ) : null}
              <LogoutButton />
            </div>
          }
        />

        <div className={styles.mainColumn}>
          <Topbar
            leading={
              <Button
                variant="ghost"
                size="sm"
                className={styles.menuBtn}
                onClick={() => setMobileNavOpen(true)}
                aria-label="Abrir menú"
              >
                ☰
              </Button>
            }
            title="Xavi"
            titleClassName={styles.topbarBrand}
            actions={<ThemeToggle />}
          />
          <main className={styles.main}>
            <Outlet />
          </main>
        </div>

        <RunningActivityWidget />

        <Drawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          side="left"
          title="Menú"
        >
          <nav className={styles.mobileNav}>
            {appSidebarItems.map((item) => (
              <AppNavLink
                key={item.to}
                to={item.to}
                end={item.end}
                icon={item.icon}
                onClick={() => setMobileNavOpen(false)}
              >
                {item.label}
              </AppNavLink>
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
