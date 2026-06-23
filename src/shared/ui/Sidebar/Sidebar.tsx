import type { ReactNode } from 'react'
import type { AppIconName } from '@/shared/icons'
import { AppIcon } from '@/shared/ui/AppIcon'
import { AppNavLink } from '@/shared/ui/NavLink'
import styles from './Sidebar.module.scss'

export type SidebarNavItem = {
  to: string
  label: string
  icon?: AppIconName | string
  end?: boolean
}

type SidebarProps = {
  brand?: ReactNode
  items: SidebarNavItem[]
  footer?: ReactNode
  collapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

export function Sidebar({
  brand,
  items,
  footer,
  collapsed = false,
  onToggleCollapse,
  className,
}: SidebarProps) {
  return (
    <aside
      className={[styles.sidebar, collapsed ? styles.collapsed : '', className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Navegación principal"
    >
      {brand ? <div className={styles.brand}>{brand}</div> : null}
      <nav className={styles.nav}>
        {items.map((item) => (
          <AppNavLink
            key={item.to}
            to={item.to}
            end={item.end}
            icon={item.icon}
            collapsed={collapsed}
          >
            {item.label}
          </AppNavLink>
        ))}
      </nav>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
      {onToggleCollapse ? (
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? (
            <AppIcon name="chevron-right" size="xs" decorative />
          ) : (
            <AppIcon name="arrow-left" size="xs" decorative />
          )}
        </button>
      ) : null}
    </aside>
  )
}
