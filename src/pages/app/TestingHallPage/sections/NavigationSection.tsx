import { useState } from 'react'
import { authPaths } from '@/features/auth/router/auth-paths'
import { AppNavLink, Breadcrumbs, Section, Sidebar, Tabs, ThemeToggle, Topbar } from '@/shared/ui'
import styles from '../TestingHallPage.module.scss'

export function NavigationSection() {
  const [tab, setTab] = useState('overview')

  return (
    <Section id="navigation" title="Navigation" description="Shell, tabs, breadcrumbs y nav links">
      <div className={styles.navPreview}>
        <Sidebar
          brand="Demo"
          items={[
            { to: authPaths.today, label: 'Hoy', icon: 'home', end: true },
            { to: authPaths.testingHall, label: 'Testing Hall', icon: 'search' },
          ]}
        />
        <div className={styles.navPreviewMain}>
          <Topbar
            breadcrumbs={[
              { label: 'App', to: authPaths.today },
              { label: 'Testing Hall' },
            ]}
            actions={<ThemeToggle />}
            userArea={<span className={styles.navPreviewUser}>usuario@demo.com</span>}
          />
          <div className={styles.navPreviewBody}>
            <AppNavLink to={authPaths.today} icon="home" end>
              Hoy
            </AppNavLink>
            <AppNavLink to={authPaths.testingHall} icon="search">
              Testing Hall
            </AppNavLink>
          </div>
        </div>
      </div>

      <Breadcrumbs
        items={[
          { label: 'App', to: '/app/today' },
          { label: 'Sección', to: '/app/testinghall' },
          { label: 'Navigation' },
        ]}
      />

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="overview">Resumen</Tabs.Tab>
          <Tabs.Tab value="details">Detalles</Tabs.Tab>
          <Tabs.Tab value="settings">Ajustes</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview">
          <p>Panel de resumen — usa ← → para cambiar de pestaña.</p>
        </Tabs.Panel>
        <Tabs.Panel value="details">
          <p>Panel de detalles.</p>
        </Tabs.Panel>
        <Tabs.Panel value="settings">
          <p>Panel de ajustes.</p>
        </Tabs.Panel>
      </Tabs>
    </Section>
  )
}
