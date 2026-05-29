import { useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
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

function AppLayoutShell() {
  const navigate = useNavigate()
  const user = useAuthStore(selectAuthUser)
  const { cyclePreference } = useTheme()
  const logoutMutation = useLogoutMutation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
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
            userArea={
              <>
                {user ? <span className={styles.userEmail}>{user.email}</span> : null}
                <LogoutButton />
              </>
            }
          />
          <main className={styles.main}>
            <Outlet />
          </main>
        </div>

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
