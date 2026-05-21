import styles from './Divider.module.scss'

type DividerProps = {
  orientation?: 'horizontal' | 'vertical'
  label?: string
  variant?: 'default' | 'subtle'
}

export function Divider({ orientation = 'horizontal', label, variant = 'default' }: DividerProps) {
  if (label && orientation === 'horizontal') {
    return (
      <div className={styles.withLabel} role="separator" aria-orientation="horizontal">
        <span>{label}</span>
      </div>
    )
  }

  const classNames = [styles.divider, styles[orientation], variant === 'subtle' ? styles.subtle : '']
    .filter(Boolean)
    .join(' ')

  return <hr className={classNames} role="separator" aria-orientation={orientation} />
}
