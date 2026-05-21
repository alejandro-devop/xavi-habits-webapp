import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getIconByName, type AppIconName } from '@/shared/icons'
import styles from './AppIcon.module.scss'

export type AppIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASS: Record<AppIconSize, string> = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
}

type AppIconProps = {
  name: AppIconName | string
  size?: AppIconSize
  className?: string
  decorative?: boolean
  label?: string
}

export function AppIcon({
  name,
  size = 'md',
  className,
  decorative = true,
  label,
}: AppIconProps) {
  const icon = getIconByName(name)
  const sizeClass = SIZE_CLASS[size]
  const rootClass = [styles.root, sizeClass, className].filter(Boolean).join(' ')

  if (!icon) {
    return (
      <span
        className={[styles.fallback, sizeClass, className].filter(Boolean).join(' ')}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : (label ?? name)}
        aria-hidden={decorative ? true : undefined}
      />
    )
  }

  return (
    <span
      className={rootClass}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : (label ?? name)}
    >
      <FontAwesomeIcon icon={icon} />
    </span>
  )
}
