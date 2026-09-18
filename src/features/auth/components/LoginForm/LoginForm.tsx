import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { AuthForm } from '@/features/auth/components/AuthForm/AuthForm'
import { Button, FormField } from '@/shared/ui'
import { useLoginMutation } from '@/features/auth/hooks/useLoginMutation'
import { authPaths } from '@/features/auth/router/auth-paths'
import { getAuthErrorMessage } from '@/features/auth/utils/auth.errors'
import { validateEmail } from '@/features/auth/utils/field.validation'
import styles from './LoginForm.module.scss'

type LoginLocationState = {
  message?: string
}

const ICON_PROPS = {
  width: 17,
  height: 17,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

function MailIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" />
      <path d="m3.5 7.2 7.3 5.2a2 2 0 0 0 2.4 0l7.3-5.2" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="4.25" y="10.25" width="15.5" height="10" rx="3.5" />
      <path d="M8.25 10.25V7.75a3.75 3.75 0 0 1 7.5 0v2.5" />
    </svg>
  )
}

export function LoginForm() {
  const location = useLocation()
  const locationState = (location.state as LoginLocationState | null) ?? {}
  const loginMutation = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors: Record<string, string | null> = {
      email: validateEmail(email),
      password: password ? null : 'La contraseña es obligatoria.',
    }

    setFieldErrors(errors)

    if (Object.values(errors).some(Boolean)) {
      return
    }

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onError: (error) => {
          setFieldErrors({ form: getAuthErrorMessage(error, 'Credenciales no válidas.') })
        },
      },
    )
  }

  const apiError = loginMutation.isError
    ? getAuthErrorMessage(loginMutation.error, 'Credenciales no válidas.')
    : null

  return (
    <AuthForm
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta de Xavi"
      error={fieldErrors.form ?? apiError}
      success={locationState.message ?? null}
      footer={
        <p>
          ¿No tienes cuenta?{' '}
          <Link className={styles.link} to={authPaths.register}>
            Regístrate
          </Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          id="login-email"
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          leftIcon={<MailIcon />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loginMutation.isPending}
          error={fieldErrors.email}
          required
        />
        <FormField
          id="login-password"
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          leftIcon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loginMutation.isPending}
          error={fieldErrors.password}
          required
        />
        <p className={styles.forgot}>
          <Link className={styles.link} to={authPaths.forgotPassword}>
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <Button type="submit" fullWidth isLoading={loginMutation.isPending}>
          Entrar
        </Button>
      </form>
    </AuthForm>
  )
}
