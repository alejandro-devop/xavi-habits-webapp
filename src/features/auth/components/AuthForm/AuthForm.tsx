import type { ReactNode } from 'react'
import { Alert } from '@/shared/ui'
import styles from './AuthForm.module.scss'

type AuthFormProps = {
  title: string
  subtitle?: string
  error?: string | null
  success?: string | null
  children: ReactNode
  footer?: ReactNode
}

export function AuthForm({ title, subtitle, error, success, children, footer }: AuthFormProps) {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {success ? <Alert variant="success">{success}</Alert> : null}

      {children}

      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </div>
  )
}
