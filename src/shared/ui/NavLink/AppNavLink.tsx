import type { ReactNode } from 'react'
import { NavLink as RouterNavLink, type NavLinkProps as RouterNavLinkProps } from 'react-router'
import type { AppIconName } from '@/shared/icons'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Tooltip } from '@/shared/ui/Tooltip'
import styles from './AppNavLink.module.scss'

type AppNavLinkProps = RouterNavLinkProps & {
  icon?: AppIconName | string
  collapsed?: boolean
  children: ReactNode
}

export function AppNavLink({
  icon,
  collapsed = false,
  children,
  className,
  ...props
}: AppNavLinkProps) {
  const link = (
    <RouterNavLink
      {...props}
      className={({ isActive }) =>
        [
          styles.link,
          isActive ? styles.active : '',
          collapsed ? styles.collapsed : '',
          typeof className === 'function'
            ? className({ isActive, isPending: false, isTransitioning: false })
            : className,
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      {icon ? <AppIcon name={icon} size="sm" className={styles.icon} /> : null}
      <span className={styles.label}>{children}</span>
    </RouterNavLink>
  )

  if (collapsed) {
    return (
      <Tooltip content={children} placement="right" delay={200}>
        {link}
      </Tooltip>
    )
  }

  return link
}
