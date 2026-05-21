import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getIconByName, type AppIconName } from '@/shared/icons'
import styles from './AppIcon.module.scss'

export type AppIconSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const SIZE_CLASS: Record<AppIconSize, string> = {
  '2xs': styles.size2xs,
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
  '2xl': styles.size2xl,
}

type AppIconProps = {
  name: AppIconName | string
  size?: AppIconSize
  color?: string
  className?: string
  decorative?: boolean
  label?: string
}

export function AppIcon({
  name,
  size = 'md',
  color,
  className,
  decorative = true,
  label,
}: AppIconProps) {
  const icon = getIconByName(name)
  const sizeClass = SIZE_CLASS[size]
  const rootClass = [styles.root, sizeClass, className].filter(Boolean).join(' ')
  const a11yLabel = decorative ? undefined : (label ?? String(name))

  if (!icon) {
    return (
      <span
        className={[styles.fallback, sizeClass, className].filter(Boolean).join(' ')}
        style={color ? { color } : undefined}
        role={decorative ? undefined : 'img'}
        aria-label={a11yLabel}
        aria-hidden={decorative ? true : undefined}
        title={decorative ? undefined : a11yLabel}
      />
    )
  }

  return (
    <span
      className={rootClass}
      style={color ? { color } : undefined}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={a11yLabel}
    >
      <FontAwesomeIcon icon={icon} />
    </span>
  )
}
