import styles from './Spinner.module.scss'

type SpinnerProps = {
  size?: 'sm' | 'md'
  className?: string
  label?: string
  /** Hide from accessibility tree when nested in a labeled control */
  decorative?: boolean
}

export function Spinner({
  size = 'md',
  className,
  label = 'Cargando',
  decorative = false,
}: SpinnerProps) {
  return (
    <span
      className={[styles.spinner, styles[size], className].filter(Boolean).join(' ')}
      role={decorative ? undefined : 'status'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
    />
  )
}
