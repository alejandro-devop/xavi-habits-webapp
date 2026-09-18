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
  /**
   * Encabezado bajo el que se agrupa el enlace. Los elementos sin `group` se
   * pintan sueltos arriba, como antes. Plegado, el encabezado desaparece y el
   * grupo se separa con un filete.
   */
  group?: string
}

type SidebarProps = {
  brand?: ReactNode
  items: SidebarNavItem[]
  footer?: ReactNode
  collapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
  /** Ámbito del design system para el cromo (p. ej. `'aura'`). */
  ds?: string
}

type SidebarGroup = {
  label?: string
  items: SidebarNavItem[]
}

/** Agrupa conservando el orden del config: no reordena ni pierde elementos. */
function groupItems(items: SidebarNavItem[]): SidebarGroup[] {
  const groups: SidebarGroup[] = []

  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.label === item.group) {
      last.items.push(item)
    } else {
      groups.push({ label: item.group, items: [item] })
    }
  }

  return groups
}

export function Sidebar({
  brand,
  items,
  footer,
  collapsed = false,
  onToggleCollapse,
  className,
  ds,
}: SidebarProps) {
  const groups = groupItems(items)

  return (
    <aside
      className={[styles.sidebar, collapsed ? styles.collapsed : '', className]
        .filter(Boolean)
        .join(' ')}
      data-ds={ds}
      aria-label="Navegación principal"
    >
      {brand ? <div className={styles.brand}>{brand}</div> : null}
      <nav className={styles.nav}>
        {groups.map((group, index) => (
          <div
            key={group.label ?? `group-${index}`}
            className={[
              styles.group,
              // El último grupo (Ajustes y compañía) se ancla al pie.
              index === groups.length - 1 && groups.length > 1 ? styles.groupTrailing : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {group.label ? (
              <div className={styles.groupLabel} aria-hidden={collapsed || undefined}>
                {group.label}
              </div>
            ) : null}
            {group.items.map((item) => (
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
          </div>
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
