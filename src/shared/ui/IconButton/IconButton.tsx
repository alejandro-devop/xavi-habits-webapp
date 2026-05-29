import type { ButtonHTMLAttributes } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './IconButton.module.scss'

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type IconButtonSize = 'sm' | 'md'

type IconButtonProps = {
  icon: string
  variant?: IconButtonVariant
  size?: IconButtonSize
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={[styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ')}
      {...rest}
    >
      <AppIcon name={icon} size="sm" decorative />
    </button>
  )
}
